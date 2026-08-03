"use client";

// The app's data layer. Screens only ever talk to `useData()` — they never
// touch localStorage directly. Swapping in a real backend later means
// rewriting this file (and storage.ts) and nothing else.
//
// Data lives in a small module-level store that React subscribes to, which is
// the standard way to read from an external system like localStorage.

import { useSyncExternalStore } from "react";
import {
  DEFAULT_SETTINGS,
  clearAll,
  loadAll,
  newId,
  nextOrderNo,
  saveFields,
  saveHistory,
  saveOrders,
  saveRoles,
  saveSettings,
  saveStages,
  saveUsers,
} from "./storage";
import {
  TYPES_WITH_OPTIONS,
  itemFields,
  keyFromLabel,
  orderFields,
} from "./fields";
import { hasPermission, roleForUser } from "./permissions";
import { colorForPosition } from "./stage-colors";
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
  orders: Order[];
  stages: Stage[];
  fields: FieldDefinition[];
  history: StageHistoryEntry[];
  roles: Role[];
  users: User[];
  settings: Settings;
};

const EMPTY: Snapshot = {
  loaded: false,
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

/** Reads storage once, on the first client render. */
function getSnapshot(): Snapshot {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    snapshot = { loaded: true, ...loadAll() };
  }
  return snapshot;
}

/** Server rendering has no localStorage, so it always renders the empty state. */
function getServerSnapshot(): Snapshot {
  return EMPTY;
}

function update(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

function setOrders(orders: Order[]) {
  saveOrders(orders);
  update({ orders });
}

function setStages(stages: Stage[]) {
  // Position always mirrors list order, so reordering is just a re-index.
  const ordered = stages.map((stage, index) => ({ ...stage, position: index }));
  saveStages(ordered);
  update({ stages: ordered });
}

function setFields(fields: FieldDefinition[]) {
  const ordered = fields.map((field, index) => ({ ...field, position: index }));
  saveFields(ordered);
  update({ fields: ordered });
}

function setHistory(history: StageHistoryEntry[]) {
  saveHistory(history);
  update({ history });
}

function setRoles(roles: Role[]) {
  saveRoles(roles);
  update({ roles });
}

function setUsers(users: User[]) {
  saveUsers(users);
  update({ users });
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

// --- Orders ----------------------------------------------------------------

export function createOrder(input: {
  field_values: Record<string, FieldValue>;
  items: { field_values: Record<string, FieldValue> }[];
}): Result {
  const firstStage = snapshot.stages[0];
  if (!firstStage) return { ok: false, error: "Sipariş oluşturmadan önce en az bir aşama ekleyin." };

  // Attribution comes from the acting identity, not free-typed text — the
  // screen that calls this is gated by create_order, so this shouldn't fire.
  const actingUserId = snapshot.settings.acting_user_id;
  if (!actingUserId) return { ok: false, error: "Önce bir kimlik seçin." };

  const perOrder = orderFields(snapshot.fields);
  const perItem = itemFields(snapshot.fields);
  const now = new Date().toISOString();

  const order: Order = {
    id: newId(),
    order_no: nextOrderNo(snapshot.orders),
    current_stage: firstStage.name,
    created_at: now,
    created_by: actingUserId,
    // Only values for fields that are actually configured get stored.
    field_values: pickValues(perOrder, input.field_values),
    items: perItem.length === 0
      ? []
      : input.items.map<OrderItem>((item) => ({
          id: newId(),
          field_values: pickValues(perItem, item.field_values),
        })),
  };

  setOrders([order, ...snapshot.orders]);
  // The starting stage is recorded in history automatically.
  setHistory([
    ...snapshot.history,
    {
      id: newId(),
      order_id: order.id,
      from_stage: null,
      to_stage: firstStage.name,
      changed_by: order.created_by,
      changed_at: now,
    },
  ]);
  return { ok: true };
}

function pickValues(fields: FieldDefinition[], values: Record<string, FieldValue>) {
  const picked: Record<string, FieldValue> = {};
  for (const field of fields) {
    const value = values[field.key];
    const trimmed = typeof value === "string" ? value.trim() : value;
    // Number fields are stored as numbers, not as the text typed into the input.
    picked[field.key] =
      field.type === "number" && typeof trimmed === "string" && trimmed !== ""
        ? Number(trimmed)
        : (trimmed ?? null);
  }
  return picked;
}

export function moveOrderToStage(orderId: string, toStage: string): Result {
  const order = snapshot.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: "Sipariş bulunamadı." };
  if (order.current_stage === toStage) return { ok: false, error: "Sipariş zaten bu aşamada." };
  if (!snapshot.stages.some((stage) => stage.name === toStage))
    return { ok: false, error: "Bilinmeyen aşama." };

  const actingUserId = snapshot.settings.acting_user_id;
  if (!actingUserId) return { ok: false, error: "Önce bir kimlik seçin." };

  setOrders(
    snapshot.orders.map((o) => (o.id === orderId ? { ...o, current_stage: toStage } : o)),
  );
  setHistory([
    ...snapshot.history,
    {
      id: newId(),
      order_id: orderId,
      from_stage: order.current_stage,
      to_stage: toStage,
      changed_by: actingUserId,
      changed_at: new Date().toISOString(),
    },
  ]);
  return { ok: true };
}

export function deleteOrder(orderId: string) {
  setOrders(snapshot.orders.filter((order) => order.id !== orderId));
  setHistory(snapshot.history.filter((entry) => entry.order_id !== orderId));
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

/** Shared checks for adding and editing; `ignoreId` skips the field being edited. */
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

/** Exactly one field carries the title flag. */
function applyTitleFlag(fields: FieldDefinition[], titleId: string | undefined) {
  const eligible = orderFields(fields);
  const wanted = eligible.find((field) => field.id === titleId) ?? eligible[0];
  return fields.map((field) => ({ ...field, is_title_field: field.id === wanted?.id }));
}

export function addField(input: FieldInput): Result {
  const problem = validateFieldInput(input);
  if (!problem.ok) return problem;

  const field: FieldDefinition = {
    id: newId(),
    ...normalise(input),
    is_title_field: false,
    position: snapshot.fields.length,
  };

  const fields = [...snapshot.fields, field];
  // The first field ever added has to be the title field.
  const titleId = input.is_title_field || fields.length === 1 ? field.id : titleFieldId(fields);
  setFields(applyTitleFlag(fields, titleId));
  return { ok: true };
}

export function updateField(fieldId: string, input: FieldInput): Result {
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
  setFields(applyTitleFlag(fields, titleId));

  // Values are stored under the key, so a renamed key has to move with it.
  if (next.key !== previousKey) {
    setOrders(
      snapshot.orders.map((order) => {
        const { [previousKey]: moved, ...rest } = order.field_values ?? {};
        return { ...order, field_values: { ...rest, [next.key]: moved ?? null } };
      }),
    );
  }
  return { ok: true };
}

/** Current title field id, optionally ignoring one field that is being changed. */
function titleFieldId(fields: FieldDefinition[], ignoreId?: string) {
  return fields.find((field) => field.is_title_field && field.id !== ignoreId)?.id;
}

export function removeField(fieldId: string): Result {
  const field = snapshot.fields.find((f) => f.id === fieldId);
  if (!field) return { ok: false, error: "Alan bulunamadı." };

  const remaining = snapshot.fields.filter((f) => f.id !== fieldId);
  // If the title field went, the first remaining field takes over.
  setFields(applyTitleFlag(remaining, titleFieldId(remaining)));
  return { ok: true };
}

export function moveField(fieldId: string, direction: "up" | "down") {
  const index = snapshot.fields.findIndex((field) => field.id === fieldId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= snapshot.fields.length) return;

  const next = [...snapshot.fields];
  [next[index], next[target]] = [next[target], next[index]];
  setFields(next);
}

export function setTitleField(fieldId: string): Result {
  const field = snapshot.fields.find((f) => f.id === fieldId);
  if (!field) return { ok: false, error: "Alan bulunamadı." };
  if (field.scope === "item")
    return { ok: false, error: "Yalnızca sipariş kapsamındaki bir alan başlık olabilir." };
  setFields(applyTitleFlag(snapshot.fields, fieldId));
  return { ok: true };
}

/** Replaces the whole configuration in one go — used by the example presets. */
export function replaceFields(inputs: FieldInput[]): Result {
  const fields: FieldDefinition[] = [];
  for (const [index, input] of inputs.entries()) {
    fields.push({
      id: newId(),
      ...normalise(input),
      is_title_field: false,
      position: index,
    });
  }

  const titleIndex = inputs.findIndex((input) => input.is_title_field);
  setFields(applyTitleFlag(fields, fields[titleIndex >= 0 ? titleIndex : 0]?.id));
  return { ok: true };
}

// --- Stages ----------------------------------------------------------------

export function addStage(name: string): Result {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Aşama adı zorunludur." };
  if (snapshot.stages.some((stage) => stage.name.toLowerCase() === trimmed.toLowerCase()))
    return { ok: false, error: "Bu aşama zaten var." };

  setStages([
    ...snapshot.stages,
    {
      id: newId(),
      name: trimmed,
      position: snapshot.stages.length,
      color: colorForPosition(snapshot.stages.length),
    },
  ]);
  return { ok: true };
}

export function setStageColor(stageId: string, color: StageColor): Result {
  if (!snapshot.stages.some((stage) => stage.id === stageId))
    return { ok: false, error: "Aşama bulunamadı." };
  setStages(snapshot.stages.map((s) => (s.id === stageId ? { ...s, color } : s)));
  return { ok: true };
}

export function renameStage(stageId: string, name: string): Result {
  const trimmed = name.trim();
  const stage = snapshot.stages.find((s) => s.id === stageId);
  if (!stage) return { ok: false, error: "Aşama bulunamadı." };
  if (!trimmed) return { ok: false, error: "Aşama adı zorunludur." };
  if (
    snapshot.stages.some(
      (s) => s.id !== stageId && s.name.toLowerCase() === trimmed.toLowerCase(),
    )
  )
    return { ok: false, error: "Bu aşama zaten var." };

  setStages(snapshot.stages.map((s) => (s.id === stageId ? { ...s, name: trimmed } : s)));
  // Orders and history reference stages by name, so carry the rename through.
  setOrders(
    snapshot.orders.map((order) =>
      order.current_stage === stage.name ? { ...order, current_stage: trimmed } : order,
    ),
  );
  setHistory(
    snapshot.history.map((entry) => ({
      ...entry,
      from_stage: entry.from_stage === stage.name ? trimmed : entry.from_stage,
      to_stage: entry.to_stage === stage.name ? trimmed : entry.to_stage,
    })),
  );
  return { ok: true };
}

export function removeStage(stageId: string): Result {
  const stage = snapshot.stages.find((s) => s.id === stageId);
  if (!stage) return { ok: false, error: "Aşama bulunamadı." };
  if (snapshot.stages.length === 1) return { ok: false, error: "En az bir aşama kalmalı." };

  const inUse = snapshot.orders.filter((order) => order.current_stage === stage.name).length;
  if (inUse > 0)
    return {
      ok: false,
      error: `${inUse} sipariş şu anda “${stage.name}” aşamasında. Önce onları taşıyın.`,
    };

  setStages(snapshot.stages.filter((s) => s.id !== stageId));
  return { ok: true };
}

export function moveStage(stageId: string, direction: "up" | "down") {
  const index = snapshot.stages.findIndex((stage) => stage.id === stageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= snapshot.stages.length) return;

  const next = [...snapshot.stages];
  [next[index], next[target]] = [next[target], next[index]];
  setStages(next);
}

// --- Roles -------------------------------------------------------------

export type RoleInput = {
  name: string;
  permissions: Permission[];
};

export function addRole(input: RoleInput): Result {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Rol adı zorunludur." };
  if (snapshot.roles.some((role) => role.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "Bu rol adı zaten var." };

  setRoles([
    ...snapshot.roles,
    { id: newId(), name, permissions: [...new Set(input.permissions)] },
  ]);
  return { ok: true };
}

export function updateRole(roleId: string, input: RoleInput): Result {
  const role = snapshot.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rol bulunamadı." };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Rol adı zorunludur." };
  if (snapshot.roles.some((r) => r.id !== roleId && r.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "Bu rol adı zaten var." };

  const permissions = new Set(input.permissions);
  // The bootstrap role can never lose its way back into role management.
  if (role.is_protected) permissions.add("manage_roles");

  setRoles(
    snapshot.roles.map((r) => (r.id === roleId ? { ...r, name, permissions: [...permissions] } : r)),
  );
  return { ok: true };
}

/** Flips one permission on one role — the inline checkbox action. */
export function toggleRolePermission(roleId: string, permission: Permission): Result {
  const role = snapshot.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rol bulunamadı." };
  if (role.is_protected && permission === "manage_roles")
    return { ok: false, error: "Bu rol için rol yönetimi kapatılamaz." };

  const has = role.permissions.includes(permission);
  const permissions = has
    ? role.permissions.filter((p) => p !== permission)
    : [...role.permissions, permission];

  setRoles(snapshot.roles.map((r) => (r.id === roleId ? { ...r, permissions } : r)));
  return { ok: true };
}

export function removeRole(roleId: string): Result {
  const role = snapshot.roles.find((r) => r.id === roleId);
  if (!role) return { ok: false, error: "Rol bulunamadı." };
  if (role.is_protected) return { ok: false, error: "Bu rol silinemez." };

  const inUse = snapshot.users.filter((user) => user.role_id === roleId).length;
  if (inUse > 0)
    return {
      ok: false,
      error: `${inUse} kullanıcı bu role sahip. Önce onları başka bir role atayın.`,
    };

  setRoles(snapshot.roles.filter((r) => r.id !== roleId));
  return { ok: true };
}

// --- Users ---------------------------------------------------------------

export type UserInput = {
  name: string;
  role_id: string;
};

function validateUserInput(input: UserInput, ignoreId?: string): Result {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Ad zorunludur." };
  if (!snapshot.roles.some((role) => role.id === input.role_id))
    return { ok: false, error: "Rol bulunamadı." };
  if (snapshot.users.some((user) => user.id !== ignoreId && user.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "Bu ada sahip bir kullanıcı zaten var." };
  return { ok: true };
}

export function addUser(input: UserInput): Result {
  const problem = validateUserInput(input);
  if (!problem.ok) return problem;

  setUsers([...snapshot.users, { id: newId(), name: input.name.trim(), role_id: input.role_id }]);
  return { ok: true };
}

export function updateUser(userId: string, input: UserInput): Result {
  const user = snapshot.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };

  const problem = validateUserInput(input, userId);
  if (!problem.ok) return problem;

  setUsers(
    snapshot.users.map((u) =>
      u.id === userId ? { ...u, name: input.name.trim(), role_id: input.role_id } : u,
    ),
  );
  return { ok: true };
}

export function removeUser(userId: string): Result {
  const user = snapshot.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (snapshot.users.length === 1)
    return { ok: false, error: "En az bir kullanıcı kalmalı — kimlik seçici için gerekli." };

  setUsers(snapshot.users.filter((u) => u.id !== userId));
  // Acting as a user that no longer exists would silently break attribution.
  if (snapshot.settings.acting_user_id === userId) {
    updateSettings({ acting_user_id: null });
  }
  return { ok: true };
}

export function setActingUser(userId: string): Result {
  if (!snapshot.users.some((user) => user.id === userId))
    return { ok: false, error: "Kullanıcı bulunamadı." };
  updateSettings({ acting_user_id: userId });
  return { ok: true };
}

// --- Settings --------------------------------------------------------------

export function updateSettings(patch: Partial<Settings>) {
  const settings = { ...snapshot.settings, ...patch };
  saveSettings(settings);
  update({ settings });
}

export function resetAllData() {
  clearAll();
  update({ ...loadAll(), loaded: true });
}

// --- Hook ------------------------------------------------------------------

export function useData() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const actingRole = roleForUser(state.users, state.roles, state.settings.acting_user_id);
  const actingUser = state.users.find((user) => user.id === state.settings.acting_user_id);

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
    replaceFields,
    updateSettings,
    resetAllData,
    // Roles, users and the acting identity — not real security, see roles.ts.
    addRole,
    updateRole,
    toggleRolePermission,
    removeRole,
    addUser,
    updateUser,
    removeUser,
    setActingUser,
    actingUser,
    actingRole,
    can: (permission: Permission) => hasPermission(actingRole, permission),
  };
}
