// /api/rates.js — Tasas de cambio para LATAM
// Frankfurter (ECB) no soporta COP/ARS/PEN/CLP
// Usamos open.er-api.com que sí las tiene
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const fallback = {
    COP: 3650, MXN: 20.3, ARS: 1050, PEN: 3.75,
    CLP: 920,  BRL: 5.78, EUR: 0.92, GBP: 0.79
  };

  try {
    // open.er-api.com — free, no key, supports ALL currencies including COP
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'Inversoria/1.0' }
    });

    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    const raw = data.rates || {};

    const rates = {};
    Object.keys(fallback).forEach(code => {
      rates[code] = raw[code] || fallback[code];
    });

    return res.status(200).json({ rates, source: 'open.er-api.com' });

  } catch(e) {
    // Return fallback — always has correct approximate values
    return res.status(200).json({ rates: fallback, source: 'fallback' });
  }
}
