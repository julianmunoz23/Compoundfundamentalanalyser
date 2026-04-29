// /api/fundamentals.js — Vercel serverless function
// Fetches real fundamentals from Yahoo Finance

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  // Try multiple Yahoo Finance endpoints — some work from server, some don't
  const endpoints = [
    // v8 quoteSummary — most complete
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData,defaultKeyStatistics,recommendationTrend`,
    // v7 quote — simpler, more reliable from servers
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
    // v6 — older endpoint, sometimes works when others don't
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData,defaultKeyStatistics,recommendationTrend`,
  ];

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Origin": "https://finance.yahoo.com",
    "Referer": "https://finance.yahoo.com/",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
  };

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;

      const data = await response.json();

      // Handle v10 quoteSummary response
      if (data?.quoteSummary?.result?.[0]) {
        const r = data.quoteSummary.result[0];
        const fd = r.financialData || {};
        const ks = r.defaultKeyStatistics || {};
        const rt = r.recommendationTrend?.trend?.[0] || {};

        const fundamentals = {
          trailingPE:        fd.trailingPE?.raw        || null,
          forwardPE:         fd.forwardPE?.raw          || null,
          grossMargins:      fd.grossMargins?.raw   != null ? +(fd.grossMargins.raw   * 100).toFixed(1) : null,
          operatingMargins:  fd.operatingMargins?.raw!= null ? +(fd.operatingMargins.raw*100).toFixed(1) : null,
          profitMargins:     fd.profitMargins?.raw  != null ? +(fd.profitMargins.raw  * 100).toFixed(1) : null,
          returnOnEquity:    fd.returnOnEquity?.raw != null ? +(fd.returnOnEquity.raw * 100).toFixed(1) : null,
          returnOnAssets:    fd.returnOnAssets?.raw != null ? +(fd.returnOnAssets.raw * 100).toFixed(1) : null,
          revenueGrowthYoY:  fd.revenueGrowth?.raw != null ? +(fd.revenueGrowth.raw  * 100).toFixed(1) : null,
          earningsGrowthYoY: fd.earningsGrowth?.raw!= null ? +(fd.earningsGrowth.raw * 100).toFixed(1) : null,
          debtToEquity:      fd.debtToEquity?.raw        || null,
          freeCashflow:      fd.freeCashflow?.raw        || null,
          totalRevenue:      fd.totalRevenue?.raw        || null,
          trailingEps:       ks.trailingEps?.raw         || null,
          forwardEps:        ks.forwardEps?.raw          || null,
          recommendationKey: fd.recommendationKey        || null,
          numberOfAnalysts:  fd.numberOfAnalystOpinions?.raw || null,
          targetMeanPrice:   fd.targetMeanPrice?.raw     || null,
          targetHighPrice:   fd.targetHighPrice?.raw     || null,
          targetLowPrice:    fd.targetLowPrice?.raw      || null,
          analystBreakdown: rt.strongBuy != null ? {
            strongBuy:  rt.strongBuy  || 0,
            buy:        rt.buy        || 0,
            hold:       rt.hold       || 0,
            sell:       rt.sell       || 0,
            strongSell: rt.strongSell || 0,
          } : null,
          symbol,
          source: "Yahoo Finance",
          fetchedAt: new Date().toISOString(),
        };

        res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
        return res.status(200).json(fundamentals);
      }

      // Handle v7 quote response
      if (data?.quoteResponse?.result?.[0]) {
        const q = data.quoteResponse.result[0];
        const fundamentals = {
          trailingPE:       q.trailingPE             || null,
          forwardPE:        q.forwardPE              || null,
          grossMargins:     null,
          operatingMargins: null,
          profitMargins:    null,
          returnOnEquity:   null,
          revenueGrowthYoY: q.revenueGrowth != null ? +(q.revenueGrowth * 100).toFixed(1) : null,
          trailingEps:      q.trailingEps            || null,
          forwardEps:       q.forwardEps             || null,
          recommendationKey:q.averageAnalystRating?.split(" - ")?.[1]?.toLowerCase() || null,
          numberOfAnalysts: q.numberOfAnalystOpinions || null,
          targetMeanPrice:  q.targetMeanPrice         || null,
          targetHighPrice:  q.targetHighPrice         || null,
          targetLowPrice:   q.targetLowPrice          || null,
          analystBreakdown: null,
          symbol,
          source: "Yahoo Finance (v7)",
          fetchedAt: new Date().toISOString(),
        };
        res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
        return res.status(200).json(fundamentals);
      }

    } catch (err) {
      console.error(`Endpoint failed ${url}:`, err.message);
      continue;
    }
  }

  // All endpoints failed
  return res.status(200).json({ 
    error: "Yahoo unavailable", 
    symbol,
    note: "Analysis will proceed with AI knowledge only"
  });
}
