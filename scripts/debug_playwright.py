import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    attrs = [a for a in dir(p) if not a.startswith("__")]
    print(json.dumps(attrs, ensure_ascii=False))
