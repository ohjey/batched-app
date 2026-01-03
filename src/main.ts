import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { initDatabase, closeDatabase } from './main/database';
import { registerIpcHandlers } from './main/ipc-handlers';

const logFile = '/tmp/batched-debug.log';
function log(msg: string) {
  const line = `${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window with macOS-appropriate settings
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// Initialize database and IPC handlers
app.on('ready', () => {
  log('App ready, initializing...');
  try {
    log('Initializing database...');
    initDatabase();
    log('Database initialized');

    log('Registering IPC handlers...');
    registerIpcHandlers();
    log('IPC handlers registered');

    log('Creating window...');
    createWindow();
    log('Window created');
  } catch (error) {
    log(`Error during initialization: ${error}`);
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up database on quit
app.on('before-quit', () => {
  closeDatabase();
});
