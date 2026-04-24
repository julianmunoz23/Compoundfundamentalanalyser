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
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
  BarChart, Bar, Legend,
} from "recharts";

// ── ERROR BOUNDARY — prevents white screen on any crash ──────────────────────
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  componentDidCatch(e,info){console.error("App crash:",e,info);}
  render(){
    if(this.state.err)return(
      <div style={{minHeight:"100vh",background:"#0e0e1a",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{background:T.surface,border:"1px solid #e74c3c44",borderRadius:16,padding:32,maxWidth:500,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#c9a84c",marginBottom:10}}>Something went wrong</div>
          <div style={{fontSize:13,color:"#6b7694",marginBottom:20,lineHeight:1.7}}>{this.state.err.message}</div>
          <button onClick={()=>this.setState({err:null})} style={{background:"#c9a84c",color:"#0e0e1a",border:"none",borderRadius:8,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
            Try Again
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}


const T = {
  bg:"#1c1b2e",surface:"#242338",card:"#242338",border:"#35345a",
  gold:"#a78bfa",goldLight:"#c4b5fd",goldDim:"#5b4d8a",
  green:"#4ade80",red:"#f87171",blue:"#60a5fa",purple:"#6d3fdc",
  text:"#f0eeff",muted:"#8585a8",accent:"#1e1d31",
  heroCard:"linear-gradient(135deg,#2e1f6b 0%,#1e1545 100%)",
  heroCardBorder:"#5b3fd455",
  greenCard:"#0d2a1a",greenCardBorder:"#166534",
};

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
  .btn-gold{background:${T.purple};color:#fff;padding:10px 22px;}.btn-gold:hover{background:${T.gold};transform:translateY(-1px);}
  .btn-gold:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
  .btn-outline{background:transparent;border:1px solid ${T.border};color:${T.muted};padding:8px 16px;}.btn-outline:hover{border-color:${T.goldDim};color:${T.gold};}
  .seg{cursor:pointer;border:1px solid ${T.border};font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;transition:all 0.2s;background:${T.accent};color:${T.muted};}
  .seg-on{background:${T.purple}22!important;color:${T.gold}!important;border-color:${T.goldDim}!important;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .fi{animation:fadeIn 0.35s ease both;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .sp{animation:spin 0.8s linear infinite;display:inline-block;}
  .trow:hover td{background:${T.accent}55;}
  .hero-grad{background:linear-gradient(135deg,#0e0e1a 0%,#13132a 40%,#1a1535 100%);}
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
  GBP:{symbol:"£",  code:"GBP",name:"Libra Esterlina", flag:"🇬🇧",locale:"en-GB",rate:1},
};

// Global currency state — updated by App
let _currency=CURRENCIES.USD;
let _exRate=1;

function setCurrencyGlobal(curr,rate=1){_currency={..._currency,...curr};_exRate=rate;}

// Fetch live exchange rates from frankfurter.app (European Central Bank — free, no key)
async function fetchExchangeRates(){
  try{
    const res=await fetch("https://api.frankfurter.app/latest?from=USD&to=COP,MXN,ARS,PEN,CLP,BRL,EUR,GBP");
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
  const isEs=lang==="es";
  const configs={
    stock:{
      icon:"🎯",
      title:isEs?"Ya viste el potencial. Ahora actúa.":"You've seen the potential. Now act on it.",
      sub:isEs?<>Usaste tus <span style={{color:T.text,fontWeight:600}}>3 análisis gratis</span>. Actualiza para seguir analizando acciones con consenso Wall Street, score de calidad y valuación DCF — sin límite.</>:<>You've used your <span style={{color:T.text,fontWeight:600}}>3 free analyses</span>. Upgrade to keep analyzing stocks with live Wall Street consensus, moat scoring, and DCF valuation — unlimited.</>,
      features:isEs?["Análisis IA de Acciones Ilimitados","Dashboard de Ciclo de Mercado","Consenso Wall Street en Tiempo Real","Objetivos de Precio de Analistas","Análisis FCF Growth Rate","Score de Calidad — 8 Filtros","Valuación DCF Inline"]:["Unlimited AI Stock Analyses","Market Cycle Dashboard","Wall Street Consensus Live","Analyst Price Targets & Upside","FCF Growth Rate Analysis","Score de Calidad — 8 Filtros","Inline DCF Valuation"],
      price:"$7.99/mo",
      trial:isEs?"7 días gratis · Cancela cuando quieras":"7-day free trial · Cancel anytime",
      cta:isEs?"🎯 Desbloquear Análisis Ilimitados":"🎯 Unlock Unlimited Analysis",
      proof:isEs?"Únete a los inversores que ya usan Inversoria":"Join investors already using Inversoria",
    },
    portfolio:{
      icon:"📁",
      title:isEs?"Tu portafolio merece un análisis real.":"Your portfolio deserves a real analysis.",
      sub:isEs?<>El plan gratuito incluye <span style={{color:T.text,fontWeight:600}}>5 acciones</span>. Actualiza para rastrear posiciones ilimitadas con precios en vivo y rebalanceo IA.</>:<>Free plan supports <span style={{color:T.text,fontWeight:600}}>5 stock positions</span>. Upgrade for unlimited positions with live prices and AI rebalancing.</>,
      features:isEs?["Posiciones Ilimitadas","Score IA del Portafolio","Plan de Rebalanceo","Asesor DCA","Verificación de Perfil de Riesgo","P&L en tiempo real"]:["Unlimited Portfolio Positions","AI Portfolio Score","Rebalance Plan","DCA Advisor","Risk Profile Check","Real-time P&L"],
      price:"$7.99/mo",
      trial:isEs?"7 días gratis · Cancela cuando quieras":"7-day free trial · Cancel anytime",
      cta:isEs?"📁 Desbloquear Mi Portafolio":"📁 Unlock My Full Portfolio",
      proof:isEs?"Ve exactamente a dónde debe ir tu dinero":"See exactly where your money should go",
    },
    riskPortfolio:{
      icon:"🧬",
      title:isEs?"Tu ADN inversor está listo. Construye el portafolio.":"Your investor DNA is ready. Now build the portfolio.",
      sub:isEs?<>Tu <span style={{color:T.text,fontWeight:600}}>Perfil de Riesgo siempre es gratis</span>. Suscríbete para obtener un portafolio IA personalizado de acciones y ETFs — diseñado para tu perfil y monto.</>:<>Your <span style={{color:T.text,fontWeight:600}}>Risk Profile is always free</span>. Subscribe to get a personalized AI portfolio of stocks and ETFs — built specifically for your profile and investment amount.</>,
      features:isEs?["Portafolio de Acciones con IA","Recomendaciones de ETFs","Asignación de Activos","Modelado de Retorno Esperado","Guía de Rebalanceo Trimestral","Recomendaciones de Brokers"]:["AI-Curated Stock Portfolio","ETF Recommendations","Asset Allocation Breakdown","Expected Return Modeling","Quarterly Rebalance Guide","Broker Recommendations"],
      price:"$12.99/mo",
      trial:isEs?"7 días gratis · Cancela cuando quieras":"7-day free trial · Cancel anytime",
      cta:isEs?"🚀 Construir Mi Portafolio IA":"🚀 Build My AI Portfolio",
      proof:isEs?"El portafolio que el inversor paciente construiría para tu perfil":"The portfolio a patient investor would build for your risk profile",
    },
  };
  const c=configs[context]||configs.stock;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="paywall-modal" style={{background:T.card,border:`2px solid ${T.goldDim}`,borderRadius:20,padding:"36px 40px",maxWidth:520,width:"100%",textAlign:"center",position:"relative",maxHeight:"90vh",overflowY:"auto"}}>
        {/* Close button */}
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18,lineHeight:1}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
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
        {/* Dual plan cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {/* Basic */}
          <div style={{background:`${T.gold}08`,border:`2px solid ${T.goldDim}`,borderRadius:12,padding:"14px 16px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.background=`${T.gold}14`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.goldDim;e.currentTarget.style.background=`${T.gold}08`;}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{isEs?"Plan Basic":"Basic Plan"}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.gold,fontWeight:700,lineHeight:1}}>$7.99</div>
            <div style={{fontSize:10,color:T.muted,marginBottom:8}}>/mo</div>
            <div style={{fontSize:10,color:T.text,lineHeight:1.6,marginBottom:10,textAlign:"left"}}>
              {isEs?"✓ Análisis ilimitados":"✓ Unlimited analyses"}<br/>
              {isEs?"✓ Portafolio ilimitado":"✓ Unlimited portfolio"}<br/>
              ✓ Market Cycle
            </div>
            <button className="btn btn-gold" style={{fontSize:12,padding:"9px 0",borderRadius:8,width:"100%"}}
              onClick={()=>{onSignUp?onSignUp():alert("💳 Coming soon! Email us at hola@inversoria.lat for early access.");}}>
              {isEs?"Elegir Basic":"Choose Basic"}
            </button>
          </div>
          {/* Premium */}
          <div style={{background:`${T.purple}10`,border:`2px solid ${T.purple}`,borderRadius:12,padding:"14px 16px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",position:"relative"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background=`${T.purple}18`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background=`${T.purple}10`;}}>
            <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:T.purple,borderRadius:20,padding:"2px 10px",fontSize:9,color:"#fff",fontWeight:700,whiteSpace:"nowrap"}}>⭐ {isEs?"MÁS POPULAR":"MOST POPULAR"}</div>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{isEs?"Plan Premium":"Premium Plan"}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.purple,fontWeight:700,lineHeight:1}}>$12.99</div>
            <div style={{fontSize:10,color:T.muted,marginBottom:8}}>/mo</div>
            <div style={{fontSize:10,color:T.text,lineHeight:1.6,marginBottom:10,textAlign:"left"}}>
              {isEs?"✓ Todo lo de Basic":"✓ Everything in Basic"}<br/>
              {isEs?"✓ Portafolio IA personalizado":"✓ AI personalized portfolio"}<br/>
              {isEs?"✓ Mi Estrategia":"✓ My Strategy tab"}
            </div>
            <button style={{background:T.purple,color:"#fff",border:"none",borderRadius:8,padding:"9px 0",width:"100%",fontSize:12,fontWeight:600,cursor:"pointer"}}
              onClick={()=>{onSignUp?onSignUp():alert("💳 Coming soon! Email us at hola@inversoria.lat for early access.");}}>
              {isEs?"Elegir Premium":"Choose Premium"}
            </button>
          </div>
        </div>
        <div style={{fontSize:10,color:T.green,marginBottom:12,textAlign:"center"}}>🎁 {c.trial}</div>
        <button onClick={onClose} style={{fontSize:11,color:T.muted,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
          {isEs?"Quizás después":"Maybe later"}
        </button>
      </div>
    </div>
  );
}

// ── CRITERIA ──────────────────────────────────────────────────────────────────
const CL=(en,es)=>({en,es}); // bilingual label helper
const CRITERIA={
  growth:[
    {key:"revenueCAGR",label:"Revenue CAGR",unit:"%",threshold:15,max:50,weight:20},
    {key:"fcfGrowth",label:"FCF Growth Rate (CAGR)",unit:"%",threshold:15,max:100,weight:10},
    {key:"tamGrowth",label:"TAM Growth",unit:"%",threshold:10,max:30,weight:5},
  ],
  profitability:[
    {key:"roic",label:"ROIC",unit:"%",threshold:20,max:60,weight:20},
    {key:"grossMargin",label:"Gross Margin",unit:"%",threshold:40,max:90,weight:8},
    {key:"opMargin",label:"Operating Margin",unit:"%",threshold:18,max:50,weight:7},
  ],
  cashflow:[{key:"fcfMarginPct",label:"FCF Margin",unit:"%",threshold:15,max:60,weight:20}],
  balance:[
    {key:"debtEbitda",label:"Debt/EBITDA",unit:"x",threshold:2,max:5,invert:true,weight:8},
    {key:"interestCover",label:"Interest Coverage",unit:"x",threshold:6,max:20,weight:2},
  ],
};
const MOAT_KEYS=["Economies of Scale","Switching Costs","Network Effects","Brand Dominance","Proprietary Technology","Market Leadership"];
const MOAT_ES={"Economies of Scale":"Economías de Escala","Switching Costs":"Costos de Cambio","Network Effects":"Efectos de Red","Brand Dominance":"Dominio de Marca","Proprietary Technology":"Tecnología Propia","Market Leadership":"Liderazgo de Mercado"};
const moatLabel=(k,lang)=>lang==="es"?(MOAT_ES[k]||k):k;
const SECTORS=["Technology","Healthcare","Consumer","Finance","Industrials","Energy","Other"];
const defM=()=>({revenueCAGR:20,fcfGrowth:25,tamGrowth:12,roic:25,grossMargin:55,opMargin:22,fcfMarginPct:20,debtEbitda:1.2,interestCover:10});
const defMoat=()=>Object.fromEntries(MOAT_KEYS.map(k=>[k,3]));
function sm(c,v){if(c.invert){if(v<=c.threshold)return 100;if(v>=c.max)return 0;return Math.round((1-(v-c.threshold)/(c.max-c.threshold))*100);}if(v>=c.threshold*1.5)return 100;if(v>=c.threshold)return Math.round(60+((v-c.threshold)/(c.threshold*0.5))*40);return Math.round((v/c.threshold)*60);}
function calcScore(m,moat){let tw=0,ts=0;Object.values(CRITERIA).flat().forEach(c=>{const s=sm(c,m[c.key]||0);ts+=s*c.weight;tw+=c.weight;});const moatAvg=Object.values(moat).reduce((a,v)=>a+v,0)/(MOAT_KEYS.length*5)*100;ts+=moatAvg*10;tw+=10;return Math.round(ts/tw);}
function grade(s,lang="en"){
  const isEs=lang==="es";
  if(s>=85)return{l:"A+",c:T.green,label:isEs?"Negocio Excepcional":"Elite Compounder"};
  if(s>=75)return{l:"A",c:T.green,label:isEs?"Alta Calidad":"High Quality"};
  if(s>=65)return{l:"B+",c:T.gold,label:isEs?"Buen Negocio":"Good Business"};
  if(s>=55)return{l:"B",c:T.gold,label:isEs?"Prometedor":"Promising"};
  if(s>=45)return{l:"C",c:"#f39c12",label:isEs?"Necesita Mejorar":"Needs Improvement"};
  return{l:"D",c:T.red,label:isEs?"Evitar":"Avoid"};
}

// ── SHARED ────────────────────────────────────────────────────────────────────
const Card=({children,s,onClick,id})=><div id={id} onClick={onClick} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,...s}}>{children}</div>;
const Lbl=({children,s})=><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,fontWeight:500,marginBottom:5,...s}}>{children}</div>;
const Mn=({children,sz=14,c=T.text,s})=><span style={{fontFamily:"'DM Mono',monospace",fontSize:sz,color:c,...s}}>{children}</span>;

function ScoreRing({score,size=80,lang="en"}){
  const g=grade(score,lang);const r=size*0.38,cx=size/2,cy=size/2;
  const arc=v=>{const a=-135+(v/100)*270,rd=x=>x*Math.PI/180;return`M ${cx+r*Math.cos(rd(-135))} ${cy+r*Math.sin(rd(-135))} A ${r} ${r} 0 ${a>45?1:0} 1 ${cx+r*Math.cos(rd(a))} ${cy+r*Math.sin(rd(a))}`;};
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

// ── LATAM MARKETS — Yahoo Finance ticker maps ────────────────────────────────
// Each exchange uses a suffix that Yahoo Finance recognizes
const LATAM_MARKETS = {
  // 🇨🇴 Colombia BVC
  CL: {
    suffix:".CL", currency:"COP",
    tickers:{
      "ECOPETROL":"ECOPETROL","PFBCOLOM":"PFBCOLOM","TERPEL":"TERPEL",
      "TERPEL":"TERPEL","ECOPETROL":"ECOPETROL","PFBCOLOM":"PFBCOLOM","CIBEST":"CIBEST","BANCOLOMBIA":"CIBEST",
      "ISA":"ISA","GRUPOSURA":"GRUPOSURA","NUTRESA":"NUTRESA",
      "CEMARGOS":"CEMARGOS","CELSIA":"CELSIA","GEB":"GEB",
      "PROMIGAS":"PROMIGAS","ETB":"ETB","BVC":"BVC",
      "CORFICOLCF":"CORFICOLCF","MINEROS":"MINEROS","EEB":"EEB",
      "PFDAVVNDA":"PFDAVVNDA","BOGOTA":"BOGOTA","OCCIDENTE":"OCCIDENTE",
      "PFAVH":"PFAVH","COLINV":"COLINV","CNEC":"CNEC",
      "GRUPOARGOS":"GRUPOARGOS","EXITO":"EXITO","CLH":"CLH",
      "INVERARGOS":"INVERARGOS","PFDGRUPOARG":"PFDGRUPOARG",
      "NUCO":"NUCO","BRKBCO":"BRKBCO","PFECO":"PFECO","NKECO":"NKECO",
      "PFGRUPSURA":"PFGRUPSURA","COLINV":"COLINV",
      "PEI":"PEI","EXITO":"CNEC","CNEC":"CNEC","BOGOTA":"BOGOTA",
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

const KNOWN_TICKERS={
  "GOOGLE":"GOOGL","ALPHABET":"GOOGL","GOOGL":"GOOGL",
  "APPLE":"AAPL","MICROSOFT":"MSFT","AMAZON":"AMZN",
  "TESLA":"TSLA","META":"META","FACEBOOK":"META",
  "NVIDIA":"NVDA","NETFLIX":"NFLX","SPOTIFY":"SPOT",
  "UBER":"UBER","AIRBNB":"ABNB","SHOPIFY":"SHOP",
  "PAYPAL":"PYPL","SALESFORCE":"CRM","ADOBE":"ADBE",
  "COSTCO":"COST","WALMART":"WMT","TARGET":"TGT",
  "JOHNSON":"JNJ","PFIZER":"PFE","UNITEDHEALTH":"UNH",
  "ECOPETROL":"EC","BANCOLOMBIA":"CIB","GRUPO AVAL":"AVAL","TECNOGLASS":"TGLS",
  // 🇨🇴 Colombia BVC
  "CIBEST":"CIBEST","GRUPO CIBEST":"CIBEST","TERPEL":"TERPEL",
  "PEI":"PEI","EXITO":"CNEC","GRUPO EXITO":"CNEC","ÉXITO":"CNEC",
  // Trii Colombia — certificates that track US stocks
  "BRKBCO":"BRK.B","PFECO":"PFE","NKECO":"NKE","NUCO":"NUCO",
  "PFGRUPSURA":"GRUPOSURA","PFAVAL":"AVAL","AMZECO":"AMZN",
  "MSFTCO":"MSFT","APPLECO":"AAPL","GOOGLCO":"GOOGL","TSLAECO":"TSLA","CELSIA":"CELSIA","ISA":"ISA","GEB":"GEB",
  "PROMIGAS":"PROMIGAS","CEMARGOS":"CEMARGOS","GRUPOSURA":"GRUPOSURA",
  "NUTRESA":"NUTRESA","ETB":"ETB","MINEROS":"MINEROS",
  "PFBCOLOM":"PFBCOLOM","PFDAVVNDA":"PFDAVVNDA","CORFICOLCF":"CORFICOLCF",
  // 🇧🇷 Brasil BOVESPA
  "PETROBRAS":"PETR4","ITAU":"ITUB4","VALE":"VALE3","BRADESCO":"BBDC4",
  "AMBEV":"ABEV3","EMBRAER":"EMBR3","TOTVS":"TOTVS3","WEG":"WEGE3",
  // 🇨🇱 Chile Santiago
  "FALABELLA":"FALABELLA","CENCOSUD":"CENCOSUD","COPEC":"COPEC","SQM":"SQMB",
  "LATAM":"LTM","COLBUN":"COLBUN","CMPC":"CMPC","CAP":"CAP",
  // 🇦🇷 Argentina BYMA
  "YPF ARGENTINA":"VIST","GALICIA":"GGAL","PAMPA":"PAMP","ALUAR":"ALUA",
  // 🇲🇽 México BMV — many already have US tickers (FEMSA, WALMEX)
  "WALMEX":"WALMEX","BIMBO":"BIMBOA","ALSEA":"ALSEA",
  "CEMEX":"CX","FEMSA":"FMX","PETROBRAS":"PBR","VALE":"VALE","ITAU":"ITUB",
  "MERCADOLIBRE":"MELI","NUBANK":"NU","GLOBANT":"GLOB","DESPEGAR":"DESP",
  "INTEL":"INTC","AMD":"AMD","ARM":"ARM","QUALCOMM":"QCOM","BROADCOM":"AVGO",
  "SERVICENOW":"NOW","SNOWFLAKE":"SNOW","PALANTIR":"PLTR","CROWDSTRIKE":"CRWD",
  "JPMORGAN":"JPM","GOLDMAN":"GS","BERKSHIRE":"BRK.B",
  "VISA":"V","MASTERCARD":"MA","AMERICAN EXPRESS":"AXP",
  "DISNEY":"DIS","WARNER":"WBD","COMCAST":"CMCSA",
  "BOEING":"BA","LOCKHEED":"LMT","EXXON":"XOM",
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
    tab_compound: "Calculator",
    tab_whatif: "What If?",
    tab_score: "Analyze Stock",
    tab_profile: "Risk Profile",
    tab_portfolio: "My Portfolio",
    tab_strategy: "My Strategy",
    tab_ret: "📐 Expected Return",
    hero_badge: "✦ El Método del Inversor Paciente · inversoria.lat",
    hero_h1a: "Invest like",
    hero_h1b: "el Inversor Paciente.",
    hero_h1c: "Con IA.",
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
    tab_compound: "Calculadora",
    tab_whatif: "¿Y si...?",
    tab_score: "Analizar Acción",
    tab_profile: "Perfil de Riesgo",
    tab_portfolio: "Mi Portafolio",
    tab_strategy: "Mi Estrategia",
    tab_ret: "📐 Retorno Esperado",
    hero_badge: "✦ El Método del Inversor Paciente · inversoria.lat",
    hero_h1a: "Invierte como",
    hero_h1b: "el Inversor Paciente.",
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
    score_label: "🎯 Analizador de Acciones — Los 8 Filtros del Inversor Paciente · Consenso Wall Street · 3 análisis gratis",
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
        <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:20}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>

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
              background:mode===m?T.gold:"transparent",color:mode===m?"#0e0e1a":T.muted,transition:"all 0.2s"}}>
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

// ── FEATURES SHOWCASE — El Método del Inversor Paciente ──────────────────────
function MiniChartFS() {
  return (
    <svg width="100%" height="62" viewBox="0 0 204 62" preserveAspectRatio="none"
      style={{display:"block",margin:"10px 0 11px"}}>
      <defs>
        <linearGradient id="fs-cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.gold} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={T.gold} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d="M0 52 C16 48,28 42,44 38 S66 24,82 20 S106 28,122 18 S148 4,168 2 S190 6,204 0"
        fill="none" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M0 52 C16 48,28 42,44 38 S66 24,82 20 S106 28,122 18 S148 4,168 2 S190 6,204 0 V62 H0Z"
        fill="url(#fs-cg)"/>
    </svg>
  );
}

function DonutChartFS() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" style={{display:"block",margin:"0 auto 11px"}}>
      <circle cx="44" cy="44" r="33" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="11"/>
      <circle cx="44" cy="44" r="33" fill="none" stroke={T.gold} strokeWidth="11"
        strokeDasharray="77 130" strokeDashoffset="-9" strokeLinecap="round"/>
      <circle cx="44" cy="44" r="33" fill="none" stroke={T.blue} strokeWidth="11"
        strokeDasharray="40 130" strokeDashoffset="-89" strokeLinecap="round"/>
      <circle cx="44" cy="44" r="33" fill="none" stroke={T.green} strokeWidth="11"
        strokeDasharray="26 130" strokeDashoffset="-132" strokeLinecap="round"/>
      <circle cx="44" cy="44" r="33" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="11"
        strokeDasharray="19 130" strokeDashoffset="-160" strokeLinecap="round"/>
      <text x="44" y="40" textAnchor="middle" fontSize="8" fill="rgba(240,238,255,0.45)"
        style={{fontFamily:"'DM Sans',sans-serif"}}>Retorno</text>
      <text x="44" y="52" textAnchor="middle" fontSize="11" fill={T.gold} fontWeight="700"
        style={{fontFamily:"'Playfair Display',serif"}}>+7.2%</text>
    </svg>
  );
}

function PhoneFrame({children}){
  return(
    <div style={{width:"100%",maxWidth:224,background:T.surface,borderRadius:34,
      border:`1.5px solid rgba(167,139,250,0.16)`,
      boxShadow:`0 28px 56px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.04) inset`,
      overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
        width:66,height:20,background:"#000",borderRadius:"0 0 12px 12px",zIndex:10}}/>
      <div style={{padding:"26px 11px 14px"}}>{children}</div>
    </div>
  );
}

function FSScreen1(){
  return<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
      <div>
        <div style={{fontSize:8.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,marginBottom:3}}>Análisis de Valor</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:T.text,fontWeight:700}}>NVDA</div>
      </div>
      <span style={{fontSize:8,fontWeight:600,padding:"2px 7px",borderRadius:6,background:"rgba(167,139,250,0.12)",
        color:T.gold,border:"1px solid rgba(167,139,250,0.22)",marginTop:2,display:"inline-block"}}>NASDAQ</span>
    </div>
    <div style={{fontFamily:"'DM Mono',monospace",fontSize:21,color:T.text,fontWeight:500,lineHeight:1}}>$875.40</div>
    <div style={{fontSize:9.5,color:T.green,fontWeight:500,marginTop:2}}>▲ +3.21% hoy</div>
    <MiniChartFS/>
    <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.13),rgba(167,139,250,0.06))",
      border:"1px solid rgba(167,139,250,0.2)",borderRadius:10,padding:"9px 10px",marginBottom:8}}>
      <div style={{fontSize:7.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.gold,fontWeight:600,marginBottom:5}}>
        ✦ Score de Calidad — Los 8 Filtros
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:7,marginBottom:5}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.green,fontWeight:700,lineHeight:1}}>A+</div>
        <div style={{fontSize:9,color:T.green,fontWeight:500}}>Negocio Excepcional</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,marginLeft:"auto"}}>87/100</div>
      </div>
      {[{l:"📈 Crecimiento",p:92,c:T.gold},{l:"💎 Rentabilidad",p:88,c:T.blue},{l:"💵 Flujo Caja",p:84,c:T.green},{l:"🏰 La Fosa",p:90,c:"#f59e0b"}].map(({l,p,c})=>(
        <div key={l} style={{display:"grid",gridTemplateColumns:"52px 1fr 22px",alignItems:"center",gap:4,marginBottom:4}}>
          <span style={{fontSize:7.5,color:T.muted}}>{l}</span>
          <div style={{height:3,background:T.border,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${p}%`,background:c,borderRadius:2}}/>
          </div>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:7.5,color:T.text,textAlign:"right"}}>{p}%</span>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,marginBottom:8}}>
      {[{t:"✓ ROIC 28% ≥ 20%",c:T.green},{t:"✓ FCF Margen 22%",c:T.green},{t:"✓ Ingresos +56%",c:T.green},{t:"⚠ Deuda 2.1x",c:"#f59e0b"}]
        .map(({t,c})=><div key={t} style={{fontSize:7.5,color:c}}>{t}</div>)}
    </div>
    <div style={{background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:8,padding:"7px 9px"}}>
      <div style={{fontSize:7,color:T.green,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,fontWeight:600}}>
        Consenso Wall Street · 42 analistas
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:12,color:T.green,fontWeight:700}}>Compra Fuerte</div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.gold,fontWeight:500}}>Obj. $940</div>
          <div style={{fontSize:8,color:T.green}}>+7.4% upside</div>
        </div>
      </div>
    </div>
  </>;
}

function FSScreen2(){
  const holdings=[
    {ticker:"NVDA",alloc:37,val:"$4,617",chg:"+12.4%",up:true,color:T.gold},
    {ticker:"AAPL",alloc:25,val:"$3,120",chg:"+4.1%",up:true,color:T.blue},
    {ticker:"MELI",alloc:16,val:"$1,997",chg:"-2.3%",up:false,color:T.green},
    {ticker:"Otros",alloc:22,val:"$2,746",chg:"+1.8%",up:true,color:"rgba(255,255,255,0.15)"},
  ];
  return<>
    <div style={{fontSize:8.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,marginBottom:3}}>Mi Portafolio</div>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:23,color:T.text,fontWeight:700,lineHeight:1}}>$12,480</div>
    <div style={{fontSize:9.5,color:T.green,fontWeight:500,marginTop:3,marginBottom:11}}>▲ +$840 · +7.2% este mes</div>
    <DonutChartFS/>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {holdings.map(({ticker,alloc,val,chg,up,color})=>(
        <div key={ticker}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:2,background:color,flexShrink:0}}/>
              <div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10.5,fontWeight:500,color:T.text}}>{ticker}</div>
                <div style={{fontSize:8,color:T.muted}}>{alloc}%</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:T.text}}>{val}</div>
              <div style={{fontSize:8.5,fontWeight:500,color:up?T.green:T.red}}>{chg}</div>
            </div>
          </div>
          <div style={{height:2.5,background:T.border,borderRadius:2,marginTop:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${alloc}%`,background:color,borderRadius:2}}/>
          </div>
        </div>
      ))}
    </div>
    <div style={{marginTop:9,padding:"7px 9px",background:"rgba(167,139,250,0.08)",
      border:"1px solid rgba(167,139,250,0.18)",borderRadius:8,
      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:7.5,color:T.muted}}>🤖 Diagnóstico IA</div>
        <div style={{fontSize:8,color:T.muted,marginTop:1}}>Concentración alta en tech</div>
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,fontWeight:700}}>B+</div>
    </div>
  </>;
}

function FSScreen3(){
  const news=[
    {src:"Reuters · 2h",type:"pos",badge:"POSITIVO",body:"Fed mantiene tasas; mercados reaccionan con alza en tech.",tags:"$SPY · $QQQ · $NVDA"},
    {src:"Bloomberg · 4h",type:"neg",badge:"NEGATIVO",body:"MercadoLibre reporta caída en márgenes en Brasil.",tags:"$MELI · $B3SA3"},
    {src:"El Economista · 6h",type:"neu",badge:"NEUTRO",body:"Banxico revisa proyecciones de crecimiento para 2025.",tags:"$BMXN · $EWW"},
  ];
  const borderColor={pos:T.green,neg:T.red,neu:T.border};
  const badgeBg={pos:"rgba(52,211,153,0.14)",neg:"rgba(248,113,113,0.14)",neu:"rgba(255,255,255,0.06)"};
  const badgeColor={pos:T.green,neg:T.red,neu:T.muted};
  return<>
    <div style={{fontSize:8.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,marginBottom:3}}>Mercado hoy</div>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.text,fontWeight:700,marginBottom:10}}>Noticias & Sentimiento</div>
    <div style={{display:"flex",height:5,borderRadius:3,overflow:"hidden",gap:2,marginBottom:5}}>
      <div style={{flex:5.8,background:"linear-gradient(90deg,#34d399,#22c87a)",borderRadius:"3px 0 0 3px"}}/>
      <div style={{flex:2.4,background:"rgba(255,255,255,0.09)"}}/>
      <div style={{flex:1.8,background:"linear-gradient(90deg,#f87171,#ef5050)",borderRadius:"0 3px 3px 0"}}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:7.5,marginBottom:10}}>
      <span style={{color:T.green,fontWeight:600}}>58% Positivo</span>
      <span style={{color:T.muted}}>24% Neutro</span>
      <span style={{color:T.red,fontWeight:600}}>18% Neg.</span>
    </div>
    {news.map(({src,type,badge,body,tags})=>(
      <div key={src} style={{background:T.accent,borderRadius:8,padding:"8px 9px",marginBottom:6,borderLeft:`2px solid ${borderColor[type]}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <span style={{fontSize:7.5,color:T.muted}}>{src}</span>
          <span style={{fontSize:7,padding:"1.5px 5px",borderRadius:4,fontWeight:600,background:badgeBg[type],color:badgeColor[type]}}>{badge}</span>
        </div>
        <div style={{fontSize:9,color:T.text,lineHeight:1.45}}>{body}</div>
        <div style={{fontSize:7.5,color:T.blue,marginTop:2,fontWeight:500}}>{tags}</div>
      </div>
    ))}
    <div style={{marginTop:8,padding:"7px 9px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:7}}>
      <div style={{fontSize:7,color:T.gold,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>✦ Resumen del inversor paciente</div>
      <div style={{fontSize:8.5,color:T.muted,lineHeight:1.5}}>Tech lidera el rebote. Cautela en LATAM por datos macro de Brasil y México.</div>
    </div>
  </>;
}

function FeaturesShowcase({onStart,lang="es"}){
  const features=[
    {num:"01 — Análisis de Valor",title:"Los 8 Filtros del Inversor Paciente",
     desc:"Score de Calidad con ROIC, FCF, La Fosa del Negocio y consenso de Wall Street en tiempo real.",
     pill:"🎯 3 análisis gratis · Sin cuenta",tab:"score",screen:<FSScreen1/>},
    {num:"02 — Mi Portafolio",title:"P&G en Tiempo Real",
     desc:"Tus posiciones con precios en vivo. La IA evalúa si tu portafolio coincide con tu perfil.",
     pill:"📁 Hasta 5 acciones gratis",tab:"portfolio",screen:<FSScreen2/>},
    {num:"03 — Noticias",title:"El Mercado Filtrado para Ti",
     desc:"La IA clasifica cada noticia por sentimiento y genera el resumen que el inversor paciente necesita leer.",
     pill:"📰 Actualización diaria",tab:"score",screen:<FSScreen3/>},
  ];
  const bottomTags=[
    {text:"✓ 3 análisis gratis · Sin tarjeta",bg:"rgba(52,211,153,0.08)",border:"rgba(52,211,153,0.2)",color:T.green},
    {text:"★ 500+ inversores en LATAM",bg:"rgba(167,139,250,0.08)",border:"rgba(167,139,250,0.2)",color:T.gold},
    {text:"🇨🇴 🇲🇽 🇦🇷 🇨🇱 🇧🇷 · Tu moneda local",bg:"rgba(96,165,250,0.08)",border:"rgba(96,165,250,0.2)",color:T.blue},
  ];
  return(
    <div style={{background:T.bg,padding:"60px 20px 68px",fontFamily:"'DM Sans',sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,left:"50%",transform:"translateX(-50%)",width:700,height:320,
        background:"radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
      {/* Header */}
      <p style={{textAlign:"center",fontSize:9.5,fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",color:T.gold,marginBottom:14}}>
        ✦ inversoria.lat — plataforma de inversiones con IA para LATAM
      </p>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,40px)",fontWeight:700,color:T.text,
        textAlign:"center",lineHeight:1.15,margin:"0 auto 6px",maxWidth:600}}>
        Todo lo que necesitas para{" "}
        <span style={{color:T.gold}}>invertir con inteligencia</span>
      </h2>
      <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(13px,2vw,18px)",fontWeight:700,
        color:T.muted,textAlign:"center",lineHeight:1.3,margin:"0 auto 14px",maxWidth:580}}>
        ¿Es este negocio lo suficientemente{" "}
        <span style={{color:T.goldDim}}>bueno para tu dinero?</span>
      </p>
      <p style={{textAlign:"center",fontSize:13,color:T.muted,maxWidth:460,margin:"0 auto 48px",lineHeight:1.65}}>
        Los mejores inversores no buscan acciones baratas. Buscan negocios extraordinarios. Inversoria aplica los 8 filtros del inversor paciente a cualquier acción — en 30 segundos.
      </p>
      {/* Phones grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,maxWidth:880,margin:"0 auto",alignItems:"start"}}>
        {features.map(({num,title,desc,pill,tab,screen},i)=>(
          <div key={num} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,marginTop:i===1?-22:0}}>
            <PhoneFrame>{screen}</PhoneFrame>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.14em",color:T.goldDim,textTransform:"uppercase",marginBottom:5}}>{num}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.text,fontWeight:700,marginBottom:5}}>{title}</div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.55,maxWidth:185,margin:"0 auto"}}>{desc}</div>
              <div onClick={()=>onStart&&onStart(tab)}
                style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,
                  background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",
                  borderRadius:20,padding:"3px 10px",fontSize:9,color:T.gold,fontWeight:600,cursor:"pointer"}}>
                {pill}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom tags */}
      <div style={{maxWidth:880,margin:"38px auto 0",display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
        {bottomTags.map(({text,bg,border,color})=>(
          <div key={text} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:20,
            background:bg,border:`1px solid ${border}`,fontSize:10.5,fontWeight:500,color}}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

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
          ★ {isEs?"✦ Más de 500 inversores en LATAM ya toman mejores decisiones":"✦ 500+ LATAM investors already making smarter decisions"}
        </span>
      </div>

      {/* Headline */}
      <h1 className="hero-h1" style={{fontFamily:"'Playfair Display',serif",fontSize:clamp(34,5,50),color:T.text,lineHeight:1.15,marginBottom:16,fontWeight:700}}>
        {isEs
          ?<>¿En qué<br/><span style={{color:T.gold}}>debería invertir?</span></>
          :<>Is this stock<br/><span style={{color:T.gold}}>worth buying?</span></>}
      </h1>

      <p style={{fontSize:19,color:T.muted,maxWidth:560,margin:"0 auto 10px",lineHeight:1.75,fontWeight:400}}>
        {isEs
          ?"Dile a la IA el nombre de cualquier acción y en 30 segundos sabrás si vale la pena comprarla — sin tecnicismos, sin experiencia previa."
          :"Tell the AI any stock name and in 30 seconds you'll know if it's worth buying — no finance degree, no experience needed."}
      </p>
      {/* ── POWER TAGLINE ── */}
      {isEs
        ?<div style={{display:"inline-flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${T.gold}18,${T.purple}12)`,border:`1px solid ${T.gold}55`,borderRadius:12,padding:"10px 20px",marginBottom:28}}>
          <span style={{fontSize:18}}>🏦</span>
          <span style={{fontSize:15,color:T.gold,fontWeight:700,letterSpacing:"0.01em"}}>
            La herramienta que los bancos <span style={{color:T.goldLight,textDecoration:"underline",textDecorationStyle:"wavy",textUnderlineOffset:"4px"}}>no quieren</span> que uses
          </span>
          <span style={{fontSize:18}}>🤫</span>
        </div>
        :<p style={{fontSize:13,color:`${T.muted}88`,marginBottom:28}}>Your personal investment analyst · All of Latin America</p>
      }
      {isEs&&<p style={{fontSize:11,color:`${T.muted}66`,marginBottom:28,marginTop:-20}}>Colombia · México · Argentina · Chile · Todo LATAM</p>}

      {/* CTA buttons */}
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:12,padding:"0 8px"}}>
        <button className="btn btn-gold btn-mobile-full" onClick={()=>onStart("score")}
          style={{fontSize:16,padding:"15px 36px",borderRadius:12,boxShadow:`0 4px 24px ${T.gold}33`}}>
          {isEs?"🎯 Analiza tu primera acción — gratis":"🎯 Analyze a stock — free"}
        </button>
        <button className="btn btn-outline" onClick={()=>onStart("profile")}
          style={{fontSize:14,padding:"15px 26px",borderRadius:12}}>
          {isEs?"🧬 ¿Cómo debería invertir yo?":"🧬 What type of investor am I?"}
        </button>
      </div>

      {/* Free tier info */}
      <p style={{fontSize:12,color:`${T.muted}77`,marginBottom:0}}>
        {isEs
          ?"Empieza gratis · Sin registrarte · Sin tarjeta · Sin excusas"
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

    {/* ── FEATURES SHOWCASE ── */}
    <FeaturesShowcase onStart={onStart} lang={lang}/>

    {/* ── STATS STRIP ── */}
    <div style={{borderTop:`1px solid ${T.border}22`,borderBottom:`1px solid ${T.border}22`,background:`${T.accent}88`,padding:"20px 28px",marginBottom:0}}>
      <div className="kpi-4" style={{maxWidth:800,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center"}}>
        {[
          {n:"500+",l:isEs?"inversores confían en Inversoria":"investors trust Inversoria"},
          {n:"30s",l:isEs?"para saber si una acción vale":"to know if a stock is worth it"},
          {n:"8",l:isEs?"países · tu moneda local":"countries · your local currency"},
          {n:"100%",l:isEs?"en español · sin tecnicismos":"in Spanish · no jargon"},
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

function CompoundTab({onGoToTab,lang="en",portfolioBalance=0}){
  const L2=LANG[lang]||LANG.en;
  // Local formatter for compound calculator — inputs are in display currency already
  // so we do NOT multiply by _exRate again; just format with currency symbol and locale
  // Full number formatter — no abbreviations, always shows complete number
  const fmtCalc=(n)=>{
    if(!n&&n!==0)return`${_currency.symbol}0`;
    const sign=n<0?"-":"";
    return`${sign}${_currency.symbol}${Math.round(Math.abs(n)).toLocaleString(_currency.locale)}`;
  };
  const fmtCalcShort=fmtCalc; // same — no abbreviations in calculator
  // Currency-aware slider limits — scale USD maxes by live exchange rate
  const sMaxInitial=5000000;
  const sStepInitial=100;
  const sMaxContrib=20000;
  const sStepContrib=10;
  const sMaxGoal=5000000;
  const sStepGoal=10000;
  const [draft,setDraft]=useState({initial:portfolioBalance>0?Math.round(portfolioBalance):10000,rate:10,rateType:"annual",contrib:500,contribFreq:"monthly",years:10});
  const [cfg,setCfg]=useState({initial:portfolioBalance>0?Math.round(portfolioBalance):10000,rate:10,rateType:"annual",contrib:500,contribFreq:"monthly",years:10});
  const [showTable,setShowTable]=useState(true);
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
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}><span style={{color:T.muted}}>💵 {lang==="es"?"Capital Invertido":"Capital Invested"}</span><Mn sz={11} c={T.blue}>{fmtCalc(cap)}</Mn></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}><span style={{color:T.muted}}>✨ {lang==="es"?"Interés Ganado":"Interest Earned"}</span><Mn sz={11} c={T.green}>{fmtCalc(int)}</Mn></div>
      <div style={{borderTop:`1px solid ${T.border}33`,paddingTop:6,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:T.muted}}>Total Balance</span>
        <Mn sz={12} c={T.gold} s={{fontWeight:700}}>{fmtCalc(cap+int)}</Mn>
      </div>
      {int>cap&&<div style={{fontSize:10,color:T.green,textAlign:"center",padding:"3px 0",marginTop:6,borderTop:`1px solid ${T.green}22`}}>✨ Interest exceeds capital!</div>}
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
        {l:lang==="es"?"Balance Final":"Final Balance",v:fmtCalc(last.balance||0),c:T.gold,sub:lang==="es"?`en ${cfg.years} años`:`in ${cfg.years} years`,icon:"🏆"},
        {l:lang==="es"?"Total Invertido":"Total Invested",v:fmtCalc(last.contributed||0),c:T.blue,sub:lang==="es"?"tu dinero":"your money",icon:"💵"},
        {l:lang==="es"?"Interés Ganado":"Interest Earned",v:fmtCalc(last.interest||0),c:T.green,sub:`${last.balance?((last.interest/last.balance)*100).toFixed(0):0}% of total`,icon:"✨"},
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
          <Lbl>Initial Investment (USD){portfolioBalance>0&&<span style={{fontSize:9,color:T.green,marginLeft:6}}>★ {lang==="es"?"de tu portafolio":"from your portfolio"}</span>}</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span><input type="number" value={draft.initial} min={0} step={sStepInitial} onChange={e=>setD("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/></div>
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
            <Lbl s={{marginBottom:0}}>Contributions DCA (USD)</Lbl>
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
            {l:lang==="es"?"Solo Capital (sin interés)":"Capital only (no interest)",v:fmtCalc(last.contributed||0)},
            {l:lang==="es"?"Con interés compuesto 🏆":"With compound interest 🏆",v:fmtCalc(last.balance||0),hi:true},
            {l:lang==="es"?"Generado solo por interés":"Generated by interest alone",v:`+${fmtCalc(last.interest||0)}`,pos:true},
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
          <div style={{fontSize:11,color:T.muted,marginBottom:14}}>{lang==="es"?<>Observa cómo la barra verde (interés) crece hasta <strong style={{color:T.green}}>superar</strong> la azul (capital)</>:<>Watch the green (interest) bar grow until it <strong style={{color:T.green}}>overtakes</strong> the blue (capital)</>}</div>
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.max(0,Math.floor(cfg.years/8)-1)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtCalcShort(v)} width={82}/>
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
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtCalcShort(v)} width={82}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={v=>[fmtCalc(v),"Annual Interest"]}/>
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
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:4,wordBreak:"break-all"}}>{fmtCalc(row.balance)}</div>
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
            {lang==="es"?<><span style={{color:T.green,fontWeight:600}}>Columna verde = interés generado</span> — esto es lo que financia tu estilo de vida</>:<><span style={{color:T.green,fontWeight:600}}>Green column = interest generated</span> — this is what pays for your lifestyle</>}
          </div>
        </div>
        <button className="seg" onClick={()=>setShowTable(v=>!v)}>{lang==="es"?(showTable?"Ocultar tabla":"Ver tabla"):(showTable?"Hide Table":"Show Table")}</button>
      </div>
      {showTable&&<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
          <thead>
            <tr style={{background:T.accent}}>
              <th style={{padding:"12px 16px",textAlign:"center",fontSize:10,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Year</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.blue,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Annual Contribution</th>
              <th style={{padding:"12px 16px",textAlign:"right",fontSize:10,color:T.green,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,background:`${T.green}12`,borderBottom:`2px solid ${T.green}44`}}>{lang==="es"?"✨ Interés Este Año":"✨ Interest This Year"}</th>
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
                  <Mn sz={12} c={T.blue}>{fmtCalc(annualContrib)}</Mn>
                </td>
                {/* HIGHLIGHTED INTEREST COLUMN */}
                <td style={{padding:"10px 16px",textAlign:"right",background:`${T.green}08`,borderLeft:`1px solid ${T.green}22`,borderRight:`1px solid ${T.green}22`}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                    <Mn sz={13} c={T.green} s={{fontWeight:600}}>{fmtCalc(r.interestAnual)}</Mn>
                    <div style={{fontSize:9,color:T.green,opacity:0.7}}>{intPct}% of balance/yr</div>
                    <div style={{width:Math.min((r.interestAnual/(data[data.length-1]?.interestAnual||1))*60,60),height:2,background:T.green,borderRadius:2,opacity:0.5}}/>
                  </div>
                </td>
                <td style={{padding:"10px 16px",textAlign:"right",background:`${T.green}04`}}>
                  <Mn sz={12} c={intAhead?T.green:`${T.green}99`}>{fmtCalc(r.interest)}</Mn>
                  <div style={{fontSize:9,color:T.muted,marginTop:2}}>{r.balance>0?((r.interest/r.balance)*100).toFixed(0):0}% of balance</div>
                </td>
                <td style={{padding:"10px 16px",textAlign:"right"}}>
                  <Mn sz={hi?14:12} c={hi?T.gold:T.text} s={hi?{fontWeight:700}:{}}>{fmtCalc(r.balance)}</Mn>
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
              <td style={{padding:"12px 16px",textAlign:"right"}}><Mn sz={12} c={T.blue}>{fmtCalc(annualContrib*cfg.years)}</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right",background:`${T.green}10`}}><Mn sz={12} c={T.muted}>—</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right",background:`${T.green}06`}}><Mn sz={14} c={T.green} s={{fontWeight:700}}>{fmtCalc(last.interest||0)}</Mn></td>
              <td style={{padding:"12px 16px",textAlign:"right"}}><Mn sz={14} c={T.gold} s={{fontWeight:700}}>{fmtCalc(last.balance||0)}</Mn></td>
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
          {icon:"🧬",title:lang==="es"?"Descubre tu ADN Inversor":"Discover Your Investor DNA",desc:lang==="es"?"8 preguntas rápidas. La IA descubre tu perfil y te construye un portafolio personalizado.":"Take our 8-question quiz and get a Conservative, Moderate, or Aggressive profile with a personalized AI portfolio.",cta:lang==="es"?"Tomar el Quiz →":"Take the Quiz →",tab:"profile",color:T.purple},
          {icon:"🎯",title:lang==="es"?"Analizar una Acción":"Analyze a Specific Stock",desc:lang==="es"?"Escribe cualquier ticker y obtén un score de calidad, análisis del moat y consenso de Wall Street.":"Enter any ticker and get a quality score, moat analysis, and Wall Street consensus.",cta:lang==="es"?"Analizar →":"Analyze →",tab:"score",color:T.gold},
          {icon:"📁",title:lang==="es"?"Revisar Mi Portafolio":"Audit Your Portfolio",desc:lang==="es"?"¿Ya tienes acciones? Sube tus posiciones y la IA te dice qué mantener, comprar más o vender.":"Already invested? Upload your positions and our AI will tell you what to hold, buy more, or sell.",cta:lang==="es"?"Analizar →":"Analyze →",tab:"portfolio",color:T.green},
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
  const isEs=lang==="es";
  const RATE=10;
  const [age,setAge]=useState(30);
  const [goal,setGoal]=useState(1000000);
  const [monthly,setMonthly]=useState(300);

  const r=(RATE/100)/12;

  const monthsToGoal=monthly>0?Math.log(1+goal*r/monthly)/Math.log(1+r):Infinity;
  const reachAge=isFinite(monthsToGoal)?Math.round(age+monthsToGoal/12):null;
  const yearsToGoal=isFinite(monthsToGoal)?Math.round(monthsToGoal/12):null;
  const yearsLeft=65-age;
  const n=yearsLeft*12;
  const neededMonthly=n>0?Math.round(goal*r/(Math.pow(1+r,n)-1)):Infinity;
  const neededDaily=Math.ceil(neededMonthly/30);
  const neededAt5=((65-(age+5))*12)>0?Math.round(goal*r/(Math.pow(1+r,(65-(age+5))*12)-1)):Infinity;
  const neededAt10=((65-(age+10))*12)>0?Math.round(goal*r/(Math.pow(1+r,(65-(age+10))*12)-1)):Infinity;

  const canReach=reachAge&&reachAge<=85;
  const resultColor=canReach&&reachAge<=65?T.green:canReach?T.gold:T.red;

  // Currency-aware formatter — no exchange rate multiplication (inputs are in display currency)
  const gFmt=n=>{
    if(!n&&n!==0)return`${_currency.symbol}0`;
    const sign=n<0?"-":"";
    return`${sign}${_currency.symbol}${Math.round(Math.abs(n)).toLocaleString(_currency.locale)}`;
  };
  const dailyFmt=n=>`${_currency.symbol}${Math.ceil(Math.abs(n))}`;

  // Slider ranges adapt to currency (COP needs much larger values)
  const isCOP=_currency.code==="COP";
  const goalMin=isCOP?100_000_000:100_000;
  const goalMax=isCOP?5_000_000_000:5_000_000;
  const goalStep=isCOP?50_000_000:50_000;
  const goalDefault=isCOP?4_000_000_000:1_000_000;
  const monthlyMin=isCOP?200_000:50;
  const monthlyMax=isCOP?20_000_000:5_000;
  const monthlyStep=isCOP?100_000:50;
  const monthlyDefault=isCOP?1_200_000:300;

  // Slider labels
  const goalLabel1=isCOP?"$100M":"$100K";
  const goalLabel2=isCOP?"$1,000M":"$1M";
  const goalLabel3=isCOP?"$5,000M":"$5M";
  const moLabel1=isCOP?"$200K":isEs?"$50":"$50";
  const moLabel2=isCOP?"$2M":isEs?"$500":"$500";
  const moLabel3=isCOP?"$20M":isEs?"$5,000":"$5,000";

  return<Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.goldDim}44`,padding:0,overflow:"hidden"}}>
    {/* Header */}
    <div style={{textAlign:"center",padding:"28px 24px 20px",borderBottom:`1px solid ${T.border}33`}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.gold}15`,border:`1px solid ${T.goldDim}`,borderRadius:20,padding:"5px 14px",marginBottom:14}}>
        <span style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>{isEs?"🎯 Tu Plan Personal de Riqueza":"🎯 Your Personal Wealth Plan"}</span>
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.text,marginBottom:8,fontWeight:700}}>
        {isEs?"¿Cuándo alcanzarás ":"When will "}<span style={{color:T.gold}}>{isEs?"tu":"you"}</span>{isEs?" meta?":" reach your goal?"}
      </div>
      <div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>
        {isEs?<>Al <strong style={{color:T.green}}>{RATE}% anual</strong> (promedio histórico S&P 500), con capitalización mensual.</>
              :<>At <strong style={{color:T.green}}>{RATE}% annual</strong> (S&P 500 historical average), compounded monthly.</>}
      </div>
    </div>

    {/* 3 inputs */}
    <div className="kpi-3" style={{padding:"24px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,borderBottom:`1px solid ${T.border}33`,background:`${T.accent}66`}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>{isEs?"🎂 Tu edad actual":"🎂 Your current age"}</span>
          <Mn sz={14} c={T.gold} s={{fontWeight:700}}>{age} {isEs?"años":"years old"}</Mn>
        </div>
        <input type="range" min={18} max={60} step={1} value={age} onChange={e=>setAge(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>18</span><span>40</span><span>60</span>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>{isEs?"🎯 Tu meta de riqueza":"🎯 Your wealth goal"}</span>
          <Mn sz={14} c={T.gold} s={{fontWeight:700}}>{gFmt(goal)}</Mn>
        </div>
        <input type="range" min={goalMin} max={goalMax} step={goalStep} value={Math.min(goal,goalMax)} onChange={e=>setGoal(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>{goalLabel1}</span><span>{goalLabel2}</span><span>{goalLabel3}</span>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>{isEs?"💵 Ahorro mensual":"💵 Monthly savings"}</span>
          <Mn sz={14} c={T.green} s={{fontWeight:700}}>{gFmt(monthly)}/{isEs?"mes":"mo"} · ~{dailyFmt(monthly/30)}/{isEs?"día":"day"}</Mn>
        </div>
        <input type="range" min={monthlyMin} max={monthlyMax} step={monthlyStep} value={Math.min(monthly,monthlyMax)} onChange={e=>setMonthly(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>{moLabel1}</span><span>{moLabel2}</span><span>{moLabel3}</span>
        </div>
      </div>
    </div>

    {/* Main result */}
    <div style={{padding:"28px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* Result A */}
        <div style={{background:canReach?`${resultColor}10`:`${T.red}08`,border:`2px solid ${resultColor}44`,borderRadius:16,padding:"22px 24px",textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
            {isEs?`Ahorrando ${gFmt(monthly)}/mes, llegas a ${gFmt(goal)} a los`:`Saving ${gFmt(monthly)}/mo, you reach ${gFmt(goal)} at`}
          </div>
          {canReach
            ?<>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,color:resultColor,fontWeight:700,lineHeight:1}}>
                {reachAge}
              </div>
              <div style={{fontSize:14,color:T.muted,marginTop:6}}>
                {isEs?`años · en `:"years old · in "}<span style={{color:resultColor,fontWeight:600}}>{yearsToGoal} {isEs?"años":"years"}</span>
              </div>
              {reachAge<=65&&<div style={{marginTop:10,fontSize:11,color:T.green,padding:"4px 12px",background:`${T.green}15`,borderRadius:20,display:"inline-block"}}>✓ {isEs?"Antes de la edad de jubilación":"Before retirement age"}</div>}
              {reachAge>65&&<div style={{marginTop:10,fontSize:11,color:T.gold,padding:"4px 12px",background:`${T.gold}15`,borderRadius:20,display:"inline-block"}}>⚡ {isEs?"Aumenta el ahorro para lograrlo antes":"Increase savings to reach it sooner"}</div>}
            </>
            :<>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.red,fontWeight:700,marginBottom:6}}>{isEs?"No alcanzable":"Not reachable"}</div>
              <div style={{fontSize:12,color:T.muted}}>{isEs?"Con este ahorro — aumenta el monto mensual":"at this savings rate — increase your monthly amount"}</div>
            </>}
        </div>

        {/* Result B */}
        <div style={{background:`${T.gold}08`,border:`1px solid ${T.goldDim}44`,borderRadius:16,padding:"22px 24px",textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>
            {isEs?`Para llegar a ${gFmt(goal)} a los 65, ahorra`:`To reach ${gFmt(goal)} by age 65, save`}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:52,color:T.gold,fontWeight:700,lineHeight:1}}>
            {isFinite(neededMonthly)?gFmt(neededMonthly):"—"}
          </div>
          <div style={{fontSize:14,color:T.muted,marginTop:6}}>{isEs?"por mes":"per month"} · ~{dailyFmt(neededDaily)}/{isEs?"día":"day"}</div>
          <div style={{marginTop:10,fontSize:11,color:T.muted}}>
            {yearsLeft} {isEs?"años de inversión restantes":"years of investing remaining"}
          </div>
          {monthly>=neededMonthly&&<div style={{marginTop:8,fontSize:11,color:T.green,padding:"4px 12px",background:`${T.green}15`,borderRadius:20,display:"inline-block"}}>✓ {isEs?"¡Ya vas por buen camino!":"You're already on track!"}</div>}
        </div>
      </div>

      {/* Cost of waiting */}
      {isFinite(neededAt5)&&isFinite(neededAt10)&&<div style={{background:T.accent,borderRadius:12,padding:"16px 20px",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:12}}>⏰ {isEs?"El costo de esperar":"The cost of waiting"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,textAlign:"center"}}>
          {[
            {l:isEs?`Empezando hoy (${age} años)`:`Starting now (age ${age})`,v:neededMonthly,c:T.green,highlight:true},
            {l:isEs?`Espero 5 años (${age+5} años)`:`Wait 5 years (age ${age+5})`,v:neededAt5,c:T.gold,highlight:false},
            {l:isEs?`Espero 10 años (${age+10} años)`:`Wait 10 years (age ${age+10})`,v:neededAt10,c:T.red,highlight:false},
          ].map(({l,v,c,highlight})=>(
            <div key={l} style={{padding:"10px 12px",background:highlight?`${T.green}10`:T.card,borderRadius:10,border:`1px solid ${c}22`}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,lineHeight:1.4}}>{l}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700}}>{gFmt(v)}/{isEs?"mes":"mo"}</div>
              {!highlight&&<div style={{fontSize:10,color:c,marginTop:3}}>+{gFmt(v-neededMonthly)}/{isEs?"mes más":"mo more"}</div>}
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.7}}>
          {isEs
            ?<>Cada año que esperas, necesitas <span style={{color:T.red,fontWeight:600}}>más dinero por mes</span> para llegar a la misma meta. Empieza hoy con <span style={{color:T.green,fontWeight:600}}>{gFmt(neededMonthly)}/mes</span> — eso son ~{dailyFmt(neededDaily)}/día.</>
            :<>Every year you wait, you need <span style={{color:T.red,fontWeight:600}}>more money per month</span> to reach the same goal. Start today with <span style={{color:T.green,fontWeight:600}}>{gFmt(neededMonthly)}/month</span> — that's ~{dailyFmt(neededDaily)}/day.</>}
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:6}}>{LW.whatif_title} <span style={{color:T.gold}}>$10,000 USD</span>...</div>
      <div style={{fontSize:13,color:T.muted}}>{LW.whatif_sub}</div>
    </div>
    <AdBanner size="leaderboard"/>
    <div className="g-2 g-sm-1" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {SCENARIOS.map(s=><Card key={s.ticker}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,marginBottom:2}}>{s.name}</div><div style={{fontSize:10,color:T.muted}}>{s.ticker} · since {s.year}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:s.color,fontWeight:700}}>{fmtUSD(s.finalValue)}</div><div style={{fontSize:10,color:s.color}}>CAGR ~{s.cagr}%</div></div>
        </div>
        <div style={{height:3,background:T.border,borderRadius:2,marginBottom:8}}><div style={{height:"100%",width:`${Math.min((s.finalValue/4000000)*100,100)}%`,background:s.color,borderRadius:2}}/></div>
        <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{typeof s.desc==="object"?s.desc[lang]||s.desc.en:s.desc}</div>
        <div style={{marginTop:10,padding:"6px 10px",background:T.accent,borderRadius:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:T.muted}}>$10,000 USD invested</span>
          <Mn sz={11} c={s.color} s={{fontWeight:700}}>→ {fmtUSD(s.finalValue)}</Mn>
        </div>
      </Card>)}
    </div>
    <div className="compound-layout" style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:18}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:16}}>{LW.whatif_custom}</div>
        <Lbl>{LW.whatif_capital}</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace"}}>$</span><input type="number" value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/></div>
        <input type="range" min={1000} max={1000000} step={1000} value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value))} style={{marginBottom:14}}/>
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

${lang==="es"?"IMPORTANT: ALL text fields must be in SPANISH. Keep JSON keys in English.":"Respond in English."}

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
  "portfolioImplication":"<2 sentences: what this cycle means for long-term patient investors focused on quality businesses>",
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

function ScoreTab({m,setM,moat,setMoat,company,setCompany,sector,setSector,onAnalysis,canAnalyze,onGoToProfile,lang="en"}){
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
      const isLatamStock = getLatamSymbol(tickerToUse) !== null;

      const [fhResult,aiResult]=await Promise.allSettled([
        callFinnhub(tickerToUse),
        // For LATAM stocks, use web_search tool inside callAI via direct fetch
        isLatamStock
          ? (async()=>{
              const r=await fetch("https://api.anthropic.com/v1/messages",{
                method:"POST",
                headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
                body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1800,
                  tools:[{"type":"web_search_20250305","name":"web_search"}],
                  messages:[{role:"user",content:`Search for recent data on "${tickerToUse}" from bloomberglinea.com, valoraanalitik.com, stockanalysis.com (query: "${tickerToUse} resultados financieros dividendo 2025 2026"). Then act as a value investing analyst and respond ONLY with valid JSON (no markdown): {"metrics":{"revenueCAGR":<n>,"fcfGrowth":<n>,"tamGrowth":<n>,"roic":<n>,"grossMargin":<n>,"opMargin":<n>,"fcfMarginPct":<n>,"debtEbitda":<n>,"interestCover":<n>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<s>","summary":"<2-3 sentences>","catalysts":["<1>","<2>","<3>"],"keyMetrics":{"revenueGrowth5y":"<v>","roicDisplay":"<v>","fcfGrowthDisplay":"<v>","fcfMarginDisplay":"<v>","debtEquity":"<v>","epsGrowth":"<v>"}}`}]
                })
              });
              const d=await r.json();
              const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/g,"").trim();
              return JSON.parse(t);
            })()
          : callAI(`You are a value investing analyst using the patient investor method (quality businesses, competitive advantages, long-term compounding). Analyze "${tickerToUse}" using real data up to your knowledge cutoff. FCF metric: use FCF GROWTH RATE (3-5Y CAGR %) not ratio. Respond ONLY with valid JSON, no markdown: {"metrics":{"revenueCAGR":<number>,"fcfGrowth":<FCF CAGR %>,"tamGrowth":<number>,"roic":<number>,"grossMargin":<number>,"opMargin":<number>,"fcfMarginPct":<number>,"debtEbitda":<number>,"interestCover":<number>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<sector>","summary":"<2-3 sentences thesis and key risk>","catalysts":["<1>","<2>","<3>"],"keyMetrics":{"revenueGrowth5y":"<e.g. +56% CAGR>","roicDisplay":"<e.g. 18%>","fcfGrowthDisplay":"<e.g. +67% CAGR>","fcfMarginDisplay":"<e.g. 19%>","debtEquity":"<e.g. 0.2x>","epsGrowth":"<e.g. +38%>"}}`),
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
      <span style={{fontSize:12,color:T.gold}}>{lang==="es"?LS.score_label:"🎯 Analizador de Acciones — Los 8 Filtros del Inversor Paciente · Consenso Wall Street · 3 análisis gratis"}</span>
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
      {/* ── DISCLAIMER BADGE ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:`${T.gold}08`,border:`1px solid ${T.gold}22`,borderRadius:8,marginBottom:12}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:T.gold,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span style={{fontSize:10,color:T.muted,lineHeight:1.5}}>
          {lang==="es"
            ?"Este análisis es educativo y no constituye asesoría financiera certificada. Toda inversión implica riesgo de pérdida. Consulta un asesor antes de invertir. Inversoria no tiene afiliación con ningún inversor, fondo o entidad financiera mencionada como referencia metodológica."
            :"This analysis is educational and does not constitute certified financial advice. All investments involve risk of loss. Consult an advisor before investing."}
        </span>
      </div>
      {/* ── LIVE FINNHUB CONSENSUS — real-time data ── */}
      {fh&&<div style={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`2px solid ${ratingColor(fh.rating)}44`,borderRadius:14,padding:20,marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          {fh.isAiEstimate
          ?<span style={{fontSize:10,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>🤖 Consenso Estimado por IA · Wall Street</span>
          :<div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:T.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#34d399"/></svg>
                {lang==="es"?"Datos en tiempo real · Wall Street":"Live data · Wall Street consensus"}
              </span>
              <span style={{fontSize:9,color:T.muted,background:T.accent,border:`1px solid ${T.border}`,borderRadius:4,padding:"1px 6px"}}>
                Finnhub · {lang==="es"?"Analistas reales":"Real analysts"}
              </span>
            </div>}
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
          <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Score de Calidad</div>
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
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold}}>{cat==="growth"?"📈 Crecimiento":cat==="profitability"?"💎 Rentabilidad":cat==="cashflow"?"💵 Flujo de Caja":"🏦 Balance General"}</div>
            {locked&&<span style={{fontSize:9,color:T.muted,background:T.accent,padding:"2px 6px",borderRadius:4}}>🔒 locked</span>}
          </div>
          {cs.map(c=><MRow key={c.key} c={c} value={m[c.key]||0} onChange={(k,v)=>setM(p=>({...p,[k]:v}))} locked={locked} lang={lang}/>)}
        </Card>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🏰 La Fosa del Negocio</div>
          <div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:10}}/><Radar dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/></RadarChart></ResponsiveContainer></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
            {MOAT_KEYS.map(k=><div key={k}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3,color:T.muted}}><span>{moatLabel(k,lang)}</span><Mn sz={10} c={T.gold}>{moat[k]}/5</Mn></div>
              <div style={{display:"flex",gap:3,opacity:locked?0.45:1}}>{[1,2,3,4,5].map(v=><div key={v} onClick={()=>!locked&&setMoat(p=>({...p,[k]:v}))} style={{flex:1,height:5,borderRadius:3,cursor:locked?"not-allowed":"pointer",background:v<=moat[k]?T.gold:T.border,transition:"background 0.2s"}}/>)}</div>
            </div>)}
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:10}}>{lang==="es"?"📋 Los 8 Filtros del Inversor Paciente":"📋 The 8 Filters of the Patient Investor"}</div>
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
        <div style={{fontSize:12,color:T.muted,marginBottom:8}}>{lang==="es"?"¿Cuánto quieres invertir?":"How much would you like to invest?"}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:T.accent,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.border}`}}>
          <span style={{color:T.muted,fontFamily:"monospace",fontSize:16}}>$</span>
          <input type="number" value={amount} min={1000} step={1000} onChange={e=>setAmount(parseFloat(e.target.value)||1000)}
            className="amount-input" style={{flex:1,fontWeight:700,fontSize:16,textAlign:"center"}}/>
        </div>
      </div>

      {/* FREE badge */}
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.green}12`,border:`1px solid ${T.green}33`,borderRadius:20,padding:"5px 14px",marginBottom:12}}>
        <span style={{fontSize:11,color:T.green}}>{lang==="es"?"✓ Perfil de Riesgo GRATIS — Portafolio IA es Premium":"✓ Risk Profile is FREE — AI Portfolio is Premium"}</span>
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold" onClick={getPortfolio} disabled={loading} style={{fontSize:15,padding:"14px 32px",borderRadius:12}}>
          {loading?<><span className="sp">⟳</span> Building your portfolio...</>:<>{lang==="es"?"🤖 Obtener Mi Portafolio IA":"🤖 Get My AI Portfolio"} <span style={{fontSize:12,opacity:0.8}}>{"— Premium"}</span></>}
        </button>
        <button className="btn btn-outline" onClick={reset} style={{padding:"14px 20px",borderRadius:12}}>{lang==="es"?"Volver al Quiz":"Retake Quiz"}</button>
      </div>
      {err&&<div style={{marginTop:12,padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}
      {showRiskPaywall&&<PaywallModal context="riskPortfolio" onClose={()=>setShowRiskPaywall(false)}/>}

      {/* CTA → Portfolio Tracker */}
      <div style={{marginTop:16,padding:"20px 24px",background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.green,marginBottom:4}}>{lang==="es"?"📁 ¿Ya tienes acciones? Analicemos tu portafolio":"📁 Already have stocks? Let's analyze your portfolio"}</div>
          <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>
            {lang==="es"
              ?<>Sube tus posiciones y la IA evaluará si tu portafolio actual coincide con tu perfil <strong style={{color:T.text}}>{pLabel(profile,lang)}</strong> — y te dirá exactamente qué comprar, mantener o vender.</>
              :<>Upload your positions and our AI will evaluate if your current portfolio matches your <strong style={{color:T.text}}>{pLabel(profile,lang)}</strong> profile — and tell you exactly what to buy, hold, or sell.</>}
          </div>
        </div>
        <button className="btn btn-gold" onClick={onGoToPortfolio} style={{fontSize:14,padding:"12px 24px",borderRadius:10,whiteSpace:"nowrap",flexShrink:0}}>
          {lang==="es"?"📁 Analizar Mi Portafolio →":"📁 Analyze My Portfolio →"}
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
        {lang==="es"?"✅ ¿Compraste estas acciones?":"✅ Did you buy these stocks?"}
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
          {lang==="es"?"📁 Analizar Mi Portafolio →":"📁 Analyze My Portfolio →"}
        </button>
        <div style={{fontSize:10,color:T.muted,marginTop:8}}>Your profile score is saved automatically</div>
      </div>
    </div>
  </div>;

  return null;
}

// ── REBALANCE + DCA COMPONENT ────────────────────────────────────────────────
// DCA tier logic — position sizing by cash amount
function getDCATier(cashAmt){
  if(cashAmt<100)  return{maxPos:1,minPos:40, label:"micro", warn:true,  warnKey:"comisiones se comerían el retorno con más de 1-2 posiciones"};
  if(cashAmt<300)  return{maxPos:2,minPos:60, label:"small", warn:true,  warnKey:"con este monto, 2 posiciones es lo óptimo"};
  if(cashAmt<1000) return{maxPos:4,minPos:80, label:"medium",warn:false, warnKey:null};
  if(cashAmt<3000) return{maxPos:6,minPos:150,label:"large", warn:false, warnKey:null};
  return              {maxPos:8,minPos:200,label:"xl",    warn:false, warnKey:null};
}

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
${lang==="es"?"IMPORTANT: All text fields (summary, reason, urgency label) must be in SPANISH. Keep JSON keys in English.":""}
Current portfolio: ${summary}. Total value: $${Math.round(totalValue).toLocaleString()}.
Urgency values must be: ${lang==="es"?"Urgente|Moderado|Bajo":"Urgent|Moderate|Low"}
Suggest a rebalancing plan. Respond ONLY with valid JSON, no markdown:
{"actions":[{"ticker":"<ticker>","action":"<Reduce|Increase|Hold|Exit>","currentPct":<number>,"targetPct":<number>,"reason":"<1 sentence in ${lang==="es"?"Spanish":"English"}>"}],"summary":"<2 sentences>","urgency":"<${lang==="es"?"Urgente|Moderado|Bajo":"Urgent|Moderate|Low"}>"}`);
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
    const cashAmt=parseFloat(cash);
    const tier=getDCATier(cashAmt);
    const dcaSummary=positions.map(p=>{
      const w=totalValue>0?((p.currentValue||p.totalCostBasis)/totalValue*100).toFixed(1):0;
      const pnlStr=p.pnlPct!=null?`P&L: ${p.pnlPct>=0?"+":""}${p.pnlPct.toFixed(1)}%`:"P&L: unknown";
      const priceStr=p.currentPrice?`current: $${p.currentPrice.toFixed(2)}`:"";
      return`${p.ticker}: ${w}% weight | avg cost: $${p.avgCost.toFixed(2)}${priceStr?` | ${priceStr}`:""} | ${pnlStr} | value: $${Math.round(p.currentValue||p.totalCostBasis).toLocaleString()}`;
    }).join("\n");
    try{
      const r=await callAI(`You are an expert DCA investment advisor using patient investor principles (quality businesses at reasonable prices, long-term compounding). Investor profile: ${profileLabel}.
${lang==="es"?"IMPORTANT: All text fields (summary, reason, topPick, action labels) must be in SPANISH. Keep JSON keys and action values in English.":""}

CURRENT PORTFOLIO:
${dcaSummary}

Total portfolio value: $${Math.round(totalValue).toLocaleString()}
Cash to deploy: $${cashAmt.toLocaleString()}

POSITION SIZING RULES FOR THIS CASH AMOUNT ($${cashAmt}):
- Maximum positions to suggest: ${tier.maxPos} (larger amounts allow more diversification; at this amount, spreading thinner destroys returns via commissions)
- Minimum per position: $${tier.minPos} (broker commissions in LATAM are ~$2-10/trade; below this minimum the commission cost % is too high)
- Do NOT suggest more than ${tier.maxPos} positions total, including existing and new
- ${tier.maxPos<=2?"Focus on the 1-2 highest conviction opportunities only":"Diversify across available positions respecting the minimum per-position amount"}

STRATEGY RULES:
- Positions DOWN > 10% (negative P&L): Consider averaging down IF the business is fundamentally strong
- Positions UP > 30%: Add only if still undervalued; otherwise wait for pullback
- Positions FLAT (-10% to +10%): Good opportunity to add if high conviction
- ${tier.maxPos>=3?"YOU MUST suggest 1-2 NEW positions if the portfolio has fewer than 8 positions OR lacks sector diversification":"Only suggest NEW positions if cash allows — do not force diversification at the expense of position size"}

QUALITY STOCKS UNIVERSE (use these for new position suggestions — pick based on profile & gaps):
US TECH/GROWTH: NVDA, MSFT, AAPL, GOOGL, META, AMZN, ADBE, CRM, ASML, TSM
US VALUE/DIVIDEND: BRK.B, JPM, JNJ, PG, KO, V, MA, UNH, HD, MCD
US SMALL/MID: DECK, CELH, CROX, ONON, ELF, VIST, TRGP
LATAM: EC (Ecopetrol), PFBCOLOM (Bancolombia pref), ISA, GRUPOSURA, NUTEC, WALMEX, FEMSA
ETFs: SPY, QQQ, VTI, SCHD, VWO, ILF (Latin America)
SECTOR GAPS TO FILL: If no healthcare → JNJ or UNH. If no financials → JPM or V. If no energy → EC or XOM. If no consumer → PG or MCD

Respond ONLY with valid JSON, no markdown:
{"allocations":[{"ticker":"<ticker>","amount":<dollars>,"pct":<% of cash>,"reason":"<specific: mention P&L, avg cost, and DCA rationale>","isNew":<bool>,"action":"<Average Down|Add to Winner|New Position|Maintain Weight>"}],"summary":"<2-3 sentences: overall strategy and key rationale>","topPick":"<ticker + 1 sentence why it is the best DCA opportunity right now>","totalDeployed":<number>}`);
      setDca(r);incDCACount();
    }catch(e){setErr("DCA error: "+e.message);}
    setLoadingDCA(false);
  };

  const actionColor=a=>a==="Reduce"||a==="Exit"?T.red:a==="Increase"?T.green:T.gold;

  return<Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.blue}33`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.blue}}>{lang==="es"?"⚖️ Rebalanceo & Asesor DCA":"⚖️ Rebalance & DCA Advisor"}</div>
      <span style={{fontSize:10,padding:"3px 9px",borderRadius:12,background:`${T.blue}15`,color:T.blue,border:`1px solid ${T.blue}33`,fontWeight:600}}>
        {lang==="es"?"INCLUIDO":"INCLUDED"}
      </span>
    </div>
    <div style={{fontSize:12,color:T.muted,marginBottom:18,lineHeight:1.7}}>
      {lang==="es"?<>Obtén recomendaciones IA para rebalancear tu portafolio según tu perfil <strong style={{color:savedProfile?.color||T.gold}}>{profileLabel}</strong>, o distribuye efectivo nuevo mediante Dollar Cost Averaging.</>:<>Get AI recommendations to rebalance your portfolio to match your <strong style={{color:savedProfile?.color||T.gold}}>{profileLabel}</strong> profile, or distribute new cash strategically via Dollar Cost Averaging.</>}
    </div>

    {err&&<div style={{padding:"8px 12px",background:`${T.red}15`,border:`1px solid ${T.red}33`,borderRadius:8,fontSize:12,color:T.red,marginBottom:12}}>{err}</div>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {/* Rebalance */}
      <div style={{background:T.accent,borderRadius:12,padding:16,border:`1px solid ${T.border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:6}}>{lang==="es"?"🔄 Rebalancear Portafolio":"🔄 Rebalance Portfolio"}</div>
        <div style={{fontSize:11,color:T.muted,marginBottom:14,lineHeight:1.6}}>
          {lang==="es"?<>La IA analizará tus pesos actuales y sugerirá qué posiciones reducir, aumentar o salir para alinear con tu perfil <strong style={{color:T.text}}>{profileLabel}</strong>.</>:<>AI will analyze your current weights and suggest which positions to reduce, increase, or exit to align with your <strong style={{color:T.text}}>{profileLabel}</strong> profile.</>}
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
            <span style={{fontSize:11,color:T.muted}}>{lang==="es"?"Urgencia:":"Urgency:"}</span>
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
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.green,marginBottom:6}}>{lang==="es"?"💵 Asesor DCA — Invertir Cash":"💵 DCA Advisor — Deploy Cash"}</div>
        <div style={{fontSize:11,color:T.muted,marginBottom:10,lineHeight:1.6}}>
          {lang==="es"?"¿Tienes efectivo nuevo para invertir? Dile a la IA cuánto tienes y lo distribuirá óptimamente — agregando a ganadoras, promediando en posiciones de calidad.":"Have new cash to invest? Tell the AI how much and it will distribute it optimally across your portfolio — adding to winners, averaging down on quality positions."}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1,background:T.card,borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={cash} onChange={e=>setCash(e.target.value)} placeholder="500" min={0} step={100}
              style={{border:"none",background:"none",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,outline:"none",width:"100%"}}/>
          </div>
          <span style={{fontSize:11,color:T.muted,alignSelf:"center",whiteSpace:"nowrap"}}>{lang==="es"?"disponible":"available"}</span>
        </div>
        {/* Tier indicator — shows dynamically as user types */}
        {cash&&parseFloat(cash)>0&&(()=>{
          const t=getDCATier(parseFloat(cash));
          const isEs=lang==="es";
          return<div style={{
            marginBottom:12,padding:"8px 12px",borderRadius:8,fontSize:11,lineHeight:1.6,
            background:t.warn?`${T.gold}10`:`${T.green}10`,
            border:`1px solid ${t.warn?T.goldDim+"44":T.green+"33"}`,
            color:t.warn?T.gold:T.green,
          }}>
            <div style={{fontWeight:600,marginBottom:2}}>
              {t.warn?"⚠️":"✓"} {t.maxPos} {isEs?`posición${t.maxPos>1?"es":""} máx`:`position${t.maxPos>1?"s":""} max`}
              {" · "}${t.minPos} {isEs?"mín por posición":"min per position"}
            </div>
            {t.warn&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>
              {isEs?t.warnKey:"Commissions would eat into returns with more positions at this amount"}
            </div>}
            {!t.warn&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>
              {isEs?"Monto óptimo para diversificar correctamente":"Good amount for proper diversification"}
            </div>}
          </div>;
        })()}
        <button className="btn btn-gold" onClick={runDCA} disabled={loadingDCA||!cash} style={{width:"100%",padding:"11px 0",fontSize:13,borderRadius:9,background:T.green,color:"#0e0e1a"}}>
          {loadingDCA
            ?<><span className="sp">⟳</span> {lang==="es"?"Planificando...":"Planning..."}</>
            :canUseDCAFree()
              ?`💵 ${lang==="es"?"Obtener Plan DCA":"Get DCA Plan"} (${DCA_FREE_LIMIT-getDCACount()} ${lang==="es"?"gratis":"free"})`
              :`🔒 ${lang==="es"?"Plan DCA — Premium":"DCA Plan — Premium"}`}
        </button>
        {dca&&<div style={{marginTop:14}}>
          <div style={{fontSize:11,color:T.muted,lineHeight:1.6,marginBottom:12}}>{dca.summary}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {/* Top Pick card */}
            {dca.topPick&&<div style={{padding:"10px 12px",background:`${T.gold}12`,border:`1px solid ${T.goldDim}`,borderRadius:10,marginBottom:4,display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{fontSize:14,flexShrink:0}}>⭐</span>
              <div>
                <div style={{fontSize:10,color:T.gold,fontWeight:700,marginBottom:2}}>{lang==="es"?"Mejor Oportunidad DCA":"Best DCA Opportunity"}</div>
                <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{dca.topPick}</div>
              </div>
            </div>}
            {dca.allocations?.map(({ticker,amount,pct,reason,isNew,action})=>{
              const ac=action==="Average Down"?T.blue:action==="Add to Winner"?T.green:action==="New Position"?T.purple:T.gold;
              const al=action==="Average Down"?(lang==="es"?"⬇️ Promediar":"⬇️ Avg Down"):action==="Add to Winner"?(lang==="es"?"🚀 Agregar":"🚀 Add to Winner"):action==="New Position"?(lang==="es"?"🆕 Nueva":"🆕 New Position"):(lang==="es"?"⚖️ Mantener":"⚖️ Hold Weight");
              return(
              <div key={ticker} style={{background:T.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${ac}33`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Mn sz={13} c={T.text} s={{fontWeight:700}}>{ticker}</Mn>
                    <span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:`${ac}20`,color:ac,fontWeight:700}}>{al}</span>
                    {isNew&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:`${T.purple}20`,color:T.purple,border:`1px solid ${T.purple}33`}}>NEW</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Mn sz={13} c={T.green} s={{fontWeight:700}}>${Math.round(amount).toLocaleString()}</Mn>
                    <span style={{fontSize:10,color:T.muted}}>{pct}%</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{reason}</div>
                <div style={{height:3,background:T.border,borderRadius:2,marginTop:6}}><div style={{height:"100%",width:`${pct}%`,background:ac,borderRadius:2,opacity:0.7}}/></div>
              </div>
            );})}
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



// ── TRANSACTION ENGINE ───────────────────────────────────────────────────────
function calcPositionsFromTxns(transactions){
  const posMap={};
  const sorted=[...transactions].sort((a,b)=>new Date(a.date)-new Date(b.date));
  for(const txn of sorted){
    if(!posMap[txn.ticker])posMap[txn.ticker]={ticker:txn.ticker,totalShares:0,avgCost:0,totalCostBasis:0,realizedPnL:0,entries:[]};
    const pos=posMap[txn.ticker];
    pos.entries.push(txn);
    if(txn.type==='sell'){
      const soldCost=txn.shares*pos.avgCost;
      pos.realizedPnL+=(txn.shares*txn.price)-soldCost;
      pos.totalShares=Math.max(0,pos.totalShares-txn.shares);
      pos.totalCostBasis=pos.totalShares*pos.avgCost;
    } else {
      const newTotalCost=pos.totalCostBasis+(txn.shares*(txn.price||txn.buyPrice||0));
      const newShares=pos.totalShares+txn.shares;
      pos.avgCost=newShares>0?newTotalCost/newShares:0;
      pos.totalShares=newShares;
      pos.totalCostBasis=newTotalCost;
    }
  }
  return Object.values(posMap);
}

// ── SELL MODAL ───────────────────────────────────────────────────────────────
function SellModal({position,onClose,onSell,lang="es"}){
  const [shares,setShares]=useState("");
  const [price,setPrice]=useState(position.currentPrice?position.currentPrice.toFixed(2):"");
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [err,setErr]=useState("");
  const isEs=lang==="es";
  const maxShares=position.totalShares;
  const proceeds=parseFloat(shares)*parseFloat(price)||0;
  const costBasis=parseFloat(shares)*position.avgCost||0;
  const realizedPnL=proceeds-costBasis;
  const pct=costBasis>0?((realizedPnL/costBasis)*100):0;
  const handleSell=()=>{
    const s=parseFloat(shares);const p=parseFloat(price);
    if(!s||s<=0){setErr(isEs?"Ingresa un número válido de acciones.":"Enter valid share count.");return;}
    if(s>maxShares+0.0001){setErr(isEs?`Máximo ${maxShares.toFixed(3)} acciones disponibles.`:`Max ${maxShares.toFixed(3)} shares available.`);return;}
    if(!p||p<=0){setErr(isEs?"Ingresa un precio de venta válido.":"Enter a valid sell price.");return;}
    onSell({shares:Math.min(s,maxShares),price:p,date});onClose();
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.card,border:`2px solid ${T.goldDim}`,borderRadius:16,padding:"28px 32px",maxWidth:420,width:"100%",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.gold,marginBottom:4}}>
          {isEs?"Registrar Venta":"Register Sale"} — <span style={{color:T.text}}>{position.ticker}</span>
        </div>
        <div style={{fontSize:11,color:T.muted,marginBottom:20}}>
          {isEs?"Disponibles:":"Available:"} <span style={{color:T.text,fontFamily:"'DM Mono',monospace"}}>{maxShares.toFixed(3)}</span> {isEs?"acciones":"shares"} · {isEs?"Costo prom.":"Avg cost:"} <span style={{color:T.gold,fontFamily:"'DM Mono',monospace"}}>${position.avgCost.toFixed(2)}</span>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:5}}>{isEs?"Número de acciones a vender":"Shares to sell"}</div>
          <div style={{display:"flex",gap:8}}>
            <input type="number" value={shares} onChange={e=>setShares(e.target.value)} placeholder={`ej: ${(maxShares/2).toFixed(3)}`} min={0.001} max={maxShares} step={0.001} style={{fontWeight:700,fontSize:15}}/>
            <button className="seg" onClick={()=>setShares(maxShares.toFixed(3))} style={{whiteSpace:"nowrap",fontSize:11,flexShrink:0}}>{isEs?"Vender todo":"Sell all"}</button>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:5}}>{isEs?"Precio de venta por acción (USD)":"Sell price per share (USD)"}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" min={0.01} step={0.01} style={{fontWeight:700,fontSize:15}}/>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:5}}>{isEs?"Fecha de la venta":"Sale date"}</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        {parseFloat(shares)>0&&parseFloat(price)>0&&(
          <div style={{padding:"12px 14px",background:realizedPnL>=0?`${T.green}10`:`${T.red}10`,border:`1px solid ${realizedPnL>=0?T.green:T.red}33`,borderRadius:10,marginBottom:16}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{isEs?"Vista previa":"Trade preview"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {l:isEs?"Ingresos":"Proceeds",v:`$${proceeds.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,c:T.text},
                {l:isEs?"Costo base":"Cost basis",v:`$${costBasis.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,c:T.muted},
                {l:"P&G Realizado",v:`${realizedPnL>=0?"+":""}$${Math.abs(realizedPnL).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,c:realizedPnL>=0?T.green:T.red},
                {l:"% Retorno",v:`${pct>=0?"+":""}${pct.toFixed(2)}%`,c:realizedPnL>=0?T.green:T.red},
              ].map(({l,v,c})=>(
                <div key={l} style={{background:T.accent,borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:c,fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {err&&<div style={{padding:"8px 12px",background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,marginBottom:12,border:`1px solid ${T.red}33`}}>{err}</div>}
        <button className="btn btn-gold" onClick={handleSell}
          style={{width:"100%",padding:"12px 0",fontSize:14,borderRadius:10,background:realizedPnL>=0?T.green:T.red,color:"#0e0e1a"}}>
          ✅ {isEs?`Confirmar — ${parseFloat(shares)||"?"} acciones a $${parseFloat(price)||"?"}`:`Confirm — ${parseFloat(shares)||"?"} shares at $${parseFloat(price)||"?"}`}
        </button>
      </div>
    </div>
  );
}

// ── TRANSACTION HISTORY ───────────────────────────────────────────────────────
function TxnHistory({entries,avgCost,lang="es"}){
  const [open,setOpen]=useState(false);
  const isEs=lang==="es";
  const sells=entries.filter(e=>e.type==='sell');
  const buys=entries.filter(e=>e.type!=='sell');
  if(!entries.length)return null;
  return(
    <div style={{marginTop:4}}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.muted,display:"flex",alignItems:"center",gap:4,padding:0}}>
        <span style={{fontSize:9}}>{open?"▲":"▼"}</span>
        {buys.length} {isEs?"compra":"buy"}{buys.length!==1?"s":""}{sells.length>0?` · ${sells.length} ${isEs?"venta":"sale"}${sells.length!==1?"s":""}` : ""}
      </button>
      {open&&(
        <div style={{marginTop:6,background:T.accent,borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead><tr style={{background:T.surface}}>
              {["Tipo","Acciones","Precio","Fecha","P&G"].map(h=>(
                <th key={h} style={{padding:"5px 8px",textAlign:"right",fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[...entries].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((e,i)=>{
                const isSell=e.type==='sell';
                const entryPrice=e.price||e.buyPrice||0;
                const pnl=isSell?(e.shares*entryPrice)-(e.shares*avgCost):null;
                return(
                  <tr key={e.id||i} style={{borderBottom:`1px solid ${T.border}22`}}>
                    <td style={{padding:"5px 8px",textAlign:"right"}}>
                      <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,fontWeight:600,background:isSell?`${T.red}18`:`${T.green}18`,color:isSell?T.red:T.green}}>
                        {isSell?(isEs?"VENTA":"SELL"):(isEs?"COMPRA":"BUY")}
                      </span>
                    </td>
                    <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.text}}>{e.shares.toFixed(3)}</td>
                    <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:T.gold}}>${entryPrice.toFixed(2)}</td>
                    <td style={{padding:"5px 8px",textAlign:"right",color:T.muted}}>{e.date||"—"}</td>
                    <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"'DM Mono',monospace",color:pnl!=null?(pnl>=0?T.green:T.red):T.muted}}>
                      {pnl!=null?`${pnl>=0?"+":""}$${Math.abs(pnl).toFixed(2)}`:"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ── BROKER IMPORT WIZARD ─────────────────────────────────────────────────────
const BROKER_LIST = [
  {id:"trii",  flag:"🇨🇴", name:"Trii",   hasCsv:false},
  {id:"hapi",  flag:"🇲🇽", name:"HAPI",   hasCsv:false},
  {id:"xtb",   flag:"🌎",  name:"XTB",    hasCsv:true},
  {id:"ibkr",  flag:"🇺🇸", name:"IBKR",   hasCsv:true},
  {id:"other", flag:"📋",  name:"Otro",   hasCsv:true},
];

function BrokerImportWizard({lang,importMode,setImportMode,importErr,setImportErr,
  previewData,setPreviewData,parseCSV,parsePaste,confirmImport,
  pasteText,setPasteText,transactions,setTransactions,saveTxns}){
  const isEs=lang==="es";
  const [broker,setBroker]=useState(null);
  const [aiMode,setAiMode]=useState("screenshot"); // screenshot | paste | manual
  const [aiLoading,setAiLoading]=useState(false);
  const [aiErr,setAiErr]=useState("");

  // ── AI Screenshot reader ──────────────────────────────────────────────────
  const readScreenshot=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    setAiLoading(true);setAiErr("");setPreviewData(null);
    try{
      const b64=await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=rej;
        r.readAsDataURL(file);
      });
      const mediaType=file.type||"image/jpeg";
      const resp=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:mediaType,data:b64}},
(()=>{
              const copRate=Math.round(CURRENCIES.COP?.rate||3700);
              const mxnRate=(CURRENCIES.MXN?.rate||17).toFixed(1);
              return{type:"text",text:`You are extracting a stock portfolio from a broker app screenshot (${broker==="trii"?"Trii Colombia":broker==="hapi"?"HAPI":"broker app"}).
Return ONLY a valid JSON array, no markdown, no explanation:
[{"ticker":"AAPL","shares":10.5,"currentValue":1800,"pnlPct":20.5,"date":"2024-01-15"},...]

Rules:
- ticker: use standard exchange symbol. Map Trii-specific tickers: BRKBCO→BRK.B, PFECO→PFE, NKECO→NKE, NUCO→NUCO (keep as BVC), PFGRUPSURA→GRUPOSURA, PFAVAL→AVAL, EXITO→CNEC (Grupo Éxito changed ticker to CNEC). Keep BVC tickers as-is: TERPEL, CIBEST, GEB, ECOPETROL, BOGOTA, CELSIA, ISA, PEI, CNEC, ISA.
- shares: exact number of shares. IMPORTANT: "231.0 Acciones" means 231 shares (not 2310). "515.0 Acciones" means 515 shares. Remove the ".0" decimal suffix.
- currentValue: the total value shown, converted to USD. For COP values (format like $9.568.700,0): remove dots/commas, divide by ${copRate} (live rate). For MXN divide by ${mxnRate}. For USD keep as-is.
- pnlPct: percentage gain/loss as number (13.28 for +13.28%, -21.11 for -21.11%). If "No disponible" or missing, use 0.
- date: today if not shown
- Skip cash or bond positions
- DO NOT calculate price yourself — just return the raw values
Return ONLY the JSON array.`};
            })()
          ]}]
        })
      });
      const data=await resp.json();
      const text=data.content?.[0]?.text||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      if(!Array.isArray(parsed)||!parsed.length)throw new Error(isEs?"No se detectaron posiciones en la imagen":"No positions detected in image");
      // Calculate avgCost from currentValue + pnlPct (AI returns raw data, we do the math)
      const withCost = parsed.filter(p=>p.ticker&&p.shares>0).map(p=>{
        let shares = p.shares;
        let price = p.price;

        if(p.currentValue!=null && p.pnlPct!=null && shares>0){
          const costBasis = p.currentValue / (1 + (p.pnlPct||0)/100);

          // Sanity check: detect "231.0 → 2310" ONLY for US-certificate tickers
          // BVC native stocks (GEB, ECOPETROL) legitimately trade at <$2 USD
          // US certificates (NUCO, BRKBCO, PFECO, NKECO) should trade >$5 USD
          const US_CERTS=["NUCO","BRKBCO","PFECO","NKECO","AMZECO","MSFTCO","APPLECO","GOOGLCO","TSLAECO","PFAVAL"];
          const isCert = US_CERTS.includes((p.ticker||"").toUpperCase());
          if(isCert){
            const impliedCurrentPrice = p.currentValue / shares;
            if(impliedCurrentPrice > 0.10 && impliedCurrentPrice < 3.0 && shares >= 10){
              const priceIfDiv10 = p.currentValue / (shares / 10);
              if(priceIfDiv10 >= 3.0 && priceIfDiv10 < 5000){
                shares = shares / 10;
              }
            }
          }

          price = costBasis / shares;
        }
        return{...p, shares:parseFloat(shares.toFixed(6)), price:parseFloat(price.toFixed(4)), id:Date.now()+Math.random()};
      }).filter(p=>p.price>0);
      if(!withCost.length)throw new Error(isEs?"No se pudieron extraer posiciones válidas":"Could not extract valid positions");
      setPreviewData({parsed:withCost,skipped:parsed.length-withCost.length,broker});
    }catch(e){
      setAiErr(isEs?"Error leyendo la imagen: "+e.message:"Error reading image: "+e.message);
    }
    setAiLoading(false);
  };

  // ── XTB/IBKR steps ──────────────────────────────────────────────────────
  const XTB_STEPS = isEs?[
    "Abre xStation 5 → pestaña \"Historial de la cuenta\"",
    "Clic en \"Exportar\" (arriba a la derecha)",
    "Selecciona rango: \"Todo\" · Formato: Excel (.xlsx)",
    "Descarga el archivo y súbelo aquí ↓",
    "✅ Detectamos automáticamente tus compras — las ventas se ignoran",
  ]:[
    "Open xStation 5 → \"Account history\" tab",
    "Click \"Export\" (top right)",
    "Range: \"All\" · Format: Excel (.xlsx)",
    "Download the file and upload it here ↓",
    "✅ We auto-detect your purchases — sells are ignored",
  ];
  const IBKR_STEPS = isEs?[
    "Entra a Client Portal → Reportes",
    "Flex Query → Activity Statement",
    "Formato: CSV · Período: Custom",
    "Descarga y sube el archivo aquí ↓",
  ]:[
    "Go to Client Portal → Reports",
    "Flex Query → Activity Statement",
    "Format: CSV · Period: Custom",
    "Download and upload the file here ↓",
  ];

  // ── Broker not selected yet ──────────────────────────────────────────────
  if(!broker)return<>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:12}}>
      ➕ {isEs?"Agregar posiciones":"Add positions"}
    </div>
    <div style={{fontSize:11,color:T.muted,marginBottom:14}}>
      {isEs?"¿Desde dónde quieres importar?":"Where do you want to import from?"}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      {BROKER_LIST.map(b=>(
        <button key={b.id} onClick={()=>{setBroker(b.id);setImportMode(b.hasCsv?"csv":"manual");}}
          style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 12px",
            cursor:"pointer",display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
          <span style={{fontSize:18}}>{b.flag}</span>
          <div>
            <div style={{fontSize:12,color:T.text,fontWeight:600}}>{b.name}</div>
            <div style={{fontSize:10,color:T.muted}}>{b.hasCsv?(isEs?"Exportar CSV":"Export CSV"):(isEs?"Foto o manual":"Photo or manual")}</div>
          </div>
        </button>
      ))}
    </div>
    <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:4}}>
      <button onClick={()=>{setBroker("other");setImportMode("manual");}}
        style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>
        ✏️ {isEs?"Ingresar manualmente sin broker":"Enter manually without broker"}
      </button>
    </div>
  </>;

  // ── Trii / HAPI flow ────────────────────────────────────────────────────
  if(broker==="trii"||broker==="hapi"){
    const bName=broker==="trii"?"Trii 🇨🇴":"HAPI 🇨🇴🇲🇽";
    return<>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <button onClick={()=>{setBroker(null);setPreviewData(null);setAiErr("");}}
          style={{background:"none",border:"none",color:T.muted,fontSize:18,cursor:"pointer",padding:0}}>←</button>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold}}>
          Importar desde {bName}
        </div>
      </div>

      {/* Sub-mode selector */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:16}}>
        {[
          {id:"screenshot",icon:"📷",l:isEs?"Captura de pantalla":"Screenshot"},
          {id:"paste",     icon:"📋",l:isEs?"Pegar texto":"Paste text"},
          {id:"manual",    icon:"✏️",l:isEs?"Manual":"Manual"},
        ].map(m=>(
          <button key={m.id} className={`seg ${aiMode===m.id?"seg-on":""}`}
            onClick={()=>{setAiMode(m.id);setAiErr("");setPreviewData(null);}}
            style={{fontSize:10,padding:"7px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:14}}>{m.icon}</span>{m.l}
          </button>
        ))}
      </div>

      {/* Screenshot mode — AI reader */}
      {aiMode==="screenshot"&&!previewData&&<>
        <div style={{padding:"10px 12px",background:`${T.blue}10`,border:`1px solid ${T.blue}22`,borderRadius:8,marginBottom:12,fontSize:11,color:T.muted,lineHeight:1.7}}>
          <div style={{color:T.blue,fontWeight:600,marginBottom:4}}>
            📷 {isEs?"Cómo tomar la captura:":"How to take the screenshot:"}
          </div>
          {broker==="trii"?<>
            1. {isEs?"Abre Trii → toca \"Portafolio\"":"Open Trii → tap \"Portfolio\""}<br/>
            2. {isEs?"Haz scroll hasta ver todas tus acciones":"Scroll until you see all your stocks"}<br/>
            3. {isEs?"Toma una captura de pantalla (o varias si tienes muchas)":"Take a screenshot (or several if you have many stocks)"}<br/>
            4. {isEs?"Sube la imagen aquí abajo":"Upload the image below"}
          </>:<>
            1. {isEs?"Abre HAPI → \"Mi portafolio\"":"Open HAPI → \"My portfolio\""}<br/>
            2. {isEs?"Captura la pantalla con tus posiciones":"Screenshot the screen with your positions"}<br/>
            3. {isEs?"Sube la imagen abajo":"Upload the image below"}
          </>}
        </div>
        {aiErr&&<div style={{padding:"8px 12px",background:`${T.red}15`,border:`1px solid ${T.red}33`,borderRadius:8,fontSize:12,color:T.red,marginBottom:10}}>{aiErr}</div>}
        {aiLoading?<div style={{textAlign:"center",padding:"24px 0",fontSize:12,color:T.gold}}>
          <span className="sp">⟳</span> {isEs?" IA leyendo tu portafolio...":" AI reading your portfolio..."}
        </div>:<label style={{display:"block",cursor:"pointer"}}>
          <div style={{border:`2px dashed ${T.goldDim}`,borderRadius:10,padding:"22px 16px",textAlign:"center",background:`${T.gold}05`,marginBottom:8}}>
            <div style={{fontSize:28,marginBottom:6}}>📷</div>
            <div style={{fontSize:13,color:T.gold,marginBottom:3}}>{isEs?"Sube tu captura de pantalla":"Upload your screenshot"}</div>
            <div style={{fontSize:10,color:T.muted}}>{isEs?"La IA detecta tickers, acciones y costo promedio automáticamente":"AI auto-detects tickers, shares and avg cost"}</div>
          </div>
          <input type="file" accept="image/*" onChange={readScreenshot} style={{display:"none"}}/>
        </label>}
      </>}


      {/* Preview — shown after screenshot or paste processes */}
      {previewData&&<>
        <div style={{marginBottom:8,padding:"10px 14px",background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:12,color:T.green,fontWeight:600}}>
              ✓ {(previewData.previewRows||previewData.parsed).length} {isEs?"posiciones detectadas":"positions detected"}
            </div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>{isEs?"Revisa y confirma":"Review and confirm"}</div>
          </div>
          <button className="seg" onClick={()=>setPreviewData(null)} style={{fontSize:10}}>{isEs?"Cambiar":"Change"}</button>
        </div>
        <div style={{background:T.accent,borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:8,maxHeight:220,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:T.surface}}>
              {["Ticker","Acciones","Precio","Fecha"].map(h=>(
                <th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(previewData.previewRows||previewData.parsed).slice(0,10).map((p,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}22`}}>
                  <td style={{padding:"5px 10px",fontFamily:"'DM Mono',monospace",color:T.gold,fontWeight:700}}>{p.ticker}</td>
                  <td style={{padding:"5px 10px",fontFamily:"'DM Mono',monospace",color:T.text}}>{typeof p.shares==="number"?p.shares.toFixed(4):p.shares}</td>
                  <td style={{padding:"5px 10px",fontFamily:"'DM Mono',monospace",color:T.text}}>${typeof p.price==="number"?p.price.toFixed(2):p.price}</td>
                  <td style={{padding:"5px 10px",color:T.muted,fontSize:10}}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-gold" onClick={confirmImport} style={{width:"100%",padding:"11px 0",fontSize:14,borderRadius:10}}>
          ✅ {isEs?`Confirmar — ${(previewData.previewRows||previewData.parsed).length} posiciones`:`Confirm — ${(previewData.previewRows||previewData.parsed).length} positions`}
        </button>
      </>}

      {/* Paste mode */}
      {aiMode==="paste"&&!previewData&&<>
        <div style={{padding:"10px 12px",background:`${T.blue}10`,border:`1px solid ${T.blue}22`,borderRadius:8,marginBottom:12,fontSize:11,color:T.muted,lineHeight:1.7}}>
          <div style={{color:T.blue,fontWeight:600,marginBottom:4}}>📋 {isEs?"Formato esperado:":"Expected format:"}</div>
          <div style={{fontFamily:"'DM Mono',monospace",background:T.accent,padding:"6px 8px",borderRadius:6,fontSize:10}}>
            AAPL{"\t"}10{"\t"}185.50<br/>
            EC{"\t"}50{"\t"}9.20<br/>
            NVDA{"\t"}5{"\t"}450.00
          </div>
          <div style={{marginTop:6}}>{isEs?"Columnas: Ticker · Acciones · Precio promedio":"Columns: Ticker · Shares · Avg Price"}</div>
        </div>
        <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
          placeholder={"AAPL\t10\t185.50\nEC\t50\t9.20"}
          style={{width:"100%",minHeight:120,background:T.accent,border:`1px solid ${T.border}`,color:T.text,
            borderRadius:8,padding:10,fontFamily:"'DM Mono',monospace",fontSize:12,outline:"none",
            resize:"vertical",marginBottom:10,lineHeight:1.6}}/>
        <button className="btn btn-gold" onClick={parsePaste} disabled={!pasteText.trim()}
          style={{width:"100%",padding:"11px 0",fontSize:13,borderRadius:10}}>
          📋 {isEs?"Importar texto pegado":"Import pasted text"}
        </button>
      </>}

      {/* Manual mode — reuse existing form via setImportMode */}
      {aiMode==="manual"&&<>
        <div style={{fontSize:11,color:T.muted,marginBottom:10,padding:"8px 12px",background:`${T.accent}`,borderRadius:8,lineHeight:1.6}}>
          💡 {isEs?`En ${bName.split(" ")[0]}: Portafolio → toca cada acción → anota Ticker, Cantidad y Costo Promedio`:`In ${bName.split(" ")[0]}: Portfolio → tap each stock → note Ticker, Shares and Avg Cost`}
        </div>
        {/* Delegate to existing manual form */}
        {(()=>{setImportMode("manual");return null;})()}
      </>}

      {importErr&&<div style={{padding:"8px 12px",borderRadius:8,fontSize:12,marginTop:10,
        background:importErr.startsWith("✅")?`${T.green}15`:`${T.red}15`,
        color:importErr.startsWith("✅")?T.green:T.red,
        border:`1px solid ${importErr.startsWith("✅")?T.green:T.red}33`}}>{importErr}</div>}
    </>;
  }

  // ── XTB / IBKR / Other — CSV flow ─────────────────────────────────────
  const steps=broker==="xtb"?XTB_STEPS:broker==="ibkr"?IBKR_STEPS:null;
  const bLabel=BROKER_LIST.find(b=>b.id===broker);

  return<>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <button onClick={()=>{setBroker(null);setPreviewData(null);setImportErr("");}}
        style={{background:"none",border:"none",color:T.muted,fontSize:18,cursor:"pointer",padding:0}}>←</button>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold}}>
        {bLabel?`${bLabel.flag} ${bLabel.name}`:(isEs?"Importar CSV":"Import CSV")}
      </div>
    </div>

    {steps&&!previewData&&<div style={{marginBottom:14}}>
      {steps.map((s,i)=>(
        <div key={i} style={{display:"flex",gap:10,fontSize:11,color:i===steps.length-1?T.gold:T.muted,
          marginBottom:8,padding:"7px 10px",borderRadius:8,
          background:i===steps.length-1?`${T.gold}08`:T.accent,
          border:`1px solid ${i===steps.length-1?T.goldDim+"44":T.border}`}}>
          <span style={{color:T.goldDim,fontWeight:700,flexShrink:0}}>{i+1}.</span>
          <span style={{lineHeight:1.5}}>{s}</span>
        </div>
      ))}
    </div>}

    {importErr&&<div style={{padding:"8px 12px",borderRadius:8,fontSize:12,marginBottom:12,
      background:importErr.startsWith("✅")?`${T.green}15`:`${T.red}15`,
      color:importErr.startsWith("✅")?T.green:T.red,
      border:`1px solid ${importErr.startsWith("✅")?T.green:T.red}33`}}>{importErr}</div>}

    <label style={{display:"block",cursor:"pointer"}}>
      <div style={{border:`2px dashed ${T.goldDim}`,borderRadius:10,padding:"22px 16px",
        textAlign:"center",background:`${T.gold}05`,marginBottom:8}}>
        <div style={{fontSize:24,marginBottom:6}}>📂</div>
        <div style={{fontSize:13,color:T.gold,marginBottom:3}}>
          {isEs?"Sube tu archivo":"Upload your file"}
        </div>
        <div style={{fontSize:10,color:T.muted}}>
          {broker==="xtb"?"xStation5 → Historial → Exportar (.xlsx / .csv)":
           broker==="ibkr"?"Client Portal → Activity Statement (.csv)":
           "CSV · TXT · Excel"}
        </div>
      </div>
      <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={parseCSV} style={{display:"none"}}/>
    </label>

  </>;
}


// ── SELL HISTORY TAB ─────────────────────────────────────────────────────────
function SellHistoryTab({transactions, enriched, onEdit, onDelete, lang, fmt}){
  const isEs = lang==="es";
  const sells = transactions.filter(t=>t.type==="sell").sort((a,b)=>new Date(b.date)-new Date(a.date));
  const [editing,setEditing] = useState(null);
  const [editShares,setEditShares] = useState("");
  const [editPrice,setEditPrice] = useState("");

  const getAvgCost = (ticker) => {
    const pos = enriched.find(p=>p.ticker===ticker);
    return pos?.avgCost || 0;
  };

  const totalRealized = sells.reduce((sum,t)=>{
    const cost = getAvgCost(t.ticker);
    return sum + (t.price - cost) * t.shares;
  },0);

  if(!sells.length) return(
    <div style={{textAlign:"center",padding:"32px 0",color:T.muted}}>
      <div style={{fontSize:32,marginBottom:8}}>📭</div>
      <div style={{fontSize:13}}>{isEs?"No hay ventas registradas":"No sells recorded yet"}</div>
      <div style={{fontSize:11,marginTop:4,color:T.muted}}>{isEs?"Usa el botón Vender en cada posición":"Use the Sell button on each position"}</div>
    </div>
  );

  return(
    <div style={{padding:"14px 18px"}}>
      {/* Summary bar */}
      <div style={{display:"flex",gap:12,marginBottom:14,padding:"10px 14px",borderRadius:10,
        background:totalRealized>=0?`${T.green}08`:`${T.red}08`,
        border:`1px solid ${totalRealized>=0?T.green:T.red}33`}}>
        <div>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{isEs?"P&G Realizado Total":"Total Realized P&G"}</div>
          <div style={{fontSize:18,fontWeight:700,color:totalRealized>=0?T.green:T.red,fontFamily:"'Playfair Display',serif"}}>
            {totalRealized>=0?"+":""}{fmt(Math.abs(totalRealized))}
          </div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{isEs?"Operaciones cerradas":"Closed trades"}</div>
          <div style={{fontSize:18,fontWeight:700,color:T.gold,fontFamily:"'Playfair Display',serif"}}>{sells.length}</div>
        </div>
      </div>
      {/* Sells table */}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:600}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`}}>
              {["Ticker",isEs?"Acciones":"Shares",isEs?"Precio Venta":"Sell Price",isEs?"Costo Prom.":"Avg Cost","P&G","%","Fecha",isEs?"Acción":"Action"].map((h,i)=>(
                <th key={i} style={{padding:"8px 10px",textAlign:i<2?"left":"right",fontSize:9,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sells.map(txn=>{
              const avgCost = getAvgCost(txn.ticker);
              const pnl = (txn.price - avgCost) * txn.shares;
              const pct = avgCost>0 ? ((txn.price-avgCost)/avgCost*100) : 0;
              const isPos = pnl>=0;
              const isEdit = editing===txn.id;
              return(
                <tr key={txn.id} style={{borderBottom:`1px solid ${T.border}22`}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.accent}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"8px 10px",fontWeight:700,color:T.gold,fontFamily:"'DM Mono',monospace"}}>{txn.ticker}</td>
                  <td style={{padding:"8px 10px"}}>
                    {isEdit
                      ? <input type="number" value={editShares} onChange={e=>setEditShares(e.target.value)}
                          style={{width:64,padding:"2px 6px",fontSize:11,borderRadius:4,background:T.accent,border:`1px solid ${T.border}`,color:T.text}}/>
                      : txn.shares.toFixed(4)}
                  </td>
                  <td style={{padding:"8px 10px",textAlign:"right"}}>
                    {isEdit
                      ? <input type="number" value={editPrice} onChange={e=>setEditPrice(e.target.value)}
                          style={{width:72,padding:"2px 6px",fontSize:11,borderRadius:4,background:T.accent,border:`1px solid ${T.border}`,color:T.text,textAlign:"right"}}/>
                      : `$${txn.price.toFixed(2)}`}
                  </td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:T.muted}}>${avgCost.toFixed(2)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:isPos?T.green:T.red,fontWeight:600}}>
                    {isPos?"+":""}{fmt(Math.abs(pnl))}
                  </td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:isPos?T.green:T.red}}>
                    {isPos?"+":""}{pct.toFixed(1)}%
                  </td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:T.muted,fontSize:10}}>{txn.date}</td>
                  <td style={{padding:"8px 10px",textAlign:"right"}}>
                    {isEdit
                      ? <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                          <button onClick={()=>{onEdit(txn.id,{shares:parseFloat(editShares)||txn.shares,price:parseFloat(editPrice)||txn.price});setEditing(null);}}
                            style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:T.green,color:"#fff",border:"none",cursor:"pointer"}}>✓</button>
                          <button onClick={()=>setEditing(null)}
                            style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:T.border,color:T.text,border:"none",cursor:"pointer"}}>✕</button>
                        </div>
                      : <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                          <button onClick={()=>{setEditing(txn.id);setEditShares(String(txn.shares));setEditPrice(String(txn.price));}}
                            style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:`${T.gold}15`,color:T.gold,border:`1px solid ${T.goldDim}33`,cursor:"pointer"}}>✏️</button>
                          <button onClick={()=>{ if(window.confirm(isEs?"¿Eliminar esta venta?":"Delete this sell?")) onDelete(txn.id); }}
                            style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:`${T.red}15`,color:T.red,border:`1px solid ${T.red}33`,cursor:"pointer"}}>🗑</button>
                        </div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── STICKY AI CTA ────────────────────────────────────────────────────────────
function StickyAIButton({onAnalyze, loading, hasPositions, lang}){
  const [visible, setVisible] = useState(false);
  const isEs = lang==="es";

  useEffect(()=>{
    const banner = document.getElementById("ai-analysis-section");
    if(!banner) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(!e.isIntersecting),
      {threshold:0}
    );
    obs.observe(banner);
    return () => obs.disconnect();
  }, []);

  if(!visible||!hasPositions) return null;

  return(
    <div style={{
      position:"fixed",
      bottom:24,
      right:24,
      zIndex:500,
      display:"flex",
      flexDirection:"column",
      gap:8,
      alignItems:"flex-end",
    }}>
      <button
        onClick={()=>{
          onAnalyze();
          setTimeout(()=>document.getElementById("ai-analysis-section")?.scrollIntoView({behavior:"smooth"}),200);
        }}
        disabled={loading}
        style={{
          background:"linear-gradient(135deg,#6d3fdc,#4f2db0)",
          color:"#fff",
          border:"none",
          borderRadius:12,
          padding:"13px 20px",
          fontSize:13,
          fontWeight:600,
          cursor:"pointer",
          boxShadow:"0 4px 20px rgba(109,63,220,0.5)",
          display:"flex",
          alignItems:"center",
          gap:8,
          whiteSpace:"nowrap",
        }}>
        {loading
          ?<><span className="sp">⟳</span> {isEs?" Analizando...":" Analyzing..."}</>
          :<>🤖 {isEs?"Análisis IA":"AI Analysis"} ↑</>}
      </button>
      <button
        onClick={()=>document.getElementById("rebalance-dca-section")?.scrollIntoView({behavior:"smooth"})}
        style={{
          background:"#242338",
          color:T.gold,
          border:"1px solid #5b3fd466",
          borderRadius:10,
          padding:"9px 16px",
          fontSize:11,
          fontWeight:500,
          cursor:"pointer",
          whiteSpace:"nowrap",
        }}>
        ↓ {isEs?"DCA & Rebalanceo":"DCA & Rebalance"}
      </button>
    </div>
  );
}

// ── PORTFOLIO GROWTH CHART ───────────────────────────────────────────────────
// Uses transactions + current prices — no extra API calls needed
function PortfolioGrowthChart({transactions,prices,lang="es",fmt,fmtShort}){
  const isEs=lang==="es";
  const [period,setPeriod]=useState("all");

  const buildTimeline=()=>{
    if(!transactions.length)return[];
    const sorted=[...transactions].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const dateSet=new Set(sorted.map(t=>t.date));
    dateSet.add(new Date().toISOString().split("T")[0]);
    const dates=[...dateSet].sort();
    return dates.map(date=>{
      const isToday=date===new Date().toISOString().split("T")[0];
      const shares={},avgCost={};
      for(const txn of sorted){
        if(txn.date>date)break;
        const tk=txn.ticker;
        if(!shares[tk]){shares[tk]=0;avgCost[tk]=0;}
        if(txn.type==="sell"){
          shares[tk]=Math.max(0,shares[tk]-txn.shares);
        } else {
          const prev=shares[tk],prevC=avgCost[tk],newS=prev+txn.shares;
          avgCost[tk]=newS>0?(prevC*prev+txn.price*txn.shares)/newS:0;
          shares[tk]=newS;
        }
      }
      const invested=Object.entries(shares).reduce((a,[tk,sh])=>a+sh*(avgCost[tk]||0),0);
      if(invested===0)return null;
      let value=0;
      for(const [tk,sh] of Object.entries(shares)){
        if(sh<=0)continue;
        value+=sh*(isToday&&prices[tk]?.price?prices[tk].price:(avgCost[tk]||0));
      }
      const d=new Date(date);
      return{
        date,isToday,
        label:d.toLocaleDateString(isEs?"es-CO":"en-US",{month:"short",day:"numeric",year:"2-digit"}),
        value:Math.round(value),
        invested:Math.round(invested),
      };
    }).filter(Boolean);
  };

  const allData=buildTimeline();
  const now=new Date();
  const filtered=allData.filter(p=>{
    const d=new Date(p.date);
    if(period==="ytd")return d>=new Date(now.getFullYear(),0,1);
    if(period==="6m") return d>=new Date(now-180*24*3600*1000);
    if(period==="1y") return d>=new Date(now-365*24*3600*1000);
    return true;
  });
  const data=filtered.length>=2?filtered:allData;
  const first=data[0],last=data[data.length-1];
  const totalReturn=last&&last.invested>0?((last.value-last.invested)/last.invested*100):0;
  const totalGain=last?last.value-last.invested:0;
  const isPos=totalReturn>=0;
  const lineColor=isPos?T.green:T.red;

  const CustomTooltip=({active,payload})=>{
    if(!active||!payload?.length)return null;
    const p=payload[0]?.payload;
    if(!p)return null;
    const gain=p.value-p.invested;
    const pct=p.invested>0?(gain/p.invested*100):0;
    return<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",minWidth:168}}>
      <div style={{fontSize:10,color:T.muted,marginBottom:6}}>{p.label}{p.isToday&&<span style={{color:T.green,marginLeft:6}}>● hoy</span>}</div>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,fontSize:12,marginBottom:3}}>
        <span style={{color:T.muted}}>{isEs?"Valor":"Value"}</span>
        <span style={{color:T.gold,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fmt?fmt(p.value):`$${p.value.toLocaleString("en-US")}`}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,fontSize:12,marginBottom:3}}>
        <span style={{color:T.muted}}>{isEs?"Invertido":"Invested"}</span>
        <span style={{color:T.muted,fontFamily:"'DM Mono',monospace"}}>{fmt?fmt(p.invested):`$${p.invested.toLocaleString("en-US")}`}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,fontSize:12,borderTop:`1px solid ${T.border}22`,paddingTop:4,marginTop:4}}>
        <span style={{color:T.muted}}>P&G</span>
        <span style={{color:gain>=0?T.green:T.red,fontFamily:"'DM Mono',monospace",fontWeight:700}}>
          {fmt?fmt(Math.abs(gain)):`$${Math.abs(gain).toLocaleString("en-US")}`} ({pct>=0?"+":""}{pct.toFixed(1)}%)
        </span>
      </div>
    </div>;
  };

  if(!allData.length)return null;

  return<Card s={{padding:0,overflow:"hidden",border:`1px solid ${T.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold}}>{isEs?"📈 Crecimiento del Portafolio":"📈 Portfolio Growth"}</div>
        <div style={{fontSize:10,color:T.muted,marginTop:2}}>{isEs?"Evolución del valor de tu inversión":"Evolution of your investment value"}</div>
      </div>
      <div style={{display:"flex",gap:4}}>
        {["ytd","6m","1y","all"].map(p=>(
          <button key={p} className={`seg ${period===p?"seg-on":""}`} onClick={()=>setPeriod(p)} style={{fontSize:10,padding:"4px 10px"}}>
            {p==="ytd"?"YTD":p==="6m"?"6M":p==="1y"?"1A":isEs?"Todo":"All"}
          </button>
        ))}
      </div>
    </div>
    <div style={{padding:"16px 20px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[
          {l:isEs?"Valor actual":"Current value",    v:fmt?fmt(last?.value||0):`$${(last?.value||0).toLocaleString("en-US")}`,   c:T.gold},
          {l:isEs?"Total invertido":"Total invested",v:fmt?fmt(last?.invested||0):`$${(last?.invested||0).toLocaleString("en-US")}`,c:T.muted},
          {l:isEs?"Retorno total":"Total return",    v:`${isPos?"+":""}${totalReturn.toFixed(1)}%`,       c:lineColor},
        ].map(({l,v,c})=>(
          <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
            <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{l}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:c,fontWeight:700}}>{v}</div>
          </div>
        ))}
      </div>
      {data.length<=3&&<div style={{padding:"8px 12px",background:`${T.blue}10`,border:`1px solid ${T.blue}22`,borderRadius:8,fontSize:11,color:T.muted,marginBottom:14,lineHeight:1.6}}>
        💡 {isEs?"El gráfico mejora con más transacciones. Cada compra o venta agrega un punto.":"Chart improves with more transactions. Each buy or sell adds a data point."}
      </div>}
      <div style={{height:210}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top:5,right:5,left:8,bottom:0}}>
            <defs>
              <linearGradient id="gGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={lineColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.blue} stopOpacity={0.08}/>
                <stop offset="95%" stopColor={T.blue} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
            <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval="preserveStartEnd"/>
            <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtShort?fmtShort(v):(v>=1000?`$${Math.round(v/1000)}K`:`$${v}`)} width={54}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="invested" stroke={T.blue}    strokeWidth={1}   strokeDasharray="4 3" fill="url(#gInvested)" name="invested"/>
            <Area type="monotone" dataKey="value"    stroke={lineColor} strokeWidth={2.5} fill="url(#gGrowth)"  name="value"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.muted}}>
            <div style={{width:10,height:3,background:lineColor,borderRadius:1}}/>
            {isEs?"Valor de mercado":"Market value"}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.muted}}>
            <div style={{width:10,height:0,borderTop:`1.5px dashed ${T.blue}`}}/>
            {isEs?"Capital invertido":"Invested capital"}
          </div>
        </div>
        {totalGain!==0&&<div style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:`${lineColor}15`,color:lineColor,fontWeight:600}}>
          {isPos?"✓":"↓"} {isEs?"Ganancia:":"Gain:"} {totalGain>=0?"+":""}{fmt?fmt(Math.abs(totalGain)):`$${Math.abs(totalGain).toLocaleString("en-US")}`}
        </div>}
      </div>
    </div>
  </Card>;
}

// ── PORTFOLIO DASHBOARD ───────────────────────────────────────────────────────
function PortfolioDashboard({enriched,totalCost,totalValue,totalPnL,totalPnLPct,aiAnalysis,lang,isPremium,onShowPaywall}){
  const isEs=lang==="es";
  const [showDetails,setShowDetails]=useState(false);

  // Classify positions into zones
  const winners=enriched.filter(p=>p.pnlPct!=null&&p.pnlPct>=10);
  const watchers=enriched.filter(p=>p.pnlPct!=null&&p.pnlPct>=-10&&p.pnlPct<10);
  const alerts=enriched.filter(p=>p.pnlPct!=null&&p.pnlPct<-10);
  const noPrices=enriched.filter(p=>p.pnlPct==null);

  // Portfolio health score 0-100
  const healthScore=enriched.length===0?0:Math.round(
    ((winners.length*100)+(watchers.length*60)+(alerts.length*20))/(enriched.length*100)*100
  );
  const healthGrade=healthScore>=75?"A":healthScore>=60?"B+":healthScore>=45?"B":healthScore>=30?"C":"D";
  const healthColor=healthScore>=75?T.green:healthScore>=45?T.gold:T.red;

  // Sector concentration
  const aiPositions=aiAnalysis?.positions||[];
  const topSector=aiAnalysis?.topSector||"";

  // Bar chart data — sorted by P&L %
  const barData=[...enriched]
    .filter(p=>p.pnlPct!=null)
    .sort((a,b)=>b.pnlPct-a.pnlPct);

  // Max abs value for bar scaling
  const maxPnl=Math.max(...barData.map(p=>Math.abs(p.pnlPct)),1);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* ── ROW 1: Health gauge + Zone cards + AI insight ── */}
      <div style={{display:"grid",gridTemplateColumns:"160px 1fr 1fr 1fr",gap:12}}>

        {/* Health Gauge */}
        <div style={{background:T.card,border:`2px solid ${healthColor}44`,borderRadius:14,padding:"16px 12px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
            {isEs?"Salud del Portafolio":"Portfolio Health"}
          </div>
          {/* SVG Gauge */}
          <svg width={100} height={60} viewBox="0 0 100 60">
            {/* Background arc */}
            <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={T.border} strokeWidth={8} strokeLinecap="round"/>
            {/* Colored arc based on score */}
            <path d={`M 10 55 A 40 40 0 0 1 ${10+80*(healthScore/100)} ${55-Math.sin(Math.PI*(healthScore/100))*40}`}
              fill="none" stroke={healthColor} strokeWidth={8} strokeLinecap="round"
              style={{filter:`drop-shadow(0 0 4px ${healthColor}88)`}}/>
            {/* Grade text */}
            <text x={50} y={45} textAnchor="middle" fill={healthColor}
              style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700}}>{healthGrade}</text>
          </svg>
          <div style={{fontSize:12,color:healthColor,fontWeight:700,marginTop:4}}>{healthScore}/100</div>
          <div style={{fontSize:10,color:T.muted,marginTop:2}}>
            {healthScore>=75?(isEs?"Excelente":"Excellent"):healthScore>=45?(isEs?"Moderado":"Moderate"):(isEs?"Revisar":"Needs Review")}
          </div>
        </div>

        {/* Zone: Winners */}
        <div style={{background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s"}}
          onClick={()=>setShowDetails(d=>d==="winners"?null:"winners")}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.green}
          onMouseLeave={e=>e.currentTarget.style.borderColor=`${T.green}33`}>
          <div style={{fontSize:28,marginBottom:6}}>🚀</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.green,fontWeight:700}}>{winners.length}</div>
          <div style={{fontSize:12,color:T.green,fontWeight:600,marginBottom:4}}>
            {isEs?"Ganadoras":"Winners"} <span style={{fontSize:10,opacity:0.7}}>(+10%)</span>
          </div>
          <div style={{fontSize:10,color:T.muted}}>
            {winners.length>0
              ?winners.map(p=>`${p.ticker} +${p.pnlPct.toFixed(1)}%`).slice(0,2).join(" · ")
              :(isEs?"Ninguna aún":"None yet")}
          </div>
        </div>

        {/* Zone: Watchers */}
        <div style={{background:`${T.gold}10`,border:`1px solid ${T.gold}33`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s"}}
          onClick={()=>setShowDetails(d=>d==="watchers"?null:"watchers")}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
          onMouseLeave={e=>e.currentTarget.style.borderColor=`${T.gold}33`}>
          <div style={{fontSize:28,marginBottom:6}}>👁️</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.gold,fontWeight:700}}>{watchers.length}</div>
          <div style={{fontSize:12,color:T.gold,fontWeight:600,marginBottom:4}}>
            {isEs?"A Seguir":"Watchers"} <span style={{fontSize:10,opacity:0.7}}>(-10% a +10%)</span>
          </div>
          <div style={{fontSize:10,color:T.muted}}>
            {watchers.length>0
              ?watchers.map(p=>`${p.ticker} ${p.pnlPct>=0?"+":""}${p.pnlPct.toFixed(1)}%`).slice(0,2).join(" · ")
              :(isEs?"Ninguna":"None")}
          </div>
        </div>

        {/* Zone: Alerts */}
        <div style={{background:`${T.red}10`,border:`1px solid ${T.red}33`,borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s"}}
          onClick={()=>setShowDetails(d=>d==="alerts"?null:"alerts")}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.red}
          onMouseLeave={e=>e.currentTarget.style.borderColor=`${T.red}33`}>
          <div style={{fontSize:28,marginBottom:6}}>⚠️</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.red,fontWeight:700}}>{alerts.length}</div>
          <div style={{fontSize:12,color:T.red,fontWeight:600,marginBottom:4}}>
            {isEs?"Revisar":"Review"} <span style={{fontSize:10,opacity:0.7}}>(-10%)</span>
          </div>
          <div style={{fontSize:10,color:T.muted}}>
            {alerts.length>0
              ?alerts.map(p=>`${p.ticker} ${p.pnlPct.toFixed(1)}%`).slice(0,2).join(" · ")
              :(isEs?"Todo bien":"All good")}
          </div>
        </div>
      </div>

      {/* ── ZONE DETAIL DRAWER ── */}
      {showDetails&&<div className="fi" style={{background:T.card,border:`1px solid ${showDetails==="winners"?T.green:showDetails==="watchers"?T.gold:T.red}44`,borderRadius:12,padding:"12px 16px"}}>
        <div style={{fontSize:11,color:T.muted,marginBottom:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
          {showDetails==="winners"?`🚀 ${isEs?"Posiciones ganadoras":"Winning positions"}`:showDetails==="watchers"?`👁️ ${isEs?"A seguir de cerca":"Watch closely"}`:`⚠️ ${isEs?"Revisar urgente":"Urgent review"}`}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {(showDetails==="winners"?winners:showDetails==="watchers"?watchers:alerts).map(p=>(
            <div key={p.ticker} style={{background:T.accent,borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:T.text}}>{p.ticker}</span>
              <span style={{fontSize:12,color:p.pnlPct>=0?T.green:T.red,fontWeight:600}}>{p.pnlPct>=0?"+":""}{p.pnlPct.toFixed(2)}%</span>
              {p.currentPrice&&<span style={{fontSize:10,color:T.muted}}>${p.currentPrice.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      </div>}

      {/* ── ROW 2: P&L Bar Chart + AI Insight ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:12}}>

        {/* P&L Horizontal Bar Chart */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>
                📊 {isEs?"Rendimiento por Acción":"Performance by Stock"}
              </div>
              <div style={{fontSize:10,color:T.muted,marginTop:2}}>
                {isEs?"Ordenado de mayor a menor ganancia · Click para analizar":"Sorted best to worst · Click to analyze"}
              </div>
            </div>
            <button className="seg" onClick={()=>{
              window._perfMode=window._perfMode==="usd"?"pct":"usd";
              const btn=document.getElementById("perf-mode-btn");
              if(btn)btn.textContent=window._perfMode==="usd"?(isEs?"% Rend.":"% Return"):(isEs?"$ Ganancia":"$ P&G");
            }} style={{fontSize:10,padding:"4px 10px",borderRadius:6,cursor:"pointer"}}>
              <span id="perf-mode-btn">{isEs?"$ Ganancia":"$ P&G"}</span>
            </button>
          </div>

          {barData.length===0
            ?<div style={{textAlign:"center",padding:"20px 0",fontSize:12,color:T.muted}}>
                {isEs?"Actualiza precios para ver el gráfico":"Refresh prices to see the chart"}
              </div>
            :<div style={{display:"flex",flexDirection:"column",gap:6}}>
              {(()=>{
                const useUSD = typeof window!=="undefined" && window._perfMode==="usd";
                const displayData = useUSD ? [...barData].sort((a,b)=>(b.unrealizedPnL||0)-(a.unrealizedPnL||0)) : barData;
                const maxVal = useUSD ? Math.max(...displayData.map(p=>Math.abs(p.unrealizedPnL||0)),1) : maxPnl;
                return displayData.map(p=>{
                  const val = useUSD ? (p.unrealizedPnL||0) : p.pnlPct;
                  const barWidth = Math.abs(val)/maxVal*100;
                  const isPos = val>=0;
                  const color = isPos?(Math.abs(val)>=20?T.green:T.green+"bb"):(Math.abs(val)>=20?T.red:T.red+"bb");
                  const label = useUSD ? `${isPos?"+":""}$${Math.abs(val).toLocaleString("en-US",{maximumFractionDigits:0})}` : `${isPos?"+":""}${val.toFixed(1)}%`;
                  return(
                    <div key={p.ticker} style={{display:"grid",gridTemplateColumns:"52px 1fr 70px",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:T.text,textAlign:"right"}}>{p.ticker}</span>
                      <div style={{position:"relative",height:22,background:T.accent,borderRadius:4,overflow:"hidden"}}>
                        <div style={{
                          position:"absolute",
                          left:isPos?"50%":"auto",right:isPos?"auto":"50%",
                          width:`${barWidth/2}%`,height:"100%",
                          background:color,borderRadius:isPos?"0 3px 3px 0":"3px 0 0 3px",
                          transition:"width 0.5s ease",
                        }}/>
                        <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:T.border}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color,fontWeight:700}}>{label}</span>
                      </div>
                    </div>
                  );
                });
              })()}
              {/* X axis labels */}
              <div style={{display:"grid",gridTemplateColumns:"52px 1fr 70px",gap:8,marginTop:2}}>
                <span/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:T.muted}}>
                  <span>Menor</span><span>0</span><span>Mayor</span>
                </div>
                <span/>
              </div>
            </div>
          }
        </div>

        {/* Right panel: AI Insight + Concentration */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>

          {/* AI Insight card */}
          <div style={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.goldDim}44`,borderRadius:14,padding:"14px 16px",flex:1}}>
            <div style={{fontSize:10,color:T.gold,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
              🤖 {isEs?"Diagnóstico IA":"AI Diagnosis"}
            </div>
            {aiAnalysis
              ?<>
                <div style={{fontSize:12,color:T.text,lineHeight:1.7,marginBottom:10}}>{aiAnalysis.summary?.split(".")[0]}.</div>
                {aiAnalysis.suggestions?.slice(0,2).map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:6,fontSize:11,color:T.muted,marginBottom:5,lineHeight:1.5}}>
                    <span style={{color:T.gold,flexShrink:0}}>→</span>{s}
                  </div>
                ))}
              </>
              :<div style={{fontSize:11,color:T.muted,lineHeight:1.7}}>
                {isPremium
                  ?<>{isEs?"Ejecuta el Análisis IA para obtener un diagnóstico personalizado de tu portafolio.":"Run the AI Analysis to get a personalized diagnosis of your portfolio."}</>
                  :<>{isEs?"Análisis IA disponible en plan Basic o Premium.":"AI Analysis available on Basic or Premium plan."} <span style={{color:T.gold,cursor:"pointer",textDecoration:"underline"}} onClick={onShowPaywall}>{isEs?"Ver planes →":"See plans →"}</span></>
                }
              </div>
            }
          </div>

          {/* Concentration warning */}
          {enriched.length>0&&(()=>{
            const topHolding=barData[0];
            const topVal=topHolding?(topHolding.currentValue||topHolding.totalCostBasis):0;
            const topPct=totalValue>0?(topVal/totalValue*100):0;
            const isConcentrated=topPct>30;
            return(
              <div style={{background:isConcentrated?`${T.red}10`:`${T.green}10`,border:`1px solid ${isConcentrated?T.red:T.green}33`,borderRadius:12,padding:"10px 14px"}}>
                <div style={{fontSize:10,fontWeight:600,color:isConcentrated?T.red:T.green,marginBottom:4}}>
                  {isConcentrated?`⚠️ ${isEs?"Concentración alta":"High Concentration"}`:`✅ ${isEs?"Bien diversificado":"Well diversified"}`}
                </div>
                <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>
                  {isConcentrated
                    ?<>{topHolding?.ticker} {isEs?"representa":"represents"} <strong style={{color:T.red}}>{topPct.toFixed(0)}%</strong> {isEs?"de tu portafolio":"of your portfolio"}</>
                    :<>{isEs?"Tu posición mayor":"Largest position"} ({topHolding?.ticker}) {isEs?"es":"is"} <strong style={{color:T.green}}>{topPct.toFixed(0)}%</strong></>
                  }
                </div>
              </div>
            );
          })()}

          {/* Sector badge if AI ran */}
          {aiAnalysis?.topSector&&(
            <div style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:T.muted}}>{isEs?"Sector dominante":"Top sector"}</span>
              <span style={{fontSize:11,color:T.purple,fontWeight:700,padding:"2px 8px",background:`${T.purple}15`,borderRadius:6}}>{aiAnalysis.topSector}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

function PortfolioTab({canAnalyze,onShowPaywall,onGoToProfile,lang="en",user=null,userPlan="free",onBalanceChange=null}){
  const [paywallCtx,setPaywallCtx]=useState(null);
  const [portTab,setPortTab]=useState("positions"); // "positions" | "sells"
  // Read risk profile if user came from Risk Profile tab
  const savedProfile=(()=>{try{const p=localStorage.getItem("inversoria_risk_profile");return p?JSON.parse(p):null;}catch{return null;}})();
  const [positions,setPositions]=useState([]); // legacy — kept for CSV/paste compat
  const [transactions,setTransactions]=useState([]);
  const [sellTarget,setSellTarget]=useState(null);
  const [form,setForm]=useState({ticker:"",shares:"",buyPrice:"",date:"",priceCurrency:"USD"});
  const [prices,setPrices]=useState({});
  const [loadingPrices,setLoadingPrices]=useState(false);
  const [aiAnalysis,setAiAnalysis]=useState(null);
  const [loadingAI,setLoadingAI]=useState(false);
  const [err,setErr]=useState("");
  const [showBrokers,setShowBrokers]=useState(false);
  const [importMode,setImportMode]=useState("manual"); // manual | paste | csv
  const [pasteText,setPasteText]=useState("");
  const [importErr,setImportErr]=useState("");
  const [previewData,setPreviewData]=useState(null); // rows to preview before import
  const [detectedBroker,setDetectedBroker]=useState("");
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
    const newTxns=parsed.map(p=>({id:p.id,ticker:p.ticker,type:"buy",shares:p.shares,price:p.buyPrice,date:p.date}));
    const updated=[...transactions,...newTxns];
    setTransactions(updated);saveTxns(updated);
    setPasteText("");setImportMode("manual");
    setImportErr(`✅ Imported ${parsed.length} position${parsed.length>1?"s":""} successfully!`);
  };

  // Parse CSV file upload
  const parseCSV=(e)=>{
    const file=e.target.files[0];if(!file)return;
    const isXlsx=file.name.match(/\.xlsx?$/i);
    setImportErr("");setPreviewData(null);

    // For Excel files — detect XTB format and parse specially
    if(isXlsx){
      const reader=new FileReader();
      reader.onload=(ev)=>{
        try{
          const wb=window.XLSX.read(ev.target.result,{type:"array"});

          // XTB detection: has "Cash Operations" sheet
          const isXTB = wb.SheetNames.includes("Cash Operations");

          if(isXTB){
            // Parse XTB Cash Operations — calculate NET positions (buys - sells)
            const ws = wb.Sheets["Cash Operations"];
            const rows = window.XLSX.utils.sheet_to_json(ws, {header:1});
            const today=new Date().toISOString().split("T")[0];

            // Step 1: accumulate buys and sells per ticker
            const buyMap={};   // ticker → [{shares, price, date}]
            const sellMap={};  // ticker → total shares sold

            for(let i=1;i<rows.length;i++){
              const row=rows[i];
              const type=(row[0]||"").toString().trim();
              const rawTicker=(row[1]||"").toString().replace(/\.(US)$/i,"").toUpperCase(); // only strip .US — keep others for mapping
              const ticker=KNOWN_TICKERS[rawTicker]||rawTicker;
              const comment=(row[6]||"").toString();
              const m=comment.match(/(\d+\.?\d*)(?:\/[\d.]+)?\s*@\s*([\d.]+)/);
              if(!m||!ticker)continue;
              const shares=parseFloat(m[1]);
              const price=parseFloat(m[2]);
              if(isNaN(shares)||isNaN(price)||shares<=0)continue;
              let date=today;
              if(row[3]){const d=new Date(row[3]);if(!isNaN(d))date=d.toISOString().split("T")[0];}

              if(type==="Stock purchase"){
                if(!buyMap[ticker])buyMap[ticker]=[];
                buyMap[ticker].push({shares,price,date});
              } else if(type==="Stock sell"){
                sellMap[ticker]=(sellMap[ticker]||0)+shares;
              }
            }

            // Step 2: build buy transactions for open positions + sell transactions for all sells
            const parsed=[];       // buy txns (open positions only)
            const parsedSells=[];  // sell txns (for P&G realizado)
            let skippedClosed=0;

            // Add all sell transactions
            for(const [ticker, sellData] of Object.entries(sellMap)){
              // sellDataEntries — we need per-entry sells, not aggregated
              // We'll use the sellEntries collected below
            }

            // Collect individual sell entries
            const sellEntries=[];
            for(let i=1;i<rows.length;i++){
              const row=rows[i];
              const type=(row[0]||"").toString().trim();
              if(type!=="Stock sell")continue;
              const rawTicker=(row[1]||"").toString().replace(/\.(US|UK|FR|DE|SE|NL|IT|ES|JP|HK|AU|CA)$/i,"").toUpperCase();
              const ticker=KNOWN_TICKERS[rawTicker]||rawTicker;
              const comment=(row[6]||"").toString();
              const m=comment.match(/(\d+\.?\d*)(?:\/[\d.]+)?\s*@\s*([\d.]+)/);
              if(!m||!ticker)continue;
              const shares=parseFloat(m[1]);
              const price=parseFloat(m[2]);
              if(isNaN(shares)||isNaN(price)||shares<=0)continue;
              let date=today;
              if(row[3]){const d=new Date(row[3]);if(!isNaN(d))date=d.toISOString().split("T")[0];}
              sellEntries.push({id:Date.now()+Math.random(),ticker,type:"sell",shares,price,date});
            }

            // Build open position buy txns
            for(const [ticker, buys] of Object.entries(buyMap)){
              const totalBought=buys.reduce((a,b)=>a+b.shares,0);
              const totalSold=sellMap[ticker]||0;
              const netShares=parseFloat((totalBought-totalSold).toFixed(6));
              if(netShares<=0.0001){skippedClosed++;} // fully closed — sells handle the P&G
              // Always add individual buy txns (needed for P&G calc with sells)
              for(const buy of buys){
                parsed.push({id:Date.now()+Math.random(),ticker,shares:buy.shares,price:buy.price,date:buy.date});
              }
            }

            // Combine: all buys + all sells
            const allTxns=[...parsed,...sellEntries].sort((a,b)=>new Date(a.date)-new Date(b.date));

            if(!allTxns.length){
              setImportErr(lang==="es"?"No se encontraron transacciones en el archivo XTB.":"No transactions found in XTB file.");
              return;
            }

            // Preview shows only open positions (net>0)
            const openParsed=[];
            const netMap={};
            for(const txn of allTxns){
              if(!netMap[txn.ticker])netMap[txn.ticker]={shares:0,price:0,date:txn.date};
              if(txn.type==="sell"){netMap[txn.ticker].shares-=txn.shares;}
              else{
                const prev=netMap[txn.ticker];
                const newShares=prev.shares+txn.shares;
                prev.price=newShares>0?(prev.price*prev.shares+txn.price*txn.shares)/newShares:txn.price;
                prev.shares=newShares;
                prev.date=txn.date;
              }
            }
            for(const [ticker,pos] of Object.entries(netMap)){
              if(pos.shares>0.0001)openParsed.push({id:Date.now()+Math.random(),ticker,shares:parseFloat(pos.shares.toFixed(6)),price:parseFloat(pos.price.toFixed(4)),date:pos.date});
            }

            setPreviewData({parsed:allTxns,previewRows:openParsed,skipped:skippedClosed,broker:"xtb",hasSells:sellEntries.length>0});
            return;
          }

          // Generic Excel: convert first sheet to CSV
          const ws=wb.Sheets[wb.SheetNames[0]];
          const csvRaw=window.XLSX.utils.sheet_to_csv(ws);
          processCSV(csvRaw);
        }catch(err){
          setImportErr(lang==="es"?"Error leyendo el archivo Excel: "+err.message:"Error reading Excel file: "+err.message);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader=new FileReader();
    reader.onload=(ev)=>{
      const raw=ev.target.result.trim();
      processCSV(raw);
    };
    reader.readAsText(file);
  };

  // Extracted CSV processing logic
  const processCSV=(rawInput)=>{
    try{
      const raw=rawInput.trim();
      const today=new Date().toISOString().split("T")[0];
      const lines=raw.split(/\r?\n/).filter(l=>l.trim());
      if(lines.length<2){setImportErr(lang==="es"?"El archivo está vacío o solo tiene encabezados.":"File is empty or has only headers.");return;}

      const splitCSV=(line)=>{
        const cols=[];let cur="";let inQ=false;
        for(let i=0;i<line.length;i++){
          const c=line[i];
          if(c==='"'){inQ=!inQ;}
          else if((c===","||c===";")&&!inQ){cols.push(cur.trim().replace(/^"|"$/g,""));cur="";}
          else cur+=c;
        }
        cols.push(cur.trim().replace(/^"|"$/g,""));
        return cols;
      };

      const headers=splitCSV(lines[0]).map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,""));

      const findCol=(...names)=>{
        for(const n of names){
          const idx=headers.findIndex(h=>h.includes(n.replace(/[^a-z0-9]/g,"")));
          if(idx>=0)return idx;
        }
        return -1;
      };

      // ── BROKER DETECTION ──────────────────────────────────────────────────
      let broker="generic";

      // Interactive Brokers
      // ── IBKR native detection: section-based CSV format ──────────────────
      // IBKR CSV has lines like "Open Positions,Data,Summary,..." or "Trades,Data,Order,..."
      const isIBKR = raw.includes("Open Positions,Data,Summary") || raw.includes("Trades,Data,Order,Stocks");
      if(isIBKR){
        const ibkrLines = raw.split("\n").map(l=>l.replace(/\r$/,""));
        const ibkrTxns = [];
        let ibkrSkipped = 0;

        // Parse Open Positions for current holdings (most accurate avg cost)
        const openPos = {}; // ticker → {shares, avgCost}
        for(const line of ibkrLines){
          if(!line.includes("Open Positions,Data,Summary,Stocks")) continue;
          const clean = line.split(";")[0].trim();
          const parts = clean.split(",");
          try{
            const ticker = parts[5]?.trim();
            const shares = parseFloat(parts[7]);
            const avgCost = parseFloat(parts[9]);
            if(ticker && shares > 0 && avgCost > 0){
              openPos[ticker] = {shares, avgCost};
            }
          }catch(e){}
        }

        // Parse Trades for individual buy/sell history
        for(const line of ibkrLines){
          if(!line.includes("Trades,Data,Order,Stocks")) continue;
          try{
            // Line format: "Trades,Data,Order,Stocks,USD,SYMBOL,""DATE, TIME"",QTY,PRICE,..."
            let clean = line.split(";")[0].trim();
            if(clean.startsWith('"')) clean = clean.slice(1);
            if(clean.endsWith('"')) clean = clean.slice(0,-1);
            // Replace ""DATE, TIME"" with just DATE
            clean = clean.replace(/""\s*(\d{4}-\d{2}-\d{2})[^""]*""/g, "$1");
            const parts = clean.split(",");
            const ticker = parts[5]?.trim();
            const date   = parts[6]?.trim().slice(0,10);
            const qty    = parseFloat(parts[7]);
            const price  = Math.abs(parseFloat(parts[8]));
            if(!ticker || isNaN(qty) || isNaN(price) || price <= 0) continue;
            const type = qty < 0 ? "sell" : "buy";
            ibkrTxns.push({id:Date.now()+Math.random(), ticker, type, shares:Math.abs(qty), price, date:date||today});
          }catch(e){}
        }

        // If no trade history, fall back to Open Positions snapshot
        if(!ibkrTxns.length && Object.keys(openPos).length){
          for(const [ticker, pos] of Object.entries(openPos)){
            ibkrTxns.push({id:Date.now()+Math.random(), ticker, type:"buy", shares:pos.shares, price:pos.avgCost, date:today});
          }
        }

        if(!ibkrTxns.length){
          setImportErr(lang==="es"?"No se encontraron posiciones en el archivo IBKR.":"No positions found in IBKR file.");
          return;
        }

        // Preview: show only open positions
        const previewRows = Object.entries(openPos).map(([ticker,pos])=>({
          id:Date.now()+Math.random(), ticker, shares:pos.shares, price:pos.avgCost, date:today
        }));

        setPreviewData({
          parsed: ibkrTxns,
          previewRows: previewRows.length ? previewRows : ibkrTxns.filter(t=>t.type==="buy"),
          skipped: ibkrSkipped,
          broker: "ibkr",
          hasSells: ibkrTxns.some(t=>t.type==="sell")
        });
        return;
      }
      // ── End IBKR native ────────────────────────────────────────────────────

      if(headers.some(h=>h.includes("ibcommission")||h.includes("trademoney")))broker="ibkr";
      else if(headers.some(h=>h.includes("assetcategory")||h.includes("buysell")))broker="ibkr";
      // XTB
      else if(headers.some(h=>h.includes("openingrate")||h.includes("openrate")))broker="xtb";
      else if(headers.some(h=>h.includes("symbol")&&h.includes("opentime")))broker="xtb";
      else if(headers.some(h=>h.includes("instrument")&&headers.some(h2=>h2.includes("openingrate"))))broker="xtb";
      // Trii (Colombia) — exports "Historial de transacciones"
      else if(headers.some(h=>h.includes("accion")||h.includes("preciopromedio")||h.includes("preciopromediocompra")))broker="trii";
      else if(headers.some(h=>h.includes("activo")&&headers.some(h2=>h2.includes("cantidadtotal")||h2.includes("unidades"))))broker="trii";
      // HAPI (México)
      else if(headers.some(h=>h.includes("instrumento")&&headers.some(h2=>h2.includes("preciopromedio")||h2.includes("preciodecompra"))))broker="hapi";
      else if(headers.some(h=>h.includes("emisora")||h.includes("claveinstrumento")))broker="hapi";

      setDetectedBroker(broker);

      // ── COLUMN MAPPING ───────────────────────────────────────────────────
      let tickerCol,sharesCol,priceCol,dateCol;

      if(broker==="ibkr"){
        tickerCol=findCol("symbol","ticker");
        sharesCol=findCol("quantity","qty","shares");
        priceCol=findCol("tradeprice","price","avgprice","averageprice");
        dateCol=findCol("tradedate","date","datetime","settledate");
      } else if(broker==="xtb"){
        tickerCol=findCol("symbol","instrument","position");
        sharesCol=findCol("volume","quantity","lots","shares");
        priceCol=findCol("openingrate","openrate","openprice","price","rate");
        dateCol=findCol("openingtime","opentime","date","time");
      } else if(broker==="trii"){
        // Trii Colombia: Acción | Cantidad | Precio Promedio | Fecha
        tickerCol=findCol("accion","ticker","simbolo","activo","codigo","stock");
        sharesCol=findCol("cantidad","cantidadtotal","unidades","acciones","shares","cuotas");
        priceCol=findCol("preciopromedio","preciopromediocompra","preciocompra","precio","price","costopromedio");
        dateCol=findCol("fecha","fechacompra","fechatransaccion","date","timestamp");
      } else if(broker==="hapi"){
        // HAPI México: Emisora | Unidades | Precio Promedio de Compra | Fecha
        tickerCol=findCol("emisora","claveinstrumento","instrumento","ticker","simbolo");
        sharesCol=findCol("unidades","cantidad","shares","volumen","posicion");
        priceCol=findCol("preciopromedio","preciopromediocompra","preciocompra","precio","price","costopromedio");
        dateCol=findCol("fecha","fechacompra","date","timestamp");
      } else {
        tickerCol=findCol("ticker","symbol","stock","accion","activo","instrumento","codigo","emisora");
        sharesCol=findCol("shares","quantity","cantidad","acciones","qty","volume","participaciones","unidades","cuotas");
        priceCol=findCol("buyprice","price","precio","preciocompra","openingprice","avgcost","costopromedio","costbase","open","preciopromedio");
        dateCol=findCol("date","fecha","tradedate","openingtime","purchasedate","fechacompra");
      }

      if(tickerCol<0)tickerCol=0;
      if(sharesCol<0)sharesCol=1;
      if(priceCol<0)priceCol=2;
      if(dateCol<0)dateCol=3;

      const parsed=[];
      let skipped=0;

      for(let i=1;i<lines.length;i++){
        const cols=splitCSV(lines[i]);
        if(cols.length<3)continue;

        let rawTicker=(cols[tickerCol]||"").toUpperCase().replace(/[^A-Z0-9.]/g,"");
        rawTicker=rawTicker.replace(/\(.*\)/g,"").replace(/\.[A-Z]+$/,"");
        // Trii/HAPI sometimes use company names — try KNOWN_TICKERS first
        const ticker=KNOWN_TICKERS[rawTicker]||rawTicker;

        const rawShares=(cols[sharesCol]||"").replace(/[$,\s]/g,"");
        const shares=Math.abs(parseFloat(rawShares));

        const rawPrice=(cols[priceCol]||"").replace(/[$,\s]/g,"");
        const price=parseFloat(rawPrice);

        let date=today;
        if(cols[dateCol]){
          const d=cols[dateCol].replace(/['"]/g,"").trim();
          if(/^\d{8}$/.test(d))date=`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
          else if(/\d{1,2}\/\d{1,2}\/\d{4}/.test(d)){
            const parts=d.split("/");
            // Try to detect dd/mm vs mm/dd based on values
            const first=parseInt(parts[0]),second=parseInt(parts[1]);
            if(first>12){date=`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;} // dd/mm/yyyy
            else{date=`${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;}
          }
          else if(/\d{4}-\d{2}-\d{2}/.test(d))date=d.slice(0,10);
          else if(d.includes(";"))date=d.split(";")[0];
          else if(d.includes(" "))date=d.split(" ")[0]; // "2024-01-15 09:30:00"
        }

        const isSell=parseFloat(rawShares)<0;
        const buySellCol=findCol("buysell","type","side","operacion","tipomovimiento","tipo");
        const isSellLabel=buySellCol>=0&&(cols[buySellCol]||"").toUpperCase().match(/SELL|VENTA|S$/);
        if(isSell||isSellLabel){skipped++;continue;}

        if(!ticker||ticker.length<1||ticker.length>6||isNaN(shares)||isNaN(price)||shares<=0||price<=0){skipped++;continue;}

        parsed.push({id:Date.now()+Math.random(),ticker,shares,price,date});
      }

      if(!parsed.length){
        setImportErr(lang==="es"
          ?`No se pudieron detectar posiciones. ${skipped>0?`${skipped} filas omitidas.`:""} Verifica que el archivo tenga columnas de Ticker, Cantidad y Precio.`
          :`Could not detect positions. ${skipped>0?`${skipped} rows skipped.`:""} Verify Ticker, Quantity and Price columns.`);
        return;
      }

      // Show preview instead of importing directly
      setPreviewData({parsed,skipped,broker});
    }catch(parseErr){
      setImportErr(lang==="es"?"Error al procesar el archivo: "+parseErr.message:"Error processing file: "+parseErr.message);
    }

  };

  const confirmImport=()=>{
    if(!previewData)return;
    // For XTB: previewData.parsed already has correct type (buy/sell)
    // For other brokers: all entries are buys
    const newTxns=previewData.parsed.map(p=>({
      id:p.id,
      ticker:p.ticker,
      type:p.type||"buy",  // use existing type if present, default to buy
      shares:p.shares,
      price:p.price,
      date:p.date
    }));
    const updated=[...transactions,...newTxns];
    setTransactions(updated);saveTxns(updated);
    const bName={ibkr:"Interactive Brokers",xtb:"XTB",trii:"Trii",hapi:"HAPI"}[previewData.broker]||"genérico";
    setImportErr(`✅ ${previewData.parsed.length} posiciones importadas${previewData.broker!=="generic"?` desde ${bName}`:""}${previewData.skipped>0?` · ${previewData.skipped} ventas omitidas`:""}.`);
    setPreviewData(null);setImportMode("manual");
    setTimeout(()=>fetchPrices(),500); // fetch prices for newly imported tickers
  };

  // Load saved positions — cloud first, localStorage fallback
  useEffect(()=>{
    const load=async()=>{
      try{
        // Load transactions (new format)
        const savedTxns=await cloudLoad("user_data","inversoria_transactions",user?.id);
        if(savedTxns&&Array.isArray(savedTxns)&&savedTxns.length>0){
          setTransactions(savedTxns);
        } else {
          // Try localStorage transactions first
          const localTxns=localStorage.getItem("inversoria_transactions");
          if(localTxns){
            const parsed=JSON.parse(localTxns);
            if(parsed&&parsed.length>0){setTransactions(parsed);return;}
          }
          // Migrate old positions → buy transactions
          const saved=await cloudLoad("user_data","inversoria_portfolio",user?.id);
          const raw=saved||(()=>{try{const v=localStorage.getItem("inversoria_portfolio");return v?JSON.parse(v):null;}catch{return null;}})();
          if(raw&&Array.isArray(raw)&&raw.length>0){
            const migrated=raw.map(p=>({id:p.id||Date.now()+Math.random(),ticker:p.ticker,type:"buy",shares:p.shares,price:p.buyPrice||p.price||0,date:p.date||new Date().toISOString().split("T")[0]}));
            setTransactions(migrated);
            saveTxns(migrated);
          }
        }
      }catch(e){}
    };
    load();
  },[user?.id]);

  const saveTxns=(txns)=>{
    try{localStorage.setItem("inversoria_transactions",JSON.stringify(txns));}catch(e){}
    cloudSave("user_data","inversoria_transactions",txns,user?.id).catch(()=>{});
  };
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
    const activePos=calcPositionsFromTxns(transactions).filter(p=>p.totalShares>0.0001);
    const activeTickers=new Set(activePos.map(p=>p.ticker));
    const isNew=!activeTickers.has(ticker);
    if(isNew&&activeTickers.size>=FREE_POSITION_LIMIT&&!isAdmin()){
      setShowPortfolioPaywall(true);return;
    }
    const rawPrice=parseFloat(form.buyPrice);
    // Always convert to USD using the currency's own rate (not _exRate which reflects app display currency)
    const txnCurrency=form.priceCurrency||"USD";
    const txnRate=txnCurrency==="USD"?1:(CURRENCIES[txnCurrency]?.rate||1);
    const priceInUSD=txnCurrency==="USD"?rawPrice:(rawPrice/txnRate);
    const newTxn={id:Date.now(),ticker,type:"buy",shares:parseFloat(form.shares),price:priceInUSD,priceOriginal:rawPrice,priceCurrency:txnCurrency,date:form.date||new Date().toISOString().split("T")[0]};
    const updated=[...transactions,newTxn];
    setTransactions(updated);saveTxns(updated);
    setForm({ticker:"",shares:"",buyPrice:"",date:"",priceCurrency:"USD"});setErr("");
    // Fetch price for the new ticker immediately
    setTimeout(()=>fetchPrices(),300);
  };

  const removePosition=(tickerToRemove)=>{
    const updated=transactions.filter(t=>t.ticker!==tickerToRemove);
    setTransactions(updated);saveTxns(updated);
  };

  const registerSell=(position,saleData)=>{
    const newTxn={id:Date.now(),ticker:position.ticker,type:"sell",shares:saleData.shares,price:saleData.price,date:saleData.date};
    const updated=[...transactions,newTxn];
    setTransactions(updated);saveTxns(updated);
  };

  // Fetch live prices from Finnhub — sequential with delay to avoid rate limits
  const fetchPrices=async()=>{
    if(!transactions.length)return;
    setLoadingPrices(true);
    const key=import.meta.env.VITE_FINNHUB_KEY;
    const results={};
    const tickers=[...new Set(transactions.map(t=>t.ticker))];
    for(const ticker of tickers){
      try{
        // Try BVC (Colombian stocks) first
        const bvcResult=await fetchBVCPrice(ticker);
        if(bvcResult){results[ticker]=bvcResult;continue;}
        // Fallback: Finnhub for US/international stocks
        await new Promise(r=>setTimeout(r,250));
        const res=await fetch("https://finnhub.io/api/v1/quote?symbol="+ticker+"&token="+key);
        const d=await res.json();
        if(d.c)results[ticker]={price:d.c,change:d.d,changePct:d.dp,high:d.h,low:d.l,currency:"USD",isBVC:false};
      }catch(e){}
    }
    setPrices(results);setLoadingPrices(false);
  };

  // Auto-refresh prices on mount and every 5 minutes
  useEffect(()=>{
    if(transactions.length>0&&Object.keys(prices).length===0){
      fetchPrices();
    }
  },[transactions.length]);

  // Fetch prices for any new tickers not yet in prices state
  useEffect(()=>{
    if(!transactions.length)return;
    const knownTickers=Object.keys(prices);
    const allTickers=[...new Set(transactions.map(t=>t.ticker))];
    const missing=allTickers.filter(t=>!knownTickers.includes(t));
    if(missing.length>0){
      fetchPrices(); // refresh all to get the new ones
    }
  },[transactions]);

  useEffect(()=>{
    if(!transactions.length)return;
    const interval=setInterval(()=>fetchPrices(),5*60*1000);
    return()=>clearInterval(interval);
  },[transactions.length]);

  // AI portfolio analysis — premium only
  const analyzePortfolio=async()=>{
    if(!grouped.length){setErr("Add at least one position first.");return;}
    if(!isAdmin()){onShowPaywall("portfolio");return;}
    setLoadingAI(true);setErr("");setAiAnalysis(null);
    const summary=enriched.map(p=>{
      const current=p.currentPrice||p.avgCost;
      const pnl=((current-p.avgCost)/p.avgCost*100).toFixed(1);
      return`${p.ticker}: ${p.totalShares.toFixed(3)} shares @ avg $${p.avgCost.toFixed(2)}, current ~$${current.toFixed(2)}, P&L ${pnl}%, Realized P&G: $${p.realizedPnL.toFixed(2)}`;
    }).join(" | ");

    // Identify LATAM/European tickers for web search enrichment
    const latamTickers = enriched
      .filter(p => getLatamSymbol(p.ticker) !== null)
      .map(p => p.ticker);
    const hasLatam = latamTickers.length > 0;

    try{
      const profileCtx=savedProfile?`Risk Profile: ${typeof savedProfile.label==="object"?savedProfile.label.en:savedProfile.label}. ${typeof savedProfile.desc==="object"?savedProfile.desc.en:savedProfile.desc}`:"No risk profile.";
      // Use higher token limit for large portfolios
      const portfolioRes=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,
        ...(hasLatam?{tools:[{"type":"web_search_20250305","name":"web_search"}]}:{}),
        messages:[{role:"user",content:`You are a patient investor portfolio analyst (quality businesses, long-term compounding, risk profile alignment).${hasLatam?` Before analyzing, search for recent news on: ${latamTickers.join(", ")} using queries like "[TICKER] resultados financieros 2025 2026 dividendo analistas". Use sources: bloomberglinea.com, valoraanalitik.com, stockanalysis.com. Then analyze this portfolio:`:" Analyze this portfolio:"}
${summary}
Total positions: ${grouped.length}
Investor Risk Profile: ${profileCtx}
${lang==="es"?"IMPORTANT: Respond ENTIRELY in SPANISH. All text fields (summary, profileMatchReason, suggestions, verdict reasons, overallGrade) must be in Spanish. Keep JSON keys in English.":""}
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

  // ── Positions from transaction history ──────────────────────────────────────
  const FREE_PORTFOLIO_LIMIT=5;
  const allPositions=calcPositionsFromTxns(transactions);
  const grouped=allPositions.filter(p=>p.totalShares>0.0001);

  const enriched=grouped.map(g=>{
    const lp=prices[g.ticker];
    const currentPrice=lp?lp.price:null;
    const currentValue=currentPrice?g.totalShares*currentPrice:null;
    const unrealizedPnL=currentValue!=null?currentValue-g.totalCostBasis:null;
    const unrealizedPct=unrealizedPnL!=null&&g.totalCostBasis>0?((unrealizedPnL/g.totalCostBasis)*100):null;
    return{...g,currentPrice,currentValue,pnlDollar:unrealizedPnL,pnlPct:unrealizedPct,change:lp?.change,changePct:lp?.changePct};
  });

  const totalRealizedPnL=allPositions.reduce((a,p)=>a+p.realizedPnL,0);
  const totalCost=enriched.reduce((a,p)=>a+p.totalCostBasis,0);
  useEffect(()=>{if(onBalanceChange&&totalCost>0)onBalanceChange(totalCost);},[totalCost,onBalanceChange]);
  const totalValue=enriched.reduce((a,p)=>a+(p.currentValue||p.totalCostBasis),0);
  const totalUnrealizedPnL=totalValue-totalCost;
  const totalPnL=totalUnrealizedPnL+totalRealizedPnL;
  const totalPnLPct=(totalCost+Math.max(0,totalRealizedPnL))>0?(totalPnL/(totalCost+Math.max(0,totalRealizedPnL))*100):0;
  const verdictColor=v=>v==="Hold"||v==="Buy More"||v==="Comprar Más"?T.green:v==="Watch"||v==="Ver"?T.gold:v==="Consider Selling"||v==="Considerar Venta"?T.red:T.muted;

  // ── PIE CHART data ──
  const PIE_COLORS=["#c9a84c","#2ecc71","#4a9eff","#a855f7","#e74c3c","#f39c12","#1abc9c","#e67e22","#3498db","#9b59b6","#e91e63","#00bcd4"];
  // pieData: use currentValue (live price) if available, fallback to cost basis
  // isFallback=true means we're using cost data, not live prices
  const pieData=totalValue>0?enriched.map((p,i)=>{
    const hasLivePrice=p.currentValue!=null;
    const val=hasLivePrice?p.currentValue:p.totalCostBasis;
    const pct=totalValue>0?(val/totalValue*100):0;
    return{ticker:p.ticker,value:val,pct,color:PIE_COLORS[i%PIE_COLORS.length],hasLivePrice};
  }).filter(d=>d.pct>0).sort((a,b)=>b.value-a.value):[];
  const allPricesLoaded=enriched.length>0&&enriched.every(p=>p.currentValue!=null);
  const somePricesLoaded=enriched.some(p=>p.currentValue!=null);



  // AI Analysis paywall wrapper
  const handleAIAnalysis=()=>{
    if(grouped.length>FREE_POSITION_LIMIT&&!isAdmin()){setShowPortfolioPaywall(true);return;}
    analyzePortfolio();
  };

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <StickyAIButton onAnalyze={handleAIAnalysis} loading={loadingAI} hasPositions={grouped.length>0} lang={lang}/>
    {/* Portfolio paywall modal */}
    {showPortfolioPaywall&&<PaywallModal context="portfolio" onClose={()=>setShowPortfolioPaywall(false)}/>}
    {sellTarget&&<SellModal position={sellTarget} lang={lang} onClose={()=>setSellTarget(null)} onSell={(d)=>{registerSell(sellTarget,d);setSellTarget(null);}}/>}

    {/* Free plan banner */}
    {!isAdmin()&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",background:`${T.gold}08`,border:`1px solid ${T.goldDim}33`,borderRadius:8}}>
      <span style={{fontSize:11,color:T.muted}}>
        📁 Free plan: <span style={{color:T.gold,fontWeight:600}}>{Math.min(grouped.length,FREE_POSITION_LIMIT)}/{FREE_POSITION_LIMIT} acciones</span> · Historial de transacciones incluido
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
        {loadingPrices
          ?<div style={{fontSize:11,color:T.blue,display:"flex",alignItems:"center",gap:5,padding:"0 4px"}}>
              <span className="sp">⟳</span>{lang==="es"?" Actualizando...":" Updating..."}
            </div>
          :<button onClick={fetchPrices} disabled={!transactions.length}
              style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,
                cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"6px 10px",
                borderRadius:8,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blue;e.currentTarget.style.color=T.blue;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>
              🔄 {lang==="es"?"Actualizar":"Refresh"}
            </button>}
        <button className="btn btn-gold" onClick={handleAIAnalysis} disabled={loadingAI||!grouped.length} style={{fontSize:13,padding:"10px 20px",fontWeight:600,borderRadius:10,letterSpacing:"0.02em",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",color:"#fff",boxShadow:"0 0 0 0px"}}>
          {loadingAI?<><span className="sp">⟳</span> Analizando...</>:<>{lang==="es"?"🤖 Análisis IA":"🤖 AI Analysis"}</>}
        </button>
      </div>
    </div>

    {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}

    {/* Market Cycle Banner */}
    <MarketCycleBanner portfolioTickers={grouped.map(g=>g.ticker)} lang={lang} canAnalyze={canAnalyze}/>


    {/* ── BROKER IMPORT BANNER ────────────────────────────────────────────── */}
    {grouped.length<3&&<div style={{
      background:`linear-gradient(135deg,${T.card},${T.accent})`,
      border:`1px solid ${T.goldDim}55`,
      borderRadius:14,
      padding:"14px 18px",
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      flexWrap:"wrap",
      gap:12,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:24,lineHeight:1}}>📲</div>
        <div>
          <div style={{fontSize:13,color:T.text,fontWeight:600,marginBottom:3}}>
            {lang==="es"?"¿Tienes acciones en Trii, HAPI o XTB?":"Do you have stocks in Trii, HAPI or XTB?"}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["🇨🇴 Trii","🇨🇴🇲🇽 HAPI","🌎 XTB","🇺🇸 IBKR"].map(b=>(
              <span key={b} style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:T.accent,border:`1px solid ${T.border}`,color:T.muted}}>{b}</span>
            ))}
          </div>
        </div>
      </div>
      <button
        className="btn btn-gold"
        onClick={()=>{setImportMode("csv");setTimeout(()=>{document.getElementById("import-form")?.scrollIntoView({behavior:"smooth",block:"start"});},150);}}
        style={{fontSize:12,padding:"9px 18px",borderRadius:10,whiteSpace:"nowrap"}}
      >
        {lang==="es"?"📂 Importar mi portafolio →":"📂 Import my portfolio →"}
      </button>
    </div>}


    {/* KPI Cards — redesigned with visual hierarchy */}
    {grouped.length>0&&<>
      {/* Row 1: hero + secondary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {/* HERO — Valor Actual */}
        <Card s={{background:T.heroCard||"linear-gradient(135deg,#2e1f6b,#1e1545)",border:`1px solid ${T.heroCardBorder||"#5b3fd455"}`,padding:"18px 20px"}}>
          <div style={{fontSize:10,color:"rgba(167,139,250,0.7)",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:8}}>
            {lang==="es"?"Valor actual":"Current value"}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.gold,fontWeight:700,letterSpacing:"-0.5px",wordBreak:"break-all"}}>
            {fmt(totalValue)}
          </div>
          <div style={{fontSize:11,color:"rgba(167,139,250,0.6)",marginTop:5}}>{lang==="es"?"precio de mercado":"market price"}</div>
        </Card>
        {/* Total Invertido */}
        <Card s={{padding:"18px 20px"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:8}}>{lang==="es"?"Total invertido":"Total invested"}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.text,fontWeight:700,letterSpacing:"-0.5px",wordBreak:"break-all"}}>{fmt(totalCost)}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:5}}>{lang==="es"?"capital base":"capital base"}</div>
        </Card>
        {/* Retorno Total */}
        <Card s={{background:totalPnLPct>=0?"#0d2a1a":"#2a0d0d",border:`1px solid ${totalPnLPct>=0?"#16653488":"#65161688"}`,padding:"18px 20px"}}>
          <div style={{fontSize:10,color:totalPnLPct>=0?"rgba(74,222,128,0.7)":"rgba(248,113,113,0.7)",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:8}}>{lang==="es"?"Retorno total":"Total return"}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:totalPnLPct>=0?T.green:T.red,fontWeight:700,letterSpacing:"-0.5px"}}>
            {totalPnLPct>=0?"+":""}{totalPnLPct.toFixed(2)}%
          </div>
          <div style={{fontSize:11,color:totalPnLPct>=0?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)",marginTop:5}}>
            {totalPnL>=0?"+":""}{fmt(Math.abs(totalPnL))}
          </div>
        </Card>
      </div>
      {/* Row 2: secondary KPIs */}
      {(totalValue>0||totalRealizedPnL!==0)&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        <Card s={{padding:"14px 18px"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>{lang==="es"?"P&G No Realizado":"Unrealized P&G"}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:totalUnrealizedPnL>=0?T.green:T.red,fontWeight:700,wordBreak:"break-all"}}>
            {totalUnrealizedPnL>=0?"+":""}{fmt(Math.abs(totalUnrealizedPnL))}
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:3}}>{totalCost>0?`${totalUnrealizedPnL>=0?"+":""}${((totalUnrealizedPnL/totalCost)*100).toFixed(2)}%`:""}</div>
        </Card>
        <Card s={{padding:"14px 18px"}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>{lang==="es"?"P&G Realizado":"Realized P&G"}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:totalRealizedPnL>0?T.green:totalRealizedPnL<0?T.red:T.muted,fontWeight:700,wordBreak:"break-all"}}>
            {totalRealizedPnL>=0?"+":""}{fmt(Math.abs(totalRealizedPnL))}
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:3}}>{lang==="es"?"ventas cerradas":"from closed trades"}</div>
        </Card>
        {/* Best position */}
        {(()=>{
          const best=enriched.filter(p=>p.pnlPct!=null).sort((a,b)=>b.pnlPct-a.pnlPct)[0];
          const worst=enriched.filter(p=>p.pnlPct!=null).sort((a,b)=>a.pnlPct-b.pnlPct)[0];
          const show=best&&best.pnlPct>0?best:worst;
          const isGood=show&&show.pnlPct>=0;
          return show?<Card s={{background:isGood?"#0d2a1a":"#2a0d0d",border:`1px solid ${isGood?"#16653444":"#65161644"}`,padding:"14px 18px"}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>
              {isGood?(lang==="es"?"Mejor posición":"Top position"):(lang==="es"?"Mayor pérdida":"Biggest loss")}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:isGood?T.green:T.red,fontWeight:700}}>
              {show.ticker} {show.pnlPct>=0?"+":""}{show.pnlPct.toFixed(1)}%
            </div>
            <div style={{fontSize:11,color:T.muted,marginTop:3}}>{fmt(show.currentValue||show.totalCostBasis)}</div>
          </Card>:<Card s={{padding:"14px 18px"}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>{lang==="es"?"P&G Total":"Total P&G"}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:totalPnL>=0?T.green:T.red,fontWeight:700}}>{totalPnL>=0?"+":""}{fmt(Math.abs(totalPnL),true)}</div>
          </Card>;
        })()}
      </div>}
    </>}



        {/* ── PORTFOLIO VS S&P 500 ── */}
    {grouped.length>0&&transactions.length>0&&(
      <PortfolioGrowthChart transactions={transactions} prices={prices} lang={lang} fmt={fmt} fmtShort={fmtShort}/>
    )}

    {/* ── AI ANALYSIS BANNER ── */}
    {grouped.length>0&&!isAdmin()&&<div style={{
      background:"linear-gradient(135deg,#2a1a5e,#1e1545)",
      border:"1.5px solid #6d3fdc88",
      borderRadius:16,
      padding:"20px 22px",
      display:"flex",
      alignItems:"flex-start",
      gap:16,
      flexWrap:"wrap",
    }}>
      <div style={{width:44,height:44,background:"#6d3fdc22",border:"1px solid #6d3fdc55",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤖</div>
      <div style={{flex:1,minWidth:200}}>
        <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:5}}>
          {lang==="es"?"¿Tu portafolio está bien armado? La IA lo revisa en 30 segundos.":"Is your portfolio well-built? AI reviews it in 30 seconds."}
        </div>
        <div style={{fontSize:12,color:T.muted,lineHeight:1.65,marginBottom:10}}>
          {lang==="es"?"Detecta concentración de riesgo, te dice qué posiciones cambiar y si el portafolio está alineado con tu perfil.":"Detects risk concentration, tells you what to change and if it matches your profile."}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(lang==="es"?["Score A–F por acción","¿Qué vender hoy?","Alertas de concentración","Match con tu perfil","Plan de rebalanceo"]:["Score A–F per stock","What to sell today","Concentration alerts","Profile match","Rebalance plan"]).map(f=>(
            <span key={f} style={{fontSize:10,padding:"3px 9px",borderRadius:12,border:"1px solid #6d3fdc55",color:T.gold,background:"#6d3fdc15",fontWeight:500}}>{f}</span>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,alignSelf:"center",flexShrink:0}}>
        <button onClick={()=>{handleAIAnalysis();setTimeout(()=>document.getElementById("ai-analysis-section")?.scrollIntoView({behavior:"smooth"}),200);}}
          disabled={loadingAI||!grouped.length}
          style={{background:"linear-gradient(135deg,#6d3fdc,#4f2db0)",color:"#fff",border:"none",borderRadius:10,padding:"12px 22px",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
          {loadingAI?<><span className="sp">⟳</span> {lang==="es"?" Analizando...":" Analyzing..."}</>:`${lang==="es"?"Ver análisis completo":"View full analysis"} →`}
        </button>
        <button onClick={()=>document.getElementById("rebalance-dca-section")?.scrollIntoView({behavior:"smooth"})}
          style={{background:"none",border:"1px solid #6d3fdc55",color:T.gold,borderRadius:10,padding:"8px 16px",fontSize:11,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"}}>
          {lang==="es"?"↓ Ver DCA & Rebalanceo":"↓ See DCA & Rebalance"}
        </button>
      </div>
    </div>}

    {/* ── PORTFOLIO DASHBOARD — Premium visual summary ── */}
    <div id="ai-analysis-section"/>
    {grouped.length>0&&(
      <PortfolioDashboard
        enriched={enriched}
        totalCost={totalCost}
        totalValue={totalValue}
        totalPnL={totalPnL}
        totalPnLPct={totalPnLPct}
        aiAnalysis={aiAnalysis}
        lang={lang}
        isPremium={isAdmin()||userPlan==="premium"||userPlan==="basic"}
        onShowPaywall={()=>onShowPaywall("portfolio")}
      />
    )}

        <div id="import-form"/>
        <div className="portfolio-grid compound-layout" style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:18,alignItems:"start"}}>

      {/* Add Position Form */}
      <Card s={{}} id="add-position-card">
        <BrokerImportWizard lang={lang} importMode={importMode} setImportMode={setImportMode} importErr={importErr} setImportErr={setImportErr} previewData={previewData} setPreviewData={setPreviewData} parseCSV={parseCSV} parsePaste={parsePaste} confirmImport={confirmImport} pasteText={pasteText} setPasteText={setPasteText} transactions={transactions} setTransactions={setTransactions} saveTxns={saveTxns}/>

        {/* MANUAL */}
        {importMode==="manual"&&<>
          <Lbl>Ticker {form.ticker&&KNOWN_TICKERS[form.ticker.toUpperCase()]&&form.ticker.toUpperCase()!==KNOWN_TICKERS[form.ticker.toUpperCase()]&&<span style={{fontSize:10,color:T.green,marginLeft:6}}>→ Se usará {KNOWN_TICKERS[form.ticker.toUpperCase()]}</span>}</Lbl>
          <input type="text" value={form.ticker}
            onChange={e=>{
              const raw=e.target.value.toUpperCase();
              const resolved=KNOWN_TICKERS[raw]||raw;
              setF("ticker",resolved);
              // Auto-switch currency for LATAM stocks
              const latamInfo=getLatamSymbol(resolved);
              if(latamInfo){setF("priceCurrency",latamInfo.currency);}
              else if(resolved.length>=1){setF("priceCurrency","USD");}
            }}
            placeholder={lang==="es"?"Ej: ADBE, AAPL, MSFT, EC...":"e.g. ADBE, AAPL, MSFT, EC..."}
            onKeyDown={e=>e.key==="Enter"&&addPosition()}
            style={{marginBottom:4,fontWeight:700,fontSize:15,letterSpacing:"0.05em"}}/>
          <div style={{fontSize:10,color:T.muted,marginBottom:10}}>
            {lang==="es"?"Escribe el símbolo (ADBE) o el nombre (Adobe) — lo convertimos automáticamente":"Type ticker (ADBE) or company name (Adobe) — we auto-convert it"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <Lbl>Shares</Lbl>
              <input type="number" value={form.shares} onChange={e=>setF("shares",e.target.value)} placeholder="10" min={0} step={0.001}/>
            </div>
            <div>
              <Lbl>{lang==="es"?"Precio de compra":"Buy Price"} ({form.priceCurrency})</Lbl>
              <div style={{display:"flex",gap:6}}>
                <input type="number" value={form.buyPrice} onChange={e=>setF("buyPrice",e.target.value)}
                  placeholder={form.priceCurrency==="COP"?"18000":"150.00"} min={0}
                  step={form.priceCurrency==="COP"?10:0.01} style={{flex:1}}/>
                <select value={form.priceCurrency} onChange={e=>setF("priceCurrency",e.target.value)}
                  style={{width:70,padding:"6px 4px",fontSize:11,fontWeight:600}}>
                  <option value="USD">USD 🇺🇸</option>
                  <option value="COP">COP 🇨🇴</option>
                  <option value="BRL">BRL 🇧🇷</option>
                  <option value="CLP">CLP 🇨🇱</option>
                  <option value="ARS">ARS 🇦🇷</option>
                  <option value="MXN">MXN 🇲🇽</option>
                  <option value="PEN">PEN 🇵🇪</option>
                </select>
              </div>
              {form.priceCurrency!=="USD"&&parseFloat(form.buyPrice)>0&&(CURRENCIES[form.priceCurrency]?.rate||0)>1&&<div style={{fontSize:10,color:T.muted,marginTop:3}}>
                {"≈ $"+(parseFloat(form.buyPrice)/(CURRENCIES[form.priceCurrency]?.rate||1)).toFixed(2)+" USD"}
              </div>}
            </div>
          </div>
          <Lbl>Date Purchased (optional)</Lbl>
          <input type="date" value={form.date} onChange={e=>setF("date",e.target.value)} style={{marginBottom:16}}/>
          <button className="btn btn-gold" onClick={addPosition} style={{width:"100%",padding:"12px 0",fontSize:14,borderRadius:10}}>
            {lang==="es"?"➕ Agregar al Portafolio":"➕ Add to Portfolio"}
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

        {/* CSV UPLOAD — Guided broker import */}
        {importMode==="csv"&&<>
          {!previewData&&<>
            {/* Broker cards — only show steps for CSV brokers */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[
                {id:"xtb",flag:"🌎",name:"XTB",steps:lang==="es"?["Plataforma XTB → Historia de trading","Exporta como CSV (icono de descarga)","Sube el archivo directamente — lo detectamos automáticamente"]:["XTB Platform → Trading History","Export as CSV (download icon)","Upload directly — we auto-detect the format"]},
                {id:"ibkr",flag:"🇺🇸",name:"IBKR",steps:lang==="es"?["Client Portal → Reportes → Flex Query","Exporta Activity Statement en CSV","Sube el archivo aquí"]:["Client Portal → Reports → Flex Query","Export Activity Statement as CSV","Upload the file here"]},
              ].map(({id,flag,name,steps})=>(
                <div key={id} style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:12,color:T.text,fontWeight:600,marginBottom:6}}>{flag} {name}</div>
                  {steps.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:6,fontSize:10,color:T.muted,marginBottom:3,lineHeight:1.5}}>
                      <span style={{color:T.goldDim,fontWeight:600,flexShrink:0}}>{i+1}.</span>{s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* Universal format note */}
            <div style={{padding:"8px 12px",background:`${T.blue}08`,border:`1px solid ${T.blue}22`,borderRadius:8,marginBottom:12}}>
              <div style={{fontSize:10,color:T.blue,fontWeight:600,marginBottom:4}}>
                {lang==="es"?"Formato universal (cualquier broker)":"Universal format (any broker)"}
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>
                Ticker,Shares,Buy Price,Date<br/>
                NVDA,10,450.00,2024-01-15
              </div>
            </div>
            {/* Upload zone */}
            <label style={{display:"block",cursor:"pointer"}}>
              <div style={{border:`2px dashed ${T.goldDim}`,borderRadius:10,padding:"22px 16px",textAlign:"center",background:`${T.gold}05`,marginBottom:8}}>
                <div style={{fontSize:24,marginBottom:6}}>📂</div>
                <div style={{fontSize:13,color:T.gold,marginBottom:3}}>{lang==="es"?"Selecciona tu archivo CSV":"Select your CSV file"}</div>
                <div style={{fontSize:10,color:T.muted}}>.csv · .txt · Trii · HAPI · XTB · IBKR</div>
              </div>
              <input type="file" accept=".csv,.txt" onChange={parseCSV} style={{display:"none"}}/>
            </label>
          </>}

          {/* ── PREVIEW STEP — only for CSV brokers (ibkr, xtb, generic) ── */}
          {previewData&&previewData.broker!=="trii"&&previewData.broker!=="hapi"&&<>
            <div style={{marginBottom:12,padding:"10px 14px",background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,color:T.green,fontWeight:600}}>
                  {({ibkr:"Interactive Brokers",xtb:"XTB",trii:"🇨🇴 Trii",hapi:"🇨🇴🇲🇽 HAPI",generic:lang==="es"?"Genérico":"Generic"})[previewData.broker]||previewData.broker} {lang==="es"?"detectado":"detected"}
                </div>
                <div style={{fontSize:10,color:T.muted,marginTop:2}}>
                  {previewData.parsed.length} {lang==="es"?"posiciones listas para importar":"positions ready to import"}{previewData.skipped>0?` · ${previewData.skipped} ${lang==="es"?"ventas omitidas":"sells skipped"}`:""}
                </div>
              </div>
              <button className="seg" onClick={()=>setPreviewData(null)} style={{fontSize:10}}>{lang==="es"?"Cambiar archivo":"Change file"}</button>
            </div>
            {/* Preview table — shows open positions only (previewRows), imports full history */}
            {(()=>{
              const displayRows = previewData.previewRows || previewData.parsed;
              const totalTxns = previewData.parsed.length;
              const openCount = displayRows.length;
              const sellCount = previewData.parsed.filter(t=>t.type==="sell").length;
              return(<>
                <div style={{background:T.accent,borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:8,maxHeight:180,overflowY:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{background:T.surface}}>
                      {["Ticker","Acciones","Precio Prom.","Fecha"].map(h=>(
                        <th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {displayRows.slice(0,8).map((p,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${T.border}22`}}>
                          <td style={{padding:"5px 10px",fontFamily:"'DM Mono',monospace",color:T.gold,fontWeight:700}}>{p.ticker}</td>
                          <td style={{padding:"5px 10px",fontFamily:"'DM Mono',monospace",color:T.text}}>{typeof p.shares==="number"?p.shares.toFixed(4):p.shares}</td>
                          <td style={{padding:"5px 10px",fontFamily:"'DM Mono',monospace",color:T.text}}>${typeof p.price==="number"?p.price.toFixed(2):p.price}</td>
                          <td style={{padding:"5px 10px",color:T.muted,fontSize:10}}>{p.date}</td>
                        </tr>
                      ))}
                      {displayRows.length>8&&<tr>
                        <td colSpan={4} style={{padding:"5px 10px",fontSize:10,color:T.muted,textAlign:"center"}}>
                          +{displayRows.length-8} {lang==="es"?"más...":"more..."}
                        </td>
                      </tr>}
                    </tbody>
                  </table>
                </div>
                {sellCount>0&&<div style={{fontSize:10,color:T.blue,padding:"5px 10px",background:`${T.blue}10`,borderRadius:6,marginBottom:8}}>
                  ℹ️ {lang==="es"?`Incluye ${sellCount} ventas históricas para calcular P&G realizado`:`Includes ${sellCount} historical sells for realized P&G`}
                </div>}
                <button className="btn btn-gold" onClick={confirmImport} style={{width:"100%",padding:"11px 0",fontSize:14,borderRadius:10}}>
                  ✅ {lang==="es"?`Confirmar importación — ${openCount} posiciones abiertas`:`Confirm import — ${openCount} open positions`}
                </button>
              </>);
            })()}
          </>}
        </>}

        <div style={{marginTop:12,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.7}}>
          {lang==="es"?"💾 Las posiciones se guardan automáticamente. Toca ":"💾 Positions save automatically. Click "}<span style={{color:T.gold}}>{lang==="es"?"Actualizar Precios":"Refresh Prices"}</span>{lang==="es"?" para datos en vivo.":" for live data."}
        </div>
      </Card>

      {/* Positions Table + Pie Chart */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {transactions.length===0
          ?<Card s={{textAlign:"center",padding:48,background:`${T.gold}06`,border:`1px dashed ${T.goldDim}44`}}>
            <div style={{fontSize:36,marginBottom:12}}>📁</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.gold,marginBottom:8}}>Your portfolio is empty</div>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>{lang==="es"?<>Agrega tu primera posición usando el formulario.<br/>Luego toca <strong style={{color:T.gold}}>Actualizar Precios</strong> para datos en vivo y <strong style={{color:T.gold}}>Análisis IA</strong> para el score de calidad.</>:<>Add your first position using the form on the left.<br/>Then hit <strong style={{color:T.gold}}>Refresh Prices</strong> for live data and <strong style={{color:T.gold}}>AI Analysis</strong> for a quality score assessment.</>}</div>
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
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>{grouped.length} Stock{grouped.length!==1?"s":""} · {transactions.length} Transacci{transactions.length!==1?"ones":"ón"}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>{lang==="es"?"Varias compras del mismo activo se agrupan con costo promedio":"Multiple buys of the same stock are grouped with average cost basis"}</div>
                </div>
                {grouped.length>0&&!prices[grouped[0]?.ticker]&&<div style={{fontSize:11,color:T.muted}}>
⚡ {lang==="es"?"Actualizando precios...":"Updating prices..."}
</div>}
              </div>
              {/* Tabs: Posiciones | Ventas */}
              <div style={{display:"flex",gap:4,padding:"10px 14px",borderBottom:`1px solid ${T.border}`}}>
                {[
                  {id:"positions",label:lang==="es"?"📊 Posiciones abiertas":"📊 Open Positions"},
                  {id:"sells",label:lang==="es"?`💰 Ventas (${transactions.filter(t=>t.type==="sell").length})`:`💰 Sells (${transactions.filter(t=>t.type==="sell").length})`},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setPortTab(t.id)}
                    style={{fontSize:11,padding:"5px 14px",borderRadius:8,cursor:"pointer",fontWeight:portTab===t.id?700:400,
                      background:portTab===t.id?`${T.gold}20`:"transparent",
                      border:`1px solid ${portTab===t.id?T.goldDim:T.border}`,
                      color:portTab===t.id?T.gold:T.muted}}>
                    {t.label}
                  </button>
                ))}
              </div>
              {portTab==="sells"&&<SellHistoryTab transactions={transactions} enriched={enriched}
                onEdit={(id,updates)=>{const u=transactions.map(t=>t.id===id?{...t,...updates}:t);setTransactions(u);saveTxns(u);}}
                onDelete={(id)=>{const u=transactions.filter(t=>t.id!==id);setTransactions(u);saveTxns(u);}}
                lang={lang} fmt={fmt}/>}
              {portTab==="positions"&&<div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:750}}>
                  <thead><tr style={{background:T.accent,borderBottom:`1px solid ${T.border}`}}>
                    {["","Ticker",lang==="es"?"Acciones":"Shares",lang==="es"?"Costo Prom.":"Avg Cost",lang==="es"?"Precio Actual":"Current Price","P&G No Real.","P&G %",lang==="es"?"Veredicto IA":"AI Verdict",lang==="es"?"Acción":"Action"].map((h,i)=>(
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
                        <td style={{padding:"8px 12px",textAlign:"center",minWidth:90}}>
                          <div style={{fontWeight:700,fontSize:13,color:T.text,fontFamily:"'DM Mono',monospace"}}>{p.ticker}</div>
                          {p.realizedPnL!==0&&<div style={{fontSize:8,color:p.realizedPnL>=0?T.green:T.red,marginTop:1}}>Real: {p.realizedPnL>=0?"+":""}${Math.abs(p.realizedPnL).toFixed(0)}</div>}
                          <TxnHistory entries={p.entries||[]} avgCost={p.avgCost} lang={lang}/>
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={12}>{p.totalShares.toFixed(3)}</Mn></td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}><Mn sz={12} c={T.muted}>${p.avgCost.toFixed(2)}</Mn></td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.currentPrice?<Mn sz={13} c={T.gold} s={{fontWeight:700}}>${p.currentPrice.toFixed(2)}</Mn>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.pnlDollar!=null?<Mn sz={12} c={p.pnlDollar>=0?T.green:T.red} s={{fontWeight:600}}>{p.pnlDollar>=0?"+":""}${Math.abs(p.pnlDollar).toLocaleString("en-US",{maximumFractionDigits:0})}</Mn>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {p.pnlPct!=null?<span style={{fontSize:12,padding:"2px 8px",borderRadius:20,background:p.pnlPct>=0?`${T.green}18`:`${T.red}18`,color:p.pnlPct>=0?T.green:T.red,fontWeight:600}}>{p.pnlPct>=0?"+":""}{p.pnlPct.toFixed(2)}%</span>:<span style={{fontSize:11,color:T.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"right"}}>
                          {verdict?<span style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:`${verdictColor(verdict.verdict)}18`,color:verdictColor(verdict.verdict),border:`1px solid ${verdictColor(verdict.verdict)}33`,fontWeight:600,whiteSpace:"nowrap"}}>{verdict.verdict}</span>:<span style={{fontSize:11,color:T.muted}}>{lang==="es"?"Analizar":"Run AI"}</span>}
                        </td>
                        <td style={{padding:"8px 10px",textAlign:"right"}}>
                          <div style={{display:"flex",gap:5,justifyContent:"flex-end",alignItems:"center"}}>
                            <button onClick={()=>setSellTarget({...p,currentPrice:prices[p.ticker]?.price||null})}
                              style={{background:`${T.green}18`,border:`1px solid ${T.green}33`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10,color:T.green,fontWeight:600,whiteSpace:"nowrap"}}
                              onMouseEnter={e=>{e.currentTarget.style.background=`${T.green}30`}}
                              onMouseLeave={e=>{e.currentTarget.style.background=`${T.green}18`}}>
                              {lang==="es"?"Vender":"Sell"}
                            </button>
                            <button onClick={()=>removePosition(p.ticker)}
                              style={{background:"none",border:"none",cursor:"pointer",color:T.muted,padding:"2px 4px"}}
                              onMouseEnter={e=>e.currentTarget.style.color=T.red}
                              onMouseLeave={e=>e.currentTarget.style.color=T.muted}
                              title="Eliminar">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>;
                    })}
                  </tbody>
                  <tfoot><tr style={{borderTop:`2px solid ${T.border}`,background:T.accent}}>
                    <td colSpan={2} style={{padding:"12px",textAlign:"center"}}><Mn sz={11} c={T.gold}>TOTAL</Mn></td>
                    <td colSpan={2}/>
                    <td style={{padding:"12px",textAlign:"right",fontSize:10,color:T.muted}}>{lang==="es"?"Valor actual":"Current value"}</td>
                    <td style={{padding:"12px",textAlign:"right"}}><Mn sz={13} c={T.gold} s={{fontWeight:700}}>${totalValue.toLocaleString("en-US",{maximumFractionDigits:0})}</Mn></td>
                    <td style={{padding:"12px",textAlign:"right"}}><span style={{fontSize:12,padding:"2px 8px",borderRadius:20,background:totalUnrealizedPnL>=0?`${T.green}18`:`${T.red}18`,color:totalUnrealizedPnL>=0?T.green:T.red,fontWeight:700}}>{totalUnrealizedPnL>=0?"+":""}{totalCost>0?((totalUnrealizedPnL/totalCost)*100).toFixed(2):"0.00"}%</span></td>
                    <td colSpan={2} style={{padding:"12px",textAlign:"right"}}>
                      {totalRealizedPnL!==0&&<div style={{fontSize:11,color:totalRealizedPnL>=0?T.green:T.red,fontWeight:600}}>Real: {totalRealizedPnL>=0?"+":""}${Math.abs(totalRealizedPnL).toLocaleString("en-US",{maximumFractionDigits:0})}</div>}
                    </td>
                  </tr></tfoot>
                </table>
              </div>}
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

        {/* ── REBALANCE + DCA ── always visible ── */}
        {grouped.length>0&&<div id="rebalance-dca-section"><RebalanceDCA positions={enriched} totalValue={totalValue} savedProfile={savedProfile} callAI={callAI} lang={lang}/></div>}
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.gold,marginBottom:10,fontWeight:700}}>{lang==="es"?"Tu estrategia de inversión personalizada":"Your personalized investment strategy"}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:640,margin:"0 auto 28px"}}>
        {[
          {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,t:lang==="es"?"Perfil de Riesgo":"Risk Profile",d:lang==="es"?"Conservador · Moderado · Agresivo":"Conservative · Moderate · Aggressive"},
          {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,t:lang==="es"?"Acciones + ETFs":"Stocks + ETFs",d:lang==="es"?"Seleccionados por la IA según tu perfil":"AI-selected to match your profile"},
          {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,t:lang==="es"?"Seguimiento real":"Real tracking",d:lang==="es"?"Compara tu portafolio vs el plan":"Compare your portfolio vs the plan"},
        ].map(({icon,t,d},i)=>(
          <div key={i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
            <div style={{color:T.gold,marginBottom:8,display:"flex",justifyContent:"center"}}>{icon}</div>
            <div style={{fontSize:12,color:T.text,fontWeight:600,marginBottom:4}}>{t}</div>
            <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:T.muted,maxWidth:520,margin:"0 auto 32px",lineHeight:1.8}}>
        {lang==="es"
  ?<>Inversoria analiza tu perfil de inversor y construye un portafolio personalizado de acciones y ETFs — seleccionados según tu tolerancia al riesgo, horizonte de inversión y monto disponible. Luego rastrea tu avance real vs el plan recomendado.</>
  :<>Inversoria analyzes your investor profile and builds a personalized portfolio of stocks and ETFs — selected based on your risk tolerance, investment horizon, and available capital. Then tracks your real progress vs the recommended plan.</>}
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold" onClick={onGoToProfile} style={{fontSize:14,padding:"13px 28px",borderRadius:10,display:"flex",alignItems:"center",gap:8}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {lang==="es"?"Crear Mi Perfil de Riesgo →":"Create My Risk Profile →"}
        </button>
        {positions.length>0&&<button className="btn btn-outline" onClick={onGoToPortfolio} style={{padding:"13px 20px",borderRadius:10,display:"flex",alignItems:"center",gap:8}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          {lang==="es"?"Ya tengo un portafolio":"I already have a portfolio"}
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
// ── METHODOLOGY MODAL ─────────────────────────────────────────────────────
function MethodologyModal({onClose,lang="en"}){
  const isEs=lang==="es";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}
      onClick={onClose}>
      <div style={{background:"#13132a",border:`1px solid #a78bfa44`,borderRadius:16,maxWidth:640,width:"100%",maxHeight:"85vh",overflowY:"auto",padding:32}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M5 24 Q9 24 12 18 Q16 11 20 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 8 L20 13 M20 8 L25 8 L25 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="25" cy="8" r="2.5" fill="#c4b5fd"/>
            </svg>
          </div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f0eeff",fontWeight:700}}>
              {isEs?"Cómo Funciona Inversoria":"How Inversoria Works"}
            </div>
            <div style={{fontSize:11,color:"#8888aa",marginTop:2}}>
              {isEs?"Metodología, fuentes de datos y limitaciones":"Methodology, data sources and limitations"}
            </div>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#8888aa",padding:4}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Sections */}
        {[
          {
            icon:"📊",
            title:isEs?"Fuentes de datos":"Data sources",
            body:isEs
              ?"Inversoria utiliza datos de Finnhub (precios en tiempo real, consenso de analistas de Wall Street, estimaciones de EPS y precio objetivo) para empresas listadas en NYSE, NASDAQ y principales bolsas globales. Para empresas LATAM locales, usamos estimaciones cualitativas basadas en reportes públicos."
              :"Inversoria uses Finnhub data (real-time prices, Wall Street analyst consensus, EPS estimates and price targets) for companies listed on NYSE, NASDAQ and major global exchanges. For local LATAM companies, we use qualitative estimates based on public reports."
          },
          {
            icon:"🧠",
            title:isEs?"Metodología de análisis":"Analysis methodology",
            body:isEs
              ?"Nuestro modelo de análisis sigue el Método del Inversor Paciente: evaluamos la fosa del negocio, la calidad del negocio, el crecimiento de FCF, el retorno sobre capital invertido (ROIC), la deuda y el margen operativo. La IA sintetiza estos factores con datos de mercado para producir una puntuación de calidad."
              :"Our analysis model follows the Patient Investor Method: we evaluate the business moat, business quality, FCF growth, return on invested capital (ROIC), debt levels and operating margin. The AI synthesizes these factors with market data to produce a quality score."
          },
          {
            icon:"🤖",
            title:isEs?"Rol de la inteligencia artificial":"Role of artificial intelligence",
            body:isEs
              ?"Utilizamos Claude de Anthropic para interpretar datos financieros y generar el análisis narrativo. La IA no toma decisiones de inversión ni predice precios futuros — su función es explicar los datos existentes en términos comprensibles, identificar fortalezas y riesgos, y contextualizar el negocio."
              :"We use Anthropic's Claude to interpret financial data and generate narrative analysis. The AI does not make investment decisions or predict future prices — its function is to explain existing data in understandable terms, identify strengths and risks, and contextualize the business."
          },
          {
            icon:"⚖️",
            title:isEs?"Limitaciones importantes":"Important limitations",
            body:isEs
              ?"Inversoria es una herramienta educativa. Los análisis son orientativos y no constituyen asesoría financiera certificada. Los datos tienen un retraso de hasta 15 minutos. Las estimaciones para empresas sin cobertura de analistas son aproximaciones. El rendimiento pasado no garantiza resultados futuros. Toda inversión conlleva riesgo de pérdida."
              :"Inversoria is an educational tool. Analyses are indicative and do not constitute certified financial advice. Data may be delayed up to 15 minutes. Estimates for companies without analyst coverage are approximations. Past performance does not guarantee future results. All investments carry risk of loss."
          },
          {
            icon:"🏢",
            title:isEs?"Sobre Inversoria":"About Inversoria",
            body:isEs
              ?"Inversoria es una plataforma independiente de educación e información financiera enfocada en el mercado latinoamericano. No somos un broker, no gestionamos dinero y no ejecutamos operaciones. Nuestro objetivo es democratizar el acceso a análisis de calidad institucional para el inversor individual en LATAM. Contacto: hola@inversoria.lat"
              :"Inversoria is an independent financial education and information platform focused on the Latin American market. We are not a broker, we do not manage money and we do not execute trades. Our goal is to democratize access to institutional-quality analysis for individual investors in LATAM. Contact: hola@inversoria.lat"
          },
        ].map(({icon,title,body},i)=>(
          <div key={i} style={{marginBottom:20,paddingBottom:20,borderBottom:i<4?`1px solid #252548`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:18}}>{icon}</span>
              <span style={{fontSize:14,color:"#f0eeff",fontWeight:600}}>{title}</span>
            </div>
            <p style={{fontSize:12,color:"#8888aa",lineHeight:1.8,margin:0}}>{body}</p>
          </div>
        ))}

        {/* Disclaimer box */}
        <div style={{background:"#1a1535",border:`1px solid #a78bfa33`,borderRadius:10,padding:"12px 16px",marginTop:8}}>
          <div style={{fontSize:11,color:"#a78bfa",fontWeight:600,marginBottom:6}}>
            {isEs?"⚠️ Aviso Legal":"⚠️ Legal Notice"}
          </div>
          <p style={{fontSize:11,color:"#8888aa",lineHeight:1.7,margin:0}}>
            {isEs
              ?"La información proporcionada por Inversoria tiene exclusivamente fines educativos e informativos. No somos asesores financieros certificados. Ningún contenido de esta plataforma debe interpretarse como una recomendación de inversión personalizada. Antes de invertir, considera tu situación financiera personal y consulta con un profesional certificado."
              :"Information provided by Inversoria is for educational and informational purposes only. We are not certified financial advisors. No content on this platform should be interpreted as a personalized investment recommendation. Before investing, consider your personal financial situation and consult with a certified professional."}
          </p>
        </div>

      </div>
    </div>
  );
}

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
          {t:"1. Aceptación de los Términos",b:`Al acceder y usar Inversoria (la "Plataforma"), aceptas estar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes usar la Plataforma.\n\nEl uso de la Plataforma está disponible para personas mayores de 18 años con capacidad legal para celebrar contratos.`},
          {t:"2. Descripción del Servicio",b:`Inversoria es una plataforma educativa de análisis de inversiones que ofrece:\n\n• Calculadora de interés compuesto.\n• Análisis de acciones mediante inteligencia artificial (El Método del Inversor Paciente).\n• Quiz de perfil de riesgo de inversor.\n• Seguimiento de portafolio con precios de mercado.\n• Herramientas de planificación DCA y rebalanceo.\n• Dashboard de ciclos de mercado.\n\nEl servicio se ofrece en modalidades gratuita y de pago (suscripción mensual).`},
          {t:"3. AVISO IMPORTANTE — No es Asesoría Financiera",b:`TODO EL CONTENIDO DE COMPOUNDER ANALYST ES EXCLUSIVAMENTE EDUCATIVO E INFORMATIVO.\n\n• No somos una firma de asesoría de inversiones registrada.\n• Los análisis generados por IA son estimaciones educativas, NO recomendaciones de inversión.\n• Los scores de calidad, análisis de moat y proyecciones DCF son herramientas de aprendizaje.\n• Los consensos de analistas provienen de fuentes públicas y pueden no estar actualizados.\n• Las rentabilidades pasadas no garantizan rentabilidades futuras.\n\nSiempre consulta con un asesor financiero certificado antes de tomar decisiones de inversión. Invertir conlleva riesgos, incluyendo la pérdida total del capital invertido.`},
          {t:"4. Planes y Pagos",b:`La Plataforma ofrece:\n\n• Plan Gratuito: Acceso limitado a funciones básicas (3 análisis, 5 acciones en portafolio, 2 planes DCA).\n• Plan Basic ($9.99/mes): Análisis ilimitados, portafolio ilimitado, ciclo de mercado.\n• Plan Premium ($19.99/mes): Todas las funciones incluyendo portafolio IA y estrategia avanzada.\n\nLos pagos se procesan de forma segura a través de Stripe. Las suscripciones se renuevan automáticamente. Puedes cancelar en cualquier momento desde tu cuenta.`},
          {t:"5. Política de Reembolsos",b:`• Puedes solicitar reembolso completo dentro de los primeros 7 días de tu primera suscripción.\n• No aplicamos reembolsos proporcionales por cancelaciones a mitad del período.\n• Para solicitar un reembolso: hola@inversoria.lat\n• Los reembolsos se procesan en 5-10 días hábiles.`},
          {t:"6. Cuenta de Usuario",b:`• Eres responsable de mantener la confidencialidad de tu contraseña.\n• No puedes compartir, vender o transferir tu cuenta.\n• Debes notificarnos inmediatamente de cualquier uso no autorizado.\n• Nos reservamos el derecho de suspender cuentas que violen estos términos.`},
          {t:"7. Propiedad Intelectual",b:`• Todo el contenido de la Plataforma (código, diseño, textos, análisis generados) es propiedad de Inversoria.\n• Se te otorga una licencia limitada, no exclusiva y no transferible para uso personal.\n• No puedes copiar, distribuir, modificar o crear obras derivadas sin autorización escrita.\n• Los datos de mercado y análisis son para uso personal exclusivamente.`},
          {t:"8. Limitación de Responsabilidad",b:`EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE:\n\n• No nos responsabilizamos por pérdidas de inversión derivadas del uso de la Plataforma.\n• No garantizamos la exactitud, completitud o actualidad de los datos de mercado.\n• No somos responsables por interrupciones del servicio, errores de terceros (APIs de datos) o pérdida de datos.\n• Nuestra responsabilidad máxima se limita al monto pagado por el usuario en los últimos 3 meses.`},
          {t:"9. Conducta del Usuario",b:`Está prohibido:\n\n• Usar la Plataforma para fines ilegales o no autorizados.\n• Intentar acceder a cuentas de otros usuarios.\n• Realizar ingeniería inversa del software.\n• Usar bots o scraping automatizado.\n• Compartir tu cuenta con terceros.\n• Publicar contenido falso o engañoso.`},
          {t:"10. Modificaciones del Servicio",b:`Nos reservamos el derecho de:\n\n• Modificar o discontinuar funciones con 30 días de aviso.\n• Cambiar los precios de suscripción con 30 días de aviso.\n• Actualizar estos Términos con notificación por email.\n\nEl uso continuado tras los cambios implica aceptación.`},
          {t:"11. Ley Aplicable y Jurisdicción",b:`Estos Términos se rigen por las leyes de la República de Colombia. Cualquier disputa se someterá a los tribunales competentes de Bogotá, Colombia, sin perjuicio de los derechos que la normativa local de tu país de residencia te pueda otorgar como consumidor.`},
          {t:"12. Contacto",b:`Para cualquier consulta sobre estos Términos:\n📧 hola@inversoria.lat\n🌐 inversoria.lat`},
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
const TABS=[
  {id:"score",es:"Analizar Acción",en:"Analyze Stock",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
  {id:"profile",es:"Perfil de Riesgo",en:"Risk Profile",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  {id:"portfolio",es:"Mi Portafolio",en:"My Portfolio",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>},
  {id:"strategy",es:"Mi Estrategia",en:"My Strategy",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
  {id:"compound",es:"Calculadora",en:"Calculator",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/></svg>},
  {id:"whatif",es:"¿Y si...?",en:"What If?",icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>},
];
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


// ── ONBOARDING TOUR ──────────────────────────────────────────────────────────
const TOUR_KEY = "inversoria_toured_v1";

function OnboardingTour({lang="es", onFinish}){
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState(null);
  const isEs = lang === "es";

  const STEPS = [
    { target: null,            icon:"👋", title: isEs?"Bienvenido a Inversoria":"Welcome to Inversoria",    body: isEs?"En 2 minutos te mostramos todo lo que puedes hacer aquí.":"In 2 minutes we'll show you everything you can do here.", cta: isEs?"Sí, mostrarme →":"Yes, show me →" },
    { target:"tour-score",     icon:"🎯", title: isEs?"Analiza cualquier acción":"Analyze any stock",         body: isEs?"Escribe NVDA, Apple o Ecopetrol — en 30 segundos obtienes un score de calidad con los 8 filtros del inversor paciente.":"Type NVDA, Apple or any company — in 30 seconds you get a quality score with 8 patient investor filters.", cta: isEs?"Siguiente →":"Next →" },
    { target:"tour-profile",   icon:"🧬", title: isEs?"Descubre tu perfil de riesgo":"Find your risk profile",  body: isEs?"8 preguntas para saber si eres Conservador, Moderado o Agresivo. La IA arma un portafolio personalizado para ti.":"8 questions to find if you're Conservative, Moderate or Aggressive. AI builds your personal portfolio.", cta: isEs?"Siguiente →":"Next →" },
    { target:"tour-portfolio", icon:"📁", title: isEs?"Sigue tu dinero en tiempo real":"Track your money live",  body: isEs?"Agrega tus acciones y ve tu P&G al instante. Registra compras y ventas — el costo promedio se calcula solo.":"Add your stocks and see P&L instantly. Log buys and sells — avg cost is calculated automatically.", cta: isEs?"Siguiente →":"Next →" },
    { target:"tour-compound",  icon:"📈", title: isEs?"Calcula tu meta de riqueza":"Calculate your wealth goal", body: isEs?"¿Cuánto ahorrar para llegar a $1M? La calculadora de interés compuesto te dice exactamente cuándo y cuánto.":"How much to save to reach $1M? The compound calculator tells you exactly when and how much.", cta: isEs?"¡Entendido, empezar! 🚀":"Got it, let's start! 🚀" },
  ];

  const current = STEPS[step];
  const total = STEPS.length;

  useEffect(()=>{
    if(!current.target){setPos(null);return;}
    const el=document.querySelector(`[data-tour="${current.target}"]`);
    if(!el){setPos(null);return;}
    const r=el.getBoundingClientRect();
    setPos({top:r.bottom+14, centerX:r.left+r.width/2, rect:r});
  },[step]);

  const finish=()=>{
    try{localStorage.setItem(TOUR_KEY,"1");}catch(e){}
    onFinish();
  };

  const next=()=>{ step<total-1?setStep(s=>s+1):finish(); };

  const Dots=()=><div style={{display:"flex",gap:5,marginBottom:16}}>
    {STEPS.map((_,i)=><div key={i} style={{height:4,borderRadius:2,transition:"all 0.35s ease",
      background:i===step?"#a78bfa":i<step?"#5b4d8a":"#252548",
      width:i===step?20:6}}/>)}
  </div>;

  const cardStyle={
    background:"linear-gradient(145deg,#1a1540,#13102e)",
    border:"1px solid #5b4d8a",
    borderRadius:18,
    padding:"22px 20px",
    boxShadow:"0 24px 64px rgba(0,0,0,0.65),inset 0 1px 0 rgba(167,139,250,0.12)",
  };

  const BtnPrimary=({onClick,children})=>(
    <button onClick={onClick} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:13,fontWeight:600,cursor:"pointer",letterSpacing:"0.02em"}}>
      {children}
    </button>
  );

  const BtnSkip=()=>(
    <button onClick={finish} style={{background:"none",border:"none",color:"#8888aa",fontSize:11,cursor:"pointer",textAlign:"center",padding:"4px 0",marginTop:2,width:"100%"}}>
      {isEs?"Saltar tour":"Skip tour"}
    </button>
  );

  // Welcome modal (step 0)
  if(!current.target) return(
    <div style={{position:"fixed",inset:0,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{position:"absolute",inset:0,background:"rgba(5,3,20,0.85)",backdropFilter:"blur(3px)"}} onClick={e=>e.stopPropagation()}/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:300,animation:"fadeIn 0.25s ease both"}}>
        <div style={{...cardStyle,textAlign:"center",padding:"28px 24px"}}>
          <Dots/>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:20,padding:"4px 12px",fontSize:10,color:"#34d399",marginBottom:16,letterSpacing:"0.05em"}}>
            ✦ {isEs?"Primera visita":"First visit"}
          </div>
          <div style={{fontSize:32,marginBottom:12}}>👋</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f0eeff",fontWeight:700,marginBottom:10,lineHeight:1.25}}>
            {isEs?"Bienvenido a Inversoria":"Welcome to Inversoria"}
          </div>
          <div style={{fontSize:13,color:"#8888aa",lineHeight:1.7,marginBottom:22}}>
            {isEs?"En 2 minutos te mostramos todo lo que puedes hacer aquí.":"In 2 minutes we'll show you everything you can do here."}
          </div>
          <BtnPrimary onClick={next}>{isEs?"Sí, mostrarme →":"Yes, show me →"}</BtnPrimary>
          <BtnSkip/>
        </div>
      </div>
    </div>
  );

  // Tooltip steps (1-4)
  const TT_WIDTH = 300;
  const viewW = typeof window!=="undefined"?window.innerWidth:1200;
  const viewH = typeof window!=="undefined"?window.innerHeight:800;
  const ttLeft = pos ? Math.max(12, Math.min(pos.centerX - TT_WIDTH/2, viewW - TT_WIDTH - 12)) : viewW/2 - TT_WIDTH/2;
  const ttTop  = pos ? Math.min(pos.top, viewH - 320) : viewH/2 - 160;
  const arrowLeft = pos ? Math.max(14, Math.min(pos.centerX - ttLeft - 8, TT_WIDTH - 30)) : TT_WIDTH/2 - 8;
  const spotRect = pos?.rect;

  return(
    <div style={{position:"fixed",inset:0,zIndex:3000}} onClick={e=>e.stopPropagation()}>
      {/* Overlay */}
      <div style={{position:"absolute",inset:0,background:"rgba(5,3,20,0.82)",backdropFilter:"blur(2px)"}}/>

      {/* Spotlight ring */}
      {spotRect&&<div style={{
        position:"absolute",
        top: spotRect.top - 6,
        left: spotRect.left - 8,
        width: spotRect.width + 16,
        height: spotRect.height + 12,
        borderRadius:10,
        boxShadow:`0 0 0 9999px rgba(5,3,20,0.82), 0 0 0 2px #a78bfa, 0 0 20px rgba(167,139,250,0.4)`,
        pointerEvents:"none",
        zIndex:1,
        transition:"all 0.35s cubic-bezier(.4,0,.2,1)",
      }}/>}

      {/* Tooltip */}
      <div style={{position:"absolute",top:ttTop,left:ttLeft,width:TT_WIDTH,zIndex:2,animation:"fadeIn 0.22s ease both"}}>
        {/* Arrow */}
        <div style={{position:"absolute",top:-8,left:arrowLeft,width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderBottom:"8px solid #5b4d8a"}}>
          <div style={{position:"absolute",top:2,left:-7,width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderBottom:"7px solid #1a1540"}}/>
        </div>
        <div style={cardStyle}>
          <Dots/>
          <div style={{fontSize:10,color:"#5b4d8a",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>
            {isEs?`Paso ${step} de ${total-1}`:`Step ${step} of ${total-1}`}
          </div>
          <div style={{fontSize:24,marginBottom:10}}>{current.icon}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#f0eeff",fontWeight:700,marginBottom:8,lineHeight:1.3}}>{current.title}</div>
          <div style={{fontSize:12,color:"#8888aa",lineHeight:1.75,marginBottom:18}}>{current.body}</div>
          <BtnPrimary onClick={next}>{current.cta}</BtnPrimary>
          <BtnSkip/>
        </div>
      </div>
    </div>
  );
}

export default function App(){
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
  const [prevTab,setPrevTab]=useState(null); // tab antes del paywall
  const [showTour,setShowTour]=useState(()=>{
    try{return !localStorage.getItem(TOUR_KEY);}catch{return false;}
  });
  const [portfolioBalance,setPortfolioBalance]=useState(0); // total invested en portafolio
  const [adminMode,setAdminMode]=useState(isAdmin());
  const [showPrivacy,setShowPrivacy]=useState(false);
  const [showTerms,setShowTerms]=useState(false);
  const [showMethodology,setShowMethodology]=useState(false);

  useState(()=>{
    const handler=(e)=>{
      if(e.ctrlKey&&e.shiftKey&&e.key==="A"){localStorage.setItem("inversoria_admin","true");setAdminMode(true);alert("✅ Admin mode ON — unlimited access");}
      if(e.ctrlKey&&e.shiftKey&&e.key==="D"){localStorage.removeItem("inversoria_admin");setAdminMode(false);alert("🔒 Admin mode OFF");}
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  });

  // ── SUPABASE AUTH LISTENER ──
    // Load SheetJS for Excel
  useEffect(()=>{
    if(!window.XLSX){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(s);}
  },[]);

  useEffect(()=>{
    if(!supabase)return;
    // Get current session on mount
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){setUser(session.user);syncUserPlan(session.user.id);setTab("portfolio");}
    });
    // Listen for auth changes
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session?.user){setUser(session.user);syncUserPlan(session.user.id);setTab(t=>t===null?"portfolio":t);}
      else{setUser(null);setUserPlan("free");setTab(null);}
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

  const canAnalyze=(ctx="stock")=>{if(isPremium())return true;const c=getCount();if(c>=FREE_LIMIT){setPaywallContext(ctx);setPrevTab(tab);setShowPaywall(true);return false;}return true;};
  const onAnalysis=()=>{incCount();};
  const handleStart=(targetTab="compound",ticker="")=>{setTab(targetTab||"compound");if(ticker)setCompany(ticker);};

  return<ErrorBoundary>
  <div style={{minHeight:"100vh",background:T.bg}} onClick={()=>showCurrMenu&&setShowCurrMenu(false)}>
    <style>{css}</style>
    {showPrivacy&&<PrivacyPolicy onClose={()=>setShowPrivacy(false)} lang={lang}/>}
    {showTerms&&<TermsOfService onClose={()=>setShowTerms(false)} lang={lang}/>}
    {showMethodology&&<MethodologyModal onClose={()=>setShowMethodology(false)} lang={lang}/>}
    {showPaywall&&<PaywallModal onClose={()=>{setShowPaywall(false);setTab(prevTab||"score");setPrevTab(null);}} context={paywallContext} lang={lang}
      onSignUp={()=>{setShowPaywall(false);setAuthMode("signup");setShowAuth(true);}}/>}
    {showAuth&&<AuthModal lang={lang} initialMode={authMode}
      onClose={()=>setShowAuth(false)}
      onAuth={(u)=>{setUser(u);setShowAuth(false);}}/>}
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 28px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(8px)"}}>
      <div style={{maxWidth:1380,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 0"}}>
          <div onClick={()=>setTab(null)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:T.purple,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 12px ${T.purple}66`}}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M5 24 Q9 24 12 18 Q16 11 20 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M20 8 L20 13 M20 8 L25 8 L25 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="25" cy="8" r="2.5" fill="#c4b5fd"/>
              </svg>
            </div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.text,letterSpacing:"0.01em",lineHeight:1,fontWeight:700}}>{L.nav_brand}</div>
              <div className="nav-brand-sub" style={{fontSize:8,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2}}>{L.nav_sub}</div>
            </div>
          </div>
          <div className="nav-actions" style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Lang switcher — refined */}
            <button onClick={toggleLang} style={{background:`${T.gold}12`,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"5px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=`${T.gold}22`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${T.gold}12`;}}>
              <span style={{fontSize:12}}>{lang==="en"?"🇨🇴":"🇺🇸"}</span>
              <span style={{fontSize:11,color:T.gold,fontWeight:700,letterSpacing:"0.05em"}}>{lang==="en"?"ES":"EN"}</span>
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
              <div style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${T.purple},${T.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0}}>
                {user.email?.[0]?.toUpperCase()||"U"}
              </div>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.03em",color:userPlan==="premium"?T.gold:userPlan==="basic"?T.green:T.muted}}>
                {userPlan==="premium"?"★ Premium":userPlan==="basic"?"✓ Basic":lang==="es"?"Gratis":"Free"}
              </span>
              <button onClick={signOut}
                style={{background:"none",border:"none",cursor:"pointer",color:T.muted,padding:"0 2px",display:"flex",alignItems:"center"}}
                title={lang==="es"?"Cerrar sesión":"Sign out"}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>}
            {!user&&<button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={{background:`${T.purple}12`,border:`1px solid ${T.gold}35`,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:11,color:T.gold,fontWeight:600,letterSpacing:"0.03em"}}>
              {lang==="es"?"Iniciar Sesión":"Sign In"}
            </button>}
            {adminMode
              ?<div style={{fontSize:11,color:T.green,padding:"4px 10px",border:`1px solid ${T.green}44`,borderRadius:8,background:`${T.green}10`,display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Admin
              </div>
              :(userPlan==="premium"||userPlan==="basic")
                ?null
                :<><div style={{fontSize:11,color:T.muted,padding:"4px 10px",border:`1px solid ${T.border}`,borderRadius:8}}>
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
        {tab&&<div className="tabs-wrap" style={{display:"flex",gap:0,marginTop:6,borderTop:`1px solid ${T.border}22`,paddingTop:2,overflowX:"auto",alignItems:"center"}}>
          <div style={{width:20,height:20,borderRadius:5,background:T.purple,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:8,marginLeft:4}}>
            <svg width="13" height="13" viewBox="0 0 32 32" fill="none">
              <path d="M5 24 Q9 24 12 18 Q16 11 20 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M20 8 L20 13 M20 8 L25 8 L25 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="25" cy="8" r="2.5" fill="#c4b5fd"/>
            </svg>
          </div>
          {[
            {id:"score",l:L.tab_score,icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
            {id:"profile",l:L.tab_profile,icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
            {id:"portfolio",l:L.tab_portfolio,icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>},
            {id:"strategy",l:L.tab_strategy,icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
            {id:"compound",l:L.tab_compound,icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/></svg>},
            {id:"whatif",l:L.tab_whatif,icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>},
          ].map(t=><button key={t.id} className="tbtn" data-tour={`tour-${t.id}`} onClick={()=>setTab(t.id)}
            style={{color:tab===t.id?T.gold:T.muted,borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:8,fontSize:11,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
              {t.icon&&<span style={{opacity:tab===t.id?1:0.6,display:"flex",alignItems:"center"}}>{t.icon}</span>}{t.l}</button>)}
        </div>}
      </div>
    </div>
    {!tab&&<Hero onStart={handleStart} lang={lang}/>}
    {showTour&&!user&&<OnboardingTour lang={lang} onFinish={()=>setShowTour(false)}
      onGoToTab={(t)=>{setTab(t);setShowTour(false);}}/>}
    {tab&&<div className="page-wrap" style={{maxWidth:1380,margin:"0 auto",padding:"24px 28px"}}>
      {tab==="compound"&&<CompoundTab onGoToTab={(t)=>setTab(t)} lang={lang} portfolioBalance={portfolioBalance}/>}
      {tab==="whatif"&&<WhatIfTab lang={lang}/>}
      {tab==="score"&&<ScoreTab m={m} setM={setM} moat={moat} setMoat={setMoat} company={company} setCompany={setCompany} sector={sector} setSector={setSector} onAnalysis={onAnalysis} canAnalyze={canAnalyze} onGoToProfile={()=>setTab("profile")} lang={lang}/>}
      {tab==="profile"&&<ProfileTab onAnalysis={onAnalysis} canAnalyze={canAnalyze} onGoToPortfolio={()=>setTab("portfolio")} onGoToStrategy={()=>setTab("strategy")} lang={lang} user={user}/>}
      {tab==="portfolio"&&<PortfolioTab canAnalyze={canAnalyze} onShowPaywall={(ctx)=>{setPaywallContext(ctx);setPrevTab("portfolio");setShowPaywall(true);}} onGoToProfile={()=>setTab("profile")} lang={lang} user={user} userPlan={userPlan} onBalanceChange={(bal)=>setPortfolioBalance(bal)}/>}
      {tab==="strategy"&&(userPlan==="premium"||userPlan==="basic"||isAdmin()
  ?<StrategyTab onGoToProfile={()=>setTab("profile")} onGoToPortfolio={()=>setTab("portfolio")} lang={lang} user={user}/>
  :<div style={{maxWidth:560,margin:"80px auto",textAlign:"center",padding:"0 24px"}}>
    <div style={{fontSize:48,marginBottom:16}}>📈</div>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.gold,marginBottom:12,fontWeight:700}}>
      {lang==="es"?"Mi Estrategia — Basic/Premium":"My Strategy — Basic/Premium"}
    </div>
    <div style={{fontSize:14,color:T.muted,marginBottom:28,lineHeight:1.75}}>
      {lang==="es"?"Desde $7.99/mes · Cancela cuando quieras":"From $7.99/mo · Cancel anytime"}
    </div>
    <button className="btn btn-gold" onClick={()=>{setPaywallContext("stock");setShowPaywall(true);}} style={{fontSize:15,padding:"14px 36px",borderRadius:12}}>
      {lang==="es"?"🚀 Ver Planes":"🚀 See Plans"}
    </button>
  </div>
)}
    </div>}
    <div style={{maxWidth:1380,margin:"0 auto",padding:"0 28px 20px"}}><AdBanner size="leaderboard"/></div>
    <div style={{borderTop:`1px solid ${T.border}`,padding:"16px 28px",maxWidth:1380,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:9,color:T.muted,lineHeight:1.8}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#7c3aed"/>
            <path d="M5 24 Q9 24 12 18 Q16 11 20 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M20 8 L20 13 M20 8 L25 8 L25 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="25" cy="8" r="2.5" fill="#c4b5fd"/>
          </svg>
          <span style={{color:T.gold,fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:11}}>Inversoria</span>
          <span style={{color:T.muted}}>·</span>
          <span>{lang==="es"?"Análisis de Inversiones con IA · LATAM":"AI-Powered Investment Analysis · LATAM"}</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center"}}>
          <span>Colombia 🇨🇴</span>
          <a href="mailto:hola@inversoria.lat" style={{color:T.muted,textDecoration:"none"}}
            onMouseEnter={e=>e.target.style.color=T.gold}
            onMouseLeave={e=>e.target.style.color=T.muted}>
            hola@inversoria.lat
          </a>
          <span style={{color:`${T.muted}66`}}>·</span>
          <span style={{color:`${T.muted}88`,fontStyle:"italic"}}>
            {lang==="es"
              ?"Contenido educativo — no constituye asesoría financiera certificada"
              :"Educational content — not certified financial advice"}
          </span>
        </div>
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
