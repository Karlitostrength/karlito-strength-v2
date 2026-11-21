// ============================================================
// KARLITO STRENGTH — PACKAGES & PAYMENTS (coach side)
// All business rules (balance, validity, 12h, invoices) live in Supabase.
// This file only calls them.
// ============================================================
import { supabase } from "./supabase";

function unwrap({ data, error }) {
  if (error) throw new Error(error.message || "Database error");
  return data;
}

// ---------- labels & formatting ----------
export const STATUS_LABELS = {
  done: "Done",
  cancelled_early: "Cancelled in time",
  cancelled_late: "Late cancel",
  no_show: "No-show",
};
export const STATUS_COUNTS = { done: true, cancelled_early: false, cancelled_late: true, no_show: true };
export const WEEKDAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const METHOD_LABELS = { cash: "Cash", transfer: "Transfer", revolut: "Revolut" };

export function formatGBP(n) {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  return "£" + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
}
export function formatDate(d) {
  if (!d) return "no expiry";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
}
export function formatDateTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}
export function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
export function lastValidDay(expiresAt) {
  return expiresAt ? new Date(new Date(expiresAt).getTime() - 60000) : null;
}
export function isEndingSoon(b) {
  const d = daysUntil(b.next_expiry);
  return (b.sessions_left <= 2 && !b.has_online) || (d !== null && d <= 7);
}
export function portalLink(token) {
  return `${window.location.origin}/k/${token}`;
}
// 'YYYY-MM-DDTHH:mm' for <input type="datetime-local"> (local time)
export function toLocalInput(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- shared ----------
export async function getPackages({ includeHidden = false } = {}) {
  let q = supabase.from("packages").select("*").order("sort_order");
  if (!includeHidden) q = q.eq("active", true);
  return unwrap(await q);
}

// ---------- dashboard ----------
export async function runAutolog() {
  return unwrap(await supabase.rpc("ks_autolog_due"));
}
export async function getPendingOrders() {
  return unwrap(await supabase.from("purchases")
    .select("*, clients(id, full_name, phone, email), packages(name, code)")
    .eq("status", "pending").order("created_at", { ascending: true }));
}
export async function confirmPayment(purchaseId, method = "transfer", paidAt) {
  return unwrap(await supabase.rpc("ks_confirm_payment", {
    p_purchase: purchaseId, p_method: method, p_paid_at: paidAt || new Date().toISOString(),
  }));
}
export async function rejectOrder(purchaseId) {
  return unwrap(await supabase.rpc("ks_reject_order", { p_purchase: purchaseId }));
}
export async function setOrderPrice(purchaseId, price, sessions) {
  return unwrap(await supabase.rpc("ks_set_order_price", {
    p_purchase: purchaseId, p_price: Number(price), p_sessions: sessions ? Number(sessions) : null,
  }));
}
export async function getReviewQueue() {
  return unwrap(await supabase.from("session_ledger")
    .select("*, clients(full_name)").eq("review_needed", true).order("session_at"));
}
export async function getLeads() {
  return unwrap(await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50));
}
export async function updateLead(id, status) {
  return unwrap(await supabase.from("leads").update({ status }).eq("id", id));
}
export async function getMonthlyRevenue() {
  return unwrap(await supabase.from("v_monthly_revenue").select("*"));
}
export function sumRevenueForMonth(rows, date = new Date()) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  const r = (rows || []).filter((x) => String(x.month).slice(0, 10) === key);
  return {
    total: r.reduce((s, x) => s + Number(x.revenue_gbp), 0),
    count: r.reduce((s, x) => s + Number(x.purchases), 0),
    byMethod: r.reduce((m, x) => { m[x.method] = Number(x.revenue_gbp); return m; }, {}),
  };
}
export async function generatePlanOrders(month) {
  return unwrap(await supabase.rpc("ks_generate_plan_orders", { p_month: month || null }));
}

// ---------- clients ----------
export async function getBalances() {
  return unwrap(await supabase.from("v_client_balances").select("*").order("full_name"));
}
export async function getClientsSimple() {
  return unwrap(await supabase.from("clients").select("id, full_name, active").order("full_name"));
}
export async function createClientRecord({ full_name, email, phone, mode = "in_person", notes }) {
  return unwrap(await supabase.from("clients")
    .insert({ full_name, email: email || null, phone: phone || null, mode, notes: notes || null })
    .select().single());
}
export async function updateClientRecord(id, fields) {
  return unwrap(await supabase.from("clients").update(fields).eq("id", id).select().single());
}
export async function getClientDetails(clientId) {
  const [client, purchases, ledger, overrides, plan, pairs] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single().then(unwrap),
    supabase.from("purchases").select("*, packages(name, code, kind)").eq("client_id", clientId)
      .neq("status", "cancelled").order("purchased_at", { ascending: false }).then(unwrap),
    supabase.from("session_ledger").select("*").eq("client_id", clientId)
      .order("session_at", { ascending: false }).limit(40).then(unwrap),
    supabase.from("client_price_overrides").select("*").eq("client_id", clientId).then(unwrap),
    supabase.from("client_plans").select("*").eq("client_id", clientId).eq("active", true).maybeSingle().then(unwrap),
    supabase.from("training_pairs").select("*").eq("active", true)
      .or(`client_a.eq.${clientId},client_b.eq.${clientId}`).then(unwrap),
  ]);
  const pair = (pairs || [])[0] || null;
  let partner = null;
  if (pair) {
    const pid = pair.client_a === clientId ? pair.client_b : pair.client_a;
    partner = unwrap(await supabase.from("clients").select("id, full_name").eq("id", pid).single());
  }
  const slotFilter = pair ? `client_id.eq.${clientId},pair_id.eq.${pair.id}` : `client_id.eq.${clientId}`;
  const slots = unwrap(await supabase.from("recurring_slots").select("*").eq("active", true)
    .or(slotFilter).order("weekday").order("start_time"));
  return { client, purchases, ledger, overrides, plan, pair, partner, slots };
}

// ---------- pairs ----------
export async function createPair(clientA, clientB) {
  return unwrap(await supabase.from("training_pairs").insert({ client_a: clientA, client_b: clientB }).select().single());
}
export async function endPair(pairId) {
  return unwrap(await supabase.from("training_pairs").update({ active: false }).eq("id", pairId));
}

// ---------- slots ----------
export async function addSlot({ clientId, pairId, weekday, startTime, durationMin = 60 }) {
  return unwrap(await supabase.from("recurring_slots").insert({
    client_id: pairId ? null : clientId, pair_id: pairId || null,
    weekday: Number(weekday), start_time: startTime, duration_min: Number(durationMin),
  }).select().single());
}
export async function endSlot(slotId) {
  const today = new Date().toISOString().slice(0, 10);
  return unwrap(await supabase.from("recurring_slots").update({ active: false, valid_to: today }).eq("id", slotId));
}

// ---------- sessions ----------
// status: 'done' | 'cancelled' (system decides in time / late) | 'no_show' | 'coach_cancelled'
export async function logSession({ clientId, sessionAt, status, sessionType = "solo", pairId }) {
  return unwrap(await supabase.rpc("ks_log_session", {
    p_client: clientId, p_session_at: sessionAt, p_status: status, p_session_type: sessionType,
    p_cancelled_at: new Date().toISOString(), p_pair: pairId || null, p_note: null,
  }));
}
export async function logPairSession({ pairId, sessionAt }) {
  return unwrap(await supabase.rpc("ks_log_pair_session", { p_pair: pairId, p_session_at: sessionAt, p_note: null }));
}
export async function updateSession({ ledgerId, status, sessionType }) {
  return unwrap(await supabase.rpc("ks_update_session", {
    p_ledger: ledgerId, p_status: status, p_cancelled_at: new Date().toISOString(), p_session_type: sessionType || null,
  }));
}
export async function deleteSession(ledgerId) {
  return unwrap(await supabase.from("session_ledger").delete().eq("id", ledgerId));
}

// ---------- purchases ----------
export async function addManualPurchase({ clientId, packageId, method, purchasedAt, price }) {
  return unwrap(await supabase.rpc("ks_add_purchase", {
    p_client: clientId, p_package: packageId, p_method: method,
    p_purchased_at: purchasedAt || new Date().toISOString(),
    p_price: price === "" || price === undefined || price === null ? null : Number(price), p_note: null,
  }));
}
export async function freezePurchase(purchaseId, days) {
  return unwrap(await supabase.rpc("ks_freeze_purchase", { p_purchase: purchaseId, p_days: Number(days) }));
}

// ---------- prices & plans ----------
export async function setPriceOverride(clientId, packageId, price) {
  if (price === "" || price === null || price === undefined) {
    return unwrap(await supabase.from("client_price_overrides").delete().eq("client_id", clientId).eq("package_id", packageId));
  }
  return unwrap(await supabase.from("client_price_overrides").upsert({
    client_id: clientId, package_id: packageId, price_gbp: Number(price), updated_at: new Date().toISOString(),
  }));
}
export async function setPlan({ clientId, sessions, price, startsMonth }) {
  return unwrap(await supabase.rpc("ks_set_plan", {
    p_client: clientId, p_sessions: Number(sessions), p_price: Number(price),
    p_kind: null, p_starts_month: startsMonth || null, p_note: null,
  }));
}
export async function endPlan(clientId) {
  return unwrap(await supabase.rpc("ks_end_plan", { p_client: clientId }));
}
