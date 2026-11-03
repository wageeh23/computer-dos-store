const crypto = require('node:crypto');
const { db } = require('./db');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'غير مصرح - سجل الدخول أولاً' });
  const row = db.prepare(
    `SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
  ).get(token);
  if (!row) return res.status(401).json({ error: 'انتهت الجلسة - سجل الدخول مجدداً' });
  req.user = row;
  next();
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, userId);
  return token;
}

function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

module.exports = { authMiddleware, createSession, destroySession };
