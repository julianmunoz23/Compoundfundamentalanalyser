import React, { useState, useCallback, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPA_URL && SUPA_KEY ? createClient(SUPA_URL, SUPA_KEY) : null;

// Helper — save user data to Supabase or fallback to localStorage
async function cloudSave(table, key, data, userId) {
  if (!supabase || !userId) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    return;
  }
  try {
    await supabase.from(table).upsert({ user_id: userId, key, data, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {} // keep local copy too
  } catch(e) { console.warn("Cloud save failed, using localStorage:", e.message); }
}

async function cloudLoad(table, key, userId) {
  if (!supabase || !userId) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
  }
  try {
    const { data } = await supabase.from(table).select("data").eq("user_id", userId).eq("key", key).single();
    if (data?.data) return data.data;
  } catch(e) {}
  // fallback to localStorage
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
}
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

// ── ERROR BOUNDARY — prevents white screen on any crash ──────────────────────
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  componentDidCatch(e,info){console.error("App crash:",e,info);}
  render(){
    if(this.state.err)return(
      <div style={{minHeight:"100vh",background:"#0a0c10",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{background:"#141820",border:"1px solid #e74c3c44",borderRadius:16,padding:32,maxWidth:500,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#c9a84c",marginBottom:10}}>Something went wrong</div>
          <div style={{fontSize:13,color:"#6b7694",marginBottom:20,lineHeight:1.7}}>{this.state.err.message}</div>
          <button onClick={()=>this.setState({err:null})} style={{background:"#c9a84c",color:"#0a0c10",border:"none",borderRadius:8,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
            Try Again
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}


const DARK_THEME = {
  bg:"#0a0c10",surface:"#10141c",card:"#141820",border:"#1e2534",
  gold:"#c9a84c",goldLight:"#e8c97a",goldDim:"#7a6330",
  green:"#2ecc71",red:"#e74c3c",blue:"#4a9eff",purple:"#a855f7",
  text:"#e8eaf0",muted:"#6b7694",accent:"#1a2235",
};
const LIGHT_THEME = {
  bg:"#f9f8f5",surface:"#f2f0ea",card:"#ffffff",border:"#e0dbd0",
  gold:"#9a6f20",goldLight:"#c9a84c",goldDim:"#c9a84c",
  green:"#16a34a",red:"#dc2626",blue:"#1d4ed8",purple:"#7c3aed",
  text:"#1a1814",muted:"#6b6860",accent:"#f4f2ec",
};
const T = DARK_THEME;

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Mono:wght@400&family=DM+Sans:wght@400;500;600&display=swap&font-display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${T.goldDim};border-radius:2px;}
  input[type=range]{-webkit-appearance:none;width:100%;height:3px;background:${T.border};border-radius:2px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:${T.gold};border-radius:50%;cursor:pointer;}
  input[type=range]:disabled{opacity:0.35;cursor:not-allowed;}
  input[type=number],input[type=text],select{background:${T.accent};border:1px solid ${T.border};color:${T.text};border-radius:6px;padding:8px 12px;font-family:'DM Mono',monospace;font-size:13px;width:100%;outline:none;transition:border-color 0.2s;}
  input:focus,select:focus{border-color:${T.goldDim};}
  select option{background:${T.surface};}
  .tbtn{background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:0.08em;font-weight:500;padding:8px 18px;text-transform:uppercase;color:${T.muted};transition:color 0.2s;}
  .tbtn:hover{color:${T.goldLight};}
  .btn{cursor:pointer;border:none;font-family:'DM Sans',sans-serif;font-weight:600;border-radius:8px;transition:all 0.2s;font-size:13px;}
  .btn-gold{background:${T.gold};color:#0a0c10;padding:10px 22px;}.btn-gold:hover{background:${T.goldLight};transform:translateY(-1px);}
  .btn-gold:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
  .btn-outline{background:transparent;border:1px solid ${T.border};color:${T.muted};padding:8px 16px;}.btn-outline:hover{border-color:${T.goldDim};color:${T.gold};}
  .seg{cursor:pointer;border:1px solid ${T.border};font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;transition:all 0.2s;background:${T.accent};color:${T.muted};}
  .seg-on{background:${T.gold}22!important;color:${T.gold}!important;border-color:${T.goldDim}!important;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .fi{animation:fadeIn 0.35s ease both;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .sp{animation:spin 0.8s linear infinite;display:inline-block;}
  .trow:hover td{background:${T.accent}55;}
  .hero-grad{background:linear-gradient(135deg,#0a0c10 0%,#0f1420 50%,#0a0c10 100%);}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.6;}}
  .ad-pulse{animation:pulse 3s ease-in-out infinite;}
  .tbtn{transition:color 0.15s,border-color 0.15s;}
  .card-hover{transition:border-color 0.2s,transform 0.15s;}
  .card-hover:hover{border-color:${T.goldDim}!important;transform:translateY(-1px);}
  @keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
  .strategy-badge{background:linear-gradient(90deg,${T.gold}22,${T.green}22,${T.gold}22);background-size:200% auto;animation:shimmer 3s linear infinite;}

  /* ── RESPONSIVE — Mobile first ── */
  @media(max-width:768px){
    body{font-size:14px;}
    input[type=number],input[type=text],select,textarea{font-size:16px!important;}

    /* Nav */
    .tabs-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
    .tabs-wrap::-webkit-scrollbar{display:none;}
    .tbtn{padding:8px 12px;font-size:10px;white-space:nowrap;}
    .nav-brand-sub{display:none!important;}
    .nav-actions{gap:4px!important;}
    .nav-actions .btn{font-size:11px!important;padding:6px 10px!important;}

    /* Page */
    .page-wrap{padding:12px 12px!important;}
    .hero-pad{padding:28px 16px 32px!important;}

    /* Hero */
    .hero-h1{font-size:26px!important;line-height:1.2!important;}
    .hero-steps{grid-template-columns:1fr!important;gap:10px!important;}
    .hero-connector{display:none!important;}
    .step-connector{display:none!important;}

    /* Grids */
    .compound-layout{grid-template-columns:1fr!important;}
    .g-2{grid-template-columns:1fr 1fr!important;}
    .g-1{grid-template-columns:1fr!important;}
    .score-layout{grid-template-columns:1fr!important;}

    /* KPIs */
    .kpi-4{grid-template-columns:1fr 1fr!important;}
    .kpi-3{grid-template-columns:1fr 1fr!important;}

    /* Tables */
    .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .strategy-table{min-width:600px;}

    /* Cards */
    .card-pad{padding:12px!important;}

    /* Profile */
    .amount-input{font-size:16px!important;}

    /* Buttons */
    .btn-mobile-full{width:100%!important;text-align:center;}

    /* Modals */
    .paywall-modal{padding:20px 16px!important;margin:8px!important;}
    .paywall-grid{grid-template-columns:1fr!important;}

    /* Currency */
    .curr-dropdown{right:0;left:auto;min-width:180px!important;}

    /* Cycle */
    .cycle-grid-4{grid-template-columns:1fr 1fr!important;}
    .cycle-grid-2{grid-template-columns:1fr!important;}

    /* Auth modal */
    .auth-modal{padding:24px 16px!important;margin:12px!important;}

    /* Analyze stock — stack ticker + sector + button */
    .analyze-row{flex-direction:column!important;gap:10px!important;}
    .analyze-row>*{width:100%!important;}

    /* Score ring card */
    .score-card-grid{grid-template-columns:1fr!important;}

    /* Portfolio form */
    .portfolio-grid{grid-template-columns:1fr!important;}
  }

  /* Ensure proper mobile viewport */
  @media screen and (max-width:768px){
    .nav-actions>button:not(.nav-premium-btn):not([onClick*="toggleLang"]):not([onClick*="showCurrMenu"]){
      font-size:10px!important;
    }
  }
  @media(max-width:480px){
    .hero-h1{font-size:22px!important;}
    .hero-steps{grid-template-columns:1fr!important;}
    .kpi-4{grid-template-columns:1fr 1fr!important;}
    .kpi-3{grid-template-columns:1fr 1fr!important;}
    .g-2{grid-template-columns:1fr!important;}
    .tbtn{padding:6px 8px;font-size:9px;}
    .score-card-grid{grid-template-columns:1fr!important;}
    .portfolio-grid{grid-template-columns:1fr!important;}
    .analyze-row{flex-direction:column!important;}
    .analyze-row>*{width:100%!important;min-width:unset!important;}
  }
`;

// ── UTILS ─────────────────────────────────────────────────────────────────────
// Show full dollar values with commas, no abbreviation
// ── CURRENCY SYSTEM ──────────────────────────────────────────────────────────
// Base config — rates are fetched live from frankfurter.app (European Central Bank)
const CURRENCIES={
  USD:{symbol:"$",  code:"USD",name:"US Dollar",      flag:"🇺🇸",locale:"en-US",rate:1},
  COP:{symbol:"$",  code:"COP",name:"Peso Colombiano",flag:"🇨🇴",locale:"es-CO",rate:1},
  MXN:{symbol:"$",  code:"MXN",name:"Peso Mexicano",  flag:"🇲🇽",locale:"es-MX",rate:1},
  ARS:{symbol:"$",  code:"ARS",name:"Peso Argentino", flag:"🇦🇷",locale:"es-AR",rate:1},
  PEN:{symbol:"S/", code:"PEN",name:"Sol Peruano",    flag:"🇵🇪",locale:"es-PE",rate:1},
  CLP:{symbol:"$",  code:"CLP",name:"Peso Chileno",   flag:"🇨🇱",locale:"es-CL",rate:1},
  BRL:{symbol:"R$", code:"BRL",name:"Real Brasileño", flag:"🇧🇷",locale:"pt-BR",rate:1},
  EUR:{symbol:"€",  code:"EUR",name:"Euro",           flag:"🇪🇺",locale:"de-DE",rate:1},
};

// Global currency state — updated by App
let _currency=CURRENCIES.USD;
let _exRate=1;

function setCurrencyGlobal(curr,rate=1){_currency={..._currency,...curr};_exRate=rate;}

// Fetch live exchange rates from frankfurter.app (European Central Bank — free, no key)
async function fetchExchangeRates(){
  try{
    const res=await fetch("https://api.frankfurter.app/latest?from=USD&to=COP,MXN,ARS,PEN,CLP,BRL,EUR");
    const data=await res.json();
    if(data?.rates){
      Object.keys(CURRENCIES).forEach(code=>{
        if(data.rates[code]){CURRENCIES[code].rate=data.rates[code];}
      });
      CURRENCIES.USD.rate=1;
    }
    return data.rates||{};
  }catch(e){
    // Fallback to recent approximate rates if API fails
    const fallback={COP:3700,MXN:20.3,ARS:1050,PEN:3.75,CLP:920,BRL:5.78,EUR:0.92};
    Object.keys(fallback).forEach(code=>{CURRENCIES[code].rate=fallback[code];});
    console.warn("Exchange rate API unavailable, using fallback rates");
    return fallback;
  }
}

function fmt(n,showCode=false){
  if(n===undefined||n===null||isNaN(n))return`${_currency.symbol}0`;
  const converted=Math.round(n*_exRate);
  const sign=n<0?"-":"";
  const abs=Math.abs(converted).toLocaleString(_currency.locale);
  const code=showCode?` ${_currency.code}`:"";
  return`${sign}${_currency.symbol}${abs}${code}`;
}

function fmtShort(n){
  if(!n)return`${_currency.symbol}0`;
  const converted=n*_exRate;
  const abs=Math.abs(converted);
  const sign=n<0?"-":"";
  if(abs>=1e9)return`${sign}${_currency.symbol}${(Math.abs(converted)/1e9).toFixed(1)}B`;
  if(abs>=1e6)return`${sign}${_currency.symbol}${(Math.abs(converted)/1e6).toFixed(1)}M`;
  if(abs>=1e3)return`${sign}${_currency.symbol}${(Math.abs(converted)/1e3).toFixed(0)}K`;
  return`${sign}${_currency.symbol}${Math.round(Math.abs(converted))}`;
}

// Note on stock prices: Always shown in USD (market standard)
// Other values (portfolio total, compound calc, goals) shown in selected currency
const fmtUSD=(n)=>{
  if(!n&&n!==0)return"—";
  const sign=n<0?"-":"";
  return`${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
};

// ── AD BANNER ─────────────────────────────────────────────────────────────────
function AdBanner({size="leaderboard"}){
  const h=size==="rectangle"?250:size==="sidebar"?600:90;
  return(
    <div style={{width:"100%",minHeight:h,background:T.surface,border:`1px dashed ${T.border}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className="ad-pulse" style={{textAlign:"center",padding:16}}>
        <div style={{fontSize:10,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Advertisement</div>
        <div style={{fontSize:10,color:T.border}}>{size==="rectangle"?"336×280":size==="sidebar"?"300×600":"728×90"}</div>
      </div>
    </div>
  );
}

// ── PAYWALL ───────────────────────────────────────────────────────────────────
function PaywallModal({onClose,context="stock",lang="en",onSignUp}){
  const configs={
    stock:{
      icon:"🎯",
      title:"You've seen the potential. Now act on it.",
      sub:<>You've used your <span style={{color:T.text,fontWeight:600}}>3 free analyses</span>. Upgrade to keep analyzing stocks with live Wall Street consensus, moat scoring, and DCF valuation — unlimited.</>,
      features:["Unlimited AI Stock Analyses","Market Cycle Dashboard","Consenso Wall Street en Tiempo Real","Analyst Price Targets & Upside","FCF Growth Rate Analysis","Buffett/Munger Quality Score","Inline DCF Valuation"],
      price:"$7.99/mo",
      trial:"7-day free trial · Cancel anytime",
      cta:"🎯 Unlock Unlimited Analysis",
      proof:"Join investors already using Inversoria",
    },
    portfolio:{
      icon:"📁",
      title:"Your portfolio deserves a real analysis.",
      sub:<>{lang==="es"?"El plan gratuito incluye":"Free plan supports"} <span style={{color:T.text,fontWeight:600}}>3 {lang==="es"?"posiciones":"stock positions"}</span>. Upgrade to track unlimited positions with live prices, AI rebalancing, DCA recommendations, and risk profile matching.</>,
      features:["Unlimited Portfolio Positions","AI Portfolio Score & Assessment","Rebalance Plan (what to trim/add)","DCA Advisor — where to invest cash","Risk Profile Alignment Check","P&L en tiempo real con precios live"],
      price:"$7.99/mo",
      trial:"7-day free trial · Cancel anytime",
      cta:"📁 Unlock My Full Portfolio",
      proof:"See exactly where your money should go",
    },
    riskPortfolio:{
      icon:"🧬",
      title:"Your investor DNA is ready. Now build the portfolio.",
      sub:<>Your <span style={{color:T.text,fontWeight:600}}>Risk Profile is always free</span>. Subscribe to get a personalized AI portfolio of stocks and ETFs — built specifically for your profile, goals, and investment amount.</>,
      features:["AI-Curated Stock Portfolio","ETF Recommendations","Asset Allocation Breakdown","Expected Return Modeling","Quarterly Rebalance Guide","Broker Recommendations"],
      price:"$12.99/mo",
      trial:"7-day free trial · Cancel anytime",
      cta:"🚀 Build My AI Portfolio",
      proof:"The portfolio Buffett would build for your risk profile",
    },
  };
  const c=configs[context]||configs.stock;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="paywall-modal" style={{background:T.card,border:`2px solid ${T.goldDim}`,borderRadius:20,padding:"36px 40px",maxWidth:520,width:"100%",textAlign:"center",position:"relative",maxHeight:"90vh",overflowY:"auto"}}>
        {/* Close button */}
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18,lineHeight:1}}>✕</button>
        {/* Social proof badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${T.green}15`,border:`1px solid ${T.green}33`,borderRadius:20,padding:"5px 14px",marginBottom:18}}>
          <span style={{fontSize:11,color:T.green}}>✦ {c.proof}</span>
        </div>
        <div style={{fontSize:36,marginBottom:12}}>{c.icon}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:10,fontWeight:700,lineHeight:1.3}}>{c.title}</div>
        <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:22}}>{c.sub}</div>
        <div className="paywall-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:22,textAlign:"left"}}>
          {c.features.map(f=>(
            <div key={f} style={{fontSize:11,color:T.text,padding:"7px 12px",background:T.accent,borderRadius:8,border:`1px solid ${T.border}`}}>
              <span style={{color:T.green,marginRight:6}}>✓</span>{f}
            </div>
          ))}
        </div>
        {/* Price + CTA */}
        <div style={{background:`${T.gold}08`,border:`1px solid ${T.goldDim}44`,borderRadius:12,padding:"16px 20px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:6,marginBottom:6}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:36,color:T.gold,fontWeight:700}}>{c.price}</span>
            <span style={{fontSize:12,color:T.muted}}>billed monthly</span>
          </div>
          <div style={{fontSize:11,color:T.green,marginBottom:12}}>🎁 {c.trial}</div>
          <button className="btn btn-gold" style={{fontSize:15,padding:"14px 32px",borderRadius:10,width:"100%"}}
            onClick={()=>{
              if(onSignUp)onSignUp();
              else{
                const msg=lang==="es"
                  ?"🚀 Los pagos estarán disponibles muy pronto. Escríbenos a hola@inversoria.lat para acceso anticipado."
                  :"🚀 Payments coming very soon. Email hola@inversoria.lat for early access.";
                alert(msg);
              }
            }}>
            {lang==="es"?"🚀 Quiero este plan":"🚀 Get this plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({score,size=80,lang="en"}){
  const g=grade(score,lang);
  const cx=size/2,cy=size*0.5,r=size*0.38;
  const rd=deg=>deg*Math.PI/180;
  const arc=a=>{
    const x1=cx+r*Math.cos(rd(-135)),y1=cy+r*Math.sin(rd(-135));
    const deg=(-135)+(a/100)*270;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${a>63?1:0} 1 ${cx+r*Math.cos(rd(deg))} ${cy+r*Math.sin(rd(deg))}`;
  };
  return<svg width={size} height={size*0.78} viewBox={`0 0 ${size} ${size*0.78}`}>
    <path d={arc(100)} fill="none" stroke={T.border} strokeWidth={size*0.065} strokeLinecap="round"/>
    <path d={arc(score)} fill="none" stroke={g.c} strokeWidth={size*0.065} strokeLinecap="round" style={{filter:`drop-shadow(0 0 ${size*0.06}px ${g.c}88)`}}/>
    <text x={cx} y={cy*0.95} textAnchor="middle" fill={g.c} style={{fontFamily:"'Playfair Display',serif",fontSize:size*0.3,fontWeight:700}}>{g.l}</text>
    <text x={cx} y={cy*1.2} textAnchor="middle" fill={T.muted} style={{fontFamily:"'DM Mono',monospace",fontSize:size*0.13}}>{score}/100</text>
  </svg>;
}

// ── AI HELPER ─────────────────────────────────────────────────────────────────
async function callAI(prompt){
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1400,messages:[{role:"user",content:prompt}]})});
  const d=await res.json();if(d.error)throw new Error(d.error.message);
  const txt=d.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();return JSON.parse(txt);
}

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
  const key=import.meta.env.VITE_FINNHUB_KEY;
  const res=await fetch(`${FH}${path}?symbol=${ticker}&token=${key}`);
  if(!res.ok)throw new Error(`Finnhub ${res.status}`);
  return res.json();
}

async function callFinnhub(ticker){
  try{
    // Sequential calls to respect rate limits — small delay between each
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

    // Recommendations — most recent period
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

    // Price target
    const ptData=pt.status==="fulfilled"?pt.value:null;
    const currentPrice=quote.status==="fulfilled"?quote.value?.c:null;
    const targetMean=ptData?.targetMean||null;
    const upside=currentPrice&&targetMean?((targetMean-currentPrice)/currentPrice*100).toFixed(1):null;

    // EPS estimate next year
    const epsData=epsEst.status==="fulfilled"&&epsEst.value?.data?.length?epsEst.value.data[0]:null;
    const epsGrowth=epsData?.growth!=null?(epsData.growth*100).toFixed(1):null;

    // Revenue estimate next year
    const revData=revEst.status==="fulfilled"&&revEst.value?.data?.length?revEst.value.data[0]:null;
    const revGrowth=revData?.growth!=null?(revData.growth*100).toFixed(1):null;

    return{
      rating,
      totalAnalysts,
      bullish,bearish,hold:recData?.hold||0,
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
const KNOWN_TICKERS={
  "GOOGLE":"GOOGL","ALPHABET":"GOOGL","GOOGL":"GOOGL",
  "APPLE":"AAPL","MICROSOFT":"MSFT","AMAZON":"AMZN",
  "TESLA":"TSLA","META":"META","FACEBOOK":"META",
  "NVIDIA":"NVDA","NETFLIX":"NFLX","SPOTIFY":"SPOT",
  "UBER":"UBER","AIRBNB":"ABNB","SHOPIFY":"SHOP",
  "PAYPAL":"PYPL","SALESFORCE":"CRM","ADOBE":"ADBE",
  "COSTCO":"COST","WALMART":"WMT","TARGET":"TGT",
  "JOHNSON":"JNJ","PFIZER":"PFE","UNITEDHEALTH":"UNH",
  "JPMORGAN":"JPM","GOLDMAN":"GS","BERKSHIRE":"BRK.B",
  "VISA":"V","MASTERCARD":"MA","AMERICAN EXPRESS":"AXP",
  "DISNEY":"DIS","WARNER":"WBD","COMCAST":"CMCSA",
  "INTEL":"INTC","AMD":"AMD","QUALCOMM":"QCOM",
  "BOEING":"BA","LOCKHEED":"LMT","EXXON":"XOM",
  "DUOLINGO":"DUOL","HIMS":"HIMS","PALANTIR":"PLTR",
  "SNOWFLAKE":"SNOW","DATADOG":"DDOG","CROWDSTRIKE":"CRWD",
  "COINBASE":"COIN","ROBINHOOD":"HOOD","BLOCK":"SQ","SQUARE":"SQ",
  "ZOOM":"ZM","SLACK":"CRM","TWILIO":"TWLO",
};

async function resolveTicker(input){
  const clean=input.trim().toUpperCase();
  // Already a ticker-like string (1-5 uppercase letters/dots)
  if(/^[A-Z]{1,5}(\.[A-Z])?$/.test(clean))return clean;
  // Check known map
  for(const [k,v] of Object.entries(KNOWN_TICKERS)){
    if(clean.includes(k)||k.includes(clean))return v;
  }
  // Ask AI to resolve
  try{
    const r=await callAI(`What is the stock ticker symbol for "${input}"? Respond ONLY with valid JSON: {"ticker":"<TICKER>","name":"<Full Company Name>"}`);
    return r.ticker||clean;
  }catch(e){return clean;}
}


// ── LANGUAGE SYSTEM ──────────────────────────────────────────────────────────
const LANG = {
  en: {
    nav_brand: "Inversoria",
    nav_sub: "Invierte con inteligencia · Para LATAM",
    nav_free: (n) => n > 0 ? `${n} free analyses left` : "Free plan",
    nav_premium: "🚀 Go Premium",
    tab_compound: "💰 Calculator",
    tab_whatif: "🚀 What If?",
    tab_score: "🎯 Analyze Stock",
    tab_profile: "🧬 Risk Profile",
    tab_portfolio: "📁 My Portfolio",
    tab_strategy: "📈 My Strategy",
    tab_ret: "📐 Expected Return",
    hero_badge: "✦ Trusted by investors worldwide · Buffett & Munger principles",
    hero_h1a: "Invest like",
    hero_h1b: "Buffett & Munger.",
    hero_h1c: "Powered by AI.",
    hero_sub: "The only platform combining compound interest modeling, AI stock analysis, risk profiling, and live portfolio tracking — built for serious long-term investors.",
    hero_social: "Free to start · No credit card · Used by investors in 30+ countries",
    hero_cta1: "💰 Start Free — Compound Calculator",
    hero_cta2: "🎯 Analyze a Stock",
    hero_steps_title: "Your path to smarter investing",
    hero_step1_title: "Calculate your goal",
    hero_step1_desc: "Use the compound calculator to define your wealth target and monthly savings plan.",
    hero_step2_title: "Discover your profile",
    hero_step2_desc: "Take the 8-question quiz to get your Conservative, Moderate, or Aggressive investor profile.",
    hero_step3_title: "Get your AI portfolio",
    hero_step3_desc: "Receive a personalized portfolio with entry prices, targets, and stop losses for each position.",
    hero_step4_title: "Track your strategy",
    hero_step4_desc: "Monitor plan vs reality — see what to hold, rebalance, or buy more with live prices.",
    hero_top_label: "Top Compounders — 1Y Return",
    footer_disc: "Solo educativo — no es asesoría financiera.",
  },
  es: {
    nav_brand: "Inversoria",
    nav_sub: "Invierte con inteligencia · Para LATAM",
    nav_free: (n) => n > 0 ? `${n} análisis gratis restantes` : "Plan gratuito",
    nav_premium: "🚀 Ir Premium",
    tab_compound: "💰 Calculadora",
    tab_whatif: "🚀 ¿Y si...?",
    tab_score: "🎯 Analizar Acción",
    tab_profile: "🧬 Perfil de Riesgo",
    tab_portfolio: "📁 Mi Portafolio",
    tab_strategy: "📈 Mi Estrategia",
    tab_ret: "📐 Retorno Esperado",
    hero_badge: "✦ Invierte con los principios de Buffett & Munger · Con IA",
    hero_h1a: "Invierte como",
    hero_h1b: "Buffett & Munger.",
    hero_h1c: "Con el poder de la IA.",
    hero_sub: "La única plataforma que combina calculadora de interés compuesto, análisis AI de acciones, perfil de riesgo y seguimiento de portafolio — diseñada para el inversor serio de largo plazo.",
    hero_social: "Gratis para empezar · Sin tarjeta de crédito · Inversores en 30+ países",
    hero_cta1: "💰 Empezar Gratis — Calculadora",
    hero_cta2: "🎯 Analizar una Acción",
    hero_steps_title: "Tu ruta hacia la inversión inteligente",
    hero_step1_title: "Calcula tu meta",
    hero_step1_desc: "Usa la calculadora de interés compuesto para definir tu objetivo de riqueza y plan de ahorro mensual.",
    hero_step2_title: "Descubre tu perfil",
    hero_step2_desc: "Responde 8 preguntas y obtén tu perfil de inversor: Conservador, Moderado o Agresivo.",
    hero_step3_title: "Obtén tu portafolio IA",
    hero_step3_desc: "Recibe un portafolio personalizado con precios de entrada, objetivos y stop loss para cada posición.",
    hero_step4_title: "Sigue tu estrategia",
    hero_step4_desc: "Monitorea plan vs realidad — ve qué mantener, rebalancear o comprar más con precios en vivo.",
    hero_top_label: "Top Compounders — Retorno 1 año",
    footer_disc: "Solo educativo — no es asesoría financiera.",
    // WhatIf
    whatif_title: "¿Y si hubieras invertido",
    whatif_sub: "Explora el poder del interés compuesto en los mejores negocios de la última década",
    whatif_custom: "🎯 Tu Escenario Personalizado",
    whatif_capital: "Capital Inicial",
    whatif_cagr: "CAGR Esperado",
    whatif_years: "Años",
    whatif_horizon: "Horizonte",
    whatif_result: "Tu resultado en",
    whatif_multiplier: "veces tu inversión inicial",
    whatif_chart: "📈 Tu Trayectoria de Crecimiento",
    // Score Tab
    score_label: "🎯 Analizador de Acciones IA — Análisis Buffett/Munger + consenso Wall Street · 3 análisis gratis",
    score_build_portfolio: "Armar mi portafolio →",
    score_input_label: "Ticker o Nombre de Empresa",
    score_input_placeholder: "NVDA, Apple, Google, Tesla, Costco...",
    score_hint: "Escribe un ticker (NVDA) o nombre de empresa (Google, Apple, Tesla) → la IA lo analiza",
    score_analyzing: "Analizando",
    score_btn: "🎯 Analizar con IA",
    score_unlock: "🔓 Desbloquear",
    score_locked: "🔒 Datos bloqueados al análisis IA — click Desbloquear para editar",
    score_sector: "Sector",
    // Profile quiz questions
    q_horizon: "¿Cuánto tiempo puedes mantener tu dinero invertido sin necesitarlo?",
    q_horizon_1: "Menos de 2 años", q_horizon_2: "2–5 años", q_horizon_3: "5–10 años", q_horizon_4: "Más de 10 años",
    q_drop: "Tu portafolio cae 30% en un crash. ¿Qué haces?",
    q_drop_1: "Vendo todo inmediatamente", q_drop_2: "Vendo algo para reducir exposición",
    q_drop_3: "Aguanto y espero la recuperación", q_drop_4: "Compro más — es un descuento",
    q_goal: "¿Cuál es tu objetivo principal de inversión?",
    q_goal_1: "Preservar mi capital — seguridad primero", q_goal_2: "Ingresos estables con bajo riesgo",
    q_goal_3: "Crecimiento equilibrado a largo plazo", q_goal_4: "Máximo crecimiento a largo plazo",
    q_experience: "¿Cómo describirías tu experiencia invirtiendo?",
    q_experience_1: "Ninguna — apenas empiezo", q_experience_2: "Algo — he comprado ETFs o fondos",
    q_experience_3: "Moderada — sigo los mercados regularmente", q_experience_4: "Avanzada — analizo acciones individuales",
    q_income: "Si perdieras toda tu inversión, ¿cómo afectaría tu vida?",
    q_income_1: "Devastador — es la mayor parte de mis ahorros", q_income_2: "Muy difícil — un gran retroceso",
    q_income_3: "Duro pero manejable", q_income_4: "Bien — es dinero que puedo perder",
    q_volatility: "¿Qué frase describe mejor tu actitud hacia el riesgo?",
    q_volatility_1: "Prefiero retornos garantizados aunque sean bajos", q_volatility_2: "Acepto riesgo moderado para ganancias moderadas",
    q_volatility_3: "Acepto mayor volatilidad por mayores retornos", q_volatility_4: "Abrazo el alto riesgo por el máximo potencial",
    q_concentration: "¿Cuántas acciones te sentirías cómodo teniendo?",
    q_concentration_1: "1–3 blue chips muy seguros", q_concentration_2: "5–10 ETFs y acciones diversificadas",
    q_concentration_3: "10–20 mezcla de crecimiento y valor", q_concentration_4: "20+ incluyendo alto crecimiento y emergentes",
    q_age: "¿Qué edad tienes?",
    q_age_1: "55 o más", q_age_2: "45–54", q_age_3: "35–44", q_age_4: "Menos de 35",
    // Profile results
    prof_conservative: "Conservador", prof_moderate: "Moderado", prof_aggressive: "Agresivo",
    prof_conservative_desc: "Preservar el capital es tu prioridad. Prefieres estabilidad sobre crecimiento. Ideal para bonos, acciones de dividendos y ETFs de baja volatilidad.",
    prof_moderate_desc: "Buscas equilibrio entre crecimiento y seguridad. Cómodo con algunas fluctuaciones del mercado a cambio de retornos a largo plazo.",
    prof_aggressive_desc: "Eres un inversor de crecimiento dispuesto a soportar la volatilidad por retornos superiores a largo plazo. Las caídas a corto plazo son el precio del compounding.",
    prof_question: "Pregunta",
    prof_of: "de",
    prof_next: "Siguiente →",
    prof_your_profile: "Tu Perfil de Inversor",
    prof_retake: "Repetir Quiz",
    prof_generate: "🤖 Generar Mi Portafolio IA →",
    prof_generating: "Construyendo tu portafolio...",
    prof_recommended_stocks: "📈 Acciones Recomendadas",
    prof_recommended_etfs: "🗂️ ETFs Recomendados",
    prof_regenerate: "🤖 Regenerar",
    prof_allocation: "Asignación del Portafolio",
    prof_rebalance: "Rebalancear",
    prof_expected_return: "Retorno Esperado",
    prof_max_drawdown: "Caída Máxima",
    // Portfolio tab
    port_add_position: "➕ Agregar Posición",
    port_manual: "✏️ Manual", port_paste: "📋 Pegar de Excel", port_csv: "📂 Importar CSV",
    port_btn_refresh: "🔄 Actualizar Precios",
    port_btn_ai: "🤖 Análisis IA",
    port_alloc_title: "🥧 Asignación del Portafolio",
    port_empty_title: "Tu portafolio está vacío",
    port_empty_sub: "Agrega tu primera posición. Luego actualiza precios para ver tu P&G en tiempo real.",
    port_positions: "Posición", port_stocks: "Acciones", port_avg_cost: "Costo Prom.",
    port_current: "Precio Actual", port_total_cost: "Costo Total", port_curr_value: "Valor Actual",
    port_pnl_d: "P&G $", port_pnl_p: "P&G %", port_today: "Hoy", port_verdict: "Veredicto IA",
    port_run_ai: "Ejecutar IA",
    // Strategy tab
    strat_days: "días activo",
    strat_kpi_positions: "Posiciones Recomendadas",
    strat_kpi_executed: "Posiciones Ejecutadas",
    strat_kpi_days: "Días Siguiendo",
    strat_kpi_return: "Retorno Esperado",
    strat_entry: "Zona Entrada", strat_target: "Objetivo", strat_stop: "Stop Loss",
    strat_your_weight: "Tu Peso", strat_status: "Estado", strat_pnl: "P&G",
    strat_in_zone: "✅ En zona", strat_target_hit: "🎯 Objetivo!",
    strat_not_exec: "❌ No ejecutado", strat_executed: "✅ Ejecutado", strat_partial: "⚠️ Parcial",
    strat_refresh: "🔄 Actualizar Precios", strat_clear: "🗑 Limpiar",
    strat_original: "📋 Estrategia Original",
    strat_update_port: "Actualizar Mi Portafolio", strat_rebuild: "Reconstruir Mi Estrategia",
    // Compound Tab
    comp_title: "Calculadora de Interés Compuesto",
    comp_title: "Calculadora de Interés Compuesto",
    comp_free: "✓ 100% Gratis · Sin cuenta · Sin tarjeta · Interés mensual compuesto",
    comp_initial: "Capital inicial",
    comp_rate: "Tasa de retorno",
    comp_contrib: "Aporte mensual",
    comp_years: "Años de inversión",
    comp_annual: "Anual",
    comp_monthly: "Mensual",
    comp_calculate: "Calcular",
    comp_final: "Balance Final",
    comp_invested: "Total Invertido",
    comp_earned: "Interés Ganado",
    comp_rule72: "La Regla del 72",
    comp_double: "Tu dinero se duplica en",
    comp_table: "Ver tabla año a año",
    comp_year: "Año", comp_capital: "Capital", comp_interest: "Interés", comp_total: "Total",
    // Profile Tab
    prof_title: "¿Cuál es tu perfil de inversor?",
    prof_sub: "Responde 8 preguntas y nuestra IA construirá un portafolio personalizado para ti — acciones, ETFs, precios de entrada, objetivos y stop loss.",
    prof_start: "Comenzar el Quiz →",
    prof_generate: "🤖 Generar Mi Portafolio IA →",
    prof_retake: "Volver a tomar el Quiz",
    prof_stocks: "Acciones Recomendadas",
    prof_etfs: "ETFs Recomendados",
    // Portfolio Tab  
    port_title: "Mi Portafolio",
    port_sub: "Sigue tus posiciones · Precios en vivo · Análisis IA",
    port_add: "➕ Agregar Posición",
    port_ticker: "Ticker",
    port_shares: "Acciones",
    port_buy_price: "Precio de Compra",
    port_date: "Fecha de Compra",
    port_btn_add: "➕ Agregar al Portafolio",
    port_refresh: "🔄 Actualizar Precios",
    port_ai: "🤖 Análisis IA",
    port_invested: "Total Invertido",
    port_value: "Valor Actual",
    port_pnl: "P&G Total",
    port_return: "Retorno Total",
    port_empty_title: "Tu portafolio está vacío",
    port_empty_sub: "Agrega tu primera posición usando el formulario. Luego actualiza los precios para ver tu P&G en tiempo real.",
    // Strategy Tab
    strat_title: "Mi Estrategia",
    strat_no_strategy: "Aún no tienes una estrategia guardada",
    strat_no_sub: "Crea tu Perfil de Riesgo, genera un portafolio IA y haz clic en '✅ Sí — Seguir Mi Estrategia' para empezar a rastrear tu plan aquí.",
    strat_create: "🧬 Crear Mi Perfil de Riesgo →",
    strat_plan: "📊 Plan vs Realidad",
    strat_refresh: "🔄 Actualizar Precios",
  }
};


// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({onClose, onAuth, lang="en", initialMode="signup"}){
  const [mode, setMode] = useState(initialMode); // signup | login | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const isEs = lang === "es";

  const handleSubmit = async () => {
    if (!email || (!password && mode !== "reset")) {
      setErr(isEs ? "Por favor completa todos los campos" : "Please fill in all fields");
      return;
    }
    if (password && password.length < 6 && mode !== "reset") {
      setErr(isEs ? "La contraseña debe tener al menos 6 caracteres" : "Password must be at least 6 characters");
      return;
    }
    setLoading(true); setErr(""); setSuccess("");
    try {
      if (!supabase) throw new Error("Auth service not configured");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(isEs
          ? "✅ ¡Cuenta creada! Revisa tu email para confirmar."
          : "✅ Account created! Check your email to confirm.");
        if (data.user) onAuth(data.user);
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
        onClose();
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess(isEs
          ? "✅ Email enviado. Revisa tu bandeja de entrada."
          : "✅ Reset email sent. Check your inbox.");
      }
    } catch(e) {
      const msg = e.message || "";
      if (msg.includes("already registered")) setErr(isEs ? "Este email ya está registrado. Inicia sesión." : "Email already registered. Please sign in.");
      else if (msg.includes("Invalid login")) setErr(isEs ? "Email o contraseña incorrectos." : "Invalid email or password.");
      else if (msg.includes("Email not confirmed")) setErr(isEs ? "Confirma tu email antes de entrar." : "Please confirm your email first.");
      else setErr(msg || (isEs ? "Error. Intenta de nuevo." : "Something went wrong. Try again."));
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="auth-modal" style={{background:T.card,border:`2px solid ${T.goldDim}`,borderRadius:20,padding:"36px 40px",maxWidth:420,width:"100%",position:"relative",maxHeight:"90vh",overflowY:"auto"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}>✕</button>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:32,marginBottom:8}}>📈</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.gold,fontWeight:700}}>Inversoria</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>
            {mode==="signup"?(isEs?"Crea tu cuenta gratis":"Create your free account")
             :mode==="login"?(isEs?"Bienvenido de vuelta":"Welcome back")
             :(isEs?"Recuperar contraseña":"Reset your password")}
          </div>
        </div>

        {/* Toggle signup/login */}
        {mode!=="reset"&&<div style={{display:"flex",background:T.accent,borderRadius:10,padding:4,marginBottom:20}}>
          {["signup","login"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
              background:mode===m?T.gold:"transparent",color:mode===m?"#0a0c10":T.muted,transition:"all 0.2s"}}>
              {m==="signup"?(isEs?"Registrarme":"Sign Up"):(isEs?"Iniciar Sesión":"Sign In")}
            </button>
          ))}
        </div>}

        {/* Fields */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:6}}>Email</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder={isEs?"tu@email.com":"you@email.com"}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
            style={{fontSize:15,padding:"11px 14px"}}/>
        </div>
        {mode!=="reset"&&<div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:6}}>{isEs?"Contraseña":"Password"}</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder={isEs?"Mínimo 6 caracteres":"At least 6 characters"}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
            style={{fontSize:15,padding:"11px 14px"}}/>
        </div>}

        {err&&<div style={{padding:"10px 14px",background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,marginBottom:14,border:`1px solid ${T.red}33`}}>{err}</div>}
        {success&&<div style={{padding:"10px 14px",background:`${T.green}15`,borderRadius:8,fontSize:12,color:T.green,marginBottom:14,border:`1px solid ${T.green}33`}}>{success}</div>}

        <button className="btn btn-gold" onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"13px 0",fontSize:15,borderRadius:10,marginBottom:14}}>
          {loading?<><span className="sp">⟳</span> {isEs?"Procesando...":"Processing..."}</>
           :mode==="signup"?(isEs?"Crear Cuenta Gratis":"Create Free Account")
           :mode==="login"?(isEs?"Entrar":"Sign In")
           :(isEs?"Enviar Email":"Send Reset Email")}
        </button>

        {/* Forgot password */}
        {mode==="login"&&<div style={{textAlign:"center",marginBottom:10}}>
          <button onClick={()=>setMode("reset")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.muted,textDecoration:"underline"}}>
            {isEs?"¿Olvidaste tu contraseña?":"Forgot password?"}
          </button>
        </div>}
        {mode==="reset"&&<div style={{textAlign:"center"}}>
          <button onClick={()=>setMode("login")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.muted,textDecoration:"underline"}}>
            {isEs?"Volver al inicio de sesión":"Back to sign in"}
          </button>
        </div>}

        {/* Privacy note */}
        <div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.6,marginTop:10}}>
          {isEs
            ?<>Al registrarte aceptas nuestros <span style={{color:T.gold,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setShowTerms&&setShowTerms(true)}>Términos de Uso</span> y <span style={{color:T.gold,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setShowPrivacy&&setShowPrivacy(true)}>Política de Privacidad</span>. Tus datos están protegidos y nunca los vendemos.</>
            :<>By signing up you agree to our <span style={{color:T.gold,cursor:"pointer",textDecoration:"underline"}}>Terms of Use</span> and <span style={{color:T.gold,cursor:"pointer",textDecoration:"underline"}}>Privacy Policy</span>. Your data is protected and never sold.</>}
        </div>
      </div>
    </div>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({onStart,lang="en"}){
  const L=LANG[lang]||LANG.en;
  const isEs=lang==="es";
  const TOP=[{t:"NVDA",r:"142%"},{t:"AAPL",r:"21%"},{t:"COST",r:"38%"},{t:"AMZN",r:"81%"},{t:"META",r:"194%"},{t:"MSFT",r:"28%"}];

  return<div className="hero-grad fi" style={{maxWidth:1380,margin:"0 auto"}}>

    {/* ── HERO PRINCIPAL ── */}
    <div className="hero-pad" style={{padding:"56px 28px 48px",textAlign:"center"}}>

      {/* Badge social proof */}
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${T.green}15`,border:`1px solid ${T.green}33`,borderRadius:20,padding:"5px 16px",marginBottom:20}}>
        <span style={{fontSize:12,color:T.green,fontWeight:500}}>
          ★ {isEs?"Ya somos más de 500 inversores en LATAM — únete gratis":"Trusted by 500+ investors across Latin America"}
        </span>
      </div>

      {/* Headline */}
      <h1 className="hero-h1" style={{fontFamily:"'Playfair Display',serif",fontSize:clamp(34,5,50),color:T.text,lineHeight:1.15,marginBottom:16,fontWeight:700}}>
        {isEs
          ?<>¿Vale la pena<br/><span style={{color:T.gold}}>esta acción?</span></>
          :<>Is this stock<br/><span style={{color:T.gold}}>worth buying?</span></>}
      </h1>

      <p style={{fontSize:19,color:T.muted,maxWidth:560,margin:"0 auto 10px",lineHeight:1.75,fontWeight:400}}>
        {isEs
          ?"La IA analiza cualquier acción en 30 segundos y te dice si es buena o mala inversión — en español, sin experiencia previa."
          :"AI analyzes any stock in 30 seconds and tells you if it's a good or bad investment — in Spanish, no experience needed."}
      </p>
      <p style={{fontSize:13,color:`${T.muted}88`,marginBottom:28}}>
        {isEs
          ?"Tu analista de inversiones personal · Colombia · México · Argentina · Chile · Todo LATAM"
          :"Your personal investment analyst · All of Latin America"}
      </p>

      {/* CTA buttons */}
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:12,padding:"0 8px"}}>
        <button className="btn btn-gold btn-mobile-full" onClick={()=>onStart("score")}
          style={{fontSize:16,padding:"15px 36px",borderRadius:12,boxShadow:`0 4px 24px ${T.gold}33`}}>
          {isEs?"🎯 Analizar una acción gratis":"🎯 Analyze a stock — free"}
        </button>
        <button className="btn btn-outline" onClick={()=>onStart("profile")}
          style={{fontSize:14,padding:"15px 26px",borderRadius:12}}>
          {isEs?"🧬 ¿Qué tipo de inversor soy?":"🧬 What type of investor am I?"}
        </button>
      </div>

      {/* Free tier info */}
      <p style={{fontSize:12,color:`${T.muted}77`,marginBottom:0}}>
        {isEs
          ?"3 análisis gratis · Sin registrarte · Sin tarjeta de crédito"
          :"3 free analyses · No sign up required · No credit card"}
      </p>
    </div>

    {/* ── 3 PASOS DUOLINGO STYLE ── */}
    <div style={{padding:"0 28px 48px",maxWidth:960,margin:"0 auto"}}>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:20}}>
        {isEs?"Cómo funciona — 3 pasos":"How it works — 3 steps"}
      </div>
      <div className="hero-steps" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:"100%"}}>
        {[
          {
            step:isEs?"Paso 1 — Gratis":"Step 1 — Free",
            color:T.gold,
            icon:"🎯",
            title:isEs?"¿Vale la pena esta acción?":"Is this stock worth it?",
            desc:isEs?"Escribe el nombre o ticker de cualquier acción. En 30 segundos recibes un score de calidad y una recomendación clara — comprar, esperar o evitar.":"Type any stock name or ticker. In 30 seconds you get a quality score and a clear recommendation — buy, wait, or avoid.",
            tab:"score",
            cta:isEs?"Analizar ahora →":"Analyze now →",
          },
          {
            step:isEs?"Paso 2 — Gratis":"Step 2 — Free",
            color:T.blue,
            icon:"🧬",
            title:isEs?"¿Qué tipo de inversor eres?":"What type of investor are you?",
            desc:isEs?"8 preguntas rápidas. La IA descubre tu perfil de riesgo y te dice exactamente qué tipo de acciones se adaptan a ti.":"8 quick questions. AI discovers your risk profile and tells you exactly what type of stocks suit you.",
            tab:"profile",
            cta:isEs?"Hacer el test →":"Take the test →",
          },
          {
            step:isEs?"Paso 3 — Gratis hasta 5":"Step 3 — Free up to 5",
            color:T.green,
            icon:"📁",
            title:isEs?"Sigue tu dinero en tiempo real":"Track your money in real time",
            desc:isEs?"Agrega tus acciones y ve cuánto ganaste o perdiste hoy. La IA analiza tu portafolio completo y te dice cómo mejorarlo.":"Add your stocks and see how much you gained or lost today. AI analyzes your full portfolio and tells you how to improve it.",
            tab:"portfolio",
            cta:isEs?"Armar portafolio →":"Build portfolio →",
          },
        ].map(({step,color,icon,title,desc,tab,cta})=>(
          <div key={tab} onClick={()=>onStart(tab)}
            style={{cursor:"pointer",background:T.card,border:`1px solid ${color}33`,borderRadius:14,padding:"22px 20px",textAlign:"center",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px ${color}18`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${color}33`;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
            <div style={{width:48,height:48,background:`${color}18`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:22}}>{icon}</div>
            <div style={{fontSize:10,color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{step}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,fontWeight:700,marginBottom:8}}>{title}</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:14}}>{desc}</div>
            <div style={{fontSize:12,color,fontWeight:600}}>{cta}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ── STATS STRIP ── */}
    <div style={{borderTop:`1px solid ${T.border}22`,borderBottom:`1px solid ${T.border}22`,background:`${T.accent}88`,padding:"20px 28px",marginBottom:0}}>
      <div className="kpi-4" style={{maxWidth:800,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center"}}>
        {[
          {n:"500+",l:isEs?"inversores en LATAM":"investors in LATAM"},
          {n:"30s",l:isEs?"por análisis de acción":"per stock analysis"},
          {n:"8",l:isEs?"países y monedas":"countries & currencies"},
          {n:"100%",l:isEs?"en español":"in Spanish"},
        ].map(({n,l})=>(
          <div key={l}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.gold,fontWeight:700}}>{n}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ── TOP COMPOUNDERS ── */}
    <div style={{padding:"28px 28px 32px",textAlign:"center"}}>
      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>
        {isEs?"Acciones populares — toca para analizar":"Popular stocks — tap to analyze"}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        {TOP.map(({t,r})=>(
          <div key={t} onClick={()=>onStart("score",t)}
            style={{cursor:"pointer",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 18px",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.goldDim;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateY(0)";}}>
            <Mn sz={13} c={T.text} s={{fontWeight:700}}>{t}</Mn>
            <span style={{fontSize:12,color:T.green,fontWeight:600}}>+{r}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{maxWidth:800,margin:"0 auto",padding:"0 28px 32px"}}><AdBanner size="leaderboard"/></div>
  </div>;
}

function clamp(min,mid,max){return`clamp(${min}px,${mid}vw,${max}px)`;}

// ── COMPOUND CALCULATOR ────────────────────────────────────────────────────────
// FIX 1: Monthly compounding formula (matches industry standard)
function calcCompound(cfg){
  // Always compound monthly for accuracy
  const monthlyRate=cfg.rateType==="monthly"?cfg.rate/100:(cfg.rate/100)/12;
  const monthlyContrib=cfg.contribFreq==="monthly"?cfg.contrib:cfg.contrib/12;
  let balance=cfg.initial,totalContrib=cfg.initial,totalInt=0;
  return Array.from({length:cfg.years},(_,yi)=>{
    let yearInt=0;
    for(let m=0;m<12;m++){
      const intM=balance*monthlyRate;
      balance=balance+intM+monthlyContrib;
      yearInt+=intM;
      totalContrib+=monthlyContrib;
    }
    totalInt+=yearInt;
    return{year:yi+1,label:`Y${yi+1}`,contributed:Math.round(totalContrib),interest:Math.round(totalInt),interestAnual:Math.round(yearInt),balance:Math.round(balance),mult:+(balance/cfg.initial).toFixed(2)};
  });
}

// Goal: reach $1,000,000 — how much/month needed starting at each age (by 65)
// and how many years at $200/month to hit $1M
function calcMonthlyNeeded(startAge,goal=1000000,annualRate=10){
  const r=(annualRate/100)/12;
  const n=(65-startAge)*12;
  if(n<=0)return Infinity;
  return Math.round(goal*r/((Math.pow(1+r,n)-1)));
}
function calcYearsTo1M(startAge,monthly=200,annualRate=10){
  const r=(annualRate/100)/12;
  const goal=1000000;
  if(monthly<=0)return Infinity;
  const months=Math.log(1+goal*r/monthly)/Math.log(1+r);
  return {years:months/12, reachAge:Math.round(startAge+months/12)};
}

function CompoundTab({onGoToTab,lang="en"}){
  const L2=LANG[lang]||LANG.en;
  // Currency-aware slider limits — scale USD maxes by live exchange rate
  const sMaxInitial=Math.round(5000000*_exRate);   // $5M USD equiv
  const sStepInitial=Math.round(1000*_exRate);
  const sMaxContrib=Math.round(20000*_exRate);      // $20K USD/mo equiv
  const sStepContrib=Math.round(50*_exRate);
  const sMaxGoal=Math.round(5000000*_exRate);       // $5M USD equiv for goal
  const sStepGoal=Math.round(50000*_exRate);
  const [draft,setDraft]=useState({initial:Math.round(10000*_exRate),rate:10,rateType:"annual",contrib:Math.round(500*_exRate),contribFreq:"monthly",years:10});
  const [cfg,setCfg]=useState({initial:Math.round(10000*_exRate),rate:10,rateType:"annual",contrib:Math.round(500*_exRate),contribFreq:"monthly",years:10});
  const [showTable,setShowTable]=useState(false);
  const setD=(k,v)=>setDraft(p=>({...p,[k]:v}));

  const effectiveAnnualRate=cfg.rateType==="monthly"?((Math.pow(1+cfg.rate/100,12)-1)*100):cfg.rate;
  const data=useCallback(()=>calcCompound(cfg),[cfg])();
  const last=data[data.length-1]||{};
  const doubleYears=(72/effectiveAnnualRate).toFixed(1);
  const annualContrib=cfg.contribFreq==="monthly"?cfg.contrib*12:cfg.contrib;

  const StackedTT=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    const cap=payload.find(p=>p.dataKey==="contributed")?.value||0;
    const int=payload.find(p=>p.dataKey==="interest")?.value||0;
    return<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14,minWidth:230}}>
      <div style={{fontSize:12,color:T.gold,marginBottom:8,fontFamily:"'Playfair Display',serif"}}>{label}</div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}><span style={{color:T.muted}}>💵 {lang==="es"?"Capital Invertido":"Capital Invested"}</span><Mn sz={11} c={T.blue}>{fmt(cap)}</Mn></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}><span style={{color:T.muted}}>✨ {lang==="es"?"Interés Ganado":"Interest Earned"}</span><Mn sz={11} c={T.green}>{fmt(int)}</Mn></div>
      <div style={{borderTop:`1px solid ${T.border}33`,paddingTop:6,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:T.muted}}>Total Balance</span>
        <Mn sz={12} c={T.gold} s={{fontWeight:700}}>{fmt(cap+int)}</Mn>
      </div>
      {int>cap&&<div style={{marginTop:5,fontSize:10,color:T.green,textAlign:"center",padding:"3px 0",borderTop:`1px solid ${T.green}22`,marginTop:6}}>✨ Interest exceeds capital!</div>}
    </div>;
  };

  // Million dollar goal data per starting age
  const MILLION_DATA=[20,25,30,35,40,50].map(age=>({
    age,
    yearsTo65:65-age,
    monthlyNeeded:calcMonthlyNeeded(age),
    reach200:calcYearsTo1M(age,200),
    dailyCost:Math.ceil(calcMonthlyNeeded(age)/30),
  }));

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:8}}>
        <span style={{fontSize:11,color:T.green,fontWeight:600}}>{lang==="es"?"✓ 100% Gratis · Sin cuenta · Sin tarjeta · Interés mensual compuesto":"✓ 100% Free · No account · No credit card · Monthly compounding"}</span>
      </div>
    </div>

    {/* KPI cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      {[
        {l:lang==="es"?"Balance Final":"Final Balance",v:fmt(last.balance||0),c:T.gold,sub:lang==="es"?`en ${cfg.years} años`:`in ${cfg.years} years`,icon:"🏆"},
        {l:lang==="es"?"Total Invertido":"Total Invested",v:fmt(last.contributed||0),c:T.blue,sub:lang==="es"?"tu dinero":"your money",icon:"💵"},
        {l:lang==="es"?"Interés Ganado":"Interest Earned",v:fmt(last.interest||0),c:T.green,sub:`${last.balance?((last.interest/last.balance)*100).toFixed(0):0}% of total`,icon:"✨"},
        {l:lang==="es"?"Multiplicador":"Multiplier",v:`${last.mult||1}x`,c:T.purple,sub:`Doubles every ${doubleYears} yrs`,icon:"🚀"},
      ].map(({l,v,c,sub,icon})=><Card key={l} s={{padding:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,fontSize:22,opacity:0.12}}>{icon}</div>
        <Lbl>{l}</Lbl>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700,marginBottom:3,wordBreak:"break-all"}}>{v}</div>
        <div style={{fontSize:10,color:T.muted}}>{sub}</div>
      </Card>)}
    </div>

    <div className="compound-layout" style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:18}}>
      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:18}}>⚙️ Your Scenario</div>
          <Lbl>Initial Investment</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>{_currency.symbol}</span><input type="number" value={draft.initial} min={0} step={sStepInitial} onChange={e=>setD("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/></div>
          <input type="range" min={0} max={sMaxInitial} step={sStepInitial} value={draft.initial} onChange={e=>setD("initial",parseFloat(e.target.value))} style={{marginBottom:16}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Annual Rate</Lbl>
            <div style={{display:"flex",gap:4}}>{["annual","monthly"].map(t=><button key={t} className={`seg ${draft.rateType===t?"seg-on":""}`} onClick={()=>setD("rateType",t)}>{t==="annual"?"Annual":"Monthly"}</button>)}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><input type="number" value={draft.rate} min={0.01} max={draft.rateType==="monthly"?5:100} step={0.1} onChange={e=>setD("rate",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/><span style={{color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>% /{draft.rateType==="annual"?"yr":"mo"}</span></div>
          <input type="range" min={0.1} max={draft.rateType==="monthly"?5:100} step={0.1} value={draft.rate} onChange={e=>setD("rate",parseFloat(e.target.value))} style={{marginBottom:4}}/>
          {draft.rateType==="monthly"
            ?<div style={{fontSize:10,color:T.green,marginBottom:12}}>≡ {((Math.pow(1+draft.rate/100,12)-1)*100).toFixed(2)}% {lang==="es"?"efectivo anual":"effective annual"}</div>
            :<div style={{fontSize:10,color:T.muted,marginBottom:12}}>≡ {(draft.rate/12).toFixed(3)}% per month (compounded monthly)</div>}
          <div style={{marginBottom:8}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Contributions (DCA)</Lbl>
            <div style={{display:"flex",gap:4}}>{["monthly","annual"].map(t=><button key={t} className={`seg ${draft.contribFreq===t?"seg-on":""}`} onClick={()=>setD("contribFreq",t)}>{t==="monthly"?"Mo":"Yr"}</button>)}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>{_currency.symbol}</span><input type="number" value={draft.contrib} min={0} max={sMaxContrib} step={sStepContrib} onChange={e=>setD("contrib",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/><span style={{color:T.muted,fontSize:11}}>/{draft.contribFreq==="monthly"?"month":"year"}</span></div>
          <input type="range" min={0} max={sMaxContrib} step={sStepContrib} value={draft.contrib} onChange={e=>setD("contrib",parseFloat(e.target.value))} style={{marginBottom:16}}/>
          <Lbl>Investment Horizon</Lbl>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:T.muted}}>Years</span><Mn sz={13} c={T.gold}>{draft.years} years</Mn></div>
          <input type="range" min={1} max={50} step={1} value={draft.years} onChange={e=>setD("years",parseInt(e.target.value))} style={{marginBottom:20}}/>
          <button className="btn btn-gold" onClick={()=>setCfg({...draft})} style={{width:"100%",fontSize:15,padding:"13px 0",borderRadius:10}}>
            🔄 Calculate Results
          </button>
        </Card>
        <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:12}}>{lang==="es"?"✨ La Magia del Interés Compuesto":"✨ The Magic of Compounding"}</div>
          {[
            {l:lang==="es"?"Solo Capital (sin interés)":"Capital only (no interest)",v:fmt(last.contributed||0)},
            {l:lang==="es"?"Con interés compuesto 🏆":"With compound interest 🏆",v:fmt(last.balance||0),hi:true},
            {l:lang==="es"?"Generado solo por interés":"Generated by interest alone",v:`+${fmt(last.interest||0)}`,pos:true},
          ].map(({l,v,hi,pos})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}22`,alignItems:"center"}}>
            <span style={{fontSize:11,color:hi?T.text:T.muted}}>{l}</span>
            <Mn sz={hi?12:11} c={pos?T.green:hi?T.gold:T.muted} s={hi?{fontWeight:700}:{}}>{v}</Mn>
          </div>)}
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.7}}>
            📐 <span style={{color:T.gold}}>{lang==="es"?"Regla del 72:":"Rule of 72:"}</span> Your money doubles every <span style={{color:T.goldLight}}>{doubleYears} years</span> at {effectiveAnnualRate.toFixed(2)}% effective annual
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>{lang==="es"?"📊 Capital vs. Interés — El Efecto Bola de Nieve":"📊 Capital vs. Interest — The Snowball Effect"}</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:14}}>Watch the green (interest) bar grow until it <strong style={{color:T.green}}>overtakes</strong> the blue (capital)</div>
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.max(0,Math.floor(cfg.years/8)-1)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtShort(v)} width={82}/>
                <Tooltip content={<StackedTT/>}/>
                <Legend formatter={n=>n==="contributed"?(lang==="es"?"Capital Invertido":"Capital Invested"):(lang==="es"?"Interés Ganado":"Interest Earned")} wrapperStyle={{fontSize:11,color:T.muted,paddingTop:8}}/>
                <Bar dataKey="contributed" stackId="a" fill={T.blue} opacity={0.85} name="contributed"/>
                <Bar dataKey="interest" stackId="a" fill={T.green} opacity={0.85} name="interest" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>📈 Annual Interest Generated</div>
          <div style={{height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.max(0,Math.floor(cfg.years/8)-1)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtShort(v)} width={82}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={v=>[fmt(v),"Annual Interest"]}/>
                <Bar dataKey="interestAnual" fill={T.green} opacity={0.85} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <AdBanner size="rectangle"/>
      </div>
    </div>

    {/* Milestones */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[5,10,20,cfg.years].filter((y,i,a)=>a.indexOf(y)===i&&y<=cfg.years).slice(0,4).map(y=>{
        const row=data[y-1];if(!row)return null;
        const intAhead=row.interest>row.contributed;
        return<Card key={y} s={{padding:14,textAlign:"center",background:`${T.gold}06`,border:`1px solid ${T.goldDim}33`}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Year {y}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:4,wordBreak:"break-all"}}>{fmt(row.balance)}</div>
          <div style={{fontSize:10,color:T.green,marginBottom:3}}>×{row.mult} initial</div>
          {intAhead?<div style={{fontSize:10,color:T.green,padding:"2px 6px",background:`${T.green}15`,borderRadius:10}}>Interest &gt; Capital ✨</div>
            :<div style={{fontSize:10,color:T.muted}}>{row.balance>0?((row.interest/row.balance)*100).toFixed(0):0}% from interest</div>}
        </Card>;
      })}
    </div>

    {/* ── FIX 3: IMPROVED TABLE with highlighted interest column ── */}
    <Card s={{padding:0,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>📋 Year-by-Year Breakdown</div>
          <div style={{fontSize:11,color:T.muted,marginTop:3}}>
            <span style={{color:T.green,fontWeight:600}}>Green column = interest generated</span> — this is what pays for your lifestyle
          </div>
        </div>
        <button className="seg" onClick={()=>setShowTable(v=>!v)}>{showTable?"Hide Table":"Show Table"}</button>
      </div>
      {showTable&&<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
          <thead>
            <tr style={{background:T.accent}}>
              <th style={{padding:"12px 16px",textAlign:"center",fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Year</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.blue,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Annual Contribution</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.green,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:`${T.green}12`,borderBottom:`2px solid ${T.green}44`}}>✨ Interest This Year</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.green,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:`${T.green}08`,borderBottom:`2px solid ${T.green}33`}}>Cumulative Interest</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.gold,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Final Balance</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>×Initial</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r=>{
              const hi=r.year%5===0||r.year===cfg.years;
              const intAhead=r.interest>r.contributed;
              const intPct=r.balance>0?((r.interestAnual/r.balance)*100).toFixed(1):0;
              return<tr key={r.year} style={{borderBottom:`1px solid ${T.border}22`,background:hi?`${T.gold}09`:"transparent",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=hi?`${T.gold}12`:`${T.accent}88`}
                onMouseLeave={e=>e.currentTarget.style.background=hi?`${T.gold}09`:"transparent"}>
                <td style={{padding:"10px 16px",textAlign:"center"}}>
                  <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",background:intAhead?`${T.green}25`:hi?`${T.gold}33`:T.accent,border:`1px solid ${intAhead?T.green:hi?T.goldDim:T.border}`}}>
                    <Mn sz={10} c={intAhead?T.green:hi?T.gold:T.muted}>{r.year}</Mn>
                  </div>
                  {intAhead&&r.year===data.findIndex(d=>d.interest>d.contributed)+1&&<div style={{fontSize:8,color:T.green,marginTop:2,whiteSpace:"nowrap"}}>↑ crossover</div>}
                </td>
                <td style={{padding:"10px 16px",textAlign:"right"}}>
                  <Mn sz={12} c={T.blue}>{fmt(annualContrib)}</Mn>
                </td>
                {/* HIGHLIGHTED INTEREST COLUMN */}
                <td style={{padding:"10px 16px",textAlign:"right",background:`${T.green}08`,borderLeft:`1px solid ${T.green}22`,borderRight:`1px solid ${T.green}22`}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                    <Mn sz={13} c={T.green} s={{fontWeight:600}}>{fmt(r.interestAnual)}</Mn>
                    <div style={{fontSize:9,color:T.green,opacity:0.7}}>{intPct}% of balance/yr</div>
                    <div style={{width:Math.min((r.interestAnual/(data[data.length-1]?.interestAnual||1))*60,60),height:2,background:T.green,borderRadius:2,opacity:0.5}}/>
                  </div>
                </td>
                <td style={{padding:"10px 16px",textAlign:"right",background:`${T.green}04`}}>
                  <Mn sz={12} c={intAhead?T.green:`${T.green}99`}>{fmt(r.interest)}</Mn>
                  <div style={{fontSize:9,color:T.muted,marginTop:2}}>{r.balance>0?((r.interest/r.balance)*100).toFixed(0):0}% of balance</div>
                </td>
                <td style={{padding:"10px 16px",textAlign:"right"}}>
                  <Mn sz={hi?14:12} c={hi?T.gold:T.text} s={hi?{fontWeight:700}:{}}>{fmt(r.balance)}</Mn>
                </td>
                <td style={{padding:"10px 16px",textAlign:"right"}}>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:r.mult>=10?`${T.gold}22`:r.mult>=5?`${T.gold}15`:r.mult>=2?`${T.green}15`:`${T.blue}15`,color:r.mult>=10?T.gold:r.mult>=5?T.gold:r.mult>=2?T.green:T.blue,fontWeight:r.mult>=5?700:400}}>×{r.mult}</span>
                </td>
              </tr>;
            })}
          </tbody>
          <tfoot>
            <tr style={{borderTop:`2px solid ${T.border}`,background:T.accent}}>
              <td style={{padding:"12px 16px",textAlign:"center"}}><Mn sz={11} c={T.gold}>TOTAL</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right"}}><Mn sz={12} c={T.blue}>{fmt(annualContrib*cfg.years)}</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right",background:`${T.green}10`}}><Mn sz={12} c={T.muted}>—</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right",background:`${T.green}06`}}><Mn sz={14} c={T.green} s={{fontWeight:700}}>{fmt(last.interest||0)}</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right"}}><Mn sz={14} c={T.gold} s={{fontWeight:700}}>{fmt(last.balance||0)}</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right"}}><span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:`${T.gold}22`,color:T.gold,border:`1px solid ${T.goldDim}`,fontWeight:700}}>×{last.mult}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>}
    </Card>

    {/* ── MILLION DOLLAR GOAL SECTION ── */}
    <MillionGoalSection lang={lang}/>

    {/* ── NEXT STEP CTA ── */}
    <div style={{background:`linear-gradient(135deg,${T.accent},${T.card})`,border:`1px solid ${T.goldDim}44`,borderRadius:16,padding:"32px 28px",textAlign:"center"}}>
      <div style={{fontSize:11,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>✦ You know the numbers — now take action</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.text,marginBottom:8,fontWeight:700}}>
        What's your <span style={{color:T.gold}}>next step?</span>
      </div>
      <div style={{fontSize:13,color:T.muted,marginBottom:28,maxWidth:520,margin:"0 auto 28px",lineHeight:1.7}}>
        You've seen how compound interest builds wealth. Now discover exactly what to invest in — based on your risk profile, your goals, and your current portfolio.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:860,margin:"0 auto"}}>
        {[
          {icon:"🧬",title:"Discover Your Investor DNA",desc:"Take our 8-question quiz and get a Conservative, Moderate, or Aggressive profile with a personalized AI portfolio.",cta:lang==="es"?"Tomar el Quiz →":"Take the Quiz →",tab:"profile",color:T.purple},
          {icon:"🎯",title:"Analyze a Specific Stock",desc:"Enter any ticker — NVDA, AAPL, COST — and get a Buffett/Munger quality score, moat analysis, and Wall Street consensus.",cta:"Analyze a Stock →",tab:"score",color:T.gold},
          {icon:"📁",title:"Audit Your Portfolio",desc:"Already invested? Upload your positions and our AI will tell you what to hold, buy more, or sell — with live prices.",cta:"Analyze Portfolio →",tab:"portfolio",color:T.green},
        ].map(({icon,title,desc,cta,tab,color})=>(
          <div key={tab} onClick={()=>onGoToTab(tab)}
            style={{cursor:"pointer",background:T.card,border:`1px solid ${color}33`,borderRadius:14,padding:22,textAlign:"left",transition:"all 0.2s",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${color}33`;e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.text,fontWeight:600,marginBottom:8}}>{title}</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:14}}>{desc}</div>
            <div style={{fontSize:12,color:color,fontWeight:600}}>{cta}</div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

function MillionGoalSection({lang="en"}){
  const RATE=10;
  const [age,setAge]=useState(30);
  const [goal,setGoal]=useState(1000000);
  const [monthly,setMonthly]=useState(300);

  const r=(RATE/100)/12;

  // At current monthly savings, what age do you hit the goal?
  const monthsToGoal=monthly>0?Math.log(1+goal*r/monthly)/Math.log(1+r):Infinity;
  const reachAge=isFinite(monthsToGoal)?Math.round(age+monthsToGoal/12):null;
  const yearsToGoal=isFinite(monthsToGoal)?Math.round(monthsToGoal/12):null;

  // How much/month needed to hit goal by 65?
  const yearsLeft=65-age;
  const n=yearsLeft*12;
  const neededMonthly=n>0?Math.round(goal*r/(Math.pow(1+r,n)-1)):Infinity;
  const neededDaily=Math.ceil(neededMonthly/30);

  // What if you wait 5 or 10 years?
  const neededAt5=((65-(age+5))*12)>0?Math.round(goal*r/(Math.pow(1+r,(65-(age+5))*12)-1)):Infinity;
  const neededAt10=((65-(age+10))*12)>0?Math.round(goal*r/(Math.pow(1+r,(65-(age+10))*12)-1)):Infinity;

  const canReach=reachAge&&reachAge<=85;
  const goalFmt=n=>"$"+Math.round(n).toLocaleString("en-US");
  const resultColor=canReach&&reachAge<=65?T.green:canReach?T.gold:T.red;

  return<Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.goldDim}44`,padding:0,overflow:"hidden"}}>
    {/* Header */}
    <div style={{textAlign:"center",padding:"28px 24px 20px",borderBottom:`1px solid ${T.border}33`}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.gold}15`,border:`1px solid ${T.goldDim}`,borderRadius:20,padding:"5px 14px",marginBottom:14}}>
        <span style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>{lang==="es"?"🎯 Tu Plan Personal de Riqueza":"🎯 Your Personal Wealth Plan"}</span>
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.text,marginBottom:8,fontWeight:700}}>
        {lang==="es"?"¿Cuándo alcanzarás ":"When will "}<span style={{color:T.gold}}>{lang==="es"?"tu":"you"}</span>{lang==="es"?" meta?":" reach your goal?"}
      </div>
      <div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>
        At <strong style={{color:T.green}}>{RATE}% annual</strong> (S&P 500 historical average), compounded monthly.
      </div>
    </div>

    {/* 3 inputs */}
    <div className="kpi-3" style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,borderBottom:`1px solid ${T.border}33`,background:`${T.accent}66`}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>{lang==="es"?"🎂 Tu edad actual":"🎂 Your current age"}</span>
          <Mn sz={14} c={T.gold} s={{fontWeight:700}}>{age} years old</Mn>
        </div>
        <input type="range" min={18} max={60} step={1} value={age} onChange={e=>setAge(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>18</span><span>40</span><span>60</span>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>{lang==="es"?"🎯 Tu meta de riqueza":"🎯 Your wealth goal"}</span>
          <Mn sz={14} c={T.gold} s={{fontWeight:700}}>{goalFmt(goal)}</Mn>
        </div>
        <input type="range" min={Math.round(100000*_exRate)} max={Math.round(5000000*_exRate)} step={Math.round(50000*_exRate)} value={goal} onChange={e=>setGoal(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>$100K</span><span>$1M</span><span>$5M</span>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>{lang==="es"?"💵 Ahorro mensual":"💵 Monthly savings"}</span>
          <Mn sz={14} c={T.green} s={{fontWeight:700}}>{goalFmt(monthly)}/mo · ~${Math.ceil(monthly/30)}/day</Mn>
        </div>
        <input type="range" min={50} max={5000} step={50} value={monthly} onChange={e=>setMonthly(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>$50</span><span>$500</span><span>$5,000</span>
        </div>
      </div>
    </div>

    {/* Main result */}
    <div style={{padding:"28px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* Result A: when do you reach goal */}
        <div style={{background:canReach?`${resultColor}10`:`${T.red}08`,border:`2px solid ${resultColor}44`,borderRadius:16,padding:"22px 24px",textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
            Saving {goalFmt(monthly)}/mo, you reach {goalFmt(goal)} at
          </div>
          {canReach
            ?<>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,color:resultColor,fontWeight:700,lineHeight:1}}>
                {reachAge}
              </div>
              <div style={{fontSize:14,color:T.muted,marginTop:6}}>years old · in <span style={{color:resultColor,fontWeight:600}}>{yearsToGoal} years</span></div>
              {reachAge<=65&&<div style={{marginTop:10,fontSize:11,color:T.green,padding:"4px 12px",background:`${T.green}15`,borderRadius:20,display:"inline-block"}}>✓ Before retirement age</div>}
              {reachAge>65&&<div style={{marginTop:10,fontSize:11,color:T.gold,padding:"4px 12px",background:`${T.gold}15`,borderRadius:20,display:"inline-block"}}>⚡ Increase savings to reach it sooner</div>}
            </>
            :<>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.red,fontWeight:700,marginBottom:6}}>Not reachable</div>
              <div style={{fontSize:12,color:T.muted}}>at this savings rate — increase your monthly amount</div>
            </>}
        </div>

        {/* Result B: how much needed by 65 */}
        <div style={{background:`${T.gold}08`,border:`1px solid ${T.goldDim}44`,borderRadius:16,padding:"22px 24px",textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
            To reach {goalFmt(goal)} by age 65, save
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,color:T.gold,fontWeight:700,lineHeight:1}}>
            {isFinite(neededMonthly)?goalFmt(neededMonthly):"—"}
          </div>
          <div style={{fontSize:14,color:T.muted,marginTop:6}}>per month · ~${neededDaily}/day</div>
          <div style={{marginTop:10,fontSize:11,color:T.muted}}>
            {yearsLeft} years of investing remaining
          </div>
          {monthly>=neededMonthly&&<div style={{marginTop:8,fontSize:11,color:T.green,padding:"4px 12px",background:`${T.green}15`,borderRadius:20,display:"inline-block"}}>✓ You're already on track!</div>}
        </div>
      </div>

      {/* Cost of waiting */}
      {isFinite(neededAt5)&&isFinite(neededAt10)&&<div style={{background:T.accent,borderRadius:12,padding:"16px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:12}}>⏰ The cost of waiting</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,textAlign:"center"}}>
          {[
            {l:`Starting now (age ${age})`,v:neededMonthly,c:T.green,highlight:true},
            {l:`Wait 5 years (age ${age+5})`,v:neededAt5,c:T.gold,highlight:false},
            {l:`Wait 10 years (age ${age+10})`,v:neededAt10,c:T.red,highlight:false},
          ].map(({l,v,c,highlight})=>(
            <div key={l} style={{padding:"10px 12px",background:highlight?`${T.green}10`:T.card,borderRadius:10,border:`1px solid ${c}22`}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,lineHeight:1.4}}>{l}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700}}>{goalFmt(v)}/mo</div>
              {!highlight&&<div style={{fontSize:10,color:c,marginTop:3}}>+{goalFmt(v-neededMonthly)}/mo more</div>}
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.7}}>
          Every year you wait, you need <span style={{color:T.red,fontWeight:600}}>more money per month</span> to reach the same goal. Start today with <span style={{color:T.green,fontWeight:600}}>{goalFmt(neededMonthly)}/month</span> — that's <span style={{color:T.gold}}>~${neededDaily}/day</span>.
        </div>
      </div>}
    </div>
  </Card>;
}

// ── WHAT IF ───────────────────────────────────────────────────────────────────
function WhatIfTab({lang="en"}){
  const LW=LANG[lang]||LANG.en;
  const SCENARIOS=[
    {ticker:"NVDA",name:"NVIDIA",year:2014,invested:10000,cagr:68,finalValue:3820000,color:T.green,desc:{en:"GPU dominance + AI boom",es:"Dominio GPU + boom de IA"}},
    {ticker:"AAPL",name:"Apple",year:2008,invested:10000,cagr:28,finalValue:782000,color:T.blue,desc:{en:"iPhone, services, ecosystem",es:"iPhone, servicios, ecosistema"}},
    {ticker:"AMZN",name:"Amazon",year:2010,invested:10000,cagr:32,finalValue:520000,color:T.gold,desc:{en:"AWS Cloud + e-commerce",es:"AWS Cloud + comercio electrónico"}},
    {ticker:"MSFT",name:"Microsoft",year:2014,invested:10000,cagr:27,finalValue:248000,color:T.purple,desc:{en:"Azure Cloud + Satya Nadella",es:"Azure Cloud + Satya Nadella"}},
    {ticker:"TSLA",name:"Tesla",year:2013,invested:10000,cagr:38,finalValue:1200000,color:T.green,desc:{en:"EV + energy + software",es:"VE + energía + software"}},
    {ticker:"COST",name:"Costco",year:2010,invested:10000,cagr:19,finalValue:115000,color:"#f39c12",desc:{en:"Membership moat + retail",es:"Membresía + retail"}},
  ];
  const [custom,setCustom]=useState({initial:10000,cagr:20,years:10});
  const sc=(k,v)=>setCustom(p=>({...p,[k]:v}));
  const customFinal=custom.initial*Math.pow(1+custom.cagr/100,custom.years);
  const customData=Array.from({length:custom.years},(_,i)=>({y:`Y${i+1}`,v:Math.round(custom.initial*Math.pow(1+custom.cagr/100,i+1))}));
  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{textAlign:"center",padding:"10px 0 6px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:6}}>{LW.whatif_title} <span style={{color:T.gold}}>{fmt(10000*_exRate)}</span>...</div>
      <div style={{fontSize:13,color:T.muted}}>{LW.whatif_sub}</div>
    </div>
    <AdBanner size="leaderboard"/>
    <div className="g-2 g-sm-1" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {SCENARIOS.map(s=><Card key={s.ticker}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,marginBottom:2}}>{s.name}</div><div style={{fontSize:10,color:T.muted}}>{s.ticker} · since {s.year}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:s.color,fontWeight:700}}>{fmt(s.finalValue)}</div><div style={{fontSize:10,color:s.color}}>CAGR ~{s.cagr}%</div></div>
        </div>
        <div style={{height:3,background:T.border,borderRadius:2,marginBottom:8}}><div style={{height:"100%",width:`${Math.min((s.finalValue/4000000)*100,100)}%`,background:s.color,borderRadius:2}}/></div>
        <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{typeof s.desc==="object"?s.desc[lang]||s.desc.en:s.desc}</div>
        <div style={{marginTop:10,padding:"6px 10px",background:T.accent,borderRadius:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:T.muted}}>$10,000 invested</span>
          <Mn sz={11} c={s.color} s={{fontWeight:700}}>→ {fmt(s.finalValue)}</Mn>
        </div>
      </Card>)}
    </div>
    <div className="compound-layout" style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:18}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:16}}>{LW.whatif_custom}</div>
        <Lbl>{LW.whatif_capital}</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace"}}>$</span><input type="number" value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/></div>
        <input type="range" min={Math.round(1000*_exRate)} max={Math.round(1000000*_exRate)} step={Math.round(1000*_exRate)} value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value))} style={{marginBottom:14}}/>
        <Lbl>{LW.whatif_cagr}</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><input type="number" value={custom.cagr} onChange={e=>sc("cagr",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/><span style={{color:T.muted,fontSize:12}}>% per year</span></div>
        <input type="range" min={1} max={100} step={0.5} value={custom.cagr} onChange={e=>sc("cagr",parseFloat(e.target.value))} style={{marginBottom:14}}/>
        <Lbl>Years</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.muted}}>Horizon</span><Mn sz={12} c={T.gold}>{custom.years} years</Mn></div>
        <input type="range" min={1} max={40} step={1} value={custom.years} onChange={e=>sc("years",parseInt(e.target.value))}/>
        <div style={{marginTop:16,padding:14,background:`${T.gold}08`,borderRadius:10,border:`1px solid ${T.goldDim}44`,textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:4}}>{LW.whatif_result} {custom.years} {lang==="es"?"años":"years"}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.gold,fontWeight:700}}>{fmt(customFinal)}</div>
          <div style={{fontSize:11,color:T.green,marginTop:4}}>×{(customFinal/custom.initial).toFixed(1)} {LW.whatif_multiplier}</div>
        </div>
      </Card>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>{LW.whatif_chart}</div>
        <div style={{height:280}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={customData}>
              <defs><linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.4}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="y" tick={{fill:T.muted,fontSize:10}}/>
              <YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>fmtShort(v)} width={82}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={v=>[fmt(v),"Portfolio Value"]}/>
              <Area type="monotone" dataKey="v" stroke={T.gold} fill="url(#gW)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </div>;
}

// ── INLINE EXPECTED RETURN — embedded in Stock Analyze ────────────────────────
function InlineExpectedReturn({company,sector,onAnalysis,canAnalyze,lang="en"}){
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [err,setErr]=useState("");
  const [summary,setSummary]=useState("");
  const [inp,setInp]=useState({rg:0,me:0,mx:0,dv:0,pe:0,fg:0});
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const er=inp.rg+inp.me+inp.mx+inp.dv;

  const loadReturn=async()=>{
    if(!canAnalyze())return;
    setLoading(true);setErr("");
    try{
      const p=await callAI(`You are an investment analyst. For "${company}" (${sector} sector), estimate the expected annual return components based on real Wall Street consensus and fundamentals.

IMPORTANT: Be realistic. Most stocks return 8-20% annually. Only exceptional growth stocks like NVDA can justify 25%+.
Explain each component clearly:
- Revenue growth contribution: how much of return comes from actual business growth
- Margin expansion: are margins expanding or contracting?
- Multiple expansion/contraction: is the stock cheap or expensive vs history?
- Dividends: actual dividend yield

Respond ONLY with valid JSON, no markdown:
{
  "rg":<revenue growth contribution %, number 0-30>,
  "me":<margin expansion contribution %, number -5 to 8>,
  "mx":<multiple expansion %, number -10 to 10>,
  "dv":<dividend yield %, number 0-6>,
  "pe":<current P/E, number>,
  "fg":<analyst consensus EPS growth % next 3Y, number>,
  "rgNote":"<1 sentence: why this revenue growth rate, cite specific data>",
  "meNote":"<1 sentence: margin trend>",
  "mxNote":"<1 sentence: valuation context vs historical average>",
  "dvNote":"<1 sentence: dividend policy>",
  "benchmarkNote":"<S&P 500 historical avg is 8-10%/yr. How does ${company} compare and why?>",
  "summary":"<2-3 sentences: overall return thesis with analyst price target and upside if available>"
}`);
      setInp({rg:p.rg||0,me:p.me||0,mx:p.mx||0,dv:p.dv||0,pe:p.pe||0,fg:p.fg||0});
      setSummary(p);setLoaded(true);onAnalysis();
    }catch(e){setErr("Error: "+e.message);}
    setLoading(false);
  };

  const proj=Array.from({length:11},(_,i)=>({
    y:`Y${i}`,
    p:Math.round(10000*_exRate*Math.pow(1+er/100,i)),
    b:Math.round(10000*_exRate*Math.pow(1.085,i)),
  }));

  const erColor=er>=20?T.green:er>=12?T.gold:er>=8?T.blue:T.red;
  const vsMarket=er-8.5;

  return<Card s={{border:`1px solid ${T.border}`,padding:0,overflow:"hidden"}}>
    <div onClick={()=>{setOpen(v=>!v);if(!open&&!loaded&&!loading)loadReturn();}}
      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.background=T.accent}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>📐</span>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>
            Expected Return Analysis — {company}
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>
            {loaded
              ?<span>Revenue Growth + Margin + Multiple + Dividends = <span style={{color:erColor,fontWeight:700}}>{er.toFixed(1)}%/yr</span> vs S&P 500 ~8.5%</span>
              :"What realistic annual return can this stock deliver? Click to find out."}
          </div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {loaded&&<div style={{textAlign:"right"}}>
          <div style={{fontSize:18,color:erColor,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{er.toFixed(1)}%</div>
          <div style={{fontSize:9,color:vsMarket>=0?T.green:T.red}}>{vsMarket>=0?"+":""}{vsMarket.toFixed(1)}% vs market</div>
        </div>}
        {!loaded&&!loading&&<span style={{fontSize:11,color:T.muted,padding:"4px 10px",border:`1px solid ${T.border}`,borderRadius:6}}>Load →</span>}
        {loading&&<span className="sp" style={{color:T.gold}}>⟳</span>}
        <span style={{color:T.muted,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
    </div>

    {open&&<div style={{padding:"20px",borderTop:`1px solid ${T.border}`}}>
      {loading&&<div style={{textAlign:"center",padding:16,color:T.gold,fontSize:12}}><span className="sp">⟳</span> Analyzing {company} return components...</div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red}}>{err}</div>}

      {loaded&&summary&&<>
        {/* Return breakdown cards */}
        <div className="cycle-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[
            {l:lang==="es"?"Crecimiento Ingresos":"Revenue Growth",k:"rg",note:summary.rgNote,c:T.green,icon:"📈"},
            {l:"Margin Expansion",k:"me",note:summary.meNote,c:T.blue,icon:"💎"},
            {l:"Multiple Expansion",k:"mx",note:summary.mxNote,c:inp.mx>=0?T.gold:T.red,icon:"📊"},
            {l:"Dividends",k:"dv",note:summary.dvNote,c:T.muted,icon:"💵"},
          ].map(({l,k,note,c,icon})=>{const lText=typeof l==="object"?l[lang]||l.en:l;return<div key={k} style={{background:T.accent,borderRadius:10,padding:"12px 12px",border:`1px solid ${c}22`}}>
            <div style={{fontSize:10,color:T.muted,marginBottom:4}}>{icon} {lText}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:c,fontWeight:700,marginBottom:4}}>
              {inp[k]>=0?"+":""}{inp[k].toFixed(1)}%
            </div>
            <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{note}</div>
          </div>;})}
        </div>

        {/* Total + benchmark */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{padding:"16px 20px",background:`${erColor}10`,border:`2px solid ${erColor}44`,borderRadius:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Total Expected Return</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:42,color:erColor,fontWeight:700,lineHeight:1}}>{er.toFixed(1)}%</div>
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>per year</div>
            <div style={{marginTop:8,fontSize:11,color:vsMarket>=0?T.green:T.red,fontWeight:600}}>
              {vsMarket>=0?`+${vsMarket.toFixed(1)}% above`:`${vsMarket.toFixed(1)}% below`} S&P 500
            </div>
          </div>
          <div style={{padding:"14px 16px",background:T.card,borderRadius:12,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>📊 Context</div>
            <div style={{fontSize:12,color:T.text,lineHeight:1.8,marginBottom:8}}>{summary.benchmarkNote}</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,background:T.accent,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:T.muted,marginBottom:2}}>P/E Ratio</div>
                <div style={{fontSize:13,color:T.gold,fontWeight:600}}>{inp.pe}x</div>
              </div>
              <div style={{flex:1,background:T.accent,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:T.muted,marginBottom:2}}>EPS Growth</div>
                <div style={{fontSize:13,color:T.green,fontWeight:600}}>+{inp.fg}%</div>
              </div>
              <div style={{flex:1,background:T.accent,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:T.muted,marginBottom:2}}>PEG Ratio</div>
                <div style={{fontSize:13,color:inp.pe/inp.fg<=1.5?T.green:T.red,fontWeight:600}}>{(inp.pe/inp.fg).toFixed(1)}x</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {summary.summary&&<div style={{padding:14,background:T.accent,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:16}}>
          <div style={{fontSize:10,color:T.gold,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>🤖 AI Return Thesis</div>
          <div style={{fontSize:12,color:T.text,lineHeight:1.75}}>{summary.summary}</div>
        </div>}

        {/* 10-year projection mini chart */}
        <div style={{height:160,marginBottom:10}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:8}}>
            📈 10-year projection of {fmt(10000*_exRate)} at <span style={{color:erColor}}>{er.toFixed(1)}%/yr</span> vs S&P 500 at 8.5%
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={proj} margin={{top:5,right:5,left:10,bottom:0}}>
              <defs>
                <linearGradient id="gER" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={erColor} stopOpacity={0.3}/><stop offset="95%" stopColor={erColor} stopOpacity={0}/></linearGradient>
                <linearGradient id="gMkt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.muted} stopOpacity={0.2}/><stop offset="95%" stopColor={T.muted} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="y" tick={{fill:T.muted,fontSize:9}}/>
              <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtShort(v)} width={72}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[fmt(v),n==="p"?`${company} (${er.toFixed(0)}%/yr)`:"S&P 500 (8.5%/yr)"]}/>
              <Area type="monotone" dataKey="b" stroke={T.muted} fill="url(#gMkt)" strokeWidth={1.5} strokeDasharray="4 4" name="b"/>
              <Area type="monotone" dataKey="p" stroke={erColor} fill="url(#gER)" strokeWidth={2.5} name="p"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{fontSize:9,color:T.muted,textAlign:"center",borderTop:`1px solid ${T.border}22`,paddingTop:8}}>
          ⚠️ Expected return is an estimate based on analyst consensus and AI fundamentals — not a guarantee. Past performance ≠ future results.
        </div>

        <div style={{marginTop:8,textAlign:"right"}}>
          <button className="seg" onClick={()=>{setLoaded(false);setSummary("");loadReturn();}} style={{fontSize:10}}>🔄 Recalculate</button>
        </div>
      </>}
    </div>}
  </Card>;
}

// ── INLINE DCF — embedded in Stock Analyze ────────────────────────────────────
function InlineDCF({company,onAnalysis,canAnalyze,lang="en"}){
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [dcf,setDcf]=useState(null);
  const [err,setErr]=useState("");
  const [d,setD]=useState({rev:1000,rg:20,mt:20,fc:0.85,tg:2.5,w:10,sh:100,ca:200,de:300,yr:10});

  const buildDCF=async()=>{
    if(!canAnalyze())return;
    setLoading(true);setErr("");
    try{
      const p=await callAI(`For the company "${company}", provide real DCF inputs based on actual data. Respond ONLY with valid JSON, no markdown:
{"rev":<annual revenue millions USD>,"rg":<revenue growth % next 5Y>,"mt":<FCF margin %>,"fc":<FCF conversion 0.5-1>,"tg":<terminal growth % 1-4>,"w":<WACC % 6-15>,"sh":<shares outstanding millions>,"ca":<cash millions>,"de":<total debt millions>,"currentPrice":<stock price USD>,"summary":"<2 sentences on valuation conclusion>"}`);
      setD(prev=>({...prev,...{rev:p.rev||prev.rev,rg:p.rg||prev.rg,mt:p.mt||prev.mt,fc:p.fc||prev.fc,tg:p.tg||prev.tg,w:p.w||prev.w,sh:p.sh||prev.sh,ca:p.ca||prev.ca,de:p.de||prev.de}}));
      setDcf(p);onAnalysis();
    }catch(e){setErr("DCF error: "+e.message);}
    setLoading(false);
  };

  const flows=Array.from({length:d.yr},(_,i)=>{
    const r=d.rev*Math.pow(1+d.rg/100,i+1),f=r*(d.mt/100)*d.fc,pv=f/Math.pow(1+d.w/100,i+1);
    return{y:`Y${i+1}`,f:Math.round(f),pv:Math.round(pv)};
  });
  const tF=flows[d.yr-1]?.f||0;
  const tV=d.w>d.tg?(tF*(1+d.tg/100))/((d.w-d.tg)/100):0;
  const tPV=tV/Math.pow(1+d.w/100,d.yr);
  const sumPV=flows.reduce((a,f)=>a+f.pv,0);
  const ev=sumPV+tPV,eq=ev+d.ca-d.de,ips=d.sh>0?eq/d.sh:0;
  const upside=dcf?.currentPrice&&ips>0?((ips-dcf.currentPrice)/dcf.currentPrice*100):null;

  return<Card s={{border:`1px solid ${T.border}`,padding:0,overflow:"hidden"}}>
    <div onClick={()=>setOpen(v=>!v)}
      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.background=T.accent}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>📊</span>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>DCF Valuation — {company}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>Is {company} overvalued or undervalued? Click to find out.</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {ips>0&&dcf&&<div style={{textAlign:"right"}}>
          <Mn sz={16} c={upside!=null&&upside>=0?T.green:T.red} s={{fontWeight:700}}>${ips.toFixed(2)}/share</Mn>
          {upside!=null&&<div style={{fontSize:10,color:upside>=0?T.green:T.red}}>{upside>=0?"+":""}{upside.toFixed(1)}% vs market</div>}
        </div>}
        <span style={{color:T.muted,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
    </div>

    {open&&<div style={{padding:"20px",borderTop:`1px solid ${T.border}`}}>
      {!dcf&&!loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:`${T.gold}08`,borderRadius:10,marginBottom:16}}>
        <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>
          AI pulls real data for <strong style={{color:T.text}}>{company}</strong> and estimates the intrinsic value per share.
        </div>
        <button className="btn btn-gold" onClick={buildDCF} style={{fontSize:13,padding:"10px 20px",flexShrink:0,marginLeft:16}}>
          📊 Build DCF
        </button>
      </div>}
      {loading&&<div style={{textAlign:"center",padding:16,fontSize:12,color:T.gold}}><span className="sp">⟳</span> Building DCF for {company}...</div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,marginBottom:12}}>{err}</div>}

      {dcf&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          {[
            {l:lang==="es"?"Valor Intrínseco":"Intrinsic Value",v:`$${ips.toFixed(2)}`,c:T.green,sub:"per share (DCF)"},
            {l:lang==="es"?"Precio Actual":"Current Price",v:dcf.currentPrice?`$${dcf.currentPrice}`:"—",c:T.gold,sub:"market price"},
            {l:"Upside / Downside",v:upside!=null?`${upside>=0?"+":""}${upside.toFixed(1)}%`:"—",c:upside!=null?(upside>=0?T.green:T.red):T.muted,sub:upside!=null?(upside>=15?"Undervalued":upside<=-15?"Overvalued":"Fair Value"):""},
          ].map(({l,v,c,sub})=><div key={l} style={{background:T.accent,borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{l}</div>
            <Mn sz={20} c={c} s={{fontWeight:700}}>{v}</Mn>
            <div style={{fontSize:10,color:T.muted,marginTop:3}}>{sub}</div>
          </div>)}
        </div>
        {dcf.summary&&<div style={{padding:12,background:T.accent,borderRadius:8,fontSize:12,color:T.text,lineHeight:1.7,marginBottom:14,border:`1px solid ${T.border}`}}>{dcf.summary}</div>}
        <div style={{height:150,marginBottom:10}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flows} margin={{top:5,right:5,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="y" tick={{fill:T.muted,fontSize:9}}/>
              <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>`$${v}M`} width={60}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[`$${v}M`,n==="f"?"FCF":"Discounted"]}/>
              <Bar dataKey="f" fill={T.green} opacity={0.7} radius={[3,3,0,0]} name="f"/>
              <Bar dataKey="pv" fill={T.gold} opacity={0.7} radius={[3,3,0,0]} name="pv"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{fontSize:10,color:T.muted,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>EV = ${Math.round(sumPV)}M + ${Math.round(tPV)}M = ${Math.round(ev)}M &nbsp;·&nbsp; Intrinsic = <span style={{color:T.green}}>${ips.toFixed(2)}/share</span></span>
          <button className="seg" onClick={()=>setDcf(null)} style={{fontSize:10}}>🔄 Rebuild</button>
        </div>
      </>}
    </div>}
  </Card>;
}

// ── SCORECARD ─────────────────────────────────────────────────────────────────
function MRow({c,value,onChange,locked,lang="en"}){
  const s=sm(c,value),pass=c.invert?value<=c.threshold:value>=c.threshold;
  return<div style={{display:"grid",gridTemplateColumns:"1fr 85px 50px 28px",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${T.border}22`}}>
    <div><div style={{fontSize:12,color:T.text,marginBottom:3}}>{typeof c.label==="object"?c.label[lang]||c.label.en:c.label}</div><input type="range" min={0} max={c.max} step={0.1} value={value} disabled={locked} onChange={e=>!locked&&onChange(c.key,parseFloat(e.target.value))}/></div>
    <div style={{display:"flex",alignItems:"center",gap:3}}><input type="number" value={value} min={0} max={c.max} step={0.1} disabled={locked} onChange={e=>!locked&&onChange(c.key,parseFloat(e.target.value)||0)} style={{width:60,textAlign:"right",opacity:locked?0.6:1}}/><span style={{fontSize:10,color:T.muted}}>{c.unit}</span></div>
    <div style={{textAlign:"center",fontSize:11,color:s>=60?T.green:s>=40?T.gold:T.red}}>{s}%</div>
    <div style={{fontSize:14,textAlign:"center",color:pass?T.green:T.red}}>{pass?"✓":"✗"}</div>
  </div>;
}

// ── MARKET CYCLE DASHBOARD ───────────────────────────────────────────────────
function MarketCycleBanner({ticker="",sector="",portfolioTickers=[],lang="en",canAnalyze=null}){
  const [cycle,setCycle]=useState(null);
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const [lastFetch,setLastFetch]=useState(null);

  // Cache cycle analysis for 4 hours
  const CACHE_KEY="compoundr_market_cycle";
  const CACHE_TTL=4*60*60*1000;

  const loadCached=()=>{
    try{
      const c=localStorage.getItem(CACHE_KEY);
      if(c){const p=JSON.parse(c);if(Date.now()-p.ts<CACHE_TTL){setCycle(p.data);setLastFetch(new Date(p.ts));return true;}}
    }catch(e){}
    return false;
  };

  const fetchCycle=async()=>{
    if(loading)return;
    // Premium feature — require login/premium to run cycle analysis
    if(!isAdmin()&&typeof canAnalyze==="function"&&!canAnalyze("cycle"))return;
    setLoading(true);
    try{
      const context=ticker?`The user is analyzing: ${ticker} (${sector} sector).`
        :portfolioTickers.length?`The user holds: ${portfolioTickers.slice(0,8).join(", ")}.`
        :"General market context.";

      const p=await callAI(`You are a macro market cycle analyst. Analyze the CURRENT market cycle (as of your latest knowledge) and its implications for investors.

${context}

Respond ONLY with valid JSON, no markdown:
{
  "cycle":"<Early Bull|Expansion|Late Expansion|Distribution|Bear Market|Early Recovery>",
  "cyclePhase":<1-6 where 1=Early Bull, 6=Bear>,
  "confidence":"<High|Medium|Low>",
  "headline":"<1 sentence: current market situation>",
  "keySignals":["<signal 1>","<signal 2>","<signal 3>"],
  "leadingSectors":["<sector 1>","<sector 2>","<sector 3>"],
  "laggingSectors":["<sector 1>","<sector 2>"],
  "geopolitical":"<1 sentence: key macro/geopolitical factor affecting markets now>",
  "emergingVsDeveloped":"<Favor Developed|Neutral|Favor Emerging>",
  "emergingRationale":"<1 sentence why>",
  "commodities":"<Bullish|Neutral|Bearish>",
  "commoditiesNote":"<1 sentence>",
  "interestRates":"<Rising|Stable|Falling>",
  "ratesImpact":"<1 sentence on what rising/falling rates mean now>",
  "portfolioImplication":"<2 sentences: what this cycle means for long-term Buffett/Munger investors>",
  "tickerCycleNote":"<if ticker provided: 1 sentence on how this cycle affects that specific stock/sector, else empty string>",
  "nextCycleSignals":["<what to watch for to detect a phase change>","<signal 2>"],
  "timeHorizon":"<estimated months until next potential phase change>"
}`);
      setCycle(p);
      setLastFetch(new Date());
      try{localStorage.setItem(CACHE_KEY,JSON.stringify({data:p,ts:Date.now()}));}catch(e){}
    }catch(e){console.warn("Cycle fetch error:",e);}
    setLoading(false);
  };

  // Auto-load cached on mount, don't auto-fetch to save API calls
  useState(()=>{loadCached();});

  const isPrem=isAdmin()||(typeof canAnalyze==="function");

  if(!cycle&&!loading&&!open)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",
      background:isPrem?`linear-gradient(90deg,${T.blue}10,${T.purple}10)`:`linear-gradient(90deg,${T.gold}08,${T.purple}08)`,
      border:`1px solid ${isPrem?T.blue:T.goldDim}33`,borderRadius:10,cursor:"pointer"}}
      onClick={()=>{if(isPrem){setOpen(true);fetchCycle();}else{alert(lang==="es"?"🔒 El análisis de ciclos de mercado es Premium. Suscríbete para acceder.":"🔒 Market cycle analysis is a Premium feature. Subscribe to access.");}}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{isPrem?"🔄":"🔒"}</span>
        <div>
          <span style={{fontSize:12,color:isPrem?T.blue:T.gold,fontWeight:600}}>
            {isPrem
              ?(lang==="es"?"Ver ciclo de mercado actual — contexto macro para tu análisis":"See current market cycle — macro context for your analysis")
              :(lang==="es"?"Análisis de Ciclo de Mercado — Premium":"Market Cycle Analysis — Premium")}
          </span>
          {!isPrem&&<div style={{fontSize:10,color:T.muted,marginTop:1}}>
            {lang==="es"?"Sectores líderes, tasas, geopolítica, implicaciones para tu portafolio":"Leading sectors, rates, geopolitics, portfolio implications"}
          </div>}
        </div>
      </div>
      <span style={{fontSize:11,color:isPrem?T.muted:T.gold,padding:"3px 10px",border:`1px solid ${isPrem?T.border:T.goldDim}`,borderRadius:6}}>
        {isPrem?(lang==="es"?"Analizar ciclo →":"Analyze cycle →"):(lang==="es"?"🚀 Ver Planes":"🚀 See Plans")}
      </span>
    </div>
  );

  if(loading)return(
    <div style={{padding:"14px 16px",background:`${T.blue}08`,border:`1px solid ${T.blue}22`,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
      <span className="sp" style={{fontSize:16}}>⟳</span>
      <span style={{fontSize:12,color:T.blue}}>
        {lang==="es"?"Analizando ciclo de mercado actual...":"Analyzing current market cycle..."}
      </span>
    </div>
  );

  if(!cycle)return null;

  // Phase colors
  const phaseColor=cycle.cyclePhase<=2?T.green:cycle.cyclePhase<=4?T.gold:T.red;
  const phaseWidth=`${(cycle.cyclePhase/6)*100}%`;

  return(
    <div style={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`2px solid ${T.blue}33`,borderRadius:14,overflow:"hidden"}}>
      {/* Header — always visible */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",cursor:"pointer",borderBottom:open?`1px solid ${T.border}22`:"none"}}
        onClick={()=>setOpen(v=>!v)}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>🔄</span>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:phaseColor,fontWeight:700}}>{cycle.cycle}</span>
              <span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${phaseColor}20`,color:phaseColor,border:`1px solid ${phaseColor}33`}}>{cycle.confidence} confidence</span>
              {ticker&&cycle.tickerCycleNote&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${T.gold}15`,color:T.gold}}>Note for {ticker}</span>}
            </div>
            <div style={{fontSize:11,color:T.muted}}>{cycle.headline}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {lastFetch&&<span style={{fontSize:9,color:T.muted}}>{lastFetch.toLocaleTimeString(lang==="es"?"es-CO":"en-US",{hour:"2-digit",minute:"2-digit"})}</span>}
          <button className="seg" onClick={e=>{e.stopPropagation();fetchCycle();}} style={{fontSize:10,padding:"3px 8px"}}>🔄</button>
          <span style={{color:T.muted,fontSize:11}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {/* Cycle progress bar */}
      <div style={{height:3,background:T.border}}>
        <div style={{height:"100%",width:phaseWidth,background:`linear-gradient(90deg,${T.green},${T.gold},${T.red})`,transition:"width 0.5s ease"}}/>
      </div>

      {open&&<div style={{padding:"18px 18px 16px"}}>

        {/* Ticker-specific note */}
        {ticker&&cycle.tickerCycleNote&&<div style={{padding:"10px 14px",background:`${T.gold}10`,border:`1px solid ${T.goldDim}33`,borderRadius:10,marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}>
          <span style={{fontSize:14,flexShrink:0}}>⚡</span>
          <div>
            <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:2}}>{ticker} in this cycle</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>{cycle.tickerCycleNote}</div>
          </div>
        </div>}

        {/* 4 macro KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[
            {l:lang==="es"?"Ciclo":"Cycle",v:cycle.cycle,c:phaseColor},
            {l:lang==="es"?"Tasas de Interés":"Interest Rates",v:cycle.interestRates,c:cycle.interestRates==="Falling"?T.green:cycle.interestRates==="Rising"?T.red:T.gold},
            {l:lang==="es"?"Materias Primas":"Commodities",v:cycle.commodities,c:cycle.commodities==="Bullish"?T.green:cycle.commodities==="Bearish"?T.red:T.gold},
            {l:lang==="es"?"Emergentes vs USA":"Emerging vs US",v:cycle.emergingVsDeveloped.replace("Favor ",""),c:cycle.emergingVsDeveloped.includes("Emerging")?T.green:cycle.emergingVsDeveloped.includes("Developed")?T.blue:T.gold},
          ].map(({l,v,c},ki)=>{
              const lText=typeof l==="object"?l[lang]||l.en:l;
              return<div key={ki} style={{background:T.card,borderRadius:8,padding:"10px 12px",textAlign:"center",border:`1px solid ${c}22`}}>
            <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{lText}</div>
            <div style={{fontSize:12,color:c,fontWeight:700}}>{v}</div>
          </div>;})}
        </div>

        <div className="cycle-grid-2 g-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {/* Leading / Lagging sectors */}
          <div style={{background:T.card,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:T.green,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>
              📈 {lang==="es"?"Sectores Líderes":"Leading Sectors"}
            </div>
            {cycle.leadingSectors?.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:T.green,flexShrink:0}}/>
              <span style={{fontSize:11,color:T.text}}>{s}</span>
            </div>)}
          </div>
          <div style={{background:T.card,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:T.red,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>
              📉 {lang==="es"?"Sectores Rezagados":"Lagging Sectors"}
            </div>
            {cycle.laggingSectors?.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:T.red,flexShrink:0}}/>
              <span style={{fontSize:11,color:T.text}}>{s}</span>
            </div>)}
            <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}33`}}>
              <div style={{fontSize:9,color:T.muted,marginBottom:3}}>{lang==="es"?"Emergentes:":"Emerging markets:"}</div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{cycle.emergingRationale}</div>
            </div>
          </div>
        </div>

        {/* Key signals */}
        <div style={{background:T.card,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:10,color:T.blue,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>
            📡 {lang==="es"?"Señales Clave del Ciclo":"Key Cycle Signals"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {cycle.keySignals?.map((s,i)=><div key={i} style={{display:"flex",gap:6,fontSize:11,color:T.muted,lineHeight:1.5}}>
              <span style={{color:T.blue,flexShrink:0}}>→</span>{s}
            </div>)}
          </div>
        </div>

        {/* Geopolitical + rates */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{padding:"10px 14px",background:`${T.gold}08`,borderRadius:10,border:`1px solid ${T.goldDim}33`}}>
            <div style={{fontSize:9,color:T.gold,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>🌍 {lang==="es"?"Macro / Geopolítico":"Macro / Geopolitical"}</div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{cycle.geopolitical}</div>
          </div>
          <div style={{padding:"10px 14px",background:`${T.blue}08`,borderRadius:10,border:`1px solid ${T.blue}22`}}>
            <div style={{fontSize:9,color:T.blue,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>💵 {lang==="es"?"Tasas de Interés":"Interest Rates"}</div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{cycle.ratesImpact}</div>
          </div>
        </div>

        {/* Portfolio implication — the most important */}
        <div style={{padding:"14px 16px",background:`linear-gradient(135deg,${T.green}10,${T.accent})`,borderRadius:10,border:`1px solid ${T.green}33`,marginBottom:14}}>
          <div style={{fontSize:10,color:T.green,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
            💼 {lang==="es"?"¿Qué significa esto para tu portafolio?":"What this means for your portfolio"}
          </div>
          <div style={{fontSize:12,color:T.text,lineHeight:1.75}}>{cycle.portfolioImplication}</div>
        </div>

        {/* Next cycle signals */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
              🔮 {lang==="es"?"Señales del próximo cambio de ciclo":"Next phase change signals"}
            </div>
            {cycle.nextCycleSignals?.map((s,i)=><div key={i} style={{fontSize:11,color:T.muted,display:"flex",gap:6,marginBottom:4}}>
              <span style={{color:T.gold}}>•</span>{s}
            </div>)}
          </div>
          <div style={{textAlign:"center",padding:"8px 14px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`,flexShrink:0}}>
            <div style={{fontSize:9,color:T.muted,marginBottom:3}}>{lang==="es"?"Próximo cambio estimado":"Est. next change"}</div>
            <div style={{fontSize:14,color:T.gold,fontWeight:700}}>{cycle.timeHorizon}</div>
            <div style={{fontSize:9,color:T.muted}}>months</div>
          </div>
        </div>

        <div style={{marginTop:10,fontSize:9,color:T.muted,textAlign:"center",borderTop:`1px solid ${T.border}22`,paddingTop:8}}>
          ⚠️ {lang==="es"?"Análisis de ciclos es educativo. Los mercados son impredecibles. No es asesoría financiera.":"Cycle analysis is educational. Markets are unpredictable. Not financial advice."}
        </div>
      </div>}
    </div>
  );
}

function ScoreTab({m,setM,moat,setMoat,company,setCompany,sector,setSector,onAnalysis,canAnalyze,onGoToProfile,lang="en",onShowAuth=null}){
  const LS=LANG[lang]||LANG.en;
  const [loading,setLoading]=useState(false);
  const [info,setInfo]=useState(null);
  const [fh,setFh]=useState(null);
  const [err,setErr]=useState("");
  const [locked,setLocked]=useState(false);
  const score=calcScore(m,moat);const g=grade(score,lang);
  const catLabel=(cat)=>lang==="es"
    ?cat==="growth"?"📈 Crecimiento":cat==="profitability"?"💎 Rentabilidad":cat==="cashflow"?"💵 Flujo de Caja":"🏦 Balance General"
    :cat==="growth"?"📈 Growth":cat==="profitability"?"💎 Profitability":cat==="cashflow"?"💵 Cash Flow":"🏦 Balance Sheet";
  const catS=Object.entries(CRITERIA).map(([cat,cs])=>({cat:catLabel(cat),s:Math.round(cs.reduce((a,c)=>a+sm(c,m[c.key]||0),0)/cs.length)}));
  const radarD=MOAT_KEYS.map(k=>({subject:moatLabel(k,lang).split(" ")[0],value:moat[k],fullMark:5}));

  const analyze=async()=>{
    if(!company.trim()){setErr("Enter a company name or ticker.");return;}
    if(!canAnalyze())return;
    setLoading(true);setErr("");setInfo(null);setFh(null);setLocked(false);
    try{
      // Resolve company name to ticker if needed
      const resolvedTicker=await resolveTicker(company);
      if(resolvedTicker!==company.trim().toUpperCase())setCompany(resolvedTicker);
      const tickerToUse=resolvedTicker;
      const [fhResult,aiResult]=await Promise.allSettled([
        callFinnhub(tickerToUse),
        callAI(`You are a Buffett/Munger investment analyst. Analyze "${tickerToUse}" using real data up to your knowledge cutoff. FCF metric: use FCF GROWTH RATE (3-5Y CAGR %) not ratio. Respond ONLY with valid JSON, no markdown: {"metrics":{"revenueCAGR":<number>,"fcfGrowth":<FCF CAGR %>,"tamGrowth":<number>,"roic":<number>,"grossMargin":<number>,"opMargin":<number>,"fcfMarginPct":<number>,"debtEbitda":<number>,"interestCover":<number>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<sector>","summary":"<2-3 sentences thesis and key risk>","catalysts":["<1>","<2>","<3>"],"keyMetrics":{"revenueGrowth5y":"<e.g. +56% CAGR>","roicDisplay":"<e.g. 18%>","fcfGrowthDisplay":"<e.g. +67% CAGR>","fcfMarginDisplay":"<e.g. 19%>","debtEquity":"<e.g. 0.2x>","epsGrowth":"<e.g. +38%>"}}`),
      ]);
      let fhData=fhResult.status==="fulfilled"?fhResult.value:null;
      // If Finnhub has no analyst data, use AI to estimate consensus
      if(!fhData||fhData.totalAnalysts===0){
        try{
          const consensus=await callAI(`For the stock "${tickerToUse}", provide a Wall Street analyst consensus estimate based on the most recent public data available. Respond ONLY with valid JSON, no markdown:
{"rating":"<Strong Buy|Buy|Hold|Sell|Strong Sell>","totalAnalysts":<number 5-50>,"bullish":<number>,"bearish":<number>,"hold":<number>,"currentPrice":<number or null>,"targetMean":"<e.g. 285.00>","targetHigh":"<e.g. 350.00>","targetLow":"<e.g. 180.00>","upside":"<e.g. 18.5>","epsGrowthNext":"<e.g. +12.4%>","breakdown":{"strongBuy":<n>,"buy":<n>,"hold":<n>,"sell":<n>,"strongSell":<n>},"isAiEstimate":true}`);
          fhData={...consensus,source:"AI Consensus Estimate",isAiEstimate:true};
        }catch(e){fhData=null;}
      }
      if(fhData)setFh(fhData);
      if(aiResult.status==="fulfilled"){
        const p=aiResult.value;
        setM(prev=>({...prev,...p.metrics}));setMoat(prev=>({...prev,...p.moat}));
        if(p.sector)setSector(p.sector);setInfo(p);
      }else{throw new Error(aiResult.reason?.message||"AI analysis failed");}
      setLocked(true);onAnalysis();
    }catch(e){setErr(`Error: ${e.message||"Could not analyze."}`);}
    setLoading(false);
  };

  const checklist=[
    {l:{en:"Revenue CAGR ≥ 15%",es:"Ingresos CAGR ≥ 15%"},p:m.revenueCAGR>=15},
    {l:{en:"ROIC ≥ 20%",es:"ROIC ≥ 20%"},p:m.roic>=20},
    {l:{en:"Gross Margin ≥ 40%",es:"Margen Bruto ≥ 40%"},p:m.grossMargin>=40},
    {l:{en:"Operating Margin ≥ 18%",es:"Margen Operativo ≥ 18%"},p:m.opMargin>=18},
    {l:{en:"FCF Growth Rate ≥ 15%",es:"Crecimiento FCF ≥ 15%"},p:m.fcfGrowth>=15},
    {l:{en:"FCF Margin ≥ 15%",es:"Margen FCF ≥ 15%"},p:m.fcfMarginPct>=15},
    {l:{en:"Debt/EBITDA ≤ 2x",es:"Deuda/EBITDA ≤ 2x"},p:m.debtEbitda<=2},
    {l:{en:"Avg Moat ≥ 3/5",es:"Moat Promedio ≥ 3/5"},p:Object.values(moat).reduce((a,v)=>a+v,0)/MOAT_KEYS.length>=3},
  ];

  const ratingColor=r=>{if(!r)return T.muted;if(r.includes("Strong Buy")||r.includes("Buy")||r.includes("Over"))return T.green;if(r.includes("Sell")||r.includes("Under"))return T.red;return T.gold;};
  const ratingBg=r=>{if(!r)return T.border;if(r.includes("Strong Buy")||r.includes("Buy")||r.includes("Over"))return`${T.green}20`;if(r.includes("Sell")||r.includes("Under"))return`${T.red}20`;return`${T.gold}20`;};

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center",padding:"12px 16px",background:`${T.gold}10`,border:`1px solid ${T.goldDim}55`,borderRadius:8}}>
      <span style={{fontSize:12,color:T.gold}}>{lang==="es"?LS.score_label:"🎯 AI Stock Analyzer — Buffett/Munger fundamental analysis + Wall Street consensus · 3 free analyses"}</span>
      <button onClick={()=>onGoToProfile&&onGoToProfile()} style={{background:`${T.purple}20`,border:`1px solid ${T.purple}55`,borderRadius:8,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
        <span style={{fontSize:12}}>🧬</span>
        <span style={{fontSize:11,color:T.purple,fontWeight:600}}>{lang==="es"?LS.score_build_portfolio:"Build me a portfolio →"}</span>
      </button>
    </div>
    <MarketCycleBanner ticker={company} sector={sector} lang={lang} canAnalyze={canAnalyze}/>

    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div className="analyze-row" style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <Lbl>{lang==="es"?LS.score_input_label:"Ticker or Company Name"}</Lbl>
          <input type="text" value={company} onChange={e=>{setCompany(e.target.value);setLocked(false);setInfo(null);}} placeholder={lang==="es"?LS.score_input_placeholder:"NVDA, Apple, Google, Tesla, Costco..."} onKeyDown={e=>e.key==="Enter"&&analyze()} style={{fontSize:16,fontWeight:700,letterSpacing:"0.05em",padding:"12px 16px"}}/>
        </div>
        <div style={{width:150}}><Lbl>{lang==="es"?"Sector":"Sector"}</Lbl><select value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></div>
        <button className="btn btn-gold" onClick={analyze} disabled={loading} style={{height:44,padding:"0 24px",fontSize:14}}>
          {loading?<span className="sp">⟳</span>:lang==="es"?LS.score_btn:"🎯 Analyze with AI"}
        </button>
        {locked&&<button className="seg" onClick={()=>setLocked(false)} style={{height:44,color:T.gold,borderColor:T.goldDim}}>🔓 Unlock</button>}
      </div>
      {!info&&!loading&&!err&&<div style={{textAlign:"center",paddingTop:10,fontSize:12,color:T.muted,borderTop:`1px solid ${T.border}33`,marginTop:12}}>
        {lang==="es"?LS.score_hint:"Type a ticker (NVDA) or company name (Google, Apple, Tesla) → AI finds the stock and analyzes it"}
      </div>}
      {loading&&<div style={{textAlign:"center",padding:12,fontSize:12,color:T.gold,background:`${T.gold}08`,borderRadius:8,marginTop:10}}><span className="sp">⟳</span>  Analyzing <strong>{company}</strong>...</div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`,marginTop:10}}>{err}</div>}
      {locked&&<div style={{padding:"6px 10px",background:`${T.green}10`,borderRadius:6,fontSize:11,color:T.green,border:`1px solid ${T.green}33`,marginTop:10}}>🔒 Metrics locked to AI data — click Unlock to edit</div>}
    </Card>

    {info&&<>
      {/* ── LIVE FINNHUB CONSENSUS — real-time data ── */}
      {fh&&<div style={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`2px solid ${ratingColor(fh.rating)}44`,borderRadius:14,padding:20,marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          {fh.isAiEstimate
          ?<span style={{fontSize:10,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>🤖 Consenso Estimado por IA · Wall Street</span>
          :<span style={{fontSize:10,color:T.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600}}>🟢 LIVE — Datos en Tiempo Real · Wall Street</span>}
          {fh.period&&!fh.isAiEstimate&&<span style={{fontSize:10,color:T.muted}}>· Period: {fh.period}</span>}
          {fh.isAiEstimate&&<span style={{fontSize:10,color:T.muted}}>· Estimación basada en datos públicos recientes</span>}
        </div>
        <div className="score-card-grid" style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:20,alignItems:"center"}}>
          {/* Big rating */}
          <div style={{textAlign:"center",padding:"16px 10px",background:ratingBg(fh.rating),borderRadius:12,border:`1px solid ${ratingColor(fh.rating)}33`}}>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Wall St. Consensus</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,color:ratingColor(fh.rating),fontWeight:700,marginBottom:6}}>{fh.rating}</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:10}}>{fh.totalAnalysts} analysts</div>
            {fh.currentPrice&&<div style={{fontSize:13,color:T.text,marginBottom:4}}>Current: <span style={{color:T.gold,fontWeight:700}}>${fh.currentPrice.toFixed(2)}</span></div>}
            {fh.targetMean&&<div style={{fontSize:13,color:T.text}}>Target: <span style={{color:T.gold,fontWeight:700}}>${fh.targetMean}</span></div>}
            {fh.upside&&<div style={{fontSize:14,color:parseFloat(fh.upside)>=0?T.green:T.red,fontWeight:700,marginTop:6}}>{parseFloat(fh.upside)>=0?"+":""}{fh.upside}% upside</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Analyst breakdown bar */}
            {fh.breakdown&&<div>
              <div style={{fontSize:11,color:T.muted,marginBottom:8}}>Analyst Breakdown — {fh.totalAnalysts} total</div>
              <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:28,gap:1}}>
                {[{l:"Strong Buy",v:fh.breakdown.strongBuy,c:"#1a9e3f"},{l:"Buy",v:fh.breakdown.buy,c:T.green},{l:"Hold",v:fh.breakdown.hold,c:T.gold},{l:"Sell",v:fh.breakdown.sell,c:"#e67e22"},{l:"Strong Sell",v:fh.breakdown.strongSell,c:T.red}].filter(x=>x.v>0).map(({l,v,c})=>(
                  <div key={l} title={`${l}: ${v}`} style={{flex:v,background:c,display:"flex",alignItems:"center",justifyContent:"center",minWidth:v>0?24:0}}>
                    {v>0&&<span style={{fontSize:10,color:"#fff",fontWeight:700}}>{v}</span>}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                {[{l:"Strong Buy",v:fh.breakdown.strongBuy,c:"#1a9e3f"},{l:"Buy",v:fh.breakdown.buy,c:T.green},{l:"Hold",v:fh.breakdown.hold,c:T.gold},{l:"Sell",v:fh.breakdown.sell,c:"#e67e22"},{l:"Strong Sell",v:fh.breakdown.strongSell,c:T.red}].map(({l,v,c})=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:c}}/><span style={{fontSize:10,color:T.muted}}>{l}: <span style={{color:T.text,fontWeight:600}}>{v}</span></span></div>
                ))}
              </div>
            </div>}
            {/* Price targets + estimates */}
            <div className="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                {l:lang==="es"?"Precio Objetivo":"Price Target",v:fh.targetMean?`$${fh.targetMean}`:"—",c:T.gold},
                {l:lang==="es"?"Target Alto":"Target High",v:fh.targetHigh?`$${fh.targetHigh}`:"—",c:T.green},
                {l:lang==="es"?"Target Bajo":"Target Low",v:fh.targetLow?`$${fh.targetLow}`:"—",c:T.red},
                {l:lang==="es"?"Crecimiento EPS (est.)":"EPS Growth (est.)",v:fh.epsGrowthNext||"—",c:T.green},
              ].map(({l,v,c},pi)=><div key={pi} style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{l}</div>
                <Mn sz={15} c={c} s={{fontWeight:600}}>{v}</Mn>
              </div>)}
            </div>
            <div style={{fontSize:10,color:T.muted}}>{fh.isAiEstimate?"🤖 Consenso IA · Estimación basada en datos públicos recientes":"Datos en tiempo real · Consenso Wall Street · "+new Date().toLocaleDateString("es-CO",{month:"short",day:"numeric",year:"numeric"})} {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
          </div>
        </div>
      </div>}
      {!fh&&info&&<div style={{padding:"10px 14px",background:`${T.muted}10`,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.muted}}>
        ⚠️ Datos en tiempo real no disponibles para {company} — verifica la configuración en Vercel.
      </div>}

      <div className="score-card-grid" style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:16,alignItems:"start"}}>
        <Card s={{textAlign:"center",padding:18}}>
          <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Quality Score</div>
          <ScoreRing score={score} size={110} lang={lang}/>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:g.c,marginTop:4}}>{g.label}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:6}}>{checklist.filter(c=>c.p).length}/8 criteria</div>
          <div style={{marginTop:12}}>
            {catS.map(({cat,s})=><div key={cat} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}><span style={{color:T.muted}}>{cat}</span><Mn sz={10} c={s>=60?T.green:s>=40?T.gold:T.red}>{s}%</Mn></div>
              <div style={{height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${s}%`,background:s>=60?T.green:s>=40?T.gold:T.red,borderRadius:2,transition:"width 0.5s"}}/></div>
            </div>)}
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card s={{background:T.accent}}>
            <div style={{fontSize:10,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>✦ {company} — AI Analysis</div>
            <div style={{fontSize:13,color:T.text,lineHeight:1.75,marginBottom:14}}>{info.summary}</div>
            {info.keyMetrics&&<div className="kpi-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {[{l:{en:"Revenue CAGR 5Y",es:"Ingresos CAGR 5A"},v:info.keyMetrics.revenueGrowth5y,c:T.green},
              {l:{en:"FCF Growth (CAGR)",es:"FCF Growth (CAGR)"},v:info.keyMetrics.fcfGrowthDisplay,c:T.green},
              {l:{en:"FCF Margin",es:"Margen FCF"},v:info.keyMetrics.fcfMarginDisplay,c:T.blue},
              {l:{en:"ROIC",es:"ROIC"},v:info.keyMetrics.roicDisplay,c:T.gold},
              {l:{en:"Debt/Equity",es:"Deuda/Capital"},v:info.keyMetrics.debtEquity,c:T.muted},
              {l:{en:"EPS Growth",es:"Crecimiento EPS"},v:info.keyMetrics.epsGrowth,c:T.green}].map(({l,v,c},ki)=>{
              const lText=typeof l==="object"?l[lang]||l.en:l;
              return<div key={ki} style={{background:T.card,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{lText}</div>
                <Mn sz={14} c={c} s={{fontWeight:600}}>{v||"—"}</Mn>
              </div>;})}
            </div>}
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(info.catalysts||[]).map((c,i)=><span key={i} style={{fontSize:11,padding:"4px 10px",borderRadius:20,background:`${T.green}15`,color:T.green,border:`1px solid ${T.green}33`}}>✓ {c}</span>)}</div>
          </Card>
        </div>
      </div>
      <AdBanner size="leaderboard"/>
    </>}

    {!info&&<div style={{display:"flex",alignItems:"center",gap:20,padding:"14px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12}}>
      <ScoreRing score={score} size={100} lang={lang}/>
      <div style={{flex:1}}>{catS.map(({cat,s})=><div key={cat} style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}><span style={{color:T.muted}}>{cat}</span><Mn sz={11} c={s>=60?T.green:s>=40?T.gold:T.red}>{s}%</Mn></div>
        <div style={{height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${s}%`,background:s>=60?T.green:s>=40?T.gold:T.red,borderRadius:2,transition:"width 0.5s"}}/></div>
      </div>)}</div>
    </div>}

    {/* ── INLINE EXPECTED RETURN — auto-fills from AI analysis ── */}
    {info&&<InlineExpectedReturn company={company} sector={sector} onAnalysis={onAnalysis} canAnalyze={canAnalyze} lang={lang}/>}

    {/* ── INLINE DCF — auto-fills from AI analysis ── */}
    {info&&<InlineDCF company={company} onAnalysis={onAnalysis} canAnalyze={canAnalyze} lang={lang}/>}

    <div className="compound-layout" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {Object.entries(CRITERIA).map(([cat,cs])=><Card key={cat}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold}}>{cat==="growth"?"📈 Growth":cat==="profitability"?"💎 Profitability":cat==="cashflow"?"💵 Cash Flow (Growth)":"🏦 Balance Sheet"}</div>
            {locked&&<span style={{fontSize:9,color:T.muted,background:T.accent,padding:"2px 6px",borderRadius:4}}>🔒 locked</span>}
          </div>
          {cs.map(c=><MRow key={c.key} c={c} value={m[c.key]||0} onChange={(k,v)=>setM(p=>({...p,[k]:v}))} locked={locked} lang={lang}/>)}
        </Card>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🏰 Moat Analysis</div>
          <div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:10}}/><Radar dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/></RadarChart></ResponsiveContainer></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
            {MOAT_KEYS.map(k=><div key={k}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3,color:T.muted}}><span>{moatLabel(k,lang)}</span><Mn sz={10} c={T.gold}>{moat[k]}/5</Mn></div>
              <div style={{display:"flex",gap:3,opacity:locked?0.45:1}}>{[1,2,3,4,5].map(v=><div key={v} onClick={()=>!locked&&setMoat(p=>({...p,[k]:v}))} style={{flex:1,height:5,borderRadius:3,cursor:locked?"not-allowed":"pointer",background:v<=moat[k]?T.gold:T.border,transition:"background 0.2s"}}/>)}</div>
            </div>)}
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:10}}>{lang==="es"?"📋 Checklist Buffett / Munger":"📋 Buffett / Munger Checklist"}</div>
          {checklist.map(({l,p},ci)=>{
            const lText=typeof l==="object"?l[lang]||l.en:l;
            return<div key={ci} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}22`}}>
              <div style={{width:17,height:17,borderRadius:"50%",background:p?`${T.green}22`:`${T.red}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:p?T.green:T.red,flexShrink:0}}>{p?"✓":"✗"}</div>
              <span style={{fontSize:11,color:p?T.text:T.muted}}>{lText}</span>
            </div>;
          })}
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:T.muted}}>{lang==="es"?"Criterios cumplidos":"Criteria met"}</span>
            <Mn sz={18} c={T.gold}>{checklist.filter(c=>c.p).length}/8</Mn>
          </div>
        </Card>
      </div>
    </div>
  </div>;
}

// ── EXPECTED RETURN ───────────────────────────────────────────────────────────
function ReturnTab({onAnalysis,canAnalyze}){
  const [ticker,setTicker]=useState("");
  const [amount,setAmount]=useState(10000);
  const [inp,setInp]=useState({rg:18,me:2,mx:3,dv:1,pe:30,fg:12});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [summary,setSummary]=useState("");
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const er=inp.rg+inp.me+inp.mx+inp.dv;
  const proj=Array.from({length:11},(_,i)=>({y:`Y${i}`,p:Math.round(amount*Math.pow(1+er/100,i)),b:Math.round(amount*Math.pow(1.08,i))}));

  const analyze=async()=>{
    if(!ticker.trim()){setErr("Enter a ticker first.");return;}
    if(!canAnalyze())return;
    setLoading(true);setErr("");setSummary("");
    try{
      const p=await callAI(`You are an investment analyst. For the stock "${ticker}", estimate the expected annual return components and valuation based on real data and Wall Street analyst consensus.
Respond ONLY with valid JSON, no markdown:
{"rg":<revenue growth contribution to return, number 0-40>,"me":<margin expansion, number -5 to 10>,"mx":<multiple expansion/contraction, number -10 to 15>,"dv":<dividend yield, number 0-6>,"pe":<current P/E ratio, number>,"fg":<analyst consensus EPS growth % next 3Y, number>,"summary":"<2-3 sentences on expected return thesis for ${ticker}, including analyst price target and upside>"}`);
      setInp({rg:p.rg||18,me:p.me||2,mx:p.mx||3,dv:p.dv||0,pe:p.pe||25,fg:p.fg||15});
      setSummary(p.summary||"");onAnalysis();
    }catch(e){setErr(`Error: ${e.message||"Could not analyze."}`);}
    setLoading(false);
  };

  const RS=({l,k,min,max,u,c})=><div style={{marginBottom:13}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.muted}}>{l}</span><Mn sz={12} c={c||T.text}>{inp[k]>0?"+":""}{inp[k]}{u}</Mn></div>
    <input type="range" min={min} max={max} step={0.5} value={inp[k]} onChange={e=>s(k,parseFloat(e.target.value))}/>
  </div>;

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:10}}>📐 Expected Return Framework</div>
      <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:16}}>
        Enter a ticker — AI pulls analyst consensus and models your expected return: <span style={{color:T.green}}>Revenue Growth</span> + <span style={{color:T.blue}}>Margin Expansion</span> + <span style={{color:T.gold}}>Multiple Expansion</span> + <span style={{color:T.muted}}>Dividends</span>.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"flex-end"}}>
        <div><Lbl>Ticker</Lbl><input type="text" value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="NVDA, AAPL, MSFT..." onKeyDown={e=>e.key==="Enter"&&analyze()}/></div>
        <div><Lbl>Initial Investment</Lbl><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span><input type="number" value={amount} min={100} step={100} onChange={e=>setAmount(parseFloat(e.target.value)||0)} style={{fontWeight:700}}/></div></div>
        <button className="btn btn-gold" onClick={analyze} disabled={loading} style={{height:44,padding:"0 20px"}}>{loading?<span className="sp">⟳</span>:"📐 Analyze"}</button>
      </div>
      {loading&&<div style={{textAlign:"center",padding:10,fontSize:12,color:T.gold,background:`${T.gold}08`,borderRadius:8,marginTop:10}}><span className="sp">⟳</span>  Analyzing <strong>{ticker}</strong>...</div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`,marginTop:10}}>{err}</div>}
      {summary&&<div style={{marginTop:12,padding:12,background:T.accent,borderRadius:8,fontSize:12,color:T.text,lineHeight:1.7,border:`1px solid ${T.border}`}}>{summary}</div>}
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"310px 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:16}}>{ticker?`📈 ${ticker} — Return Breakdown`:"📈 Return Breakdown"}</div>
          <RS l="Revenue growth" k="rg" min={0} max={40} u="%" c={T.green}/>
          <RS l="Margin expansion" k="me" min={-5} max={10} u="%" c={T.blue}/>
          <RS l="Multiple expansion" k="mx" min={-10} max={15} u="%" c={T.gold}/>
          <RS l="Dividends" k="dv" min={0} max={6} u="%" c={T.muted}/>
          <div style={{background:T.accent,borderRadius:10,padding:16,marginTop:8,border:`1px solid ${T.border}`}}>
            <Lbl>Total Expected Return</Lbl>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontFamily:"'Playfair Display',serif",fontSize:38,color:er>=18?T.green:T.gold,fontWeight:700}}>{er.toFixed(1)}%</span><span style={{fontSize:12,color:T.muted}}>/year</span></div>
            <div style={{fontSize:11,color:er>=18?T.green:T.red,marginTop:4}}>{er>=20?"✓ Premium ≥20%":er>=18?"✓ Minimum ≥18%":"✗ Below target"}</div>
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>📊 PEG & Valuation</div>
          <RS l="Current P/E" k="pe" min={5} max={80} u="x"/>
          <RS l="Earnings growth" k="fg" min={5} max={40} u="%"/>
          <div style={{marginTop:8,padding:12,background:T.accent,borderRadius:8,border:`1px solid ${T.border}`}}>
            {[{l:"PEG Ratio",v:(inp.pe/inp.fg).toFixed(2),g:inp.pe/inp.fg<=1.5,u:"x"},{l:"Fair P/E",v:inp.fg*2,u:"x"},{l:"Potential Upside",v:(((inp.fg*2/inp.pe)-1)*100).toFixed(0),g:inp.fg*2>inp.pe,u:"%"}].map(({l,v,g,u})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}22`}}><span style={{fontSize:12,color:T.muted}}>{l}</span><Mn sz={12} c={g===undefined?T.text:g?T.green:T.red}>{v}{u}</Mn></div>)}
          </div>
        </Card>
      </div>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:4}}>📈 10-Year Projection{ticker?` — ${ticker}`:""}</div>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Starting from <strong style={{color:T.gold}}>{fmt(amount)}</strong> · <span style={{color:T.gold}}>{er.toFixed(1)}%/yr</span> vs. market at 8%</div>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={proj}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.muted} stopOpacity={0.2}/><stop offset="95%" stopColor={T.muted} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="y" tick={{fill:T.muted,fontSize:10}}/>
              <YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>fmtShort(v)} width={82}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[fmt(v),n==="p"?`${ticker||"Compounder"} (${er.toFixed(0)}%/yr)`:"Market (8%/yr)"]}/>
              <Area type="monotone" dataKey="b" stroke={T.muted} fill="url(#gB)" strokeWidth={1.5} strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="p" stroke={T.gold} fill="url(#gP)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
          {[3,5,10].map(y=>{const pv=amount*Math.pow(1+er/100,y),bv=amount*Math.pow(1.08,y);return<div key={y} style={{background:T.accent,borderRadius:10,padding:14,border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>Year {y}</div><Mn sz={16} c={T.gold} s={{display:"block",marginBottom:3,wordBreak:"break-all"}}>{fmt(pv)}</Mn><div style={{fontSize:10,color:T.green}}>+{fmt(pv-bv)} vs market</div></div>;})}
        </div>
      </Card>
    </div>
    <AdBanner size="rectangle"/>
  </div>;
}

// ── DCF ───────────────────────────────────────────────────────────────────────
function DCFTab({onAnalysis,canAnalyze,lang="en"}){
  const [ticker,setTicker]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [dcfSummary,setDcfSummary]=useState("");
  const [d,setD]=useState({rev:1000,rg:20,mt:25,fc:0.85,tg:2.5,w:10,sh:100,ca:200,de:300,yr:10});
  const s=(k,v)=>setD(p=>({...p,[k]:parseFloat(v)||0}));

  const analyze=async()=>{
    if(!ticker.trim()){setErr("Enter a ticker first.");return;}
    if(!canAnalyze())return;
    setLoading(true);setErr("");setDcfSummary("");
    try{
      const p=await callAI(`You are a financial analyst. For "${ticker}", provide real DCF model inputs based on actual company data up to your knowledge cutoff.
Respond ONLY with valid JSON, no markdown:
{"rev":<latest annual revenue in millions USD>,"rg":<expected revenue growth rate next 5Y %>,"mt":<FCF margin %>,"fc":<FCF conversion ratio 0.5-1>,"tg":<terminal growth rate 1-4%>,"w":<WACC % 6-15>,"sh":<shares outstanding in millions>,"ca":<cash in millions>,"de":<total debt in millions>,"yr":10,"summary":"<2-3 sentences explaining the DCF assumptions and valuation conclusion for ${ticker}>"}`);
      setD({rev:p.rev||1000,rg:p.rg||20,mt:p.mt||20,fc:p.fc||0.85,tg:p.tg||2.5,w:p.w||10,sh:p.sh||100,ca:p.ca||200,de:p.de||300,yr:10});
      setDcfSummary(p.summary||"");onAnalysis();
    }catch(e){setErr(`Error: ${e.message||"Could not analyze."}`);}
    setLoading(false);
  };

  const flows=Array.from({length:d.yr},(_,i)=>{const r=d.rev*Math.pow(1+d.rg/100,i+1),f=r*(d.mt/100)*d.fc,pv=f/Math.pow(1+d.w/100,i+1);return{y:`Y${i+1}`,f:Math.round(f),pv:Math.round(pv)};});
  const tF=flows[d.yr-1]?.f||0,tV=(tF*(1+d.tg/100))/((d.w-d.tg)/100),tPV=tV/Math.pow(1+d.w/100,d.yr);
  const sumPV=flows.reduce((a,f)=>a+f.pv,0),ev=sumPV+tPV,eq=ev+d.ca-d.de,ips=eq/d.sh;
  const F=({l,k,u,min,max,st=1})=><div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><Lbl s={{marginBottom:0}}>{l}</Lbl><Mn sz={11} c={T.gold}>{d[k]}{u}</Mn></div><input type="range" min={min} max={max} step={st} value={d[k]} onChange={e=>s(k,e.target.value)}/></div>;

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:10}}>📊 AI-Powered DCF Valuation</div>
      <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:16}}>
        Enter a ticker — AI fills real company data automatically. A DCF estimates <strong style={{color:T.text}}>intrinsic value per share</strong> by discounting future Free Cash Flows to today's dollars.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"flex-end"}}>
        <div><Lbl>Company Ticker</Lbl><input type="text" value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="NVDA, AAPL, DUOL..." onKeyDown={e=>e.key==="Enter"&&analyze()} style={{fontSize:16,fontWeight:700,letterSpacing:"0.05em"}}/></div>
        <button className="btn btn-gold" onClick={analyze} disabled={loading} style={{height:44,padding:"0 24px"}}>{loading?<span className="sp">⟳</span>:"📊 Build DCF"}</button>
      </div>
      {loading&&<div style={{textAlign:"center",padding:10,fontSize:12,color:T.gold,background:`${T.gold}08`,borderRadius:8,marginTop:10}}><span className="sp">⟳</span>  Building DCF for <strong>{ticker}</strong>...</div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`,marginTop:10}}>{err}</div>}
      {dcfSummary&&<div style={{marginTop:12,padding:12,background:T.accent,borderRadius:8,fontSize:12,color:T.text,lineHeight:1.7,border:`1px solid ${T.border}`}}>{dcfSummary}</div>}
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>⚙️ Assumptions{ticker?` — ${ticker}`:""}</div>
          <F l={lang==="es"?"Ingresos Base (M$)":"Base Revenue (M$)"} k="rev" u="M" min={10} max={50000} st={10}/>
          <F l="Revenue Growth" k="rg" u="%" min={0} max={50}/>
          <F l="FCF Margin" k="mt" u="%" min={5} max={50}/>
          <F l={lang==="es"?"Conversión FCF":"FCF Conversion"} k="fc" u="x" min={0.5} max={1} st={0.05}/>
          <F l={lang==="es"?"Crecimiento Terminal":"Terminal Growth"} k="tg" u="%" min={1} max={4} st={0.5}/>
          <F l="WACC" k="w" u="%" min={6} max={15} st={0.5}/>
          <F l="Years" k="yr" u="" min={5} max={15}/>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>🏦 Balance Sheet</div>
          <F l={lang==="es"?"Caja (M$)":"Cash (M$)"} k="ca" u="M" min={0} max={200000} st={100}/>
          <F l={lang==="es"?"Deuda Total (M$)":"Total Debt (M$)"} k="de" u="M" min={0} max={200000} st={100}/>
          <F l={lang==="es"?"Acciones (M)":"Shares (M)"} k="sh" u="M" min={1} max={10000} st={10}/>
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>EV = Discounted FCFs + Terminal Value PV<br/>Intrinsic/Share = (EV + Cash − Debt) ÷ Shares</div>
        </Card>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[{l:"Sum of Discounted FCFs",v:`$${Math.round(sumPV)}M`,c:T.blue,sub:"PV of projected flows"},{l:"Terminal Value (PV)",v:`$${Math.round(tPV)}M`,c:T.gold,sub:`${sumPV+tPV>0?((tPV/(sumPV+tPV))*100).toFixed(0):0}% of total`},{l:"Intrinsic Value / Share",v:`$${ips.toFixed(2)}`,c:T.green,sub:ticker?`${ticker} estimate`:"per share"}].map(({l,v,c,sub})=><Card key={l} s={{padding:14,textAlign:"center"}}><Lbl s={{textAlign:"center"}}>{l}</Lbl><Mn sz={20} c={c}>{v}</Mn><div style={{fontSize:10,color:T.muted,marginTop:4}}>{sub}</div></Card>)}
        </div>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>FCF Projections{ticker?` — ${ticker}`:""}</div>
          <div style={{height:240}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flows}>
                <defs>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="y" tick={{fill:T.muted,fontSize:10}}/>
                <YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>`$${v}M`}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[`$${v}M`,n==="f"?"Nominal FCF":"Discounted FCF"]}/>
                <Area type="monotone" dataKey="f" stroke={T.green} fill="url(#gF)" strokeWidth={2} name="f"/>
                <Area type="monotone" dataKey="pv" stroke={T.gold} fill="url(#gV)" strokeWidth={2} strokeDasharray="4 4" name="pv"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card s={{padding:14}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,lineHeight:2.2}}><span style={{color:T.gold}}>EV</span> = <span style={{color:T.blue}}>${Math.round(sumPV)}M</span> + <span style={{color:T.gold}}>${Math.round(tPV)}M</span> = <span style={{color:T.text,fontWeight:700}}>${Math.round(ev)}M</span>{"   ·   "}<span style={{color:T.gold}}>Equity</span> = ${Math.round(eq)}M{"   ·   "}<span style={{color:T.green,fontWeight:700}}>Intrinsic = ${ips.toFixed(2)}/share</span></div></Card>
        <AdBanner size="rectangle"/>
      </div>
    </div>
  </div>;
}

// ── RISK PROFILE ─────────────────────────────────────────────────────────────
// ── PROFILE HELPERS — module level so any component can use them ─────────────
const pLabel=(p,lang="en")=>{
  if(!p)return"";
  if(typeof p.label==="object")return p.label[lang]||p.label.en||"";
  return String(p.label||"");
};
const pDesc=(p,lang="en")=>{
  if(!p)return"";
  if(typeof p.desc==="object")return p.desc[lang]||p.desc.en||"";
  return String(p.desc||"");
};
const pTraits=(p,lang="en")=>{
  if(!p)return[];
  if(Array.isArray(p.traits))return p.traits;
  if(p.traits&&typeof p.traits==="object")return p.traits[lang]||p.traits.en||[];
  return[];
};

const QUESTIONS=[
  {
    id:"horizon",
    q:{en:"How long can you keep your money invested without needing it?",es:"¿Cuánto tiempo puedes mantener tu dinero invertido sin necesitarlo?"},
    opts:[
      {l:{en:"Less than 2 years",es:"Menos de 2 años"},s:1},
      {l:{en:"2–5 years",es:"2–5 años"},s:2},
      {l:{en:"5–10 years",es:"5–10 años"},s:3},
      {l:{en:"More than 10 years",es:"Más de 10 años"},s:4},
    ],
  },
  {
    id:"drop",
    q:{en:"Your portfolio drops 30% in a market crash. What do you do?",es:"Tu portafolio cae 30% en un crash. ¿Qué haces?"},
    opts:[
      {l:{en:"Sell everything immediately",es:"Vendo todo inmediatamente"},s:1},
      {l:{en:"Sell some to reduce exposure",es:"Vendo algo para reducir exposición"},s:2},
      {l:{en:"Hold and wait for recovery",es:"Aguanto y espero la recuperación"},s:3},
      {l:{en:"Buy more — it's a discount",es:"Compro más — es un descuento"},s:4},
    ],
  },
  {
    id:"goal",
    q:{en:"What is your primary investment goal?",es:"¿Cuál es tu objetivo principal de inversión?"},
    opts:[
      {l:{en:"Preserve my capital — safety first",es:"Preservar mi capital — seguridad primero"},s:1},
      {l:{en:"Steady income with low risk",es:"Ingresos estables con bajo riesgo"},s:2},
      {l:{en:"Balanced growth over time",es:"Crecimiento equilibrado a largo plazo"},s:3},
      {l:{en:"Maximum long-term growth",es:"Máximo crecimiento a largo plazo"},s:4},
    ],
  },
  {
    id:"experience",
    q:{en:"How would you describe your investing experience?",es:"¿Cómo describirías tu experiencia invirtiendo?"},
    opts:[
      {l:{en:"None — I'm just starting",es:"Ninguna — apenas empiezo"},s:1},
      {l:{en:"Some — I've bought ETFs or funds",es:"Algo — he comprado ETFs o fondos"},s:2},
      {l:{en:"Moderate — I follow markets regularly",es:"Moderada — sigo los mercados regularmente"},s:3},
      {l:{en:"Advanced — I analyze individual stocks",es:"Avanzada — analizo acciones individuales"},s:4},
    ],
  },
  {
    id:"income",
    q:{en:"If you lost your entire investment, how would it affect your life?",es:"Si perdieras toda tu inversión, ¿cómo afectaría tu vida?"},
    opts:[
      {l:{en:"Devastating — it's most of my savings",es:"Devastador — es la mayor parte de mis ahorros"},s:1},
      {l:{en:"Very difficult — major setback",es:"Muy difícil — un gran retroceso"},s:2},
      {l:{en:"Tough but manageable",es:"Duro pero manejable"},s:3},
      {l:{en:"Fine — this is money I can afford to lose",es:"Bien — es dinero que puedo perder"},s:4},
    ],
  },
  {
    id:"volatility",
    q:{en:"Which statement best describes your attitude toward risk?",es:"¿Qué frase describe mejor tu actitud hacia el riesgo?"},
    opts:[
      {l:{en:"I prefer guaranteed returns even if small",es:"Prefiero retornos garantizados aunque sean bajos"},s:1},
      {l:{en:"I accept modest risk for modest gains",es:"Acepto riesgo moderado para ganancias moderadas"},s:2},
      {l:{en:"I accept higher volatility for higher returns",es:"Acepto mayor volatilidad por mayores retornos"},s:3},
      {l:{en:"I embrace high risk for maximum upside",es:"Abrazo el alto riesgo por el máximo potencial"},s:4},
    ],
  },
  {
    id:"concentration",
    q:{en:"How many stocks would you feel comfortable holding?",es:"¿Cuántas acciones te sentirías cómodo teniendo?"},
    opts:[
      {l:{en:"1–3 very safe blue chips only",es:"1–3 blue chips muy seguros"},s:1},
      {l:{en:"5–10 diversified ETFs and stocks",es:"5–10 ETFs y acciones diversificadas"},s:2},
      {l:{en:"10–20 mix of growth and value",es:"10–20 mezcla de crecimiento y valor"},s:3},
      {l:{en:"20+ including high-growth and emerging",es:"20+ incluyendo alto crecimiento y emergentes"},s:4},
    ],
  },
  {
    id:"age",
    q:{en:"How old are you?",es:"¿Qué edad tienes?"},
    opts:[
      {l:{en:"55 or older",es:"55 o más"},s:1},
      {l:{en:"45–54",es:"45–54"},s:2},
      {l:{en:"35–44",es:"35–44"},s:3},
      {l:{en:"Under 35",es:"Menos de 35"},s:4},
    ],
  },
];

const PROFILES={
  conservative:{
    label:{en:"Conservative",es:"Conservador"},icon:"🛡️",color:"#4a9eff",
    desc:{en:"Capital preservation is your priority. You prefer stability over growth and can't afford significant losses. Best suited for bonds, dividend stocks, and low-volatility ETFs.",
          es:"Preservar el capital es tu prioridad. Prefieres estabilidad sobre crecimiento. Ideal para bonos, acciones de dividendos y ETFs de baja volatilidad."},
    traits:{en:["Low volatility tolerance","Short to medium time horizon","Income-focused","Safety first"],
            es:["Baja tolerancia a la volatilidad","Horizonte corto a mediano","Enfocado en ingresos","Seguridad primero"]},
  },
  moderate:{
    label:{en:"Moderate",es:"Moderado"},icon:"⚖️",color:"#c9a84c",
    desc:{en:"You seek a balance between growth and security. Comfortable with some market fluctuations in exchange for long-term returns. A diversified mix of stocks and bonds suits you well.",
          es:"Buscas equilibrio entre crecimiento y seguridad. Cómodo con fluctuaciones del mercado a cambio de retornos a largo plazo."},
    traits:{en:["Medium volatility tolerance","5–10 year horizon","Balanced growth + income","Diversification focused"],
            es:["Tolerancia media a la volatilidad","Horizonte 5–10 años","Crecimiento + ingresos balanceados","Enfocado en diversificación"]},
  },
  aggressive:{
    label:{en:"Aggressive",es:"Agresivo"},icon:"🚀",color:"#2ecc71",
    desc:{en:"You're a growth investor willing to ride market volatility for superior long-term returns. You understand that short-term drops are the price for long-term compounding.",
          es:"Eres un inversor de crecimiento dispuesto a soportar la volatilidad por retornos superiores a largo plazo."},
    traits:{en:["High volatility tolerance","Long time horizon (10Y+)","Maximum growth focus","Compounders and quality stocks"],
            es:["Alta tolerancia a la volatilidad","Horizonte largo (10Y+)","Máximo enfoque en crecimiento","Compounders y acciones de calidad"]},
  },
};

function ProfileTab({onAnalysis,canAnalyze,onGoToPortfolio,onGoToStrategy,lang="en",user=null}){
  const [step,setStep]=useState("intro"); // intro | quiz | result | portfolio
  const [answers,setAnswers]=useState({});
  const [current,setCurrent]=useState(0);
  const [portfolio,setPortfolio]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [amount,setAmount]=useState(10000);

  const totalScore=Object.values(answers).reduce((a,v)=>a+v,0);
  const maxScore=QUESTIONS.length*4;
  const pct=totalScore/maxScore;
  const profileKey=pct<=0.4?"conservative":pct<=0.7?"moderate":"aggressive";
  const profile=PROFILES[profileKey];

  const answer=(score)=>{
    const q=QUESTIONS[current];
    const next={...answers,[q.id]:score};
    setAnswers(next);
    if(current<QUESTIONS.length-1){setCurrent(c=>c+1);}
    else{setStep("result");}
  };

  const [showRiskPaywall,setShowRiskPaywall]=useState(false);
  const getPortfolio=async()=>{
    if(!isAdmin()){setShowRiskPaywall(true);return;}
    setLoading(true);setErr("");
    // Scale positions to investment amount
    const stockCount=amount<500?2:amount<2000?3:amount<10000?5:amount<25000?7:10;
    const etfCount=amount<500?1:amount<2000?1:amount<10000?2:3;
    try{
      const p=await callAI(`You are a professional portfolio manager. Based on a ${pLabel(profile,lang)} risk profile investor with $${amount.toLocaleString()} to invest, recommend a practical portfolio.

IMPORTANT — Investment amount is $${amount.toLocaleString()}. Scale the number of positions accordingly:
- Recommend exactly ${stockCount} individual stocks and ${etfCount} ETF(s).
- Each position should be at least $${Math.round(amount/(stockCount+etfCount))} to be meaningful.
- With small amounts, focus on the BEST convictions only — not diversification for its own sake.
- Weights must reflect actual dollar amounts that make sense for $${amount.toLocaleString()}.

Investor profile: ${pLabel(profile,"en")} — ${pDesc(profile,"en")}
Traits: ${pTraits(profile,"en").join(", ")}

Respond ONLY with valid JSON, no markdown:
{
  "allocation":[
    {"category":"<e.g. US Large Cap Growth>","pct":<number 0-100>,"color":"<hex color>","rationale":"<1 sentence>"},
    {"category":"..."}
  ],
  "stocks":[
    {"ticker":"<ticker>","name":"<full name>","weight":<% of portfolio>,"why":"<1 sentence>","type":"<Core|Growth|Defensive|Income>","dollarAmt":<dollar amount>,"entryLow":<buy zone low price e.g. 118.50>,"entryHigh":<buy zone high price e.g. 125.00>,"target":<12-month price target e.g. 165.00>,"stopLoss":<stop loss price e.g. 105.00>,"riskReward":"<e.g. 1:3.2>"}
  ],
  "etfs":[
    {"ticker":"<ticker>","name":"<full name>","weight":<% of portfolio>,"why":"<1 sentence>","dollarAmt":<dollar amount>,"entryLow":<buy zone low>,"entryHigh":<buy zone high>,"target":<price target>,"stopLoss":<stop loss>,"riskReward":"<e.g. 1:2.5>"}
  ],
  "expectedReturn":"<e.g. 8-12% annual>",
  "maxDrawdown":"<e.g. -15% to -25%>",
  "rebalance":"<e.g. Quarterly>",
  "summary":"<3 sentences: strategy, why it fits the profile, and why these specific picks make sense for $${amount.toLocaleString()}>"
}`);
      // Save profile to localStorage so Portfolio Tracker can use it
      try{
        const rp={label:pLabel(profile,"en"),desc:pDesc(profile,"en"),icon:profile.icon,color:profile.color};
        localStorage.setItem("inversoria_risk_profile",JSON.stringify(rp));
        cloudSave("user_data","inversoria_risk_profile",rp,user?.id).catch(()=>{});
      }catch(e){}
      setPortfolio(p);onAnalysis();setStep("portfolio");
    }catch(e){setErr(`Error: ${e.message||"Could not generate portfolio."}`);}
    setLoading(false);
  };

  const reset=()=>{setStep("intro");setAnswers({});setCurrent(0);setPortfolio(null);setErr("");};

  // ── INTRO ──
  if(step==="intro")return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{textAlign:"center",padding:"40px 28px",background:`linear-gradient(135deg,${T.card},${T.accent})`,borderRadius:16,border:`1px solid ${T.goldDim}44`}}>
      <div style={{fontSize:56,marginBottom:16}}>🧬</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,color:T.gold,marginBottom:12,fontWeight:700}}>{lang==="es"?"¿Cuál es tu ADN Inversor?":"What's Your Investor DNA?"}</div>
      <div style={{fontSize:15,color:T.muted,maxWidth:580,margin:"0 auto 32px",lineHeight:1.8}}>
        {lang==="es"?"Responde 8 preguntas y la IA identificará tu perfil de riesgo — ":"Answer 8 questions and our AI will identify your risk profile — "}<span style={{color:T.text}}>{lang==="es"?"Conservador, Moderado o Agresivo":"Conservative, Moderate, or Aggressive"}</span>{lang==="es"?" — y construirá un portafolio personalizado para ti.":" — then build a personalized portfolio of stocks and ETFs tailored to you."}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:600,margin:"0 auto 36px"}}>
        {Object.values(PROFILES).map((prof)=>{
          const lbl=typeof prof.label==="object"?prof.label[lang]||prof.label.en:prof.label;
          const tr=Array.isArray(prof.traits)?prof.traits:(prof.traits[lang]||prof.traits.en);
          return<div key={lbl} style={{background:T.card,border:`1px solid ${prof.color}44`,borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>{prof.icon}</div>
            <div style={{fontSize:14,color:prof.color,fontWeight:700,marginBottom:8}}>{lbl}</div>
            <div style={{fontSize:10,color:T.muted,lineHeight:1.6}}>{tr[0]}</div>
          </div>;
        })}
      </div>
      <button className="btn btn-gold" onClick={()=>setStep("quiz")} style={{fontSize:16,padding:"14px 40px",borderRadius:12}}>
        {lang==="es"?"🧬 Comenzar Mi Perfil de Riesgo →":"🧬 Start My Risk Profile →"}
      </button>
    </div>
    <AdBanner size="leaderboard"/>
  </div>;

  // ── QUIZ ──
  if(step==="quiz"){
    const q=QUESTIONS[current];
    const progress=((current)/QUESTIONS.length)*100;
    return<div className="fi" style={{display:"flex",flexDirection:"column",gap:16,maxWidth:680,margin:"0 auto",width:"100%"}}>
      {/* Progress */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:12,color:T.muted}}>{lang==="es"?`Pregunta ${current+1} de ${QUESTIONS.length}`:`Question ${current+1} of ${QUESTIONS.length}`}</span>
        <span style={{fontSize:12,color:T.gold}}>{Math.round(progress)}% complete</span>
      </div>
      <div style={{height:4,background:T.border,borderRadius:2}}>
        <div style={{height:"100%",width:`${progress}%`,background:T.gold,borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>

      {/* Question card */}
      <Card s={{padding:"24px 20px",background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
        <div style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>
          {lang==="es"
            ?["⏱️ Horizonte Temporal","📉 Reacción al Riesgo","🎯 Tu Objetivo","📚 Experiencia","💸 Impacto de Vida","🌊 Volatilidad","📊 Diversificación","🎂 Tu Edad"][current]
            :["⏱️ Time Horizon","📉 Risk Reaction","🎯 Your Goal","📚 Experience","💸 Life Impact","🌊 Volatility","📊 Diversification","🎂 Your Age"][current]}
        </div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(16px,3.5vw,22px)",color:T.text,marginBottom:20,lineHeight:1.4}}>
          {typeof q.q==="object"?q.q[lang]||q.q.en:q.q}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.opts.map((opt,oi)=>{
            const optLabel=typeof opt.l==="object"?opt.l[lang]||opt.l.en:opt.l;
            return<button key={oi} onClick={()=>answer(opt.s)}
              style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",textAlign:"left",cursor:"pointer",fontSize:"clamp(12px,2.5vw,14px)",color:T.text,transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.goldDim;e.currentTarget.style.background=`${T.gold}12`;e.currentTarget.style.color=T.gold;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.accent;e.currentTarget.style.color=T.text;}}>
              <span style={{color:T.goldDim,marginRight:10,fontFamily:"'DM Mono',monospace"}}>{["A","B","C","D"][oi]||"•"}</span>
              {optLabel}
            </button>;
          })}
        </div>
      </Card>

      {current>0&&<button onClick={()=>{setCurrent(c=>c-1);const prev={...answers};delete prev[QUESTIONS[current-1].id];setAnswers(prev);}}
        style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12,alignSelf:"flex-start"}}>
        {lang==="es"?"← Atrás":"← Back"}
      </button>}
    </div>;
  }

  // ── RESULT ──
  if(step==="result")return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Profile reveal */}
    <div style={{textAlign:"center",padding:"36px 28px",background:`linear-gradient(135deg,${T.card},${T.accent})`,borderRadius:16,border:`2px solid ${profile.color}44`}}>
      <div style={{fontSize:60,marginBottom:12}}>{profile.icon}</div>
      <div style={{fontSize:12,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Your Investor Profile</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,color:profile.color,fontWeight:700,marginBottom:16}}>{pLabel(profile,lang)} Investor</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${profile.color}15`,border:`1px solid ${profile.color}44`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
        <span style={{fontSize:12,color:profile.color}}>Score: {totalScore}/{maxScore} points ({Math.round(pct*100)}%)</span>
      </div>
      <div style={{fontSize:15,color:T.muted,maxWidth:600,margin:"0 auto 28px",lineHeight:1.8}}>{pDesc(profile,lang)}</div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
        {pTraits(profile,lang).map(t=><span key={t} style={{fontSize:12,padding:"5px 14px",borderRadius:20,background:`${profile.color}15`,color:profile.color,border:`1px solid ${profile.color}33`}}>✓ {t}</span>)}
      </div>

      {/* Score breakdown */}
      <div className="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,maxWidth:560,margin:"0 auto 28px",textAlign:"left"}}>
        {QUESTIONS.map(q=><div key={q.id} style={{background:T.card,borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:9,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.08em"}}>{q.id}</div>
          <div style={{display:"flex",gap:4}}>
            {[1,2,3,4].map(v=><div key={v} style={{flex:1,height:4,borderRadius:2,background:v<=(answers[q.id]||0)?profile.color:T.border}}/>)}
          </div>
        </div>)}
      </div>

      {/* Investment amount */}
      <div style={{maxWidth:400,margin:"0 auto 24px"}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:8}}>How much would you like to invest?</div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:T.accent,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.border}`}}>
          <span style={{color:T.muted,fontFamily:"monospace",fontSize:16}}>$</span>
          <input type="number" value={amount} min={1000} step={1000} onChange={e=>setAmount(parseFloat(e.target.value)||1000)}
            className="amount-input" style={{flex:1,fontWeight:700,fontSize:16,textAlign:"center"}}/>
        </div>
      </div>

      {/* FREE badge */}
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.green}12`,border:`1px solid ${T.green}33`,borderRadius:20,padding:"5px 14px",marginBottom:12}}>
        <span style={{fontSize:11,color:T.green}}>✓ Risk Profile is FREE — AI Portfolio is Premium</span>
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold" onClick={getPortfolio} disabled={loading} style={{fontSize:15,padding:"14px 32px",borderRadius:12}}>
          {loading?<><span className="sp">⟳</span> Building your portfolio...</>:<>🤖 Get My AI Portfolio <span style={{fontSize:12,opacity:0.8}}>— Premium</span></>}
        </button>
        <button className="btn btn-outline" onClick={reset} style={{padding:"14px 20px",borderRadius:12}}>{lang==="es"?"Volver al Quiz":"Retake Quiz"}</button>
      </div>
      {err&&<div style={{marginTop:12,padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}
      {showRiskPaywall&&<PaywallModal context="riskPortfolio" onClose={()=>setShowRiskPaywall(false)}/>}

      {/* CTA → Portfolio Tracker */}
      <div style={{marginTop:16,padding:"20px 24px",background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.green,marginBottom:4}}>📁 Already have stocks? Let's analyze your portfolio</div>
          <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>
            Upload your positions and our AI will evaluate if your current portfolio matches your <strong style={{color:T.text}}>{pLabel(profile,lang)}</strong> profile — and tell you exactly what to buy, hold, or sell.
          </div>
        </div>
        <button className="btn btn-gold" onClick={onGoToPortfolio} style={{fontSize:14,padding:"12px 24px",borderRadius:10,whiteSpace:"nowrap",flexShrink:0}}>
          📁 Analyze My Portfolio →
        </button>
      </div>
    </div>
    {/* Brokers CTA — show after profile result */}
    <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`,padding:20}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:6}}>🏦 Ready to start investing?</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Open a brokerage account and start building your {pLabel(profile,lang)} portfolio today.</div>
      <div className="kpi-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {BROKERS.map(({name,url,desc,badge})=>(
          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
            style={{display:"block",textDecoration:"none",background:T.card,borderRadius:10,padding:14,border:`1px solid ${T.border}`,transition:"border-color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            {badge&&<div style={{fontSize:9,background:`${T.green}20`,color:T.green,border:`1px solid ${T.green}33`,padding:"2px 7px",borderRadius:8,display:"inline-block",marginBottom:6}}>{badge}</div>}
            <div style={{fontSize:13,color:T.text,fontWeight:600,marginBottom:3}}>{name}</div>
            <div style={{fontSize:10,color:T.muted,lineHeight:1.5,marginBottom:8}}>{desc}</div>
            <div style={{fontSize:11,color:T.gold}}>Open Account →</div>
          </a>
        ))}
      </div>
    </Card>

    <AdBanner size="leaderboard"/>
  </div>;

  // ── PORTFOLIO ──
  if(step==="portfolio"&&portfolio)return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Header */}
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:20,alignItems:"center",padding:"24px 28px",background:`linear-gradient(135deg,${T.card},${T.accent})`,borderRadius:16,border:`2px solid ${profile.color}44`}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:44}}>{profile.icon}</div>
        <div style={{fontSize:13,color:profile.color,fontWeight:700,marginTop:4}}>{pLabel(profile,lang)}</div>
      </div>
      <div>
        <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>🤖 AI Portfolio — {pLabel(profile,lang)} Investor · ${amount.toLocaleString()}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.text,marginBottom:10,lineHeight:1.5}}>{portfolio.summary}</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[
            {l:lang==="es"?"Retorno Esperado":"Expected Return",v:portfolio.expectedReturn,c:T.green},
            {l:"Max Drawdown",v:portfolio.maxDrawdown,c:T.red},
            {l:"Rebalance",v:portfolio.rebalance,c:T.gold},
          ].map(({l,v,c})=><div key={l} style={{background:T.card,borderRadius:8,padding:"8px 14px"}}>
            <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{l}</div>
            <Mn sz={14} c={c} s={{fontWeight:600}}>{v}</Mn>
          </div>)}
        </div>
      </div>
    </div>

    {/* Allocation + Stocks grid */}
    <div className="compound-layout" style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:18}}>
      {/* Allocation breakdown */}
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:16}}>📊 Asset Allocation</div>
        {(portfolio.allocation||[]).map(({category,pct,color,rationale})=>(
          <div key={category} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:T.text}}>{category}</span>
              <Mn sz={12} c={color||T.gold} s={{fontWeight:700}}>{pct}%</Mn>
            </div>
            <div style={{height:6,background:T.border,borderRadius:3}}>
              <div style={{height:"100%",width:`${pct}%`,background:color||T.gold,borderRadius:3,transition:"width 0.6s ease"}}/>
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:3}}>{rationale}</div>
          </div>
        ))}
        <div style={{marginTop:16,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted}}>
          💡 Rebalance <span style={{color:T.gold}}>{portfolio.rebalance}</span> to maintain target allocation
        </div>
      </Card>

      {/* Stocks */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>📈 Recommended Stocks</div>
          <div className="g-2" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {(portfolio.stocks||[]).map(({ticker,name,weight,why,type,dollarAmt:dA,entryLow,entryHigh,target,stopLoss,riskReward})=>{
              const typeColor=type==="Core"?T.blue:type==="Growth"?T.green:type==="Defensive"?T.gold:T.purple;
              const dollarAmt=dA||Math.round(amount*(weight/100));
              const hasLevels=entryLow||target||stopLoss;
              return<div key={ticker} style={{background:T.accent,borderRadius:10,padding:12,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <Mn sz={15} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                    <div style={{fontSize:10,color:T.muted,marginTop:1}}>{name}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,color:T.gold,fontWeight:700}}>{weight}%</div>
                    <div style={{fontSize:10,color:T.muted}}>${dollarAmt.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${typeColor}20`,color:typeColor,border:`1px solid ${typeColor}33`}}>{type}</span>
                  {riskReward&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${T.green}15`,color:T.green}}>R/R {riskReward}</span>}
                </div>
                {hasLevels&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
                  {entryLow&&entryHigh&&<div style={{background:`${T.blue}12`,borderRadius:6,padding:"5px 7px",border:`1px solid ${T.blue}22`}}>
                    <div style={{fontSize:8,color:T.muted,marginBottom:2}}>ENTRY ZONE</div>
                    <div style={{fontSize:10,color:T.blue,fontWeight:600}}>${entryLow}–${entryHigh}</div>
                  </div>}
                  {target&&<div style={{background:`${T.green}12`,borderRadius:6,padding:"5px 7px",border:`1px solid ${T.green}22`}}>
                    <div style={{fontSize:8,color:T.muted,marginBottom:2}}>TARGET</div>
                    <div style={{fontSize:10,color:T.green,fontWeight:600}}>${target}</div>
                  </div>}
                  {stopLoss&&<div style={{background:`${T.red}10`,borderRadius:6,padding:"5px 7px",border:`1px solid ${T.red}22`}}>
                    <div style={{fontSize:8,color:T.muted,marginBottom:2}}>STOP LOSS</div>
                    <div style={{fontSize:10,color:T.red,fontWeight:600}}>${stopLoss}</div>
                  </div>}
                </div>}
                <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{why}</div>
              </div>;
            })}
          </div>
        </Card>

        {/* ETFs */}
        {portfolio.etfs?.length>0&&<Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🗂️ Recommended ETFs</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {portfolio.etfs.map(({ticker,name,weight,why,dollarAmt:dA,entryLow,entryHigh,target,stopLoss,riskReward})=>(
              <div key={ticker} style={{background:T.accent,borderRadius:10,padding:12,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div><Mn sz={15} c={T.text} s={{fontWeight:700}}>{ticker}</Mn><div style={{fontSize:10,color:T.muted,marginTop:1}}>{name}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:12,color:T.blue,fontWeight:700}}>{weight}%</div><div style={{fontSize:10,color:T.muted}}>${(dA||Math.round(amount*(weight/100))).toLocaleString()}</div></div>
                </div>
                {(entryLow||target||stopLoss)&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
                  {entryLow&&entryHigh&&<div style={{background:`${T.blue}12`,borderRadius:6,padding:"5px 7px",border:`1px solid ${T.blue}22`}}>
                    <div style={{fontSize:8,color:T.muted,marginBottom:2}}>ENTRY ZONE</div>
                    <div style={{fontSize:10,color:T.blue,fontWeight:600}}>${entryLow}–${entryHigh}</div>
                  </div>}
                  {target&&<div style={{background:`${T.green}12`,borderRadius:6,padding:"5px 7px",border:`1px solid ${T.green}22`}}>
                    <div style={{fontSize:8,color:T.muted,marginBottom:2}}>TARGET</div>
                    <div style={{fontSize:10,color:T.green,fontWeight:600}}>${target}</div>
                  </div>}
                  {stopLoss&&<div style={{background:`${T.red}10`,borderRadius:6,padding:"5px 7px",border:`1px solid ${T.red}22`}}>
                    <div style={{fontSize:8,color:T.muted,marginBottom:2}}>STOP LOSS</div>
                    <div style={{fontSize:10,color:T.red,fontWeight:600}}>${stopLoss}</div>
                  </div>}
                </div>}
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${T.blue}15`,color:T.blue}}>ETF</span>
                  {riskReward&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${T.green}15`,color:T.green}}>R/R {riskReward}</span>}
                </div>
                <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{why}</div>
              </div>
            ))}
          </div>
        </Card>}
      </div>
    </div>

    <AdBanner size="leaderboard"/>

    {/* ✅ I EXECUTED THIS STRATEGY */}
    <div style={{background:`linear-gradient(135deg,${T.green}10,${T.accent})`,border:`2px solid ${T.green}44`,borderRadius:16,padding:"24px 28px",textAlign:"center"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.green,marginBottom:8}}>
        ✅ Did you buy these stocks?
      </div>
      <div style={{fontSize:13,color:T.muted,maxWidth:500,margin:"0 auto 20px",lineHeight:1.7}}>
        Mark this strategy as executed and we'll track your progress — comparing what the AI recommended vs what you actually hold, month after month.
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold nav-premium-btn" onClick={()=>{
          try{
            const stratData={
              profile:{label:pLabel(profile,lang),icon:profile.icon,color:profile.color},
              amount,portfolio,
              createdAt:new Date().toISOString(),
              executedAt:new Date().toISOString(),
            };localStorage.setItem("inversoria_strategy",JSON.stringify(stratData));cloudSave("user_data","inversoria_strategy",stratData,user?.id).catch(()=>{});
          }catch(e){}
          onGoToStrategy&&onGoToStrategy();
        }} style={{fontSize:14,padding:"13px 28px",borderRadius:10}}>
          ✅ Yes — Track My Strategy
        </button>
        <button className="btn btn-outline" onClick={onGoToPortfolio} style={{padding:"13px 20px",borderRadius:10}}>
          📁 I already have positions → Compare
        </button>
      </div>
    </div>

    <div style={{display:"flex",gap:12,justifyContent:"center"}}>
      <button className="btn btn-outline" onClick={reset} style={{padding:"12px 24px",borderRadius:10}}>🔄 Retake Quiz</button>
      <button className="btn btn-outline" onClick={getPortfolio} style={{padding:"12px 20px",borderRadius:10}}>🤖 Regenerate</button>
    </div>

    <Card s={{background:`${T.red}08`,border:`1px solid ${T.red}22`,padding:14}}>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.8}}>
        ⚠️ <span style={{color:T.gold}}>Disclaimer:</span> This portfolio is generated by AI for educational purposes only. It does not constitute financial advice. Always consult a licensed financial advisor before investing.
      </div>
    </Card>

    {/* Brokers — after portfolio result */}
    <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:6}}>🏦 Ready to Execute Your Portfolio?</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Open an account with a trusted broker and start investing. Your AI portfolio is ready to deploy.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {BROKERS.map(({name,url,desc,badge})=>(
          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
            style={{display:"block",textDecoration:"none",background:T.card,borderRadius:12,padding:16,border:`1px solid ${T.border}`,transition:"border-color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            {badge&&<div style={{fontSize:9,background:`${T.green}20`,color:T.green,border:`1px solid ${T.green}33`,padding:"2px 8px",borderRadius:10,display:"inline-block",marginBottom:8}}>{badge}</div>}
            <div style={{fontSize:14,color:T.text,fontWeight:600,marginBottom:4}}>{name}</div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.5,marginBottom:10}}>{desc}</div>
            <div style={{fontSize:11,color:T.gold}}>Open Account →</div>
          </a>
        ))}
      </div>
    </Card>

    {/* CTA → Portfolio Tracker */}
    <div style={{padding:"24px 28px",background:`linear-gradient(135deg,${T.green}10,${T.accent})`,border:`2px solid ${T.green}33`,borderRadius:16,display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"center"}}>
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.green,marginBottom:8}}>
          📁 Already have stocks? Let's see if your portfolio fits your profile
        </div>
        <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:4}}>
          You're a <strong style={{color:profile.color}}>{profile.icon} {pLabel(profile,lang)} investor</strong>. Now let's check if your current holdings reflect that.
          Upload your positions and the AI will:
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {[
            "Evaluate each stock against your risk profile",
            "Flag positions that don't match your investor DNA",
            "Recommend what to buy, hold, or sell",
            "Calculate your real P&L with live prices",
          ].map(t=><div key={t} style={{fontSize:12,color:T.muted,display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:T.green,fontSize:10}}>✓</span>{t}
          </div>)}
        </div>
      </div>
      <div style={{textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:36,marginBottom:8}}>{profile.icon}</div>
        <button className="btn btn-gold" onClick={onGoToPortfolio} style={{fontSize:15,padding:"14px 28px",borderRadius:12,whiteSpace:"nowrap"}}>
          📁 Analyze My Portfolio →
        </button>
        <div style={{fontSize:10,color:T.muted,marginTop:8}}>Your profile score is saved automatically</div>
      </div>
    </div>
  </div>;

  return null;
}

// ── REBALANCE + DCA COMPONENT ────────────────────────────────────────────────
function RebalanceDCA({positions,totalValue,savedProfile,callAI,lang="en"}){
  const [cash,setCash]=useState("");
  const [loadingReb,setLoadingReb]=useState(false);
  const [loadingDCA,setLoadingDCA]=useState(false);
  const [rebalance,setRebalance]=useState(null);
  const [dca,setDca]=useState(null);
  const [err,setErr]=useState("");

  const profileLabel=(typeof savedProfile?.label==="object"?savedProfile?.label?.en:savedProfile?.label)||"Balanced";

  const runRebalance=async()=>{
    if(!canUseRebFree()){
      setErr(lang==="es"
        ?`🔒 Usaste tus ${REB_FREE_LIMIT} planes de rebalanceo gratis. Actualiza a Premium para planes ilimitados.`
        :`🔒 You've used your ${REB_FREE_LIMIT} free rebalance plans. Upgrade to Premium for unlimited.`);
      return;
    }
    setLoadingReb(true);setErr("");setRebalance(null);
    const summary=positions.map(p=>{
      const w=totalValue>0?((p.currentValue||p.totalCostBasis)/totalValue*100).toFixed(1):0;
      return`${p.ticker}: ${w}% weight, P&L ${p.pnlPct!=null?p.pnlPct.toFixed(1)+"%":"unknown"}`;
    }).join(" | ");
    try{
      const r=await callAI(`You are a portfolio rebalancing advisor. Investor profile: ${profileLabel}. 
Current portfolio: ${summary}. Total value: $${Math.round(totalValue).toLocaleString()}.
Suggest a rebalancing plan. Respond ONLY with valid JSON, no markdown:
{"actions":[{"ticker":"<ticker>","action":"<Reduce|Increase|Hold|Exit>","currentPct":<number>,"targetPct":<number>,"reason":"<1 sentence>"}],"summary":"<2 sentences overall rebalancing rationale>","urgency":"<Urgent|Moderate|Low>"}`);
      setRebalance(r);incRebCount();
    }catch(e){setErr("Rebalance error: "+e.message);}
    setLoadingReb(false);
  };

  const runDCA=async()=>{
    if(!cash||parseFloat(cash)<=0){setErr(lang==="es"?"Ingresa un monto válido primero.":"Enter a valid cash amount first.");return;}
    if(!canUseDCAFree()){
      setErr(lang==="es"
        ?`🔒 Usaste tus ${DCA_FREE_LIMIT} planes DCA gratis. Actualiza a Premium para planes ilimitados.`
        :`🔒 You've used your ${DCA_FREE_LIMIT} free DCA plans. Upgrade to Premium for unlimited.`);
      return;
    }
    setLoadingDCA(true);setErr("");setDca(null);
    const summary=positions.map(p=>{
      const w=totalValue>0?((p.currentValue||p.totalCostBasis)/totalValue*100).toFixed(1):0;
      return`${p.ticker}: ${w}% weight`;
    }).join(" | ");
    try{
      const r=await callAI(`You are a DCA investment advisor. Investor profile: ${profileLabel}.
Current portfolio: ${summary}. Available cash to invest: $${parseFloat(cash).toLocaleString()}.
Suggest how to distribute this cash via DCA. Respond ONLY with valid JSON, no markdown:
{"allocations":[{"ticker":"<ticker or new stock>","amount":<dollar amount>,"pct":<% of available cash>,"reason":"<1 sentence>","isNew":<true if new position, false if adding to existing>}],"summary":"<2 sentences explaining the DCA strategy>","totalDeployed":<number>}`);
      setDca(r);incDCACount();
    }catch(e){setErr("DCA error: "+e.message);}
    setLoadingDCA(false);
  };

  const actionColor=a=>a==="Reduce"||a==="Exit"?T.red:a==="Increase"?T.green:T.gold;

  return<Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.blue}33`}}>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.blue,marginBottom:6}}>⚖️ Rebalance & DCA Advisor</div>
    <div style={{fontSize:12,color:T.muted,marginBottom:18,lineHeight:1.7}}>
      Get AI recommendations to rebalance your portfolio to match your <strong style={{color:savedProfile?.color||T.gold}}>{profileLabel}</strong> profile, or distribute new cash strategically via Dollar Cost Averaging.
    </div>

    {err&&<div style={{padding:"8px 12px",background:`${T.red}15`,border:`1px solid ${T.red}33`,borderRadius:8,fontSize:12,color:T.red,marginBottom:12}}>{err}</div>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {/* Rebalance */}
      <div style={{background:T.accent,borderRadius:12,padding:16,border:`1px solid ${T.border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:6}}>🔄 Rebalance Portfolio</div>
        <div style={{fontSize:11,color:T.muted,marginBottom:14,lineHeight:1.6}}>
          AI will analyze your current weights and suggest which positions to reduce, increase, or exit to align with your <strong style={{color:T.text}}>{profileLabel}</strong> profile.
        </div>
        <button className="btn btn-gold" onClick={runRebalance} disabled={loadingReb} style={{width:"100%",padding:"11px 0",fontSize:13,borderRadius:9}}>
          {loadingReb
            ?<><span className="sp">⟳</span> {lang==="es"?"Analizando...":"Analyzing..."}</>
            :canUseRebFree()
              ?`🔄 ${lang==="es"?"Obtener Plan de Rebalanceo":"Get Rebalance Plan"} (${REB_FREE_LIMIT-getRebCount()} ${lang==="es"?"gratis":"free"})`
              :`🔒 ${lang==="es"?"Plan Rebalanceo — Premium":"Rebalance Plan — Premium"}`}
        </button>
        {rebalance&&<div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:T.muted}}>Urgency:</span>
            <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:(rebalance.urgency==="Urgente"||rebalance.urgency==="Urgent")?`${T.red}20`:rebalance.urgency==="Moderate"?`${T.gold}20`:`${T.green}20`,color:rebalance.urgency==="Urgent"?T.red:rebalance.urgency==="Moderate"?T.gold:T.green,fontWeight:600}}>{rebalance.urgency}</span>
          </div>
          <div style={{fontSize:11,color:T.muted,lineHeight:1.6,marginBottom:12}}>{rebalance.summary}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {rebalance.actions?.map(({ticker,action,currentPct,targetPct,reason})=>(
              <div key={ticker} style={{background:T.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${actionColor(action)}22`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <Mn sz={13} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,color:T.muted}}>{currentPct}% → {targetPct}%</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:`${actionColor(action)}18`,color:actionColor(action),fontWeight:600}}>{action}</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{reason}</div>
                {/* Visual weight change bar */}
                <div style={{marginTop:6,display:"flex",gap:4,alignItems:"center"}}>
                  <div style={{flex:currentPct,height:3,background:T.blue,borderRadius:2,maxWidth:"60%",transition:"flex 0.4s"}}/>
                  <span style={{fontSize:8,color:T.muted,flexShrink:0}}>→</span>
                  <div style={{flex:targetPct,height:3,background:actionColor(action),borderRadius:2,maxWidth:"60%",transition:"flex 0.4s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>}
      </div>

      {/* DCA */}
      <div style={{background:T.accent,borderRadius:12,padding:16,border:`1px solid ${T.border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.green,marginBottom:6}}>{lang==="es"?"💵 Asesor DCA — Invertir Cash":"💵 DCA "} — Deploy Cash</div>
        <div style={{fontSize:11,color:T.muted,marginBottom:10,lineHeight:1.6}}>
          Have new cash to invest? Tell the AI how much and it will distribute it optimally across your portfolio — adding to winners, averaging down on quality positions.
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1,background:T.card,borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={cash} onChange={e=>setCash(e.target.value)} placeholder="500" min={0} step={100}
              style={{border:"none",background:"none",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,outline:"none",width:"100%"}}/>
          </div>
          <span style={{fontSize:11,color:T.muted,alignSelf:"center",whiteSpace:"nowrap"}}>available</span>
        </div>
        <button className="btn btn-gold" onClick={runDCA} disabled={loadingDCA||!cash} style={{width:"100%",padding:"11px 0",fontSize:13,borderRadius:9,background:T.green,color:"#0a0c10"}}>
          {loadingDCA
            ?<><span className="sp">⟳</span> {lang==="es"?"Planificando...":"Planning..."}</>
            :canUseDCAFree()
              ?`💵 ${lang==="es"?"Obtener Plan DCA":"Get DCA Plan"} (${DCA_FREE_LIMIT-getDCACount()} ${lang==="es"?"gratis":"free"})`
              :`🔒 ${lang==="es"?"Plan DCA — Premium":"DCA Plan — Premium"}`}
        </button>
        {dca&&<div style={{marginTop:14}}>
          <div style={{fontSize:11,color:T.muted,lineHeight:1.6,marginBottom:12}}>{dca.summary}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {dca.allocations?.map(({ticker,amount,pct,reason,isNew})=>(
              <div key={ticker} style={{background:T.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${T.green}22`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Mn sz={13} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                    {isNew&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:`${T.purple}20`,color:T.purple,border:`1px solid ${T.purple}33`}}>NEW</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Mn sz={13} c={T.green} s={{fontWeight:700}}>${Math.round(amount).toLocaleString()}</Mn>
                    <span style={{fontSize:10,color:T.muted}}>{pct}%</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{reason}</div>
                <div style={{height:2,background:T.border,borderRadius:2,marginTop:6}}><div style={{height:"100%",width:`${pct}%`,background:T.green,borderRadius:2}}/></div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"8px 12px",background:`${T.green}10`,border:`1px solid ${T.green}22`,borderRadius:8,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:T.muted}}>Total to deploy</span>
            <Mn sz={13} c={T.green} s={{fontWeight:700}}>${Math.round(dca.totalDeployed||0).toLocaleString()}</Mn>
          </div>
        </div>}
      </div>
    </div>

    <div style={{marginTop:14,padding:"10px 14px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`,fontSize:10,color:T.muted,textAlign:"center"}}>
      ⚠️ AI suggestions are for educational purposes only. Always do your own research before investing.
    </div>
  </Card>;
}

// ── PORTFOLIO TRACKER ────────────────────────────────────────────────────────
const BROKERS=[
  {name:"Interactive Brokers",url:"https://www.interactivebrokers.com",desc:"Best for active investors · Low commissions",badge:"Most Popular"},
  {name:"eToro",url:"https://www.etoro.com",desc:"Great for beginners · Social trading",badge:"Beginner Friendly"},
  {name:"Tastytrade",url:"https://tastytrade.com",desc:"Best for options · Commission-free stocks",badge:""},
];

// ── PIE CHART ────────────────────────────────────────────────────────────────
function PieChart({data,stockCount,size=220}){
  if(!data||!data.length)return null;
  const cx=size/2,cy=size/2,r=size*0.38,ir=size*0.22;
  // Guard: filter out NaN pct
  const valid=data.filter(d=>d.pct>0&&isFinite(d.pct));
  if(!valid.length)return null;
  let angle=-Math.PI/2;
  const slices=valid.map(d=>{
    const sweep=Math.max((d.pct/100)*2*Math.PI,0.001);
    const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    angle+=sweep;
    const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
    const ix1=cx+ir*Math.cos(angle-sweep),iy1=cy+ir*Math.sin(angle-sweep);
    const ix2=cx+ir*Math.cos(angle),iy2=cy+ir*Math.sin(angle);
    const large=sweep>Math.PI?1:0;
    return{...d,path:`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${ir} ${ir} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`};
  });
  return<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity={0.9} stroke={T.bg} strokeWidth={1.5}>
      <title>{s.ticker}: {s.pct.toFixed(1)}%</title>
    </path>)}
    <text x={cx} y={cy-6} textAnchor="middle" fill={T.text} style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700}}>{stockCount||valid.length}</text>
    <text x={cx} y={cy+10} textAnchor="middle" fill={T.muted} style={{fontFamily:"'DM Sans',sans-serif",fontSize:9}}>stocks</text>
  </svg>;
}

function PortfolioTab({canAnalyze,onShowPaywall,onGoToProfile,lang="en",user=null}){
  const [paywallCtx,setPaywallCtx]=useState(null);
  // Read risk profile if user came from Risk Profile tab
  const savedProfile=(()=>{try{const p=localStorage.getItem("inversoria_risk_profile");return p?JSON.parse(p):null;}catch{return null;}})();
  const [positions,setPositions]=useState([]);
  const [form,setForm]=useState({ticker:"",shares:"",buyPrice:"",date:""});
  const [prices,setPrices]=useState({});
  const [loadingPrices,setLoadingPrices]=useState(false);
  const [aiAnalysis,setAiAnalysis]=useState(null);
  const [loadingAI,setLoadingAI]=useState(false);
  const [err,setErr]=useState("");
  const [showBrokers,setShowBrokers]=useState(false);
  const [importMode,setImportMode]=useState("manual"); // manual | paste | csv
  const [pasteText,setPasteText]=useState("");
  const [importErr,setImportErr]=useState("");
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));

  // Parse pasted text from Excel / Google Sheets
  // Accepts: TICKER  SHARES  BUY_PRICE  DATE(optional)
  const parsePaste=()=>{
    setImportErr("");
    const lines=pasteText.trim().split("\n").filter(l=>l.trim());
    const parsed=[];
    for(const line of lines){
      const cols=line.trim().split(/[\t,;]+/).map(c=>c.trim());
      if(cols.length<3){continue;}
      const ticker=cols[0].toUpperCase().replace(/[^A-Z]/g,"");
      const shares=parseFloat(cols[1].replace(/[$,]/g,""));
      const price=parseFloat(cols[2].replace(/[$,]/g,""));
      const date=cols[3]||new Date().toISOString().split("T")[0];
      if(!ticker||isNaN(shares)||isNaN(price)||shares<=0||price<=0){continue;}
      parsed.push({id:Date.now()+Math.random(),ticker,shares,buyPrice:price,date});
    }
    if(!parsed.length){setImportErr("Could not parse any rows. Check format: Ticker | Shares | Buy Price");return;}
    const updated=[...positions,...parsed];
    setPositions(updated);save(updated);
    setPasteText("");setImportMode("manual");
    setImportErr(`✅ Imported ${parsed.length} position${parsed.length>1?"s":""} successfully!`);
  };

  // Parse CSV file upload
  const parseCSV=(e)=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const lines=ev.target.result.trim().split("\n");
      const parsed=[];
      // Skip header row if first cell is not a ticker
      const startRow=isNaN(parseFloat(lines[0]?.split(",")[1]))?1:0;
      for(let i=startRow;i<lines.length;i++){
        const cols=lines[i].split(",").map(c=>c.replace(/"/g,"").trim());
        if(cols.length<3)continue;
        const ticker=cols[0].toUpperCase().replace(/[^A-Z]/g,"");
        const shares=parseFloat(cols[1].replace(/[$,]/g,""));
        const price=parseFloat(cols[2].replace(/[$,]/g,""));
        const date=cols[3]||new Date().toISOString().split("T")[0];
        if(!ticker||isNaN(shares)||isNaN(price)||shares<=0||price<=0)continue;
        parsed.push({id:Date.now()+Math.random(),ticker,shares,buyPrice:price,date});
      }
      if(!parsed.length){setImportErr("CSV format not recognized. Expected: Ticker, Shares, Buy Price, Date");return;}
      const updated=[...positions,...parsed];
      setPositions(updated);save(updated);
      setImportErr(`✅ Imported ${parsed.length} position${parsed.length>1?"s":""} from CSV!`);
      setImportMode("manual");
    };
    reader.readAsText(file);
  };

  // Load saved positions — cloud first, localStorage fallback
  useEffect(()=>{
    const load=async()=>{
      try{
        const saved=await cloudLoad("user_data","inversoria_portfolio",user?.id);
        if(saved&&Array.isArray(saved))setPositions(saved);
        else{
          const local=localStorage.getItem("inversoria_portfolio");
          if(local)setPositions(JSON.parse(local));
        }
      }catch(e){}
    };
    load();
  },[user?.id]);

  const save=(pos)=>{
    try{localStorage.setItem("inversoria_portfolio",JSON.stringify(pos));}catch(e){}
    cloudSave("user_data","inversoria_portfolio",pos,user?.id).catch(()=>{});
  };

  const FREE_POSITION_LIMIT=5;
  const [showPortfolioPaywall,setShowPortfolioPaywall]=useState(false);

  const addPosition=()=>{
    if(!form.ticker||!form.shares||!form.buyPrice){setErr("Fill in ticker, shares and buy price.");return;}
    const ticker=form.ticker.toUpperCase();
    // Count unique tickers already in portfolio
    const existingTickers=new Set(positions.map(p=>p.ticker));
    const isNew=!existingTickers.has(ticker);
    if(isNew&&existingTickers.size>=FREE_POSITION_LIMIT&&!isAdmin()){
      setShowPortfolioPaywall(true);return;
    }
    const newPos={id:Date.now(),ticker,shares:parseFloat(form.shares),buyPrice:parseFloat(form.buyPrice),date:form.date||new Date().toISOString().split("T")[0]};
    const updated=[...positions,newPos];
    setPositions(updated);save(updated);
    setForm({ticker:"",shares:"",buyPrice:"",date:""});setErr("");
  };

  const removePosition=(id)=>{
    const updated=positions.filter(p=>p.id!==id);
    setPositions(updated);save(updated);
  };

  // Fetch live prices from Finnhub — sequential with delay to avoid rate limits
  const fetchPrices=async()=>{
    if(!positions.length)return;
    setLoadingPrices(true);
    const key=import.meta.env.VITE_FINNHUB_KEY;
    const results={};
    const tickers=[...new Set(positions.map(p=>p.ticker))];
    for(const ticker of tickers){
      try{
        await new Promise(r=>setTimeout(r,250)); // 250ms between calls
        const res=await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`);
        const d=await res.json();
        if(d.c)results[ticker]={price:d.c,change:d.d,changePct:d.dp,high:d.h,low:d.l};
      }catch(e){}
    }
    setPrices(results);setLoadingPrices(false);
  };

  // AI portfolio analysis — premium only
  const analyzePortfolio=async()=>{
    if(!positions.length){setErr("Add at least one position first.");return;}
    if(!isAdmin()){onShowPaywall("portfolio");return;}
    // Group for summary (use grouped tickers)
    const grp=Object.values(positions.reduce((acc,p)=>{
      if(!acc[p.ticker]){acc[p.ticker]={ticker:p.ticker,totalShares:0,totalCost:0};}
      acc[p.ticker].totalShares+=p.shares;
      acc[p.ticker].totalCost+=p.shares*p.buyPrice;
      return acc;
    },{})).map(g=>({...g,avgCost:g.totalCost/g.totalShares}));
    setLoadingAI(true);setErr("");setAiAnalysis(null);
    const summary=grp.map(p=>{
      const lp=prices[p.ticker];
      const current=lp?lp.price:p.avgCost;
      const pnl=((current-p.avgCost)/p.avgCost*100).toFixed(1);
      return`${p.ticker}: ${p.totalShares.toFixed(3)} shares @ avg $${p.avgCost.toFixed(2)}, current ~$${current.toFixed(2)}, P&L ${pnl}%`;
    }).join(" | ");
    try{
      const profileCtx=savedProfile?`Risk Profile: ${typeof savedProfile.label==="object"?savedProfile.label.en:savedProfile.label}. ${typeof savedProfile.desc==="object"?savedProfile.desc.en:savedProfile.desc}`:"No risk profile.";
      // Use higher token limit for large portfolios
      const portfolioRes=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,messages:[{role:"user",content:`You are a Buffett/Munger portfolio analyst. Analyze this investor's portfolio:
${summary}
Total positions: ${positions.length}
Investor Risk Profile: ${profileCtx}
Provide a concise but actionable analysis. If a risk profile is available, explicitly state if the portfolio matches it or not, and which positions are misaligned. Respond ONLY with valid JSON, no markdown:
{
  "overallScore":"<A+|A|B+|B|C|D>",
  "overallGrade":"<Elite Compounder|High Quality|Good|Needs Work|Risky>",
  "summary":"<3-4 sentences: overall assessment AND whether portfolio matches investor risk profile>",
  "profileMatch":"<Perfect Match|Good Match|Partial Mismatch|Significant Mismatch|No Profile Data>",
  "profileMatchReason":"<1-2 sentences explaining why it matches or doesn't>",
  "concentration":"<Concentrated|Balanced|Over-Diversified>",
  "topSector":"<dominant sector>",
  "positions":[
    {"ticker":"<ticker>","verdict":"<Hold|Buy More|Consider Selling|Watch>","reason":"<1 sentence>","buffettScore":"<A+|A|B+|B|C|D>","profileFit":"<Fits Profile|Neutral|Doesn't Fit Profile>"}
  ],
  "suggestions":["<actionable suggestion 1>","<actionable suggestion 2>","<actionable suggestion 3>"],
  "risk":"<Low|Moderate|High>",
  "vsMarket":"<Likely to Outperform|In Line|Likely to Underperform>"
`}]})
      });
      const portfolioData=await portfolioRes.json();
      if(portfolioData.error)throw new Error(portfolioData.error.message);
      const raw=portfolioData.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
      const p=JSON.parse(raw);
      setAiAnalysis(p);
    }catch(e){setErr(`Analysis error: ${e.message||"Could not analyze. Try again."}`);setAiAnalysis(null);}
    setLoadingAI(false);
  };

  // ── FIX 2: Group positions by ticker — avg cost basis ──
  const FREE_PORTFOLIO_LIMIT=5;
  const grouped=Object.values(
    positions.reduce((acc,p)=>{
      if(!acc[p.ticker]){acc[p.ticker]={ticker:p.ticker,totalShares:0,totalCostBasis:0,entries:[]};}
      acc[p.ticker].totalShares+=p.shares;
      acc[p.ticker].totalCostBasis+=p.shares*p.buyPrice;
      acc[p.ticker].entries.push(p);
      return acc;
    },{})
  ).map(g=>({...g,avgCost:g.totalCostBasis/g.totalShares}));

  // Enrich with live prices
  const enriched=grouped.map(g=>{
    const lp=prices[g.ticker];
    const currentPrice=lp?lp.price:null;
    const currentValue=currentPrice?g.totalShares*currentPrice:null;
    const pnlDollar=currentValue?currentValue-g.totalCostBasis:null;
    const pnlPct=pnlDollar?((pnlDollar/g.totalCostBasis)*100):null;
    return{...g,currentPrice,currentValue,pnlDollar,pnlPct,change:lp?.change,changePct:lp?.changePct};
  });

  const totalCost=enriched.reduce((a,p)=>a+p.totalCostBasis,0);
  const totalValue=enriched.reduce((a,p)=>a+(p.currentValue||p.totalCostBasis),0);
  const totalPnL=totalValue-totalCost;
  const totalPnLPct=totalCost>0?(totalPnL/totalCost*100):0;
  const verdictColor=v=>v==="Hold"||v==="Buy More"||v==="Comprar Más"?T.green:v==="Watch"||v==="Ver"?T.gold:v==="Consider Selling"||v==="Considerar Venta"?T.red:T.muted;

  // ── PIE CHART data ──
  const PIE_COLORS=["#c9a84c","#2ecc71","#4a9eff","#a855f7","#e74c3c","#f39c12","#1abc9c","#e67e22","#3498db","#9b59b6","#e91e63","#00bcd4"];
  const pieData=totalValue>0?enriched.map((p,i)=>{
    const val=p.currentValue||p.totalCostBasis;
    const pct=totalValue>0?(val/totalValue*100):0;
    return{ticker:p.ticker,value:val,pct,color:PIE_COLORS[i%PIE_COLORS.length]};
  }).filter(d=>d.pct>0).sort((a,b)=>b.value-a.value):[];



  // AI Analysis paywall wrapper
  const handleAIAnalysis=()=>{
    const uniqueTickers=new Set(positions.map(p=>p.ticker)).size;
    if(uniqueTickers>FREE_POSITION_LIMIT&&!isAdmin()){setShowPortfolioPaywall(true);return;}
    analyzePortfolio();
  };

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Portfolio paywall modal */}
    {showPortfolioPaywall&&<PaywallModal context="portfolio" onClose={()=>setShowPortfolioPaywall(false)}/>}

    {/* Free plan banner */}
    {!isAdmin()&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",background:`${T.gold}08`,border:`1px solid ${T.goldDim}33`,borderRadius:8}}>
      <span style={{fontSize:11,color:T.muted}}>
        📁 Free plan: <span style={{color:T.gold,fontWeight:600}}>{Math.min(new Set(positions.map(p=>p.ticker)).size,FREE_POSITION_LIMIT)}/{FREE_POSITION_LIMIT} stocks</span> tracked · AI Analysis included for up to {FREE_POSITION_LIMIT} stocks
      </span>
      <button className="seg" onClick={()=>setShowPortfolioPaywall(true)} style={{color:T.gold,borderColor:T.goldDim,fontSize:10}}>🚀 Upgrade</button>
    </div>}

    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.gold}}>📁 {lang==="es"?"Mi Portafolio":"My Portfolio"}</div>
        <div style={{fontSize:12,color:T.muted,marginTop:3}}>{lang==="es"?"Sigue tus posiciones · Precios en vivo · Análisis IA":"Track your positions · Precios en vivo · Análisis IA"}</div>
      </div>
      {/* CTA: build a portfolio from risk profile */}
      {!savedProfile&&<button onClick={()=>onGoToProfile&&onGoToProfile()}
        style={{background:`${T.purple}15`,border:`1px solid ${T.purple}44`,borderRadius:10,padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>🧬</span>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:12,color:T.purple,fontWeight:600}}>{lang==="es"?"¿No sabes qué comprar?":"Don't know what to buy?"}</div>
          <div style={{fontSize:10,color:T.muted}}>Take the Risk Profile quiz → get an AI portfolio</div>
        </div>
        <span style={{fontSize:11,color:T.purple}}>→</span>
      </button>}
      {savedProfile&&<div style={{background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:14}}>{savedProfile.icon}</span>
        <div>
          <div style={{fontSize:11,color:T.green,fontWeight:600}}>{typeof savedProfile.label==="object"?savedProfile.label.en:savedProfile.label} Investor Profile active</div>
          <div style={{fontSize:10,color:T.muted}}>AI analysis will match your portfolio to your profile</div>
        </div>
      </div>}
      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-outline" onClick={fetchPrices} disabled={loadingPrices||!positions.length} style={{fontSize:12,padding:"8px 16px"}}>
          {loadingPrices?<><span className="sp">⟳</span> Actualizando...</>:<>{lang==="es"?"🔄 Actualizar Precios":"🔄 Refresh Prices"}</>}
        </button>
        <button className="btn btn-gold" onClick={handleAIAnalysis} disabled={loadingAI||!positions.length} style={{fontSize:12,padding:"8px 16px"}}>
          {loadingAI?<><span className="sp">⟳</span> Analizando...</>:<>{lang==="es"?"🤖 Análisis IA":"🤖 AI Analysis"}</>}
        </button>
      </div>
    </div>

    {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}

    {/* Market Cycle Banner */}
    <MarketCycleBanner portfolioTickers={[...new Set(positions.map(p=>p.ticker))]} lang={lang} canAnalyze={canAnalyze}/>

    {/* KPI Cards */}
    {positions.length>0&&<div className="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      {[
        {l:lang==="es"?"Total Invertido":"Total Invested",v:fmt(totalCost),c:T.blue,icon:"💵"},
        {l:lang==="es"?"Valor Actual":"Current Value",v:fmt(totalValue),c:T.gold,icon:"📊"},
        {l:lang==="es"?"P&G Total":"Total P&L",v:`${totalPnL>=0?"+":""}${fmt(Math.abs(totalPnL))}`,c:totalPnL>=0?T.green:T.red,icon:"📈"},
        {l:lang==="es"?"Retorno Total":"Total Return",v:`${totalPnLPct>=0?"+":""}${totalPnLPct.toFixed(2)}%`,c:totalPnLPct>=0?T.green:T.red,icon:"🎯"},
      ].map(({l,v,c,icon})=><Card key={l} s={{padding:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,fontSize:22,opacity:0.12}}>{icon}</div>
        <Lbl>{l}</Lbl>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700,wordBreak:"break-all"}}>{v}</div>
      </Card>)}
    </div>}

    <div className="portfolio-grid compound-layout" style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:18,alignItems:"start"}}>

      {/* Add Position Form */}
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:14}}>➕ Add Position</div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[
            {id:"manual",l:"✏️ Manual"},
            {id:"paste",l:lang==="es"?"📋 Pegar de Excel":"📋 Paste from Excel"},
            {id:"csv",l:lang==="es"?"📂 Importar CSV":"📂 Import CSV"},
          ].map(({id,l})=>(
            <button key={id} className={`seg ${importMode===id?"seg-on":""}`} onClick={()=>{setImportMode(id);setImportErr("");}}>
              {l}
            </button>
          ))}
        </div>

        {importErr&&<div style={{padding:"8px 12px",borderRadius:8,fontSize:12,marginBottom:12,
          background:importErr.startsWith("✅")?`${T.green}15`:`${T.red}15`,
          color:importErr.startsWith("✅")?T.green:T.red,
          border:`1px solid ${importErr.startsWith("✅")?T.green:T.red}33`}}>{importErr}</div>}

        {/* MANUAL */}
        {importMode==="manual"&&<>
          <Lbl>Ticker</Lbl>
          <input type="text" value={form.ticker} onChange={e=>setF("ticker",e.target.value.toUpperCase())}
            placeholder="NVDA, AAPL, MSFT..." onKeyDown={e=>e.key==="Enter"&&addPosition()}
            style={{marginBottom:12,fontWeight:700,fontSize:15,letterSpacing:"0.05em"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <Lbl>Shares</Lbl>
              <input type="number" value={form.shares} onChange={e=>setF("shares",e.target.value)} placeholder="10" min={0} step={0.001}/>
            </div>
            <div>
              <Lbl>Buy Price ($)</Lbl>
              <input type="number" value={form.buyPrice} onChange={e=>setF("buyPrice",e.target.value)} placeholder="150.00" min={0} step={0.01}/>
            </div>
          </div>
          <Lbl>Date Purchased (optional)</Lbl>
          <input type="date" value={form.date} onChange={e=>setF("date",e.target.value)} style={{marginBottom:16}}/>
          <button className="btn btn-gold" onClick={addPosition} style={{width:"100%",padding:"12px 0",fontSize:14,borderRadius:10}}>
            ➕ Add to Portfolio
          </button>
        </>}

        {/* PASTE FROM EXCEL / GOOGLE SHEETS */}
        {importMode==="paste"&&<>
          <div style={{padding:12,background:`${T.blue}10`,borderRadius:8,border:`1px solid ${T.blue}22`,marginBottom:12}}>
            <div style={{fontSize:11,color:T.blue,fontWeight:600,marginBottom:6}}>📋 How to paste from Excel or Google Sheets:</div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
              1. Your spreadsheet must have columns in this order:<br/>
              <span style={{fontFamily:"'DM Mono',monospace",color:T.text,background:T.accent,padding:"2px 8px",borderRadius:4}}>
                Ticker | Shares | Buy Price | Date (optional)
              </span><br/>
              2. Select your rows (without the header)<br/>
              3. Copy (Ctrl+C) and paste below (Ctrl+V)
            </div>
            <div style={{marginTop:8,padding:"6px 10px",background:T.accent,borderRadius:6,fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>
              Example:<br/>
              NVDA{"  "}10{"  "}450.00{"  "}2024-01-15<br/>
              AAPL{"  "}25{"  "}185.50<br/>
              MSFT{"  "}5{"  "}380.00
            </div>
          </div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"Paste your rows here...\nNVDA\t10\t450.00\nAAPL\t25\t185.50"}
            style={{width:"100%",minHeight:140,background:T.accent,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:12,fontFamily:"'DM Mono',monospace",fontSize:12,outline:"none",resize:"vertical",marginBottom:12,lineHeight:1.6}}/>
          <button className="btn btn-gold" onClick={parsePaste} disabled={!pasteText.trim()} style={{width:"100%",padding:"12px 0",fontSize:14,borderRadius:10}}>
            📋 Import Pasted Data
          </button>
        </>}

        {/* CSV UPLOAD */}
        {importMode==="csv"&&<>
          <div style={{padding:12,background:`${T.gold}08`,borderRadius:8,border:`1px solid ${T.goldDim}33`,marginBottom:12}}>
            <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:6}}>📂 CSV File Format:</div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
              Your CSV must have columns: <span style={{fontFamily:"'DM Mono',monospace",color:T.text}}>Ticker, Shares, Buy Price, Date</span><br/>
              Works with exports from: <span style={{color:T.text}}>Interactive Brokers, TD Ameritrade, Robinhood, Fidelity, Schwab</span><br/>
              Header row is detected and skipped automatically.
            </div>
            <div style={{marginTop:8,padding:"6px 10px",background:T.accent,borderRadius:6,fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>
              Ticker,Shares,Buy Price,Date<br/>
              NVDA,10,450.00,2024-01-15<br/>
              AAPL,25,185.50,2024-03-20
            </div>
          </div>
          <label style={{display:"block",cursor:"pointer"}}>
            <div style={{border:`2px dashed ${T.goldDim}`,borderRadius:10,padding:"28px 20px",textAlign:"center",background:`${T.gold}05`,marginBottom:12}}>
              <div style={{fontSize:28,marginBottom:8}}>📂</div>
              <div style={{fontSize:13,color:T.gold,marginBottom:4}}>Click to select your CSV file</div>
              <div style={{fontSize:11,color:T.muted}}>or drag and drop here</div>
            </div>
            <input type="file" accept=".csv,.txt" onChange={parseCSV} style={{display:"none"}}/>
          </label>
          <div style={{fontSize:11,color:T.muted,textAlign:"center"}}>Supported: .csv and .txt files from any broker</div>
        </>}

        <div style={{marginTop:12,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.7}}>
          💾 Positions save automatically. Click <span style={{color:T.gold}}>{lang==="es"?"Actualizar Precios":"Refresh Prices"}</span> for live data.
        </div>
      </Card>

      {/* Positions Table + Pie Chart */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {positions.length===0
          ?<Card s={{textAlign:"center",padding:48,background:`${T.gold}06`,border:`1px dashed ${T.goldDim}44`}}>
            <div style={{fontSize:36,marginBottom:12}}>📁</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.gold,marginBottom:8}}>Your portfolio is empty</div>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>Add your first position using the form on the left.<br/>Then hit <strong style={{color:T.gold}}>Refresh Prices</strong> for live data and <strong style={{color:T.gold}}>AI Analysis</strong> for a Buffett/Munger assessment.</div>
          </Card>
          :<>
            {/* ── PREMIUM OVERLAY if >3 positions and not admin ── */}
            {grouped.length>3&&!isAdmin()&&<div style={{padding:"16px 20px",background:`${T.gold}10`,border:`2px solid ${T.goldDim}55`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:4}}>🔒 Premium Feature — {grouped.length} stocks detected</div>
                <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>Free plan shows up to 3 stocks. Upgrade to track unlimited positions, get AI Analysis, Rebalance suggestions and DCA recommendations.</div>
              </div>
              <button className="btn btn-gold" onClick={()=>onShowPaywall("portfolio")} style={{fontSize:13,padding:"11px 22px",borderRadius:10,flexShrink:0}}>🚀 Upgrade to Premium</button>
            </div>}
            {/* ── PIE CHART ── */}
            <Card s={{padding:18}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🥧 Portfolio Allocation</div>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:24,alignItems:"center"}}>
                <PieChart data={pieData} stockCount={enriched.length} size={200}/>
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {pieData.map(({ticker,pct,color,value})=>(
                      <div key={ticker} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:T.accent,borderRadius:8}}>
                        <div style={{width:10,height:10,borderRadius:2,background:color,flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <Mn sz={12} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                            <Mn sz={12} c={color} s={{fontWeight:700}}>{pct.toFixed(1)}%</Mn>
                          </div>
                          <div style={{fontSize:9,color:T.muted}}>${(value).toLocaleString("en-US",{maximumFractionDigits:0})}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {grouped.length>FREE_PORTFOLIO_LIMIT&&!isAdmin()&&<div style={{marginTop:10,padding:"8px 12px",background:`${T.gold}10`,border:`1px solid ${T.goldDim}44`,borderRadius:8,fontSize:11,color:T.gold}}>
                    🔒 AI analysis limited to {FREE_PORTFOLIO_LIMIT} stocks on free plan. Upgrade for unlimited.
                  </div>}
                </div>
              </div>
            </Card>

            {/* ── TABLE (grouped by ticker) ── */}
            <Card s={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>{grouped.length} Stock{grouped.length!==1?"s":""} · {positions.length} Entr{positions.length!==1?"ies":"y"}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>Multiple buys of the same stock are grouped with average cost basis</div>
                </div>
                {!prices[positions[0]?.ticker]&&<div style={{fontSize:11,color:T.muted}}>⚡ Click "Refresh Prices" for live data</div>}
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:750}}>
                  <thead><tr style={{background:T.accent,borderBottom:`1px solid ${T.border}`}}>
                    {["","Ticker",lang==="es"?"Acciones":"Shares",lang==="es"?"Costo Prom.":"Avg Cost",lang==="es"?"Precio Actual":"Current Price",lang==="es"?"Costo Total":"Total Cost",lang==="es"?"Valor Actual":"Current Value","P&L $","P&L %",lang==="es"?"Hoy":"Today",lang==="es"?"Veredicto IA":"AI Verdict",""].map((h,i)=>(
                      <th key={i} style={{padding:"10px 12px",textAlign:i<=1||i===11?"center":"right",fontSize:9,color:h==="P&L $"||h==="P&L %"?T.green:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {enriched.map((p,idx)=>{
                      const verdict=aiAnalysis?.positions?.find(x=>x.ticker===p.ticker);
                      const pc=pieData.find(x=>x.ticker===p.ticker);
                      return<tr key={p.ticker} style={{borderBottom:`1px solid ${T.border}22`}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.accent}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {/* Color dot */}
                        <td style={{padding:"10px 8px",textAlign:"center"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:pc?.color||T.muted,margin:"0 auto"}}/>
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontWeight:700,fontSize:14,color:T.text,fontFamily:"'DM Mono',monospace"}}>{p.ticker}</div>
                          {p.entries?.length>1&&<div style={{fontSize:9,color:T.muted}}>{p.entries.length} buys</div>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={12}>{p.totalShares.toFixed(3)}</Mn></td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={12} c={T.muted}>${p.avgCost.toFixed(2)}</Mn></td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.currentPrice?<Mn sz={13} c={T.gold} s={{fontWeight:700}}>${p.currentPrice.toFixed(2)}</Mn>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={12} c={T.blue}>${p.totalCostBasis.toLocaleString("en-US",{maximumFractionDigits:0})}</Mn></td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.currentValue?<Mn sz={12} c={T.gold}>${p.currentValue.toLocaleString("en-US",{maximumFractionDigits:0})}</Mn>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.pnlDollar!=null?<Mn sz={13} c={p.pnlDollar>=0?T.green:T.red} s={{fontWeight:600}}>{p.pnlDollar>=0?"+":""}${Math.abs(p.pnlDollar).toLocaleString("en-US",{maximumFractionDigits:0})}</Mn>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.pnlPct!=null?<span style={{fontSize:12,padding:"2px 8px",borderRadius:20,background:p.pnlPct>=0?`${T.green}18`:`${T.red}18`,color:p.pnlPct>=0?T.green:T.red,fontWeight:600}}>{p.pnlPct>=0?"+":""}{p.pnlPct.toFixed(2)}%</span>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.changePct!=null?<span style={{fontSize:11,color:p.changePct>=0?T.green:T.red}}>{p.changePct>=0?"+":""}{p.changePct.toFixed(2)}%</span>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {verdict?<span style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:`${verdictColor(verdict.verdict)}18`,color:verdictColor(verdict.verdict),border:`1px solid ${verdictColor(verdict.verdict)}33`,fontWeight:600,whiteSpace:"nowrap"}}>{verdict.verdict}</span>:<span style={{fontSize:11,color:T.muted}}>{lang==="es"?"Analizar":"Run AI"}</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"center"}}>
                          <button onClick={()=>{const updated=positions.filter(pos=>pos.ticker!==p.ticker);setPositions(updated);save(updated);}}
                            style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14,padding:"2px 6px"}}
                            onMouseEnter={e=>e.currentTarget.style.color=T.red}
                            onMouseLeave={e=>e.currentTarget.style.color=T.muted}
                            title="Remove all entries for this ticker">✕</button>
                        </td>
                      </tr>;
                    })}
                  </tbody>
                  <tfoot><tr style={{borderTop:`2px solid ${T.border}`,background:T.accent}}>
                    <td colSpan={2} style={{padding:"12px",textAlign:"center"}}><Mn sz={11} c={T.gold}>TOTAL</Mn></td>
                    <td colSpan={3}/>
                    <td style={{padding:"12px",textAlign:"right"}}><Mn sz={13} c={T.blue} s={{fontWeight:700}}>${totalCost.toLocaleString("en-US",{maximumFractionDigits:0})}</Mn></td>
                    <td style={{padding:"12px",textAlign:"right"}}><Mn sz={13} c={T.gold} s={{fontWeight:700}}>${totalValue.toLocaleString("en-US",{maximumFractionDigits:0})}</Mn></td>
                    <td style={{padding:"12px",textAlign:"right"}}><Mn sz={13} c={totalPnL>=0?T.green:T.red} s={{fontWeight:700}}>{totalPnL>=0?"+":""}${Math.abs(totalPnL).toLocaleString("en-US",{maximumFractionDigits:0})}</Mn></td>
                    <td style={{padding:"12px",textAlign:"right"}}><span style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:totalPnLPct>=0?`${T.green}18`:`${T.red}18`,color:totalPnLPct>=0?T.green:T.red,fontWeight:700}}>{totalPnLPct>=0?"+":""}{totalPnLPct.toFixed(2)}%</span></td>
                    <td colSpan={3}/>
                  </tr></tfoot>
                </table>
              </div>
            </Card>
          </>}

        {/* AI Analysis result */}
        {aiAnalysis&&<Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.goldDim}44`}}>
          {/* Profile Match Banner */}
          {savedProfile&&aiAnalysis?.profileMatch&&aiAnalysis.profileMatch!=="No Profile Data"&&<div style={{
            padding:"12px 16px",borderRadius:10,marginBottom:14,
            background:(aiAnalysis.profileMatch||"").includes("Perfect")||(aiAnalysis.profileMatch||"").includes("Good")?`${T.green}12`:`${T.red}12`,
            border:`1px solid ${(aiAnalysis.profileMatch||"").includes("Perfect")||(aiAnalysis.profileMatch||"").includes("Good")?T.green:T.red}33`,
            display:"flex",alignItems:"flex-start",gap:10
          }}>
            <span style={{fontSize:18,flexShrink:0}}>{savedProfile.icon}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:(aiAnalysis.profileMatch||"").includes("Perfect")||(aiAnalysis.profileMatch||"").includes("Good")?T.green:T.red,marginBottom:3}}>
                {aiAnalysis.profileMatch} — {typeof savedProfile.label==="object"?savedProfile.label[lang||"en"]||savedProfile.label.en:savedProfile.label} Investor Profile
              </div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{aiAnalysis.profileMatchReason}</div>
            </div>
          </div>}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{textAlign:"center",minWidth:90}}>
              <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Portfolio Score</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,color:aiAnalysis.overallScore?.includes("A")?T.green:aiAnalysis.overallScore?.includes("B")?T.gold:T.red,fontWeight:700}}>{aiAnalysis.overallScore}</div>
              <div style={{fontSize:10,color:T.muted}}>{aiAnalysis.overallGrade}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{lang==="es"?"🤖 Evaluación IA":"🤖 AI Assessment"}</div>
              <div style={{fontSize:13,color:T.text,lineHeight:1.7,marginBottom:10}}>{aiAnalysis.summary}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[
                  {l:"Risk",v:aiAnalysis.risk,c:(aiAnalysis.risk==="Low"||aiAnalysis.risk==="Bajo")?T.green:aiAnalysis.risk==="High"?T.red:T.gold},
                  {l:"Concentration",v:aiAnalysis.concentration,c:T.blue},
                  {l:"vs S&P 500",v:aiAnalysis.vsMarket||"—",c:(aiAnalysis.vsMarket||"").includes("Out")?T.green:(aiAnalysis.vsMarket||"").includes("Under")?T.red:T.gold},
                  {l:"Top Sector",v:aiAnalysis.topSector,c:T.purple},
                  ...(savedProfile&&aiAnalysis.profileMatch?[{l:"Profile Match",v:aiAnalysis.profileMatch,c:(aiAnalysis.profileMatch||"").includes("Perfect")||(aiAnalysis.profileMatch||"").includes("Good")?T.green:T.red}]:[]),
                ].map(({l,v,c})=><div key={l} style={{background:T.card,borderRadius:8,padding:"6px 12px"}}>
                  <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <Mn sz={12} c={c} s={{fontWeight:600}}>{v}</Mn>
                </div>)}
              </div>
            </div>
          </div>

          {/* Per-position verdicts */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
            {aiAnalysis.positions?.map(({ticker,verdict,reason,buffettScore})=>(
              <div key={ticker} style={{background:T.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${verdictColor(verdict)}22`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <Mn sz={14} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:10,color:T.muted}}>Score: <span style={{color:T.gold,fontWeight:700}}>{buffettScore}</span></span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:`${verdictColor(verdict)}18`,color:verdictColor(verdict),fontWeight:600}}>{verdict}</span>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{reason}</div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div style={{padding:14,background:T.accent,borderRadius:10,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:8}}>💡 AI Suggestions</div>
            {aiAnalysis.suggestions?.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:T.muted,lineHeight:1.5}}>
                <span style={{color:T.gold,flexShrink:0}}>{i+1}.</span>{s}
              </div>
            ))}
          </div>
        </Card>}

        {/* ── REBALANCE + DCA ── */}
        {aiAnalysis&&<RebalanceDCA positions={enriched} totalValue={totalValue} savedProfile={savedProfile} callAI={callAI} lang={lang}/>}
      </div>
    </div>

    <AdBanner size="leaderboard"/>

    {/* Disclaimer */}
    <Card s={{background:`${T.red}08`,border:`1px solid ${T.red}22`,padding:12}}>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.8}}>
        ⚠️ <span style={{color:T.gold}}>Disclaimer:</span> Portfolio analysis is for educational purposes only. Not financial advice. Always consult a licensed financial advisor.
      </div>
    </Card>
  </div>;
}

// ── MY STRATEGY TAB ──────────────────────────────────────────────────────────
function StrategyTab({onGoToProfile,onGoToPortfolio,lang="en",user=null}){
  const [strategy,setStrategy]=useState(null);
  const [positions,setPositions]=useState([]);
  const [prices,setPrices]=useState({});
  const [loadingPrices,setLoadingPrices]=useState(false);

  // Load saved data
  useState(()=>{
    try{
      const s=localStorage.getItem("inversoria_strategy");
      if(s)setStrategy(JSON.parse(s));
      const p=localStorage.getItem("inversoria_portfolio");
      if(p)setPositions(JSON.parse(p));
    }catch(e){}
  });

  // Fetch live prices for strategy tickers
  const fetchPrices=async(tickers)=>{
    if(!tickers?.length)return;
    setLoadingPrices(true);
    const key=import.meta.env.VITE_FINNHUB_KEY;
    const results={};
    for(const ticker of tickers){
      try{
        await new Promise(r=>setTimeout(r,250));
        const res=await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`);
        const d=await res.json();
        if(d.c)results[ticker]={price:d.c,changePct:d.dp};
      }catch(e){}
    }
    setPrices(results);setLoadingPrices(false);
  };

  const clearStrategy=()=>{
    if(window.confirm("Clear your saved strategy?")){
      try{localStorage.removeItem("inversoria_strategy");}catch(e){}
      setStrategy(null);
    }
  };

  // ── NO STRATEGY SAVED ──
  if(!strategy)return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{textAlign:"center",padding:"60px 28px",background:`linear-gradient(135deg,${T.card},${T.accent})`,borderRadius:16,border:`1px solid ${T.goldDim}44`}}>
      <div style={{fontSize:56,marginBottom:16}}>📈</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.gold,marginBottom:10,fontWeight:700}}>{lang==="es"?"Aún no tienes una estrategia guardada":"No strategy saved yet"}</div>
      <div style={{fontSize:13,color:T.muted,maxWidth:520,margin:"0 auto 32px",lineHeight:1.8}}>
        {lang==="es"?"Crea tu Perfil de Riesgo, genera un portafolio IA y haz clic en ":"Create your Risk Profile, generate an AI portfolio, then click "}<strong style={{color:T.green}}>{lang==="es"?"✅ Sí — Seguir Mi Estrategia":"✅ Yes — Track My Strategy"}</strong>{lang==="es"?" para empezar a rastrear tu plan aquí.":" to start tracking your plan vs reality here."}
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold" onClick={onGoToProfile} style={{fontSize:14,padding:"13px 28px",borderRadius:10}}>
          🧬 Create My Risk Profile →
        </button>
        {positions.length>0&&<button className="btn btn-outline" onClick={onGoToPortfolio} style={{padding:"13px 20px",borderRadius:10}}>
          📁 I already have a portfolio
        </button>}
      </div>
    </div>
  </div>;

  // ── STRATEGY EXISTS ──
  const {profile,amount,portfolio,createdAt,executedAt}=strategy;
  const allTickers=[...(portfolio.stocks||[]).map(s=>s.ticker),...(portfolio.etfs||[]).map(e=>e.ticker)];
  const daysSince=Math.floor((Date.now()-new Date(executedAt).getTime())/(1000*60*60*24));

  // Build portfolio map from My Portfolio data
  const portfolioMap={};
  positions.forEach(p=>{
    if(!portfolioMap[p.ticker]){portfolioMap[p.ticker]={shares:0,avgCost:0,totalCost:0};}
    portfolioMap[p.ticker].shares+=p.shares;
    portfolioMap[p.ticker].totalCost+=p.shares*p.buyPrice;
  });
  Object.keys(portfolioMap).forEach(t=>{
    portfolioMap[t].avgCost=portfolioMap[t].totalCost/portfolioMap[t].shares;
  });

  const totalPortfolioValue=Object.entries(portfolioMap).reduce((a,[t,p])=>{
    const lp=prices[t];
    return a+(lp?p.shares*lp.price:p.totalCost);
  },0)||amount;

  // Execution status per recommended position
  const statusColor=s=>(s.includes("Ejecutado")||s.includes("Executed"))?T.green:(s.includes("Parcial")||s.includes("Partial"))?T.gold:T.red;

  const allPositions=[
    ...(portfolio.stocks||[]).map(p=>({...p,isETF:false})),
    ...(portfolio.etfs||[]).map(p=>({...p,isETF:true,type:"ETF"})),
  ];

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Strategy header */}
    <div style={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`2px solid ${profile.color}44`,borderRadius:16,padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:44}}>{profile.icon}</div>
          <div>
            <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Active Strategy</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:profile.color,fontWeight:700}}>{pLabel(profile,lang)} Investor Portfolio</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>
              Started {new Date(executedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} · {daysSince} days ago · ${amount.toLocaleString()} initial amount
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {loadingPrices
            ?<span style={{fontSize:11,color:T.muted}}><span className="sp">⟳</span> Loading prices...</span>
            :<button className="seg" onClick={()=>fetchPrices(allTickers)} style={{fontSize:11}}>🔄 Refresh Prices</button>}
          <button className="seg" onClick={clearStrategy} style={{fontSize:11,color:T.red}}>🗑 Clear</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:20}}>
        {[
          {l:lang==="es"?"Posiciones Recomendadas":"Recommended Positions",v:allPositions.length,c:T.gold,icon:"📋"},
          {l:lang==="es"?"Posiciones Ejecutadas":"Positions Executed",v:Object.keys(portfolioMap).filter(t=>allTickers.includes(t)).length,c:T.green,icon:"✅"},
          {l:lang==="es"?"Días Siguiendo":"Days Tracking",v:daysSince,c:T.blue,icon:"📅"},
          {l:"Expected Return",v:portfolio.expectedReturn||"—",c:T.green,icon:"📈"},
        ].map(({l,v,c,icon})=><div key={l} style={{background:T.card,borderRadius:10,padding:"12px 14px",textAlign:"center",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:c,fontWeight:700}}>{v}</div>
          <div style={{fontSize:10,color:T.muted,marginTop:2}}>{l}</div>
        </div>)}
      </div>
    </div>

    {/* Plan vs Reality table */}
    <Card s={{padding:0,overflow:"hidden"}}>
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold}}>📊 Plan vs Reality</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>AI recommendation vs what you actually hold</div>
        </div>
        {positions.length===0&&<button className="btn btn-outline" onClick={onGoToPortfolio} style={{fontSize:12,padding:"7px 14px"}}>
          📁 Add your positions →
        </button>}
      </div>
      <div className="table-wrap" style={{overflowX:"auto"}}>
        <table className="strategy-table" style={{width:"100%",borderCollapse:"collapse",minWidth:750}}>
          <thead>
            <tr style={{background:T.accent,borderBottom:`1px solid ${T.border}`}}>
              {["","Position","Type","Rec %","Rec $","Entry Zone","Target","Stop","Your Weight","Status","P&L"].map((h,i)=>(
                <th key={i} style={{padding:"10px 12px",textAlign:i<=1?"center":"right",fontSize:9,color:h==="Target"?T.green:h==="Stop"?T.red:h==="Entry Zone"?T.blue:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPositions.map(({ticker,name,weight,type,isETF,entryLow,entryHigh,target,stopLoss,riskReward},idx)=>{
              const recDollar=Math.round(amount*(weight/100));
              const held=portfolioMap[ticker];
              const lp=prices[ticker];
              const currentPrice=lp?.price;
              const currentValue=held&&currentPrice?held.shares*currentPrice:held?held.totalCost:null;
              const actualPct=currentValue&&totalPortfolioValue>0?((currentValue/totalPortfolioValue)*100).toFixed(1):null;
              const pnl=held&&currentPrice?((currentPrice-held.avgCost)/held.avgCost*100).toFixed(1):null;
              const drift=actualPct&&weight?(parseFloat(actualPct)-weight).toFixed(1):null;
              const status=!held?(lang==="es"?"❌ No ejecutado":"❌ Not executed"):Math.abs(parseFloat(actualPct||0)-weight)<=5?(lang==="es"?"✅ Ejecutado":"✅ Executed"):(lang==="es"?"⚠️ Parcial":"⚠️ Partial");
              // Is current price in entry zone?
              const inZone=currentPrice&&entryLow&&entryHigh&&currentPrice>=entryLow&&currentPrice<=entryHigh;
              const belowZone=currentPrice&&entryLow&&currentPrice<entryLow;
              const aboveTarget=currentPrice&&target&&currentPrice>=target;
              const PIE_COLORS=["#c9a84c","#2ecc71","#4a9eff","#a855f7","#e74c3c","#f39c12","#1abc9c","#e67e22","#3498db","#9b59b6","#e91e63","#00bcd4"];
              const dotColor=PIE_COLORS[idx%PIE_COLORS.length];
              return<tr key={ticker} style={{borderBottom:`1px solid ${T.border}22`}}
                onMouseEnter={e=>e.currentTarget.style.background=T.accent}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 8px",textAlign:"center"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:dotColor,margin:"0 auto"}}/>
                </td>
                <td style={{padding:"10px 12px",textAlign:"center"}}>
                  <Mn sz={13} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                  <div style={{fontSize:9,color:T.muted,marginTop:1}}>{name||""}</div>
                </td>
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  <span style={{fontSize:10,padding:"2px 7px",borderRadius:8,background:`${isETF?T.blue:T.green}15`,color:isETF?T.blue:T.green}}>{isETF?"ETF":type||"Stock"}</span>
                </td>
                <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={12} c={T.gold}>{weight}%</Mn></td>
                <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={11} c={T.muted}>${recDollar.toLocaleString()}</Mn></td>
                {/* Entry Zone */}
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  {entryLow&&entryHigh
                    ?<div>
                      <div style={{fontSize:11,color:inZone?T.green:T.blue,fontWeight:inZone?700:400}}>${entryLow}–${entryHigh}</div>
                      {inZone&&<div style={{fontSize:9,color:T.green}}>{lang==="es"?"✅ En zona":"✅ In zone"}</div>}
                      {belowZone&&<div style={{fontSize:9,color:T.muted}}>Wait — above zone</div>}
                    </div>
                    :<Mn sz={11} c={T.muted}>—</Mn>}
                </td>
                {/* Target */}
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  {target
                    ?<div>
                      <Mn sz={11} c={aboveTarget?T.gold:T.green} s={{fontWeight:aboveTarget?700:400}}>${target}</Mn>
                      {aboveTarget&&<div style={{fontSize:9,color:T.gold}}>{lang==="es"?"🎯 ¡Objetivo!":"🎯 Target hit!"}</div>}
                    </div>
                    :<Mn sz={11} c={T.muted}>—</Mn>}
                </td>
                {/* Stop Loss */}
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  {stopLoss
                    ?<div>
                      <Mn sz={11} c={T.red}>${stopLoss}</Mn>
                      {riskReward&&<div style={{fontSize:9,color:T.muted}}>R/R {riskReward}</div>}
                    </div>
                    :<Mn sz={11} c={T.muted}>—</Mn>}
                </td>
                {/* Your weight */}
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  {actualPct
                    ?<div>
                      <Mn sz={12} c={Math.abs(parseFloat(drift||0))<=5?T.green:T.gold}>{actualPct}%</Mn>
                      {drift&&<div style={{fontSize:9,color:parseFloat(drift)>0?"#e67e22":T.muted}}>{parseFloat(drift)>0?"+":""}{drift}%</div>}
                    </div>
                    :<Mn sz={11} c={T.muted}>—</Mn>}
                </td>
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,background:`${statusColor(status)}15`,color:statusColor(status),fontWeight:600,whiteSpace:"nowrap"}}>{status}</span>
                </td>
                <td style={{padding:"10px 12px",textAlign:"right"}}>
                  {pnl!=null
                    ?<span style={{fontSize:12,color:parseFloat(pnl)>=0?T.green:T.red,fontWeight:600}}>{parseFloat(pnl)>=0?"+":""}{pnl}%</span>
                    :<Mn sz={11} c={T.muted}>—</Mn>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {positions.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:12,color:T.muted,background:`${T.gold}05`}}>
        ⚡ Add your positions in <strong style={{color:T.gold}}>My Portfolio</strong> to see how your execution compares to the AI plan
      </div>}
    </Card>

    {/* Strategy summary */}
    {portfolio.summary&&<Card s={{background:T.accent}}>
      <div style={{fontSize:10,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>📋 Original Strategy</div>
      <div style={{fontSize:13,color:T.text,lineHeight:1.75,marginBottom:12}}>{portfolio.summary}</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[
          {l:"Expected Return",v:portfolio.expectedReturn,c:T.green},
          {l:"Max Drawdown",v:portfolio.maxDrawdown,c:T.red},
          {l:"Rebalance",v:portfolio.rebalance,c:T.gold},
        ].map(({l,v,c})=>v&&<div key={l} style={{background:T.card,borderRadius:8,padding:"8px 14px"}}>
          <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",marginBottom:2}}>{l}</div>
          <Mn sz={13} c={c} s={{fontWeight:600}}>{v}</Mn>
        </div>)}
      </div>
    </Card>}

    {/* CTA to update/re-analyze */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div onClick={onGoToPortfolio} style={{cursor:"pointer",background:`${T.blue}10`,border:`1px solid ${T.blue}33`,borderRadius:12,padding:"18px 20px",display:"flex",alignItems:"center",gap:12}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=T.blue}
        onMouseLeave={e=>e.currentTarget.style.borderColor=`${T.blue}33`}>
        <span style={{fontSize:24}}>📁</span>
        <div>
          <div style={{fontSize:13,color:T.blue,fontWeight:600,marginBottom:3}}>Update My Portfolio</div>
          <div style={{fontSize:11,color:T.muted}}>Add new positions or update existing ones</div>
        </div>
      </div>
      <div onClick={onGoToProfile} style={{cursor:"pointer",background:`${T.purple}10`,border:`1px solid ${T.purple}33`,borderRadius:12,padding:"18px 20px",display:"flex",alignItems:"center",gap:12}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=T.purple}
        onMouseLeave={e=>e.currentTarget.style.borderColor=`${T.purple}33`}>
        <span style={{fontSize:24}}>🧬</span>
        <div>
          <div style={{fontSize:13,color:T.purple,fontWeight:600,marginBottom:3}}>Rebuild My Strategy</div>
          <div style={{fontSize:11,color:T.muted}}>Retake the quiz and generate a new AI portfolio</div>
        </div>
      </div>
    </div>

    <Card s={{background:`${T.red}08`,border:`1px solid ${T.red}22`,padding:12}}>
      <div style={{fontSize:11,color:T.muted,textAlign:"center"}}>
        ⚠️ <span style={{color:T.gold}}>Disclaimer:</span> This is for educational tracking purposes only. Not financial advice.
      </div>
    </Card>
  </div>;
}

// ── LEGAL PAGES ──────────────────────────────────────────────────────────────
function PrivacyPolicy({onClose,lang="en"}){
  const isEs=lang==="es";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:3000,overflowY:"auto",padding:"20px 16px"}}>
      <div style={{maxWidth:760,margin:"0 auto",background:T.card,borderRadius:16,padding:"40px 40px",border:`1px solid ${T.border}`,position:"relative"}}>
        <button onClick={onClose} style={{position:"sticky",top:0,float:"right",background:T.accent,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",color:T.muted,fontSize:13,marginBottom:16}}>✕ Cerrar</button>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.gold,marginBottom:6,fontWeight:700}}>Política de Privacidad</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:32}}>Última actualización: {new Date().toLocaleDateString("es-CO",{year:"numeric",month:"long",day:"numeric"})}</div>
        {[
          {t:"1. Responsable del Tratamiento",b:`Inversoria (en adelante "la Plataforma") es responsable del tratamiento de los datos personales recopilados a través de inversoria.lat y sus dominios asociados.

Esta política cumple con la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia), la LFPDPPP (México), la Ley 25.326 (Argentina), la Ley 19.628 (Chile) y la LGPD (Brasil).`},
          {t:"2. Datos que Recopilamos",b:`Recopilamos los siguientes datos personales:

• Datos de identificación: correo electrónico, nombre de usuario.
• Datos de uso: tickers analizados, posiciones de portafolio ingresadas, perfil de riesgo seleccionado.
• Datos técnicos: dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo de sesión.
• Datos de pago: procesados exclusivamente por Stripe Inc. No almacenamos datos de tarjetas de crédito.

No recopilamos datos sensibles como origen racial, creencias religiosas, datos biométricos ni información de salud.`},
          {t:"3. Finalidad del Tratamiento",b:`Los datos personales se utilizan para:

• Crear y gestionar tu cuenta de usuario.
• Proveer los servicios de análisis de inversiones, calculadora y seguimiento de portafolio.
• Personalizar tu experiencia según tu perfil de riesgo e historial de uso.
• Enviar comunicaciones transaccionales (confirmación de cuenta, recibos de pago).
• Mejorar la plataforma mediante análisis de uso agregado y anónimo.
• Cumplir con obligaciones legales y prevenir fraudes.

No utilizamos tus datos para decisiones automatizadas que produzcan efectos legales significativos.`},
          {t:"4. Base Legal del Tratamiento",b:`El tratamiento de tus datos se basa en:

• Tu consentimiento expreso al registrarte y aceptar esta política.
• La ejecución del contrato de prestación de servicios.
• El interés legítimo de la Plataforma para mejorar sus servicios.
• El cumplimiento de obligaciones legales aplicables.`},
          {t:"5. Tus Derechos (ARCO)",b:`De conformidad con la normativa aplicable, tienes derecho a:

• Acceso: Conocer qué datos personales tenemos sobre ti.
• Rectificación: Corregir datos inexactos o incompletos.
• Cancelación/Supresión: Solicitar la eliminación de tus datos.
• Oposición: Oponerte al tratamiento de tus datos para fines específicos.
• Portabilidad: Recibir tus datos en formato estructurado.
• Revocación del consentimiento: En cualquier momento, sin efecto retroactivo.

Para ejercer estos derechos escríbenos a: hola@inversoria.lat
Responderemos en un plazo máximo de 15 días hábiles.`},
          {t:"6. Compartir Datos con Terceros",b:`Compartimos datos únicamente con:

• Supabase Inc. (base de datos y autenticación) — almacenamiento seguro en servidores con cifrado AES-256.
• Stripe Inc. (procesamiento de pagos) — cumple con PCI-DSS nivel 1.
• Anthropic PBC (análisis de IA) — solo se envían los datos necesarios para el análisis solicitado.
• Proveedores de datos de mercado (datos agregados de mercado, no datos personales).

No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines comerciales.`},
          {t:"7. Transferencias Internacionales",b:`Algunos de nuestros proveedores procesan datos fuera de tu país de residencia. En todos los casos exigimos garantías contractuales adecuadas (cláusulas contractuales tipo o certificaciones equivalentes) para proteger tus datos conforme a los estándares de tu país.`},
          {t:"8. Retención de Datos",b:`Conservamos tus datos mientras mantengas una cuenta activa y durante los períodos legalmente requeridos:

• Datos de cuenta: mientras la cuenta esté activa + 2 años tras su eliminación.
• Datos de transacciones: 10 años (obligación fiscal/contable).
• Datos de uso y analítica: máximo 24 meses en forma agregada.

Puedes solicitar la eliminación anticipada de tu cuenta en cualquier momento.`},
          {t:"9. Seguridad",b:`Implementamos medidas técnicas y organizativas adecuadas:

• Cifrado en tránsito (TLS 1.3) y en reposo (AES-256).
• Autenticación segura gestionada por Supabase Auth.
• Acceso restringido a datos personales por parte del equipo.
• Revisiones periódicas de seguridad.

En caso de brecha de seguridad que afecte tus datos, te notificaremos dentro de las 72 horas siguientes a su detección.`},
          {t:"10. Cookies y Tecnologías Similares",b:`Utilizamos:

• Cookies esenciales: para mantener tu sesión activa (no requieren consentimiento).
• Almacenamiento local (localStorage): para guardar preferencias de idioma, moneda y datos de portafolio de usuarios no registrados.
• Analytics (opcional): Google Analytics para análisis de uso agregado y anónimo.

Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad.`},
          {t:"11. Menores de Edad",b:`La Plataforma no está dirigida a menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos que hemos recopilado datos de un menor, los eliminaremos inmediatamente.`},
          {t:"12. Cambios a esta Política",b:`Podemos actualizar esta política periódicamente. Te notificaremos por correo electrónico y mediante aviso en la Plataforma con al menos 30 días de anticipación ante cambios sustanciales. El uso continuado de la Plataforma tras la notificación implica aceptación.`},
          {t:"13. Contacto y Autoridad de Control",b:`Para consultas sobre privacidad:
📧 hola@inversoria.lat

Tienes derecho a presentar reclamaciones ante la autoridad de protección de datos de tu país:
• Colombia: Superintendencia de Industria y Comercio (SIC)
• México: INAI
• Argentina: AAIP
• Chile: Consejo para la Transparencia
• Brasil: ANPD`},
        ].map(({t,b})=>(
          <div key={t} style={{marginBottom:28}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:10,fontWeight:700}}>{t}</div>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.9,whiteSpace:"pre-line"}}>{b}</div>
          </div>
        ))}
        <div style={{marginTop:32,padding:"16px 20px",background:T.accent,borderRadius:10,border:`1px solid ${T.border}`,fontSize:12,color:T.muted,lineHeight:1.7}}>
          ⚠️ Esta política fue elaborada para cumplir con las principales normativas de protección de datos de América Latina. Para asesoría legal específica en tu jurisdicción, consulta un abogado especializado.
        </div>
        <div style={{textAlign:"center",marginTop:24}}>
          <button onClick={onClose} className="btn btn-gold" style={{padding:"12px 32px",borderRadius:10}}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

function TermsOfService({onClose,lang="en"}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:3000,overflowY:"auto",padding:"20px 16px"}}>
      <div style={{maxWidth:760,margin:"0 auto",background:T.card,borderRadius:16,padding:"40px 40px",border:`1px solid ${T.border}`,position:"relative"}}>
        <button onClick={onClose} style={{position:"sticky",top:0,float:"right",background:T.accent,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",color:T.muted,fontSize:13,marginBottom:16}}>✕ Cerrar</button>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.gold,marginBottom:6,fontWeight:700}}>Términos de Uso</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:32}}>Última actualización: {new Date().toLocaleDateString("es-CO",{year:"numeric",month:"long",day:"numeric"})}</div>
        {[
          {t:"1. Aceptación de los Términos",b:`Al acceder y usar Inversoria (la "Plataforma"), aceptas estar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes usar la Plataforma.

El uso de la Plataforma está disponible para personas mayores de 18 años con capacidad legal para celebrar contratos.`},
          {t:"2. Descripción del Servicio",b:`Inversoria es una plataforma educativa de análisis de inversiones que ofrece:

• Calculadora de interés compuesto.
• Análisis de acciones mediante inteligencia artificial (framework Buffett/Munger).
• Quiz de perfil de riesgo de inversor.
• Seguimiento de portafolio con precios de mercado.
• Herramientas de planificación DCA y rebalanceo.
• Dashboard de ciclos de mercado.

El servicio se ofrece en modalidades gratuita y de pago (suscripción mensual).`},
          {t:"3. AVISO IMPORTANTE — No es Asesoría Financiera",b:`TODO EL CONTENIDO DE COMPOUNDER ANALYST ES EXCLUSIVAMENTE EDUCATIVO E INFORMATIVO.

• No somos una firma de asesoría de inversiones registrada.
• Los análisis generados por IA son estimaciones educativas, NO recomendaciones de inversión.
• Los scores de calidad, análisis de moat y proyecciones DCF son herramientas de aprendizaje.
• Los consensos de analistas provienen de fuentes públicas y pueden no estar actualizados.
• Las rentabilidades pasadas no garantizan rentabilidades futuras.

Siempre consulta con un asesor financiero certificado antes de tomar decisiones de inversión. Invertir conlleva riesgos, incluyendo la pérdida total del capital invertido.`},
          {t:"4. Planes y Pagos",b:`La Plataforma ofrece:

• Plan Gratuito: Acceso limitado a funciones básicas (3 análisis, 5 acciones en portafolio, 2 planes DCA).
• Plan Basic ($7.99/mes): Análisis ilimitados, portafolio ilimitado, ciclo de mercado.
• Plan Premium ($12.99/mes): Todas las funciones incluyendo portafolio IA y estrategia avanzada.

Los pagos se procesan de forma segura a través de Stripe. Las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento desde tu cuenta.`},
          {t:"5. Política de Reembolsos",b:`• Puedes solicitar reembolso completo dentro de los primeros 7 días de tu primera suscripción.
• No aplicamos reembolsos proporcionales por cancelaciones a mitad del período.
• Para solicitar un reembolso: hola@inversoria.lat
• Los reembolsos se procesan en 5-10 días hábiles.`},
          {t:"6. Cuenta de Usuario",b:`• Eres responsable de mantener la confidencialidad de tu contraseña.
• No puedes compartir, vender o transferir tu cuenta.
• Debes notificarnos inmediatamente de cualquier uso no autorizado.
• Nos reservamos el derecho de suspender cuentas que violen estos términos.`},
          {t:"7. Propiedad Intelectual",b:`• Todo el contenido de la Plataforma (código, diseño, textos, análisis generados) es propiedad de Inversoria.
• Se te otorga una licencia limitada, no exclusiva y no transferible para uso personal.
• No puedes copiar, distribuir, modificar o crear obras derivadas sin autorización escrita.
• Los datos de mercado y análisis son para uso personal exclusivamente.`},
          {t:"8. Limitación de Responsabilidad",b:`EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE:

• No nos responsabilizamos por pérdidas de inversión derivadas del uso de la Plataforma.
• No garantizamos la exactitud, completitud o actualidad de los datos de mercado.
• No somos responsables por interrupciones del servicio, errores de terceros (APIs de datos) o pérdida de datos.
• Nuestra responsabilidad máxima se limita al monto pagado por el usuario en los últimos 3 meses.`},
          {t:"9. Conducta del Usuario",b:`Está prohibido:

• Usar la Plataforma para fines ilegales o no autorizados.
• Intentar acceder a cuentas de otros usuarios.
• Realizar ingeniería inversa del software.
• Usar bots o scraping automatizado.
• Compartir tu cuenta con terceros.
• Publicar contenido falso o engañoso.`},
          {t:"10. Modificaciones del Servicio",b:`Nos reservamos el derecho de:

• Modificar o discontinuar funciones con 30 días de aviso.
• Cambiar los precios de suscripción con 30 días de aviso.
• Actualizar estos Términos con notificación por email.

El uso continuado tras los cambios implica aceptación.`},
          {t:"11. Ley Aplicable y Jurisdicción",b:`Estos Términos se rigen por las leyes de la República de Colombia. Cualquier disputa se someterá a los tribunales competentes de Bogotá, Colombia, sin perjuicio de los derechos que la normativa local de tu país de residencia te pueda otorgar como consumidor.`},
          {t:"12. Contacto",b:`Para cualquier consulta sobre estos Términos:
📧 hola@inversoria.lat
🌐 inversoria.lat`},
        ].map(({t,b})=>(
          <div key={t} style={{marginBottom:28}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:10,fontWeight:700}}>{t}</div>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.9,whiteSpace:"pre-line"}}>{b}</div>
          </div>
        ))}
        <div style={{textAlign:"center",marginTop:24}}>
          <button onClick={onClose} className="btn btn-gold" style={{padding:"12px 32px",borderRadius:10}}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS=[{id:"compound",l:"💰 Compound Calculator"},{id:"whatif",l:"🚀 What If?"},{id:"score",l:"🎯 Analyze a Stock"},{id:"profile",l:"🧬 Risk Profile"},{id:"portfolio",l:"📁 My Portfolio"},{id:"strategy",l:"📈 My Strategy"}];
const FREE_LIMIT=3;

function isAdmin(){try{return localStorage.getItem("inversoria_admin")==="true";}catch{return false;}}
function getCount(){try{if(isAdmin())return 0;return parseInt(localStorage.getItem("inversoria_count")||"0");}catch{return 0;}}
function incCount(){try{if(isAdmin())return 0;const n=getCount()+1;localStorage.setItem("inversoria_count",String(n));return n;}catch{return 999;}}
// DCA usage counter — 2 free uses
const DCA_FREE_LIMIT=2;
function getDCACount(){try{if(isAdmin())return 0;return parseInt(localStorage.getItem("inversoria_dca_count")||"0");}catch{return 0;}}
function incDCACount(){try{if(isAdmin())return 0;const n=getDCACount()+1;localStorage.setItem("inversoria_dca_count",String(n));return n;}catch{return 999;}}
function canUseDCAFree(){return isAdmin()||getDCACount()<DCA_FREE_LIMIT;}
// Rebalance usage counter — 2 free uses
const REB_FREE_LIMIT=2;
function getRebCount(){try{if(isAdmin())return 0;return parseInt(localStorage.getItem("inversoria_reb_count")||"0");}catch{return 0;}}
function incRebCount(){try{if(isAdmin())return 0;const n=getRebCount()+1;localStorage.setItem("inversoria_reb_count",String(n));return n;}catch{return 999;}}
function canUseRebFree(){return isAdmin()||getRebCount()<REB_FREE_LIMIT;}

export default function App(){
  const [darkMode,setDarkMode]=useState(()=>{
    try{const t=localStorage.getItem("inversoria_theme");return t?t==="dark":false;}catch{return false;}
  });
  const [tab,setTab]=useState(null);
  const [user,setUser]=useState(null);          // Supabase user object
  const [userPlan,setUserPlan]=useState("free"); // free | basic | premium
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("signup");
  const [lang,setLang]=useState(()=>{try{return localStorage.getItem("compoundr_lang")||"en";}catch{return "en";}});
  const L=LANG[lang]||LANG.en;
  const toggleLang=()=>{const nl=lang==="en"?"es":"en";setLang(nl);try{localStorage.setItem("compoundr_lang",nl);}catch{} };
  const [currCode,setCurrCode]=useState(()=>{try{return localStorage.getItem("compoundr_currency")||"USD";}catch{return "USD";}});
  const [showCurrMenu,setShowCurrMenu]=useState(false);
  const [liveRates,setLiveRates]=useState({});
  const [ratesLoaded,setRatesLoaded]=useState(false);
  const [ratesError,setRatesError]=useState(false);

  // Fetch live rates on mount
  useState(()=>{
    fetchExchangeRates().then(rates=>{
      setLiveRates(rates);
      setRatesLoaded(true);
    }).catch(()=>{setRatesError(true);setRatesLoaded(true);});
  });

  const currObj=CURRENCIES[currCode]||CURRENCIES.USD;
  const liveRate=currCode==="USD"?1:(liveRates[currCode]||CURRENCIES[currCode]?.rate||1);
  setCurrencyGlobal(currObj,liveRate); // sync global fmt with live rate

  const changeCurrency=(code)=>{
    setCurrCode(code);
    const rate=code==="USD"?1:(liveRates[code]||CURRENCIES[code]?.rate||1);
    setCurrencyGlobal(CURRENCIES[code],rate);
    try{localStorage.setItem("compoundr_currency",code);}catch{}
    setShowCurrMenu(false);
  };
  const [m,setM]=useState(defM());
  const [moat,setMoat]=useState(defMoat());
  const [company,setCompany]=useState("");
  const [sector,setSector]=useState("Technology");
  const [showPaywall,setShowPaywall]=useState(false);
  const [paywallContext,setPaywallContext]=useState("stock");
  const [adminMode,setAdminMode]=useState(isAdmin());
  const [showPrivacy,setShowPrivacy]=useState(false);
  const [showTerms,setShowTerms]=useState(false);

  useState(()=>{
    const handler=(e)=>{
      if(e.ctrlKey&&e.shiftKey&&e.key==="A"){localStorage.setItem("inversoria_admin","true");setAdminMode(true);alert("✅ Admin mode ON — unlimited access");}
      if(e.ctrlKey&&e.shiftKey&&e.key==="D"){localStorage.removeItem("inversoria_admin");setAdminMode(false);alert("🔒 Admin mode OFF");}
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  });

  // ── SUPABASE AUTH LISTENER ──
  useEffect(()=>{
    if(!supabase)return;
    // Get current session on mount
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){setUser(session.user);syncUserPlan(session.user.id);}
    });
    // Listen for auth changes
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session?.user){setUser(session.user);syncUserPlan(session.user.id);}
      else{setUser(null);setUserPlan("free");}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const syncUserPlan=async(userId)=>{
    try{
      const {data}=await supabase.from("user_plans").select("plan").eq("user_id",userId).single();
      if(data?.plan)setUserPlan(data.plan);
    }catch(e){setUserPlan("free");}
  };

  const signOut=async()=>{
    if(supabase)await supabase.auth.signOut();
    setUser(null);setUserPlan("free");
  };

  const isPremium=()=>isAdmin()||userPlan==="basic"||userPlan==="premium";
  const isPro=()=>isAdmin()||userPlan==="premium";

  const canAnalyze=(ctx="stock")=>{if(isPremium())return true;const c=getCount();if(c>=FREE_LIMIT){setPaywallContext(ctx);setShowPaywall(true);return false;}return true;};
  const onAnalysis=()=>{incCount();};
  const handleStart=(targetTab="compound",ticker="")=>{setTab(targetTab||"compound");if(ticker)setCompany(ticker);};

  return<ErrorBoundary>
  <div style={{minHeight:"100vh",background:T.bg}} onClick={()=>showCurrMenu&&setShowCurrMenu(false)}>
    <style>{css}</style>
    {showPrivacy&&<PrivacyPolicy onClose={()=>setShowPrivacy(false)} lang={lang}/>}
    {showTerms&&<TermsOfService onClose={()=>setShowTerms(false)} lang={lang}/>}
    {showPaywall&&<PaywallModal onClose={()=>{setShowPaywall(false);setTab("compound");}} context={paywallContext} lang={lang}
      onSignUp={()=>{setShowPaywall(false);setAuthMode("signup");setShowAuth(true);}}/>}
    {showAuth&&<AuthModal lang={lang} initialMode={authMode}
      onClose={()=>setShowAuth(false)}
      onAuth={(u)=>{setUser(u);setShowAuth(false);}}/>}
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 28px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(8px)"}}>
      <div style={{maxWidth:1380,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 0"}}>
          <div onClick={()=>setTab(null)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📈</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.gold,letterSpacing:"0.02em",lineHeight:1}}>{L.nav_brand}</div>
              <div className="nav-brand-sub" style={{fontSize:8,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2}}>{L.nav_sub}</div>
            </div>
          </div>
          <div className="nav-actions" style={{display:"flex",alignItems:"center",gap:10}}>
            {/* Lang switcher */}
            <button onClick={toggleLang} style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:4}}>
              <span>{lang==="en"?"🇺🇸":"🇨🇴"}</span>
              <span style={{color:T.text,fontWeight:600}}>{lang==="en"?"ES":"EN"}</span>
            </button>
            {/* Currency picker */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowCurrMenu(v=>!v)}
                style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:3}}>
                <span style={{fontSize:14}}>{currObj.flag}</span>
                <span style={{color:T.text,fontWeight:600,fontSize:10}}>{currCode}</span>
                <span style={{fontSize:8}}>▼</span>
              </button>
              {showCurrMenu&&<div className="curr-dropdown" style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:6,zIndex:200,minWidth:200,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
                <div style={{fontSize:9,color:T.muted,padding:"4px 8px",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Select Currency</div>
                {/* Rate source indicator */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"2px 8px 6px"}}>
                  <span style={{fontSize:9,color:T.muted}}>Rates: European Central Bank</span>
                  {ratesLoaded
                    ?<span style={{fontSize:9,color:ratesError?T.gold:T.green}}>{ratesError?"⚠️ Fallback rates":"✅ Live rates"}</span>
                    :<span style={{fontSize:9,color:T.muted}}><span className="sp">⟳</span> Loading...</span>}
                </div>
                {Object.values(CURRENCIES).map(({flag,code,name,symbol})=>{
                  const rate=code==="USD"?1:(liveRates[code]||CURRENCIES[code]?.rate||1);
                  return<div key={code} onClick={()=>changeCurrency(code)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:6,cursor:"pointer",background:currCode===code?`${T.gold}15`:"transparent"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.accent}
                    onMouseLeave={e=>e.currentTarget.style.background=currCode===code?`${T.gold}15`:"transparent"}>
                    <span style={{fontSize:14}}>{flag}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:currCode===code?T.gold:T.text,fontWeight:currCode===code?600:400}}>{symbol} {code} — {name}</div>
                      <div style={{fontSize:9,color:T.muted}}>
                        {code==="USD"?"Base currency":`1 USD = ${rate.toLocaleString("en-US",{maximumFractionDigits:2})} ${code}`}
                      </div>
                    </div>
                    {currCode===code&&<span style={{fontSize:10,color:T.gold}}>✓</span>}
                  </div>;
                })}
                <div style={{borderTop:`1px solid ${T.border}33`,marginTop:4,padding:"6px 8px 2px"}}>
                  <div style={{fontSize:9,color:T.muted,lineHeight:1.5}}>
                    ⚠️ Stock prices always in USD (market standard).<br/>
                    Portfolio totals & calculators use selected currency.
                  </div>
                </div>
              </div>}
            </div>
            {user&&<div style={{display:"flex",alignItems:"center",gap:6,background:T.accent,borderRadius:20,padding:"4px 10px",border:`1px solid ${T.border}`}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#0a0c10",fontWeight:700}}>
                {user.email?.[0]?.toUpperCase()||"U"}
              </div>
              <span style={{fontSize:11,color:userPlan==="premium"?T.gold:userPlan==="basic"?T.green:T.muted,fontWeight:600}}>
                {userPlan==="premium"?"⭐ Premium":userPlan==="basic"?"✓ Basic":lang==="es"?"Gratis":"Free"}
              </span>
              <button onClick={signOut} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.muted,padding:"0 2px"}}
                title={lang==="es"?"Cerrar sesión":"Sign out"}>✕</button>
            </div>}
            {!user&&<button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,color:T.muted}}>
              {lang==="es"?"Iniciar Sesión":"Sign In"}
            </button>}
            {adminMode
              ?<div style={{fontSize:11,color:T.green,padding:"4px 10px",border:`1px solid ${T.green}44`,borderRadius:6,background:`${T.green}10`}}>🔑 Admin</div>
              :<><div style={{fontSize:11,color:T.muted,padding:"4px 10px",border:`1px solid ${T.border}`,borderRadius:6}}>
                  {L.nav_free(Math.max(0,FREE_LIMIT-getCount()))}
                </div>
                <button className="btn btn-gold" onClick={()=>{
                  if(!user){setAuthMode("signup");setShowAuth(true);}
                  else{setPaywallContext("stock");setShowPaywall(true);}
                }} style={{fontSize:12,padding:"8px 16px"}}>
                  {L.nav_premium}
                </button></>
            }
          </div>
        </div>
        {tab&&<div className="tabs-wrap" style={{display:"flex",gap:0,marginTop:6,borderTop:`1px solid ${T.border}22`,paddingTop:2,overflowX:"auto"}}>
          {[
            {id:"compound",l:L.tab_compound},
            {id:"whatif",l:L.tab_whatif},
            {id:"score",l:L.tab_score},
            {id:"profile",l:L.tab_profile},
            {id:"portfolio",l:L.tab_portfolio},
            {id:"strategy",l:L.tab_strategy},
          ].map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)}
            style={{color:tab===t.id?T.gold:T.muted,borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:8,fontSize:11,whiteSpace:"nowrap"}}>{t.l}</button>)}
        </div>}
      </div>
    </div>
    {!tab&&<Hero onStart={handleStart} lang={lang}/>}
    {tab&&<div className="page-wrap" style={{maxWidth:1380,margin:"0 auto",padding:"24px 28px"}}>
      {tab==="compound"&&<CompoundTab onGoToTab={(t)=>setTab(t)} lang={lang}/>}
      {tab==="whatif"&&<WhatIfTab lang={lang}/>}
      {tab==="score"&&<ScoreTab m={m} setM={setM} moat={moat} setMoat={setMoat} company={company} setCompany={setCompany} sector={sector} setSector={setSector} onAnalysis={onAnalysis} canAnalyze={canAnalyze} onGoToProfile={()=>setTab("profile")} lang={lang}/>}
      {tab==="profile"&&<ProfileTab onAnalysis={onAnalysis} canAnalyze={canAnalyze} onGoToPortfolio={()=>setTab("portfolio")} onGoToStrategy={()=>setTab("strategy")} lang={lang} user={user}/>}
      {tab==="portfolio"&&<PortfolioTab canAnalyze={canAnalyze} onShowPaywall={(ctx)=>{setPaywallContext(ctx);setShowPaywall(true);}} onGoToProfile={()=>setTab("profile")} lang={lang} user={user}/>}
      {tab==="strategy"&&(
      plan==="premium"||plan==="basic"||isAdmin()
        ?<StrategyTab onGoToProfile={()=>setTab("profile")} onGoToPortfolio={()=>setTab("portfolio")} lang={lang} user={user}/>
        :<div style={{maxWidth:600,margin:"80px auto",textAlign:"center",padding:"0 24px"}}>
          <div style={{fontSize:48,marginBottom:16}}>📈</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.text,marginBottom:12,fontWeight:700}}>
            {lang==="es"?"Mi Estrategia — Premium":"My Strategy — Premium"}
          </div>
          <div style={{fontSize:15,color:T.muted,marginBottom:28,lineHeight:1.7}}>
            {lang==="es"
              ?"Define tu plan de inversión y compara con la realidad. Ve exactamente si estás cumpliendo tus metas financieras."
              :"Define your investment plan and compare with reality. See exactly if you're meeting your financial goals."}
          </div>
          <button className="btn btn-gold" onClick={()=>setShowPaywall(true)}
            style={{fontSize:15,padding:"14px 36px",borderRadius:12}}>
            {lang==="es"?"🚀 Ver planes Premium":"🚀 See Premium plans"}
          </button>
          <div style={{marginTop:12,fontSize:12,color:T.muted}}>
            {lang==="es"?"Desde $7.99/mes · Cancela cuando quieras":"From $7.99/mo · Cancel anytime"}
          </div>
        </div>
    )}
    </div>}
    <div style={{maxWidth:1380,margin:"0 auto",padding:"0 28px 20px"}}><AdBanner size="leaderboard"/></div>
    <div style={{borderTop:`1px solid ${T.border}`,padding:"16px 28px",maxWidth:1380,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:9,color:T.muted}}>
        <span style={{color:T.goldDim,fontFamily:"'Playfair Display',serif"}}>Inversoria</span>
        {" "}· Buffett · Munger · {L.footer_disc}
      </div>
      <div style={{display:"flex",gap:16}}>
        <button onClick={(e)=>{e.stopPropagation();setShowPrivacy(true);}}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:T.muted,padding:"4px 8px",textDecoration:"underline"}}
          onMouseEnter={e=>e.target.style.color=T.gold}
          onMouseLeave={e=>e.target.style.color=T.muted}>
          {lang==="es"?"Política de Privacidad":"Privacy Policy"}
        </button>
        <button onClick={(e)=>{e.stopPropagation();setShowTerms(true);}}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:T.muted,padding:"4px 8px",textDecoration:"underline"}}
          onMouseEnter={e=>e.target.style.color=T.gold}
          onMouseLeave={e=>e.target.style.color=T.muted}>
          {lang==="es"?"Términos de Uso":"Terms of Use"}
        </button>
        <button onClick={(e)=>{e.stopPropagation();window.open("mailto:hola@inversoria.lat");}}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:T.muted,padding:"4px 8px",textDecoration:"underline"}}
          onMouseEnter={e=>e.target.style.color=T.gold}
          onMouseLeave={e=>e.target.style.color=T.muted}>
          {lang==="es"?"Contacto":"Contact"}
        </button>
      </div>
    </div>
  </div>
  </ErrorBoundary>;
}
