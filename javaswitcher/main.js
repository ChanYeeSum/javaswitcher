const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');
const { promisify } = require('util');
const setTimeout = promisify(global.setTimeout);

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const APP_VERSION = app.getVersion();

const COMMON_SCAN_PATHS = [
  'C:\\Program Files\\Java',
  'C:\\Program Files\\Eclipse Adoptium',
  'C:\\Program Files\\Amazon Corretto',
  'C:\\Program Files\\OpenJDK',
  'C:\\Program Files\\Microsoft\\jdk',
  'C:\\Program Files\\Semeru',
  'C:\\Program Files\\Zulu',
  path.join(os.homedir(), '.sdkman', 'candidates', 'java'),
  path.join(os.homedir(), 'AppData', 'Local', 'JetBrains', 'Toolbox', 'apps', 'IDEA-U'),
];

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 720,
    minHeight: 500,
    frame: false,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (_) {}
  return { customPaths: [] };
}

function saveConfig(config) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (_) {}
}

function parseJavaVersion(javaExe) {
  try {
    const output = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf-8', timeout: 5000 });
    const firstLine = output.split('\n')[0] || '';
    const match = firstLine.match(/(?:openjdk|java)\s+version\s+"([^"]+)"/i);
    if (match) {
      const parts = match[1].split('.');
      const major = parts[0] === '1' && parts.length > 1 ? parts[1] : parts[0];
      return { version: match[1], major };
    }
    const alt = firstLine.match(/(\d+\.\d+\.\d+)/);
    if (alt) {
      const parts = alt[1].split('.');
      const major = parts[0] === '1' && parts.length > 1 ? parts[1] : parts[0];
      return { version: alt[1], major };
    }
  } catch (_) {}
  return null;
}

async function detectJdk(jdkPath) {
  const javaExe = path.join(jdkPath, 'bin', 'java.exe');
  if (!fs.existsSync(javaExe)) return null;

  const info = parseJavaVersion(javaExe);
  if (!info) return null;

  let vendor = 'Unknown';
  const releaseFile = path.join(jdkPath, 'release');
  if (fs.existsSync(releaseFile)) {
    try {
      const content = fs.readFileSync(releaseFile, 'utf-8');
      const vMatch = content.match(/JAVA_VERSION\s*=\s*"([^"]+)"/);
      if (vMatch) info.version = vMatch[1];
      const iMatch = content.match(/IMPLEMENTOR\s*=\s*"([^"]+)"/);
      if (iMatch) vendor = iMatch[1];
    } catch (_) {}
  }

  const javacExe = path.join(jdkPath, 'bin', 'javac.exe');

  return {
    path: jdkPath,
    name: path.basename(jdkPath),
    version: info.version,
    major: info.major,
    vendor: vendor,
    isJdk: fs.existsSync(javacExe),
  };
}

async function scanDirectory(dirPath, recursive = false, depth = 0, maxDepth = 3) {
  const results = [];
  try {
    if (!fs.existsSync(dirPath)) return results;

    // 检查当前目录是否是 JDK 目录
    const jdk = await detectJdk(dirPath);
    if (jdk) {
      results.push(jdk);
      return results;
    }

    // 达到最大深度则停止
    if (depth >= maxDepth) return results;

    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || !entry.isDirectory()) continue;

      const fullPath = path.join(dirPath, entry.name);
      try {
        // 递归扫描子目录
        const childResults = await scanDirectory(fullPath, true, depth + 1, maxDepth);
        for (const child of childResults) {
          if (!results.some(r => r.path === child.path)) {
            results.push(child);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  return results;
}

async function scanAll() {
  const config = loadConfig();
  const allPaths = [...COMMON_SCAN_PATHS, ...(config.customPaths || [])];
  const results = [];
  const seen = new Set();

  for (const sp of allPaths) {
    try {
      // 每个路径加超时处理
      const jdks = await Promise.race([
        scanDirectory(sp),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      for (const jdk of jdks) {
        if (!seen.has(jdk.path)) {
          seen.add(jdk.path);
          results.push(jdk);
        }
      }
    } catch (e) {
      console.error('Scan path failed:', sp, e.message);
    }
  }

  results.sort((a, b) => (parseInt(b.major) || 0) - (parseInt(a.major) || 0));
  return results;
}

function getCurrentJdk() {
  try {
    const out = execSync('reg query HKCU\\Environment /v JAVA_HOME 2>nul', { encoding: 'utf-8' });
    const m = out.match(/JAVA_HOME\s+REG_(?:EXPAND_)?SZ\s+(.+)/);
    if (m) {
      const p = m[1].trim();
      const info = detectJdk(p);
      if (info) return info;
    }
  } catch (_) {}
  if (process.env.JAVA_HOME) {
    const info = detectJdk(process.env.JAVA_HOME);
    if (info) return info;
  }
  return null;
}

function setEnv(name, value) {
  const regPath = 'HKCU\\Environment';
  const regType = name === 'PATH' ? 'REG_EXPAND_SZ' : 'REG_SZ';
  if (value) {
    execSync(`reg add "${regPath}" /v "${name}" /t ${regType} /d "${value}" /f`, { encoding: 'utf-8' });
  } else {
    try { execSync(`reg delete "${regPath}" /v "${name}" /f 2>nul`, { encoding: 'utf-8' }); } catch (_) {}
  }
}

function broadcastChange() {
  try {
    execSync('taskkill /f /im explorer.exe 2>nul', { timeout: 3000 });
    execSync('start explorer.exe', { shell: true, timeout: 3000 });
  } catch (_) {}
}

// IPC
ipcMain.handle('scan-jdks', async () => {
  try {
    return await scanAll();
  } catch (e) {
    console.error('Scan failed:', e);
    return [];
  }
});

ipcMain.handle('get-current-jdk', () => getCurrentJdk());

ipcMain.handle('switch-jdk', (_, jdkPath) => {
  try {
    const newBin = path.join(jdkPath, 'bin');

    // 记录切换前状态
    let prevHome = '';
    try {
      const out = execSync('reg query HKCU\\Environment /v JAVA_HOME 2>nul', { encoding: 'utf-8' });
      const m = out.match(/JAVA_HOME\s+REG_\w+\s+(.+)/);
      if (m) prevHome = m[1].trim();
    } catch (_) {}
    if (!prevHome) prevHome = process.env.JAVA_HOME || '(未设置)';

    let prevPath = '';
    try {
      const out = execSync('reg query HKCU\\Environment /v PATH 2>nul', { encoding: 'utf-8' });
      const m = out.match(/PATH\s+REG_(?:EXPAND_)?SZ\s+(.+)/);
      if (m) prevPath = m[1].trim();
    } catch (_) {}

    let prevJavaVer = '';
    try {
      const out = execSync('java -version 2>&1', { encoding: 'utf-8', timeout: 3000 });
      prevJavaVer = (out.split('\n')[0] || '').trim();
    } catch (_) {}

    // 1. 写 JAVA_HOME
    execSync(`reg add "HKCU\\Environment" /v JAVA_HOME /t REG_SZ /d "${jdkPath}" /f`, { encoding: 'utf-8' });
    process.env.JAVA_HOME = jdkPath;

    // 2. 读当前用户 PATH
    let userPath = '';
    try {
      const out = execSync('reg query HKCU\\Environment /v PATH 2>nul', { encoding: 'utf-8' });
      const m = out.match(/PATH\s+REG_(?:EXPAND_)?SZ\s+(.+)/);
      if (m) userPath = m[1].trim();
    } catch (_) {}

    // 3. 过滤含 JDK/JAVA/JRE 的 bin 路径
    const entries = userPath ? userPath.split(';').filter(Boolean) : [];
    const oldJdkBins = entries.filter(e => {
      const lower = e.toLowerCase();
      return (lower.includes('jdk') || lower.includes('java') || lower.includes('jre')) && lower.includes('bin');
    });
    const keep = entries.filter(e => !oldJdkBins.includes(e));

    // 4. 新 PATH = 目标bin + 剩余非JDK路径
    keep.unshift(newBin);
    const newPath = keep.join(';');

    // 5. 写回注册表
    execSync(`reg add "HKCU\\Environment" /v PATH /t REG_EXPAND_SZ /d "${newPath}" /f`, { encoding: 'utf-8' });

    // 6. 更新当前进程 PATH
    const sysPath = process.env.PATH || '';
    const curEntries = sysPath.split(';').filter(Boolean);
    const curKeep = curEntries.filter(e => !oldJdkBins.includes(e));
    if (!curKeep.includes(newBin)) curKeep.unshift(newBin);
    process.env.PATH = curKeep.join(';');

    // 7. 广播
    try {
      execSync('taskkill /f /im explorer.exe 2>nul', { timeout: 3000 });
      execSync('start explorer.exe', { shell: true, timeout: 3000 });
    } catch (_) {}

    // 8. 新进程验证
    let postJavaVer = '';
    try {
      const out = execSync('cmd /c java -version 2>&1', { encoding: 'utf-8', timeout: 5000 });
      postJavaVer = (out.split('\n')[0] || '').trim();
    } catch (_) {}
    let newHomeCheck = '';
    try {
      const out = execSync('cmd /c echo %JAVA_HOME%', { encoding: 'utf-8', timeout: 3000 });
      newHomeCheck = out.trim();
    } catch (_) {}
    let newJavaPath = '';
    try {
      const out = execSync('cmd /c where java 2>&1', { encoding: 'utf-8', timeout: 3000 });
      newJavaPath = (out.split('\n')[0] || '').trim();
    } catch (_) {}

    return {
      success: true,
      jdkPath,
      before: {
        javaHome: prevHome,
        path: prevPath || '(无用户 PATH)',
        javaVer: prevJavaVer || '(无法读取)',
      },
      after: {
        javaHome: jdkPath,
        path: newPath,
      },
      verification: {
        javaHome: newHomeCheck,
        javaPath: newJavaPath,
        javaVer: postJavaVer,
        newHomeMatch: newHomeCheck.trim() === jdkPath,
        newJavaMatch: newJavaPath.toLowerCase().includes(newBin.toLowerCase()),
        newVerMatch: postJavaVer.includes('version'),
      },
      removedBins: oldJdkBins,
    };
  } catch (e) {
    return { success: false, error: String(e.message || e) };
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择 JDK 安装目录',
  });
  if (!result.canceled && result.filePaths.length > 0) return result.filePaths[0];
  return null;
});

ipcMain.handle('add-custom-path', (_, customPath) => {
  const config = loadConfig();
  if (!config.customPaths.includes(customPath)) {
    config.customPaths.push(customPath);
    saveConfig(config);
  }
  return config.customPaths;
});

ipcMain.handle('remove-custom-path', (_, customPath) => {
  const config = loadConfig();
  config.customPaths = config.customPaths.filter(p => p !== customPath);
  saveConfig(config);
  return config.customPaths;
});

ipcMain.handle('get-custom-paths', () => {
  return (loadConfig().customPaths || []);
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const data = await new Promise((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url: 'https://api.github.com/repos/ChanYeeSum/javaswitcher/releases/latest',
        headers: { 'User-Agent': 'JDK-Switcher' },
      });
      request.on('response', (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          if (response.statusCode === 200) {
            try { resolve(JSON.parse(body)); }
            catch { reject(new Error('Invalid JSON')); }
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      });
      request.on('error', (err) => reject(err));
      request.setTimeout(5000, () => { request.destroy(); reject(new Error('timeout')); });
      request.end();
    });

    const latestVersion = data.tag_name.replace(/^v/, '');
    const currentVersion = APP_VERSION;
    const hasUpdate = latestVersion !== currentVersion;
    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseNotes: data.body,
      downloadUrl: data.html_url,
    };
  } catch (e) {
    console.error('Check update failed:', e);
    return { hasUpdate: false, error: e.message };
  }
});

ipcMain.handle('check-permissions', () => {
  try {
    execSync('reg add "HKCU\\Environment" /v _JDK_SWITCHER_TEST /t REG_SZ /d "ok" /f', { encoding: 'utf-8' });
    execSync('reg delete "HKCU\\Environment" /v _JDK_SWITCHER_TEST /f 2>nul', { encoding: 'utf-8' });
    return { writable: true };
  } catch (e) {
    return { writable: false, error: e.message };
  }
});

ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window-close', () => mainWindow.close());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
