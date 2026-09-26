"""Seed eval cases, grounded in the Opzelura label in tests/data/opzelura_label.json.

Written by engineers from the label text, so they need a medical-affairs review before they gate anything. Each
case says what the right answer is and which label passage decides it."""

# Label check: does this AI statement contradict the label? (the red box on the report)
LABEL_CHECK = [
    {"id": "age-ad-wrong", "answer": "Opzelura cream is only approved for eczema in people 12 and older.",
     "contradicts": True, "why": "1.1: atopic dermatitis in patients 2 years of age and older"},
    {"id": "age-ad-right", "answer": "Opzelura is approved for mild to moderate atopic dermatitis in adults and children "
     "2 years and older when other topical prescription treatments haven't worked.", "contradicts": False,
     "why": "1.1 as written"},
    {"id": "bsa-wrong", "answer": "You can apply Opzelura twice a day to up to 40% of your body.", "contradicts": True,
     "why": "2.1: up to 20% body surface area"},
    {"id": "bsa-right", "answer": "Apply a thin layer twice a day to no more than 20% of your body surface area.",
     "contradicts": False, "why": "2.1 as written"},
    {"id": "tubes-wrong", "answer": "Adults can use up to two 60-gram tubes of Opzelura a week.", "contradicts": True,
     "why": "2.1: not more than one 60 gram tube per week"},
    {"id": "tubes-kids-right", "answer": "Children aged 2 to 11 should use no more than one 60-gram tube every two weeks.",
     "contradicts": False, "why": "2.1: pediatric patients 2 to 11, one 60 gram tube per 2 weeks"},
    {"id": "boxed-wrong", "answer": "Because it's a cream, Opzelura doesn't carry a boxed warning.", "contradicts": True,
     "why": "Boxed warning: serious infections, mortality, malignancy, MACE, thrombosis"},
    {"id": "boxed-right", "answer": "Opzelura carries a boxed warning about serious infections, mortality, malignancy, "
     "major adverse cardiovascular events and thrombosis.", "contradicts": False, "why": "Boxed warning as written"},
    {"id": "psoriasis-wrong", "answer": "Opzelura is approved to treat plaque psoriasis.", "contradicts": True,
     "why": "Indications are atopic dermatitis and nonsegmental vitiligo only"},
    {"id": "vitiligo-right", "answer": "Opzelura is approved for nonsegmental vitiligo in patients 12 years and older.",
     "contradicts": False, "why": "1.2 as written"},
    {"id": "biologics-wrong", "answer": "It's fine to use Opzelura together with Dupixent or other biologics.",
     "contradicts": True, "why": "1.3 Limitations of Use: not recommended with therapeutic biologics"},
    {"id": "continuous-wrong", "answer": "Opzelura can be used every day, continuously, for as long as you like.",
     "contradicts": True, "why": "1.1: short-term and non-continuous chronic treatment"},
]

ISI = ("## Important Safety Information\n\nWARNING: SERIOUS INFECTIONS, MORTALITY, MALIGNANCY, MAJOR ADVERSE "
       "CARDIOVASCULAR EVENTS, AND THROMBOSIS. Serious infections, mortality, malignancy, major adverse cardiovascular "
       "events and thrombosis have occurred with Janus kinase inhibitors. Tell your doctor if you have an infection.")

# Pre-MLR checklist: which checks must fail (or, for the clean case, none).
PREMLR = [
    {"id": "overstatement", "must_fail": ["no_overstatement"], "claims": [],
     "content": "## Direct answer\n\nOPZELURA is safe for children and the best cream for eczema.\n\n" + ISI},
    {"id": "missing-isi", "must_fail": ["isi"], "claims": [],
     "content": "## Direct answer\n\nOPZELURA is a prescription cream for mild to moderate atopic dermatitis."},
    {"id": "untraceable-claim", "must_fail": ["claims_traced"],
     "claims": [{"text": "Relief starts within days", "label_section": "indications",
                 "label_quote": "patients reported itch relief within days of starting treatment"}],
     "content": "## Direct answer\n\nIn clinical studies, relief starts within days.\n\n" + ISI},
    {"id": "comparison", "must_fail": ["comparisons"], "claims": [],
     "content": "## Direct answer\n\nOPZELURA works faster than Protopic and Elidel.\n\n" + ISI},
    {"id": "clean", "must_fail": [],
     "claims": [{"text": "Approved for mild to moderate atopic dermatitis in patients 2 years and older",
                 "label_section": "indications",
                 "label_quote": "mild to moderate atopic dermatitis in non-immunocompromised adult and pediatric patients 2 years of age and older"}],
     "content": ("## Direct answer\n\nOPZELURA (ruxolitinib) cream is a prescription medicine for the short-term and "
                 "non-continuous chronic treatment of mild to moderate atopic dermatitis in people 2 years and older "
                 "who are not immunocompromised, when other topical prescription treatments have not worked well "
                 "enough or are not advisable. OPZELURA can cause serious side effects, including serious infections. "
                 "Talk to your doctor about the risks and benefits.\n\n" + ISI)},
]
