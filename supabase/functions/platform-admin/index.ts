// Creating a company means creating its first admin login too — that needs
// the service role key (see admin-users' header comment for why that can't
// live in the static frontend). Toggling a company or user active/inactive
// is a plain table update the platform admin can already do via RLS, so it
// isn't handled here — only account creation needs elevated privilege.
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

const DEFAULT_STAGE_NAMES = ["Alındı", "Onaylandı", "Üretimde", "Kalite Kontrol", "Sevk Edildi"];
const DEFAULT_STAGE_COLORS = ["violet", "blue", "sky", "teal", "emerald"];
const ALL_PERMISSIONS = [
  "manage_roles",
  "manage_stages",
  "manage_fields",
  "manage_company",
  "create_order",
  "move_stage",
  "view_reporting",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Yetkisiz." }, 401);

  const asCaller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: isPlatformAdmin, error: permError } = await asCaller.rpc("is_platform_admin");
  if (permError || !isPlatformAdmin) return json({ error: "Bu işlem için yetkiniz yok." }, 403);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }

  if (body.action === "update_user") {
    const userId = String(body.user_id ?? "");
    const name = body.name === undefined ? undefined : String(body.name).trim();
    const email = body.email === undefined ? undefined : String(body.email).trim();
    const password = body.password ? String(body.password) : undefined;
    if (!userId) return json({ error: "Kullanıcı bulunamadı." }, 400);
    if (name === "" || email === "") return json({ error: "Ad ve e-posta boş olamaz." }, 400);

    if (email !== undefined || password !== undefined) {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        ...(email !== undefined ? { email } : {}),
        ...(password !== undefined ? { password } : {}),
      });
      if (authError) return json({ error: authError.message }, 400);
    }

    if (name !== undefined || email !== undefined) {
      const { error: profileError } = await admin
        .from("profiles")
        .update({ ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email } : {}) })
        .eq("id", userId);
      if (profileError) return json({ error: profileError.message }, 400);
    }

    return json({ ok: true });
  }

  if (body.action !== "create_company") {
    return json({ error: "Bilinmeyen işlem." }, 400);
  }

  const name = String(body.name ?? "").trim();
  const adminName = String(body.admin_name ?? "").trim();
  const adminEmail = String(body.admin_email ?? "").trim();
  const adminPassword = String(body.admin_password ?? "");
  if (!name || !adminName || !adminEmail || !adminPassword) {
    return json({ error: "Tüm alanlar zorunludur." }, 400);
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name })
    .select()
    .single();
  if (companyError) return json({ error: companyError.message }, 400);

  const { data: role, error: roleError } = await admin
    .from("roles")
    .insert({ name: "Yönetici", company_id: company.id, permissions: ALL_PERMISSIONS, is_protected: true })
    .select()
    .single();
  if (roleError) return json({ error: roleError.message }, 400);

  const { error: stagesError } = await admin.from("stages").insert(
    DEFAULT_STAGE_NAMES.map((stageName, i) => ({
      name: stageName,
      position: i,
      color: DEFAULT_STAGE_COLORS[i],
      company_id: company.id,
    })),
  );
  if (stagesError) return json({ error: stagesError.message }, 400);

  const { error: fieldsError } = await admin.from("field_definitions").insert([
    {
      key: "client_name",
      label: "Müşteri adı",
      type: "text",
      options: [],
      required: true,
      scope: "order",
      is_title_field: true,
      position: 0,
      company_id: company.id,
    },
    {
      key: "description",
      label: "Açıklama",
      type: "textarea",
      options: [],
      required: true,
      scope: "order",
      is_title_field: false,
      position: 1,
      company_id: company.id,
    },
  ]);
  if (fieldsError) return json({ error: fieldsError.message }, 400);

  const { error: settingsError } = await admin
    .from("settings")
    .insert({ company_id: company.id, overdue_threshold_days: 3 });
  if (settingsError) return json({ error: settingsError.message }, 400);

  const { data: adminUser, error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: adminName, role_id: role.id, company_id: company.id },
  });
  if (userError) return json({ error: userError.message }, 400);

  return json({ ok: true, company_id: company.id, admin_user_id: adminUser.user.id });
});
