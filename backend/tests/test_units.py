from app.models import Answer, Product, Prompt
from app.services import premlr
from app.services.discovery import clean_company
from app.services.openfda import dedupe_latest
from app.services.report import aggregate, fallback_fixes, wilson


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


def test_clean_company():
    assert clean_company("Incyte Corporation") == "Incyte"
    assert clean_company("Acme Pharmaceuticals, Inc.") == "Acme"


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


def test_wilson():
    lo, hi = wilson(34, 100)
    assert lo < 34 < hi
    assert wilson(0, 0) == (0.0, 0.0)


def test_aggregate():
    product = Product(id=1, company_id=1, brand="Opzelura", molecule="ruxolitinib")
    prompts = [Prompt(id=i, product_id=1, text=f"q{i}") for i in (1, 2, 3)]
    prompts.append(Prompt(id=4, product_id=1, text="off label", lane="off_label", monitor_only=True))
    cite = lambda d: [{"url": f"https://{d}/x", "title": ""}]  # noqa: E731
    answers = [
        Answer(scan_id=1, prompt_id=1, engine="claude", mentioned=True, position=1, citations=cite("dailymed.nlm.nih.gov"),
               accuracy_issues=[{"type": "dose", "ai_sentence": "a", "label_sentence": "b", "explanation": "e", "severity": "high"}]),
        Answer(scan_id=1, prompt_id=2, engine="claude", competitors_mentioned=["Dupixent"], citations=cite("www.webmd.com")),
        Answer(scan_id=1, prompt_id=3, engine="claude", competitors_mentioned=["Dupixent", "Eucrisa"], citations=cite("webmd.com")),
        Answer(scan_id=1, prompt_id=4, engine="claude", competitors_mentioned=["Dupixent"]),
        Answer(scan_id=1, prompt_id=1, engine="chatgpt", error="boom"),
    ]
    r = aggregate(product, prompts, ["Dupixent", "Eucrisa"], answers)
    assert r["headline"]["scope"] == "unbranded"
    assert r["headline"]["you"]["n"] == 3  # errored answer and off-label prompt excluded
    assert r["headline"]["you"]["score"] == 33
    assert r["headline"]["top_competitor"]["brand"] == "Dupixent"
    assert r["headline"]["top_competitor"]["score"] == 67
    assert r["all_prompts"]["you"]["score"] == 25
    assert [p["prompt_id"] for p in r["lost_prompts"]] == [2, 3]  # monitor-only prompt 4 excluded
    assert r["competitor_only_sources"][0] == {"domain": "webmd.com", "citations": 2, "competitors": ["Dupixent", "Eucrisa"]}
    assert r["accuracy_issues"][0]["prompt"] == "q1"
    fixes = fallback_fixes(r)
    assert fixes[0]["kind"] == "accuracy_correction" and len(fixes) == 3


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
