"""Run Aeon's evals as Langfuse experiments, so every prompt or model change is compared run against run.

    python -m app.evals.run label-check        # does the label check catch contradictions, without false alarms?
    python -m app.evals.run premlr             # does the pre-MLR checklist fail what it should, and pass clean copy?
    python -m app.evals.run fix-loop --report <report_id>   # does the fix agent reach "ready" within its rounds?

Results are pass/fail per case (Langfuse BOOLEAN scores) plus run-level counts. Costs: label-check ~12 Claude calls,
premlr ~5, fix-loop ~$0.4 per fix. Run from a plain shell (Langfuse runs tasks on its own event loop)."""

import argparse
import json
from pathlib import Path

from langfuse import Evaluation
from sqlmodel import Session

from app import llm
from app.config import settings
from app.db import engine, init_db
from app.evals.cases import LABEL_CHECK, PREMLR
from app.jobs import LocalJob
from app.models import Product, Report
from app.observability import init_tracing, langfuse, shutdown
from app.schemas import AccuracyCheck
from app.services import openfda, premlr
from app.services.checks import label_text
from app.services.scan import ACCURACY_SYSTEM

LABEL = openfda.parse_label(json.loads((Path(__file__).parents[2] / "tests/data/opzelura_label.json").read_text()))["label"]


def _upsert(name: str, description: str, items: list[tuple[str, dict, dict, dict]]) -> None:
    lf = langfuse()
    lf.create_dataset(name=name, description=description, metadata={"reviewed_by_medical": "no"})
    for item_id, inp, expected, meta in items:
        lf.create_dataset_item(dataset_name=name, id=f"{name}-{item_id}", input=inp, expected_output=expected,
                               metadata=meta)


def _counts(name: str):
    def run_eval(*, item_results, **_):
        passed = sum(bool(e.value) for r in item_results for e in r.evaluations if e.name == name)
        return Evaluation(name=f"{name}_count", value=passed, data_type="NUMERIC",
                          comment=f"{passed} of {len(item_results)} cases pass")
    return run_eval


# ---- label check ---------------------------------------------------------------

async def label_task(*, item, **_):
    system = llm.cached(ACCURACY_SYSTEM, f"Our drug: Opzelura (ruxolitinib)\n\nFDA LABEL:\n{label_text(LABEL)}")
    check = await llm.smart(system, f"AI ANSWER:\n{item.input['answer']}", AccuracyCheck, effort=settings.accuracy_effort)
    return {"contradicts": bool(check.issues), "types": sorted({i.type for i in check.issues})}


def label_correct(*, output, expected_output, **_):
    return Evaluation(name="correct", value=output["contradicts"] == expected_output["contradicts"], data_type="BOOLEAN")


def label_no_false_alarm(*, output, expected_output, **_):
    return Evaluation(name="no_false_alarm", value=not (output["contradicts"] and not expected_output["contradicts"]),
                      data_type="BOOLEAN")


# ---- pre-MLR checklist ------------------------------------------------------------

async def premlr_task(*, item, **_):
    result = await premlr.review(item.input["content"], item.input["claims"], LABEL, "Opzelura")
    return {"status": result["status"], "failed": [c["id"] for c in result["checks"] if not c["passed"]]}


def premlr_catches(*, output, expected_output, **_):
    return Evaluation(name="catches", value=set(expected_output["must_fail"]) <= set(output["failed"]),
                      data_type="BOOLEAN")


def premlr_clean_passes(*, output, expected_output, **_):
    ok = bool(output["failed"]) if expected_output["must_fail"] else not output["failed"]
    return Evaluation(name="clean_passes", value=ok, data_type="BOOLEAN",
                      comment="clean case must pass every check" if not expected_output["must_fail"] else "n/a")


# ---- fix loop -----------------------------------------------------------------

def fix_task_for(report_id: str):
    async def task(*, item, **_):
        from app.agents.fix import draft_with_review

        with Session(engine) as s:
            report = s.get(Report, report_id)
            product = s.get(Product, report.payload["product"]["id"])
            s.expunge_all()
        draft = await draft_with_review(LocalJob("eval"), product, item.input, fix_key=f"eval-{item.input['key']}")
        return {"status": draft.premlr["status"], "rounds": len(draft.rounds)}
    return task


def fix_ready(*, output, **_):
    return Evaluation(name="ready", value=output["status"] == "ready", data_type="BOOLEAN",
                      comment=f"{output['rounds']} round(s)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("suite", choices=["label-check", "premlr", "fix-loop"])
    ap.add_argument("--report", help="report id whose fixes to run (fix-loop)")
    ap.add_argument("--run-name", default=None)
    args = ap.parse_args()
    if not settings.langfuse_enabled:
        raise SystemExit("Set LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY in backend/.env")
    init_tracing()
    init_db()
    lf = langfuse()

    if args.suite == "label-check":
        _upsert("aeon-label-check", "Does the label check flag statements that contradict the FDA label?",
                [(c["id"], {"answer": c["answer"]}, {"contradicts": c["contradicts"]}, {"why": c["why"]}) for c in LABEL_CHECK])
        task, evaluators, run_evals = label_task, [label_correct, label_no_false_alarm], [_counts("correct")]
    elif args.suite == "premlr":
        _upsert("aeon-premlr", "Does the pre-MLR checklist fail what it should and pass clean copy?",
                [(c["id"], {"content": c["content"], "claims": c["claims"]}, {"must_fail": c["must_fail"]}, {}) for c in PREMLR])
        task, evaluators, run_evals = premlr_task, [premlr_catches, premlr_clean_passes], [_counts("catches")]
    else:
        if not args.report:
            raise SystemExit("--report <report_id> is required for fix-loop")
        with Session(engine) as s:
            fixes = s.get(Report, args.report).payload["fixes"]
        _upsert("aeon-fix-loop", "Does the fix agent reach 'ready for MLR review' within its rounds?",
                [(f["key"], f, {"status": "ready"}, {"report_id": args.report}) for f in fixes])
        task, evaluators, run_evals = fix_task_for(args.report), [fix_ready], [_counts("ready")]

    dataset = lf.get_dataset({"label-check": "aeon-label-check", "premlr": "aeon-premlr", "fix-loop": "aeon-fix-loop"}[args.suite])
    result = dataset.run_experiment(name=f"aeon-{args.suite}", run_name=args.run_name,
                                    description=f"models: smart={settings.model_smart} fast={settings.model_fast}",
                                    task=task, evaluators=evaluators, run_evaluators=run_evals, max_concurrency=4,
                                    metadata={"model_smart": settings.model_smart, "effort": settings.accuracy_effort})
    print(result.format(include_item_results=True))
    print("Langfuse:", result.dataset_run_url)
    shutdown()


if __name__ == "__main__":
    main()
