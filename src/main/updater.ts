import { app, dialog, shell, BrowserWindow } from 'electron';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';

const GITHUB_OWNER = 'ohjey';
const GITHUB_REPO = 'batched-app';

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function fetchJSON<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Batched-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode === 404) {
        reject(new Error('No releases found'));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url: string, destPath: string, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const request = (downloadUrl: string) => {
      https.get(downloadUrl, { headers: { 'User-Agent': 'Batched-App' } }, (res) => {
        // Handle redirects
        if (res.statusCode === 302 || res.statusCode === 301) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }

        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0 && onProgress) {
            onProgress(Math.round((downloadedSize / totalSize) * 100));
          }
        });

        res.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

function unzip(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const unzipProcess = spawn('unzip', ['-o', zipPath, '-d', destDir]);

    unzipProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`unzip exited with code ${code}`));
      }
    });

    unzipProcess.on('error', reject);
  });
}

export async function checkForUpdates(silent = false): Promise<void> {
  const currentVersion = app.getVersion();
  const mainWindow = BrowserWindow.getFocusedWindow();

  try {
    const release = await fetchJSON<GitHubRelease>(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );

    const latestVersion = release.tag_name.replace(/^v/, '');

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'No Updates Available',
          message: 'You\'re up to date!',
          detail: `Batched ${currentVersion} is the latest version.`,
          buttons: ['OK']
        });
      }
      return;
    }

    // Find the macOS zip asset
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    const asset = release.assets.find(a =>
      a.name.includes('darwin') && a.name.includes(arch) && a.name.endsWith('.zip')
    );

    if (!asset) {
      // Fallback: try any darwin zip
      const fallbackAsset = release.assets.find(a =>
        a.name.includes('darwin') && a.name.endsWith('.zip')
      );

      if (!fallbackAsset) {
        if (!silent) {
          const result = await dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: `Version ${latestVersion} is available`,
            detail: 'No automatic download available for your system. Would you like to download manually?',
            buttons: ['Download', 'Later']
          });

          if (result.response === 0) {
            shell.openExternal(release.html_url);
          }
        }
        return;
      }
    }

    const downloadAsset = asset || release.assets.find(a =>
      a.name.includes('darwin') && a.name.endsWith('.zip')
    );

    if (!downloadAsset) {
      return;
    }

    // Ask user if they want to download
    const downloadChoice = await dialog.showMessageBox(mainWindow || undefined, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${latestVersion} is available`,
      detail: `You have version ${currentVersion}. Would you like to download the update?`,
      buttons: ['Download', 'Later']
    });

    if (downloadChoice.response !== 0) {
      return;
    }

    // Download the update
    const tempDir = app.getPath('temp');
    const zipPath = path.join(tempDir, `batched-update-${latestVersion}.zip`);
    const extractDir = path.join(tempDir, `batched-update-${latestVersion}`);

    // Show progress dialog
    let progressDialog: Electron.MessageBoxReturnValue | null = null;

    dialog.showMessageBox(mainWindow || undefined, {
      type: 'info',
      title: 'Downloading Update',
      message: 'Downloading update...',
      detail: 'Please wait while the update is being downloaded.',
      buttons: []
    }).then(result => progressDialog = result);

    await downloadFile(downloadAsset.browser_download_url, zipPath);

    // Extract the zip
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    await unzip(zipPath, extractDir);

    // Find the .app bundle in the extracted directory
    const extractedContents = fs.readdirSync(extractDir);
    const appBundle = extractedContents.find(f => f.endsWith('.app'));

    if (!appBundle) {
      throw new Error('Could not find app bundle in downloaded update');
    }

    const newAppPath = path.join(extractDir, appBundle);

    // Get the current app path
    const currentAppPath = app.getAppPath();
    // Navigate up to find the .app bundle
    let appBundlePath = currentAppPath;
    while (!appBundlePath.endsWith('.app') && appBundlePath !== '/') {
      appBundlePath = path.dirname(appBundlePath);
    }

    if (!appBundlePath.endsWith('.app')) {
      // Running in development mode
      throw new Error('Cannot update in development mode');
    }

    // Ask user to confirm installation
    const installChoice = await dialog.showMessageBox(mainWindow || undefined, {
      type: 'info',
      title: 'Ready to Install',
      message: `Version ${latestVersion} is ready to install.`,
      detail: 'After restart, macOS may ask you to allow the app in System Preferences > Privacy & Security.',
      buttons: ['Install & Restart', 'Later']
    });

    if (installChoice.response !== 0) {
      // Clean up
      fs.unlinkSync(zipPath);
      fs.rmSync(extractDir, { recursive: true });
      return;
    }

    // Perform the update
    const backupPath = `${appBundlePath}.backup`;

    try {
      // Remove old backup if exists (use shell to avoid asar issues)
      if (fs.existsSync(backupPath)) {
        execSync(`rm -rf "${backupPath}"`);
      }

      // Move current app to backup
      fs.renameSync(appBundlePath, backupPath);

      // Move new app to original location
      fs.renameSync(newAppPath, appBundlePath);

      // Clean up
      fs.unlinkSync(zipPath);
      fs.rmSync(extractDir, { recursive: true });
      execSync(`rm -rf "${backupPath}"`);

      // Restart the app
      app.relaunch();
      app.quit();

    } catch (err) {
      // Restore backup if something went wrong
      if (fs.existsSync(backupPath) && !fs.existsSync(appBundlePath)) {
        fs.renameSync(backupPath, appBundlePath);
      }
      throw err;
    }

  } catch (error) {
    if (!silent) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not check for updates',
        detail: error instanceof Error ? error.message : 'Unknown error',
        buttons: ['OK']
      });
    }
    console.error('Update check failed:', error);
  }
}
