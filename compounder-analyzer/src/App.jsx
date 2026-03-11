import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

// ─── IMPORTANT: Add your Anthropic API key here ───────────────────────────────
// For production, use an environment variable: import.meta.env.VITE_ANTHROPIC_KEY
// Create a .env file with: VITE_ANTHROPIC_KEY=sk-ant-...
// NOTE: For a real production app, proxy API calls through a backend to protect your key.
const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || "";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a0c10", surface: "#10141c", card: "#141820", border: "#1e2534",
  gold: "#c9a84c", goldLight: "#e8c97a", goldDim: "#7a6330",
  green: "#2ecc71", red: "#e74c3c", blue: "#4a9eff",
  text: "#e8eaf0", muted: "#6b7694", accent: "#1a2235",
};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${T.surface}; }
  ::-webkit-scrollbar-thumb { background: ${T.goldDim}; border-radius: 2px; }
  input[type=range] { -webkit-appearance: none; width: 100%; height: 3px; background: ${T.border}; border-radius: 2px; outline: none; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: ${T.gold}; border-radius: 50%; cursor: pointer; }
  input[type=number], input[type=text], select {
    background: ${T.accent}; border: 1px solid ${T.border}; color: ${T.text};
    border-radius: 6px; padding: 8px 12px; font-family: 'DM Mono', monospace;
    font-size: 13px; width: 100%; outline: none; transition: border-color 0.2s;
  }
  input:focus, select:focus { border-color: ${T.goldDim}; }
  select option { background: ${T.surface}; }
  .tab-btn {
    background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 12px; letter-spacing: 0.08em; font-weight: 500; padding: 8px 18px;
    text-transform: uppercase; color: ${T.muted}; transition: color 0.2s;
  }
  .tab-btn:hover { color: ${T.goldLight}; }
  .btn { cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; font-weight: 600; border-radius: 8px; transition: all 0.2s; font-size: 13px; }
  .btn-gold { background: ${T.gold}; color: #0a0c10; padding: 10px 20px; }
  .btn-gold:hover { background: ${T.goldLight}; transform: translateY(-1px); }
  .btn-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .btn-outline { background: transparent; border: 1px solid ${T.border}; color: ${T.muted}; padding: 7px 14px; }
  .btn-outline:hover { border-color: ${T.goldDim}; color: ${T.gold}; }
  .btn-active { background: ${T.gold}22 !important; color: ${T.gold} !important; border-color: ${T.goldDim} !important; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease both; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; display: inline-block; }
`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CRITERIA = {
  growth: [
    { key: "revenueCAGR", label: "CAGR Ingresos", unit: "%", threshold: 15, max: 50, weight: 15 },
    { key: "fcfCAGR",     label: "CAGR FCF",       unit: "%", threshold: 15, max: 50, weight: 12 },
    { key: "tamGrowth",   label: "Crecimiento TAM", unit: "%", threshold: 10, max: 30, weight: 8  },
  ],
  profitability: [
    { key: "roic",        label: "ROIC",             unit: "%", threshold: 20, max: 60, weight: 18 },
    { key: "grossMargin", label: "Margen Bruto",      unit: "%", threshold: 40, max: 90, weight: 10 },
    { key: "opMargin",    label: "Margen Operativo",  unit: "%", threshold: 18, max: 50, weight: 10 },
  ],
  cashflow: [
    { key: "fcfEbitda",   label: "FCF/EBITDA",        unit: "%", threshold: 40, max: 100, weight: 12 },
  ],
  balance: [
    { key: "debtEbitda",     label: "Deuda/EBITDA",         unit: "x", threshold: 2, max: 5,  invert: true, weight: 8 },
    { key: "interestCover",  label: "Cobertura Intereses",   unit: "x", threshold: 6, max: 20, weight: 7 },
  ],
};

const MOAT_KEYS = [
  "Economías de Escala", "Switching Costs", "Efectos de Red",
  "Marca Dominante", "Tecnología Propietaria", "Liderazgo de Mercado",
];

const SECTORS = ["Tecnología", "Salud", "Consumo", "Finanzas", "Industria", "Energía", "Otro"];

const defMetrics = () => ({
  revenueCAGR: 20, fcfCAGR: 18, tamGrowth: 12,
  roic: 25, grossMargin: 55, opMargin: 22, fcfEbitda: 50,
  debtEbitda: 1.2, interestCover: 10,
});
const defMoat = () => Object.fromEntries(MOAT_KEYS.map(k => [k, 3]));

// ─── UTILS ───────────────────────────────────────────────────────────────────
function scoreMet(c, v) {
  if (c.invert) {
    if (v <= c.threshold) return 100;
    if (v >= c.max) return 0;
    return Math.round((1 - (v - c.threshold) / (c.max - c.threshold)) * 100);
  }
  if (v >= c.threshold * 1.5) return 100;
  if (v >= c.threshold) return Math.round(60 + ((v - c.threshold) / (c.threshold * 0.5)) * 40);
  return Math.round((v / c.threshold) * 60);
}

function calcScore(m, moat) {
  let tw = 0, ts = 0;
  Object.values(CRITERIA).flat().forEach(c => { const s = scoreMet(c, m[c.key]); ts += s * c.weight; tw += c.weight; });
  ts += Object.values(moat).reduce((a, v) => a + v, 0) / (MOAT_KEYS.length * 5) * 100 * 20;
  tw += 20;
  return Math.round(ts / tw);
}

function grade(s) {
  if (s >= 85) return { l: "A+", c: T.green };
  if (s >= 75) return { l: "A",  c: T.green };
  if (s >= 65) return { l: "B+", c: T.gold  };
  if (s >= 55) return { l: "B",  c: T.gold  };
  if (s >= 45) return { l: "C",  c: "#f39c12" };
  return { l: "D", c: T.red };
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>
    {children}
  </div>
);
const Lbl = ({ children, style }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, fontWeight: 500, marginBottom: 5, ...style }}>
    {children}
  </div>
);
const Mono = ({ children, size = 14, color = T.text, style }) => (
  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: size, color, ...style }}>{children}</span>
);

function Gauge({ score }) {
  const g = grade(score);
  const arc = v => {
    const a = -135 + (v / 100) * 270, r = 60, cx = 70, cy = 70, rd = x => x * Math.PI / 180;
    return `M ${cx + r * Math.cos(rd(-135))} ${cy + r * Math.sin(rd(-135))} A ${r} ${r} 0 ${a > 45 ? 1 : 0} 1 ${cx + r * Math.cos(rd(a))} ${cy + r * Math.sin(rd(a))}`;
  };
  return (
    <svg width={140} height={105} viewBox="0 0 140 105">
      <path d={arc(100)} fill="none" stroke={T.border} strokeWidth={7} strokeLinecap="round" />
      <path d={arc(score)} fill="none" stroke={g.c} strokeWidth={7} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${g.c}99)` }} />
      <text x={70} y={66} textAnchor="middle" fill={g.c}
        style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700 }}>{g.l}</text>
      <text x={70} y={82} textAnchor="middle" fill={T.muted}
        style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{score}/100</text>
    </svg>
  );
}

function MetricRow({ c, value, onChange }) {
  const s = scoreMet(c, value), pass = c.invert ? value <= c.threshold : value >= c.threshold;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 85px 50px 28px", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.border}22` }}>
      <div>
        <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}>{c.label}</div>
        <input type="range" min={0} max={c.max} step={0.1} value={value} onChange={e => onChange(c.key, parseFloat(e.target.value))} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <input type="number" value={value} min={0} max={c.max} step={0.1}
          onChange={e => onChange(c.key, parseFloat(e.target.value) || 0)} style={{ width: 60, textAlign: "right" }} />
        <span style={{ fontSize: 10, color: T.muted }}>{c.unit}</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: s >= 60 ? T.green : s >= 40 ? T.gold : T.red }}>{s}%</div>
      <div style={{ fontSize: 14, textAlign: "center", color: pass ? T.green : T.red }}>{pass ? "✓" : "✗"}</div>
    </div>
  );
}

// ─── SCORECARD TAB ────────────────────────────────────────────────────────────
function ScoreTab({ m, setM, moat, setMoat, company, setCompany, sector, setSector }) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState("");

  const score = calcScore(m, moat);
  const catS = Object.entries(CRITERIA).map(([cat, cs]) => ({
    cat: cat === "growth" ? "Crecimiento" : cat === "profitability" ? "Rentabilidad" : cat === "cashflow" ? "Flujo Caja" : "Balance",
    s: Math.round(cs.reduce((a, c) => a + scoreMet(c, m[c.key]), 0) / cs.length),
  }));
  const radarD = MOAT_KEYS.map(k => ({ subject: k.split(" ")[0], value: moat[k], fullMark: 5 }));

  const analyze = async () => {
    if (!company.trim()) { setErr("Ingresa un ticker primero."); return; }
    if (!API_KEY) { setErr("Agrega tu VITE_ANTHROPIC_KEY en el archivo .env"); return; }
    setLoading(true); setErr(""); setInfo(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Analiza "${company}" y responde SOLO con JSON válido sin markdown:\n{"metrics":{"revenueCAGR":<n>,"fcfCAGR":<n>,"tamGrowth":<n>,"roic":<n>,"grossMargin":<n>,"opMargin":<n>,"fcfEbitda":<n>,"debtEbitda":<n>,"interestCover":<n>},"moat":{"Economías de Escala":<1-5>,"Switching Costs":<1-5>,"Efectos de Red":<1-5>,"Marca Dominante":<1-5>,"Tecnología Propietaria":<1-5>,"Liderazgo de Mercado":<1-5>},"sector":"<Tecnología|Salud|Consumo|Finanzas|Industria|Energía|Otro>","summary":"<tesis 2 oraciones español>","catalysts":["<c1>","<c2>","<c3>"]}`
          }],
        }),
      });
      const data = await res.json();
      const txt = data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(txt);
      setM(prev => ({ ...prev, ...parsed.metrics }));
      setMoat(prev => ({ ...prev, ...parsed.moat }));
      if (parsed.sector) setSector(parsed.sector);
      setInfo(parsed);
    } catch (e) {
      setErr("No se pudo analizar. Verifica el ticker o tu API key.");
    }
    setLoading(false);
  };

  const checklist = [
    { l: "CAGR Ingresos ≥ 15%", p: m.revenueCAGR >= 15 },
    { l: "ROIC ≥ 20%", p: m.roic >= 20 },
    { l: "Margen Bruto ≥ 40%", p: m.grossMargin >= 40 },
    { l: "Margen Operativo ≥ 18%", p: m.opMargin >= 18 },
    { l: "FCF/EBITDA ≥ 40%", p: m.fcfEbitda >= 40 },
    { l: "Deuda/EBITDA ≤ 2x", p: m.debtEbitda <= 2 },
    { l: "Cobertura Intereses ≥ 6x", p: m.interestCover >= 6 },
    { l: "Moat promedio ≥ 3/5", p: Object.values(moat).reduce((a, v) => a + v, 0) / MOAT_KEYS.length >= 3 },
  ];

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Lbl>Ticker / Empresa</Lbl>
              <input type="text" value={company} onChange={e => setCompany(e.target.value.toUpperCase())}
                placeholder="NVDA, AAPL, META, SHOP..."
                onKeyDown={e => e.key === "Enter" && analyze()}
                style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.05em" }} />
            </div>
            <div style={{ width: 130 }}>
              <Lbl>Sector</Lbl>
              <select value={sector} onChange={e => setSector(e.target.value)}>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-gold" onClick={analyze} disabled={loading}
              style={{ height: 40, padding: "0 16px", flexShrink: 0 }}>
              {loading ? <span className="spin">⟳</span> : "✦ Analizar IA"}
            </button>
          </div>

          {!info && !loading && !err && (
            <div style={{ textAlign: "center", padding: "10px 0 6px", fontSize: 12, color: T.muted, borderTop: `1px solid ${T.border}33` }}>
              Escribe un ticker y pulsa <span style={{ color: T.gold }}>✦ Analizar IA</span> — o ajusta los sliders manualmente
            </div>
          )}
          {loading && <div style={{ textAlign: "center", padding: 10, fontSize: 12, color: T.gold }}><span className="spin">⟳</span> Analizando {company}...</div>}
          {err && <div style={{ padding: 10, background: `${T.red}15`, borderRadius: 8, fontSize: 12, color: T.red, border: `1px solid ${T.red}33` }}>{err}</div>}
          {info && (
            <div style={{ background: T.accent, borderRadius: 10, padding: 14, border: `1px solid ${T.goldDim}44` }}>
              <div style={{ fontSize: 10, color: T.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>✦ Análisis IA — {company}</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, marginBottom: 10 }}>{info.summary}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(info.catalysts || []).map((c, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: `${T.green}15`, color: T.green, border: `1px solid ${T.green}33` }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 0", borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
            <Gauge score={score} />
            <div style={{ flex: 1 }}>
              {catS.map(({ cat, s }) => (
                <div key={cat} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: T.muted }}>{cat}</span>
                    <Mono size={11} color={s >= 60 ? T.green : s >= 40 ? T.gold : T.red}>{s}%</Mono>
                  </div>
                  <div style={{ height: 3, background: T.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${s}%`, background: s >= 60 ? T.green : s >= 40 ? T.gold : T.red, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {Object.entries(CRITERIA).map(([cat, cs]) => (
          <Card key={cat}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>
              {cat === "growth" ? "📈 Crecimiento" : cat === "profitability" ? "💎 Rentabilidad" : cat === "cashflow" ? "💵 Flujo de Caja" : "🏦 Balance"}
            </div>
            {cs.map(c => <MetricRow key={c.key} c={c} value={m[c.key]} onChange={(k, v) => setM(p => ({ ...p, [k]: v }))} />)}
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 16 }}>🏰 Moat Analysis</div>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarD}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: T.muted, fontSize: 10 }} />
                <Radar dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            {MOAT_KEYS.map(k => (
              <div key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3, color: T.muted }}>
                  <span>{k}</span><Mono size={10} color={T.gold}>{moat[k]}/5</Mono>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <div key={v} onClick={() => setMoat(p => ({ ...p, [k]: v }))}
                      style={{ flex: 1, height: 5, borderRadius: 3, cursor: "pointer", background: v <= moat[k] ? T.gold : T.border, transition: "background 0.2s" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>📋 Checklist Buffett / Munger</div>
          {checklist.map(({ l, p }) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${T.border}22` }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: p ? `${T.green}22` : `${T.red}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: p ? T.green : T.red, flexShrink: 0 }}>{p ? "✓" : "✗"}</div>
              <span style={{ fontSize: 12, color: p ? T.text : T.muted }}>{l}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: 10, background: T.accent, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.muted }}>Criterios cumplidos</span>
            <Mono size={18} color={T.gold}>{checklist.filter(c => c.p).length}/8</Mono>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PORTFOLIO TAB ────────────────────────────────────────────────────────────
const POSITIONS = [
  { ticker: "TSLA", qty: 5.28,  cost: 337.74, price: 399.24, sector: "Tecnología", type: "growth",  moat: 72, conv: "alta",  alert: null },
  { ticker: "AMD",  qty: 9.61,  cost: 123.52, price: 203.23, sector: "Tecnología", type: "growth",  moat: 80, conv: "alta",  alert: null },
  { ticker: "HIMS", qty: 43.34, cost: 36.78,  price: 23.47,  sector: "Salud",      type: "growth",  moat: 58, conv: "media", alert: "⚠️ -36% Regulatorio" },
  { ticker: "SHAK", qty: 7.74,  cost: 77.47,  price: 95.40,  sector: "Consumo",   type: "rerate",  moat: 62, conv: "media", alert: null },
  { ticker: "IREN", qty: 12.81, cost: 38.94,  price: 38.12,  sector: "Cripto",    type: "rerate",  moat: 30, conv: "baja",  alert: "⚠️ Especulativo" },
  { ticker: "PYPL", qty: 9.95,  cost: 53.09,  price: 45.02,  sector: "Finanzas",  type: "rerate",  moat: 55, conv: "baja",  alert: "⚠️ Turnaround" },
  { ticker: "NKE",  qty: 5.61,  cost: 75.20,  price: 56.08,  sector: "Consumo",   type: "rerate",  moat: 60, conv: "baja",  alert: "🔴 Evaluar salida" },
  { ticker: "DUOL", qty: 20.86, cost: 159.20, price: 95.18,  sector: "Tecnología", type: "growth",  moat: 78, conv: "alta",  alert: "🔴 -40% Mayor pérdida" },
  { ticker: "SPOT", qty: 0.35,  cost: 461.52, price: 530.26, sector: "Tecnología", type: "growth",  moat: 75, conv: "media", alert: null },
  { ticker: "MSFT", qty: 1.50,  cost: 429.02, price: 405.76, sector: "Tecnología", type: "stable",  moat: 95, conv: "alta",  alert: null },
  { ticker: "ADBE", qty: 3.30,  cost: 304.81, price: 275.13, sector: "Tecnología", type: "stable",  moat: 85, conv: "alta",  alert: "⚠️ -10%" },
  { ticker: "OXY",  qty: 7.89,  cost: 51.54,  price: 53.12,  sector: "Energía",   type: "rerate",  moat: 55, conv: "media", alert: null },
  { ticker: "INTU", qty: 1.52,  cost: 394.00, price: 453.95, sector: "Tecnología", type: "stable",  moat: 88, conv: "alta",  alert: null },
];
const CASH = [{ b: "PLENTI", v: 4191.23 }, { b: "BINANCE", v: 3447.85 }];
const TC = { stable: T.blue, growth: T.green, rerate: T.gold };
const CC = { alta: T.green, media: T.gold, baja: T.red };

function PortTab() {
  const [view, setView] = useState("overview");
  const pos = POSITIONS.map(p => ({
    ...p,
    val: p.price * p.qty, costT: p.cost * p.qty,
    pl: (p.price - p.cost) * p.qty, plp: ((p.price - p.cost) / p.cost) * 100,
  })).sort((a, b) => b.val - a.val);

  const tCash = CASH.reduce((a, c) => a + c.v, 0);
  const tStocks = pos.reduce((a, p) => a + p.val, 0);
  const tCost = pos.reduce((a, p) => a + p.costT, 0);
  const tPL = tStocks - tCost, tPLp = (tPL / tCost) * 100;
  const grand = tStocks + tCash, cashP = (tCash / grand) * 100;

  const wins = pos.filter(p => p.pl > 0).sort((a, b) => b.plp - a.plp);
  const loss = pos.filter(p => p.pl < 0).sort((a, b) => a.plp - b.plp);
  const alloc = [
    { n: "Compounders", v: Math.round(pos.filter(p => p.type === "stable").reduce((a, p) => a + p.val, 0) / grand * 100), c: T.blue },
    { n: "Growth",      v: Math.round(pos.filter(p => p.type === "growth").reduce((a, p) => a + p.val, 0) / grand * 100), c: T.green },
    { n: "Re-Rating",   v: Math.round(pos.filter(p => p.type === "rerate").reduce((a, p) => a + p.val, 0) / grand * 100), c: T.gold },
    { n: "Cash",        v: Math.round(cashP), c: T.muted },
  ];
  const secs = Array.from(new Set(pos.map(p => p.sector)))
    .map(s => ({ n: s, v: pos.filter(p => p.sector === s).reduce((a, p) => a + p.val, 0) }))
    .sort((a, b) => b.v - a.v);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { l: "Total", v: `$${Math.round(grand).toLocaleString("en")}`, c: T.gold, n: "acciones + cash" },
          { l: "Acciones", v: `$${Math.round(tStocks).toLocaleString("en")}`, c: T.text, n: `${((tStocks / grand) * 100).toFixed(0)}% del total` },
          { l: "Cash", v: `$${Math.round(tCash).toLocaleString("en")}`, c: cashP > 30 ? T.red : T.green, n: `${cashP.toFixed(0)}% ${cashP > 30 ? "⚠️ alto" : "OK"}` },
          { l: "P&L", v: `${tPL >= 0 ? "+" : ""}$${Math.round(tPL).toLocaleString("en")}`, c: tPL >= 0 ? T.green : T.red, n: `${tPLp >= 0 ? "+" : ""}${tPLp.toFixed(1)}%` },
          { l: "Posiciones", v: pos.length, c: T.green, n: "objetivo 8-12" },
        ].map(({ l, v, c, n }) => (
          <Card key={l} style={{ padding: 14 }}>
            <Lbl>{l}</Lbl>
            <Mono size={18} color={c} style={{ display: "block", marginBottom: 3 }}>{v}</Mono>
            <div style={{ fontSize: 10, color: T.muted }}>{n}</div>
          </Card>
        ))}
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 8 }}>
        {[["overview", "Vista General"], ["positions", "P&L Detalle"], ["allocation", "Allocación"]].map(([id, lb]) => (
          <button key={id} className={`btn btn-outline ${view === id ? "btn-active" : ""}`} onClick={() => setView(id)} style={{ fontSize: 11 }}>{lb}</button>
        ))}
      </div>

      {view === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.green, marginBottom: 12 }}>🏆 Ganadores</div>
            {wins.map(p => (
              <div key={p.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: `${T.green}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mono size={9} color={T.green}>{p.ticker}</Mono>
                  </div>
                  <div>
                    <div style={{ fontSize: 12 }}>{p.ticker}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{p.sector}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Mono size={12} color={T.green}>+${Math.round(p.pl).toLocaleString("en")}</Mono>
                  <div style={{ fontSize: 10, color: T.green }}>+{p.plp.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.red, marginBottom: 12 }}>⚠️ En Pérdida</div>
            {loss.map(p => (
              <div key={p.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: `${T.red}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mono size={9} color={T.red}>{p.ticker}</Mono>
                  </div>
                  <div>
                    <div style={{ fontSize: 12 }}>{p.ticker}</div>
                    <div style={{ fontSize: 10, color: T.red }}>{p.alert || p.sector}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Mono size={12} color={T.red}>${Math.round(p.pl).toLocaleString("en")}</Mono>
                  <div style={{ fontSize: 10, color: T.red }}>{p.plp.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </Card>
          <Card style={{ gridColumn: "1/-1", background: `${T.red}0a`, border: `1px solid ${T.red}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 24 }}>💡</div>
              <div>
                <div style={{ fontSize: 13, color: T.gold, fontFamily: "'Playfair Display', serif", marginBottom: 3 }}>
                  ${Math.round(tCash).toLocaleString("en")} ({cashP.toFixed(0)}%) en cash sin generar retorno
                </div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                  PLENTI $4,191 + Binance $3,448 deberían estar compoundeando. Despliega en AMD, INTU o MSFT — tus posiciones de mayor calidad y convicción.
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {view === "positions" && (
        <Card style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Ticker", "Sector", "Qty", "Costo", "Precio", "Valor", "P&L $", "P&L %", "Moat", "Conv.", "Alerta"].map(h => (
                  <th key={h} style={{ padding: "10px 11px", textAlign: "left", fontSize: 9, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pos.map(p => (
                <tr key={p.ticker} style={{ borderBottom: `1px solid ${T.border}22`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accent}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "9px 11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 25, height: 25, borderRadius: 5, background: `${TC[p.type]}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Mono size={8} color={TC[p.type]}>{p.ticker}</Mono>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{p.ticker}</span>
                    </div>
                  </td>
                  <td style={{ padding: "9px 11px", fontSize: 10, color: T.muted }}>{p.sector}</td>
                  <td style={{ padding: "9px 11px" }}><Mono size={11} color={T.muted}>{p.qty.toFixed(2)}</Mono></td>
                  <td style={{ padding: "9px 11px" }}><Mono size={11}>${p.cost.toFixed(2)}</Mono></td>
                  <td style={{ padding: "9px 11px" }}><Mono size={11}>${p.price.toFixed(2)}</Mono></td>
                  <td style={{ padding: "9px 11px" }}><Mono size={11} color={T.gold}>${Math.round(p.val).toLocaleString("en")}</Mono></td>
                  <td style={{ padding: "9px 11px" }}><Mono size={11} color={p.pl >= 0 ? T.green : T.red}>{p.pl >= 0 ? "+" : ""}${Math.round(p.pl).toLocaleString("en")}</Mono></td>
                  <td style={{ padding: "9px 11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 30, height: 3, background: T.border, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${Math.min(Math.abs(p.plp), 60) / 60 * 100}%`, background: p.pl >= 0 ? T.green : T.red, borderRadius: 2 }} />
                      </div>
                      <Mono size={10} color={p.pl >= 0 ? T.green : T.red}>{p.plp >= 0 ? "+" : ""}{p.plp.toFixed(1)}%</Mono>
                    </div>
                  </td>
                  <td style={{ padding: "9px 11px" }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[20, 40, 60, 80, 100].map(v => <div key={v} style={{ width: 4, height: 10, borderRadius: 2, background: v <= p.moat ? T.gold : T.border }} />)}
                    </div>
                  </td>
                  <td style={{ padding: "9px 11px" }}><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${CC[p.conv]}22`, color: CC[p.conv] }}>{p.conv}</span></td>
                  <td style={{ padding: "9px 11px", fontSize: 10, color: T.muted, maxWidth: 130, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.alert || "—"}</td>
                </tr>
              ))}
              {CASH.map(c => (
                <tr key={c.b} style={{ opacity: 0.5, borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: "8px 11px" }}><Mono size={10} color={T.muted}>CASH</Mono></td>
                  <td style={{ padding: "8px 11px", fontSize: 10, color: T.muted }}>{c.b}</td>
                  <td colSpan={4} />
                  <td style={{ padding: "8px 11px" }}><Mono size={11} color={T.muted}>${c.v.toLocaleString("en")}</Mono></td>
                  <td colSpan={3} /><td />
                  <td style={{ padding: "8px 11px", fontSize: 10, color: T.red }}>⚠️ Sin retorno</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view === "allocation" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>Por Tipo vs Objetivo Buffett</div>
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={alloc} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="v" paddingAngle={3}>
                    {alloc.map((e, i) => <Cell key={i} fill={e.c} style={{ filter: `drop-shadow(0 0 4px ${e.c}55)` }} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} formatter={v => [`${v}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {alloc.map(({ n, v, c }) => (
              <div key={n} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: c }}>{n}</span><Mono size={11} color={c}>{v}%</Mono>
                </div>
                <div style={{ height: 3, background: T.border, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${Math.min(v, 70)}%`, background: c, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>Concentración Sectorial</div>
            {secs.map(s => {
              const pct = s.v / grand * 100;
              return (
                <div key={s.n} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: T.muted }}>{s.n}</span>
                    <Mono size={11} color={pct > 45 ? T.red : T.text}>{pct.toFixed(1)}%</Mono>
                  </div>
                  <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 70) / 70 * 100}%`, background: pct > 45 ? T.red : T.blue, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 4, padding: 10, background: `${T.red}0f`, border: `1px solid ${T.red}33`, borderRadius: 8, fontSize: 11, color: T.muted }}>
              ⚠️ <span style={{ color: T.gold }}>Tecnología ~{(pos.filter(p => p.sector === "Tecnología").reduce((a, p) => a + p.val, 0) / grand * 100).toFixed(0)}%</span> — concentración alta.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── RETURN TAB ───────────────────────────────────────────────────────────────
function ReturnTab() {
  const [inp, setInp] = useState({ rg: 18, me: 2, mx: 3, dv: 1, pe: 30, fg: 12 });
  const s = (k, v) => setInp(p => ({ ...p, [k]: v }));
  const er = inp.rg + inp.me + inp.mx + inp.dv;
  const proj = Array.from({ length: 11 }, (_, i) => ({
    y: `A${i}`,
    p: parseFloat((100 * Math.pow(1 + er / 100, i)).toFixed(1)),
    b: parseFloat((100 * Math.pow(1.08, i)).toFixed(1)),
  }));

  const RS = ({ l, k, min, max, u, c }) => (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.muted }}>{l}</span>
        <Mono size={12} color={c || T.text}>{inp[k] > 0 ? "+" : ""}{inp[k]}{u}</Mono>
      </div>
      <input type="range" min={min} max={max} step={0.5} value={inp[k]} onChange={e => s(k, parseFloat(e.target.value))} />
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 16 }}>📐 Expected Return</div>
          <RS l="Crecimiento ingresos" k="rg" min={0} max={40} u="%" c={T.green} />
          <RS l="Expansión márgenes" k="me" min={-5} max={10} u="%" c={T.blue} />
          <RS l="Expansión múltiplos" k="mx" min={-10} max={15} u="%" c={T.gold} />
          <RS l="Dividendos" k="dv" min={0} max={6} u="%" c={T.muted} />
          <div style={{ background: T.accent, borderRadius: 10, padding: 16, marginTop: 8, border: `1px solid ${T.border}` }}>
            <Lbl>Retorno Esperado Total</Lbl>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: er >= 18 ? T.green : T.gold, fontWeight: 700 }}>{er.toFixed(1)}%</span>
              <span style={{ fontSize: 12, color: T.muted }}>/año</span>
            </div>
            <div style={{ fontSize: 11, color: er >= 18 ? T.green : T.red, marginTop: 4 }}>
              {er >= 20 ? "✓ Umbral premium ≥20%" : er >= 18 ? "✓ Umbral mínimo ≥18%" : "✗ Por debajo del objetivo"}
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>📊 PEG & Valoración</div>
          <RS l="P/E actual" k="pe" min={5} max={80} u="x" />
          <RS l="Crecimiento futuro" k="fg" min={5} max={40} u="%" />
          <div style={{ marginTop: 8, padding: 12, background: T.accent, borderRadius: 8, border: `1px solid ${T.border}` }}>
            {[
              { l: "PEG", v: (inp.pe / inp.fg).toFixed(2), g: inp.pe / inp.fg <= 1.5, u: "x" },
              { l: "P/E justo", v: inp.fg * 2, u: "x" },
              { l: "Upside", v: (((inp.fg * 2 / inp.pe) - 1) * 100).toFixed(0), g: inp.fg * 2 > inp.pe, u: "%" },
            ].map(({ l, v, g, u }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}22` }}>
                <span style={{ fontSize: 12, color: T.muted }}>{l}</span>
                <Mono size={12} color={g === undefined ? T.text : g ? T.green : T.red}>{v}{u}</Mono>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 16 }}>📈 Proyección 10 años — $100 invertidos</div>
        <div style={{ height: 270 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={proj}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} /><stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.muted} stopOpacity={0.2} /><stop offset="95%" stopColor={T.muted} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="y" tick={{ fill: T.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}
                formatter={(v, n) => [`$${v}`, n === "p" ? "Compounder" : "Mercado 8%"]} />
              <Area type="monotone" dataKey="b" stroke={T.muted} fill="url(#gB)" strokeWidth={1.5} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="p" stroke={T.gold} fill="url(#gP)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
          {[3, 5, 10].map(y => {
            const pv = (100 * Math.pow(1 + er / 100, y)).toFixed(0);
            const bv = (100 * Math.pow(1.08, y)).toFixed(0);
            return (
              <div key={y} style={{ background: T.accent, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Año {y}</div>
                <Mono size={20} color={T.gold} style={{ display: "block", marginBottom: 3 }}>${pv}</Mono>
                <div style={{ fontSize: 10, color: T.green }}>+${Math.round(pv - bv)} vs mkt</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── DCF TAB ──────────────────────────────────────────────────────────────────
function DCFTab() {
  const [d, setD] = useState({ rev: 1000, rg: 20, mt: 25, fc: 0.85, tg: 2.5, w: 10, sh: 100, ca: 200, de: 300, yr: 10 });
  const s = (k, v) => setD(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const flows = Array.from({ length: d.yr }, (_, i) => {
    const r = d.rev * Math.pow(1 + d.rg / 100, i + 1);
    const f = r * (d.mt / 100) * d.fc;
    const pv = f / Math.pow(1 + d.w / 100, i + 1);
    return { y: `A${i + 1}`, f: Math.round(f), pv: Math.round(pv) };
  });
  const tF = flows[d.yr - 1].f;
  const tV = (tF * (1 + d.tg / 100)) / ((d.w - d.tg) / 100);
  const tPV = tV / Math.pow(1 + d.w / 100, d.yr);
  const sumPV = flows.reduce((a, f) => a + f.pv, 0);
  const ev = sumPV + tPV, eq = ev + d.ca - d.de, ips = eq / d.sh;

  const F = ({ l, k, u, min, max, st = 1 }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <Lbl style={{ marginBottom: 0 }}>{l}</Lbl>
        <Mono size={11} color={T.gold}>{d[k]}{u}</Mono>
      </div>
      <input type="range" min={min} max={max} step={st} value={d[k]} onChange={e => s(k, e.target.value)} />
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>⚙️ Parámetros</div>
          <F l="Ingresos base (M$)" k="rev" u="M" min={10} max={10000} st={10} />
          <F l="Crecimiento ingresos" k="rg" u="%" min={0} max={50} />
          <F l="Margen FCF" k="mt" u="%" min={5} max={50} />
          <F l="Conversión FCF" k="fc" u="x" min={0.5} max={1} st={0.05} />
          <F l="Tasa terminal" k="tg" u="%" min={1} max={4} st={0.5} />
          <F l="WACC" k="w" u="%" min={6} max={15} st={0.5} />
          <F l="Años" k="yr" u="" min={5} max={15} />
        </Card>
        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>🏦 Balance</div>
          <F l="Caja (M$)" k="ca" u="M" min={0} max={5000} st={10} />
          <F l="Deuda (M$)" k="de" u="M" min={0} max={5000} st={10} />
          <F l="Acciones (M)" k="sh" u="M" min={1} max={1000} />
        </Card>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { l: "Suma PV flujos", v: `$${Math.round(sumPV)}M`, c: T.blue },
            { l: "Terminal PV", v: `$${Math.round(tPV)}M`, c: T.gold },
            { l: "Intrínseco/acción", v: `$${ips.toFixed(2)}`, c: T.green },
          ].map(({ l, v, c }) => (
            <Card key={l} style={{ padding: 14, textAlign: "center" }}>
              <Lbl style={{ textAlign: "center" }}>{l}</Lbl>
              <Mono size={20} color={c}>{v}</Mono>
            </Card>
          ))}
        </div>
        <Card>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: T.gold, marginBottom: 12 }}>Flujos Proyectados</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flows}>
                <defs>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.3} /><stop offset="95%" stopColor={T.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} /><stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="y" tick={{ fill: T.muted, fontSize: 10 }} />
                <YAxis tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}
                  formatter={(v, n) => [`$${v}M`, n === "f" ? "FCF nominal" : "FCF descontado"]} />
                <Area type="monotone" dataKey="f" stroke={T.green} fill="url(#gF)" strokeWidth={2} />
                <Area type="monotone" dataKey="pv" stroke={T.gold} fill="url(#gV)" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted, lineHeight: 2 }}>
            <span style={{ color: T.gold }}>EV = </span>
            <span style={{ color: T.blue }}>${Math.round(sumPV)}M</span> + <span style={{ color: T.gold }}>${Math.round(tPV)}M</span> = <span style={{ color: T.text }}>${Math.round(ev)}M</span>
            {"  ·  "}<span style={{ color: T.gold }}>Equity = </span>${Math.round(eq)}M
            {"  ·  "}<span style={{ color: T.gold }}>Intrínseco = </span><span style={{ color: T.green }}>${ips.toFixed(2)}/acción</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "port",   l: "Mi Cartera"      },
  { id: "score",  l: "Scorecard IA"    },
  { id: "ret",    l: "Retorno Esperado" },
  { id: "dcf",    l: "DCF"             },
];

export default function App() {
  const [tab, setTab]         = useState("port");
  const [m, setM]             = useState(defMetrics());
  const [moat, setMoat]       = useState(defMoat());
  const [company, setCompany] = useState("");
  const [sector, setSector]   = useState("Tecnología");
  const score = calcScore(m, moat);
  const g = grade(score);

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <style>{globalCss}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 28px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1380, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 0" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: T.gold, letterSpacing: "0.02em" }}>
                Compounder Analyst
              </div>
              <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 1 }}>
                Buffett · Munger · High-Growth Framework
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Objetivo CAGR</div>
                <Mono size={18} color={T.gold}>≥ 15%</Mono>
              </div>
              <div style={{ width: 1, height: 28, background: T.border }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Score IA</div>
                <Mono size={18} color={g.c}>{score}/100</Mono>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 8, borderTop: `1px solid ${T.border}22`, paddingTop: 2 }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
                style={{ color: tab === t.id ? T.gold : T.muted, borderBottom: tab === t.id ? `2px solid ${T.gold}` : "2px solid transparent", paddingBottom: 9 }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "24px 28px" }}>
        {tab === "port"  && <PortTab />}
        {tab === "score" && <ScoreTab m={m} setM={setM} moat={moat} setMoat={setMoat} company={company} setCompany={setCompany} sector={sector} setSector={setSector} />}
        {tab === "ret"   && <ReturnTab />}
        {tab === "dcf"   && <DCFTab />}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 28px", maxWidth: 1380, margin: "0 auto" }}>
        <div style={{ fontSize: 9, color: T.muted }}>
          Inspirado en <span style={{ color: T.goldDim }}>Warren Buffett · Charlie Munger</span> · Solo educativo — no constituye asesoramiento financiero.
        </div>
      </div>
    </div>
  );
}
