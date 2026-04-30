// /api/prices.js — Proxy seguro para Finnhub con rate limiting
// La FINNHUB_KEY NUNCA llega al browser

// Rate limit: max 60 requests per IP per hour
const rateLimitMap = new Map();
const RATE_LIMIT = 60;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.start > WINDOW_MS) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.inversoria.lat');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  // Rate limiting por IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
          || req.headers['x-real-ip']
          || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({error: 'Demasiadas consultas. Intenta más tarde.'});
  }

  const key = process.env.FINNHUB_KEY;
  if (!key) return res.status(500).json({error: 'API not configured'});

  const { path, symbol, metric } = req.query;
  if (!symbol) return res.status(400).json({error: 'symbol required'});

  const allowed = ['quote','stock/recommendation','stock/price-target',
    'stock/eps-estimate','stock/revenue-estimate','stock/metric'];
  const endpoint = path || 'quote';
  if (!allowed.includes(endpoint)) return res.status(400).json({error: 'Invalid endpoint'});

  try {
    let url = `https://finnhub.io/api/v1/${endpoint}?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    if (metric) url += `&metric=${metric}`;

    const response = await fetch(url, {
      headers: {'User-Agent': 'Inversoria/1.0'}
    });
    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Prices proxy error:', err);
    return res.status(500).json({error: 'Price service unavailable'});
  }
}
