// /api/fundamentals.js — Vercel serverless function
// Fetches real fundamentals from Yahoo Finance for any ticker
// Used to enrich AI analysis with current data (P/E, EPS, margins, analyst consensus)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  try {
    // Yahoo Finance quoteSummary — returns fundamentals + analyst data
    const modules = "financialData,defaultKeyStatistics,summaryDetail,recommendationTrend";
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return res.status(200).json({ error: "Yahoo unavailable", symbol });
    }

    const data = await response.json();
    const r = data?.quoteSummary?.result?.[0];
    if (!r) return res.status(200).json({ error: "No data", symbol });

    const fd = r.financialData || {};
    const ks = r.defaultKeyStatistics || {};
    const sd = r.summaryDetail || {};
    const rt = r.recommendationTrend?.trend?.[0] || {}; // most recent period

    // Extract and clean the data
    const fundamentals = {
      // Valuation
      trailingPE:       fd.trailingPE?.raw        || null,
      forwardPE:        fd.forwardPE?.raw          || null,
      priceToBook:      ks.priceToBook?.raw        || null,
      evToEbitda:       ks.enterpriseToEbitda?.raw || null,

      // Profitability (as %)
      grossMargins:     fd.grossMargins?.raw   ? +(fd.grossMargins.raw   * 100).toFixed(1) : null,
      operatingMargins: fd.operatingMargins?.raw? +(fd.operatingMargins.raw*100).toFixed(1) : null,
      profitMargins:    fd.profitMargins?.raw  ? +(fd.profitMargins.raw  * 100).toFixed(1) : null,
      returnOnEquity:   fd.returnOnEquity?.raw ? +(fd.returnOnEquity.raw * 100).toFixed(1) : null,
      returnOnAssets:   fd.returnOnAssets?.raw ? +(fd.returnOnAssets.raw * 100).toFixed(1) : null,

      // Growth
      revenueGrowthYoY: fd.revenueGrowth?.raw  ? +(fd.revenueGrowth.raw  * 100).toFixed(1) : null,
      earningsGrowthYoY:fd.earningsGrowth?.raw ? +(fd.earningsGrowth.raw * 100).toFixed(1) : null,

      // Cash & Debt
      totalCashPerShare:fd.totalCashPerShare?.raw  || null,
      debtToEquity:     fd.debtToEquity?.raw       || null,
      freeCashflow:     fd.freeCashflow?.raw        || null,
      operatingCashflow:fd.operatingCashflow?.raw  || null,
      totalRevenue:     fd.totalRevenue?.raw        || null,

      // EPS
      trailingEps:      ks.trailingEps?.raw || null,
      forwardEps:       ks.forwardEps?.raw  || null,

      // Analyst consensus (real)
      recommendationKey: fd.recommendationKey || null,   // "buy", "hold", "sell", "strongBuy"
      numberOfAnalysts:  fd.numberOfAnalystOpinions?.raw || null,
      targetMeanPrice:   fd.targetMeanPrice?.raw  || null,
      targetHighPrice:   fd.targetHighPrice?.raw  || null,
      targetLowPrice:    fd.targetLowPrice?.raw   || null,
      targetMedianPrice: fd.targetMedianPrice?.raw || null,

      // Recommendation trend breakdown (last period)
      analystBreakdown: rt ? {
        strongBuy:  rt.strongBuy  || 0,
        buy:        rt.buy        || 0,
        hold:       rt.hold       || 0,
        sell:       rt.sell       || 0,
        strongSell: rt.strongSell || 0,
      } : null,

      // Meta
      symbol,
      source: "Yahoo Finance",
      fetchedAt: new Date().toISOString(),
    };

    // Cache for 6 hours (market closes, data stays fresh)
    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
    return res.status(200).json(fundamentals);

  } catch (err) {
    console.error("Fundamentals error:", err);
    return res.status(200).json({ error: err.message, symbol });
  }
}
