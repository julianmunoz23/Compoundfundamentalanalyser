// /api/analyze.js — Proxy seguro para Anthropic
// La ANTHROPIC_KEY NUNCA llega al browser
module.exports = async function handler(req, res) {
  if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.ANTHROPIC_KEY;
  if(!key) return res.status(500).json({error:"API not configured"});

  try {
    const body = req.body;
    if(!body?.messages?.length) return res.status(400).json({error:"Invalid request"});
    if(!body.model) body.model = "claude-sonnet-4-20250514";
    if(!body.max_tokens) body.max_tokens = 1400;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch(err) {
    console.error("Analyze proxy error:", err);
    return res.status(500).json({error:"Analysis service unavailable"});
  }
}
