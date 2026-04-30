// /api/rates.js — Proxy para Frankfurter (evita CORS desde el browser)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600"); // cache 1 hora

  try {
    const r = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=COP,MXN,ARS,PEN,CLP,BRL,EUR,GBP"
    );
    if (!r.ok) throw new Error("Frankfurter unavailable");
    const data = await r.json();
    return res.status(200).json(data);
  } catch(e) {
    // Fallback rates if Frankfurter is down
    return res.status(200).json({
      rates: {
        COP: 4200, MXN: 17.2, ARS: 950, PEN: 3.75,
        CLP: 950,  BRL: 5.1,  EUR: 0.92, GBP: 0.79
      }
    });
  }
}
