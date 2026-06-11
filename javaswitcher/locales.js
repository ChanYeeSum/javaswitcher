const locales = {
  zh: {
    // 通用
    app_name: 'JDK Switcher',
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    success: '成功',
    error: '错误',

    // 导航
    nav_menu: '菜单',
    nav_jdks: 'JDK 版本',
    nav_paths: '扫描路径',
    nav_about: '关于',
    nav_repo: '仓库介绍',

    // JDK 版本页面
    jdks_title: 'JDK 版本',
    jdks_refresh: '刷新',
    jdks_scan_hint: '自动递归扫描子文件夹（最多 3 层深度）',
    jdks_scan_placeholder: '点击"刷新"扫描 JDK 安装',
    jdks_not_found: '未找到 JDK 安装',
    jdks_no_jdk_hint: '请确认已安装 JDK，或在"扫描路径"中添加自定义路径',
    jdks_switch: '切换',
    jdks_switching: '切换中...',
    jdks_current: '当前使用',
    jdks_scan_complete: '扫描完成，找到 {count} 个 JDK',

    // 扫描路径页面
    paths_title: '扫描路径',
    paths_add: '添加路径',
    paths_common: '常用路径',
    paths_custom: '自定义路径',
    paths_empty: '暂无自定义路径，点击上方"添加路径"按钮添加',
    paths_added: '已添加路径',
    paths_removed: '已移除路径',
    paths_add_failed: '添加失败',
    paths_remove_failed: '移除失败',

    // 关于页面
    about_title: '关于',
    about_check_update: '检查更新',
    about_version: '版本',
    about_description: '基于 Electron 的 Java JDK 版本切换工具',
    about_checking: '正在检查更新...',
    about_latest: '发现新版本',
    about_current: '当前',
    about_download: '立即下载',
    about_latest_version: '已是最新版本',
    about_check_failed: '检查失败',
    about_check_update_failed: '检查更新失败',

    // 更新提示
    update_available: '发现新版本 {version}',
    update_latest: '已是最新版本',
    update_failed: '检查更新失败',

    // 切换结果
    switch_result_title: '切换验证结果',
    switch_result_pass: '全部通过',
    switch_result_partial: '部分通过',
    switch_result_fail: '未通过',
    switch_result_before: '切换前',
    switch_result_after: '切换后',
    switch_result_removed: '已移除旧 JDK 路径',

    // Toast 消息
    toast_switched: '已切换至',
    toast_switch_failed: '切换失败',
  },
  en: {
    // Common
    app_name: 'JDK Switcher',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    success: 'Success',
    error: 'Error',

    // Navigation
    nav_menu: 'Menu',
    nav_jdks: 'JDK Versions',
    nav_paths: 'Scan Paths',
    nav_about: 'About',
    nav_repo: 'Repository',

    // JDK Versions Page
    jdks_title: 'JDK Versions',
    jdks_refresh: 'Refresh',
    jdks_scan_hint: 'Auto recursive scan subfolders (max 3 levels)',
    jdks_scan_placeholder: 'Click "Refresh" to scan JDK installations',
    jdks_not_found: 'No JDK Installation Found',
    jdks_no_jdk_hint: 'Please confirm JDK is installed, or add custom path in "Scan Paths"',
    jdks_switch: 'Switch',
    jdks_switching: 'Switching...',
    jdks_current: 'Current',
    jdks_scan_complete: 'Scan complete, found {count} JDK(s)',

    // Scan Paths Page
    paths_title: 'Scan Paths',
    paths_add: 'Add Path',
    paths_common: 'Common Paths',
    paths_custom: 'Custom Paths',
    paths_empty: 'No custom paths, click "Add Path" button above',
    paths_added: 'Path added',
    paths_removed: 'Path removed',
    paths_add_failed: 'Add failed',
    paths_remove_failed: 'Remove failed',

    // About Page
    about_title: 'About',
    about_check_update: 'Check Update',
    about_version: 'Version',
    about_description: 'Java JDK version switcher tool based on Electron',
    about_checking: 'Checking for updates...',
    about_latest: 'New version available',
    about_current: 'Current',
    about_download: 'Download Now',
    about_latest_version: 'Already latest version',
    about_check_failed: 'Check failed',
    about_check_update_failed: 'Check update failed',

    // Update提示
    update_available: 'New version {version} available',
    update_latest: 'Already latest version',
    update_failed: 'Check update failed',

    // Switch Result
    switch_result_title: 'Switch Verification Result',
    switch_result_pass: 'All Passed',
    switch_result_partial: 'Partial Pass',
    switch_result_fail: 'Failed',
    switch_result_before: 'Before',
    switch_result_after: 'After',
    switch_result_removed: 'Removed old JDK paths',

    // Toast Messages
    toast_switched: 'Switched to',
    toast_switch_failed: 'Switch failed',
  },
};

module.exports = locales;