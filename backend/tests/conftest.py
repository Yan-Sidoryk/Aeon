import json
import os
import tempfile
from pathlib import Path

# Isolated DB + no real keys, before the app is imported.
_tmp = tempfile.mkdtemp()
# AEON_TEST_DATABASE_URL runs the suite against Postgres (use a fresh database each run).
os.environ["DATABASE_URL"] = os.environ.get("AEON_TEST_DATABASE_URL") or f"sqlite:///{_tmp}/test.db"
os.environ["DEMO_MODE"] = "1"
# Never touch real services from tests, whatever backend/.env holds.
for key in ("ANTHROPIC_API_KEY", "DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD", "APIFY_TOKEN",
            "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"):
    os.environ[key] = ""

import pytest  # noqa: E402

DATA = Path(__file__).parent / "data"


@pytest.fixture
def opzelura_record() -> dict:
    return json.loads((DATA / "opzelura_label.json").read_text())


@pytest.fixture
def opzelura(opzelura_record) -> dict:
    from app.services.openfda import parse_label

    return parse_label(opzelura_record)
