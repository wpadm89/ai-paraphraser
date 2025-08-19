// pages/api/profile.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-only
);

export default async function handler(req, res) {
  // 1. Get the auth token from headers
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  // 2. Validate the token with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }

  const userId = user.id; // ✅ Now always trust Supabase, not client

  if (req.method === "POST") {
    const { name, phone } = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, name, phone })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
