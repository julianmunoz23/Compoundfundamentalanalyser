// Vercel Serverless Function — /api/latam-price
// Proxies Yahoo Finance for LATAM + European stocks
// Usage: /api/latam-price?symbol=MC.PA  or  TERPEL.CL  or  PETR4.SA

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300'); // cache 5 min

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Inversoria/1.0)',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return res.status(response.status).json({ error: 'Yahoo Finance error' });

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'Symbol not found' });

    const meta = result.meta;
    const price = meta?.regularMarketPrice || meta?.previousClose;
    const change = meta?.regularMarketChange || 0;
    const changePct = meta?.regularMarketChangePercent || 0;
    const currency = meta?.currency || 'USD';

    if (!price) return res.status(404).json({ error: 'No price data' });

    return res.status(200).json({ price, change, changePct, currency, symbol });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
