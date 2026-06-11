const COMMON_SCAN_PATHS = [
  'C:\\Program Files\\Java',
  'C:\\Program Files\\Eclipse Adoptium',
  'C:\\Program Files\\Amazon Corretto',
  'C:\\Program Files\\OpenJDK',
  'C:\\Program Files\\Microsoft\\jdk',
  'C:\\Program Files\\Semeru',
  'C:\\Program Files\\Zulu',
];

const appVersion = '1.0.0';

// i18n 支持
const locales = {
  zh: {
    app_name: 'JDK Switcher',
    nav_menu: '菜单',
    nav_jdks: 'JDK 版本',
    nav_paths: '扫描路径',
    nav_about: '关于',
    jdks_title: 'JDK 版本',
    jdks_refresh: '刷新',
    jdks_scan_hint: '自动递归扫描子文件夹（最多 3 层深度）',
    jdks_switch: '切换',
    jdks_current: '当前使用',
    paths_title: '扫描路径',
    paths_add: '添加路径',
    paths_common: '常用路径',
    paths_custom: '自定义路径',
    about_title: '关于',
    about_check_update: '检查更新',
    about_version: '版本',
    about_description: '基于 Electron 的 Java JDK 版本切换工具',
    repo_features_title: '功能特性',
    repo_features: [
      '一键切换 JDK 版本',
      '自动递归扫描 JDK 安装目录（最多 3 层深度）',
      '支持亮色/暗色主题切换',
      '自定义扫描路径',
      '切换后自动验证环境变量',
    ],
    repo_tech_title: '技术栈',
    repo_tech: [
      'Electron',
      'Node.js',
      'Vanilla JavaScript',
    ],
    repo_license: 'MIT License',
    current_label: '当前 JDK',
    switch_result_title: '切换验证结果',
  },
  en: {
    app_name: 'JDK Switcher',
    nav_menu: 'Menu',
    nav_jdks: 'JDK Versions',
    nav_paths: 'Scan Paths',
    nav_about: 'About',
    jdks_title: 'JDK Versions',
    jdks_refresh: 'Refresh',
    jdks_scan_hint: 'Auto recursive scan (max 3 levels)',
    jdks_switch: 'Switch',
    jdks_current: 'Current',
    paths_title: 'Scan Paths',
    paths_add: 'Add Path',
    paths_common: 'Common Paths',
    paths_custom: 'Custom Paths',
    about_title: 'About',
    about_check_update: 'Check Update',
    about_version: 'Version',
    about_description: 'Electron-based Java JDK version switcher',
    repo_features_title: 'Features',
    repo_features: [
      'One-click JDK switching',
      'Auto recursive scan (max 3 levels)',
      'Light/Dark theme support',
      'Custom scan paths',
      'Auto-verify environment variables',
    ],
    repo_tech_title: 'Tech Stack',
    repo_tech: [
      'Electron',
      'Node.js',
      'Vanilla JavaScript',
    ],
    repo_license: 'MIT License',
    current_label: 'Current JDK',
    switch_result_title: 'Switch Verification Result',
  },
};

let currentLang = localStorage.getItem('lang') || 'zh';

function t(key) {
  const keys = key.split('.');
  let value = locales[currentLang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
}

function applyTranslations() {
  // 更新所有带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  // 更新 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
}

document.getElementById('btn-minimize').addEventListener('click', () => window.api.minimize());
document.getElementById('btn-maximize').addEventListener('click', () => window.api.maximize());
document.getElementById('btn-close').addEventListener('click', () => window.api.close());

// 主题切换
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

document.getElementById('btn-theme').addEventListener('click', toggleTheme);
initTheme();

// 语言切换
function initLang() {
  updateLangButton();
  setLang(currentLang);
}

function toggleLang() {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
  updateLangButton();
}

function updateLangButton() {
  const btnLang = document.getElementById('btn-lang');
  if (btnLang) {
    btnLang.innerHTML = currentLang === 'zh' ? '<span style="font-size:11px;font-weight:600;">中</span>' : '<span style="font-size:10px;font-weight:600;">EN</span>';
    btnLang.setAttribute('title', currentLang === 'zh' ? 'Switch to English' : '切换到中文');
  }
}

// 在 titlebar 添加语言切换按钮的监听（如果存在）
const btnLang = document.getElementById('btn-lang');
if (btnLang) {
  btnLang.addEventListener('click', toggleLang);
}
initLang();

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + item.dataset.view).classList.add('active');
    document.getElementById('switch-result').classList.add('hidden');
  });
});

document.getElementById('btn-refresh').addEventListener('click', () => {
  document.getElementById('switch-result').classList.add('hidden');
  scanJdks();
});
document.getElementById('btn-add-path').addEventListener('click', addCustomPath);

function showToast(message, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function scanJdks() {
  const list = document.getElementById('jdk-list');
  const refreshBtn = document.getElementById('btn-refresh');

  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  refreshBtn.disabled = true;

  try {
    const jdks = await Promise.race([
      window.api.scanJdks(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('扫描超时，请重试')), 15000)),
    ]);
    window.__jdks = jdks;
    window.__currentJdk = await window.api.getCurrentJdk();
    renderJdkList();
    updateCurrentInfo();
    showToast('扫描完成，找到 ' + jdks.length + ' 个 JDK', 'success');
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><span>扫描失败或超时</span><span style="font-size:12px;color:var(--text-muted)">请检查扫描路径或重试</span></div>';
    showToast(e.message || '扫描失败', 'error');
  } finally {
    refreshBtn.disabled = false;
  }
}

function renderJdkList() {
  const list = document.getElementById('jdk-list');
  const jdks = window.__jdks || [];
  const current = window.__currentJdk;

  if (jdks.length === 0) {
    list.innerHTML =
      '<div class="empty-state">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>' +
      '<span>未找到 JDK 安装</span>' +
      '<span style="font-size:12px;color:var(--text-muted)">请确认已安装 JDK，或在"扫描路径"中添加自定义路径</span>' +
      '</div>';
    return;
  }

  list.innerHTML = jdks.map(jdk =>
    '<div class="jdk-card' + (current && current.path === jdk.path ? ' active' : '') + '">' +
      '<div class="jdk-card-info">' +
        '<div class="jdk-card-name">' + jdk.name + '</div>' +
        '<div class="jdk-card-meta">' +
          '<span class="jdk-badge">JDK ' + jdk.major + '</span>' +
          '<span class="jdk-badge vendor">' + jdk.vendor + '</span>' +
          '<span>' + jdk.version + '</span>' +
          (current && current.path === jdk.path ? '<span class="jdk-badge current">当前使用</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="jdk-card-actions">' +
        '<button class="btn btn-primary btn-switch" data-path="' + jdk.path + '">切换</button>' +
      '</div>' +
    '</div>'
  ).join('');

  list.querySelectorAll('.btn-switch').forEach(btn => {
    btn.addEventListener('click', () => switchJdk(btn.dataset.path));
  });
}

function updateCurrentInfo() {
  const el = document.getElementById('current-path');
  el.textContent = window.__currentJdk ? window.__currentJdk.path : '未检测到';
}

function truncatePath(p, max) {
  if (!p || p.length <= max) return p || '';
  return p.substring(0, max) + '...';
}

function renderSwitchResult(result) {
  const el = document.getElementById('switch-result');
  const r = result;
  const v = r.verification;

  const allPass = v.newHomeMatch && v.newJavaMatch && v.newVerMatch;
  const statusClass = allPass ? 'pass' : (v.newHomeMatch || v.newJavaMatch || v.newVerMatch ? 'partial' : 'fail');
  const statusText = allPass ? '全部通过' : (statusClass === 'partial' ? '部分通过' : '未通过');

  el.innerHTML =
    '<div class="sr-header">' +
      '<span class="sr-header-left">' +
        '<svg class="sr-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
        '切换验证结果' +
      '</span>' +
      '<span class="sr-status"><span class="sr-status-dot ' + statusClass + '"></span>' + statusText + '</span>' +
    '</div>' +
    '<div class="sr-body">' +
      '<table class="sr-table">' +
        '<tr><th></th><th>切换前</th><th>切换后</th></tr>' +
        '<tr>' +
          '<td class="sr-label">JAVA_HOME</td>' +
          '<td class="sr-before">' + truncatePath(r.before.javaHome, 40) + '</td>' +
          '<td class="sr-after">' + truncatePath(r.after.javaHome, 40) + '</td>' +
        '</tr>' +
        '<tr>' +
          '<td class="sr-label">PATH</td>' +
          '<td class="sr-before">' + truncatePath(r.before.path, 40) + '</td>' +
          '<td class="sr-after">' + truncatePath(r.after.path, 40) + '</td>' +
        '</tr>' +
        '<tr>' +
          '<td class="sr-label">java 版本</td>' +
          '<td class="sr-before">' + truncatePath(r.before.javaVer, 40) + '</td>' +
          '<td class="sr-after">' + truncatePath(v.javaVer, 40) + '</td>' +
        '</tr>' +
      '</table>' +
      '<div class="sr-verification">' +
        '<div class="sr-verification-item">' +
          '<span class="v-icon ' + (v.newHomeMatch ? 'pass' : 'fail') + '">' +
            (v.newHomeMatch
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') +
          '</span>' +
          '<span class="v-label">JAVA_HOME</span>' +
          '<span class="v-value">' + truncatePath(v.javaHome, 50) + '</span>' +
        '</div>' +
        '<div class="sr-verification-item">' +
          '<span class="v-icon ' + (v.newJavaMatch ? 'pass' : 'fail') + '">' +
            (v.newJavaMatch
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') +
          '</span>' +
          '<span class="v-label">where java</span>' +
          '<span class="v-value">' + truncatePath(v.javaPath, 50) + '</span>' +
        '</div>' +
        '<div class="sr-verification-item">' +
          '<span class="v-icon ' + (v.newVerMatch ? 'pass' : 'fail') + '">' +
            (v.newVerMatch
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') +
          '</span>' +
          '<span class="v-label">java -version</span>' +
          '<span class="v-value">' + truncatePath(v.javaVer, 50) + '</span>' +
        '</div>' +
      '</div>' +
      (r.removedBins && r.removedBins.length > 0
        ? '<div class="sr-removed">已移除旧 JDK 路径: <span>' + r.removedBins.join('</span><span>') + '</span></div>'
        : '') +
    '</div>';

  el.classList.remove('hidden');
  el.classList.remove('collapsed');
  el.querySelector('.sr-header').addEventListener('click', () => {
    el.classList.toggle('collapsed');
  });
}

async function switchJdk(jdkPath) {
  const btn = document.querySelector('.btn-switch[data-path="' + jdkPath + '"]');
  if (btn) {
    btn.textContent = '切换中...';
    btn.disabled = true;
  }

  try {
    const result = await window.api.switchJdk(jdkPath);
    if (result.success) {
      const jdks = window.__jdks || [];
      window.__currentJdk = jdks.find(j => j.path === jdkPath) || null;
      renderJdkList();
      updateCurrentInfo();
      renderSwitchResult(result);
      showToast('已切换至 ' + (window.__currentJdk ? window.__currentJdk.name : jdkPath), 'success');
    } else {
      showToast('切换失败: ' + (result.error || '未知错误'), 'error');
    }
  } catch (e) {
    showToast('切换失败: ' + e.message, 'error');
  }

  if (btn) {
    btn.textContent = '切换';
    btn.disabled = false;
  }
}

async function addCustomPath() {
  const path = await window.api.openFolderDialog();
  if (!path) return;

  try {
    const customPaths = await window.api.addCustomPath(path);
    renderCustomPaths(customPaths);
    showToast('已添加路径: ' + path, 'info');
    scanJdks();
  } catch (e) {
    showToast('添加失败', 'error');
  }
}

async function removeCustomPath(path) {
  try {
    const customPaths = await window.api.removeCustomPath(path);
    renderCustomPaths(customPaths);
    showToast('已移除路径', 'info');
    scanJdks();
  } catch (e) {
    showToast('移除失败', 'error');
  }
}

function renderCommonPaths() {
  const list = document.getElementById('common-paths-list');
  list.innerHTML = COMMON_SCAN_PATHS.map(p =>
    '<li class="path-item"><span class="path-item-path">' + p + '</span></li>'
  ).join('');
}

function renderCustomPaths(customPaths) {
  const list = document.getElementById('custom-paths-list');
  if (!customPaths || customPaths.length === 0) {
    list.innerHTML = '<li class="empty-state small"><span>暂无自定义路径，点击上方"添加路径"按钮添加</span></li>';
    return;
  }
  list.innerHTML = customPaths.map(p =>
    '<li class="path-item">' +
      '<span class="path-item-path">' + p + '</span>' +
      '<button class="path-item-remove" data-path="' + p + '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</li>'
  ).join('');

  list.querySelectorAll('.path-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeCustomPath(btn.dataset.path));
  });
}

async function init() {
  renderCommonPaths();
  const customPaths = await window.api.getCustomPaths();
  renderCustomPaths(customPaths);
  window.__currentJdk = await window.api.getCurrentJdk();
  updateCurrentInfo();
  scanJdks();
  displayVersion();
  applyTranslations();
}

async function displayVersion() {
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = appVersion;
  }
}

async function checkForUpdates() {
  const btn = document.getElementById('btn-check-update');
  const statusEl = document.getElementById('update-status');

  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = '正在检查更新...';

  try {
    const result = await window.api.checkForUpdates();
    if (result.hasUpdate) {
      if (statusEl) {
        statusEl.innerHTML = '发现新版本：<strong>' + result.latestVersion + '</strong> ' +
          '(当前 ' + result.currentVersion + ') ' +
          '<a href="' + result.downloadUrl + '" target="_blank" style="color:var(--accent);text-decoration:underline">立即下载</a>';
      }
      showToast('发现新版本 ' + result.latestVersion, 'info');
    } else {
      if (statusEl) statusEl.textContent = '已是最新版本';
      showToast('已是最新版本', 'success');
    }
  } catch (e) {
    if (statusEl) statusEl.textContent = '检查失败';
    showToast('检查更新失败', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.getElementById('btn-check-update').addEventListener('click', checkForUpdates);
