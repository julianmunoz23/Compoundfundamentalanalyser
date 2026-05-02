// ══════════════════════════════════════════════════════════════════════════════
// scoreAnalysis.js — Función de análisis de acciones individuales
// ⚠️  ARCHIVO PROTEGIDO — No modificar sin pruebas completas  
// Contiene: analyze() — llama Finnhub + AI en paralelo
// Funciona con: callAI(), callFinnhub() de aiCore.js
// Última vez que funcionó correctamente: Mayo 2026
// ══════════════════════════════════════════════════════════════════════════════

/*
CÓMO FUNCIONA:
1. resolveTicker(company) → convierte "Apple" en "AAPL"
2. callFinnhub(ticker) → Wall Street consensus en paralelo  
3. callAI(prompt) → análisis de calidad del negocio en paralelo
4. Si Finnhub no tiene consensus → callAI() para estimarlo
5. Resultado: setInfo(analysis), setFh(consensus), setLocked(true)
*/

  const analyze=async(overrideTicker)=>{
    const companyToUse = overrideTicker || company;
    if(!companyToUse.trim()){setErr("Enter a company name or ticker.");return;}
    if(!canAnalyze())return;
    setLoading(true);setErr("");setInfo(null);setFh(null);setLocked(false);
    try{
      // Resolve company name to ticker if needed
      if(overrideTicker) setCompany(overrideTicker);
      const resolvedTicker=await resolveTicker(companyToUse);
      if(resolvedTicker!==companyToUse.trim().toUpperCase())setCompany(resolvedTicker);
      const tickerToUse=resolvedTicker;
      const isLatamStock = getLatamSymbol(tickerToUse) !== null;

      // Run Finnhub + AI in parallel (original working flow)
      const[fhResult,aiResult]=await Promise.allSettled([
        callFinnhub(tickerToUse),
        isLatamStock
          ? (async()=>{
              const r=await fetch("/api/analyze",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1800,
                  tools:[{"type":"web_search_20250305","name":"web_search"}],
                  messages:[{role:"user",content:`Search for recent data on "${tickerToUse}" from bloomberglinea.com, valoraanalitik.com, stockanalysis.com (query: "${tickerToUse} resultados financieros dividendo 2025 2026"). Then act as a value investing analyst and respond ONLY with valid JSON (no markdown): {"metrics":{"revenueCAGR":<n>,"fcfGrowth":<n>,"tamGrowth":<n>,"roic":<n>,"grossMargin":<n>,"opMargin":<n>,"fcfMarginPct":<n>,"debtEbitda":<n>,"interestCover":<n>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<s>","summary":"<2-3 sentences>","catalysts":["<1>","<2>","<3>"],"keyMetrics":{"revenueGrowth5y":"<v>","roicDisplay":"<v>","fcfGrowthDisplay":"<v>","fcfMarginDisplay":"<v>","debtEquity":"<v>","epsGrowth":"<v>"}}`}]
                })
              });
              const d=await r.json();
              const t=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/g,"").trim();
              return JSON.parse(t);
            })()
          : callAI(`Value investing analyst. Analyze "${tickerToUse}". Use FCF GROWTH RATE (3-5Y CAGR). JSON only, no markdown:{"metrics":{"revenueCAGR":<n>,"fcfGrowth":<n>,"tamGrowth":<n>,"roic":<n>,"grossMargin":<n>,"opMargin":<n>,"fcfMarginPct":<n>,"debtEbitda":<n>,"interestCover":<n>},"moat":{"Economies of Scale":<1-5>,"Switching Costs":<1-5>,"Network Effects":<1-5>,"Brand Dominance":<1-5>,"Proprietary Technology":<1-5>,"Market Leadership":<1-5>},"sector":"<s>","summary":"<2-3 sentence thesis+risk>","catalysts":["<1>","<2>","<3>"],"keyMetrics":{"revenueGrowth5y":"<+56% CAGR>","roicDisplay":"<18%>","fcfGrowthDisplay":"<+67% CAGR>","fcfMarginDisplay":"<19%>","debtEquity":"<0.2x>","epsGrowth":"<+38%>"}}`)
      ]);
      let fhData=fhResult.status==="fulfilled"?fhResult.value:null;
      // Enrich AI prompt context from Finnhub fundamentals (for future consensus call)
      const fundamentalsCtx = ""; // FMP integration pending — Phase 2
      // If Finnhub has no analyst data, use AI to estimate consensus
      if(!fhData||fhData.totalAnalysts===0||fhData.rating==="N/A"||!fhData.rating){
        try{
          const consensusPrompt = "Wall Street consensus for " + tickerToUse + ". Return JSON only: rating, totalAnalysts, bullish, bearish, hold, currentPrice, targetMean, targetHigh, targetLow, upside, epsGrowthNext, breakdown with strongBuy buy hold sell strongSell, isAiEstimate true.";
          const consensus = await callAI(consensusPrompt);
          if(consensus && consensus.rating && consensus.totalAnalysts){
            fhData={...consensus,source:"AI Consensus Estimate",isAiEstimate:true};
          }
        }catch(e){console.warn("AI consensus failed:",e.message);}
      }
      if(fhData)setFh(fhData);
      if(aiResult.status==="fulfilled"){
        const p=aiResult.value;
        setM(prev=>({...prev,...p.metrics}));setMoat(prev=>({...prev,...p.moat}));
        if(p.sector)setSector(p.sector);setInfo(p);
      }else{throw new Error(aiResult.reason?.message||"AI analysis failed");}
      setLocked(true);onAnalysis();
    }catch(e){
      const msg = e.message||"";
      // Show full error temporarily for diagnosis
      setErr(`Error: ${msg}`);
    }
    setLoading(false);
  }
