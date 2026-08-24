// Deterministic sample data for Storybook.
//
// Components that read `useData()` talk to a module-level store that would
// otherwise bootstrap against Supabase. In Storybook that module is aliased to
// `mocks/data.ts` (see main.ts), which serves this fixture instead — so every
// story renders the same thing on every run, offline, with no auth.

import type {
  Company,
  CompanyMatch,
  FieldDefinition,
  Order,
  Role,
  Settings,
  Stage,
  StageHistoryEntry,
  User,
} from "../src/lib/types";

export const URETICI_ID = "c-uretici";
export const MUSTERI_ID = "c-musteri";

export const companies: Company[] = [
  {
    id: URETICI_ID,
    name: "Demir Tekstil",
    logo_url: null,
    is_active: true,
    created_at: "2026-01-12T09:00:00.000Z",
    company_type: "uretici",
    deleted_at: null,
  },
  {
    id: MUSTERI_ID,
    name: "Kaya Mağazacılık",
    logo_url: null,
    is_active: true,
    created_at: "2026-02-03T09:00:00.000Z",
    company_type: "musteri",
    deleted_at: null,
  },
];

export const companyMatches: CompanyMatch[] = [
  {
    id: "m-1",
    musteri_company_id: MUSTERI_ID,
    uretici_company_id: URETICI_ID,
    created_at: "2026-02-04T09:00:00.000Z",
  },
];

export const roles: Role[] = [
  {
    id: "r-admin",
    name: "Yönetici",
    permissions: [
      "manage_roles",
      "manage_stages",
      "manage_fields",
      "manage_company",
      "create_order",
      "move_stage",
      "view_reporting",
    ],
    is_protected: true,
    company_id: URETICI_ID,
  },
  {
    id: "r-uretim",
    name: "Üretim",
    permissions: ["move_stage", "view_reporting"],
    company_id: URETICI_ID,
  },
  {
    id: "r-satis",
    name: "Satış",
    permissions: ["create_order", "view_reporting"],
    company_id: URETICI_ID,
  },
];

export const users: User[] = [
  {
    id: "u-1",
    name: "Ayşe Demir",
    email: "ayse@demirtekstil.com",
    role_id: "r-admin",
    company_id: URETICI_ID,
    is_active: true,
    is_platform_admin: false,
  },
  {
    id: "u-2",
    name: "Mehmet Yıldız",
    email: "mehmet@demirtekstil.com",
    role_id: "r-uretim",
    company_id: URETICI_ID,
    is_active: true,
    is_platform_admin: false,
  },
  {
    id: "u-3",
    name: "Zeynep Kaya",
    email: "zeynep@kayamagaza.com",
    role_id: "r-satis",
    company_id: MUSTERI_ID,
    is_active: false,
    is_platform_admin: false,
  },
];

export const stages: Stage[] = [
  { id: "s-1", name: "Alındı", position: 0, color: "violet", company_id: URETICI_ID },
  { id: "s-2", name: "Kesim", position: 1, color: "blue", company_id: URETICI_ID },
  { id: "s-3", name: "Dikim", position: 2, color: "teal", company_id: URETICI_ID },
  { id: "s-4", name: "Ütü & Paket", position: 3, color: "amber", company_id: URETICI_ID },
  { id: "s-5", name: "Sevk edildi", position: 4, color: "emerald", company_id: URETICI_ID },
];

export const fields: FieldDefinition[] = [
  {
    id: "f-1",
    key: "musteri",
    label: "Müşteri",
    type: "text",
    options: [],
    required: true,
    scope: "order",
    is_title_field: true,
    position: 0,
    company_id: URETICI_ID,
  },
  {
    id: "f-2",
    key: "termin",
    label: "Termin tarihi",
    type: "text",
    options: [],
    required: true,
    scope: "order",
    is_title_field: false,
    position: 1,
    company_id: URETICI_ID,
  },
  {
    id: "f-3",
    key: "notlar",
    label: "Notlar",
    type: "textarea",
    options: [],
    required: false,
    scope: "order",
    is_title_field: false,
    position: 2,
    company_id: URETICI_ID,
  },
  {
    id: "f-4",
    key: "model",
    label: "Model",
    type: "select",
    options: ["Bisiklet yaka", "V yaka", "Polo"],
    required: true,
    scope: "item",
    is_title_field: false,
    position: 3,
    company_id: URETICI_ID,
  },
  {
    id: "f-5",
    key: "adet",
    label: "Adet",
    type: "number",
    options: [],
    required: true,
    scope: "item",
    is_title_field: false,
    position: 4,
    company_id: URETICI_ID,
  },
  {
    id: "f-6",
    key: "bedenler",
    label: "Bedenler",
    type: "multiselect",
    options: ["S", "M", "L", "XL"],
    required: false,
    scope: "item",
    is_title_field: false,
    position: 5,
    company_id: URETICI_ID,
  },
  {
    id: "f-7",
    key: "teknik_cizim",
    label: "Teknik çizim",
    type: "file",
    options: [],
    required: false,
    scope: "order",
    is_title_field: false,
    position: 6,
    company_id: URETICI_ID,
  },
];

function order(
  id: string,
  orderNo: string,
  stage: string,
  musteri: string,
  createdAt: string,
): Order {
  return {
    id,
    order_no: orderNo,
    current_stage: stage,
    created_at: createdAt,
    created_by: "u-1",
    field_values: { musteri, termin: "2026-09-15", notlar: "" },
    items: [
      { id: `${id}-i1`, field_values: { model: "Bisiklet yaka", adet: 250, bedenler: ["M", "L"] } },
    ],
    company_id: URETICI_ID,
    customer_company_id: null,
  };
}

export const orders: Order[] = [
  order("o-1", "SP-1001", "Alındı", "Kaya Mağazacılık", "2026-08-20T08:00:00.000Z"),
  order("o-2", "SP-1002", "Kesim", "Kaya Mağazacılık", "2026-08-18T08:00:00.000Z"),
  order("o-3", "SP-1003", "Kesim", "Öz Giyim", "2026-08-17T08:00:00.000Z"),
  order("o-4", "SP-1004", "Dikim", "Öz Giyim", "2026-08-12T08:00:00.000Z"),
  order("o-5", "SP-1005", "Dikim", "Nar Tekstil", "2026-08-10T08:00:00.000Z"),
  order("o-6", "SP-1006", "Ütü & Paket", "Nar Tekstil", "2026-08-05T08:00:00.000Z"),
  order("o-7", "SP-1007", "Sevk edildi", "Kaya Mağazacılık", "2026-07-28T08:00:00.000Z"),
  order("o-8", "SP-1008", "Sevk edildi", "Öz Giyim", "2026-07-21T08:00:00.000Z"),
];

export const history: StageHistoryEntry[] = orders.flatMap((o, index) => {
  const upTo = stages.findIndex((s) => s.name === o.current_stage);
  return stages.slice(0, upTo + 1).map((stage, step) => ({
    id: `h-${index}-${step}`,
    order_id: o.id,
    from_stage: step === 0 ? null : stages[step - 1].name,
    to_stage: stage.name,
    changed_by: "u-1",
    changed_at: new Date(Date.parse(o.created_at) + step * 36e5 * 20).toISOString(),
    company_id: URETICI_ID,
  }));
});

export const settings: Settings = { overdue_threshold_days: 3 };

/** Stands in for a Supabase session — only `session.user.id` is ever read. */
export const session = { user: { id: "u-1" } };
