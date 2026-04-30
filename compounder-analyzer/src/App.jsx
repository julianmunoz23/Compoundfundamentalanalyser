// /api/analyze.js — Proxy seguro para Anthropic
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const key = process.env.ANTHROPIC_KEY;
  if(!key) return res.status(500).json({error:'API not configured'});

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if(!body?.messages?.length) return res.status(400).json({error:'Invalid request'});
    if(!body.model) body.model = 'claude-sonnet-4-20250514';
    if(!body.max_tokens) body.max_tokens = 1400;

    const payload = JSON.stringify(body);

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        }
      };
      const req2 = https.request(options, (r) => {
        let chunks = '';
        r.on('data', d => chunks += d);
        r.on('end', () => {
          try { resolve({status: r.statusCode, body: JSON.parse(chunks)}); }
          catch(e) { reject(e); }
        });
      });
      req2.on('error', reject);
      req2.write(payload);
      req2.end();
    });

    return res.status(data.status).json(data.body);

  } catch(err) {
    console.error('Analyze proxy error:', err);
    return res.status(500).json({error:'Analysis service unavailable'});
  }
};
