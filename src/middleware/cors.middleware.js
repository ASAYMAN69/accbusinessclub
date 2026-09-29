const { ALLOWED_ORIGINS } = require("../config/env");

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin || "";
  if (!origin || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
}

module.exports = { corsMiddleware };
