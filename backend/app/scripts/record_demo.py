"""Save a finished live run as the demo bundle (backend/fixtures/demo/bundle.json).

Run the flow live through the API first (discovery → setup → scan → a fix or two → opportunities), then:

    python -m app.scripts.record_demo --company <company_id>
"""

import sys

from app.db import init_db
from app.services import demo

if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] != "--company":
        sys.exit(__doc__)
    init_db()
    print("wrote", demo.record(int(sys.argv[2])))
