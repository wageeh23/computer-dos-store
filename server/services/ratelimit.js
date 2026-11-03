// حد بسيط للطلبات لكل IP — يحمي الواجهات العامة (خصوصاً تكلفة GPT)
function rateLimit({ max, windowMs }) {
  const hits = new Map();
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'x';
    const now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < windowMs);
    if (list.length >= max) {
      return res.status(429).json({ error: 'طلبات كثيرة — حاول بعد قليل / Too many requests, try again later' });
    }
    list.push(now);
    hits.set(ip, list);
    next();
  };
}

module.exports = { rateLimit };
