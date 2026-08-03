// Shared data shapes for FactoryPilot.
// These describe the JSON we keep in localStorage today, and are meant to map
// cleanly onto real backend tables later.

export type FieldType = "text" | "textarea" | "number" | "select" | "multiselect" | "file";

/**
 * Where a field lives on an order. Order-level fields are filled in once;
 * item-level fields repeat for every line item on the order.
 */
export type FieldScope = "order" | "item";

/**
 * What an order looks like for this business. Every field on the create-order
 * form comes from here — nothing about the business is hardcoded in the UI.
 */
export type FieldDefinition = {
  id: string;
  key: string; // unique, used as the key inside Order.field_values
  label: string;
  type: FieldType;
  options: string[]; // select / multiselect only
  required: boolean;
  scope: FieldScope;
  is_title_field: boolean; // exactly one at a time; used as the order's display name
  position: number;
};

/**
 * A stored file. Small files are kept in full (as a data URL, so they can be
 * opened or downloaded again); larger ones keep only their name and size —
 * localStorage has no room for anything sizeable.
 */
export type StoredFile = {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
};

export type FieldValue = string | number | string[] | StoredFile[] | null;

/** One line on an order — a model, a colour, a quantity. */
export type OrderItem = {
  id: string;
  field_values: Record<string, FieldValue>;
};

export type Order = {
  id: string;
  order_no: string; // human-readable reference, e.g. SP-1004
  current_stage: string; // matches a Stage.name
  created_at: string; // ISO timestamp
  created_by: string;
  field_values: Record<string, FieldValue>; // order-level fields
  items: OrderItem[]; // one entry per line item
};

/** A preset swatch key — see stage-colors.ts for the actual classes. */
export type StageColor =
  | "violet"
  | "blue"
  | "amber"
  | "teal"
  | "fuchsia"
  | "indigo"
  | "orange"
  | "sky"
  | "emerald"
  | "rose"
  | "slate";

export type Stage = {
  id: string;
  name: string;
  position: number; // display order only — orders can move to any stage
  color: StageColor;
};

export type StageHistoryEntry = {
  id: string;
  order_id: string;
  from_stage: string | null; // null when the order was first created
  to_stage: string;
  changed_by: string;
  changed_at: string; // ISO timestamp
};

export type Settings = {
  overdue_threshold_days: number;
};

/**
 * The fixed set of gates a role can hold. Which roles have which permissions
 * is fully configurable; the permission types themselves are not.
 */
export type Permission =
  | "manage_roles"
  | "manage_stages"
  | "manage_fields"
  | "create_order"
  | "move_stage"
  | "view_reporting";

export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
  // True only for the seeded Admin role — it can't be deleted or lose
  // manage_roles, so there's always a way back into role management.
  is_protected?: boolean;
};

export type User = {
  id: string; // matches the Supabase auth user id
  name: string;
  email: string;
  role_id: string;
};
