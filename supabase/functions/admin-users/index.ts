// Privileged user management (create / delete / reset password) can't happen
// safely from the static frontend — it holds only the anon key, and calling
// Supabase Auth admin methods needs the service role key. This function holds
// that key server-side and checks the caller's own `manage_roles` permission
// (via their JWT) before acting on someone else's account.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Yetkisiz." }, 401);

  // Scoped to the caller's own JWT, so has_permission() checks the caller,
  // not this function's elevated privileges.
  const asCaller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: allowed, error: permError } = await asCaller.rpc("has_permission", {
    perm: "manage_roles",
  });
  if (permError || !allowed) return json({ error: "Bu işlem için yetkiniz yok." }, 403);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }

  if (body.action === "create") {
    const { data, error } = await admin.auth.admin.createUser({
      email: body.email as string,
      password: body.password as string,
      email_confirm: true,
      user_metadata: { name: body.name, role_id: body.role_id },
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, id: data.user.id });
  }

  if (body.action === "reset_password") {
    const { error } = await admin.auth.admin.updateUserById(body.user_id as string, {
      password: body.password as string,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (body.action === "delete") {
    const { error } = await admin.auth.admin.deleteUser(body.user_id as string);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "Bilinmeyen işlem." }, 400);
});
