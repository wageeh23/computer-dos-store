const express = require('express');
const { db, verifyPassword, hashPassword } = require('../db');
const { createSession, destroySession, authMiddleware } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'أدخل اسم المستخدم وكلمة المرور' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  const token = createSession(user.id);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization.slice(7);
  destroySession(token);
  res.json({ ok: true });
});

router.post('/change-password', authMiddleware, (req, res) => {
  const { current, next } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!verifyPassword(current || '', user.password)) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  }
  if (!next || next.length < 6) return res.status(400).json({ error: 'كلمة المرور الجديدة قصيرة (6 أحرف على الأقل)' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(next), user.id);
  res.json({ ok: true });
});

module.exports = router;
