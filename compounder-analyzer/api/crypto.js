// /api/crypto.js — Precios crypto via CoinGecko (gratis, sin key)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const { symbols } = req.query;
  if(!symbols) return res.status(400).json({error:'symbols required'});

  // Map common symbols to CoinGecko IDs
  const COIN_IDS = {
    'BTC':'bitcoin','ETH':'ethereum','SOL':'solana','BNB':'binancecoin',
    'XRP':'ripple','ADA':'cardano','DOGE':'dogecoin','AVAX':'avalanche-2',
    'DOT':'polkadot','MATIC':'matic-network','LINK':'chainlink','UNI':'uniswap',
    'ATOM':'cosmos','LTC':'litecoin','BCH':'bitcoin-cash','ALGO':'algorand',
    'VET':'vechain','FIL':'filecoin','TRX':'tron','SHIB':'shiba-inu',
    'NEAR':'near','APT':'aptos','ARB':'arbitrum','OP':'optimism',
    'SUI':'sui','INJ':'injective-protocol','IMX':'immutable-x',
    'USDT':'tether','USDC':'usd-coin','BUSD':'binance-usd',
  };

  const tickers = symbols.split(',').map(s => s.trim().toUpperCase());
  const ids = tickers.map(t => COIN_IDS[t] || t.toLowerCase()).join(',');

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Inversoria/1.0' }
    });

    if(!response.ok) throw new Error(`CoinGecko ${response.status}`);
    const data = await response.json();

    // Remap back to ticker symbols
    const prices = {};
    tickers.forEach(ticker => {
      const id = COIN_IDS[ticker] || ticker.toLowerCase();
      if(data[id]) {
        prices[ticker] = {
          price: data[id].usd,
          change24h: data[id].usd_24h_change,
          marketCap: data[id].usd_market_cap,
        };
      }
    });

    return res.status(200).json({ prices });

  } catch(err) {
    console.error('Crypto price error:', err);
    return res.status(500).json({error:'Crypto prices unavailable'});
  }
}
