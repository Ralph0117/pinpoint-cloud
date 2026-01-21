// /api/sms.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    let message = "";
    let from = "";
    let time = "";

    // Accept GET (query) OR POST (json)
    if (req.method === "GET") {
      message = (req.query.message || "").toString();
      from = (req.query.from || req.query.sender || "").toString();
      time = (req.query.time || "").toString();
    } else if (req.method === "POST") {
      // If body is string, parse it; else use as object
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      message = (body?.message || "").toString();
      from = (body?.from || body?.sender || "").toString();
      time = (body?.time || "").toString();
    } else {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    if (!message) return res.status(400).json({ ok: false, error: "message is required" });

    const { error } = await supabase.from("alerts").insert([
      { message, from, time }
    ]);

    if (error) return res.status(500).json({ ok: false, error: error.message });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}


