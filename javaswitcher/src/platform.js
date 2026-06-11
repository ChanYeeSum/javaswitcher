/**
 * Platform utilities for JDK Switcher.
 * This module isolates OS‑specific operations such as scanning JDK installations
 * and switching the active JDK. Extracting the logic makes the codebase more
 * maintainable and prepares the project for cross‑platform extensions.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ---------------------------------------------------------------------------
// Configuration – common scan paths for Windows. macOS / Linux can extend this
// array via `customPaths` in the config file.
// ---------------------------------------------------------------------------
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

/**
 * Parse the output of `java -version` and return an object with the raw version
 * string and the major version number.
 */
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

/** Detect a JDK installation at `jdkPath`. Returns null if not a JDK. */
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
    vendor,
    isJdk: fs.existsSync(javacExe),
  };
}

/** Recursive directory scan with depth limit (default 3). */
async function scanDirectory(dirPath, recursive = false, depth = 0, maxDepth = 3) {
  const results = [];
  try {
    if (!fs.existsSync(dirPath)) return results;

    const jdk = await detectJdk(dirPath);
    if (jdk) {
      results.push(jdk);
      return results;
    }

    if (depth >= maxDepth) return results;

    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || !entry.isDirectory()) continue;
      const fullPath = path.join(dirPath, entry.name);
      try {
        const childResults = await scanDirectory(fullPath, true, depth + 1, maxDepth);
        for (const child of childResults) {
          if (!results.some(r => r.path === child.path)) results.push(child);
        }
      } catch (_) {}
    }
  } catch (_) {}
  return results;
}

/** Scan all configured paths (common + custom). */
async function scanAll(customPaths = []) {
  const allPaths = [...COMMON_SCAN_PATHS, ...customPaths];
  const results = [];
  const seen = new Set();
  for (const sp of allPaths) {
    try {
      const jdks = await scanDirectory(sp);
      for (const jdk of jdks) {
        if (!seen.has(jdk.path)) {
          seen.add(jdk.path);
          results.push(jdk);
        }
      }
    } catch (_) {}
  }
  results.sort((a, b) => (parseInt(b.major) || 0) - (parseInt(a.major) || 0));
  return results;
}

/** Helper to read current JDK from environment / registry. */
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

module.exports = {
  COMMON_SCAN_PATHS,
  parseJavaVersion,
  detectJdk,
  scanDirectory,
  scanAll,
  getCurrentJdk,
};
};
