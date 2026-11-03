const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DB_PATH || path.join(dataDir, 'store.db');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  purchase_price REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  stock REAL DEFAULT 0,
  min_stock REAL DEFAULT 0,
  specs TEXT DEFAULT '{}',
  image TEXT,
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('customer','supplier')),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  balance REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('sale','purchase')),
  number TEXT UNIQUE NOT NULL,
  party_id INTEGER REFERENCES parties(id) ON DELETE SET NULL,
  date TEXT DEFAULT (datetime('now', 'localtime')),
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  notes TEXT,
  user_id INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty REAL NOT NULL,
  price REAL NOT NULL,
  cost REAL DEFAULT 0,
  total REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  date TEXT DEFAULT (datetime('now', 'localtime')),
  note TEXT,
  user_id INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'pc' CHECK (type IN ('pc','streamer')),
  price REAL,                     -- NULL = سعر تلقائي من مجموع الأصناف
  items TEXT NOT NULL DEFAULT '[]', -- JSON: [{product_id, qty, label}]
  image TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  source TEXT DEFAULT 'build',
  items TEXT NOT NULL DEFAULT '[]',
  total REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','done','cancelled')),
  seen INTEGER DEFAULT 0,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// ===== ترقية آمنة لقواعد قديمة =====
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
ensureColumn('categories', 'slug', 'slug TEXT');
ensureColumn('products', 'specs', "specs TEXT DEFAULT '{}'");
ensureColumn('products', 'image', 'image TEXT');
ensureColumn('products', 'featured', 'featured INTEGER DEFAULT 0');
ensureColumn('bundles', 'name_en', 'name_en TEXT');
ensureColumn('bundles', 'description_en', 'description_en TEXT');
ensureColumn('categories', 'name_en', 'name_en TEXT');

// ===== الإعدادات (مفتاح OpenAI يبقى على السيرفر فقط) =====
const getSetting = (key, def = null) => {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return r ? r.value : def;
};
const setSetting = (key, value) => {
  db.prepare('INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value == null ? null : String(value));
};
const SETTING_DEFAULTS = {
  shop_name: 'Computer DOS Store',
  shop_phone: '',
  shop_address: '',
  currency: 'EGP',
  ai_chat_model: 'gpt-4o-mini',
  ai_image_model: 'gpt-image-1',
};
for (const [k, v] of Object.entries(SETTING_DEFAULTS)) if (getSetting(k) == null) setSetting(k, v);

// ===== الفئات المعروفة بـ slugs (تقود المُجمّع وقواعد التوافق) =====
const KNOWN_CATEGORIES = [
  ['معالجات', 'cpu'], ['كروت شاشة', 'gpu'], ['لوحات أم', 'motherboard'], ['رامات', 'ram'],
  ['أقراص تخزين', 'storage'], ['مزودات طاقة', 'psu'], ['صناديق كمبيوتر', 'case'],
  ['مبردات معالج', 'cpu_cooler'], ['شاشات', 'monitor'], ['كيبورد', 'keyboard'],
  ['ماوس', 'mouse'], ['سماعات', 'headset'], ['ميكروفونات', 'mic'], ['كاميرات', 'webcam'],
  ['كروت التقاط', 'capture_card'], ['إضاءة وستريب RGB', 'lights'], ['إكسسوارات', 'accessories'], ['أخرى', 'other'],
];

{
  const ins = db.prepare('INSERT INTO categories (name, slug) VALUES (?,?)');
  const updSlug = db.prepare('UPDATE categories SET slug = ? WHERE id = ?');
  const byName = db.prepare('SELECT id, slug FROM categories WHERE name = ?');
  const bySlug = db.prepare('SELECT id FROM categories WHERE slug = ?');
  for (const [name, slug] of KNOWN_CATEGORIES) {
    const row = byName.get(name);
    if (row) { if (!row.slug) updSlug.run(slug, row.id); continue; }
    if (bySlug.get(slug)) continue;
    ins.run(name, slug);
  }
}

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

// Seed default admin user on first run
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?,?,?)')
    .run('admin', hashPassword('admin123'), 'admin');
  console.log('Seeded default user: admin / admin123  (غيّر كلمة المرور بعد أول دخول)');
}

// ===== بيانات تجريبية: قطع متوافقة بمواصفات واقعية + باندلز =====
// تُضاف القطع الناقصة فقط (حسب code) — لا تُحذف أو تُعدّل بيانات موجودة
const demoExists = db.prepare("SELECT COUNT(*) c FROM products WHERE code LIKE 'CPU-%'").get().c;
if (demoExists === 0) {
  const catId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)?.id || null;
  const ins = db.prepare(
    `INSERT INTO products (code, name, category_id, purchase_price, sale_price, stock, min_stock, specs, image, featured)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  const demo = [
    // [slug, code, name, purchase, sale, stock, specs, image]
    ['cpu', 'CPU-12400F', 'Intel Core i5-12400F', 5200, 6100, 8, { socket: 'LGA1700', tdp: 65 }],
    ['cpu', 'CPU-5600', 'AMD Ryzen 5 5600', 4300, 5100, 10, { socket: 'AM4', tdp: 65 }],
    ['cpu', 'CPU-7600X', 'AMD Ryzen 5 7600X', 7800, 9200, 5, { socket: 'AM5', tdp: 105 }],
    ['motherboard', 'MB-B660M-D4', 'MSI PRO B660M-A DDR4', 3900, 4700, 6, { socket: 'LGA1700', ram_type: 'DDR4', form_factor: 'mATX', m2_slots: 2, ram_slots: 4 }],
    ['motherboard', 'MB-B550M', 'Gigabyte B550M DS3H', 3400, 4100, 7, { socket: 'AM4', ram_type: 'DDR4', form_factor: 'mATX', m2_slots: 2, ram_slots: 4 }],
    ['motherboard', 'MB-B650-5', 'ASUS TUF B650-PLUS DDR5', 6200, 7400, 4, { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX', m2_slots: 3, ram_slots: 4 }],
    ['ram', 'RAM-16-D4', 'Corsair Vengeance 16GB (2x8) DDR4 3200', 1250, 1550, 15, { ram_type: 'DDR4', size_gb: 16, modules: 2 }],
    ['ram', 'RAM-32-D5', 'Kingston Fury 32GB (2x16) DDR5 5600 RGB', 3400, 4100, 9, { ram_type: 'DDR5', size_gb: 32, modules: 2 }],
    ['gpu', 'GPU-4060', 'NVIDIA RTX 4060 8GB Dual', 11500, 13200, 6, { tdp: 115, length_mm: 240 }],
    ['gpu', 'GPU-3060', 'NVIDIA RTX 3060 12GB', 8600, 9900, 5, { tdp: 170, length_mm: 242 }],
    ['gpu', 'GPU-6600', 'AMD RX 6600 8GB', 7200, 8400, 4, { tdp: 132, length_mm: 237 }],
    ['storage', 'SSD-1TB-NVME', 'Samsung 980 NVMe 1TB M.2', 2400, 2900, 12, { type: 'NVMe', capacity_gb: 1000 }],
    ['storage', 'SSD-512-SATA', 'Kingston A400 SSD 512GB SATA', 950, 1200, 14, { type: 'SATA', capacity_gb: 512 }],
    ['psu', 'PSU-650-B', 'Corsair CV650 650W Bronze', 1900, 2350, 10, { watts: 650 }],
    ['psu', 'PSU-750-G', 'Seasonic Focus 750W Gold', 3200, 3900, 6, { watts: 750 }],
    ['case', 'CASE-ATX-RGB', 'DeepCool Matrexx 55 RGB ATX', 1500, 1900, 8, { form_factors: ['ATX', 'mATX', 'ITX'], gpu_max_mm: 370, cooler_max_mm: 168 }],
    ['case', 'CASE-MATX', 'Antec NX200M mATX RGB', 1100, 1400, 9, { form_factors: ['mATX', 'ITX'], gpu_max_mm: 330, cooler_max_mm: 160 }],
    ['cpu_cooler', 'COOL-400', 'DeepCool AG400 ARGB Tower', 850, 1100, 10, { sockets: ['LGA1700', 'AM4', 'AM5'], height_mm: 150 }],
    ['monitor', 'MON-27-165', 'LG UltraGear 27" 165Hz IPS', 6200, 7300, 5, { size: 27, hz: 165 }],
    ['keyboard', 'KB-MECH-RGB', 'Redragon K552 RGB Mechanical', 900, 1150, 15, {}],
    ['mouse', 'MS-G502', 'Logitech G502 HERO', 1400, 1750, 12, {}],
    ['headset', 'HS-CLOUD', 'HyperX Cloud Stinger 2', 1500, 1900, 8, {}],
    ['mic', 'MIC-QUAD', 'HyperX QuadCast S RGB USB', 4800, 5600, 4, {}],
    ['webcam', 'CAM-C920', 'Logitech C920 HD Pro', 2600, 3100, 7, {}],
    ['capture_card', 'CC-HD60X', 'Elgato HD60 X 4K60 Capture', 7500, 8900, 3, {}],
    ['lights', 'LT-GOVEE-RGB', 'Govee RGBIC LED Strip 5m', 750, 980, 11, {}],
    ['accessories', 'ACC-ARMS', 'Boom Arm Microphone Stand', 550, 750, 10, {}],
  ];
  for (const [slug, code, name, pp, sp, st, specs] of demo) {
    ins.run(code, name, catId(slug), pp, sp, st, 2, JSON.stringify(specs), null, 0);
  }
  console.log('Seeded demo PC parts catalog');
}

const bundleCount = db.prepare('SELECT COUNT(*) c FROM bundles').get().c;
if (bundleCount === 0 && db.prepare("SELECT COUNT(*) c FROM products WHERE code='CPU-12400F'").get().c > 0) {
  const pid = (code) => db.prepare('SELECT id FROM products WHERE code = ?').get(code)?.id;
  const insB = db.prepare('INSERT INTO bundles (name, description, type, price, items, active) VALUES (?,?,?,?,?,1)');
  insB.run(
    'تجميعة ألعاب متوسطة 1080p',
    'معالج i5-12400F + كرت RTX 4060 + رام 16GB — أداء ممتاز لكل الألعاب الحديثة على 1080p',
    'pc', null,
    JSON.stringify([
      { product_id: pid('CPU-12400F'), qty: 1 }, { product_id: pid('MB-B660M-D4'), qty: 1 },
      { product_id: pid('RAM-16-D4'), qty: 1 }, { product_id: pid('GPU-4060'), qty: 1 },
      { product_id: pid('SSD-1TB-NVME'), qty: 1 }, { product_id: pid('PSU-650-B'), qty: 1 },
      { product_id: pid('CASE-ATX-RGB'), qty: 1 }, { product_id: pid('COOL-400'), qty: 1 },
    ])
  );
  insB.run(
    'سيتب ستريمر كامل',
    'PC ستريمنج قوي + ميك QuadCast + كاميرا C920 + إضاءة RGB — كل ما يحتاجه الستريمر للانطلاق',
    'streamer', null,
    JSON.stringify([
      { product_id: pid('CPU-7600X'), qty: 1 }, { product_id: pid('MB-B650-5'), qty: 1 },
      { product_id: pid('RAM-32-D5'), qty: 1 }, { product_id: pid('GPU-4060'), qty: 1 },
      { product_id: pid('SSD-1TB-NVME'), qty: 1 }, { product_id: pid('PSU-750-G'), qty: 1 },
      { product_id: pid('CASE-ATX-RGB'), qty: 1 }, { product_id: pid('COOL-400'), qty: 1 },
      { product_id: pid('MIC-QUAD'), qty: 1 }, { product_id: pid('CAM-C920'), qty: 1 },
      { product_id: pid('LT-GOVEE-RGB'), qty: 2 }, { product_id: pid('ACC-ARMS'), qty: 1 },
    ])
  );
}

// أسماء إنجليزية للفئات والباندلز التجريبية
{
  const en = {
    cpu: 'Processors', gpu: 'Graphics Cards', motherboard: 'Motherboards', ram: 'Memory (RAM)', storage: 'Storage',
    psu: 'Power Supplies', case: 'Cases', cpu_cooler: 'CPU Coolers', monitor: 'Monitors', keyboard: 'Keyboards',
    mouse: 'Mice', headset: 'Headsets', mic: 'Microphones', webcam: 'Webcams', capture_card: 'Capture Cards',
    lights: 'RGB Lighting', accessories: 'Accessories', other: 'Other',
  };
  const upd = db.prepare('UPDATE categories SET name_en = ? WHERE slug = ? AND name_en IS NULL');
  for (const [slug, name] of Object.entries(en)) upd.run(name, slug);
  db.prepare(`UPDATE bundles SET name_en = 'Mid-Range 1080p Gaming Build',
    description_en = 'i5-12400F + RTX 4060 + 16GB RAM — excellent performance in every modern game at 1080p'
    WHERE name = 'تجميعة ألعاب متوسطة 1080p' AND name_en IS NULL`).run();
  db.prepare(`UPDATE bundles SET name_en = 'Complete Streamer Setup',
    description_en = 'Powerful streaming PC + QuadCast mic + C920 webcam + RGB lighting — everything you need to go live'
    WHERE name = 'سيتب ستريمر كامل' AND name_en IS NULL`).run();
}

module.exports = { db, hashPassword, verifyPassword, getSetting, setSetting };
