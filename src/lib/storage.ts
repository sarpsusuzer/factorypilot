// The only place that knows data lives in localStorage.
// When a real backend replaces this, everything above this file stays the same.

import { ALL_PERMISSIONS } from "./permissions";
import { colorForPosition } from "./stage-colors";
import type {
  FieldDefinition,
  Order,
  Role,
  Settings,
  Stage,
  StageHistoryEntry,
  User,
} from "./types";

const KEYS = {
  orders: "factorypilot.orders",
  stages: "factorypilot.stages",
  fields: "factorypilot.field_definitions",
  history: "factorypilot.stage_history",
  settings: "factorypilot.settings",
  roles: "factorypilot.roles",
  users: "factorypilot.users",
} as const;

const ADMIN_ROLE_NAME = "Yönetici";
const DEFAULT_USER_NAME = "Yönetici";

export const DEFAULT_STAGE_NAMES = [
  "Alındı",
  "Onaylandı",
  "Üretimde",
  "Kalite Kontrol",
  "Sevk Edildi",
];

export const DEFAULT_SETTINGS: Settings = {
  overdue_threshold_days: 3,
  acting_user_id: null,
};

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the prototype keeps working in memory.
  }
}

function seedStages(): Stage[] {
  return DEFAULT_STAGE_NAMES.map((name, index) => ({
    id: newId(),
    name,
    position: index,
    // The last default stage reads as "done", the rest cycle through the palette.
    color: index === DEFAULT_STAGE_NAMES.length - 1 ? "emerald" : colorForPosition(index),
  }));
}

/**
 * A neutral starting configuration. Every business is expected to replace this
 * on the Order fields screen — nothing here is assumed by the code.
 */
function seedFields(): FieldDefinition[] {
  return [
    {
      id: newId(),
      key: "client_name",
      label: "Müşteri adı",
      type: "text",
      options: [],
      required: true,
      scope: "order",
      is_title_field: true,
      position: 0,
    },
    {
      id: newId(),
      key: "description",
      label: "Açıklama",
      type: "textarea",
      options: [],
      required: true,
      scope: "order",
      is_title_field: false,
      position: 1,
    },
  ];
}

/**
 * The bootstrap Admin role — seeded once, holds every permission, and can
 * never lose `manage_roles` or be deleted. Without this there would be no
 * guaranteed way back into role management if every role got misconfigured.
 */
function seedRoles(): Role[] {
  return [
    {
      id: newId(),
      name: ADMIN_ROLE_NAME,
      permissions: [...ALL_PERMISSIONS],
      is_protected: true,
    },
  ];
}

/** One user on the Admin role, so the identity picker is never empty. */
function seedUsers(adminRoleId: string): User[] {
  return [{ id: newId(), name: DEFAULT_USER_NAME, role_id: adminRoleId }];
}

const ORDER_NO_PREFIX = "SP-";
const FIRST_ORDER_NO = 1001;

/** Next order reference, one above the highest already in use. */
export function nextOrderNo(orders: Order[]) {
  const highest = orders.reduce((max, order) => {
    const value = Number(order.order_no?.replace(ORDER_NO_PREFIX, ""));
    return Number.isFinite(value) && value > max ? value : max;
  }, FIRST_ORDER_NO - 1);
  return `${ORDER_NO_PREFIX}${highest + 1}`;
}

/**
 * Brings older saved orders up to the current shape: order numbers were added
 * later, and client_name/description used to be columns rather than
 * configurable fields.
 */
type LegacyOrder = Order & { client_name?: string; description?: string };

function migrateOrders(stored: LegacyOrder[]) {
  const needsWork = stored.some(
    (order) => !order.order_no || !order.field_values || !Array.isArray(order.items),
  );
  if (!needsWork) return stored;

  const oldestFirst = [...stored].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );
  const numbers = new Map<string, string>();
  oldestFirst.forEach((order, index) => {
    numbers.set(order.id, order.order_no || `${ORDER_NO_PREFIX}${FIRST_ORDER_NO + index}`);
  });

  const migrated = stored.map(({ client_name, description, ...order }) => ({
    ...order,
    order_no: numbers.get(order.id)!,
    field_values:
      order.field_values ??
      ({ client_name: client_name ?? "", description: description ?? "" } as Order["field_values"]),
    // Orders created before line items existed simply have none.
    items: Array.isArray(order.items) ? order.items : [],
  }));

  write(KEYS.orders, migrated);
  return migrated;
}

/** Loads everything at once, seeding stages and fields on first run. */
export function loadAll() {
  const storedStages = read<Stage[] | null>(KEYS.stages, null);
  const stages = storedStages && storedStages.length > 0 ? storedStages : seedStages();
  if (!storedStages || storedStages.length === 0) write(KEYS.stages, stages);
  // Stages saved before colours existed get one assigned by position.
  if (storedStages?.some((stage) => !stage.color)) {
    stages.forEach((stage, index) => (stage.color = stage.color ?? colorForPosition(index)));
    write(KEYS.stages, stages);
  }

  // An empty field list is a valid state (the user removed everything), so only
  // seed when the key has never been written.
  const storedFields = read<FieldDefinition[] | null>(KEYS.fields, null);
  const fields = storedFields ?? seedFields();
  if (!storedFields) write(KEYS.fields, fields);
  // Fields defined before scopes existed are order-level.
  if (storedFields?.some((field) => !field.scope)) {
    fields.forEach((field) => (field.scope = field.scope ?? "order"));
    write(KEYS.fields, fields);
  }

  // Roles and users are seeded together on first run — a fresh user list with
  // no Admin role to assign would be a broken bootstrap. An empty roles list
  // is never valid (the protected Admin role can't be deleted), so it's
  // reseeded the same as a missing one.
  const storedRoles = read<Role[] | null>(KEYS.roles, null);
  const roles = storedRoles && storedRoles.length > 0 ? storedRoles : seedRoles();
  if (!storedRoles || storedRoles.length === 0) write(KEYS.roles, roles);

  const adminRole = roles.find((role) => role.is_protected) ?? roles[0];
  const storedUsers = read<User[] | null>(KEYS.users, null);
  const users = storedUsers && storedUsers.length > 0 ? storedUsers : seedUsers(adminRole.id);
  if (!storedUsers || storedUsers.length === 0) write(KEYS.users, users);

  return {
    orders: migrateOrders(read<LegacyOrder[]>(KEYS.orders, [])),
    stages: [...stages].sort((a, b) => a.position - b.position),
    fields: [...fields].sort((a, b) => a.position - b.position),
    history: read<StageHistoryEntry[]>(KEYS.history, []),
    roles,
    users,
    settings: { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) },
  };
}

export const saveOrders = (orders: Order[]) => write(KEYS.orders, orders);
export const saveStages = (stages: Stage[]) => write(KEYS.stages, stages);
export const saveFields = (fields: FieldDefinition[]) => write(KEYS.fields, fields);
export const saveHistory = (history: StageHistoryEntry[]) => write(KEYS.history, history);
export const saveSettings = (settings: Settings) => write(KEYS.settings, settings);
export const saveRoles = (roles: Role[]) => write(KEYS.roles, roles);
export const saveUsers = (users: User[]) => write(KEYS.users, users);

export function clearAll() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}
