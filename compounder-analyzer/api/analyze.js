// /api/prices.js — Proxy seguro para Finnhub
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if(req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const key = process.env.FINNHUB_KEY;
  if(!key) return res.status(500).json({error:'API not configured'});

  const { path, symbol, metric } = req.query;
  if(!symbol) return res.status(400).json({error:'symbol required'});

  const allowed = ['quote','stock/recommendation','stock/price-target',
    'stock/eps-estimate','stock/revenue-estimate','stock/metric'];
  const endpoint = path || 'quote';
  if(!allowed.includes(endpoint)) return res.status(400).json({error:'Invalid endpoint'});

  try {
    let urlPath = `/api/v1/${endpoint}?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    if(metric) urlPath += `&metric=${metric}`;

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'finnhub.io',
        path: urlPath,
        method: 'GET',
        headers: {'User-Agent': 'Inversoria/1.0'}
      };
      const req2 = https.request(options, (r) => {
        let chunks = '';
        r.on('data', d => chunks += d);
        r.on('end', () => {
          try { resolve(JSON.parse(chunks)); }
          catch(e) { reject(e); }
        });
      });
      req2.on('error', reject);
      req2.end();
    });

    return res.status(200).json(data);

  } catch(err) {
    console.error('Prices proxy error:', err);
    return res.status(500).json({error:'Price service unavailable'});
  }
};
