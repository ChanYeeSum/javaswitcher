"""Capture key UI screenshots of the JDK Switcher Electron app.

The script launches the bundled Electron executable, navigates to the three
relevant views (JDK Versions, Scan Paths, About) and saves screenshots into
the project's ./screenshots directory. The filenames match those referenced
in README.md:

* 01-jdk-versions.png
* 02-scan-paths.png
* 03-about.png

Run with:
    python scripts/capture_screenshots.py

Requires Playwright (`pip install playwright` and `playwright install`).
"""

import os
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

# Directory for output screenshots (relative to project root)
OUT_DIR = Path(__file__).resolve().parents[1] / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Path to the Electron binary bundled with the project
ELECTRON_EXE = (
    Path(__file__).resolve().parents[2]
    / "javaswitcher"
    / "node_modules"
    / "electron"
    / "dist"
    / "electron.exe"
)

# Root directory of the Electron app (contains index.html)
APP_ROOT = Path(__file__).resolve().parents[2] / "javaswitcher"


def capture():
    with sync_playwright() as p:
        # Launch Electron with the app directory as argument
        electron = p._electron.launch(
            executable_path=str(ELECTRON_EXE),
            args=[str(APP_ROOT)],
            timeout=30000,
        )

        # Wait for the first window to be ready
        windows = electron.windows()
        if not windows:
            # Give the app a moment to create its UI
            time.sleep(5)
            windows = electron.windows()
        if not windows:
            raise RuntimeError("No Electron windows found after launch")

        page = windows[0]
        page.set_viewport_size({"width": 900, "height": 640})
        time.sleep(2)

        # 1. JDK Versions view (default active)
        page.screenshot(path=OUT_DIR / "01-jdk-versions.png")
        print("Captured 01-jdk-versions.png")
        time.sleep(1)

        # 2. Scan Paths view
        path_nav = page.locator('.nav-item[data-view="paths"]')
        if path_nav.count() > 0:
            path_nav.click()
            time.sleep(1)
            page.screenshot(path=OUT_DIR / "02-scan-paths.png")
            print("Captured 02-scan-paths.png")

        # 3. About view (Repository page merged into About)
        about_nav = page.locator('.nav-item[data-view="about"]')
        if about_nav.count() > 0:
            about_nav.click()
            time.sleep(1)
            page.screenshot(path=OUT_DIR / "03-about.png")
            print("Captured 03-about.png")

        # Cleanly close the app
        electron.close()


if __name__ == "__main__":
    capture()
