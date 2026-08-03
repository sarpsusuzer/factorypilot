"use client";

// The app's data layer. Screens only ever talk to `useData()` — they never
// touch Supabase directly. All mutations are async now (network round-trips),
// unlike the old localStorage version.

import type { Session } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import {
  TYPES_WITH_OPTIONS,
  itemFields,
  keyFromLabel,
  orderFields,
} from "./fields";
import { hasPermission, roleForUser } from "./permissions";
import { colorForPosition } from "./stage-colors";
import { newId, nextOrderNo } from "./storage";
import type {
  FieldDefinition,
  FieldScope,
  FieldValue,
  OrderItem,
  Order,
  Permission,
  Role,
  Settings,
  Stage,
  StageColor,
  StageHistoryEntry,
  User,
} from "./types";

export type Result = { ok: true } | { ok: false; error: string };

type Snapshot = {
  loaded: boolean;
  session: Session | null;
  orders: Order[];
  stages: Stage[];
  fields: FieldDefinition[];
  history: StageHistoryEntry[];
  roles: Role[];
  users: User[];
  settings: Settings;
};

const DEFAULT_SETTINGS: Settings = { overdue_threshold_days: 3 };

const EMPTY: Snapshot = {
  loaded: false,
  session: null,
  orders: [],
  stages: [],
  fields: [],
  history: [],
  roles: [],
  users: [],
  settings: DEFAULT_SETTINGS,
};

let snapshot: Snapshot = EMPTY;
let initialized = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Snapshot {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    void bootstrap();
  }
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return EMPTY;
}

function update(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

async function bootstrap() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  await refetchAll(session);

  supabase.auth.onAuthStateChange((_event, newSession) => {
    void refetchAll(newSession);
  });
}

/**
 * Reloads every table. Anonymous visitors only see what RLS lets them see
 * (roles + profiles, for the login screen's account hints) — everything else
 * comes back empty until they log in, same as the tables just being gated.
 */
async function refetchAll(session: Session | null) {
  const [rolesRes, usersRes, stagesRes, fieldsRes, ordersRes, historyRes, settingsRes] =
    await Promise.all([
      supabase.from("roles").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("stages").select("*").order("position"),
      supabase.from("field_definitions").select("*").order("position"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("stage_history").select("*"),
      supabase.from("settings").select("*").single(),
    ]);

  update({
    loaded: true,
    session,
    roles: rolesRes.data ?? [],
    users: usersRes.data ?? [],
    stages: stagesRes.data ?? [],
    fields: fieldsRes.data ?? [],
    orders: ordersRes.data ?? [],
    history: historyRes.data ?? [],
    settings: settingsRes.data ?? DEFAULT_SETTINGS,
  });
}

// --- Reads -----------------------------------------------------------------

export function getOrder(id: string) {
  return snapshot.orders.find((order) => order.id === id);
}

/** Stage history for one order, newest first. */
export function historyForOrder(orderId: string) {
  return snapshot.history
    .filter((entry) => entry.order_id === orderId)
    .sort((a, b) => Date.parse(b.changed_at) - Date.parse(a.changed_at));
}

// --- Auth --------------------------------------------------------------

export async function login(email: string, password: string): Promise<Result> {
  const trimmed = email.trim();
  if (!trimmed || !password) return { ok: false, error: "E-posta ve şifre zorunludur." };

  const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
  if (error) return { ok: false, error: "E-posta veya şifre hatalı." };
  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}

// --- Orders ----------------------------------------------------------------

export async function createOrder(input: {
  field_values: Record<string, FieldValue>;
  items: { field_values: Record<string, FieldValue> }[];
}): Promise<Result> {
  const firstStage = snapshot.stages[0];
  if (!firstStage) return { ok: false, error: "Sipariş oluşturmadan önce en az bir aşama ekleyin." };

  const userId = snapshot.session?.user.id;
  if (!userId) return { ok: false, error: "Önce giriş yapın." };

  const perOrder = orderFields(snapshot.fields);
  const perItem = itemFields(snapshot.fields);

  const order = {
    id: newId(),
    order_no: nextOrderNo(snapshot.orders),
    current_stage: firstStage.name,
    created_at: new Date().toISOString(),
    created_by: userId,
    field_values: pickValues(perOrder, input.field_values),
    items:
      perItem.length === 0
        ? []
        : input.items.map<OrderItem>((item) => ({
            id: newId(),
            field_values: pickValues(perItem, item.field_values),
          })),
  };

  const { data: inserted, error } = await supabase.from("orders").insert(order).select().single();
  if (error) return { ok: false, error: error.message };

  const historyEntry = {
    id: newId(),
    order_id: inserted.id,
    from_stage: null,
    to_stage: firstStage.name,
    changed_by: userId,
    changed_at: inserted.created_at,
  };
  const { error: historyError } = await supabase.from("stage_history").insert(historyEntry);
  if (historyError) return { ok: false, error: historyError.message };

  update({ orders: [inserted, ...snapshot.orders], history: [...snapshot.history, historyEntry] });
  return { ok: true };
}

function pickValues(fields: FieldDefinition[], values: Record<string, FieldValue>) {
  const picked: Record<string, FieldValue> = {};
  for (const field of fields) {
    const value = values[field.key];
    const trimmed = typeof value === "string" ? value.trim() : value;
    picked[field.key] =
      field.type === "number" && typeof trimmed === "string" && trimmed !== ""
        ? Number(trimmed)
        : (trimmed ?? null);
  }
  return picked;
}

export async function moveOrderToStage(orderId: string, toStage: string): Promise<Result> {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: "Sipariş bulunamadı." };
  if (order.current_stage === toStage) return { ok: false, error: "Sipariş zaten bu aşamada." };
  if (!snapshot.stages.some((stage) => stage.name === toStage))
    return { ok: false, error: "Bilinmeyen aşama." };

  const userId = snapshot.session?.user.id;
  if (!userId) return { ok: false, error: "Önce giriş yapın." };

  const { error } = await supabase.from("orders").update({ current_stage: toStage }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  const historyEntry = {
    id: newId(),
    order_id: orderId,
    from_stage: order.current_stage,
    to_stage: toStage,
    changed_by: userId,
    changed_at: new Date().toISOString(),
  };
  const { error: historyError } = await supabase.from("stage_history").insert(historyEntry);
  if (historyError) return { ok: false, error: historyError.message };

  update({
    orders: snapshot.orders.map((o) => (o.id === orderId ? { ...o, current_stage: toStage } : o)),
    history: [...snapshot.history, historyEntry],
  });
  return { ok: true };
}

export async function deleteOrder(orderId: string): Promise<Result> {
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  update({
    orders: snapshot.orders.filter((order) => order.id !== orderId),
    history: snapshot.history.filter((entry) => entry.order_id !== orderId),
  });
  return { ok: true };
}

// --- Field definitions -----------------------------------------------------

export type FieldInput = {
  label: string;
  key: string;
  type: FieldDefinition["type"];
  options: string[];
  required: boolean;
  scope: FieldScope;
  is_title_field: boolean;
};

function validateFieldInput(input: FieldInput, ignoreId?: string): Result {
  const label = input.label.trim();
  const key = (input.key.trim() || keyFromLabel(label)).toLowerCase();

  if (!label) return { ok: false, error: "Etiket zorunludur." };
  if (!key) return { ok: false, error: "Anahtar zorunludur." };
  if (!/^[a-z][a-z0-9_]*$/.test(key))
    return {
      ok: false,
      error: "Anahtar bir harfle başlamalı; yalnızca küçük harf, rakam ve alt çizgi içerebilir.",
    };
  if (snapshot.fields.some((field) => field.id !== ignoreId && field.key === key))
    return { ok: false, error: `“${key}” anahtarlı bir alan zaten var.` };
  if (TYPES_WITH_OPTIONS.includes(input.type) && input.options.length === 0)
    return { ok: false, error: "Seçim alanı için en az bir seçenek ekleyin." };
  if (input.is_title_field && input.scope === "item")
    return { ok: false, error: "Yalnızca sipariş kapsamındaki bir alan başlık olabilir." };

  return { ok: true };
}

function normalise(input: FieldInput) {
  return {
    label: input.label.trim(),
    key: (input.key.trim() || keyFromLabel(input.label)).toLowerCase(),
    type: input.type,
    options: TYPES_WITH_OPTIONS.includes(input.type)
      ? input.options.map((option) => option.trim()).filter(Boolean)
      : [],
    required: input.required,
    scope: input.scope,
  };
}

function applyTitleFlag(fields: FieldDefinition[], titleId: string | undefined) {
  const eligible = orderFields(fields);
  const wanted = eligible.find((field) => field.id === titleId) ?? eligible[0];
  return fields.map((field) => ({ ...field, is_title_field: field.id === wanted?.id }));
}

async function persistFields(fields: FieldDefinition[]): Promise<Result> {
  const { error } = await supabase.from("field_definitions").upsert(fields);
  if (error) return { ok: false, error: error.message };
  update({ fields });
  return { ok: true };
}

export async function addField(input: FieldInput): Promise<Result> {
  const problem = validateFieldInput(input);
  if (!problem.ok) return problem;

  const field: FieldDefinition = {
    id: newId(),
    ...normalise(input),
    is_title_field: false,
    position: snapshot.fields.length,
  };

  const fields = [...snapshot.fields, field];
  const titleId = input.is_title_field || fields.length === 1 ? field.id : titleFieldId(fields);
  return persistFields(applyTitleFlag(fields, titleId));
}

export async function updateField(fieldId: string, input: FieldInput): Promise<Result> {
  const existing = snapshot.fields.find((field) => field.id === fieldId);
  if (!existing) return { ok: false, error: "Alan bulunamadı." };

  const problem = validateFieldInput(input, fieldId);
  if (!problem.ok) return problem;

  const previousKey = existing.key;
  const next = normalise(input);
  const fields = snapshot.fields.map((field) =>
    field.id === fieldId ? { ...field, ...next } : field,
  );

  const titleId = input.is_title_field ? fieldId : titleFieldId(fields, fieldId);
  const result = await persistFields(applyTitleFlag(fields, titleId));
  if (!result.ok) return result;

  // Values are stored under the key, so a renamed key has to move with it.
  if (next.key !== previousKey) {
    const updated = snapshot.orders.map((order) => {
      const { [previousKey]: moved, ...rest } = order.field_values ?? {};
      return { ...order, field_values: { ...rest, [next.key]: moved ?? null } };
    });
    await Promise.all(
      updated.map((order) =>
        supabase.from("orders").update({ field_values: order.field_values }).eq("id", order.id),
      ),
    );
    update({ orders: updated });
  }
  return { ok: true };
}

function titleFieldId(fields: FieldDefinition[], ignoreId?: string) {
  return fields.find((field) => field.is_title_field && field.id !== ignoreId)?.id;
}

export async function removeField(fieldId: string): Promise<Result> {
  const field = snapshot.fields.find((f) => f.id === fieldId);
  if (!field) return { ok: false, error: "Alan bulunamadı." };

  const { error } = await supabase.from("field_definitions").delete().eq("id", fieldId);
  if (error) return { ok: false, error: error.message };

  const remaining = snapshot.fields.filter((f) => f.id !== fieldId);
  return persistFields(applyTitleFlag(remaining, titleFieldId(remaining)));
}

export async function moveField(fieldId: string, direction: "up" | "down"): Promise<Result> {
  const index = snapshot.fields.findIndex((field) => field.id === fieldId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= snapshot.fields.length) return { ok: true };

  const next = [...snapshot.fields];
  [next[index], next[target]] = [next[target], next[index]];
  const reordered = next.map((field, i) => ({ ...field, position: i }));
  return persistFields(reordered);
}

export async function setTitleField(fieldId: string): Promise<Result> {
  const field = snapshot.fields.find((f) => f.id === fieldId);
  if (!field) return { ok: false, error: "Alan bulunamadı." };
  if (field.scope === "item")
    return { ok: false, error: "Yalnızca sipariş kapsamındaki bir alan başlık olabilir." };
  return persistFields(applyTitleFlag(snapshot.fields, fieldId));
}

// --- Stages ----------------------------------------------------------------

async function persistStages(stages: Stage[]): Promise<Result> {
  const ordered = stages.map((stage, index) => ({ ...stage, position: index }));
  const { error } = await supabase.from("stages").upsert(ordered);
  if (error) return { ok: false, error: error.message };
  update({ stages: ordered });
  return { ok: true };
}

export async function addStage(name: string): Promise<Result> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Aşama adı zorunludur." };
  if (snapshot.stages.some((stage) => stage.name.toLowerCase() === trimmed.toLowerCase()))
    return { ok: false, error: "Bu aşama zaten var." };

  return persistStages([
    ...snapshot.stages,
    {
      id: newId(),
      name: trimmed,
      position: snapshot.stages.length,
      color: colorForPosition(snapshot.stages.length),
    },
  ]);
}

export async function setStageColor(stageId: string, color: StageColor): Promise<Result> {
  if (!snapshot.stages.some((stage) => stage.id === stageId))
    return { ok: false, error: "Aşama bulunamadı." };
  return persistStages(snapshot.stages.map((s) => (s.id === stageId ? { ...s, color } : s)));
}

export async function renameStage(stageId: string, name: string): Promise<Result> {
  const trimmed = name.trim();
  const stage = snapshot.stages.find((s) => s.id === stageId);
  if (!stage) return { ok: false, error: "Aşama bulunamadı." };
  if (!trimmed) return { ok: false, error: "Aşama adı zorunludur." };
  if (
    snapshot.stages.some((s) => s.id !== stageId && s.name.toLowerCase() === trimmed.toLowerCase())
  )
    return { ok: false, error: "Bu aşama zaten var." };

  const result = await persistStages(
    snapshot.stages.map((s) => (s.id === stageId ? { ...s, name: trimmed } : s)),
  );
  if (!result.ok) return result;

  // Orders and history reference stages by name, so carry the rename through.
  await Promise.all([
    supabase.from("orders").update({ current_stage: trimmed }).eq("current_stage", stage.name),
    supabase.from("stage_history").update({ from_stage: trimmed }).eq("from_stage", stage.name),
    supabase.from("stage_history").update({ to_stage: trimmed }).eq("to_stage", stage.name),
  ]);

  update({
    orders: snapshot.orders.map((order) =>
      order.current_stage === stage.name ? { ...order, current_stage: trimmed } : order,
    ),
    history: snapshot.history.map((entry) => ({
      ...entry,
      from_stage: entry.from_stage === stage.name ? trimmed : entry.from_stage,
      to_stage: entry.to_stage === stage.name ? trimmed : entry.to_stage,
    })),
  });
  return { ok: true };
}

export async function removeStage(stageId: string): Promise<Result> {
  const stage = snapshot.stages.find((s) => s.id === stageId);
  if (!stage) return { ok: false, error: "Aşama bulunamadı." };
  if (snapshot.stages.length === 1) return { ok: false, error: "En az bir aşama kalmalı." };

  const inUse = snapshot.orders.filter((order) => order.current_stage === stage.name).length;
  if (inUse > 0)
    return {
      ok: false,
      error: `${inUse} sipariş şu anda “${stage.name}” aşamasında. Önce onları taşıyın.`,
    };

  const { error } = await supabase.from("stages").delete().eq("id", stageId);
  if (error) return { ok: false, error: error.message };

  update({ stages: snapshot.stages.filter((s) => s.id !== stageId) });
  return { ok: true };
}

export async function moveStage(stageId: string, direction: "up" | "down"): Promise<Result> {
  const index = snapshot.stages.findIndex((stage) => stage.id === stageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= snapshot.stages.length) return { ok: true };

  const next = [...snapshot.stages];
  [next[index], next[target]] = [next[target], next[index]];
  return persistStages(next);
}

// --- Roles -------------------------------------------------------------

export type RoleInput = {
  name: string;
  permissions: Permission[];
};

async function persistRoles(roles: Role[]): Promise<Result> {
  const { error } = await supabase.from("roles").upsert(roles);
  if (error) return { ok: false, error: error.message };
  update({ roles });
  return { ok: true };
}

export async function addRole(input: RoleInput): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Rol adı zorunludur." };
  if (snapshot.roles.some((role) => role.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "Bu rol adı zaten var." };

  return persistRoles([
    ...snapshot.roles,
    { id: newId(), name, permissions: [...new Set(input.permissions)] },
  ]);
}

export async function updateRole(roleId: string, input: RoleInput): Promise<Result> {
  const role = snapshot.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rol bulunamadı." };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Rol adı zorunludur." };
  if (snapshot.roles.some((r) => r.id !== roleId && r.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "Bu rol adı zaten var." };

  const permissions = new Set(input.permissions);
  if (role.is_protected) permissions.add("manage_roles");

  return persistRoles(
    snapshot.roles.map((r) => (r.id === roleId ? { ...r, name, permissions: [...permissions] } : r)),
  );
}

export async function toggleRolePermission(roleId: string, permission: Permission): Promise<Result> {
  const role = snapshot.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rol bulunamadı." };
  if (role.is_protected && permission === "manage_roles")
    return { ok: false, error: "Bu rol için rol yönetimi kapatılamaz." };

  const has = role.permissions.includes(permission);
  const permissions = has
    ? role.permissions.filter((p) => p !== permission)
    : [...role.permissions, permission];

  return persistRoles(snapshot.roles.map((r) => (r.id === roleId ? { ...r, permissions } : r)));
}

export async function removeRole(roleId: string): Promise<Result> {
  const role = snapshot.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rol bulunamadı." };
  if (role.is_protected) return { ok: false, error: "Bu rol silinemez." };

  const inUse = snapshot.users.filter((user) => user.role_id === roleId).length;
  if (inUse > 0)
    return {
      ok: false,
      error: `${inUse} kullanıcı bu role sahip. Önce onları başka bir role atayın.`,
    };

  const { error } = await supabase.from("roles").delete().eq("id", roleId);
  if (error) return { ok: false, error: error.message };

  update({ roles: snapshot.roles.filter((r) => r.id !== roleId) });
  return { ok: true };
}

// --- Users -------------------------------------------------------------
// Creating/deleting a login or resetting someone else's password needs the
// Supabase service-role key, which can't live in this static frontend — those
// three actions go through the admin-users edge function instead.

async function callAdminUsers(body: Record<string, unknown>): Promise<Result> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    const message =
      (error as { context?: { error?: string } })?.context?.error ?? error.message;
    return { ok: false, error: message };
  }
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role_id: string;
};

export async function addUser(input: NewUserInput): Promise<Result> {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, error: "Ad zorunludur." };
  if (!email) return { ok: false, error: "E-posta zorunludur." };
  if (!input.password) return { ok: false, error: "Şifre zorunludur." };
  if (!snapshot.roles.some((role) => role.id === input.role_id))
    return { ok: false, error: "Rol bulunamadı." };

  const result = await callAdminUsers({
    action: "create",
    name,
    email,
    password: input.password,
    role_id: input.role_id,
  });
  if (!result.ok) return result;

  const { data } = await supabase.from("profiles").select("*");
  update({ users: data ?? snapshot.users });
  return { ok: true };
}

export type UserInput = {
  name: string;
  role_id: string;
};

function validateUserInput(input: UserInput, ignoreId?: string): Result {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Ad zorunludur." };
  if (!snapshot.roles.some((role) => role.id === input.role_id))
    return { ok: false, error: "Rol bulunamadı." };
  if (
    snapshot.users.some(
      (user) => user.id !== ignoreId && user.name.toLowerCase() === name.toLowerCase(),
    )
  )
    return { ok: false, error: "Bu ada sahip bir kullanıcı zaten var." };
  return { ok: true };
}

export async function updateUser(userId: string, input: UserInput): Promise<Result> {
  const user = snapshot.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };

  const problem = validateUserInput(input, userId);
  if (!problem.ok) return problem;

  const name = input.name.trim();
  const { error } = await supabase
    .from("profiles")
    .update({ name, role_id: input.role_id })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  update({
    users: snapshot.users.map((u) => (u.id === userId ? { ...u, name, role_id: input.role_id } : u)),
  });
  return { ok: true };
}

export async function setUserPassword(userId: string, password: string): Promise<Result> {
  if (!password) return { ok: false, error: "Şifre zorunludur." };
  return callAdminUsers({ action: "reset_password", user_id: userId, password });
}

export async function removeUser(userId: string): Promise<Result> {
  if (snapshot.users.length === 1)
    return { ok: false, error: "En az bir kullanıcı kalmalı — kimlik seçici için gerekli." };

  const result = await callAdminUsers({ action: "delete", user_id: userId });
  if (!result.ok) return result;

  update({ users: snapshot.users.filter((u) => u.id !== userId) });
  return { ok: true };
}

// --- Settings --------------------------------------------------------------

export async function updateSettings(patch: Partial<Settings>): Promise<Result> {
  const settings = { ...snapshot.settings, ...patch };
  const { error } = await supabase.from("settings").update(settings).eq("id", true);
  if (error) return { ok: false, error: error.message };
  update({ settings });
  return { ok: true };
}

// --- Hook ------------------------------------------------------------------

export function useData() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // getSnapshot() only fires the bootstrap on first *read* — this makes sure
  // it also happens on first *mount* even if nothing has re-rendered since.
  useEffect(() => {
    if (typeof window !== "undefined" && !initialized) {
      initialized = true;
      void bootstrap();
    }
  }, []);

  const actingUser = state.users.find((user) => user.id === state.session?.user.id);
  const actingRole = roleForUser(state.users, state.roles, actingUser?.id ?? null);

  return {
    ...state,
    getOrder,
    historyForOrder,
    createOrder,
    moveOrderToStage,
    deleteOrder,
    addStage,
    renameStage,
    removeStage,
    moveStage,
    setStageColor,
    addField,
    updateField,
    removeField,
    moveField,
    setTitleField,
    updateSettings,
    addRole,
    updateRole,
    toggleRolePermission,
    removeRole,
    addUser,
    updateUser,
    removeUser,
    setUserPassword,
    login,
    logout,
    actingUser,
    actingRole,
    can: (permission: Permission) => hasPermission(actingRole, permission),
  };
}
