// /api/earnings.js — Próximos earnings de una acción via Finnhub
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600'); // cache 1 hora

  const key = process.env.FINNHUB_KEY;
  if(!key) return res.status(500).json({error: 'API not configured'});

  const { symbol } = req.query;
  if(!symbol) return res.status(400).json({error: 'symbol required'});

  try {
    // Get earnings calendar for next 30 days
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 30);
    const from = today.toISOString().split('T')[0];
    const to = future.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&symbol=${encodeURIComponent(symbol)}&token=${key}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Inversoria/1.0' }
    });

    if(!response.ok) throw new Error(`Finnhub ${response.status}`);
    const data = await response.json();

    const earnings = (data.earningsCalendar || []).map(e => ({
      date: e.date,
      symbol: e.symbol,
      epsEstimate: e.epsEstimate,
      epsActual: e.epsActual,
      revenueEstimate: e.revenueEstimate,
      revenueActual: e.revenueActual,
      quarter: e.quarter,
      year: e.year,
    }));

    return res.status(200).json({ earnings, symbol });

  } catch(err) {
    console.error('Earnings error:', err);
    return res.status(200).json({ earnings: [], symbol });
  }
}
