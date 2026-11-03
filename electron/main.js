const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const configPath = () => path.join(app.getPath('userData'), 'config.json');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(configPath(), 'utf8')); } catch { return {}; }
}
function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2));
}

let win;

function createWindow(url) {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#06061a',
    title: 'Computer DOS Store',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  openSection('admin', url);
}

// تطبيق سطح المكتب يفتح لوحة التحكم افتراضياً، ويمكن التبديل للمتجر من القائمة
function openSection(section = 'admin', base = readConfig().serverUrl) {
  if (!win) return;
  if (!base) return showConnect();
  win.loadURL(section === 'admin' ? `${base}/admin` : base).catch(() => showConnect());
}

function showConnect() {
  if (!win) return;
  win.loadFile(path.join(__dirname, 'connect.html'));
}

ipcMain.handle('get-config', () => readConfig());
ipcMain.handle('connect', async (_e, url) => {
  let u = String(url || '').trim();
  if (!u) return { ok: false, error: 'أدخل عنوان السيرفر' };
  if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
  u = u.replace(/\/+$/, '');
  // تحقق أن السيرفر يعمل
  try {
    const res = await fetch(`${u}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error();
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بالسيرفر — تأكد من تشغيله وصحة العنوان' };
  }
  const cfg = readConfig();
  cfg.serverUrl = u;
  writeConfig(cfg);
  openSection('admin', u);
  return { ok: true };
});

function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'القائمة / Menu',
      submenu: [
        { label: 'لوحة التحكم / Admin panel', accelerator: 'CmdOrCtrl+1', click: () => openSection('admin') },
        { label: 'المتجر / Store', accelerator: 'CmdOrCtrl+2', click: () => openSection('store') },
        { type: 'separator' },
        { label: 'تغيير عنوان السيرفر / Change server', click: () => showConnect() },
        { type: 'separator' },
        { label: 'إعادة تحميل', role: 'reload' },
        { label: 'أدوات المطور', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'خروج', role: 'quit' },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  buildMenu();
  const { serverUrl } = readConfig();
  createWindow(serverUrl);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(readConfig().serverUrl);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
