// Small helpers that used to also own localStorage persistence. Data now
// lives in Supabase (see supabase.ts and data.ts) — this file just keeps the
// bits that are still plain client-side logic.

import type { Order } from "./types";

export function newId(): string {
  return crypto.randomUUID();
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
