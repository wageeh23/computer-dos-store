const express = require('express');
const path = require('node:path');
const os = require('node:os');
const { authMiddleware } = require('./auth');
const { uploadsDir } = require('./services/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '8mb' }));

// السماح بالاتصال من أي جهاز على الشبكة (الويب + تطبيق سطح المكتب + أندرويد)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// واجهات عامة للمتجر (بدون دخول)
app.use('/api/public', require('./routes/public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authMiddleware, require('./routes/products'));
app.use('/api', authMiddleware, require('./routes/parties'));
app.use('/api', authMiddleware, require('./routes/invoices'));
app.use('/api', authMiddleware, require('./routes/reports'));
app.use('/api', authMiddleware, require('./routes/bundles'));
app.use('/api', authMiddleware, require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// صور المنتجات المرفوعة والمولدة
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }), (req, res) => res.sendStatus(404));

// واجهتان منفصلتان: المتجر (index.html) ولوحة التحكم (admin.html)
const distDir = path.join(__dirname, '..', 'client', 'dist');
const notBuilt = (res) => (err) => {
  if (err) res.status(404).send('لم يتم بناء الواجهة بعد — شغّل: npm run build');
};
app.use(express.static(distDir, { index: false }));
app.get(/^\/admin(\/.*)?$/, (req, res) => res.sendFile(path.join(distDir, 'admin.html'), notBuilt(res)));
app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html'), notBuilt(res)));

app.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
  console.log(`\nComputer DOS Store server is running:`);
  console.log(`  Store:   http://localhost:${PORT}`);
  console.log(`  Admin:   http://localhost:${PORT}/admin`);
  for (const ip of ips) console.log(`  Network: http://${ip}:${PORT}`);
  console.log('');
});
