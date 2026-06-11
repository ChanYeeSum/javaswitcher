"""Capture screenshots of the JDK Switcher UI using Chromium (Playwright).

This script avoids the unavailable Electron API by loading the local
`index.html` file directly in a Chromium browser. The UI logic (navigation
clicks, translations, etc.) works because the page includes the bundled
JavaScript assets.

Run with:
    python scripts/capture_browser_screenshots.py

It produces three PNG files in the project ``screenshots`` folder that match
the names referenced in ``README.md``.
"""

import os
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = ROOT / "javaswitcher"
OUT_DIR = ROOT / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        # Launch Chromium (headless=False gives a visible window, but headless works for screenshots)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Load the local HTML file directly
        page.goto(f"file:///{APP_ROOT / 'index.html'}")
        page.wait_for_load_state('networkidle')
        page.set_viewport_size({"width": 900, "height": 640})
        time.sleep(1)

        # 1. JDK Versions (default active)
        page.screenshot(path=OUT_DIR / "01-jdk-versions.png")
        print("Captured 01-jdk-versions.png")

        # 2. Scan Paths view
        path_nav = page.locator('.nav-item[data-view="paths"]')
        if path_nav.count() > 0:
            path_nav.click()
            time.sleep(1)
            page.screenshot(path=OUT_DIR / "02-scan-paths.png")
            print("Captured 02-scan-paths.png")

        # 3. About view (Repository merged)
        about_nav = page.locator('.nav-item[data-view="about"]')
        if about_nav.count() > 0:
            about_nav.click()
            time.sleep(1)
            page.screenshot(path=OUT_DIR / "03-about.png")
            print("Captured 03-about.png")

        browser.close()


if __name__ == "__main__":
    main()
