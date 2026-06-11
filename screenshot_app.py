"""JDK Switcher 截图脚本 - 用 Electron test 方式截图"""
import sys
import os
import time

screenshot_dir = sys.argv[1] if len(sys.argv) > 1 else r"D:\Java\javaswitcher\screenshots"
os.makedirs(screenshot_dir, exist_ok=True)

print(f"截图目录: {screenshot_dir}")

# 方式1: 尝试 Playwright Electron
try:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        print("启动 Electron 应用...")
        electron_app = p._electron.launch(
            executable_path=r"D:\Java\javaswitcher\javaswitcher\node_modules\electron\dist\electron.exe",
            args=[r"D:\Java\javaswitcher\javaswitcher"],
            timeout=30000,
        )

        # 获取窗口
        windows = electron_app.windows()
        print(f"窗口数: {len(windows)}")
        for w in windows:
            print(f"  URL: {w.url()}")

        if not windows:
            print("等待窗口...")
            time.sleep(8)
            windows = electron_app.windows()
            print(f"窗口数: {len(windows)}")

        if windows:
            page = windows[0]
            page.set_viewport_size({"width": 900, "height": 640})
            time.sleep(3)

            # 截图: JDK 版本页面（主页面）
            print("截图: JDK 版本页面")
            page.screenshot(path=os.path.join(screenshot_dir, "01-jdk-versions.png"))
            time.sleep(1)

            # 截图: 扫描路径页面
            print("截图: 扫描路径页面")
            # 尝试点击导航按钮
            nav_items = page.locator(".nav-item")
            count = nav_items.count()
            print(f"导航项数: {count}")
            for i in range(count):
                text = nav_items.nth(i).inner_text()
                print(f"  导航{i}: {text}")

            # 点击扫描路径
            path_nav = page.locator('.nav-item[data-view="paths"]')
            if path_nav.count() > 0:
                path_nav.click()
                time.sleep(1)
                page.screenshot(path=os.path.join(screenshot_dir, "02-scan-paths.png"))
                print("截图: 扫描路径页面 ✓")

            # 截图: 仓库介绍页面
            repo_nav = page.locator('.nav-item[data-view="repo"]')
            if repo_nav.count() > 0:
                repo_nav.click()
                time.sleep(1)
                page.screenshot(path=os.path.join(screenshot_dir, "03-repo-intro.png"))
                print("截图: 仓库介绍页面 ✓")

            # 截图: 关于页面
            about_nav = page.locator('.nav-item[data-view="about"]')
            if about_nav.count() > 0:
                about_nav.click()
                time.sleep(1)
                page.screenshot(path=os.path.join(screenshot_dir, "04-about.png"))
                print("截图: 关于页面 ✓")

            print(f"所有截图已保存到: {screenshot_dir}")
        else:
            print("ERROR: 找不到窗口")
            # 尝试截图整个桌面
            time.sleep(2)

        electron_app.close()
        print("完成!")

except Exception as e:
    print(f"Playwright 截图失败: {e}")
    import traceback
    traceback.print_exc()

    # 备用方案: 用 Python 的 pyautogui
    print("尝试备用截图方案...")
    try:
        import pyautogui
        time.sleep(3)
        s = pyautogui.screenshot()
        s.save(os.path.join(screenshot_dir, "01-screen.png"))
        print(f"备用截图已保存: {os.path.join(screenshot_dir, '01-screen.png')}")
    except Exception as e2:
        print(f"备用截图也失败: {e2}")