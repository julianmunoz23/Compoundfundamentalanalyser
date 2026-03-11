import { useState, useCallback } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

const T = {
  bg:"#0a0c10",surface:"#10141c",card:"#141820",border:"#1e2534",
  gold:"#c9a84c",goldLight:"#e8c97a",goldDim:"#7a6330",
  green:"#2ecc71",red:"#e74c3c",blue:"#4a9eff",purple:"#a855f7",
  text:"#e8eaf0",muted:"#6b7694",accent:"#1a2235",
};

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${T.goldDim};border-radius:2px;}
  input[type=range]{-webkit-appearance:none;width:100%;height:3px;background:${T.border};border-radius:2px;outline:none;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:${T.gold};border-radius:50%;cursor:pointer;}
  input[type=number],input[type=text],select{background:${T.accent};border:1px solid ${T.border};color:${T.text};border-radius:6px;padding:8px 12px;font-family:'DM Mono',monospace;font-size:13px;width:100%;outline:none;transition:border-color 0.2s;}
  input:focus,select:focus{border-color:${T.goldDim};}
  select option{background:${T.surface};}
  .tbtn{background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:0.08em;font-weight:500;padding:8px 18px;text-transform:uppercase;color:${T.muted};transition:color 0.2s;}
  .tbtn:hover{color:${T.goldLight};}
  .btn{cursor:pointer;border:none;font-family:'DM Sans',sans-serif;font-weight:600;border-radius:8px;transition:all 0.2s;font-size:13px;}
  .btn-gold{background:${T.gold};color:#0a0c10;padding:10px 20px;}.btn-gold:hover{background:${T.goldLight};transform:translateY(-1px);}
  .btn-gold:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
  .seg{cursor:pointer;border:1px solid ${T.border};font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;transition:all 0.2s;background:${T.accent};color:${T.muted};}
  .seg-on{background:${T.gold}22!important;color:${T.gold}!important;border-color:${T.goldDim}!important;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  .fi{animation:fadeIn 0.3s ease both;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .sp{animation:spin 0.8s linear infinite;display:inline-block;}
  .trow:hover{background:${T.accent}!important;}
`;

const CRITERIA={
  growth:[
    {key:"revenueCAGR",label:"CAGR Ingresos",unit:"%",threshold:15,max:50,weight:15},
    {key:"fcfCAGR",label:"CAGR FCF",unit:"%",threshold:15,max:50,weight:12},
    {key:"tamGrowth",label:"Crecimiento TAM",unit:"%",threshold:10,max:30,weight:8},
  ],
  profitability:[
    {key:"roic",label:"ROIC",unit:"%",threshold:20,max:60,weight:18},
    {key:"grossMargin",label:"Margen Bruto",unit:"%",threshold:40,max:90,weight:10},
    {key:"opMargin",label:"Margen Operativo",unit:"%",threshold:18,max:50,weight:10},
  ],
  cashflow:[{key:"fcfEbitda",label:"FCF/EBITDA",unit:"%",threshold:40,max:100,weight:12}],
  balance:[
    {key:"debtEbitda",label:"Deuda/EBITDA",unit:"x",threshold:2,max:5,invert:true,weight:8},
    {key:"interestCover",label:"Cobertura Intereses",unit:"x",threshold:6,max:20,weight:7},
  ],
};
const MOAT_KEYS=["Economías de Escala","Switching Costs","Efectos de Red","Marca Dominante","Tecnología Propietaria","Liderazgo de Mercado"];
const SECTORS=["Tecnología","Salud","Consumo","Finanzas","Industria","Energía","Otro"];
const defM=()=>({revenueCAGR:20,fcfCAGR:18,tamGrowth:12,roic:25,grossMargin:55,opMargin:22,fcfEbitda:50,debtEbitda:1.2,interestCover:10});
const defMoat=()=>Object.fromEntries(MOAT_KEYS.map(k=>[k,3]));

function sm(c,v){
  if(c.invert){if(v<=c.threshold)return 100;if(v>=c.max)return 0;return Math.round((1-(v-c.threshold)/(c.max-c.threshold))*100);}
  if(v>=c.threshold*1.5)return 100;
  if(v>=c.threshold)return Math.round(60+((v-c.threshold)/(c.threshold*0.5))*40);
  return Math.round((v/c.threshold)*60);
}
function calcScore(m,moat){
  let tw=0,ts=0;
  Object.values(CRITERIA).flat().forEach(c=>{const s=sm(c,m[c.key]);ts+=s*c.weight;tw+=c.weight;});
  ts+=Object.values(moat).reduce((a,v)=>a+v,0)/(MOAT_KEYS.length*5)*100*20;tw+=20;
  return Math.round(ts/tw);
}
function grade(s){
  if(s>=85)return{l:"A+",c:T.green};if(s>=75)return{l:"A",c:T.green};
  if(s>=65)return{l:"B+",c:T.gold};if(s>=55)return{l:"B",c:T.gold};
  if(s>=45)return{l:"C",c:"#f39c12"};return{l:"D",c:T.red};
}

const Card=({children,s})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,...s}}>{children}</div>;
const Lbl=({children,s})=><div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,fontWeight:500,marginBottom:5,...s}}>{children}</div>;
const Mn=({children,sz=14,c=T.text,s})=><span style={{fontFamily:"'DM Mono',monospace",fontSize:sz,color:c,...s}}>{children}</span>;

function fmt(n){
  if(Math.abs(n)>=1e9)return`$${(n/1e9).toFixed(2)}B`;
  if(Math.abs(n)>=1e6)return`$${(n/1e6).toFixed(2)}M`;
  if(Math.abs(n)>=1e3)return`$${(n/1e3).toFixed(1)}K`;
  return`$${n.toFixed(0)}`;
}

function Gauge({score}){
  const g=grade(score);
  const arc=v=>{const a=-135+(v/100)*270,r=60,cx=70,cy=70,rd=x=>x*Math.PI/180;return`M ${cx+r*Math.cos(rd(-135))} ${cy+r*Math.sin(rd(-135))} A ${r} ${r} 0 ${a>45?1:0} 1 ${cx+r*Math.cos(rd(a))} ${cy+r*Math.sin(rd(a))}`;};
  return<svg width={140} height={105} viewBox="0 0 140 105">
    <path d={arc(100)} fill="none" stroke={T.border} strokeWidth={7} strokeLinecap="round"/>
    <path d={arc(score)} fill="none" stroke={g.c} strokeWidth={7} strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${g.c}99)`}}/>
    <text x={70} y={66} textAnchor="middle" fill={g.c} style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700}}>{g.l}</text>
    <text x={70} y={82} textAnchor="middle" fill={T.muted} style={{fontFamily:"'DM Mono',monospace",fontSize:12}}>{score}/100</text>
  </svg>;
}

function MRow({c,value,onChange}){
  const s=sm(c,value),pass=c.invert?value<=c.threshold:value>=c.threshold;
  return<div style={{display:"grid",gridTemplateColumns:"1fr 85px 50px 28px",alignItems:"center",gap:8,padding:"8px 0",borderBottom:`1px solid ${T.border}22`}}>
    <div><div style={{fontSize:12,color:T.text,marginBottom:3}}>{c.label}</div><input type="range" min={0} max={c.max} step={0.1} value={value} onChange={e=>onChange(c.key,parseFloat(e.target.value))}/></div>
    <div style={{display:"flex",alignItems:"center",gap:3}}><input type="number" value={value} min={0} max={c.max} step={0.1} onChange={e=>onChange(c.key,parseFloat(e.target.value)||0)} style={{width:60,textAlign:"right"}}/><span style={{fontSize:10,color:T.muted}}>{c.unit}</span></div>
    <div style={{textAlign:"center",fontSize:11,color:s>=60?T.green:s>=40?T.gold:T.red}}>{s}%</div>
    <div style={{fontSize:14,textAlign:"center",color:pass?T.green:T.red}}>{pass?"✓":"✗"}</div>
  </div>;
}

// ── COMPOUND CALCULATOR ───────────────────────────────────────────────────────
function CompoundTab(){
  const [cfg,setCfg]=useState({initial:10000,rate:12,rateType:"annual",contrib:500,contribFreq:"monthly",years:20});
  const [showTable,setShowTable]=useState(true);
  const set=(k,v)=>setCfg(p=>({...p,[k]:v}));

  const annualRate = cfg.rateType==="monthly" ? Math.pow(1+cfg.rate/100,12)-1 : cfg.rate/100;
  const annualContrib = cfg.contribFreq==="monthly" ? cfg.contrib*12 : cfg.contrib;

  const data = useCallback(()=>{
    let balance=cfg.initial, totalContrib=cfg.initial, totalInterestAcc=0;
    return Array.from({length:cfg.years},(_,i)=>{
      const interestThisYear = balance*annualRate + annualContrib*(annualRate/2);
      balance = balance*(1+annualRate)+annualContrib;
      totalContrib += annualContrib;
      totalInterestAcc += interestThisYear;
      return{
        year:i+1, label:`Año ${i+1}`,
        capital:Math.round(cfg.initial + annualContrib*(i+1)),
        aportesAcum:Math.round(totalContrib),
        interesAcum:Math.round(totalInterestAcc),
        interesAnual:Math.round(interestThisYear),
        balance:Math.round(balance),
        mult:+(balance/cfg.initial).toFixed(2),
      };
    });
  },[cfg,annualRate,annualContrib])();

  const last=data[data.length-1]||{};
  const annualPct=(annualRate*100);

  const TT=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    return<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14,minWidth:210}}>
      <div style={{fontSize:12,color:T.gold,marginBottom:8,fontFamily:"'Playfair Display',serif"}}>{label}</div>
      {payload.map(p=><div key={p.dataKey} style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:11,marginBottom:4}}>
        <span style={{color:T.muted}}>{p.dataKey==="balance"?"💰 Balance":p.dataKey==="aportesAcum"?"💵 Capital aportado":"✨ Interés acumulado"}</span>
        <Mn sz={11} c={p.dataKey==="balance"?T.gold:p.dataKey==="aportesAcum"?T.blue:T.green}>{fmt(p.value)}</Mn>
      </div>)}
    </div>;
  };

  return<div className="fi" style={{display:"flex",flexDirection:"column",gap:18}}>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
      {[
        {l:"Balance Final",v:fmt(last.balance||0),c:T.gold,sub:`en ${cfg.years} años`,icon:"🏆"},
        {l:"Capital Aportado",v:fmt(last.aportesAcum||0),c:T.blue,sub:"tu dinero invertido",icon:"💵"},
        {l:"Interés Generado",v:fmt(last.interesAcum||0),c:T.green,sub:`${last.balance?((last.interesAcum/last.balance)*100).toFixed(0):0}% del total`,icon:"✨"},
        {l:"Multiplicador",v:`${last.mult||1}x`,c:T.purple,sub:`TEA: ${annualPct.toFixed(2)}%`,icon:"🚀"},
      ].map(({l,v,c,sub,icon})=><Card key={l} s={{padding:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,fontSize:22,opacity:0.12}}>{icon}</div>
        <Lbl>{l}</Lbl>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:c,fontWeight:700,marginBottom:3}}>{v}</div>
        <div style={{fontSize:10,color:T.muted}}>{sub}</div>
      </Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:18}}>

      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold,marginBottom:18}}>⚙️ Parámetros</div>

          <Lbl>Portafolio inicial</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={cfg.initial} min={0} max={10000000} step={100} onChange={e=>set("initial",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/>
          </div>
          <input type="range" min={0} max={500000} step={500} value={cfg.initial} onChange={e=>set("initial",parseFloat(e.target.value))} style={{marginBottom:16}}/>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Tasa esperada</Lbl>
            <div style={{display:"flex",gap:4}}>
              {["annual","monthly"].map(t=><button key={t} className={`seg ${cfg.rateType===t?"seg-on":""}`} onClick={()=>set("rateType",t)}>{t==="annual"?"Anual":"Mensual"}</button>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <input type="number" value={cfg.rate} min={0.01} max={cfg.rateType==="monthly"?5:100} step={0.1} onChange={e=>set("rate",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/>
            <span style={{color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>% /{cfg.rateType==="annual"?"año":"mes"}</span>
          </div>
          <input type="range" min={0.1} max={cfg.rateType==="monthly"?5:100} step={0.1} value={cfg.rate} onChange={e=>set("rate",parseFloat(e.target.value))} style={{marginBottom:4}}/>
          {cfg.rateType==="monthly"&&<div style={{fontSize:10,color:T.green,marginBottom:12}}>≡ {((Math.pow(1+cfg.rate/100,12)-1)*100).toFixed(2)}% efectiva anual</div>}
          <div style={{marginBottom:16}}/>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Lbl s={{marginBottom:0}}>Aportes periódicos</Lbl>
            <div style={{display:"flex",gap:4}}>
              {["monthly","annual"].map(t=><button key={t} className={`seg ${cfg.contribFreq===t?"seg-on":""}`} onClick={()=>set("contribFreq",t)}>{t==="monthly"?"Mensuales":"Anuales"}</button>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{color:T.muted,fontFamily:"monospace",fontSize:14}}>$</span>
            <input type="number" value={cfg.contrib} min={0} max={100000} step={50} onChange={e=>set("contrib",parseFloat(e.target.value)||0)} style={{fontWeight:700,fontSize:14}}/>
            <span style={{color:T.muted,fontSize:11}}>/{cfg.contribFreq==="monthly"?"mes":"año"}</span>
          </div>
          <input type="range" min={0} max={20000} step={50} value={cfg.contrib} onChange={e=>set("contrib",parseFloat(e.target.value))} style={{marginBottom:16}}/>

          <Lbl>Años de capitalización</Lbl>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,color:T.muted}}>Horizonte</span>
            <Mn sz={13} c={T.gold}>{cfg.years} años</Mn>
          </div>
          <input type="range" min={1} max={50} step={1} value={cfg.years} onChange={e=>set("years",parseInt(e.target.value))}/>
        </Card>

        <Card s={{background:`${T.gold}08`,border:`1px solid ${T.goldDim}44`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.gold,marginBottom:12}}>✨ La Magia del Compounding</div>
          {[
            {l:"Sin aportes adicionales",v:fmt(cfg.initial*Math.pow(1+annualRate,cfg.years))},
            {l:"Solo aportes (sin interés)",v:fmt(last.aportesAcum||0)},
            {l:"Con interés compuesto 🏆",v:fmt(last.balance||0),hi:true},
            {l:"Ganancia del interés",v:`+${fmt(last.interesAcum||0)}`,pos:true},
          ].map(({l,v,hi,pos})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}22`,alignItems:"center"}}>
            <span style={{fontSize:11,color:hi?T.text:T.muted}}>{l}</span>
            <Mn sz={hi?14:11} c={pos?T.green:hi?T.gold:T.muted} s={hi?{fontWeight:700}:{}}>{v}</Mn>
          </div>)}
          <div style={{marginTop:10,fontSize:11,color:T.muted,lineHeight:1.6}}>
            📐 <span style={{color:T.goldDim}}>Regla del 72:</span> tu dinero se duplica cada <span style={{color:T.gold}}>{(72/annualPct).toFixed(1)} años</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>📈 Crecimiento del Portafolio</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:14}}>La zona dorada es el interés reinvertido — la magia del compounding</div>
          <div style={{height:240}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{top:5,right:5,left:10,bottom:0}}>
                <defs>
                  <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.45}/><stop offset="95%" stopColor={T.gold} stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={0.4}/><stop offset="95%" stopColor={T.blue} stopOpacity={0.02}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.floor(cfg.years/5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmt(v)} width={72}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="aportesAcum" stroke={T.blue} fill="url(#gC)" strokeWidth={1.5}/>
                <Area type="monotone" dataKey="balance" stroke={T.gold} fill="url(#gI)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex",gap:18,marginTop:8,justifyContent:"center"}}>
            {[{c:T.gold,l:"Balance total"},{c:T.blue,l:"Capital aportado"},{c:T.green,l:"Interés (diferencia)"}].map(({c,l})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:9,height:9,borderRadius:2,background:c}}/><span style={{fontSize:10,color:T.muted}}>{l}</span></div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:3}}>📊 Interés Generado por Año</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:12}}>El efecto bola de nieve — cada año los rendimientos son mayores</div>
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{top:5,right:5,left:10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="label" tick={{fill:T.muted,fontSize:9}} interval={Math.floor(cfg.years/5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}} tickFormatter={v=>fmt(v)} width={72}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={v=>[fmt(v),"Interés anual"]}/>
                <Bar dataKey="interesAnual" fill={T.green} opacity={0.85} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>

    {/* DETAIL TABLE */}
    <Card s={{padding:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:T.gold}}>📋 Detalle Año a Año</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>Capital inicial · Aportes acumulados · Interés generado · Balance final</div>
        </div>
        <button className="seg" onClick={()=>setShowTable(v=>!v)} style={{fontSize:11}}>
          {showTable?"Ocultar tabla":"Mostrar tabla"}
        </button>
      </div>

      {showTable&&<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`,background:T.accent}}>
              {["Año","Capital Inicial","Aportes del Año","Interés del Año","Interés Acum.","Balance Final","Multiplicador"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"right",fontSize:9,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,whiteSpace:"nowrap",
                  ...(h==="Año"?{textAlign:"center"}:{})}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r,i)=>{
              const highlight=r.year%5===0||r.year===cfg.years;
              return<tr key={r.year} className="trow" style={{borderBottom:`1px solid ${T.border}22`,background:highlight?`${T.gold}08`:"transparent",transition:"background 0.15s"}}>
                <td style={{padding:"9px 14px",textAlign:"center"}}>
                  <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",
                    background:highlight?`${T.gold}33`:T.accent,border:`1px solid ${highlight?T.goldDim:T.border}`}}>
                    <Mn sz={11} c={highlight?T.gold:T.muted}>{r.year}</Mn>
                  </div>
                </td>
                <td style={{padding:"9px 14px",textAlign:"right"}}><Mn sz={12} c={T.muted}>{fmt(cfg.initial)}</Mn></td>
                <td style={{padding:"9px 14px",textAlign:"right"}}><Mn sz={12} c={T.blue}>{fmt(annualContrib)}</Mn></td>
                <td style={{padding:"9px 14px",textAlign:"right"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                    <Mn sz={12} c={T.green}>{fmt(r.interesAnual)}</Mn>
                    <div style={{width:Math.min((r.interesAnual/last.interesAnual)*60,60),height:2,background:T.green,borderRadius:2,opacity:0.5}}/>
                  </div>
                </td>
                <td style={{padding:"9px 14px",textAlign:"right"}}><Mn sz={12} c={`${T.green}cc`}>{fmt(r.interesAcum)}</Mn></td>
                <td style={{padding:"9px 14px",textAlign:"right"}}>
                  <Mn sz={highlight?14:12} c={highlight?T.gold:T.text} s={highlight?{fontWeight:700}:{}}>{fmt(r.balance)}</Mn>
                </td>
                <td style={{padding:"9px 14px",textAlign:"right"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,
                    background:r.mult>=5?`${T.gold}22`:r.mult>=2?`${T.green}15`:`${T.blue}15`,
                    color:r.mult>=5?T.gold:r.mult>=2?T.green:T.blue,
                    border:`1px solid ${r.mult>=5?T.goldDim:r.mult>=2?T.green+"44":T.blue+"44"}`}}>
                    ×{r.mult}
                  </span>
                </td>
              </tr>;
            })}
          </tbody>
          <tfoot>
            <tr style={{borderTop:`2px solid ${T.border}`,background:T.accent}}>
              <td style={{padding:"12px 14px",textAlign:"center"}}><Mn sz={11} c={T.gold}>TOTAL</Mn></td>
              <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={12} c={T.muted}>{fmt(cfg.initial)}</Mn></td>
              <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={12} c={T.blue}>{fmt(annualContrib*cfg.years)}</Mn></td>
              <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={12} c={T.green}>—</Mn></td>
              <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={13} c={T.green} s={{fontWeight:700}}>{fmt(last.interesAcum||0)}</Mn></td>
              <td style={{padding:"12px 14px",textAlign:"right"}}><Mn sz={14} c={T.gold} s={{fontWeight:700}}>{fmt(last.balance||0)}</Mn></td>
              <td style={{padding:"12px 14px",textAlign:"right"}}>
                <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:`${T.gold}22`,color:T.gold,border:`1px solid ${T.goldDim}`,fontWeight:700}}>×{last.mult}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>}
    </Card>

    {/* Insight */}
    <Card s={{background:`${T.gold}07`,border:`1px solid ${T.goldDim}44`,padding:18}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <div style={{fontSize:28,flexShrink:0}}>💡</div>
        <div style={{fontSize:12,color:T.muted,lineHeight:1.8}}>
          Con <Mn sz={12} c={T.gold}>{fmt(cfg.initial)}</Mn> iniciales y aportes de <Mn sz={12} c={T.blue}>{cfg.contribFreq==="monthly"?`${fmt(cfg.contrib)}/mes`:`${fmt(cfg.contrib)}/año`}</Mn> al <Mn sz={12} c={T.green}>{annualPct.toFixed(2)}% anual</Mn>,
          en <Mn sz={12} c={T.text}>{cfg.years} años</Mn> habrás puesto <Mn sz={12} c={T.blue}>{fmt(last.aportesAcum||0)}</Mn> de tu bolsillo y el interés compuesto habrá añadido <Mn sz={12} c={T.green}>{fmt(last.interesAcum||0)}</Mn> adicionales —
          el <Mn sz={12} c={T.gold}>{last.balance?((last.interesAcum/last.balance)*100).toFixed(0):0}%</Mn> de tu riqueza final lo generó el dinero trabajando por ti, no tú.
        </div>
      </div>
    </Card>
  </div>;
}

// ── SCORECARD TAB ─────────────────────────────────────────────────────────────
function ScoreTab({m,setM,moat,setMoat,company,setCompany,sector,setSector}){
  const [loading,setLoading]=useState(false);
  const [info,setInfo]=useState(null);
  const [err,setErr]=useState("");
  const score=calcScore(m,moat);
  const catS=Object.entries(CRITERIA).map(([cat,cs])=>({
    cat:cat==="growth"?"Crecimiento":cat==="profitability"?"Rentabilidad":cat==="cashflow"?"Flujo Caja":"Balance",
    s:Math.round(cs.reduce((a,c)=>a+sm(c,m[c.key]),0)/cs.length),
  }));
  const radarD=MOAT_KEYS.map(k=>({subject:k.split(" ")[0],value:moat[k],fullMark:5}));

  const analyze=async()=>{
    if(!company.trim()){setErr("Ingresa un ticker primero.");return;}
    setLoading(true);setErr("");setInfo(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:`Analiza la empresa o ticker "${company}" desde una perspectiva de inversión fundamental estilo Buffett/Munger. Responde SOLO con JSON válido, sin markdown, sin explicación:\n{"metrics":{"revenueCAGR":<número %>,"fcfCAGR":<número %>,"tamGrowth":<número %>,"roic":<número %>,"grossMargin":<número %>,"opMargin":<número %>,"fcfEbitda":<número %>,"debtEbitda":<número x>,"interestCover":<número x>},"moat":{"Economías de Escala":<1-5>,"Switching Costs":<1-5>,"Efectos de Red":<1-5>,"Marca Dominante":<1-5>,"Tecnología Propietaria":<1-5>,"Liderazgo de Mercado":<1-5>},"sector":"<Tecnología|Salud|Consumo|Finanzas|Industria|Energía|Otro>","summary":"<2 oraciones en español: tesis de inversión y riesgo principal>","catalysts":["<catalizador 1>","<catalizador 2>","<catalizador 3>"]}`}],
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
    }catch(e){
      setErr(`Error: ${e.message||"No se pudo analizar. Verifica el ticker."}`);
    }
    setLoading(false);
  };

  const checklist=[
    {l:"CAGR Ingresos ≥ 15%",p:m.revenueCAGR>=15},{l:"ROIC ≥ 20%",p:m.roic>=20},
    {l:"Margen Bruto ≥ 40%",p:m.grossMargin>=40},{l:"Margen Operativo ≥ 18%",p:m.opMargin>=18},
    {l:"FCF/EBITDA ≥ 40%",p:m.fcfEbitda>=40},{l:"Deuda/EBITDA ≤ 2x",p:m.debtEbitda<=2},
    {l:"Cobertura Intereses ≥ 6x",p:m.interestCover>=6},
    {l:"Moat promedio ≥ 3/5",p:Object.values(moat).reduce((a,v)=>a+v,0)/MOAT_KEYS.length>=3},
  ];

  return<div className="fi" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:14}}>🔍 Análisis con IA</div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"flex-end"}}>
          <div style={{flex:1}}><Lbl>Ticker / Empresa</Lbl>
            <input type="text" value={company} onChange={e=>setCompany(e.target.value.toUpperCase())}
              placeholder="NVDA, AAPL, META, SHOP..."
              onKeyDown={e=>e.key==="Enter"&&analyze()}
              style={{fontSize:15,fontWeight:700,letterSpacing:"0.05em"}}/>
          </div>
          <div style={{width:120}}><Lbl>Sector</Lbl>
            <select value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
          </div>
          <button className="btn btn-gold" onClick={analyze} disabled={loading}
            style={{height:40,padding:"0 16px",flexShrink:0}}>
            {loading?<span className="sp">⟳</span>:"✦ Analizar IA"}
          </button>
        </div>

        {!info&&!loading&&!err&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.muted,borderTop:`1px solid ${T.border}33`}}>
          Escribe un ticker y pulsa <span style={{color:T.gold,fontWeight:600}}>✦ Analizar IA</span> — o ajusta los sliders manualmente
        </div>}
        {loading&&<div style={{textAlign:"center",padding:12,fontSize:12,color:T.gold,background:`${T.gold}08`,borderRadius:8}}>
          <span className="sp">⟳</span>  Analizando <strong>{company}</strong>...
        </div>}
        {err&&<div style={{padding:10,background:`${T.red}15`,borderRadius:8,fontSize:12,color:T.red,border:`1px solid ${T.red}33`}}>{err}</div>}
        {info&&<div style={{background:T.accent,borderRadius:10,padding:14,border:`1px solid ${T.goldDim}44`}}>
          <div style={{fontSize:10,color:T.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>✦ Análisis — {company}</div>
          <div style={{fontSize:13,color:T.text,lineHeight:1.7,marginBottom:10}}>{info.summary}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {(info.catalysts||[]).map((c,i)=><span key={i} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:`${T.green}15`,color:T.green,border:`1px solid ${T.green}33`}}>{c}</span>)}
          </div>
        </div>}

        <div style={{display:"flex",alignItems:"center",gap:20,padding:"14px 0",borderTop:`1px solid ${T.border}`,marginTop:12}}>
          <Gauge score={score}/>
          <div style={{flex:1}}>
            {catS.map(({cat,s})=><div key={cat} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                <span style={{color:T.muted}}>{cat}</span><Mn sz={11} c={s>=60?T.green:s>=40?T.gold:T.red}>{s}%</Mn>
              </div>
              <div style={{height:3,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${s}%`,background:s>=60?T.green:s>=40?T.gold:T.red,borderRadius:2,transition:"width 0.5s"}}/></div>
            </div>)}
          </div>
        </div>
      </Card>

      {Object.entries(CRITERIA).map(([cat,cs])=><Card key={cat}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>
          {cat==="growth"?"📈 Crecimiento":cat==="profitability"?"💎 Rentabilidad":cat==="cashflow"?"💵 Flujo de Caja":"🏦 Balance"}
        </div>
        {cs.map(c=><MRow key={c.key} c={c} value={m[c.key]} onChange={(k,v)=>setM(p=>({...p,[k]:v}))}/>)}
      </Card>)}
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:16}}>🏰 Moat Analysis</div>
        <div style={{height:210}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:10}}/><Radar dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15}/></RadarChart></ResponsiveContainer></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
          {MOAT_KEYS.map(k=><div key={k}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3,color:T.muted}}><span>{k}</span><Mn sz={10} c={T.gold}>{moat[k]}/5</Mn></div>
            <div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(v=><div key={v} onClick={()=>setMoat(p=>({...p,[k]:v}))} style={{flex:1,height:5,borderRadius:3,cursor:"pointer",background:v<=moat[k]?T.gold:T.border,transition:"background 0.2s"}}/>)}</div>
          </div>)}
        </div>
      </Card>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>📋 Checklist Buffett / Munger</div>
        {checklist.map(({l,p})=><div key={l} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}22`}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:p?`${T.green}22`:`${T.red}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:p?T.green:T.red,flexShrink:0}}>{p?"✓":"✗"}</div>
          <span style={{fontSize:12,color:p?T.text:T.muted}}>{l}</span>
        </div>)}
        <div style={{marginTop:12,padding:10,background:T.accent,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:T.muted}}>Criterios cumplidos</span>
          <Mn sz={18} c={T.gold}>{checklist.filter(c=>c.p).length}/8</Mn>
        </div>
      </Card>
    </div>
  </div>;
}

// ── RETURN TAB ────────────────────────────────────────────────────────────────
function ReturnTab(){
  const [inp,setInp]=useState({rg:18,me:2,mx:3,dv:1,pe:30,fg:12});
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const er=inp.rg+inp.me+inp.mx+inp.dv;
  const proj=Array.from({length:11},(_,i)=>({y:`A${i}`,p:parseFloat((100*Math.pow(1+er/100,i)).toFixed(1)),b:parseFloat((100*Math.pow(1.08,i)).toFixed(1))}));
  const RS=({l,k,min,max,u,c})=><div style={{marginBottom:13}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.muted}}>{l}</span><Mn sz={12} c={c||T.text}>{inp[k]>0?"+":""}{inp[k]}{u}</Mn></div>
    <input type="range" min={min} max={max} step={0.5} value={inp[k]} onChange={e=>s(k,parseFloat(e.target.value))}/>
  </div>;
  return<div className="fi" style={{display:"grid",gridTemplateColumns:"310px 1fr",gap:18}}>
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:16}}>📐 Expected Return</div>
        <RS l="Crecimiento ingresos" k="rg" min={0} max={40} u="%" c={T.green}/>
        <RS l="Expansión márgenes" k="me" min={-5} max={10} u="%" c={T.blue}/>
        <RS l="Expansión múltiplos" k="mx" min={-10} max={15} u="%" c={T.gold}/>
        <RS l="Dividendos" k="dv" min={0} max={6} u="%" c={T.muted}/>
        <div style={{background:T.accent,borderRadius:10,padding:16,marginTop:8,border:`1px solid ${T.border}`}}>
          <Lbl>Retorno Esperado Total</Lbl>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontFamily:"'Playfair Display',serif",fontSize:38,color:er>=18?T.green:T.gold,fontWeight:700}}>{er.toFixed(1)}%</span><span style={{fontSize:12,color:T.muted}}>/año</span></div>
          <div style={{fontSize:11,color:er>=18?T.green:T.red,marginTop:4}}>{er>=20?"✓ Umbral premium ≥20%":er>=18?"✓ Umbral mínimo ≥18%":"✗ Por debajo del objetivo"}</div>
        </div>
      </Card>
      <Card>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>📊 PEG & Valoración</div>
        <RS l="P/E actual" k="pe" min={5} max={80} u="x"/><RS l="Crecimiento futuro" k="fg" min={5} max={40} u="%"/>
        <div style={{marginTop:8,padding:12,background:T.accent,borderRadius:8,border:`1px solid ${T.border}`}}>
          {[{l:"PEG",v:(inp.pe/inp.fg).toFixed(2),g:inp.pe/inp.fg<=1.5,u:"x"},{l:"P/E justo",v:inp.fg*2,u:"x"},{l:"Upside",v:(((inp.fg*2/inp.pe)-1)*100).toFixed(0),g:inp.fg*2>inp.pe,u:"%"}].map(({l,v,g,u})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}22`}}><span style={{fontSize:12,color:T.muted}}>{l}</span><Mn sz={12} c={g===undefined?T.text:g?T.green:T.red}>{v}{u}</Mn></div>)}
        </div>
      </Card>
    </div>
    <Card>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:16}}>📈 Proyección 10 años — $100 invertidos</div>
      <div style={{height:270}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={proj}><defs><linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.muted} stopOpacity={0.2}/><stop offset="95%" stopColor={T.muted} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="y" tick={{fill:T.muted,fontSize:10}}/><YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>`$${v}`}/><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[`$${v}`,n==="p"?"Compounder":"Mercado 8%"]}/><Area type="monotone" dataKey="b" stroke={T.muted} fill="url(#gB)" strokeWidth={1.5} strokeDasharray="4 4"/><Area type="monotone" dataKey="p" stroke={T.gold} fill="url(#gP)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
        {[3,5,10].map(y=>{const pv=(100*Math.pow(1+er/100,y)).toFixed(0),bv=(100*Math.pow(1.08,y)).toFixed(0);return<div key={y} style={{background:T.accent,borderRadius:10,padding:14,border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>Año {y}</div><Mn sz={20} c={T.gold} s={{display:"block",marginBottom:3}}>${pv}</Mn><div style={{fontSize:10,color:T.green}}>+${Math.round(pv-bv)} vs mkt</div></div>;})}
      </div>
    </Card>
  </div>;
}

// ── DCF ───────────────────────────────────────────────────────────────────────
function DCFTab(){
  const [d,setD]=useState({rev:1000,rg:20,mt:25,fc:0.85,tg:2.5,w:10,sh:100,ca:200,de:300,yr:10});
  const s=(k,v)=>setD(p=>({...p,[k]:parseFloat(v)||0}));
  const flows=Array.from({length:d.yr},(_,i)=>{const r=d.rev*Math.pow(1+d.rg/100,i+1),f=r*(d.mt/100)*d.fc,pv=f/Math.pow(1+d.w/100,i+1);return{y:`A${i+1}`,f:Math.round(f),pv:Math.round(pv)};});
  const tF=flows[d.yr-1].f,tV=(tF*(1+d.tg/100))/((d.w-d.tg)/100),tPV=tV/Math.pow(1+d.w/100,d.yr),sumPV=flows.reduce((a,f)=>a+f.pv,0);
  const ev=sumPV+tPV,eq=ev+d.ca-d.de,ips=eq/d.sh;
  const F=({l,k,u,min,max,st=1})=><div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><Lbl s={{marginBottom:0}}>{l}</Lbl><Mn sz={11} c={T.gold}>{d[k]}{u}</Mn></div><input type="range" min={min} max={max} step={st} value={d[k]} onChange={e=>s(k,e.target.value)}/></div>;
  return<div className="fi" style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:18}}>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>⚙️ Parámetros</div>
        <F l="Ingresos base (M$)" k="rev" u="M" min={10} max={10000} st={10}/><F l="Crecimiento" k="rg" u="%" min={0} max={50}/><F l="Margen FCF" k="mt" u="%" min={5} max={50}/><F l="Conversión FCF" k="fc" u="x" min={0.5} max={1} st={0.05}/><F l="Tasa terminal" k="tg" u="%" min={1} max={4} st={0.5}/><F l="WACC" k="w" u="%" min={6} max={15} st={0.5}/><F l="Años" k="yr" u="" min={5} max={15}/>
      </Card>
      <Card><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>🏦 Balance</div>
        <F l="Caja (M$)" k="ca" u="M" min={0} max={5000} st={10}/><F l="Deuda (M$)" k="de" u="M" min={0} max={5000} st={10}/><F l="Acciones (M)" k="sh" u="M" min={1} max={1000}/>
      </Card>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[{l:"Suma PV flujos",v:`$${Math.round(sumPV)}M`,c:T.blue},{l:"Terminal PV",v:`$${Math.round(tPV)}M`,c:T.gold},{l:"Intrínseco/acción",v:`$${ips.toFixed(2)}`,c:T.green}].map(({l,v,c})=><Card key={l} s={{padding:14,textAlign:"center"}}><Lbl s={{textAlign:"center"}}>{l}</Lbl><Mn sz={20} c={c}>{v}</Mn></Card>)}
      </div>
      <Card><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.gold,marginBottom:12}}>Flujos Proyectados</div>
        <div style={{height:250}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={flows}><defs><linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient><linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="y" tick={{fill:T.muted,fontSize:10}}/><YAxis tick={{fill:T.muted,fontSize:10}} tickFormatter={v=>`$${v}M`}/><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8}} formatter={(v,n)=>[`$${v}M`,n==="f"?"FCF nominal":"FCF descontado"]}/><Area type="monotone" dataKey="f" stroke={T.green} fill="url(#gF)" strokeWidth={2}/><Area type="monotone" dataKey="pv" stroke={T.gold} fill="url(#gV)" strokeWidth={2} strokeDasharray="4 4"/></AreaChart></ResponsiveContainer></div>
      </Card>
    </div>
  </div>;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS=[
  {id:"compound",l:"💰 Interés Compuesto"},
  {id:"score",l:"Scorecard IA"},
  {id:"ret",l:"Retorno Esperado"},
  {id:"dcf",l:"DCF"},
];

export default function App(){
  const [tab,setTab]=useState("compound");
  const [m,setM]=useState(defM());
  const [moat,setMoat]=useState(defMoat());
  const [company,setCompany]=useState("");
  const [sector,setSector]=useState("Tecnología");
  const score=calcScore(m,moat);
  const g=grade(score);
  return<div style={{minHeight:"100vh",background:T.bg}}>
    <style>{css}</style>
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1380,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0 0"}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.gold,letterSpacing:"0.02em"}}>Compounder Analyst</div>
            <div style={{fontSize:9,color:T.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:1}}>Buffett · Munger · High-Growth Framework</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Objetivo CAGR</div><Mn sz={18} c={T.gold}>≥ 15%</Mn></div>
            <div style={{width:1,height:28,background:T.border}}/>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Score IA</div><Mn sz={18} c={g.c}>{score}/100</Mn></div>
          </div>
        </div>
        <div style={{display:"flex",gap:0,marginTop:8,borderTop:`1px solid ${T.border}22`,paddingTop:2}}>
          {TABS.map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)} style={{color:tab===t.id?T.gold:T.muted,borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:9}}>{t.l}</button>)}
        </div>
      </div>
    </div>
    <div style={{maxWidth:1380,margin:"0 auto",padding:"24px"}}>
      {tab==="compound"&&<CompoundTab/>}
      {tab==="score"&&<ScoreTab m={m} setM={setM} moat={moat} setMoat={setMoat} company={company} setCompany={setCompany} sector={sector} setSector={setSector}/>}
      {tab==="ret"&&<ReturnTab/>}
      {tab==="dcf"&&<DCFTab/>}
    </div>
    <div style={{borderTop:`1px solid ${T.border}`,padding:"12px 24px",maxWidth:1380,margin:"0 auto"}}>
      <div style={{fontSize:9,color:T.muted}}>Inspirado en <span style={{color:T.goldDim}}>Buffett · Munger</span> · Solo educativo — no constituye asesoramiento financiero.</div>
    </div>
  </div>;
}
