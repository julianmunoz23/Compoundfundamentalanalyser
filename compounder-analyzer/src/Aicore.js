// ══════════════════════════════════════════════════════════════════════════════
// aiCore.js — Motor de análisis IA de Inversoria
// ⚠️  ARCHIVO PROTEGIDO — No modificar sin pruebas completas
// Contiene: callAI (proxy Anthropic), callFinnhub (Wall Street consensus)
// Última vez que funcionó correctamente: Mayo 2026
// ══════════════════════════════════════════════════════════════════════════════

// ── AI CACHE — keyed by ticker + market session ───────────────────────────────
const _aiCache = {};

function _getMarket(ticker){
  const bvc = ["TERPEL","GEB","ECOPETROL","BOGOTA","CELSIA","ISA","PEI","BVC","CNEC",
               "PFGRUPSURA","PFAVAL","AVAL","CORFICOLCF","CIBEST","NUCO","GRUPOSURA"];
  const europe = ["ASML","LVMH","SAP","NESN","NOVO","SHELL","TTE","SIE","AIR","OR",
                  "PHIA","DTE","ALV","BNP","SAN","HSBA","BP","VOD","GSK","AZN"];
  if(bvc.includes(ticker)) return "BVC";
  if(europe.includes(ticker)) return "EUROPE";
  return "NYSE"; // default US
}

function isMarketOpen(ticker){
  const now = new Date();
  const market = _getMarket(ticker);
  let marketHour;
  if(market === "BVC"){
    marketHour = now.getUTCHours() - 5;
    return marketHour >= 9 && marketHour < 16;
  }
  if(market === "EUROPE"){
    const cetOffset = now.getMonth() >= 2 && now.getMonth() <= 10 ? 2 : 1;
    marketHour = now.getUTCHours() + cetOffset;
    return marketHour >= 9 && marketHour < 17;
  }
  const etOffset = now.getMonth() >= 2 && now.getMonth() <= 10 ? -4 : -5;
  marketHour = now.getUTCHours() + etOffset;
  return marketHour >= 9 && marketHour < 16;
}

function getMarketLabel(ticker){
  const market = _getMarket(ticker);
  const open = isMarketOpen(ticker);
  if(market==="BVC")    return open ? null : "🕐 Mercado BVC cerrado · Análisis del último cierre";
  if(market==="EUROPE") return open ? null : "🕐 Mercado europeo cerrado · Análisis del último cierre";
  return open ? null : "🕐 NYSE cerrado · Análisis del último cierre";
}

function _marketSessionId(ticker){
  // Returns a string that changes only when the relevant market closes
  // so same ticker = same cache key within a trading session
  const now = new Date();
  const market = _getMarket(ticker);
  
  // Convert to market local time
  let marketHour;
  if(market === "BVC"){
    // Colombia UTC-5 — BVC closes at 4:00 PM (16:00) Colombia time
    marketHour = now.getUTCHours() - 5;
    const closed = marketHour >= 16 || marketHour < 9;
    const dateStr = now.toISOString().split("T")[0];
    return `${ticker}_BVC_${dateStr}`;  // same key all day — valid after close too
  }
  if(market === "EUROPE"){
    // CET = UTC+1 (winter) / UTC+2 (summer) — Euronext closes 5:30 PM CET
    const cetOffset = now.getMonth() >= 2 && now.getMonth() <= 10 ? 2 : 1;
    marketHour = now.getUTCHours() + cetOffset;
    const closed = marketHour >= 17 || marketHour < 9;
    const dateStr = now.toISOString().split("T")[0];
    return `${ticker}_EU_${dateStr}`;
  }
  // NYSE/NASDAQ — ET = UTC-4 (summer) / UTC-5 (winter) — closes 4:00 PM ET
  const etOffset = now.getMonth() >= 2 && now.getMonth() <= 10 ? -4 : -5;
  marketHour = now.getUTCHours() + etOffset;
  const closed = marketHour >= 16 || marketHour < 9;
  const dateStr = now.toISOString().split("T")[0];
  return `${ticker}_NYSE_${dateStr}_${closed?"closed":"open"}`;
}

function _cacheKey(prompt){
  // Extract ticker from prompt — try multiple patterns
  const m = prompt.match(/(?:ticker|Analyze|consensus for)[:\s"]+([A-Z]{1,5}(?:\.[A-Z])?)/i)
         || prompt.match(/"([A-Z]{2,5}(?:\.[A-Z])?)"/); // quoted ticker like "NVDA"
  if(!m) return `generic_${new Date().toISOString().split("T")[0]}`;
  const ticker = m[1].toUpperCase();
  return _marketSessionId(ticker);
}

async function callAI(prompt){
  const cKey=_cacheKey(prompt);
  if(_aiCache[cKey]){ console.log("📦 Cache hit:",cKey); return _aiCache[cKey]; }
  const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1400,messages:[{role:"user",content:prompt}]})});
  const d=await res.json();
  if(d.error){
    const t=d.error.type||""; const m=d.error.message||"";
    if(t==="authentication_error"||m.includes("credit")||m.includes("balance"))
      throw new Error("⚠️ Análisis no disponible en este momento. Intenta más tarde.");
    if(t==="overloaded_error")
      throw new Error("⚡ Servicio ocupado. Intenta en unos segundos.");
    if(t==="rate_limit_error")
      throw new Error("⏳ Demasiadas consultas. Espera un momento.");
    throw new Error("⚠️ No se pudo completar el análisis. Intenta de nuevo.");
  }
  const txt=d.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
  const parsed=JSON.parse(txt);
  _aiCache[cKey]=parsed; // cache parsed result
  return parsed;
}



// ── FINNHUB — Wall Street Consensus & Precios ─────────────────────────────────
// ── FINNHUB HELPER — Real-time market data ────────────────────────────────────
const FH="https://finnhub.io/api/v1";

// Rate limiter — max 25 calls per 10 seconds to stay under free tier limit
const _fhQueue={calls:[],maxPerWindow:25,windowMs:10000};
function _fhThrottle(){
  const now=Date.now();
  _fhQueue.calls=_fhQueue.calls.filter(t=>now-t<_fhQueue.windowMs);
  if(_fhQueue.calls.length>=_fhQueue.maxPerWindow){
    const wait=_fhQueue.windowMs-( now-_fhQueue.calls[0]);
    return new Promise(r=>setTimeout(r,wait+100));
  }
  _fhQueue.calls.push(now);
  return Promise.resolve();
}

async function finnhubGet(path,ticker){
  await _fhThrottle();
  // Use server proxy — key never exposed to browser
  const endpoint=path.replace("/","").replace(/^\//,"");
  const res=await fetch(`/api/prices?path=${encodeURIComponent(endpoint)}&symbol=${encodeURIComponent(ticker)}`);
  if(!res.ok)throw new Error(`Finnhub ${res.status}`);
  return res.json();
}

async function callFinnhub(ticker){
  try{
    const delay=ms=>new Promise(r=>setTimeout(r,ms));
    const safe=async(fn)=>{try{return{status:"fulfilled",value:await fn()};}catch(e){return{status:"rejected",reason:e};}};
    const rec=await safe(()=>finnhubGet("/stock/recommendation",ticker));
    await delay(200);
    const pt=await safe(()=>finnhubGet("/stock/price-target",ticker));
    await delay(200);
    const quote=await safe(()=>finnhubGet("/quote",ticker));
    await delay(200);
    const epsEst=await safe(()=>finnhubGet("/stock/eps-estimate",ticker));
    await delay(200);
    const revEst=await safe(()=>finnhubGet("/stock/revenue-estimate",ticker));

    const recData=rec.status==="fulfilled"&&rec.value?.length?rec.value[0]:null;
    const totalAnalysts=recData?(recData.strongBuy+recData.buy+recData.hold+recData.sell+recData.strongSell):0;
    const bullish=recData?(recData.strongBuy+recData.buy):0;
    const bearish=recData?(recData.sell+recData.strongSell):0;
    let rating="N/A";
    if(recData){
      const score=(recData.strongBuy*5+recData.buy*4+recData.hold*3+recData.sell*2+recData.strongSell*1)/Math.max(totalAnalysts,1);
      if(score>=4.5)rating="Strong Buy";
      else if(score>=3.8)rating="Buy";
      else if(score>=2.8)rating="Hold";
      else if(score>=2.0)rating="Sell";
      else rating="Strong Sell";
    }
    const ptData=pt.status==="fulfilled"?pt.value:null;
    const currentPrice=quote.status==="fulfilled"?quote.value?.c:null;
    const targetMean=ptData?.targetMean||null;
    const upside=currentPrice&&targetMean?((targetMean-currentPrice)/currentPrice*100).toFixed(1):null;
    const epsData=epsEst.status==="fulfilled"&&epsEst.value?.data?.length?epsEst.value.data[0]:null;
    const epsGrowth=epsData?.growth!=null?(epsData.growth*100).toFixed(1):null;
    const revData=revEst.status==="fulfilled"&&revEst.value?.data?.length?revEst.value.data[0]:null;
    const revGrowth=revData?.growth!=null?(revData.growth*100).toFixed(1):null;

    return{
      rating,totalAnalysts,bullish,bearish,hold:recData?.hold||0,
      breakdown:recData?{strongBuy:recData.strongBuy,buy:recData.buy,hold:recData.hold,sell:recData.sell,strongSell:recData.strongSell}:null,
      currentPrice,
      targetMean:targetMean?targetMean.toFixed(2):null,
      targetHigh:ptData?.targetHigh?.toFixed(2)||null,
      targetLow:ptData?.targetLow?.toFixed(2)||null,
      upside,
      epsGrowthNext:epsGrowth?`+${epsGrowth}%`:null,
      revGrowthNext:revGrowth?`+${revGrowth}%`:null,
      period:recData?.period||null,
      source:"Wall Street Consensus — Live Data",
    };
  }catch(e){
    console.warn("Finnhub error:",e.message);
    return null;
  }
}


// ── TICKER RESOLVER ───────────────────────────────────────────────────────────

// ── LATAM MARKETS — Yahoo Finance ticker maps ────────────────────────────────
// Each exchange uses a suffix that Yahoo Finance recognizes
const LATAM_MARKETS = {
  // 🇨🇴 Colombia BVC
  CL: {
    suffix:".CL", currency:"COP",
    tickers:{
      "ECOPETROL":"ECOPETROL","PFBCOLOM":"PFBCOLOM","TERPEL":"TERPEL",
      "CIBEST":"CIBEST","BANCOLOMBIA":"CIBEST",
      "ISA":"ISA","GRUPOSURA":"GRUPOSURA","NUTRESA":"NUTRESA",
      "CEMARGOS":"CEMARGOS","CELSIA":"CELSIA","GEB":"GEB",
      "PROMIGAS":"PROMIGAS","ETB":"ETB","BVC":"BVC",
      "CORFICOLCF":"CORFICOLCF","MINEROS":"MINEROS","EEB":"EEB",
      "PFDAVVNDA":"PFDAVVNDA","BOGOTA":"BOGOTA","OCCIDENTE":"OCCIDENTE",
      "PFAVH":"PFAVH","COLINV":"COLINV","CNEC":"CNEC",
      "GRUPOARGOS":"GRUPOARGOS","EXITO":"EXITO","CLH":"CLH",
      "INVERARGOS":"INVERARGOS","PFDGRUPOARG":"PFDGRUPOARG",
      "NUCO":"NUCO","BRKBCO":"BRKBCO","PFECO":"PFECO","NKECO":"NKECO",
      "PFGRUPSURA":"PFGRUPSURA",
      "PEI":"PEI",
    }
  },
  // 🇧🇷 Brasil BOVESPA
  SA: {
    suffix:".SA", currency:"BRL",
    tickers:{
      "PETR4":"PETR4","PETR3":"PETR3","VALE3":"VALE3","ITUB4":"ITUB4",
      "BBDC4":"BBDC4","ABEV3":"ABEV3","B3SA3":"B3SA3","WEGE3":"WEGE3",
      "RENT3":"RENT3","SUZB3":"SUZB3","BBAS3":"BBAS3","MGLU3":"MGLU3",
      "LREN3":"LREN3","JBSS3":"JBSS3","RADL3":"RADL3","ELET3":"ELET3",
      "CSAN3":"CSAN3","EMBR3":"EMBR3","TOTVS3":"TOTVS3","HAPV3":"HAPV3",
    }
  },
  // 🇨🇱 Chile Santiago
  SN: {
    suffix:".SN", currency:"CLP",
    tickers:{
      "FALABELLA":"FALABELLA","CENCOSUD":"CENCOSUD","COPEC":"COPEC",
      "SQMB":"SQM-B","CHILE":"CHILE","BCI":"BCI","SECURITY":"SECURITY",
      "CAP":"CAP","LTM":"LTM","ENELAM":"ENELAM","COLBUN":"COLBUN",
      "CMPC":"CMPC","IAM":"IAM","PARAUCO":"PARAUCO","SONDA":"SONDA",
    }
  },
  // 🇦🇷 Argentina BYMA
  BA: {
    suffix:".BA", currency:"ARS",
    tickers:{
      "YPF":"YPF","GGAL":"GGAL","BMA":"BMA","PAMP":"PAMP",
      "TGSU2":"TGSU2","ALUA":"ALUA","CEPU":"CEPU","TXAR":"TXAR",
      "VIST":"VIST","CRES":"CRES","METR":"METR","SUPV":"SUPV",
    }
  },
  // 🇲🇽 México BMV
  MX: {
    suffix:".MX", currency:"MXN",
    tickers:{
      "WALMEX":"WALMEX","FEMSA":"FEMSAUBD","GFNORTE":"GFNORTEO",
      "AMXL":"AMXL","GMEXICO":"GMEXICOB","CHDRAUI":"CHDRAUI",
      "ALSEA":"ALSEA","BIMBOA":"BIMBOA","LALAB":"LALAB","TLEVISACPO":"TLEVISACPO",
    }
  },
  // 🇵🇪 Perú BVL
  LM: {
    suffix:".LM", currency:"PEN",
    tickers:{
      "ALICORC1":"ALICORC1","BACKUSI1":"BACKUSI1","BVN":"BVN",
      "CPACASC1":"CPACASC1","GRAMONC1":"GRAMONC1","IFIC1":"IFIC1",
    }
  },
  // 🇫🇷 Francia Euronext París
  PA: {
    suffix:".PA", currency:"EUR",
    tickers:{
      "MC":"MC","LVMH":"MC","AIR":"AIR","TTE":"TTE","SAF":"SAF",
      "BNP":"BNP","SAN":"SAN","OR":"OR","KER":"KER","CAP":"CAP",
      "HO":"HO","SU":"SU","DG":"DG","VIE":"VIE","SGO":"SGO",
    }
  },
  // 🇩🇪 Alemania Xetra
  DE: {
    suffix:".DE", currency:"EUR",
    tickers:{
      "4BRZ":"4BRZ","SAP":"SAP","SIE":"SIE","ALV":"ALV","BMW":"BMW",
      "DAI":"DAI","BAYN":"BAYN","DTE":"DTE","DBK":"DBK","ADS":"ADS",
    }
  },
  // 🇬🇧 Reino Unido London
  L: {
    suffix:".L", currency:"GBP",
    tickers:{
      "IGLN":"IGLN","CJPU":"CJPU","SHEL":"SHEL","AZN":"AZN",
      "HSBA":"HSBA","BP":"BP","RIO":"RIO","GSK":"GSK","ULVR":"ULVR",
    }
  },
};

// Flat reverse map: ticker → {yahoo_symbol, currency, market}
const LATAM_TICKER_MAP = {};
for(const [marketCode, market] of Object.entries(LATAM_MARKETS)){
  for(const [shortTicker, yahooBase] of Object.entries(market.tickers)){
    LATAM_TICKER_MAP[shortTicker] = {
      symbol: yahooBase + market.suffix,
      currency: market.currency,
      market: marketCode,
    };
  }
}

function getLatamSymbol(ticker){
  const t = ticker.toUpperCase().replace(/[.](CL|SA|SN|BA|MX|LM)$/i, "");
  // Direct match in our map
  if(LATAM_TICKER_MAP[t]) return LATAM_TICKER_MAP[t];
  // Already has a LATAM or European suffix
  const suffixMatch = ticker.toUpperCase().match(/[.](CL|SA|SN|BA|MX|LM|PA|DE|L|MC|MI|AS|OL|ST)$/i);
  if(suffixMatch){
    const market = LATAM_MARKETS[suffixMatch[1].toUpperCase()];
    if(market) return { symbol: ticker.toUpperCase(), currency: market.currency, market: suffixMatch[1].toUpperCase() };
  }
  return null;
}

// Keep backward compat alias
function getBVCSymbol(ticker){ const r=getLatamSymbol(ticker); return r&&r.market==="CL"?r.symbol:null; }

async function fetchBVCPrice(ticker){
  const latam = getLatamSymbol(ticker);
  if(!latam) return null;
  try{
    // Call our own Vercel serverless proxy — avoids CORS issues with Yahoo Finance
    const url = "/api/latam-price?symbol=" + encodeURIComponent(latam.symbol);
    const res = await fetch(url);
    if(!res.ok) return null;
    const data = await res.json();
    if(!data.price) return null;
    const rawPrice = parseFloat(data.price);
    const priceCurrency = data.currency||latam.currency;
    // Convert to USD for internal P&G calculations
    const currRate = priceCurrency==="USD"?1:(CURRENCIES[priceCurrency]?.rate||1);
    const priceUSD = priceCurrency==="USD"?rawPrice:(rawPrice/currRate);
    return{
      price: priceUSD,          // stored in USD for P&G consistency
      priceLocal: rawPrice,     // original local currency price
      change: parseFloat(data.change)||0,
      changePct: parseFloat(data.changePct)||0,
      currency: priceCurrency,
      isBVC: true,
      market: latam.market,
    };
  }catch(e){ return null; }
}

// ── FUNDAMENTALS — uses Finnhub /stock/metric (already integrated, no Yahoo needed) ──
// This is called before AI analysis — fhData.basicFinancials has real margins/ROE
// For the score tab, fundamentals come from the same callFinnhub() call
async function fetchYahooFundamentals(ticker){
  // No longer using Yahoo Finance (blocked by Vercel)
  // Fundamentals now come from Finnhub via callFinnhub().basicFinancials
  // This function returns null so buildFundamentalsContext uses fhData instead
  return null;
}

function buildFundamentalsContext(f, ticker){
  if(!f) return "";
  const lines = [];
  lines.push(`\n--- DATOS REALES FINNHUB (${ticker}) ---`);
  // Finnhub field names
  if(f.revenueGrowthTTMYoy!=null) lines.push(`Crecimiento ingresos TTM YoY: ${f.revenueGrowthTTMYoy.toFixed(1)}%`);
  if(f.epsGrowthTTMYoy!=null)     lines.push(`Crecimiento EPS TTM YoY: ${f.epsGrowthTTMYoy.toFixed(1)}%`);
  if(f.grossMarginTTM!=null)      lines.push(`Margen bruto TTM: ${f.grossMarginTTM.toFixed(1)}%`);
  if(f.operatingMarginTTM!=null)  lines.push(`Margen operativo TTM: ${f.operatingMarginTTM.toFixed(1)}%`);
  if(f.netProfitMarginTTM!=null)  lines.push(`Margen neto TTM: ${f.netProfitMarginTTM.toFixed(1)}%`);
  if(f.roeTTM!=null)              lines.push(`ROE TTM: ${f.roeTTM.toFixed(1)}%`);
  if(f.roaTTM!=null)              lines.push(`ROA TTM: ${f.roaTTM.toFixed(1)}%`);
  if(f.peNormalizedAnnual!=null)  lines.push(`P/E normalizado anual: ${f.peNormalizedAnnual.toFixed(1)}x`);
  if(f.debtEquityAnnual!=null)    lines.push(`Deuda/Equity anual: ${f.debtEquityAnnual.toFixed(2)}x`);
  // Yahoo Finance field names (kept for compatibility)
  if(f.revenueGrowthYoY!=null)    lines.push(`Crecimiento ingresos YoY: ${f.revenueGrowthYoY}%`);
  if(f.grossMargins!=null)        lines.push(`Margen bruto: ${f.grossMargins}%`);
  if(f.operatingMargins!=null)    lines.push(`Margen operativo: ${f.operatingMargins}%`);
  if(f.returnOnEquity!=null)      lines.push(`ROE: ${f.returnOnEquity}%`);
  if(f.trailingPE!=null)          lines.push(`P/E trailing: ${f.trailingPE.toFixed(1)}x`);
  if(f.targetMeanPrice)           lines.push(`Precio objetivo promedio: $${f.targetMeanPrice.toFixed(2)}`);
  lines.push(`--- USA ESTOS DATOS REALES. Son más recientes que tu entrenamiento. ---`);
  return lines.join("\n");
}
