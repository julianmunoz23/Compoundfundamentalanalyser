// ══════════════════════════════════════════════════════════════════════════════
// portfolioAnalysis.js — Análisis IA del portafolio completo
// ⚠️  ARCHIVO PROTEGIDO — No modificar sin pruebas completas
// Contiene: analyzePortfolio() — analiza todas las posiciones con IA
// Funciona con: callAI() de aiCore.js, enriched[] del portafolio
// Última vez que funcionó correctamente: Mayo 2026
// ══════════════════════════════════════════════════════════════════════════════

/*
CÓMO FUNCIONA:
1. Toma enriched[] (posiciones con precios en vivo)
2. Construye summary de max 20 posiciones por valor
3. Llama /api/analyze con el portafolio completo
4. Resultado: setAiAnalysis(analysis)
*/

  const analyzePortfolio=async()=>{
    if(!grouped.length){setErr("Add at least one position first.");return;}
    if(!isAdmin()){onShowPaywall("portfolio");return;}
    setLoadingAI(true);setErr("");setAiAnalysis(null);
    // Limit to top 20 by value to keep prompt manageable
    const sortedEnriched = [...enriched].sort((a,b)=>{
      const aVal=(a.currentPrice||a.avgCost)*a.totalShares;
      const bVal=(b.currentPrice||b.avgCost)*b.totalShares;
      return bVal-aVal;
    });
    const topPositions = sortedEnriched.slice(0,20);
    const summary=topPositions.map(p=>{
      const current=p.currentPrice||p.avgCost;
      const pnl=((current-p.avgCost)/p.avgCost*100).toFixed(1);
      return`${p.ticker}:avg$${p.avgCost.toFixed(2)},now$${current.toFixed(2)},P&L${pnl}%`;
    }).join("|");
    const skipped = enriched.length - topPositions.length;

    // Identify LATAM/European tickers for web search enrichment
    const latamTickers = enriched
      .filter(p => getLatamSymbol(p.ticker) !== null)
      .map(p => p.ticker)
      .slice(0,3); // limit web searches to avoid timeout
    const hasLatam = latamTickers.length > 0 && enriched.length <= 15; // skip web search for large portfolios

    try{
      const profileCtx=savedProfile?`Risk Profile: ${typeof savedProfile.label==="object"?savedProfile.label.en:savedProfile.label}. ${typeof savedProfile.desc==="object"?savedProfile.desc.en:savedProfile.desc}`:"No risk profile.";
      // Use higher token limit for large portfolios
      const portfolioRes=await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,
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
      if(portfolioData.error){
        const m=portfolioData.error.message||"";
        if(m.includes("credit")||m.includes("balance"))throw new Error("credits");
        throw new Error(m);
      }
      const raw=portfolioData.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
      const p=JSON.parse(raw);
      setAiAnalysis(p);
    }catch(e){
      const msg = e.message||"";
      let userMsg = "⚠️ No se pudo completar el análisis. Intenta de nuevo.";
      if(msg.includes("credit")||msg.includes("balance")||msg.includes("billing"))
        userMsg = "⚠️ Servicio de análisis temporalmente no disponible. Intenta más tarde.";
      else if(msg.includes("overload")||msg.includes("529"))
        userMsg = "⚡ Servicio ocupado. Intenta en unos segundos.";
      else if(msg.includes("rate")||msg.includes("429"))
        userMsg = "⏳ Demasiadas consultas. Espera un momento.";
      setErr(userMsg);setAiAnalysis(null);
    }
    setLoadingAI(false);
  }
