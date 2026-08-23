// Storybook's stand-in for `@/lib/data`.
//
// The real module is a `useSyncExternalStore` singleton that bootstraps against
// Supabase on first read. main.ts aliases `@/lib/data` to this file so stories
// render against ../fixtures.ts instead — no network, no auth, no flake.
//
// Stories override slices of it with `parameters: { data: { ... } }`; the
// global decorator in preview.tsx calls `setMockData()` before each render.

import { hasPermission, roleForUser } from "../../src/lib/permissions";
import type { Permission } from "../../src/lib/types";
import * as fixtures from "../fixtures";

// Type-only — erased at build time, so this does not re-enter the real module.
export type { Result, FieldInput, RoleInput, NewUserInput, UserInput, CompanyInput } from "../../src/lib/data";

type Snapshot = {
  loaded: boolean;
  session: unknown;
  orders: typeof fixtures.orders;
  stages: typeof fixtures.stages;
  fields: typeof fixtures.fields;
  history: typeof fixtures.history;
  roles: typeof fixtures.roles;
  users: typeof fixtures.users;
  companies: typeof fixtures.companies;
  companyMatches: typeof fixtures.companyMatches;
  settings: typeof fixtures.settings;
};

export const DEFAULT_SNAPSHOT: Snapshot = {
  loaded: true,
  session: fixtures.session,
  orders: fixtures.orders,
  stages: fixtures.stages,
  fields: fixtures.fields,
  history: fixtures.history,
  roles: fixtures.roles,
  users: fixtures.users,
  companies: fixtures.companies,
  companyMatches: fixtures.companyMatches,
  settings: fixtures.settings,
};

let snapshot: Snapshot = DEFAULT_SNAPSHOT;

/** Replaces the store for the next render. Called by the preview decorator. */
export function setMockData(patch: Partial<Snapshot> = {}) {
  snapshot = { ...DEFAULT_SNAPSHOT, ...patch };
}

/** Every mutation is a no-op that logs to the Actions panel and succeeds. */
const noop = (name: string) => async (...args: unknown[]) => {
  console.info(`[storybook] ${name}(${args.map((a) => JSON.stringify(a)).join(", ")})`);
  return { ok: true } as const;
};

export function useData() {
  const actingUser = snapshot.users.find(
    (user) => user.id === (snapshot.session as { user?: { id: string } } | null)?.user?.id,
  );
  const actingRole = roleForUser(snapshot.users, snapshot.roles, actingUser?.id ?? null);
  const company = snapshot.companies.find((c) => c.id === actingUser?.company_id);

  return {
    ...snapshot,
    getOrder: (id: string) => snapshot.orders.find((o) => o.id === id),
    historyForOrder: (orderId: string) =>
      snapshot.history.filter((entry) => entry.order_id === orderId),
    createOrder: noop("createOrder"),
    moveOrderToStage: noop("moveOrderToStage"),
    deleteOrder: noop("deleteOrder"),
    addStage: noop("addStage"),
    renameStage: noop("renameStage"),
    removeStage: noop("removeStage"),
    moveStage: noop("moveStage"),
    setStageColor: noop("setStageColor"),
    addField: noop("addField"),
    updateField: noop("updateField"),
    removeField: noop("removeField"),
    moveField: noop("moveField"),
    setTitleField: noop("setTitleField"),
    updateSettings: noop("updateSettings"),
    addRole: noop("addRole"),
    updateRole: noop("updateRole"),
    toggleRolePermission: noop("toggleRolePermission"),
    removeRole: noop("removeRole"),
    addUser: noop("addUser"),
    updateUser: noop("updateUser"),
    removeUser: noop("removeUser"),
    setUserPassword: noop("setUserPassword"),
    login: noop("login"),
    logout: noop("logout"),
    createCompany: noop("createCompany"),
    renameCompany: noop("renameCompany"),
    updateCompanyAdmin: noop("updateCompanyAdmin"),
    setCompanyActive: noop("setCompanyActive"),
    setCompanyType: noop("setCompanyType"),
    setUserActive: noop("setUserActive"),
    uploadCompanyLogo: noop("uploadCompanyLogo"),
    addCompanyMatch: noop("addCompanyMatch"),
    removeCompanyMatch: noop("removeCompanyMatch"),
    actingUser,
    actingRole,
    company,
    can: (permission: Permission) => hasPermission(actingRole, permission),
  };
}
