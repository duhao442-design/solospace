const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: true,
    title: 'aMoneySystem - 复式记账'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  db = new Database();
  db.init();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('db:query', async (event, sql, params = []) => {
  return db.query(sql, params);
});

ipcMain.handle('db:run', async (event, sql, params = []) => {
  return db.run(sql, params);
});

ipcMain.handle('db:get', async (event, sql, params = []) => {
  return db.get(sql, params);
});

ipcMain.handle('db:all', async (event, sql, params = []) => {
  return db.all(sql, params);
});

ipcMain.handle('data:export', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出数据',
    defaultPath: `amoneysystem_backup_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });

  if (result.canceled) return null;

  const data = db.exportAllData();
  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
  return result.filePath;
});

ipcMain.handle('data:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入数据',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (result.canceled) return null;

  const content = fs.readFileSync(result.filePaths[0], 'utf-8');
  const data = JSON.parse(content);
  db.importAllData(data);
  return true;
});

ipcMain.handle('data:clear', async () => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: '确认清空',
    message: '确定要清空所有数据吗？此操作不可恢复！',
    buttons: ['取消', '确定'],
    defaultId: 0
  });

  if (result.response === 1) {
    db.clearAllData();
    return true;
  }
  return false;
});
