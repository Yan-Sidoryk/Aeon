from app.models import Answer, Product, Prompt
from app.services import premlr
from app.services.openfda import dedupe_latest
from app.services.report import build_payload, fallback_fixes


def test_parse_label(opzelura):
    assert opzelura["brand"] == "Opzelura"
    assert opzelura["molecule"] == "ruxolitinib"
    assert opzelura["tier"] == "Rx"
    assert opzelura["label"]["boxed_warning"].startswith("WARNING")
    assert "atopic dermatitis" in opzelura["label"]["indications"].lower()


def test_dedupe_keeps_latest():
    old = {"brand": "Monjuvi", "molecule": "x", "effective_time": "20250101"}
    new = {**old, "effective_time": "20260101"}
    assert dedupe_latest([old, new, {**old, "brand": ""}]) == [new]


def test_dedupe_merges_a_brands_labels():
    """Zoryve cream and Zoryve foam are two labels: checks must know both."""
    cream = {"brand": "Zoryve", "molecule": "roflumilast", "manufacturer": "Arcutis", "set_id": "c",
             "effective_time": "20260720", "label": {"indications": "cream: plaque psoriasis, age 6+", "boxed_warning": ""}}
    foam = {**cream, "set_id": "f", "effective_time": "20260902",
            "label": {"indications": "foam: seborrheic dermatitis, age 9+", "boxed_warning": ""}}
    [merged] = dedupe_latest([cream, foam])
    assert merged["set_id"] == "f"
    assert "cream" in merged["label"]["indications"] and "foam" in merged["label"]["indications"]


def test_premlr_flags_bad_copy(opzelura):
    bad = "Opzelura is the best cream and completely safe. It cures eczema. 75% of patients improved."
    flags = premlr.rule_flags(bad, [{"text": "made up", "label_quote": "not in the label at all"}], opzelura["label"])
    rules = {f["rule"] for f in flags}
    assert {"overstatement", "missing_isi", "unsupported_claim"} <= rules
    assert sum(f["rule"] == "overstatement" for f in flags) >= 4  # best, safe, cures, unqualified %


def test_premlr_passes_clean_copy(opzelura):
    quote = opzelura["label"]["indications"][40:160]
    good = (
        "Opzelura is a prescription cream used for mild to moderate atopic dermatitis.\n"
        "In clinical studies, 53% of patients had clear or almost clear skin at week 8.\n"
        "## Important Safety Information\n"
        "WARNING: SERIOUS INFECTIONS, MORTALITY, MALIGNANCY. Serious side effects may occur. "
        "Tell your doctor about any infection."
    )
    flags = premlr.rule_flags(good, [{"text": "x", "label_quote": quote}], opzelura["label"])
    assert [f for f in flags if f["severity"] == "high"] == []


def _answer(prompt_id, engine="claude", sample=0, **kw):
    return Answer(scan_id=1, prompt_id=prompt_id, engine=engine, sample=sample, **kw)


def test_cell_is_a_majority_vote():
    from app.services.checks import aggregate_cell

    two_of_three = [_answer(1, mentioned=True, position=2), _answer(1, sample=1, mentioned=True, position=4),
                    _answer(1, sample=2, competitors_mentioned=["Dupixent"])]
    cell = aggregate_cell(two_of_three)
    assert cell["state"] == "you" and cell["votes"] == "2/3" and cell["position"] == 3
    one_of_three = [_answer(1, mentioned=True), _answer(1, sample=1, competitors_mentioned=["Dupixent"]),
                    _answer(1, sample=2, competitors_mentioned=["Dupixent"])]
    cell = aggregate_cell(one_of_three)
    assert cell["state"] == "competitor" and cell["competitors_mentioned"] == ["Dupixent"]
    assert aggregate_cell([_answer(1, engine="google_aio", shown=False)])["state"] == "not_shown"
    assert aggregate_cell([_answer(1, error="boom")])["state"] == "error"


def test_report_counts_checks_not_scores():
    from app.models import Company

    product = Product(id=1, company_id=1, brand="Opzelura", molecule="ruxolitinib")
    company = Company(id=1, org_id=1, domain="incyte.com", name="Incyte")
    prompts = [Prompt(id=i, product_id=1, text=f"q{i}", lane="unbranded") for i in (1, 2, 3)]
    prompts.append(Prompt(id=4, product_id=1, text="how is opzelura applied", lane="branded"))
    cite = lambda d: [{"url": f"https://{d}/x", "title": ""}]  # noqa: E731
    issue = {"type": "dose", "ai_sentence": "a", "label_sentence": "b", "explanation": "e", "severity": "high"}
    answers = [
        _answer(1, mentioned=True, position=1, citations=cite("opzelura.com"), accuracy_issues=[issue]),
        _answer(2, competitors_mentioned=["Dupixent"], citations=cite("www.webmd.com")),
        _answer(3, competitors_mentioned=["Dupixent", "Eucrisa"], citations=cite("webmd.com")),
        _answer(4, mentioned=True),
        _answer(2, engine="google_aio", shown=False),
    ]
    r = build_payload(product, company, prompts, ["Dupixent", "Eucrisa"], answers, ["claude", "google_aio"])
    claude = r["summary"]["claude"]
    assert claude["unbranded"] == {"asked": 3, "you": 1, "competitor": 2, "none": 0, "not_shown": 0, "error": 0}
    assert claude["top_competitor"] == {"brand": "Dupixent", "count": 2}
    assert claude["label_conflicts"] == 1
    assert r["summary"]["google_aio"]["unbranded"]["not_shown"] == 1
    assert [q["prompt_id"] for q in r["lost_questions"]] == [2, 3]
    assert r["sources"]["competitor_only"][0]["domain"] == "webmd.com"  # the brand's own site is never listed
    assert all("opzelura" not in s["domain"] for s in r["sources"]["yours"])
    assert "score" not in str(r["summary"])
    fixes = fallback_fixes(r)
    assert fixes[0]["kind"] == "accuracy_correction" and len(fixes) == 3


def test_premlr_checklist(opzelura):
    bad = "Opzelura is the best cream and completely safe."
    result = premlr.checklist(premlr.rule_flags(bad, [{"text": "x", "label_quote": "not in the label at all"}],
                                                opzelura["label"]))
    failed = {c["id"] for c in result["checks"] if not c["passed"]}
    assert {"no_overstatement", "isi", "claims_traced"} <= failed
    assert result["status"] == "blocked" and "risk_score" not in result


def test_dataforseo_parsing():
    import json
    from pathlib import Path

    from app.services import dataforseo

    data = Path(__file__).parent / "data" / "dataforseo"
    res = json.loads((data / "aio_opzelura.json").read_text())["tasks"][0]["result"][0]
    aio = dataforseo.overview(next(i for i in res["items"] if i["type"] == "ai_overview"))
    assert aio["shown"] and aio["captured"] and "Opzelura" in aio["text"] and "[[" not in aio["text"]
    assert any(r["domain"].endswith("opzelura.com") for r in aio["references"])
    assert dataforseo.overview(None)["shown"] is False
    paa = dataforseo.people_also_ask_from(json.loads((data / "paa_eczema.json").read_text())["tasks"][0]["result"][0])
    assert "Which cream is best for eczema?" in paa
    assert not any("Chinese" in q for q in paa)  # off-topic questions filtered


def test_label_without_openfda_block():
    from app.services.openfda import parse_label

    rec = {"spl_product_data_elements": ["NIKTIMVO axatilimab-csfr AXATILIMAB CITRIC ACID"],
           "indications_and_usage": ["chronic GVHD"], "set_id": "s", "effective_time": "20260624"}
    lab = parse_label(rec, manufacturer="incyte")
    assert (lab["brand"], lab["molecule"], lab["tier"], lab["indexed"]) == ("Niktimvo", "axatilimab-csfr", "Rx", False)
    rec["spl_product_data_elements"] = ["Iclusig ponatinib hydrochloride"]
    assert parse_label(rec)["molecule"] == "ponatinib"


def test_crawl_page_ranking_and_brand_sites():
    from app.services.crawl import brand_site_links, score_page

    assert score_page({"url": "https://incyte.com/what-we-do/pharmaceutical-portfolio", "title": "Portfolio"}) > 0
    assert score_page({"url": "https://investor.incyte.com/press-releases"}) < 0
    pages = [{"links": ["https://jakafi.com/", "https://www.youtube.com/x", "https://incyte.it", "https://incyte.com/a",
                        "https://pemazyre.com/hcp"]}]
    assert brand_site_links(pages, "incyte.com") == ["https://jakafi.com", "https://pemazyre.com"]


def test_premlr_study_numbers_not_flagged():
    s = "In the double-blind, placebo-controlled myelofibrosis study, weight gain occurred in 7% of patients."
    assert [f for f in premlr.rule_flags(s, [], {}) if f["rule"] == "overstatement"] == []


def test_premlr_accepts_elided_quotes(opzelura):
    label_text = premlr._norm(" ".join(v for v in opzelura["label"].values() if v))
    ind = opzelura["label"]["indications"]
    elided = f"{ind[40:120]} ... {ind[300:380]}"
    assert premlr._quote_in_label(elided, label_text)
    assert not premlr._quote_in_label(f"{ind[40:120]} ... this sentence is not in the label", label_text)


def test_match_competitors():
    from app.models import Competitor
    from app.services.scan import match_competitors

    rows = [Competitor(product_id=1, brand="Eucrisa", molecule="crisaborole"),
            Competitor(product_id=1, brand="Dupixent", molecule="dupilumab"),
            Competitor(product_id=1, brand="Vtama", molecule="tapinarof")]
    assert match_competitors(["Eucrisa (crisaborole)", "dupilumab"], rows) == ["Eucrisa", "Dupixent"]
    assert match_competitors([], rows) == []
