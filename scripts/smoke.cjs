// فحص سريع للواجهة بمتصفح Electron مخفي: يلتقط أخطاء الكونسول وصور الشاشة
// الاستخدام (والسيرفر يعمل على 3000):
//   env -u ELECTRON_RUN_AS_NODE npx electron scripts/smoke.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'smoke-out');
// [name, url, localStorage, options{auth, boot, wait, scroll}]
const pages = [
  ['store-boot-screen', '/', { dos_lang: 'en', dos_theme: 'dark' }, { boot: true, wait: 1100 }],
  ['store-home-ar-dark', '/', { dos_lang: 'ar', dos_theme: 'dark' }, { wait: 2600 }],
  ['store-home-carousel-en', '/', { dos_lang: 'en', dos_theme: 'dark' }, { wait: 8400 }],
  ['store-home-en-dark-howitworks', '/', { dos_lang: 'en', dos_theme: 'dark' }, { wait: 2200, scroll: 1500 }],
  ['store-home-en-light-ai', '/', { dos_lang: 'en', dos_theme: 'light' }, { wait: 2200, scroll: 4300 }],
  ['store-megamenu-ar-dark', '/', { dos_lang: 'ar', dos_theme: 'dark' }, { wait: 2200, eval: `[...document.querySelectorAll('header button')].find(b=>/الأقسام/.test(b.innerText||''))?.click()`, evalWait: 1400 }],
  ['store-shop-en-light', '/shop', { dos_lang: 'en', dos_theme: 'light' }],
  ['store-shop-ar-dark', '/shop?cat=gpu', { dos_lang: 'ar', dos_theme: 'dark' }],
  ['store-builder-ar-dark', '/builder', { dos_lang: 'ar', dos_theme: 'dark' }],
  ['store-bundles-en-dark', '/bundles', { dos_lang: 'en', dos_theme: 'dark' }],
  ['store-streamer-ar-dark', '/streamer', { dos_lang: 'ar', dos_theme: 'dark' }],
  ['admin-login-en-dark', '/admin/login', { dos_lang: 'en', dos_theme: 'dark' }],
  ['admin-dashboard-ar-light', '/admin', { dos_lang: 'ar', dos_theme: 'light' }, { auth: true }],
  ['admin-dashboard-en-dark', '/admin', { dos_lang: 'en', dos_theme: 'dark' }, { auth: true }],
  ['admin-products-en-dark', '/admin/products', { dos_lang: 'en', dos_theme: 'dark' }, { auth: true }],
  ['admin-orders-ar-dark', '/admin/orders', { dos_lang: 'ar', dos_theme: 'dark' }, { auth: true }],
  ['admin-settings-en-light', '/admin/settings', { dos_lang: 'en', dos_theme: 'light' }, { auth: true }],
];

app.disableHardwareAcceleration();
app.on('window-all-closed', () => {}); // لا تخرج بين الصفحات
app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin123' }),
  }).then(r => r.json());

  let failures = 0;
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
  const repeat = +process.env.REPEAT || 1;
  const list = pages.filter(p => !only || only.test(p[0])).flatMap(p => Array.from({ length: repeat }, () => p));
  for (const [name, url, ls, opt = {}] of list) {
    const win = new BrowserWindow({ show: false, width: 1440, height: 900, webPreferences: { offscreen: true, partition: `smoke-${Date.now()}-${Math.random()}`, preload: path.join(__dirname, 'smoke-preload.cjs'), contextIsolation: false } });
    const errors = [];
    win.webContents.on('console-message', (_e, level, message) => { if (level >= 3) errors.push(message); });
    win.webContents.on('render-process-gone', () => errors.push('renderer crashed'));
    await win.loadURL(`${BASE}/api/health`).catch(() => {});
    const store = { ...ls, ...(opt.auth ? { dos_admin_token: login.token, dos_admin_user: JSON.stringify(login.user) } : {}) };
    await win.webContents.executeJavaScript(`
      Object.entries(${JSON.stringify(store)}).forEach(([k,v])=>localStorage.setItem(k,v));
      ${opt.boot ? "sessionStorage.removeItem('dos_booted')" : "sessionStorage.setItem('dos_booted','1')"}; true`);
    await win.loadURL(BASE + url);
    await new Promise(r => setTimeout(r, opt.wait || 2200));
    if (opt.eval) {
      await win.webContents.executeJavaScript(`${opt.eval}; true`).catch(() => {});
      await new Promise(r => setTimeout(r, opt.evalWait || 900));
    }
    if (opt.scroll) {
      await win.webContents.executeJavaScript(`window.scrollTo(0, ${opt.scroll}); true`);
      await new Promise(r => setTimeout(r, 1600));
    }
    const rootLen = await win.webContents.executeJavaScript('document.body.innerText.length || 0');
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG());
    const bad = errors.filter(e => !/fonts\.g|Failed to load resource/.test(e));
    if (bad.length || rootLen < 20) failures++;
    console.log(`${bad.length || rootLen < 20 ? 'FAIL' : 'OK  '} ${name} text=${rootLen}${bad.length ? '\n     ' + bad.join('\n     ') : ''}`);
    win.destroy();
  }
  console.log(failures ? `${failures} page(s) failed` : 'All pages rendered without errors');
  app.exit(failures ? 1 : 0);
});
