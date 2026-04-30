// /api/email.js — Proxy seguro para Resend
// La RESEND_KEY NUNCA llega al browser
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.inversoria.lat');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const key = process.env.RESEND_KEY;
  if (!key) return res.status(500).json({error: 'Email service not configured'});

  try {
    const body = req.body;
    if (!body?.to || !body?.subject) return res.status(400).json({error: 'Invalid request'});

    // Force sender to always be Inversoria — prevent spoofing
    body.from = 'Inversoria <noreply@inversoria.lat>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    console.error('Email proxy error:', err);
    return res.status(500).json({error: 'Email service unavailable'});
  }
}
