// /api/analyze.js — Proxy seguro para Anthropic con rate limiting
// La ANTHROPIC_KEY NUNCA llega al browser

// Rate limit: max 50 requests per IP per hour
const rateLimitMap = new Map();
const RATE_LIMIT = 50;
const WINDOW_MS = 60 * 60 * 1000; // 1 hora

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

// Clean old entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.start > WINDOW_MS) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  // Rate limiting por IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
          || req.headers['x-real-ip'] 
          || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Demasiadas consultas. Espera un momento e intenta de nuevo.',
      retryAfter: 3600
    });
  }

  const key = process.env.ANTHROPIC_KEY;
  if (!key) return res.status(500).json({error: 'API not configured'});

  try {
    const body = req.body;
    if (!body?.messages?.length) return res.status(400).json({error: 'Invalid request'});
    if (!body.model) body.model = 'claude-sonnet-4-6-20250514';
    if (!body.max_tokens) body.max_tokens = 1400;

    // Cap max_tokens para evitar abuso
    if (body.max_tokens > 3500) body.max_tokens = 3500;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    console.error('Analyze proxy error:', err);
    return res.status(500).json({error: 'Analysis service unavailable'});
  }
}
