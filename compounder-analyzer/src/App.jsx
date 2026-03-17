import React, { useState, useCallback } from "react";
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


const T = {
  bg:"#0a0c10",surface:"#10141c",card:"#141820",border:"#1e2534",
  gold:"#c9a84c",goldLight:"#e8c97a",goldDim:"#7a6330",
  green:"#2ecc71",red:"#e74c3c",blue:"#4a9eff",purple:"#a855f7",
  text:"#e8eaf0",muted:"#6b7694",accent:"#1a2235",
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
`;

// ── UTILS ─────────────────────────────────────────────────────────────────────
// Show full dollar values with commas, no abbreviation
const fmt=(n)=>{
  if(n===undefined||n===null||isNaN(n))return"$0";
  const sign=n<0?"-":"";
  return sign+"$"+Math.abs(Math.round(n)).toLocaleString("en-US");
};
// Chart axis uses short labels to avoid clutter
const fmtShort=(n)=>{
  if(!n)return"$0";
  const abs=Math.abs(n);
  if(abs>=1e9)return`$${(n/1e9).toFixed(1)}B`;
  if(abs>=1e6)return`$${(n/1e6).toFixed(1)}M`;
  if(abs>=1e3)return`$${(n/1e3).toFixed(0)}K`;
  return`$${n}`;
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
function PaywallModal({onClose,context="stock"}){
  const configs={
    stock:{
      icon:"🎯",
      title:"You've seen the potential. Now act on it.",
      sub:<>You've used your <span style={{color:T.text,fontWeight:600}}>3 free analyses</span>. Upgrade to keep analyzing stocks with live Wall Street consensus, moat scoring, and DCF valuation — unlimited.</>,
      features:["Unlimited AI Stock Analyses","Live Wall St. Consensus (Finnhub)","Analyst Price Targets & Upside","FCF Growth Rate Analysis","Buffett/Munger Quality Score","Inline DCF Valuation"],
      price:"$9.99/mo",
      trial:"7-day free trial · Cancel anytime",
      cta:"🎯 Unlock Unlimited Analysis",
      proof:"Join investors already using Compounder Analyst",
    },
    portfolio:{
      icon:"📁",
      title:"Your portfolio deserves a real analysis.",
      sub:<>Free plan supports <span style={{color:T.text,fontWeight:600}}>3 stock positions</span>. Upgrade to track unlimited positions with live prices, AI rebalancing, DCA recommendations, and risk profile matching.</>,
      features:["Unlimited Portfolio Positions","AI Portfolio Score & Assessment","Rebalance Plan (what to trim/add)","DCA Advisor — where to invest cash","Risk Profile Alignment Check","Live P&L with Finnhub prices"],
      price:"$9.99/mo",
      trial:"7-day free trial · Cancel anytime",
      cta:"📁 Unlock My Full Portfolio",
      proof:"See exactly where your money should go",
    },
    riskPortfolio:{
      icon:"🧬",
      title:"Your investor DNA is ready. Now build the portfolio.",
      sub:<>Your <span style={{color:T.text,fontWeight:600}}>Risk Profile is always free</span>. Subscribe to get a personalized AI portfolio of stocks and ETFs — built specifically for your profile, goals, and investment amount.</>,
      features:["AI-Curated Stock Portfolio","ETF Recommendations","Asset Allocation Breakdown","Expected Return Modeling","Quarterly Rebalance Guide","Broker Recommendations"],
      price:"$19.99/mo",
      trial:"7-day free trial · Cancel anytime",
      cta:"🚀 Build My AI Portfolio",
      proof:"The portfolio Buffett would build for your risk profile",
    },
  };
  const c=configs[context]||configs.stock;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:T.card,border:`2px solid ${T.goldDim}`,borderRadius:20,padding:"36px 40px",maxWidth:520,width:"100%",textAlign:"center",position:"relative"}}>
        {/* Close button */}
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18,lineHeight:1}}>✕</button>
        {/* Social proof badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${T.green}15`,border:`1px solid ${T.green}33`,borderRadius:20,padding:"5px 14px",marginBottom:18}}>
          <span style={{fontSize:11,color:T.green}}>✦ {c.proof}</span>
        </div>
        <div style={{fontSize:36,marginBottom:12}}>{c.icon}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:10,fontWeight:700,lineHeight:1.3}}>{c.title}</div>
        <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:22}}>{c.sub}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:22,textAlign:"left"}}>
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
            onClick={()=>alert("💳 Coming soon! Email us at hello@compounderanalyst.com for early access.")}>
            {c.cta}
        </button>
        </div>
        <button onClick={onClose} style={{fontSize:11,color:T.muted,background:"none",border:"none",cursor:"pointer",textDecoration:"underline",marginTop:4}}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ── CRITERIA ──────────────────────────────────────────────────────────────────
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
const SECTORS=["Technology","Healthcare","Consumer","Finance","Industrials","Energy","Other"];
const defM=()=>({revenueCAGR:20,fcfGrowth:25,tamGrowth:12,roic:25,grossMargin:55,opMargin:22,fcfMarginPct:20,debtEbitda:1.2,interestCover:10});
const defMoat=()=>Object.fromEntries(MOAT_KEYS.map(k=>[k,3]));
function sm(c,v){if(c.invert){if(v<=c.threshold)return 100;if(v>=c.max)return 0;return Math.round((1-(v-c.threshold)/(c.max-c.threshold))*100);}if(v>=c.threshold*1.5)return 100;if(v>=c.threshold)return Math.round(60+((v-c.threshold)/(c.threshold*0.5))*40);return Math.round((v/c.threshold)*60);}
function calcScore(m,moat){let tw=0,ts=0;Object.values(CRITERIA).flat().forEach(c=>{const s=sm(c,m[c.key]||0);ts+=s*c.weight;tw+=c.weight;});const moatAvg=Object.values(moat).reduce((a,v)=>a+v,0)/(MOAT_KEYS.length*5)*100;ts+=moatAvg*10;tw+=10;return Math.round(ts/tw);}
function grade(s){if(s>=85)return{l:"A+",c:T.green,label:"Elite Compounder"};if(s>=75)return{l:"A",c:T.green,label:"High Quality"};if(s>=65)return{l:"B+",c:T.gold,label:"Good Business"};if(s>=55)return{l:"B",c:T.gold,label:"Promising"};if(s>=45)return{l:"C",c:"#f39c12",label:"Needs Improvement"};return{l:"D",c:T.red,label:"Avoid"};}

// ── SHARED ────────────────────────────────────────────────────────────────────
const Card=({children,s,onClick})=><div onClick={onClick} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,...s}}>{children}</div>;
const Lbl=({children,s})=><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,fontWeight:500,marginBottom:5,...s}}>{children}</div>;
const Mn=({children,sz=14,c=T.text,s})=><span style={{fontFamily:"'DM Mono',monospace",fontSize:sz,color:c,...s}}>{children}</span>;

function ScoreRing({score,size=80}){
  const g=grade(score);const r=size*0.38,cx=size/2,cy=size/2;
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
async function finnhubGet(path,ticker){
  const key=import.meta.env.VITE_FINNHUB_KEY;
  const res=await fetch(`${FH}${path}?symbol=${ticker}&token=${key}`);
  if(!res.ok)throw new Error(`Finnhub ${res.status}`);
  return res.json();
}

async function callFinnhub(ticker){
  try{
    const [rec,pt,quote,epsEst,revEst]=await Promise.allSettled([
      finnhubGet("/stock/recommendation",ticker),
      finnhubGet("/stock/price-target",ticker),
      finnhubGet("/quote",ticker),
      finnhubGet("/stock/eps-estimate",ticker),
      finnhubGet("/stock/revenue-estimate",ticker),
    ]);

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
      source:"Finnhub.io — Live data",
    };
  }catch(e){
    console.warn("Finnhub error:",e.message);
    return null;
  }
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({onStart}){
  const TOP=[{t:"NVDA",r:"142%",c:T.green},{t:"MSFT",r:"28%",c:T.green},{t:"AAPL",r:"21%",c:T.green},{t:"COST",r:"38%",c:T.green},{t:"AMZN",r:"81%",c:T.green},{t:"META",r:"194%",c:T.green}];
  return<div className="hero-grad fi" style={{padding:"60px 28px 50px",maxWidth:1380,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:48}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.gold}15`,border:`1px solid ${T.goldDim}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
        <span style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>✦ Trusted by investors worldwide · Buffett & Munger principles</span>
      </div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:46,color:T.text,lineHeight:1.15,marginBottom:16,fontWeight:700}}>
        Invest like <span style={{color:T.gold}}>Buffett & Munger</span>.<br/>Powered by AI.
      </h1>
      <p style={{fontSize:16,color:T.muted,maxWidth:600,margin:"0 auto 12px",lineHeight:1.7}}>
        The only platform that combines compound interest modeling, AI stock analysis, risk profiling, and live portfolio tracking — in one clean tool built for serious long-term investors.
      </p>
      <p style={{fontSize:13,color:T.muted,maxWidth:480,margin:"0 auto 32px",lineHeight:1.6}}>
        Used by investors in 30+ countries · Free to start · No credit card required
      </p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold" onClick={()=>onStart("compound")} style={{fontSize:15,padding:"14px 32px",borderRadius:10}}>💰 Start Free — Compound Calculator</button>
        <button className="btn btn-outline" onClick={()=>onStart("score")} style={{fontSize:14,padding:"14px 24px",borderRadius:10}}>🎯 Analyze a Stock</button>
      </div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto 40px"}}><AdBanner size="leaderboard"/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:700,margin:"0 auto 40px"}}>
      {[{n:"100% Free",l:"Compound Calculator & Planner"},{n:"AI-Powered",l:"Stock Quality Analyzer"},{n:"Live Data",l:"Finnhub · Wall St. Consensus"}].map(({n,l})=>(
        <div key={l} style={{textAlign:"center",padding:"16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.gold,marginBottom:4}}>{n}</div>
          <div style={{fontSize:11,color:T.muted}}>{l}</div>
        </div>
      ))}
    </div>
    <div>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Top Compounders — 1Y Return</div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        {TOP.map(({t,r,c})=>(
          <div key={t} onClick={()=>onStart("score",t)} style={{cursor:"pointer",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.goldDim;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
            <Mn sz={13} c={T.text} s={{fontWeight:700}}>{t}</Mn>
            <span style={{fontSize:12,color:c}}>+{r}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

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

function CompoundTab({onGoToTab}){
  const [draft,setDraft]=useState({initial:10000,rate:10,rateType:"annual",contrib:2000,contribFreq:"monthly",years:10});
  const [cfg,setCfg]=useState({initial:10000,rate:10,rateType:"annual",contrib:2000,contribFreq:"monthly",years:10});
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
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}><span style={{color:T.muted}}>💵 Capital Invested</span><Mn sz={11} c={T.blue}>{fmt(cap)}</Mn></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}><span style={{color:T.muted}}>✨ Interest Earned</span><Mn sz={11} c={T.green}>{fmt(int)}</Mn></div>
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
        <span style={{fontSize:11,color:T.green,fontWeight:600}}>✓ 100% Free · No account · No credit card · Monthly compounding (industry standard)</span>
      </div>
    </div>

    {/* KPI cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      {[
        {l:"Final Balance",v:fmt(last.balance||0),c:T.gold,sub:`in ${cfg.years} years`,icon:"🏆"},
        {l:"Total Invested",v:fmt(last.contributed||0),c:T.blue,sub:"your money",icon:"💵"},
        {l:"Interest Earned",v:fmt(last.interest||0),c:T.green,sub:`${last.balance?((last.interest/last.balance)*100).toFixed(0):0}% of total`,icon:"✨"},
        {l:"Multiplier",v:`${last.mult||1}x`,c:T.purple,sub:`Doubles every ${doubleYears} yrs`,icon:"🚀"},
      ].map(({l,v,c,sub,icon})=><Card key={l} s={{padding:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,fontSize:22,opacity:0.12}}>{icon}</div>
        <Lbl>{l}</Lbl>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700,marginBottom:3,wordBreak:"break-all"}}>{v}</div>
        <div style={{fontSize:10,color:T.muted}}>{sub}</div>
      </Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:18}}>
      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:18}}>⚙️ Your Scenario</div>
          <Lbl>Initial Investment</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span><input type="number" value={draft.initial} min={0} step={100} onChange={e=>setD("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/></div>
          <input type="range" min={0} max={1000000} step={1000} value={draft.initial} onChange={e=>setD("initial",parseFloat(e.target.value))} style={{marginBottom:16}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Annual Rate</Lbl>
            <div style={{display:"flex",gap:4}}>{["annual","monthly"].map(t=><button key={t} className={`seg ${draft.rateType===t?"seg-on":""}`} onClick={()=>setD("rateType",t)}>{t==="annual"?"Annual":"Monthly"}</button>)}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><input type="number" value={draft.rate} min={0.01} max={draft.rateType==="monthly"?5:100} step={0.1} onChange={e=>setD("rate",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/><span style={{color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>% /{draft.rateType==="annual"?"yr":"mo"}</span></div>
          <input type="range" min={0.1} max={draft.rateType==="monthly"?5:100} step={0.1} value={draft.rate} onChange={e=>setD("rate",parseFloat(e.target.value))} style={{marginBottom:4}}/>
          {draft.rateType==="monthly"
            ?<div style={{fontSize:10,color:T.green,marginBottom:12}}>≡ {((Math.pow(1+draft.rate/100,12)-1)*100).toFixed(2)}% effective annual</div>
            :<div style={{fontSize:10,color:T.muted,marginBottom:12}}>≡ {(draft.rate/12).toFixed(3)}% per month (compounded monthly)</div>}
          <div style={{marginBottom:8}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Contributions (DCA)</Lbl>
            <div style={{display:"flex",gap:4}}>{["monthly","annual"].map(t=><button key={t} className={`seg ${draft.contribFreq===t?"seg-on":""}`} onClick={()=>setD("contribFreq",t)}>{t==="monthly"?"Mo":"Yr"}</button>)}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span><input type="number" value={draft.contrib} min={0} max={100000} step={50} onChange={e=>setD("contrib",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/><span style={{color:T.muted,fontSize:11}}>/{draft.contribFreq==="monthly"?"month":"year"}</span></div>
          <input type="range" min={0} max={20000} step={50} value={draft.contrib} onChange={e=>setD("contrib",parseFloat(e.target.value))} style={{marginBottom:16}}/>
          <Lbl>Investment Horizon</Lbl>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:T.muted}}>Years</span><Mn sz={13} c={T.gold}>{draft.years} years</Mn></div>
          <input type="range" min={1} max={50} step={1} value={draft.years} onChange={e=>setD("years",parseInt(e.target.value))} style={{marginBottom:20}}/>
          <button className="btn btn-gold" onClick={()=>setCfg({...draft})} style={{width:"100%",fontSize:15,padding:"13px 0",borderRadius:10}}>
            🔄 Calculate Results
          </button>
        </Card>
        <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:12}}>✨ The Magic of Compounding</div>
          {[
            {l:"Capital only (no interest)",v:fmt(last.contributed||0)},
            {l:"With compound interest 🏆",v:fmt(last.balance||0),hi:true},
            {l:"Generated by interest alone",v:`+${fmt(last.interest||0)}`,pos:true},
          ].map(({l,v,hi,pos})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}22`,alignItems:"center"}}>
            <span style={{fontSize:11,color:hi?T.text:T.muted}}>{l}</span>
            <Mn sz={hi?12:11} c={pos?T.green:hi?T.gold:T.muted} s={hi?{fontWeight:700}:{}}>{v}</Mn>
          </div>)}
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.7}}>
            📐 <span style={{color:T.gold}}>Rule of 72:</span> Your money doubles every <span style={{color:T.goldLight}}>{doubleYears} years</span> at {effectiveAnnualRate.toFixed(2)}% effective annual
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>📊 Capital vs. Interest — The Snowball Effect</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:14}}>Watch the green (interest) bar grow until it <strong style={{color:T.green}}>overtakes</strong> the blue (capital)</div>
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.max(0,Math.floor(cfg.years/8)-1)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtShort(v)} width={82}/>
                <Tooltip content={<StackedTT/>}/>
                <Legend formatter={n=>n==="contributed"?"Capital Invested":"Interest Earned"} wrapperStyle={{fontSize:11,color:T.muted,paddingTop:8}}/>
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
    <MillionGoalSection/>

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
          {icon:"🧬",title:"Discover Your Investor DNA",desc:"Take our 8-question quiz and get a Conservative, Moderate, or Aggressive profile with a personalized AI portfolio.",cta:"Take the Quiz →",tab:"profile",color:T.purple},
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

function MillionGoalSection(){
  const [goal,setGoal]=useState(1000000);
  const [monthly,setMonthly]=useState(200);
  const RATE=10;
  const AGES=[20,25,30,35,40,50];

  // Given age + goal: how much/month needed by 65?
  const monthlyNeeded=(age)=>{
    const r=(RATE/100)/12,n=(65-age)*12;
    if(n<=0)return Infinity;
    return Math.round(goal*r/(Math.pow(1+r,n)-1));
  };
  // Given age + monthly savings: at what age do you hit the goal?
  const reachAge=(startAge)=>{
    const r=(RATE/100)/12;
    if(monthly<=0)return null;
    const months=Math.log(1+goal*r/monthly)/Math.log(1+r);
    const age=Math.round(startAge+months/12);
    return{age,years:Math.round(months/12)};
  };

  const data=AGES.map(age=>({
    age,
    needed:monthlyNeeded(age),
    daily:Math.ceil(monthlyNeeded(age)/30),
    reach:reachAge(age),
    yearsTo65:65-age,
  }));

  const cardColor=(age)=>age<=22?T.gold:age<=30?T.green:age<=40?T.blue:T.red;
  const goalFmt=(n)=>"$"+n.toLocaleString("en-US");

  return<Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`1px solid ${T.goldDim}44`,padding:0,overflow:"hidden"}}>
    {/* Header */}
    <div style={{textAlign:"center",padding:"28px 24px 20px",borderBottom:`1px solid ${T.border}33`}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.gold}15`,border:`1px solid ${T.goldDim}`,borderRadius:20,padding:"5px 14px",marginBottom:14}}>
        <span style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>🎯 Your Path to Your First Million</span>
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.text,marginBottom:10,fontWeight:700}}>
        How much do you need to save<br/><span style={{color:T.gold}}>to reach {goalFmt(goal)}?</span>
      </div>
      <div style={{fontSize:13,color:T.muted,maxWidth:560,margin:"0 auto",lineHeight:1.7}}>
        At <strong style={{color:T.green}}>{RATE}% annual</strong> (S&P 500 / VOO historical average), compounded monthly.
        The earlier you start, the less you need — time does the heavy lifting.
      </div>
    </div>

    {/* Interactive controls */}
    <div style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,borderBottom:`1px solid ${T.border}33`,background:`${T.accent}88`}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>🎯 Your goal</span>
          <Mn sz={14} c={T.gold} s={{fontWeight:700}}>{goalFmt(goal)}</Mn>
        </div>
        <input type="range" min={100000} max={5000000} step={50000} value={goal} onChange={e=>setGoal(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>$100K</span><span>$1M</span><span>$5M</span>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:T.muted}}>💵 Your monthly savings</span>
          <Mn sz={14} c={T.green} s={{fontWeight:700}}>{goalFmt(monthly)}/mo (~${Math.ceil(monthly/30)}/day)</Mn>
        </div>
        <input type="range" min={50} max={5000} step={50} value={monthly} onChange={e=>setMonthly(parseInt(e.target.value))}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginTop:4}}>
          <span>$50/mo</span><span>$500/mo</span><span>$5,000/mo</span>
        </div>
      </div>
    </div>

    {/* Cards grid */}
    <div style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {data.map(({age,needed,daily,reach,yearsTo65})=>{
        const cc=cardColor(age);
        const canReach=reach&&reach.age<=80;
        return<div key={age} style={{background:T.card,borderRadius:14,overflow:"hidden",border:`1px solid ${cc}33`,position:"relative"}}>
          <div style={{height:4,background:cc,width:"100%"}}/>
          <div style={{padding:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:22,fontFamily:"'Playfair Display',serif",color:cc,fontWeight:700}}>Age {age}</div>
              {age===20&&<div style={{fontSize:9,background:T.gold,color:"#0a0c10",padding:"3px 8px",borderRadius:10,fontWeight:700}}>BEST TIME</div>}
            </div>

            {/* How much needed to hit goal by 65 */}
            <div style={{marginBottom:12,padding:"12px",background:T.accent,borderRadius:10,border:`1px solid ${cc}22`}}>
              <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>To reach {goalFmt(goal)} by age 65</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:needed>9999?22:28,color:cc,fontWeight:700}}>${needed.toLocaleString()}<span style={{fontSize:12,color:T.muted,fontWeight:400}}>/mo</span></div>
              <div style={{fontSize:10,color:T.muted,marginTop:2}}>~${daily}/day · {yearsTo65} years of investing</div>
            </div>

            {/* With your monthly savings, when do you hit goal? */}
            <div style={{padding:"10px 12px",background:canReach?`${T.green}10`:`${T.red}08`,borderRadius:8,border:`1px solid ${canReach?T.green:T.red}22`}}>
              <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>
                Saving ${monthly.toLocaleString()}/mo, you reach {goalFmt(goal)} at
              </div>
              {canReach&&reach
                ?<><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.green,fontWeight:700}}>Age {reach.age}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>in {reach.years} years from now</div></>
                :<><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.red,fontWeight:700}}>Need more savings</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>Increase monthly amount to get there</div></>
              }
            </div>

            {/* Effort bar */}
            <div style={{marginTop:10}}>
              <div style={{height:3,background:T.border,borderRadius:2}}>
                <div style={{height:"100%",width:`${Math.min((data[0].needed/Math.max(needed,1))*100,100)}%`,background:cc,borderRadius:2}}/>
              </div>
              <div style={{fontSize:9,color:T.muted,marginTop:3,textAlign:"right"}}>
                {age>20?`${Math.round(needed/data[0].needed)}x more than starting at 20`:"Lowest monthly needed"}
              </div>
            </div>
          </div>
        </div>;
      })}
    </div>

    {/* Bottom insight strip */}
    <div style={{margin:"0 24px 24px",padding:16,background:T.accent,borderRadius:12,border:`1px solid ${T.border}`}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,textAlign:"center",marginBottom:14}}>
        {[data[0],data[2],data[4]].map(({age,needed})=>(
          <div key={age}>
            <div style={{fontSize:10,color:T.muted,marginBottom:4}}>Starting at {age}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:cardColor(age),fontWeight:700}}>
              ${needed.toLocaleString()}<span style={{fontSize:11,color:T.muted,fontWeight:400}}>/mo</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.9,borderTop:`1px solid ${T.border}33`,paddingTop:12}}>
        ⏰ Waiting from <span style={{color:T.gold}}>age 20 to age 40</span> means you need <span style={{color:T.red,fontWeight:700}}>{data[4]&&data[0]?Math.round(data[4].needed/data[0].needed):0}x more per month</span> to reach the same {goalFmt(goal)}.<br/>
        <span style={{color:T.green}}>
          Starting at 20 costs just ${data[0]?.needed.toLocaleString()}/month (~${data[0]?.daily}/day). 
          That's a coffee ☕ — not a sacrifice.
        </span>
      </div>
    </div>
  </Card>;
}

// ── WHAT IF ───────────────────────────────────────────────────────────────────
function WhatIfTab(){
  const SCENARIOS=[
    {ticker:"NVDA",name:"NVIDIA",year:2014,invested:10000,cagr:68,finalValue:3820000,color:T.green,desc:"GPU dominance + AI boom"},
    {ticker:"AAPL",name:"Apple",year:2008,invested:10000,cagr:28,finalValue:782000,color:T.blue,desc:"iPhone, services, ecosystem"},
    {ticker:"AMZN",name:"Amazon",year:2010,invested:10000,cagr:32,finalValue:520000,color:T.gold,desc:"AWS Cloud + e-commerce"},
    {ticker:"MSFT",name:"Microsoft",year:2014,invested:10000,cagr:27,finalValue:248000,color:T.purple,desc:"Azure Cloud + Satya Nadella"},
    {ticker:"TSLA",name:"Tesla",year:2013,invested:10000,cagr:38,finalValue:1200000,color:T.green,desc:"EV + energy + software"},
    {ticker:"COST",name:"Costco",year:2010,invested:10000,cagr:19,finalValue:115000,color:"#f39c12",desc:"Membership moat + retail"},
  ];
  const [custom,setCustom]=useState({initial:10000,cagr:20,years:10});
  const sc=(k,v)=>setCustom(p=>({...p,[k]:v}));
  const customFinal=custom.initial*Math.pow(1+custom.cagr/100,custom.years);
  const customData=Array.from({length:custom.years},(_,i)=>({y:`Y${i+1}`,v:Math.round(custom.initial*Math.pow(1+custom.cagr/100,i+1))}));
  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{textAlign:"center",padding:"10px 0 6px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:6}}>What if you had invested <span style={{color:T.gold}}>$10,000</span>...</div>
      <div style={{fontSize:13,color:T.muted}}>Explore the power of compounding in the best businesses of the last decade</div>
    </div>
    <AdBanner size="leaderboard"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {SCENARIOS.map(s=><Card key={s.ticker}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,marginBottom:2}}>{s.name}</div><div style={{fontSize:10,color:T.muted}}>{s.ticker} · since {s.year}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:s.color,fontWeight:700}}>{fmt(s.finalValue)}</div><div style={{fontSize:10,color:s.color}}>CAGR ~{s.cagr}%</div></div>
        </div>
        <div style={{height:3,background:T.border,borderRadius:2,marginBottom:8}}><div style={{height:"100%",width:`${Math.min((s.finalValue/4000000)*100,100)}%`,background:s.color,borderRadius:2}}/></div>
        <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{s.desc}</div>
        <div style={{marginTop:10,padding:"6px 10px",background:T.accent,borderRadius:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:T.muted}}>$10,000 invested</span>
          <Mn sz={11} c={s.color} s={{fontWeight:700}}>→ {fmt(s.finalValue)}</Mn>
        </div>
      </Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:18}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:16}}>🎯 Your Custom Scenario</div>
        <Lbl>Initial Capital</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{color:T.muted,fontFamily:"monospace"}}>$</span><input type="number" value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/></div>
        <input type="range" min={1000} max={1000000} step={1000} value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value))} style={{marginBottom:14}}/>
        <Lbl>Expected CAGR</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><input type="number" value={custom.cagr} onChange={e=>sc("cagr",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/><span style={{color:T.muted,fontSize:12}}>% per year</span></div>
        <input type="range" min={1} max={100} step={0.5} value={custom.cagr} onChange={e=>sc("cagr",parseFloat(e.target.value))} style={{marginBottom:14}}/>
        <Lbl>Years</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.muted}}>Horizon</span><Mn sz={12} c={T.gold}>{custom.years} years</Mn></div>
        <input type="range" min={1} max={40} step={1} value={custom.years} onChange={e=>sc("years",parseInt(e.target.value))}/>
        <div style={{marginTop:16,padding:14,background:`${T.gold}08`,borderRadius:10,border:`1px solid ${T.goldDim}44`,textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Your result in {custom.years} years</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:T.gold,fontWeight:700}}>{fmt(customFinal)}</div>
          <div style={{fontSize:11,color:T.green,marginTop:4}}>×{(customFinal/custom.initial).toFixed(1)} your initial investment</div>
        </div>
      </Card>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>📈 Your Growth Trajectory</div>
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

// ── INLINE DCF — embedded in Stock Analyze ────────────────────────────────────
function InlineDCF({company,onAnalysis,canAnalyze}){
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
            {l:"Intrinsic Value",v:`$${ips.toFixed(2)}`,c:T.green,sub:"per share (DCF)"},
            {l:"Current Price",v:dcf.currentPrice?`$${dcf.currentPrice}`:"—",c:T.gold,sub:"market price"},
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
function MRow({c,value,onChange,locked}){
  const s=sm(c,value),pass=c.invert?value<=c.threshold:value>=c.threshold;
  return<div style={{display:"grid",gridTemplateColumns:"1fr 85px 50px 28px",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${T.border}22`}}>
    <div><div style={{fontSize:12,color:T.text,marginBottom:3}}>{c.label}</div><input type="range" min={0} max={c.max} step={0.1} value={value} disabled={locked} onChange={e=>!locked&&onChange(c.key,parseFloat(e.target.value))}/></div>
    <div style={{display:"flex",alignItems:"center",gap:3}}><input type="number" value={value} min={0} max={c.max} step={0.1} disabled={locked} onChange={e=>!locked&&onChange(c.key,parseFloat(e.target.value)||0)} style={{width:60,textAlign:"right",opacity:locked?0.6:1}}/><span style={{fontSize:10,color:T.muted}}>{c.unit}</span></div>
    <div style={{textAlign:"center",fontSize:11,color:s>=60?T.green:s>=40?T.gold:T.red}}>{s}%</div>
    <div style={{fontSize:14,textAlign:"center",color:pass?T.green:T.red}}>{pass?"✓":"✗"}</div>
  </div>;
}

function ScoreTab({m,setM,moat,setMoat,company,setCompany,sector,setSector,onAnalysis,canAnalyze}){
  const [loading,setLoading]=useState(false);
  const [info,setInfo]=useState(null);
  const [fh,setFh]=useState(null);
  const [err,setErr]=useState("");
  const [locked,setLocked]=useState(false);
  const score=calcScore(m,moat);const g=grade(score);
  const catS=Object.entries(CRITERIA).map(([cat,cs])=>({cat:cat==="growth"?"📈 Growth":cat==="profitability"?"💎 Profitability":cat==="cashflow"?"💵 Cash Flow":"🏦 Balance Sheet",s:Math.round(cs.reduce((a,c)=>a+sm(c,m[c.key]||0),0)/cs.length)}));
  const radarD=MOAT_KEYS.map(k=>({subject:k.split(" ")[0],value:moat[k],fullMark:5}));

  const analyze=async()=>{
    if(!company.trim()){setErr("Enter a ticker first.");return;}
    if(!canAnalyze())return;
    setLoading(true);setErr("");setInfo(null);setFh(null);setLocked(false);
    try{
      const [fhResult,aiResult]=await Promise.allSettled([
        callFinnhub(company),
        callAI(`You are a Buffett/Munger investment analyst. Analyze "${company}" using real data up to your knowledge cutoff. FCF metric: use FCF GROWTH RATE (3-5Y CAGR %) not ratio. Respond ONLY with valid JSON, no markdown: {"metrics":{"revenueCAGR":<number>,"fcfGrowth":<FCF CAGR %>,"tamGrowth":<number>,"roic":<number>,"grossMargin":<number>,"opMargin":<number>,"fcfMarginPct":<number>,"debtEbitda":<number>,"interestCover":<number>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<sector>","summary":"<2-3 sentences thesis and key risk>","catalysts":["<1>","<2>","<3>"],"keyMetrics":{"revenueGrowth5y":"<e.g. +56% CAGR>","roicDisplay":"<e.g. 18%>","fcfGrowthDisplay":"<e.g. +67% CAGR>","fcfMarginDisplay":"<e.g. 19%>","debtEquity":"<e.g. 0.2x>","epsGrowth":"<e.g. +38%>"}}`),
      ]);
      if(fhResult.status==="fulfilled"&&fhResult.value)setFh(fhResult.value);
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
    {l:"Revenue CAGR ≥ 15%",p:m.revenueCAGR>=15},{l:"ROIC ≥ 20%",p:m.roic>=20},
    {l:"Gross Margin ≥ 40%",p:m.grossMargin>=40},{l:"Operating Margin ≥ 18%",p:m.opMargin>=18},
    {l:"FCF Growth Rate ≥ 15%",p:m.fcfGrowth>=15},{l:"FCF Margin ≥ 15%",p:m.fcfMarginPct>=15},
    {l:"Debt/EBITDA ≤ 2x",p:m.debtEbitda<=2},{l:"Avg Moat ≥ 3/5",p:Object.values(moat).reduce((a,v)=>a+v,0)/MOAT_KEYS.length>=3},
  ];

  const ratingColor=r=>{if(!r)return T.muted;if(r.includes("Strong Buy")||r.includes("Buy")||r.includes("Over"))return T.green;if(r.includes("Sell")||r.includes("Under"))return T.red;return T.gold;};
  const ratingBg=r=>{if(!r)return T.border;if(r.includes("Strong Buy")||r.includes("Buy")||r.includes("Over"))return`${T.green}20`;if(r.includes("Sell")||r.includes("Under"))return`${T.red}20`;return`${T.gold}20`;};

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:`${T.gold}10`,border:`1px solid ${T.goldDim}55`,borderRadius:8}}>
      <span style={{fontSize:12,color:T.gold}}>🎯 <strong>AI Stock Analyzer</strong> — Buffett/Munger fundamental analysis + Wall Street consensus</span>
      <span style={{fontSize:11,color:T.muted}}>2 free · then subscribe</span>
    </div>

    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <Lbl>Ticker / Company</Lbl>
          <input type="text" value={company} onChange={e=>{setCompany(e.target.value.toUpperCase());setLocked(false);setInfo(null);}} placeholder="NVDA, AAPL, DUOL, HIMS..." onKeyDown={e=>e.key==="Enter"&&analyze()} style={{fontSize:16,fontWeight:700,letterSpacing:"0.05em",padding:"12px 16px"}}/>
        </div>
        <div style={{width:150}}><Lbl>Sector</Lbl><select value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></div>
        <button className="btn btn-gold" onClick={analyze} disabled={loading} style={{height:44,padding:"0 24px",fontSize:14}}>
          {loading?<span className="sp">⟳</span>:"🎯 Analyze with AI"}
        </button>
        {locked&&<button className="seg" onClick={()=>setLocked(false)} style={{height:44,color:T.gold,borderColor:T.goldDim}}>🔓 Unlock</button>}
      </div>
      {!info&&!loading&&!err&&<div style={{textAlign:"center",paddingTop:10,fontSize:12,color:T.muted,borderTop:`1px solid ${T.border}33`,marginTop:12}}>
        Enter any ticker → AI analyzes fundamentals, moat, and Wall Street consensus (Buy/Hold/Sell + price target)
      </div>}
      {loading&&<div style={{textAlign:"center",padding:12,fontSize:12,color:T.gold,background:`${T.gold}08`,borderRadius:8,marginTop:10}}><span className="sp">⟳</span>  Analyzing <strong>{company}</strong>...</div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`,marginTop:10}}>{err}</div>}
      {locked&&<div style={{padding:"6px 10px",background:`${T.green}10`,borderRadius:6,fontSize:11,color:T.green,border:`1px solid ${T.green}33`,marginTop:10}}>🔒 Metrics locked to AI data — click Unlock to edit</div>}
    </Card>

    {info&&<>
      {/* ── LIVE FINNHUB CONSENSUS — real-time data ── */}
      {fh&&<div style={{background:`linear-gradient(135deg,${T.card},${T.accent})`,border:`2px solid ${ratingColor(fh.rating)}44`,borderRadius:14,padding:20,marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <span style={{fontSize:10,color:T.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600}}>🟢 LIVE — Finnhub.io Real-Time Data</span>
          {fh.period&&<span style={{fontSize:10,color:T.muted}}>· Period: {fh.period}</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:20,alignItems:"center"}}>
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                {l:"Price Target",v:fh.targetMean?`$${fh.targetMean}`:"—",c:T.gold},
                {l:"Target High",v:fh.targetHigh?`$${fh.targetHigh}`:"—",c:T.green},
                {l:"Target Low",v:fh.targetLow?`$${fh.targetLow}`:"—",c:T.red},
                {l:"EPS Growth (est.)",v:fh.epsGrowthNext||"—",c:T.green},
              ].map(({l,v,c})=><div key={l} style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{l}</div>
                <Mn sz={15} c={c} s={{fontWeight:600}}>{v}</Mn>
              </div>)}
            </div>
            <div style={{fontSize:10,color:T.muted}}>Source: Finnhub.io · Live data updated in real-time · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
          </div>
        </div>
      </div>}
      {!fh&&info&&<div style={{padding:"10px 14px",background:`${T.muted}10`,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.muted}}>
        ⚠️ Live Finnhub data not available for {company} — check that <code>VITE_FINNHUB_KEY</code> is set in Vercel environment variables.
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:16,alignItems:"start"}}>
        <Card s={{textAlign:"center",padding:18}}>
          <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Quality Score</div>
          <ScoreRing score={score} size={110}/>
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
            {info.keyMetrics&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {[{l:"Revenue CAGR 5Y",v:info.keyMetrics.revenueGrowth5y,c:T.green},{l:"FCF Growth (CAGR)",v:info.keyMetrics.fcfGrowthDisplay,c:T.green},{l:"FCF Margin",v:info.keyMetrics.fcfMarginDisplay,c:T.blue},{l:"ROIC",v:info.keyMetrics.roicDisplay,c:T.gold},{l:"Debt/Equity",v:info.keyMetrics.debtEquity,c:T.muted},{l:"EPS Growth",v:info.keyMetrics.epsGrowth,c:T.green}].map(({l,v,c})=><div key={l} style={{background:T.card,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{l}</div>
                <Mn sz={14} c={c} s={{fontWeight:600}}>{v||"—"}</Mn>
              </div>)}
            </div>}
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(info.catalysts||[]).map((c,i)=><span key={i} style={{fontSize:11,padding:"4px 10px",borderRadius:20,background:`${T.green}15`,color:T.green,border:`1px solid ${T.green}33`}}>✓ {c}</span>)}</div>
          </Card>
        </div>
      </div>
      <AdBanner size="leaderboard"/>
    </>}

    {!info&&<div style={{display:"flex",alignItems:"center",gap:20,padding:"14px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12}}>
      <ScoreRing score={score} size={100}/>
      <div style={{flex:1}}>{catS.map(({cat,s})=><div key={cat} style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}><span style={{color:T.muted}}>{cat}</span><Mn sz={11} c={s>=60?T.green:s>=40?T.gold:T.red}>{s}%</Mn></div>
        <div style={{height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${s}%`,background:s>=60?T.green:s>=40?T.gold:T.red,borderRadius:2,transition:"width 0.5s"}}/></div>
      </div>)}</div>
    </div>}

    {/* ── INLINE DCF — auto-fills from AI analysis ── */}
    {info&&<InlineDCF company={company} onAnalysis={onAnalysis} canAnalyze={canAnalyze}/>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {Object.entries(CRITERIA).map(([cat,cs])=><Card key={cat}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold}}>{cat==="growth"?"📈 Growth":cat==="profitability"?"💎 Profitability":cat==="cashflow"?"💵 Cash Flow (Growth)":"🏦 Balance Sheet"}</div>
            {locked&&<span style={{fontSize:9,color:T.muted,background:T.accent,padding:"2px 6px",borderRadius:4}}>🔒 locked</span>}
          </div>
          {cs.map(c=><MRow key={c.key} c={c} value={m[c.key]||0} onChange={(k,v)=>setM(p=>({...p,[k]:v}))} locked={locked}/>)}
        </Card>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🏰 Moat Analysis</div>
          <div style={{height:200}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:10}}/><Radar dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/></RadarChart></ResponsiveContainer></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
            {MOAT_KEYS.map(k=><div key={k}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3,color:T.muted}}><span>{k}</span><Mn sz={10} c={T.gold}>{moat[k]}/5</Mn></div>
              <div style={{display:"flex",gap:3,opacity:locked?0.45:1}}>{[1,2,3,4,5].map(v=><div key={v} onClick={()=>!locked&&setMoat(p=>({...p,[k]:v}))} style={{flex:1,height:5,borderRadius:3,cursor:locked?"not-allowed":"pointer",background:v<=moat[k]?T.gold:T.border,transition:"background 0.2s"}}/>)}</div>
            </div>)}
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:10}}>📋 Buffett / Munger Checklist</div>
          {checklist.map(({l,p})=><div key={l} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}22`}}>
            <div style={{width:17,height:17,borderRadius:"50%",background:p?`${T.green}22`:`${T.red}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:p?T.green:T.red,flexShrink:0}}>{p?"✓":"✗"}</div>
            <span style={{fontSize:11,color:p?T.text:T.muted}}>{l}</span>
          </div>)}
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:T.muted}}>Criteria met</span>
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
function DCFTab({onAnalysis,canAnalyze}){
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
          <F l="Base Revenue (M$)" k="rev" u="M" min={10} max={50000} st={10}/>
          <F l="Revenue Growth" k="rg" u="%" min={0} max={50}/>
          <F l="FCF Margin" k="mt" u="%" min={5} max={50}/>
          <F l="FCF Conversion" k="fc" u="x" min={0.5} max={1} st={0.05}/>
          <F l="Terminal Growth" k="tg" u="%" min={1} max={4} st={0.5}/>
          <F l="WACC" k="w" u="%" min={6} max={15} st={0.5}/>
          <F l="Years" k="yr" u="" min={5} max={15}/>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>🏦 Balance Sheet</div>
          <F l="Cash (M$)" k="ca" u="M" min={0} max={200000} st={100}/>
          <F l="Total Debt (M$)" k="de" u="M" min={0} max={200000} st={100}/>
          <F l="Shares (M)" k="sh" u="M" min={1} max={10000} st={10}/>
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
const QUESTIONS=[
  {
    id:"horizon",
    q:"How long can you keep your money invested without needing it?",
    opts:[
      {l:"Less than 2 years",s:1},{l:"2–5 years",s:2},{l:"5–10 years",s:3},{l:"More than 10 years",s:4},
    ],
  },
  {
    id:"drop",
    q:"Your portfolio drops 30% in a market crash. What do you do?",
    opts:[
      {l:"Sell everything immediately",s:1},{l:"Sell some to reduce exposure",s:2},
      {l:"Hold and wait for recovery",s:3},{l:"Buy more — it's a discount",s:4},
    ],
  },
  {
    id:"goal",
    q:"What is your primary investment goal?",
    opts:[
      {l:"Preserve my capital — safety first",s:1},{l:"Steady income with low risk",s:2},
      {l:"Balanced growth over time",s:3},{l:"Maximum long-term growth",s:4},
    ],
  },
  {
    id:"experience",
    q:"How would you describe your investing experience?",
    opts:[
      {l:"None — I'm just starting",s:1},{l:"Some — I've bought ETFs or funds",s:2},
      {l:"Moderate — I follow markets regularly",s:3},{l:"Advanced — I analyze individual stocks",s:4},
    ],
  },
  {
    id:"income",
    q:"If you lost your entire investment, how would it affect your life?",
    opts:[
      {l:"Devastating — it's most of my savings",s:1},{l:"Very difficult — major setback",s:2},
      {l:"Tough but manageable",s:3},{l:"Fine — this is money I can afford to lose",s:4},
    ],
  },
  {
    id:"volatility",
    q:"Which statement best describes your attitude toward risk?",
    opts:[
      {l:"I prefer guaranteed returns even if small",s:1},{l:"I accept modest risk for modest gains",s:2},
      {l:"I accept higher volatility for higher returns",s:3},{l:"I embrace high risk for maximum upside",s:4},
    ],
  },
  {
    id:"concentration",
    q:"How many stocks would you feel comfortable holding?",
    opts:[
      {l:"1–3 very safe blue chips only",s:1},{l:"5–10 diversified ETFs and stocks",s:2},
      {l:"10–20 mix of growth and value",s:3},{l:"20+ including high-growth and emerging",s:4},
    ],
  },
  {
    id:"age",
    q:"How old are you?",
    opts:[
      {l:"55 or older",s:1},{l:"45–54",s:2},{l:"35–44",s:3},{l:"Under 35",s:4},
    ],
  },
];

const PROFILES={
  conservative:{
    label:"Conservative",icon:"🛡️",color:"#4a9eff",
    desc:"Capital preservation is your priority. You prefer stability over growth and can't afford significant losses. Best suited for bonds, dividend stocks, and low-volatility ETFs.",
    traits:["Low volatility tolerance","Short to medium time horizon","Income-focused","Safety first"],
  },
  moderate:{
    label:"Moderate",icon:"⚖️",color:"#c9a84c",
    desc:"You seek a balance between growth and security. Comfortable with some market fluctuations in exchange for long-term returns. A diversified mix of stocks and bonds suits you well.",
    traits:["Medium volatility tolerance","5–10 year horizon","Balanced growth + income","Diversification focused"],
  },
  aggressive:{
    label:"Aggressive",icon:"🚀",color:"#2ecc71",
    desc:"You're a growth investor willing to ride market volatility for superior long-term returns. You understand that short-term drops are the price for long-term compounding.",
    traits:["High volatility tolerance","Long time horizon (10Y+)","Maximum growth focus","Compounders and quality stocks"],
  },
};

function ProfileTab({onAnalysis,canAnalyze,onGoToPortfolio}){
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
    try{
      const p=await callAI(`You are a professional portfolio manager. Based on a ${profile.label} risk profile investor with $${amount.toLocaleString()} to invest, recommend a specific portfolio.
The investor profile: ${profile.desc}
Traits: ${profile.traits.join(", ")}

Respond ONLY with valid JSON, no markdown:
{
  "allocation":[
    {"category":"<e.g. US Large Cap Growth>","pct":<number 0-100>,"color":"<hex color>","rationale":"<1 sentence>"},
    ...5-7 categories that sum to 100
  ],
  "stocks":[
    {"ticker":"<e.g. AAPL>","name":"<full name>","weight":<% of portfolio, number>,"why":"<1 sentence reason>","type":"<Core|Growth|Defensive|Income>"},
    ...8-12 specific stocks/ETFs
  ],
  "etfs":[
    {"ticker":"<e.g. VOO>","name":"<full name>","weight":<number>,"why":"<1 sentence>"},
    ...2-4 ETFs
  ],
  "expectedReturn":"<e.g. 8-12% annual>",
  "maxDrawdown":"<e.g. -15% to -25%>",
  "rebalance":"<e.g. Quarterly>",
  "summary":"<3-4 sentences explaining the overall strategy and why it fits this risk profile>"
}`);
      // Save profile to localStorage so Portfolio Tracker can use it
      try{localStorage.setItem("compoundr_risk_profile",JSON.stringify({label:profile.label,desc:profile.desc,icon:profile.icon,color:profile.color}));}catch(e){}
      setPortfolio(p);onAnalysis();setStep("portfolio");
    }catch(e){setErr(`Error: ${e.message||"Could not generate portfolio."}`);}
    setLoading(false);
  };

  const reset=()=>{setStep("intro");setAnswers({});setCurrent(0);setPortfolio(null);setErr("");};

  // ── INTRO ──
  if(step==="intro")return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{textAlign:"center",padding:"40px 28px",background:`linear-gradient(135deg,${T.card},${T.accent})`,borderRadius:16,border:`1px solid ${T.goldDim}44`}}>
      <div style={{fontSize:56,marginBottom:16}}>🧬</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,color:T.gold,marginBottom:12,fontWeight:700}}>What's Your Investor DNA?</div>
      <div style={{fontSize:15,color:T.muted,maxWidth:580,margin:"0 auto 32px",lineHeight:1.8}}>
        Answer 8 questions and our AI will identify your risk profile — <span style={{color:T.text}}>Conservative, Moderate, or Aggressive</span> — then build a personalized portfolio of stocks and ETFs tailored to you.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:600,margin:"0 auto 36px"}}>
        {Object.values(PROFILES).map(({label,icon,color,traits})=>(
          <div key={label} style={{background:T.card,border:`1px solid ${color}44`,borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
            <div style={{fontSize:14,color,fontWeight:700,marginBottom:8}}>{label}</div>
            <div style={{fontSize:10,color:T.muted,lineHeight:1.6}}>{traits[0]}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-gold" onClick={()=>setStep("quiz")} style={{fontSize:16,padding:"14px 40px",borderRadius:12}}>
        🧬 Start My Risk Profile →
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
        <span style={{fontSize:12,color:T.muted}}>Question {current+1} of {QUESTIONS.length}</span>
        <span style={{fontSize:12,color:T.gold}}>{Math.round(progress)}% complete</span>
      </div>
      <div style={{height:4,background:T.border,borderRadius:2}}>
        <div style={{height:"100%",width:`${progress}%`,background:T.gold,borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>

      {/* Question card */}
      <Card s={{padding:32,background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
        <div style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>
          {["⏱️ Time Horizon","📉 Risk Reaction","🎯 Your Goal","📚 Experience","💸 Life Impact","🌊 Volatility","📊 Diversification","🎂 Your Age"][current]}
        </div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:28,lineHeight:1.4}}>
          {q.q}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.opts.map(({l,s})=>(
            <button key={l} onClick={()=>answer(s)}
              style={{background:T.accent,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 18px",textAlign:"left",cursor:"pointer",fontSize:14,color:T.text,transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.goldDim;e.currentTarget.style.background=`${T.gold}12`;e.currentTarget.style.color=T.gold;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.accent;e.currentTarget.style.color=T.text;}}>
              <span style={{color:T.goldDim,marginRight:10,fontFamily:"'DM Mono',monospace"}}>{["A","B","C","D"][q.opts.indexOf({l,s})]||"•"}</span>
              {l}
            </button>
          ))}
        </div>
      </Card>

      {current>0&&<button onClick={()=>{setCurrent(c=>c-1);const prev={...answers};delete prev[QUESTIONS[current-1].id];setAnswers(prev);}}
        style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12,alignSelf:"flex-start"}}>
        ← Back
      </button>}
    </div>;
  }

  // ── RESULT ──
  if(step==="result")return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Profile reveal */}
    <div style={{textAlign:"center",padding:"36px 28px",background:`linear-gradient(135deg,${T.card},${T.accent})`,borderRadius:16,border:`2px solid ${profile.color}44`}}>
      <div style={{fontSize:60,marginBottom:12}}>{profile.icon}</div>
      <div style={{fontSize:12,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Your Investor Profile</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,color:profile.color,fontWeight:700,marginBottom:16}}>{profile.label} Investor</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${profile.color}15`,border:`1px solid ${profile.color}44`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
        <span style={{fontSize:12,color:profile.color}}>Score: {totalScore}/{maxScore} points ({Math.round(pct*100)}%)</span>
      </div>
      <div style={{fontSize:15,color:T.muted,maxWidth:600,margin:"0 auto 28px",lineHeight:1.8}}>{profile.desc}</div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
        {profile.traits.map(t=><span key={t} style={{fontSize:12,padding:"5px 14px",borderRadius:20,background:`${profile.color}15`,color:profile.color,border:`1px solid ${profile.color}33`}}>✓ {t}</span>)}
      </div>

      {/* Score breakdown */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,maxWidth:560,margin:"0 auto 28px",textAlign:"left"}}>
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
            style={{flex:1,fontWeight:700,fontSize:16,textAlign:"center"}}/>
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
        <button className="btn btn-outline" onClick={reset} style={{padding:"14px 20px",borderRadius:12}}>Retake Quiz</button>
      </div>
      {err&&<div style={{marginTop:12,padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}
      {showRiskPaywall&&<PaywallModal context="riskPortfolio" onClose={()=>setShowRiskPaywall(false)}/>}

      {/* CTA → Portfolio Tracker */}
      <div style={{marginTop:16,padding:"20px 24px",background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.green,marginBottom:4}}>📁 Already have stocks? Let's analyze your portfolio</div>
          <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>
            Upload your positions and our AI will evaluate if your current portfolio matches your <strong style={{color:T.text}}>{profile.label}</strong> profile — and tell you exactly what to buy, hold, or sell.
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
      <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Open a brokerage account and start building your {profile.label} portfolio today.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
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
        <div style={{fontSize:13,color:profile.color,fontWeight:700,marginTop:4}}>{profile.label}</div>
      </div>
      <div>
        <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>🤖 AI Portfolio — {profile.label} Investor · ${amount.toLocaleString()}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.text,marginBottom:10,lineHeight:1.5}}>{portfolio.summary}</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[
            {l:"Expected Return",v:portfolio.expectedReturn,c:T.green},
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
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:18}}>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {(portfolio.stocks||[]).map(({ticker,name,weight,why,type})=>{
              const typeColor=type==="Core"?T.blue:type==="Growth"?T.green:type==="Defensive"?T.gold:T.purple;
              const dollarAmt=Math.round(amount*(weight/100));
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
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:`${typeColor}20`,color:typeColor,border:`1px solid ${typeColor}33`}}>{type}</span>
                <div style={{fontSize:10,color:T.muted,marginTop:6,lineHeight:1.5}}>{why}</div>
              </div>;
            })}
          </div>
        </Card>

        {/* ETFs */}
        {portfolio.etfs?.length>0&&<Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🗂️ Recommended ETFs</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {portfolio.etfs.map(({ticker,name,weight,why})=>(
              <div key={ticker} style={{background:T.accent,borderRadius:10,padding:12,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div><Mn sz={15} c={T.text} s={{fontWeight:700}}>{ticker}</Mn><div style={{fontSize:10,color:T.muted,marginTop:1}}>{name}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:12,color:T.blue,fontWeight:700}}>{weight}%</div><div style={{fontSize:10,color:T.muted}}>${Math.round(amount*(weight/100)).toLocaleString()}</div></div>
                </div>
                <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{why}</div>
              </div>
            ))}
          </div>
        </Card>}
      </div>
    </div>

    <AdBanner size="leaderboard"/>

    <div style={{display:"flex",gap:12,justifyContent:"center"}}>
      <button className="btn btn-outline" onClick={reset} style={{padding:"12px 24px",borderRadius:10}}>🔄 Retake Quiz</button>
      <button className="btn btn-gold" onClick={getPortfolio} style={{padding:"12px 24px",borderRadius:10}}>🤖 Regenerate Portfolio</button>
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
          You're a <strong style={{color:profile.color}}>{profile.icon} {profile.label} investor</strong>. Now let's check if your current holdings reflect that.
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
function RebalanceDCA({positions,totalValue,savedProfile,callAI}){
  const [cash,setCash]=useState("");
  const [loadingReb,setLoadingReb]=useState(false);
  const [loadingDCA,setLoadingDCA]=useState(false);
  const [rebalance,setRebalance]=useState(null);
  const [dca,setDca]=useState(null);
  const [err,setErr]=useState("");

  const profileLabel=savedProfile?.label||"Balanced";

  const runRebalance=async()=>{
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
      setRebalance(r);
    }catch(e){setErr("Rebalance error: "+e.message);}
    setLoadingReb(false);
  };

  const runDCA=async()=>{
    if(!cash||parseFloat(cash)<=0){setErr("Enter a valid cash amount first.");return;}
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
      setDca(r);
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
          {loadingReb?<><span className="sp">⟳</span> Analyzing...</>:"🔄 Get Rebalance Plan"}
        </button>
        {rebalance&&<div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:T.muted}}>Urgency:</span>
            <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:rebalance.urgency==="Urgent"?`${T.red}20`:rebalance.urgency==="Moderate"?`${T.gold}20`:`${T.green}20`,color:rebalance.urgency==="Urgent"?T.red:rebalance.urgency==="Moderate"?T.gold:T.green,fontWeight:600}}>{rebalance.urgency}</span>
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
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.green,marginBottom:6}}>💵 DCA — Deploy Cash</div>
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
          {loadingDCA?<><span className="sp">⟳</span> Planning...</>:"💵 Get DCA Plan"}
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

function PortfolioTab({canAnalyze,onShowPaywall}){
  const [paywallCtx,setPaywallCtx]=useState(null);
  // Read risk profile if user came from Risk Profile tab
  const savedProfile=(()=>{try{const p=localStorage.getItem("compoundr_risk_profile");return p?JSON.parse(p):null;}catch{return null;}})();
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

  // Load saved positions from localStorage
  useState(()=>{
    try{
      const saved=localStorage.getItem("compoundr_portfolio");
      if(saved)setPositions(JSON.parse(saved));
    }catch(e){}
  });

  const save=(pos)=>{
    try{localStorage.setItem("compoundr_portfolio",JSON.stringify(pos));}catch(e){}
  };

  const FREE_POSITION_LIMIT=3;
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

  // Fetch live prices from Finnhub for all tickers
  const fetchPrices=async()=>{
    if(!positions.length)return;
    setLoadingPrices(true);
    const key=import.meta.env.VITE_FINNHUB_KEY;
    const results={};
    await Promise.allSettled(
      [...new Set(positions.map(p=>p.ticker))].map(async ticker=>{
        try{
          const res=await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`);
          const d=await res.json();
          if(d.c)results[ticker]={price:d.c,change:d.d,changePct:d.dp,high:d.h,low:d.l};
        }catch(e){}
      })
    );
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
      const profileCtx=savedProfile?`Risk Profile: ${savedProfile.label}. ${savedProfile.desc}`:"No risk profile.";
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
  const FREE_PORTFOLIO_LIMIT=3;
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
  const verdictColor=v=>v==="Hold"||v==="Buy More"?T.green:v==="Watch"?T.gold:T.red;

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
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.gold}}>📁 My Portfolio</div>
        <div style={{fontSize:12,color:T.muted,marginTop:3}}>Track your positions · Live prices via Finnhub · AI analysis</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button className="btn btn-outline" onClick={fetchPrices} disabled={loadingPrices||!positions.length} style={{fontSize:12,padding:"8px 16px"}}>
          {loadingPrices?<><span className="sp">⟳</span> Updating...</>:"🔄 Refresh Prices"}
        </button>
        <button className="btn btn-gold" onClick={handleAIAnalysis} disabled={loadingAI||!positions.length} style={{fontSize:12,padding:"8px 16px"}}>
          {loadingAI?<><span className="sp">⟳</span> Analyzing...</>:"🤖 AI Analysis"}
        </button>
      </div>
    </div>

    {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}

    {/* KPI Cards */}
    {positions.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      {[
        {l:"Total Invested",v:`$${totalCost.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,c:T.blue,icon:"💵"},
        {l:"Current Value",v:`$${totalValue.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,c:T.gold,icon:"📊"},
        {l:"Total P&L",v:`${totalPnL>=0?"+":""}$${totalPnL.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,c:totalPnL>=0?T.green:T.red,icon:"📈"},
        {l:"Total Return",v:`${totalPnLPct>=0?"+":""}${totalPnLPct.toFixed(2)}%`,c:totalPnLPct>=0?T.green:T.red,icon:"🎯"},
      ].map(({l,v,c,icon})=><Card key={l} s={{padding:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,fontSize:22,opacity:0.12}}>{icon}</div>
        <Lbl>{l}</Lbl>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700,wordBreak:"break-all"}}>{v}</div>
      </Card>)}
    </div>}

    <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:18,alignItems:"start"}}>

      {/* Add Position Form */}
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:14}}>➕ Add Position</div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{id:"manual",l:"✏️ Manual"},{id:"paste",l:"📋 Paste from Excel"},{id:"csv",l:"📂 Import CSV"}].map(({id,l})=>(
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
          💾 Positions save automatically. Click <span style={{color:T.gold}}>Refresh Prices</span> for live data.
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
                    {["","Ticker","Shares","Avg Cost","Current Price","Total Cost","Current Value","P&L $","P&L %","Today","AI Verdict",""].map((h,i)=>(
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
                          {verdict?<span style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:`${verdictColor(verdict.verdict)}18`,color:verdictColor(verdict.verdict),border:`1px solid ${verdictColor(verdict.verdict)}33`,fontWeight:600,whiteSpace:"nowrap"}}>{verdict.verdict}</span>:<span style={{fontSize:11,color:T.muted}}>Run AI</span>}
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
                {aiAnalysis.profileMatch} — {savedProfile.label} Investor Profile
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
              <div style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>🤖 AI Assessment</div>
              <div style={{fontSize:13,color:T.text,lineHeight:1.7,marginBottom:10}}>{aiAnalysis.summary}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[
                  {l:"Risk",v:aiAnalysis.risk,c:aiAnalysis.risk==="Low"?T.green:aiAnalysis.risk==="High"?T.red:T.gold},
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
        {aiAnalysis&&<RebalanceDCA positions={enriched} totalValue={totalValue} savedProfile={savedProfile} callAI={callAI}/>}
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

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS=[{id:"compound",l:"💰 Compound Calculator"},{id:"whatif",l:"🚀 What If?"},{id:"score",l:"🎯 Analyze a Stock"},{id:"profile",l:"🧬 Risk Profile"},{id:"portfolio",l:"📁 My Portfolio"},{id:"ret",l:"📐 Expected Return"}];
const FREE_LIMIT=3;

function isAdmin(){try{return localStorage.getItem("compoundr_admin")==="true";}catch{return false;}}
function getCount(){try{if(isAdmin())return 0;return parseInt(localStorage.getItem("compoundr_count")||"0");}catch{return 0;}}
function incCount(){try{if(isAdmin())return 0;const n=getCount()+1;localStorage.setItem("compoundr_count",String(n));return n;}catch{return 999;}}

export default function App(){
  const [tab,setTab]=useState(null);
  const [m,setM]=useState(defM());
  const [moat,setMoat]=useState(defMoat());
  const [company,setCompany]=useState("");
  const [sector,setSector]=useState("Technology");
  const [showPaywall,setShowPaywall]=useState(false);
  const [paywallContext,setPaywallContext]=useState("stock");
  const [adminMode,setAdminMode]=useState(isAdmin());

  useState(()=>{
    const handler=(e)=>{
      if(e.ctrlKey&&e.shiftKey&&e.key==="A"){localStorage.setItem("compoundr_admin","true");setAdminMode(true);alert("✅ Admin mode ON — unlimited access");}
      if(e.ctrlKey&&e.shiftKey&&e.key==="D"){localStorage.removeItem("compoundr_admin");setAdminMode(false);alert("🔒 Admin mode OFF");}
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  });

  const canAnalyze=(ctx="stock")=>{const c=getCount();if(c>=FREE_LIMIT){setPaywallContext(ctx);setShowPaywall(true);return false;}return true;};
  const onAnalysis=()=>{incCount();};
  const handleStart=(targetTab="compound",ticker="")=>{setTab(targetTab||"compound");if(ticker)setCompany(ticker);};

  return<ErrorBoundary>
  <div style={{minHeight:"100vh",background:T.bg}}>
    <style>{css}</style>
    {showPaywall&&<PaywallModal onClose={()=>{setShowPaywall(false);setTab("compound");}} context={paywallContext}/>}
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 28px",position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1380,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 0"}}>
          <div onClick={()=>setTab(null)} style={{cursor:"pointer"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,color:T.gold,letterSpacing:"0.02em"}}>Compounder Analyst</div>
            <div style={{fontSize:9,color:T.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:1}}>Buffett · Munger · High-Growth Framework</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {adminMode
              ?<div style={{fontSize:11,color:T.green,padding:"4px 10px",border:`1px solid ${T.green}44`,borderRadius:6,background:`${T.green}10`}}>🔑 Admin — unlimited access</div>
              :<><div style={{fontSize:11,color:T.muted,padding:"4px 10px",border:`1px solid ${T.border}`,borderRadius:6}}>
                  {Math.max(0,FREE_LIMIT-getCount())>0?`${Math.max(0,FREE_LIMIT-getCount())} free analyses left`:"Free plan"}
                </div>
                <button className="btn btn-gold" onClick={()=>{setPaywallContext("stock");setShowPaywall(true);}} style={{fontSize:12,padding:"8px 18px"}}>
                  🚀 Go Premium — $9.99/mo
                </button></>
            }
          </div>
        </div>
        {tab&&<div style={{display:"flex",gap:0,marginTop:6,borderTop:`1px solid ${T.border}22`,paddingTop:2}}>
          {TABS.map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)} style={{color:tab===t.id?T.gold:T.muted,borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:8,fontSize:11}}>{t.l}</button>)}
        </div>}
      </div>
    </div>
    {!tab&&<Hero onStart={handleStart}/>}
    {tab&&<div style={{maxWidth:1380,margin:"0 auto",padding:"24px 28px"}}>
      {tab==="compound"&&<CompoundTab onGoToTab={(t)=>setTab(t)}/>}
      {tab==="whatif"&&<WhatIfTab/>}
      {tab==="score"&&<ScoreTab m={m} setM={setM} moat={moat} setMoat={setMoat} company={company} setCompany={setCompany} sector={sector} setSector={setSector} onAnalysis={onAnalysis} canAnalyze={canAnalyze}/>}
      {tab==="profile"&&<ProfileTab onAnalysis={onAnalysis} canAnalyze={canAnalyze} onGoToPortfolio={()=>setTab("portfolio")}/>}
      {tab==="portfolio"&&<PortfolioTab canAnalyze={canAnalyze} onShowPaywall={(ctx)=>{setPaywallContext(ctx);setShowPaywall(true);}}/>}
      {tab==="ret"&&<ReturnTab onAnalysis={onAnalysis} canAnalyze={canAnalyze}/>}
    </div>}
    <div style={{maxWidth:1380,margin:"0 auto",padding:"0 28px 20px"}}><AdBanner size="leaderboard"/></div>
    <div style={{borderTop:`1px solid ${T.border}`,padding:"14px 28px",maxWidth:1380,margin:"0 auto"}}>
      <div style={{fontSize:9,color:T.muted,textAlign:"center"}}><span style={{color:T.goldDim}}>Compounder Analyst</span> · Inspired by Buffett · Munger · Educational only — not financial advice.</div>
    </div>
  </div>
  </ErrorBoundary>;
}
