// /api/sms.js
// Works on Vercel (Node runtime). Accepts POST JSON and GET query params.

export default async function handler(req, res) {
  try {
    // ---- CORS (optional but helpful for some apps/browsers) ----
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    // ---- Parse input from POST JSON or GET query string ----
    let from, message, time, sim, filter;

    if (req.method === "POST") {
      // App should send: { from, message, time, sim, filter }
      const body = req.body || {};
      from = body.from ?? body.sender ?? body["in-number"];
      message = body.message ?? body.msg ?? body.text;
      time = body.time ?? body.timestamp;
      sim = body.sim ?? body["in-sim"];
      filter = body.filter ?? body["filter-name"];
    } else if (req.method === "GET") {
      // URL like: /api/sms?from=...&message=...&time=...
      const q = req.query || {};
      from = q.from ?? q.sender ?? q["in-number"];
      message = q.message ?? q.msg ?? q.text;
      time = q.time ?? q.timestamp;
      sim = q.sim ?? q["in-sim"];
      filter = q.filter ?? q["filter-name"];
    } else {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    // ---- Basic validation ----
    if (!from || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields",
        required: ["from", "message"],
        received: { from, message, time, sim, filter },
      });
    }

    // ---- Normalize ----
    const payload = {
      from: String(from),
      message: String(message),
      time: time ? String(time) : new Date().toISOString(),
      sim: sim ? String(sim) : null,
      filter: filter ? String(filter) : null,
      received_at: new Date().toISOString(),
    };

    // ---- Log to Vercel logs (very useful for debugging) ----
    console.log("SMS RECEIVED:", payload);

    // ---- OPTIONAL: store to Supabase (uncomment if you want) ----
    /*
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase env vars missing; skipping DB insert.");
    } else {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Make sure you have a table named "sms" with columns:
      // from (text), message (text), time (text), sim (text), filter (text), received_at (timestamptz/text)
      const { error } = await supabase.from("sms").insert([payload]);
      if (error) {
        console.error("Supabase insert error:", error);
        // still return OK so the phone app doesn't keep retrying
      }
    }
    */

    // ---- Return OK quickly so the app stops retrying ----
    return res.status(200).json({ ok: true, received: payload });
  } catch (err) {
    console.error("SMS API ERROR:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

