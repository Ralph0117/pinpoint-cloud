import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("POST only");

  const msg = req.body.message || req.body.body || "";
  const m = msg.match(/Student\s*(\d+):([\d.]+),([\d.]+)/i);

  if (!m) return res.json({ ok: true, ignored: true });

  const [, student, lat, lng] = m;

  const { error } = await supabase.from("alerts").insert([
    { student: `Student ${student}`, lat, lng, message: msg }
  ]);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true });
}

