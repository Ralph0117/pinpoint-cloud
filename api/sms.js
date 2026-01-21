export default async function handler(req, res) {
  // Basic CORS (helps some apps)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    // 1) Collect payload from GET query first
    let payload = { ...req.query };

    // 2) If POST, try to read JSON or form body
    if (req.method === "POST") {
      // Vercel usually parses JSON into req.body automatically when Content-Type is JSON
      // But for safety, we handle string bodies too.
      const ct = (req.headers["content-type"] || "").toLowerCase();

      if (ct.includes("application/json")) {
        if (typeof req.body === "string") {
          payload = { ...payload, ...JSON.parse(req.body || "{}") };
        } else {
          payload = { ...payload, ...(req.body || {}) };
        }
      } else if (ct.includes("application/x-www-form-urlencoded")) {
        // If req.body is already parsed -> use it.
        if (typeof req.body === "object" && req.body) {
          payload = { ...payload, ...req.body };
        } else if (typeof req.body === "string") {
          // Parse form-urlencoded manually
          const params = new URLSearchParams(req.body);
          const obj = Object.fromEntries(params.entries());
          payload = { ...payload, ...obj };
        }
      } else {
        // fallback: attempt to use req.body if present
        if (req.body && typeof req.body === "object") {
          payload = { ...payload, ...req.body };
        }
      }
    }

    // Normalize field names some apps use
    const from =
      payload.from ||
      payload.sender ||
      payload["in-number"] ||
      payload.phone ||
      payload.number ||
      "";

    const message =
      payload.message ||
      payload.msg ||
      payload.text ||
      payload.body ||
      payload.payload || // some apps dump everything into "payload"
      "";

    const time = payload.time || payload.timestamp || payload.date || "";
    const sim = payload.sim || payload["in-sim"] || "";

    // Validate required fields
    const missing = [];
    if (!from) missing.push("from");
    if (!message) missing.push("message");

    if (missing.length) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields",
        required: ["from", "message"],
        missing,
        received: payload,
      });
    }

    // Log to Vercel logs (so you can see it in Dashboard)
    console.log("SMS RECEIVED:", { from, message, time, sim });

    // Return OK (your frontend can also call /api/alerts etc.)
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SMS ERROR:", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}


