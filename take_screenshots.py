"""
JDK Switcher 截图脚本
使用 Playwright chromium 对接 Electron 窗口
"""
import os
import time
from playwright.sync_api import sync_playwright

screenshot_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots")
os.makedirs(screenshot_dir, exist_ok=True)

print("Screenshot dir:", screenshot_dir)

with sync_playwright() as p:
    print("Connecting to Electron...")
    browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")

    pages = browser.contexts[0].pages if browser.contexts else []
    print("Pages:", len(pages))

    if pages:
        page = pages[0]
        page.set_viewport_size({"width": 900, "height": 640})
        time.sleep(2)

        # JDK Versions page
        print("Screenshot: JDK Versions...")
        page.screenshot(path=os.path.join(screenshot_dir, "01-jdk-versions.png"))
        print("OK 01-jdk-versions.png")

        # Scan Paths
        try:
            page.locator('.nav-item[data-view="paths"]').click()
            time.sleep(1)
            page.screenshot(path=os.path.join(screenshot_dir, "02-scan-paths.png"))
            print("OK 02-scan-paths.png")
        except Exception as e:
            print("FAIL paths:", e)

        # Repository
        try:
            page.locator('.nav-item[data-view="repo"]').click()
            time.sleep(1)
            page.screenshot(path=os.path.join(screenshot_dir, "03-repo-intro.png"))
            print("OK 03-repo-intro.png")
        except Exception as e:
            print("FAIL repo:", e)

        # About
        try:
            page.locator('.nav-item[data-view="about"]').click()
            time.sleep(1)
            page.screenshot(path=os.path.join(screenshot_dir, "04-about.png"))
            print("OK 04-about.png")
        except Exception as e:
            print("FAIL about:", e)
    else:
        print("ERROR: no pages found")

    browser.close()
    print("Done!")