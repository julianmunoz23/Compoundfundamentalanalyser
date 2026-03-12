import { useState, useCallback } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

const T = {
  bg:"#0a0c10",surface:"#10141c",card:"#141820",border:"#1e2534",
  gold:"#c9a84c",goldLight:"#e8c97a",goldDim:"#7a6330",
  green:"#2ecc71",red:"#e74c3c",blue:"#4a9eff",purple:"#a855f7",
  text:"#e8eaf0",muted:"#6b7694",accent:"#1a2235",
};

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${T.goldDim};border-radius:2px;}
  input[type=range]{-webkit-appearance:none;width:100%;height:3px;background:${T.border};border-radius:2px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:${T.gold};border-radius:50%;cursor:pointer;}
  input[type=range]:disabled{opacity:0.35;cursor:not-allowed;}
  input[type=range]:disabled::-webkit-slider-thumb{background:${T.muted};cursor:not-allowed;}
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
  .trow:hover td{background:${T.accent};}
  .hero-grad{background:linear-gradient(135deg,#0a0c10 0%,#0f1420 50%,#0a0c10 100%);}
  .ext-link{text-decoration:none;font-size:11px;color:${T.muted};padding:4px 10px;border:1px solid ${T.border};border-radius:6px;transition:all 0.2s;}
  .ext-link:hover{border-color:${T.goldDim};color:${T.gold};}
`;

// ── UTILS ────────────────────────────────────────────────────────────────────
// Always show full values in thousands / millions / billions / trillions
const fmtFull=(n)=>{
  if(n===undefined||n===null||isNaN(n))return"$0";
  const abs=Math.abs(n);
  if(abs>=1e12)return`$${(n/1e12).toFixed(3).replace(/\.?0+$/,"")}T`;
  if(abs>=1e9)return`$${(n/1e9).toFixed(3).replace(/\.?0+$/,"")}B`;
  if(abs>=1e6)return`$${(n/1e6).toFixed(3).replace(/\.?0+$/,"")}M`;
  if(abs>=1e3)return`$${(n/1e3).toFixed(1).replace(/\.?0+$/,"")}K`;
  return`$${n.toFixed(0)}`;
};

// ── CRITERIA — FCF now uses FCF Growth Rate, not ratio ───────────────────────
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

function sm(c,v){
  if(c.invert){if(v<=c.threshold)return 100;if(v>=c.max)return 0;return Math.round((1-(v-c.threshold)/(c.max-c.threshold))*100);}
  if(v>=c.threshold*1.5)return 100;
  if(v>=c.threshold)return Math.round(60+((v-c.threshold)/(c.threshold*0.5))*40);
  return Math.round((v/c.threshold)*60);
}
function calcScore(m,moat){
  let tw=0,ts=0;
  Object.values(CRITERIA).flat().forEach(c=>{const s=sm(c,m[c.key]||0);ts+=s*c.weight;tw+=c.weight;});
  const moatAvg=Object.values(moat).reduce((a,v)=>a+v,0)/(MOAT_KEYS.length*5)*100;
  ts+=moatAvg*10;tw+=10;
  return Math.round(ts/tw);
}
function grade(s){
  if(s>=85)return{l:"A+",c:T.green,label:"Elite Compounder"};
  if(s>=75)return{l:"A",c:T.green,label:"High Quality"};
  if(s>=65)return{l:"B+",c:T.gold,label:"Good Business"};
  if(s>=55)return{l:"B",c:T.gold,label:"Promising"};
  if(s>=45)return{l:"C",c:"#f39c12",label:"Needs Improvement"};
  return{l:"D",c:T.red,label:"Avoid"};
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
const Card=({children,s,onClick})=><div onClick={onClick} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,...s}}>{children}</div>;
const Lbl=({children,s})=><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,fontWeight:500,marginBottom:5,...s}}>{children}</div>;
const Mn=({children,sz=14,c=T.text,s})=><span style={{fontFamily:"'DM Mono',monospace",fontSize:sz,color:c,...s}}>{children}</span>;

function ScoreRing({score,size=80}){
  const g=grade(score);
  const r=size*0.38,cx=size/2,cy=size/2;
  const arc=v=>{const a=-135+(v/100)*270,rd=x=>x*Math.PI/180;return`M ${cx+r*Math.cos(rd(-135))} ${cy+r*Math.sin(rd(-135))} A ${r} ${r} 0 ${a>45?1:0} 1 ${cx+r*Math.cos(rd(a))} ${cy+r*Math.sin(rd(a))}`;};
  return<svg width={size} height={size*0.78} viewBox={`0 0 ${size} ${size*0.78}`}>
    <path d={arc(100)} fill="none" stroke={T.border} strokeWidth={size*0.065} strokeLinecap="round"/>
    <path d={arc(score)} fill="none" stroke={g.c} strokeWidth={size*0.065} strokeLinecap="round" style={{filter:`drop-shadow(0 0 ${size*0.06}px ${g.c}88)`}}/>
    <text x={cx} y={cy*0.95} textAnchor="middle" fill={g.c} style={{fontFamily:"'Playfair Display',serif",fontSize:size*0.3,fontWeight:700}}>{g.l}</text>
    <text x={cx} y={cy*1.2} textAnchor="middle" fill={T.muted} style={{fontFamily:"'DM Mono',monospace",fontSize:size*0.13}}>{score}/100</text>
  </svg>;
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({onStart}){
  const TOP=[
    {t:"NVDA",r:"142%",c:T.green},{t:"MSFT",r:"28%",c:T.green},{t:"AAPL",r:"21%",c:T.green},
    {t:"COST",r:"38%",c:T.green},{t:"AMZN",r:"81%",c:T.green},{t:"META",r:"194%",c:T.green},
  ];
  return<div className="hero-grad fi" style={{padding:"60px 28px 50px",maxWidth:1380,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:48}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.gold}15`,border:`1px solid ${T.goldDim}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
        <span style={{fontSize:11,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>✦ Buffett · Munger Framework</span>
      </div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:46,color:T.text,lineHeight:1.15,marginBottom:16,fontWeight:700}}>
        Find <span style={{color:T.gold}}>Compounders</span> that can<br/>grow your wealth for decades
      </h1>
      <p style={{fontSize:16,color:T.muted,maxWidth:560,margin:"0 auto 32px",lineHeight:1.7}}>
        Analyze fundamentals and simulate compound growth in seconds. See exactly how much your money can grow.
      </p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-gold" onClick={()=>onStart("compound")} style={{fontSize:15,padding:"14px 32px",borderRadius:10}}>🚀 Start Analyzing</button>
        <button className="btn btn-outline" onClick={()=>onStart("score")} style={{fontSize:14,padding:"14px 24px",borderRadius:10}}>🔍 AI Scorecard</button>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:700,margin:"0 auto 40px"}}>
      {[{n:"15%+",l:"Target CAGR"},{n:"8 criteria",l:"Buffett/Munger"},{n:"AI powered",l:"Analysis in seconds"}].map(({n,l})=>(
        <div key={l} style={{textAlign:"center",padding:"16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.gold,marginBottom:4}}>{n}</div>
          <div style={{fontSize:11,color:T.muted}}>{l}</div>
        </div>
      ))}
    </div>
    <div>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Top Compounders — 1Y Return</div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        {TOP.map(({t,r,c})=>(
          <div key={t} onClick={()=>onStart("score",t)}
            style={{cursor:"pointer",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.goldDim;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
            <Mn sz={13} c={T.text} s={{fontWeight:700}}>{t}</Mn>
            <span style={{fontSize:12,color:c}}>+{r}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ── COMPOUND CALCULATOR ───────────────────────────────────────────────────────
function CompoundTab(){
  // Draft state (sliders, not yet calculated)
  const [draft,setDraft]=useState({initial:10000,rate:12,rateType:"annual",contrib:500,contribFreq:"monthly",years:20});
  // Committed state (what the charts show)
  const [cfg,setCfg]=useState({initial:10000,rate:12,rateType:"annual",contrib:500,contribFreq:"monthly",years:20});
  const [showTable,setShowTable]=useState(true);
  const setD=(k,v)=>setDraft(p=>({...p,[k]:v}));

  const annualRate=cfg.rateType==="monthly"?Math.pow(1+cfg.rate/100,12)-1:cfg.rate/100;
  const annualContrib=cfg.contribFreq==="monthly"?cfg.contrib*12:cfg.contrib;

  const data=useCallback(()=>{
    let balance=cfg.initial,totalContrib=cfg.initial,totalInt=0;
    return Array.from({length:cfg.years},(_,i)=>{
      const intY=balance*annualRate+annualContrib*(annualRate/2);
      balance=balance*(1+annualRate)+annualContrib;
      totalContrib+=annualContrib;totalInt+=intY;
      return{
        year:i+1,label:`Y${i+1}`,
        contributed:Math.round(totalContrib),
        interest:Math.round(totalInt),
        interestAnual:Math.round(intY),
        balance:Math.round(balance),
        mult:+(balance/cfg.initial).toFixed(2),
      };
    });
  },[cfg,annualRate,annualContrib])();

  const last=data[data.length-1]||{};
  const annualPct=annualRate*100;
  const doubleYears=(72/annualPct).toFixed(1);

  const handleCalculate=()=>setCfg({...draft});

  const StackedTT=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    const cap=payload.find(p=>p.dataKey==="contributed")?.value||0;
    const int=payload.find(p=>p.dataKey==="interest")?.value||0;
    return<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14,minWidth:210}}>
      <div style={{fontSize:12,color:T.gold,marginBottom:8,fontFamily:"'Playfair Display',serif"}}>{label}</div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
        <span style={{color:T.muted}}>💵 Capital Invested</span>
        <Mn sz={11} c={T.blue}>{fmtFull(cap)}</Mn>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}>
        <span style={{color:T.muted}}>✨ Interest Earned</span>
        <Mn sz={11} c={T.green}>{fmtFull(int)}</Mn>
      </div>
      <div style={{borderTop:`1px solid ${T.border}33`,paddingTop:6,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:T.muted}}>Total Balance</span>
        <Mn sz={12} c={T.gold} s={{fontWeight:700}}>{fmtFull(cap+int)}</Mn>
      </div>
      {int>cap&&<div style={{marginTop:6,fontSize:10,color:T.green,textAlign:"center"}}>✨ Interest now exceeds your capital!</div>}
    </div>;
  };

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      {[
        {l:"Final Balance",v:fmtFull(last.balance||0),c:T.gold,sub:`in ${cfg.years} years`,icon:"🏆"},
        {l:"Total Invested",v:fmtFull(last.contributed||0),c:T.blue,sub:"your money",icon:"💵"},
        {l:"Interest Earned",v:fmtFull(last.interest||0),c:T.green,sub:`${last.balance?((last.interest/last.balance)*100).toFixed(0):0}% of total`,icon:"✨"},
        {l:"Multiplier",v:`${last.mult||1}x`,c:T.purple,sub:`Doubles every ${doubleYears} yrs`,icon:"🚀"},
      ].map(({l,v,c,sub,icon})=><Card key={l} s={{padding:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,fontSize:22,opacity:0.12}}>{icon}</div>
        <Lbl>{l}</Lbl>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:c,fontWeight:700,marginBottom:3}}>{v}</div>
        <div style={{fontSize:10,color:T.muted}}>{sub}</div>
      </Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:18}}>
      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:18}}>⚙️ Your Scenario</div>

          <Lbl>Initial Investment</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={draft.initial} min={0} max={10000000} step={100} onChange={e=>setD("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/>
          </div>
          <input type="range" min={0} max={500000} step={500} value={draft.initial} onChange={e=>setD("initial",parseFloat(e.target.value))} style={{marginBottom:16}}/>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Expected Rate</Lbl>
            <div style={{display:"flex",gap:4}}>
              {["annual","monthly"].map(t=><button key={t} className={`seg ${draft.rateType===t?"seg-on":""}`} onClick={()=>setD("rateType",t)}>{t==="annual"?"Annual":"Monthly"}</button>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <input type="number" value={draft.rate} min={0.01} max={draft.rateType==="monthly"?5:100} step={0.1} onChange={e=>setD("rate",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/>
            <span style={{color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>% /{draft.rateType==="annual"?"yr":"mo"}</span>
          </div>
          <input type="range" min={0.1} max={draft.rateType==="monthly"?5:100} step={0.1} value={draft.rate} onChange={e=>setD("rate",parseFloat(e.target.value))} style={{marginBottom:4}}/>
          {draft.rateType==="monthly"&&<div style={{fontSize:10,color:T.green,marginBottom:12}}>≡ {((Math.pow(1+draft.rate/100,12)-1)*100).toFixed(2)}% effective annual</div>}
          <div style={{marginBottom:14}}/>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Periodic Contributions (DCA)</Lbl>
            <div style={{display:"flex",gap:4}}>
              {["monthly","annual"].map(t=><button key={t} className={`seg ${draft.contribFreq===t?"seg-on":""}`} onClick={()=>setD("contribFreq",t)}>{t==="monthly"?"Mo":"Yr"}</button>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={draft.contrib} min={0} max={100000} step={50} onChange={e=>setD("contrib",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/>
            <span style={{color:T.muted,fontSize:11}}>/{draft.contribFreq==="monthly"?"month":"year"}</span>
          </div>
          <input type="range" min={0} max={20000} step={50} value={draft.contrib} onChange={e=>setD("contrib",parseFloat(e.target.value))} style={{marginBottom:16}}/>

          <Lbl>Investment Horizon</Lbl>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,color:T.muted}}>Years</span>
            <Mn sz={13} c={T.gold}>{draft.years} years</Mn>
          </div>
          <input type="range" min={1} max={50} step={1} value={draft.years} onChange={e=>setD("years",parseInt(e.target.value))} style={{marginBottom:20}}/>

          {/* CALCULATE BUTTON */}
          <button className="btn btn-gold" onClick={handleCalculate} style={{width:"100%",fontSize:15,padding:"13px 0",borderRadius:10,letterSpacing:"0.04em"}}>
            🔄 Calculate Results
          </button>
        </Card>

        <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:12}}>✨ The Magic of Compounding</div>
          {[
            {l:"Without contributions",v:fmtFull(cfg.initial*Math.pow(1+annualRate,cfg.years))},
            {l:"Capital only (no interest)",v:fmtFull(last.contributed||0)},
            {l:"With compound interest 🏆",v:fmtFull(last.balance||0),hi:true},
            {l:"Generated by interest alone",v:`+${fmtFull(last.interest||0)}`,pos:true},
          ].map(({l,v,hi,pos})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}22`,alignItems:"center"}}>
            <span style={{fontSize:11,color:hi?T.text:T.muted}}>{l}</span>
            <Mn sz={hi?13:11} c={pos?T.green:hi?T.gold:T.muted} s={hi?{fontWeight:700}:{}}>{v}</Mn>
          </div>)}
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.7}}>
            📐 <span style={{color:T.gold}}>Rule of 72:</span> Your money <span style={{color:T.goldLight}}>doubles every {doubleYears} years</span> at {annualPct.toFixed(1)}% annual
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {/* STACKED BAR CHART — Capital vs Interest */}
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>📊 Capital vs. Interest — The Snowball Effect</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:14}}>
            Watch how the green (interest) bar grows until it <strong style={{color:T.green}}>overtakes</strong> the blue (capital) — this is the compounding magic
          </div>
          <div style={{height:290}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.max(0,Math.floor(cfg.years/8)-1)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtFull(v)} width={82}/>
                <Tooltip content={<StackedTT/>}/>
                <Legend formatter={n=>n==="contributed"?"Capital Invested":"Interest Earned"} wrapperStyle={{fontSize:11,color:T.muted,paddingTop:8}}/>
                <Bar dataKey="contributed" stackId="a" fill={T.blue} opacity={0.85} name="contributed"/>
                <Bar dataKey="interest" stackId="a" fill={T.green} opacity={0.85} name="interest" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Annual interest bar */}
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>📈 Annual Interest Generated</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:12}}>Each year generates more interest than the last — the snowball keeps growing</div>
          <div style={{height:170}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.max(0,Math.floor(cfg.years/8)-1)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmtFull(v)} width={82}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={v=>[fmtFull(v),"Annual Interest"]}/>
                <Bar dataKey="interestAnual" fill={T.green} opacity={0.85} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>

    {/* Milestones */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[5,10,20,cfg.years].filter((y,i,a)=>a.indexOf(y)===i&&y<=cfg.years).slice(0,4).map(y=>{
        const row=data[y-1];if(!row)return null;
        const intPct=row.balance>0?((row.interest/row.balance)*100).toFixed(0):0;
        const intAhead=row.interest>row.contributed;
        return<Card key={y} s={{padding:14,textAlign:"center",background:`${T.gold}06`,border:`1px solid ${T.goldDim}33`}}>
          <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Year {y}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.gold,marginBottom:4}}>{fmtFull(row.balance)}</div>
          <div style={{fontSize:10,color:T.green,marginBottom:3}}>×{row.mult} initial investment</div>
          {intAhead&&<div style={{fontSize:10,color:T.green,padding:"2px 6px",background:`${T.green}15`,borderRadius:10,border:`1px solid ${T.green}33`}}>Interest &gt; Capital ✨</div>}
          {!intAhead&&<div style={{fontSize:10,color:T.muted}}>{intPct}% from interest</div>}
        </Card>;
      })}
    </div>

    {/* Table */}
    <Card s={{padding:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold}}>📋 Year-by-Year Detail</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>Capital · Contributions · Interest · Final Balance</div>
        </div>
        <button className="seg" onClick={()=>setShowTable(v=>!v)}>{showTable?"Hide Table":"Show Table"}</button>
      </div>
      {showTable&&<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
          <thead><tr style={{background:T.accent,borderBottom:`1px solid ${T.border}`}}>
            {["Year","Annual Contribution","Interest This Year","Cumul. Interest","Final Balance","×Initial"].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"right",fontSize:9,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,...(h==="Year"?{textAlign:"center"}:{})}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map(r=>{
              const hi=r.year%5===0||r.year===cfg.years;
              const milestone=r.interest>r.contributed&&data[r.year-2]&&data[r.year-2].interest<=data[r.year-2].contributed;
              return<tr key={r.year} className="trow" style={{borderBottom:`1px solid ${T.border}22`,background:milestone?`${T.green}08`:hi?`${T.gold}07`:"transparent"}}>
                <td style={{padding:"9px 14px",textAlign:"center"}}>
                  <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:milestone?`${T.green}33`:hi?`${T.gold}33`:T.accent,border:`1px solid ${milestone?T.green:hi?T.goldDim:T.border}`}}>
                    <Mn sz={10} c={milestone?T.green:hi?T.gold:T.muted}>{r.year}</Mn>
                  </div>
                  {milestone&&<div style={{fontSize:8,color:T.green,marginTop:2}}>✨ crossover</div>}
                </td>
                <td style={{padding:"9px 14px",textAlign:"right"}}><Mn sz={12} c={T.blue}>{fmtFull(annualContrib)}</Mn></td>
                <td style={{padding:"9px 14px",textAlign:"right"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                    <Mn sz={12} c={T.green}>{fmtFull(r.interestAnual)}</Mn>
                    <div style={{width:Math.min((r.interestAnual/(last.interestAnual||1))*50,50),height:2,background:T.green,borderRadius:2,opacity:0.5}}/>
                  </div>
                </td>
                <td style={{padding:"9px 14px",textAlign:"right"}}>
                  <Mn sz={12} c={r.interest>r.contributed?T.green:`${T.green}88`}>{fmtFull(r.interest)}</Mn>
                  <div style={{fontSize:9,color:T.muted}}>{r.balance>0?((r.interest/r.balance)*100).toFixed(0):0}% of balance</div>
                </td>
                <td style={{padding:"9px 14px",textAlign:"right"}}><Mn sz={hi?14:12} c={hi?T.gold:T.text} s={hi?{fontWeight:700}:{}}>{fmtFull(r.balance)}</Mn></td>
                <td style={{padding:"9px 14px",textAlign:"right"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:r.mult>=5?`${T.gold}22`:r.mult>=2?`${T.green}15`:`${T.blue}15`,color:r.mult>=5?T.gold:r.mult>=2?T.green:T.blue}}>×{r.mult}</span>
                </td>
              </tr>;
            })}
          </tbody>
          <tfoot><tr style={{borderTop:`2px solid ${T.border}`,background:T.accent}}>
            <td style={{padding:"12px 14px",textAlign:"center"}}><Mn sz={11} c={T.gold}>TOTAL</Mn></td>
            <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={12} c={T.blue}>{fmtFull(annualContrib*cfg.years)}</Mn></td>
            <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={12} c={T.muted}>—</Mn></td>
            <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={13} c={T.green} s={{fontWeight:700}}>{fmtFull(last.interest||0)}</Mn></td>
            <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={14} c={T.gold} s={{fontWeight:700}}>{fmtFull(last.balance||0)}</Mn></td>
            <td style={{padding:"12px 14px",textAlign:"right"}}><span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:`${T.gold}22`,color:T.gold,border:`1px solid ${T.goldDim}`,fontWeight:700}}>×{last.mult}</span></td>
          </tr></tfoot>
        </table>
      </div>}
    </Card>

    <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`,padding:18}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <div style={{fontSize:26,flexShrink:0}}>💡</div>
        <div style={{fontSize:12,color:T.muted,lineHeight:1.9}}>
          With <Mn sz={12} c={T.gold}>{fmtFull(cfg.initial)}</Mn> initial investment and {cfg.contribFreq==="monthly"?<Mn sz={12} c={T.blue}>{fmtFull(cfg.contrib)}/month</Mn>:<Mn sz={12} c={T.blue}>{fmtFull(cfg.contrib)}/year</Mn>} contributions at <Mn sz={12} c={T.green}>{annualPct.toFixed(1)}% annual</Mn>,
          in <Mn sz={12} c={T.text}>{cfg.years} years</Mn> you will have invested <Mn sz={12} c={T.blue}>{fmtFull(last.contributed||0)}</Mn> and compound interest will have generated an additional <Mn sz={12} c={T.green}>{fmtFull(last.interest||0)}</Mn> —
          that's <Mn sz={12} c={T.gold}>{last.balance?((last.interest/last.balance)*100).toFixed(0):0}%</Mn> of your wealth created by money working for you, not by you. Your money doubles every <Mn sz={12} c={T.gold}>{doubleYears} years</Mn>.
        </div>
      </div>
    </Card>
  </div>;
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.text,marginBottom:6}}>
        What if you had invested <span style={{color:T.gold}}>$10,000</span>...
      </div>
      <div style={{fontSize:13,color:T.muted}}>Explore the power of compounding in the best businesses of the last decade</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {SCENARIOS.map(s=><Card key={s.ticker} s={{border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,marginBottom:2}}>{s.name}</div>
            <div style={{fontSize:10,color:T.muted}}>{s.ticker} · since {s.year}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:s.color,fontWeight:700}}>{fmtFull(s.finalValue)}</div>
            <div style={{fontSize:10,color:s.color}}>CAGR ~{s.cagr}%</div>
          </div>
        </div>
        <div style={{height:3,background:T.border,borderRadius:2,marginBottom:8}}>
          <div style={{height:"100%",width:`${Math.min((s.finalValue/4000000)*100,100)}%`,background:s.color,borderRadius:2}}/>
        </div>
        <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{s.desc}</div>
        <div style={{marginTop:10,padding:"6px 10px",background:T.accent,borderRadius:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:T.muted}}>$10,000 invested</span>
          <Mn sz={11} c={s.color} s={{fontWeight:700}}>→ {fmtFull(s.finalValue)}</Mn>
        </div>
      </Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:18}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:16}}>🎯 Your Custom Scenario</div>
        <Lbl>Initial Capital</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <span style={{color:T.muted,fontFamily:"monospace"}}>$</span>
          <input type="number" value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/>
        </div>
        <input type="range" min={1000} max={1000000} step={1000} value={custom.initial} onChange={e=>sc("initial",parseFloat(e.target.value))} style={{marginBottom:14}}/>
        <Lbl>Expected CAGR</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <input type="number" value={custom.cagr} onChange={e=>sc("cagr",parseFloat(e.target.value)||0)} style={{fontWeight:700}}/>
          <span style={{color:T.muted,fontSize:12}}>% per year</span>
        </div>
        <input type="range" min={1} max={100} step={0.5} value={custom.cagr} onChange={e=>sc("cagr",parseFloat(e.target.value))} style={{marginBottom:14}}/>
        <Lbl>Years</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.muted}}>Horizon</span><Mn sz={12} c={T.gold}>{custom.years} years</Mn></div>
        <input type="range" min={1} max={40} step={1} value={custom.years} onChange={e=>sc("years",parseInt(e.target.value))}/>
        <div style={{marginTop:16,padding:14,background:`${T.gold}08`,borderRadius:10,border:`1px solid ${T.goldDim}44`,textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Your result in {custom.years} years</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:T.gold,fontWeight:700}}>{fmtFull(customFinal)}</div>
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
              <YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>fmtFull(v)} width={82}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={v=>[fmtFull(v),"Portfolio Value"]}/>
              <Area type="monotone" dataKey="v" stroke={T.gold} fill="url(#gW)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
    <Card s={{background:`${T.blue}08`,border:`1px solid ${T.blue}33`,padding:14}}>
      <div style={{fontSize:12,color:T.muted,textAlign:"center"}}>
        ⚠️ <span style={{color:T.gold}}>Disclaimer:</span> Historical returns do not guarantee future results. This simulator is for educational purposes only. CAGRs are approximate based on historical price data.
      </div>
    </Card>
  </div>;
}

// ── SCORECARD ─────────────────────────────────────────────────────────────────
function MRow({c,value,onChange,locked}){
  const s=sm(c,value),pass=c.invert?value<=c.threshold:value>=c.threshold;
  return<div style={{display:"grid",gridTemplateColumns:"1fr 85px 50px 28px",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${T.border}22`}}>
    <div>
      <div style={{fontSize:12,color:T.text,marginBottom:3}}>{c.label}</div>
      <input type="range" min={0} max={c.max} step={0.1} value={value} disabled={locked} onChange={e=>!locked&&onChange(c.key,parseFloat(e.target.value))}/>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:3}}>
      <input type="number" value={value} min={0} max={c.max} step={0.1} disabled={locked} onChange={e=>!locked&&onChange(c.key,parseFloat(e.target.value)||0)} style={{width:60,textAlign:"right",opacity:locked?0.6:1}}/>
      <span style={{fontSize:10,color:T.muted}}>{c.unit}</span>
    </div>
    <div style={{textAlign:"center",fontSize:11,color:s>=60?T.green:s>=40?T.gold:T.red}}>{s}%</div>
    <div style={{fontSize:14,textAlign:"center",color:pass?T.green:T.red}}>{pass?"✓":"✗"}</div>
  </div>;
}

function ScoreTab({m,setM,moat,setMoat,company,setCompany,sector,setSector}){
  const [loading,setLoading]=useState(false);
  const [info,setInfo]=useState(null);
  const [err,setErr]=useState("");
  const [locked,setLocked]=useState(false);

  const score=calcScore(m,moat);
  const g=grade(score);
  const catS=Object.entries(CRITERIA).map(([cat,cs])=>({
    cat:cat==="growth"?"📈 Growth":cat==="profitability"?"💎 Profitability":cat==="cashflow"?"💵 Cash Flow":"🏦 Balance Sheet",
    s:Math.round(cs.reduce((a,c)=>a+sm(c,m[c.key]||0),0)/cs.length),
    weight:cat==="growth"?35:cat==="profitability"?35:cat==="cashflow"?20:10,
  }));
  const radarD=MOAT_KEYS.map(k=>({subject:k.split(" ")[0],value:moat[k],fullMark:5}));

  const analyze=async()=>{
    if(!company.trim()){setErr("Enter a ticker first.");return;}
    setLoading(true);setErr("");setInfo(null);setLocked(false);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":import.meta.env.VITE_ANTHROPIC_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1400,
          messages:[{
            role:"user",
            content:`You are a Buffett/Munger investment analyst with access to real fundamental data. Analyze "${company}" using real data up to your knowledge cutoff.

IMPORTANT FOR FCF: Use the FCF GROWTH RATE (3-5Y CAGR %) — NOT a ratio. For example, DUOL had FCF growing from near zero to $200M+, that is a very high FCF growth CAGR (60%+). Capture that dynamism.

Also include analyst consensus data as reported by Yahoo Finance, TradingView, or Wall Street consensus (price targets, ratings, next-year forecasts).

Respond ONLY with valid JSON, no markdown, no explanation:
{"metrics":{"revenueCAGR":<3-5Y revenue CAGR as number>,"fcfGrowth":<FCF 3-5Y CAGR % as number, e.g. 65 for DUOL>,"tamGrowth":<TAM growth % per year as number>,"roic":<ROIC % as number>,"grossMargin":<gross margin % as number>,"opMargin":<operating margin % as number>,"fcfMarginPct":<FCF margin % as number>,"debtEbitda":<Debt/EBITDA as number>,"interestCover":<interest coverage ratio as number>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<Technology|Healthcare|Consumer|Finance|Industrials|Energy|Other>","summary":"<2-3 sentences in English: investment thesis and key risk>","catalysts":["<catalyst 1>","<catalyst 2>","<catalyst 3>"],"keyMetrics":{"revenueGrowth5y":"<e.g. +56% CAGR>","roicDisplay":"<e.g. 18%>","fcfGrowthDisplay":"<e.g. +67% CAGR>","fcfMarginDisplay":"<e.g. 19%>","debtEquity":"<e.g. 0.2x>","epsGrowth":"<e.g. +38%>"},"analystConsensus":{"rating":"<Strong Buy|Buy|Overweight|Hold|Underweight|Sell>","priceTarget":"<e.g. $120>","upsideDownside":"<e.g. +18% upside>","numAnalysts":"<e.g. 24 analysts>","revenueNextYear":"<e.g. +22% YoY>","epsNextYear":"<e.g. +31% YoY>","source":"<e.g. Yahoo Finance / Wall Street consensus>"}}`,
          }],
        }),
      });
      const d=await res.json();
      if(d.error)throw new Error(d.error.message);
      const txt=d.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
      const p=JSON.parse(txt);
      setM(prev=>({...prev,...p.metrics}));
      setMoat(prev=>({...prev,...p.moat}));
      if(p.sector)setSector(p.sector);
      setInfo(p);
      setLocked(true);
    }catch(e){
      setErr(`Error: ${e.message||"Could not analyze. Check ticker and API key."}`);
    }
    setLoading(false);
  };

  const checklist=[
    {l:"Revenue CAGR ≥ 15%",p:m.revenueCAGR>=15},
    {l:"ROIC ≥ 20%",p:m.roic>=20},
    {l:"Gross Margin ≥ 40%",p:m.grossMargin>=40},
    {l:"Operating Margin ≥ 18%",p:m.opMargin>=18},
    {l:"FCF Growth Rate ≥ 15%",p:m.fcfGrowth>=15},
    {l:"FCF Margin ≥ 15%",p:m.fcfMarginPct>=15},
    {l:"Debt/EBITDA ≤ 2x",p:m.debtEbitda<=2},
    {l:"Avg Moat ≥ 3/5",p:Object.values(moat).reduce((a,v)=>a+v,0)/MOAT_KEYS.length>=3},
  ];

  const ratingColor=(r)=>{
    if(!r)return T.muted;
    if(r.includes("Strong Buy")||r.includes("Buy")||r.includes("Over"))return T.green;
    if(r.includes("Sell")||r.includes("Under"))return T.red;
    return T.gold;
  };

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Search bar */}
    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <Lbl>Ticker / Company</Lbl>
          <input type="text" value={company}
            onChange={e=>{setCompany(e.target.value.toUpperCase());setLocked(false);setInfo(null);}}
            placeholder="NVDA, AAPL, DUOL, HIMS..."
            onKeyDown={e=>e.key==="Enter"&&analyze()}
            style={{fontSize:16,fontWeight:700,letterSpacing:"0.05em",padding:"12px 16px"}}/>
        </div>
        <div style={{width:150}}>
          <Lbl>Sector</Lbl>
          <select value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
        </div>
        <button className="btn btn-gold" onClick={analyze} disabled={loading} style={{height:44,padding:"0 24px",fontSize:14}}>
          {loading?<span className="sp">⟳</span>:"✦ Analyze with AI"}
        </button>
        {locked&&<button className="seg" onClick={()=>{setLocked(false);}} style={{height:44,color:T.gold,borderColor:T.goldDim}}>🔓 Unlock Sliders</button>}
      </div>
      {!info&&!loading&&!err&&<div style={{textAlign:"center",paddingTop:10,fontSize:12,color:T.muted,borderTop:`1px solid ${T.border}33`,marginTop:12}}>
        Enter any ticker and press <span style={{color:T.gold,fontWeight:600}}>✦ Analyze with AI</span> — metrics and sliders will auto-fill and lock
      </div>}
      {loading&&<div style={{textAlign:"center",padding:12,fontSize:12,color:T.gold,background:`${T.gold}08`,borderRadius:8,marginTop:10}}>
        <span className="sp">⟳</span>  Analyzing <strong>{company}</strong>...
      </div>}
      {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`,marginTop:10}}>{err}</div>}
      {locked&&<div style={{padding:"6px 10px",background:`${T.green}10`,borderRadius:6,fontSize:11,color:T.green,border:`1px solid ${T.green}33`,marginTop:10}}>
        🔒 Sliders locked to AI data — click "Unlock Sliders" to edit manually
      </div>}
    </Card>

    {/* Score + Analysis block */}
    {info&&<>
      <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:16,alignItems:"start"}}>
        {/* Score ring */}
        <Card s={{textAlign:"center",padding:18}}>
          <div style={{fontSize:10,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Quality Score</div>
          <ScoreRing score={score} size={110}/>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:g.c,marginTop:4}}>{g.label}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:6}}>{checklist.filter(c=>c.p).length}/8 criteria met</div>
          <div style={{marginTop:12}}>
            {catS.map(({cat,s,weight})=><div key={cat} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
                <span style={{color:T.muted}}>{cat}</span>
                <Mn sz={10} c={s>=60?T.green:s>=40?T.gold:T.red}>{s}%</Mn>
              </div>
              <div style={{height:3,background:T.border,borderRadius:2}}>
                <div style={{height:"100%",width:`${s}%`,background:s>=60?T.green:s>=40?T.gold:T.red,borderRadius:2,transition:"width 0.5s"}}/>
              </div>
            </div>)}
          </div>
        </Card>

        {/* AI Summary + Key Metrics */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card s={{background:T.accent}}>
            <div style={{fontSize:10,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>✦ {company} — AI Analysis</div>
            <div style={{fontSize:13,color:T.text,lineHeight:1.75,marginBottom:14}}>{info.summary}</div>
            {info.keyMetrics&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {[
                {l:"Revenue CAGR 5Y",v:info.keyMetrics.revenueGrowth5y,c:T.green},
                {l:"FCF Growth (CAGR)",v:info.keyMetrics.fcfGrowthDisplay,c:T.green},
                {l:"FCF Margin",v:info.keyMetrics.fcfMarginDisplay,c:T.blue},
                {l:"ROIC",v:info.keyMetrics.roicDisplay,c:T.gold},
                {l:"Debt/Equity",v:info.keyMetrics.debtEquity,c:T.muted},
                {l:"EPS Growth",v:info.keyMetrics.epsGrowth,c:T.green},
              ].map(({l,v,c})=><div key={l} style={{background:T.card,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{l}</div>
                <Mn sz={14} c={c} s={{fontWeight:600}}>{v||"—"}</Mn>
              </div>)}
            </div>}
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(info.catalysts||[]).map((c,i)=><span key={i} style={{fontSize:11,padding:"4px 10px",borderRadius:20,background:`${T.green}15`,color:T.green,border:`1px solid ${T.green}33`}}>✓ {c}</span>)}
            </div>
          </Card>

          {/* Analyst Consensus */}
          {info.analystConsensus&&<Card s={{background:`${T.blue}08`,border:`1px solid ${T.blue}33`}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.blue,marginBottom:14}}>
              📡 Wall Street Analyst Consensus
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
              {[
                {l:"Consensus Rating",v:info.analystConsensus.rating,c:ratingColor(info.analystConsensus.rating)},
                {l:"Price Target",v:info.analystConsensus.priceTarget,c:T.gold},
                {l:"Upside / Downside",v:info.analystConsensus.upsideDownside,c:(info.analystConsensus.upsideDownside||"").startsWith("+")?T.green:T.red},
                {l:"# of Analysts",v:info.analystConsensus.numAnalysts,c:T.muted},
                {l:"Revenue Forecast (next yr)",v:info.analystConsensus.revenueNextYear,c:T.green},
                {l:"EPS Forecast (next yr)",v:info.analystConsensus.epsNextYear,c:T.green},
              ].map(({l,v,c})=><div key={l} style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{l}</div>
                <Mn sz={13} c={c} s={{fontWeight:600}}>{v||"—"}</Mn>
              </div>)}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:10,color:T.muted}}>Source: {info.analystConsensus.source||"Yahoo Finance / Wall Street consensus"}</div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {l:"Yahoo Finance",url:`https://finance.yahoo.com/quote/${company}`},
                  {l:"TradingView",url:`https://tradingview.com/symbols/${company}`},
                ].map(({l,url})=>(
                  <a key={l} href={url} target="_blank" rel="noopener noreferrer" className="ext-link">{l} ↗</a>
                ))}
              </div>
            </div>
          </Card>}
        </div>
      </div>
    </>}

    {/* Default score bar when no analysis yet */}
    {!info&&<div style={{display:"flex",alignItems:"center",gap:20,padding:"14px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12}}>
      <ScoreRing score={score} size={100}/>
      <div style={{flex:1}}>
        {catS.map(({cat,s})=><div key={cat} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}><span style={{color:T.muted}}>{cat}</span><Mn sz={11} c={s>=60?T.green:s>=40?T.gold:T.red}>{s}%</Mn></div>
          <div style={{height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${s}%`,background:s>=60?T.green:s>=40?T.gold:T.red,borderRadius:2,transition:"width 0.5s"}}/></div>
        </div>)}
      </div>
    </div>}

    {/* Metrics + Moat */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {Object.entries(CRITERIA).map(([cat,cs])=><Card key={cat}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold}}>
              {cat==="growth"?"📈 Growth":cat==="profitability"?"💎 Profitability":cat==="cashflow"?"💵 Cash Flow (Growth Rate)":"🏦 Balance Sheet"}
            </div>
            {locked&&<span style={{fontSize:9,color:T.muted,background:T.accent,padding:"2px 6px",borderRadius:4,border:`1px solid ${T.border}`}}>🔒 locked</span>}
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
              <div style={{display:"flex",gap:3,opacity:locked?0.45:1}}>
                {[1,2,3,4,5].map(v=><div key={v}
                  onClick={()=>!locked&&setMoat(p=>({...p,[k]:v}))}
                  style={{flex:1,height:5,borderRadius:3,cursor:locked?"not-allowed":"pointer",background:v<=moat[k]?T.gold:T.border,transition:"background 0.2s"}}/>)}
              </div>
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
function ReturnTab(){
  const [ticker,setTicker]=useState("");
  const [amount,setAmount]=useState(10000);
  const [inp,setInp]=useState({rg:18,me:2,mx:3,dv:1,pe:30,fg:12});
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const er=inp.rg+inp.me+inp.mx+inp.dv;
  const proj=Array.from({length:11},(_,i)=>({y:`Y${i}`,
    p:Math.round(amount*Math.pow(1+er/100,i)),
    b:Math.round(amount*Math.pow(1.08,i)),
  }));
  const RS=({l,k,min,max,u,c})=><div style={{marginBottom:13}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.muted}}>{l}</span><Mn sz={12} c={c||T.text}>{inp[k]>0?"+":""}{inp[k]}{u}</Mn></div>
    <input type="range" min={min} max={max} step={0.5} value={inp[k]} onChange={e=>s(k,parseFloat(e.target.value))}/>
  </div>;

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Explainer */}
    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:10}}>📐 Expected Return Framework</div>
      <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:16}}>
        This tool models the <strong style={{color:T.text}}>expected annual return</strong> of a stock using four value drivers — the same framework used by Terry Smith, Buffett, and most long-term investors:
        <br/><span style={{color:T.green}}>Revenue Growth</span> + <span style={{color:T.blue}}>Margin Expansion</span> + <span style={{color:T.gold}}>Multiple Expansion</span> + <span style={{color:T.muted}}>Dividends</span> = Total Annual Return.
        <br/>Enter a ticker for reference and your investment amount to project how your portfolio could grow.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <Lbl>Ticker (for reference)</Lbl>
          <input type="text" value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="NVDA, AAPL, MSFT..."/>
        </div>
        <div>
          <Lbl>Initial Investment</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={amount} min={100} step={100} onChange={e=>setAmount(parseFloat(e.target.value)||0)} style={{fontWeight:700}}/>
          </div>
        </div>
      </div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"310px 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:16}}>
            {ticker?`📈 ${ticker} — Return Breakdown`:"📈 Return Breakdown"}
          </div>
          <RS l="Revenue growth" k="rg" min={0} max={40} u="%" c={T.green}/>
          <RS l="Margin expansion" k="me" min={-5} max={10} u="%" c={T.blue}/>
          <RS l="Multiple expansion" k="mx" min={-10} max={15} u="%" c={T.gold}/>
          <RS l="Dividends" k="dv" min={0} max={6} u="%" c={T.muted}/>
          <div style={{background:T.accent,borderRadius:10,padding:16,marginTop:8,border:`1px solid ${T.border}`}}>
            <Lbl>Total Expected Return</Lbl>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:38,color:er>=18?T.green:T.gold,fontWeight:700}}>{er.toFixed(1)}%</span>
              <span style={{fontSize:12,color:T.muted}}>/year</span>
            </div>
            <div style={{fontSize:11,color:er>=18?T.green:T.red,marginTop:4}}>{er>=20?"✓ Premium threshold ≥20%":er>=18?"✓ Minimum threshold ≥18%":"✗ Below target"}</div>
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>📊 PEG & Valuation Check</div>
          <RS l="Current P/E" k="pe" min={5} max={80} u="x"/>
          <RS l="Earnings growth %" k="fg" min={5} max={40} u="%"/>
          <div style={{marginTop:8,padding:12,background:T.accent,borderRadius:8,border:`1px solid ${T.border}`}}>
            {[
              {l:"PEG Ratio",v:(inp.pe/inp.fg).toFixed(2),g:inp.pe/inp.fg<=1.5,u:"x"},
              {l:"Fair P/E (2×growth)",v:inp.fg*2,u:"x"},
              {l:"Potential Upside",v:(((inp.fg*2/inp.pe)-1)*100).toFixed(0),g:inp.fg*2>inp.pe,u:"%"},
            ].map(({l,v,g,u})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}22`}}>
              <span style={{fontSize:12,color:T.muted}}>{l}</span>
              <Mn sz={12} c={g===undefined?T.text:g?T.green:T.red}>{v}{u}</Mn>
            </div>)}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:4}}>
          📈 10-Year Projection{ticker?` — ${ticker}`:""}
        </div>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>
          Starting from <strong style={{color:T.gold}}>{fmtFull(amount)}</strong> — your portfolio (gold) vs. market at 8% (grey)
        </div>
        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={proj}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.muted} stopOpacity={0.2}/><stop offset="95%" stopColor={T.muted} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="y" tick={{fill:T.muted,fontSize:10}}/>
              <YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>fmtFull(v)} width={82}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[fmtFull(v),n==="p"?`${ticker||"Compounder"} (${er.toFixed(0)}%/yr)`:"Market (8%/yr)"]}/>
              <Area type="monotone" dataKey="b" stroke={T.muted} fill="url(#gB)" strokeWidth={1.5} strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="p" stroke={T.gold} fill="url(#gP)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
          {[3,5,10].map(y=>{
            const pv=amount*Math.pow(1+er/100,y),bv=amount*Math.pow(1.08,y);
            return<div key={y} style={{background:T.accent,borderRadius:10,padding:14,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>Year {y}</div>
              <Mn sz={18} c={T.gold} s={{display:"block",marginBottom:3}}>{fmtFull(pv)}</Mn>
              <div style={{fontSize:10,color:T.green}}>+{fmtFull(pv-bv)} vs market</div>
            </div>;
          })}
        </div>
      </Card>
    </div>
  </div>;
}

// ── DCF ───────────────────────────────────────────────────────────────────────
function DCFTab(){
  const [ticker,setTicker]=useState("");
  const [d,setD]=useState({rev:1000,rg:20,mt:25,fc:0.85,tg:2.5,w:10,sh:100,ca:200,de:300,yr:10});
  const s=(k,v)=>setD(p=>({...p,[k]:parseFloat(v)||0}));
  const flows=Array.from({length:d.yr},(_,i)=>{
    const r=d.rev*Math.pow(1+d.rg/100,i+1),f=r*(d.mt/100)*d.fc,pv=f/Math.pow(1+d.w/100,i+1);
    return{y:`Y${i+1}`,f:Math.round(f),pv:Math.round(pv)};
  });
  const tF=flows[d.yr-1].f,tV=(tF*(1+d.tg/100))/((d.w-d.tg)/100),tPV=tV/Math.pow(1+d.w/100,d.yr);
  const sumPV=flows.reduce((a,f)=>a+f.pv,0),ev=sumPV+tPV,eq=ev+d.ca-d.de,ips=eq/d.sh;

  const F=({l,k,u,min,max,st=1})=><div style={{marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><Lbl s={{marginBottom:0}}>{l}</Lbl><Mn sz={11} c={T.gold}>{d[k]}{u}</Mn></div>
    <input type="range" min={min} max={max} step={st} value={d[k]} onChange={e=>s(k,e.target.value)}/>
  </div>;

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Explainer */}
    <Card s={{background:`linear-gradient(135deg,${T.card},${T.accent})`}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,marginBottom:10}}>📊 Discounted Cash Flow (DCF) Model</div>
      <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:14}}>
        A DCF estimates the <strong style={{color:T.text}}>intrinsic value per share</strong> by projecting future Free Cash Flows and discounting them to today's dollars. 
        The idea: a dollar of FCF in the future is worth less than a dollar today — we discount at the WACC rate. 
        The <strong style={{color:T.gold}}>Terminal Value</strong> captures all cash flows beyond the forecast period.
        Use this to check if a stock is overvalued or undervalued relative to your assumptions.
      </div>
      <div style={{maxWidth:300}}>
        <Lbl>Company Ticker (for reference)</Lbl>
        <input type="text" value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="NVDA, AAPL, DUOL..."/>
      </div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:18}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>
            ⚙️ Assumptions{ticker?` — ${ticker}`:""}
          </div>
          <F l="Base Revenue (M$)" k="rev" u="M" min={10} max={10000} st={10}/>
          <F l="Revenue Growth Rate" k="rg" u="%" min={0} max={50}/>
          <F l="FCF Margin" k="mt" u="%" min={5} max={50}/>
          <F l="FCF Conversion" k="fc" u="x" min={0.5} max={1} st={0.05}/>
          <F l="Terminal Growth Rate" k="tg" u="%" min={1} max={4} st={0.5}/>
          <F l="WACC (Discount Rate)" k="w" u="%" min={6} max={15} st={0.5}/>
          <F l="Projection Years" k="yr" u="" min={5} max={15}/>
        </Card>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>🏦 Balance Sheet Bridge</div>
          <F l="Cash & Equivalents (M$)" k="ca" u="M" min={0} max={5000} st={10}/>
          <F l="Total Debt (M$)" k="de" u="M" min={0} max={5000} st={10}/>
          <F l="Shares Outstanding (M)" k="sh" u="M" min={1} max={1000}/>
          <div style={{marginTop:10,padding:10,background:T.accent,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
            Equity Value = Enterprise Value + Cash − Debt<br/>
            Intrinsic Value/Share = Equity Value ÷ Shares
          </div>
        </Card>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {l:"Sum of Discounted FCFs",v:`$${fmtFull(sumPV*1e6).replace("$","")}`  ,c:T.blue,sub:"PV of projected flows"},
            {l:"Terminal Value (PV)",v:`$${fmtFull(tPV*1e6).replace("$","")}`,c:T.gold,sub:`${((tPV/(sumPV+tPV))*100).toFixed(0)}% of total value`},
            {l:"Intrinsic Value / Share",v:`$${ips.toFixed(2)}`,c:T.green,sub:ticker?`vs current ${ticker} price`:"per share"},
          ].map(({l,v,c,sub})=><Card key={l} s={{padding:14,textAlign:"center"}}>
            <Lbl s={{textAlign:"center"}}>{l}</Lbl>
            <Mn sz={20} c={c}>{v}</Mn>
            <div style={{fontSize:10,color:T.muted,marginTop:4}}>{sub}</div>
          </Card>)}
        </div>

        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>
            FCF Projections{ticker?` — ${ticker}`:""}
          </div>
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
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[`$${v}M`,n==="f"?"Nominal FCF":"Discounted FCF (PV)"]}/>
                <Area type="monotone" dataKey="f" stroke={T.green} fill="url(#gF)" strokeWidth={2} name="f"/>
                <Area type="monotone" dataKey="pv" stroke={T.gold} fill="url(#gV)" strokeWidth={2} strokeDasharray="4 4" name="pv"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex",gap:16,marginTop:8,justifyContent:"center"}}>
            {[{c:T.green,l:"Nominal FCF"},{c:T.gold,l:"Discounted FCF (PV)"}].map(({c,l})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:9,height:9,borderRadius:2,background:c}}/><span style={{fontSize:10,color:T.muted}}>{l}</span></div>
            ))}
          </div>
        </Card>

        <Card s={{padding:14}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,lineHeight:2.2}}>
            <span style={{color:T.gold}}>Enterprise Value</span> = <span style={{color:T.blue}}>${Math.round(sumPV)}M</span> (flows) + <span style={{color:T.gold}}>${Math.round(tPV)}M</span> (terminal) = <span style={{color:T.text,fontWeight:700}}>${Math.round(ev)}M</span>
            {"   ·   "}
            <span style={{color:T.gold}}>Equity Value</span> = ${Math.round(eq)}M
            {"   ·   "}
            <span style={{color:T.green,fontWeight:700}}>Intrinsic Value = ${ips.toFixed(2)}/share</span>
          </div>
        </Card>
      </div>
    </div>
  </div>;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS=[
  {id:"compound",l:"💰 Compound Calculator"},
  {id:"whatif",l:"🚀 What If?"},
  {id:"score",l:"🔍 AI Scorecard"},
  {id:"ret",l:"📐 Expected Return"},
  {id:"dcf",l:"📊 DCF Model"},
];

export default function App(){
  const [tab,setTab]=useState(null);
  const [m,setM]=useState(defM());
  const [moat,setMoat]=useState(defMoat());
  const [company,setCompany]=useState("");
  const [sector,setSector]=useState("Technology");

  const handleStart=(targetTab="compound",ticker="")=>{
    setTab(targetTab||"compound");
    if(ticker)setCompany(ticker);
  };

  return<div style={{minHeight:"100vh",background:T.bg}}>
    <style>{css}</style>
    {/* Navbar */}
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 28px",position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1380,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 0"}}>
          <div onClick={()=>setTab(null)} style={{cursor:"pointer"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,color:T.gold,letterSpacing:"0.02em"}}>Compounder Analyst</div>
            <div style={{fontSize:9,color:T.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:1}}>Buffett · Munger · High-Growth Framework</div>
          </div>
          {/* External resource links instead of score/CAGR */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {[
              {l:"📰 Fiscal.ai",url:"https://fiscal.ai"},
              {l:"📊 TradingView",url:"https://tradingview.com"},
              {l:"📈 Yahoo Finance",url:"https://finance.yahoo.com"},
              {l:"🏦 Macrotrends",url:"https://macrotrends.net"},
            ].map(({l,url})=>(
              <a key={l} href={url} target="_blank" rel="noopener noreferrer" className="ext-link">{l} ↗</a>
            ))}
          </div>
        </div>
        {tab&&<div style={{display:"flex",gap:0,marginTop:6,borderTop:`1px solid ${T.border}22`,paddingTop:2}}>
          {TABS.map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)}
            style={{color:tab===t.id?T.gold:T.muted,borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:8,fontSize:11}}>
            {t.l}
          </button>)}
        </div>}
      </div>
    </div>

    {!tab&&<Hero onStart={handleStart}/>}
    {tab&&<div style={{maxWidth:1380,margin:"0 auto",padding:"24px 28px"}}>
      {tab==="compound"&&<CompoundTab/>}
      {tab==="whatif"&&<WhatIfTab/>}
      {tab==="score"&&<ScoreTab m={m} setM={setM} moat={moat} setMoat={setMoat} company={company} setCompany={setCompany} sector={sector} setSector={setSector}/>}
      {tab==="ret"&&<ReturnTab/>}
      {tab==="dcf"&&<DCFTab/>}
    </div>}
    <div style={{borderTop:`1px solid ${T.border}`,padding:"14px 28px",maxWidth:1380,margin:"0 auto"}}>
      <div style={{fontSize:9,color:T.muted,textAlign:"center"}}>
        <span style={{color:T.goldDim}}>Compounder Analyst</span> · Inspired by Buffett · Munger · Educational only — not financial advice.
      </div>
    </div>
  </div>;
}
