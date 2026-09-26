import json
import os
import tempfile
from pathlib import Path

# Isolated DB + no real keys, before the app is imported.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["DEMO_MODE"] = "1"
os.environ["ANTHROPIC_API_KEY"] = ""

import pytest  # noqa: E402

DATA = Path(__file__).parent / "data"


@pytest.fixture
def opzelura_record() -> dict:
    return json.loads((DATA / "opzelura_label.json").read_text())


@pytest.fixture
def opzelura(opzelura_record) -> dict:
    from app.services.openfda import parse_label

    return parse_label(opzelura_record)
