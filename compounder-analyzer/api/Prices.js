// /api/prices.js — Proxy seguro para Finnhub
// La FINNHUB_KEY NUNCA llega al browser
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if(req.method === "OPTIONS") return res.status(200).end();
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  const key = process.env.FINNHUB_KEY;
  if(!key) return res.status(500).json({error:"API not configured"});

  const { path, symbol, metric } = req.query;
  if(!symbol) return res.status(400).json({error:"symbol required"});

  const allowed = [
    "quote","stock/recommendation","stock/price-target",
    "stock/eps-estimate","stock/revenue-estimate","stock/metric"
  ];
  const endpoint = path || "quote";
  if(!allowed.includes(endpoint)) return res.status(400).json({error:"Invalid endpoint"});

  try {
    let url = `https://finnhub.io/api/v1/${endpoint}?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    if(metric) url += `&metric=${metric}`;

    const response = await fetch(url, {
      headers: {"User-Agent": "Inversoria/1.0"}
    });
    const data = await response.json();
    return res.status(200).json(data);

  } catch(err) {
    console.error("Prices proxy error:", err);
    return res.status(500).json({error:"Price service unavailable"});
  }
}
