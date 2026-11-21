// ============================================================
// KARLITO STRENGTH — PAKIETY SESJI (Faza 1)
// Jedno miejsce na wszystkie zapytania do bazy dla pakietów.
// Logika salda/ważności/12h siedzi w Supabase (SQL) — tu tylko wywołania.
// ============================================================
import { supabase } from "./supabase";

// ---------- helpery ----------
function unwrap({ data, error }) {
  if (error) throw new Error(error.message || "Błąd bazy danych");
  return data;
}

export const STATUS_LABELS = {
  done: "Odbyta",
  cancelled_early: "Odwołana na czas",
  cancelled_late: "Odwołana za późno",
  no_show: "No-show",
};

export const STATUS_COUNTS = {
  done: true,
  cancelled_early: false,
  cancelled_late: true,
  no_show: true,
};

export const WEEKDAYS = ["", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

export const METHOD_LABELS = { cash: "Gotówka", transfer: "Przelew", revolut: "Revolut" };

export function formatGBP(n) {
  if (n === null || n === undefined) return "—";
  return "£" + Number(n).toFixed(Number(n) % 1 === 0 ? 0 : 2);
}

export function formatDate(d) {
  if (!d) return "bez terminu";
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("pl-PL", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London",
  });
}

export function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export function isPurchaseActive(p) {
  if (p.status !== "paid") return false;
  if (p.expires_at && new Date(p.expires_at) <= new Date()) return false;
  if (p.sessions_left !== null && p.sessions_left <= 0) return false;
  return true;
}

// Czy klient "kończy się w tym tygodniu" (do filtra coacha i przypomnień)
export function isEndingSoon(balance, { sessions = 2, days = 7 } = {}) {
  const d = daysUntil(balance.next_expiry);
  if (balance.has_online && d !== null && d <= days) return true;
  if (balance.sessions_left <= sessions) return true;
  if (d !== null && d <= days) return true;
  return false;
}

// ---------- wspólne ----------
export async function getPackages() {
  return unwrap(await supabase.from("packages").select("*").eq("active", true).order("sort_order"));
}

export async function getSettings() {
  const rows = unwrap(await supabase.from("settings").select("key, value"));
  const out = {};
  (rows || []).forEach((r) => { out[r.key] = r.value; });
  return out;
}

// ============================================================
// KLIENT
// ============================================================

// Po zalogowaniu: podpina rekord z rejestru klientów po emailu. Zwraca client_id albo null.
export async function claimMyClient() {
  return unwrap(await supabase.rpc("ks_claim_my_client"));
}

export async function getMyClient() {
  const id = await claimMyClient();
  if (!id) return null;
  return unwrap(await supabase.from("clients").select("*").eq("id", id).single());
}

export async function getMyPurchases() {
  return unwrap(await supabase.from("purchases")
    .select("*, packages(name, code, kind, sessions, validity_months)")
    .order("purchased_at", { ascending: false }));
}

export async function getMyLedger(limit = 30) {
  return unwrap(await supabase.from("session_ledger")
    .select("*").order("session_at", { ascending: false }).limit(limit));
}

export async function getMyUpcoming(days = 14) {
  return unwrap(await supabase.rpc("ks_my_upcoming", { p_days: days }));
}

// Zwraca 'cancelled_early' (wraca na saldo) albo 'cancelled_late' (odliczona)
export async function cancelMySession(sessionAt) {
  return unwrap(await supabase.rpc("ks_client_cancel", { p_session_at: sessionAt }));
}

// Cennik z uwzględnieniem override klienta
export async function getMyPrices(clientId) {
  const [pkgs, overrides] = await Promise.all([
    getPackages(),
    clientId
      ? supabase.from("client_price_overrides").select("package_id, price_gbp").eq("client_id", clientId).then(unwrap)
      : Promise.resolve([]),
  ]);
  const map = {};
  (overrides || []).forEach((o) => { map[o.package_id] = Number(o.price_gbp); });
  return pkgs.map((p) => ({
    ...p,
    standard_price: Number(p.price_gbp),
    price: map[p.id] !== undefined ? map[p.id] : Number(p.price_gbp),
    is_override: map[p.id] !== undefined,
  }));
}

// ============================================================
// COACH
// ============================================================

// Lista klientów z saldem, ważnością, zaległymi sesjami
export async function getBalances() {
  return unwrap(await supabase.from("v_client_balances").select("*").order("full_name"));
}

export async function getClientDetails(clientId) {
  const [client, purchases, ledger, overrides, slots, pairs] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single().then(unwrap),
    supabase.from("purchases").select("*, packages(name, code, kind)").eq("client_id", clientId)
      .order("purchased_at", { ascending: false }).then(unwrap),
    supabase.from("session_ledger").select("*").eq("client_id", clientId)
      .order("session_at", { ascending: false }).limit(60).then(unwrap),
    supabase.from("client_price_overrides").select("*").eq("client_id", clientId).then(unwrap),
    supabase.from("recurring_slots").select("*").eq("client_id", clientId).eq("active", true)
      .order("weekday").then(unwrap),
    supabase.from("training_pairs").select("*").eq("active", true)
      .or(`client_a.eq.${clientId},client_b.eq.${clientId}`).then(unwrap),
  ]);
  let pairSlots = [];
  if (pairs && pairs.length) {
    pairSlots = unwrap(await supabase.from("recurring_slots").select("*")
      .in("pair_id", pairs.map((p) => p.id)).eq("active", true).order("weekday"));
  }
  return { client, purchases, ledger, overrides, slots, pairs, pairSlots };
}

// --- rejestr klientów ---
export async function createClientRecord({ full_name, email, phone, mode = "in_person", notes }) {
  return unwrap(await supabase.from("clients")
    .insert({ full_name, email: email || null, phone: phone || null, mode, notes: notes || null })
    .select().single());
}

export async function updateClientRecord(id, fields) {
  return unwrap(await supabase.from("clients").update(fields).eq("id", id).select().single());
}

// --- pary duo ---
export async function createPair(clientA, clientB, label) {
  return unwrap(await supabase.from("training_pairs")
    .insert({ client_a: clientA, client_b: clientB, label: label || null }).select().single());
}

export async function endPair(pairId) {
  return unwrap(await supabase.from("training_pairs").update({ active: false }).eq("id", pairId));
}

export async function getPairs() {
  return unwrap(await supabase.from("training_pairs").select("*").eq("active", true));
}

// --- stały grafik ---
// target: { clientId } albo { pairId }; weekday 1=pon..7=nd; startTime "07:00"
export async function addSlot({ clientId, pairId, weekday, startTime, durationMin = 60, validFrom, note }) {
  return unwrap(await supabase.from("recurring_slots").insert({
    client_id: clientId || null,
    pair_id: pairId || null,
    weekday: Number(weekday),
    start_time: startTime,
    duration_min: Number(durationMin),
    valid_from: validFrom || new Date().toISOString().slice(0, 10),
    note: note || null,
  }).select().single());
}

// Zakończenie slotu (nie kasujemy — historia zostaje)
export async function endSlot(slotId) {
  const today = new Date().toISOString().slice(0, 10);
  return unwrap(await supabase.from("recurring_slots")
    .update({ active: false, valid_to: today }).eq("id", slotId));
}

export async function getAllSlots() {
  return unwrap(await supabase.from("recurring_slots").select("*").eq("active", true)
    .order("weekday").order("start_time"));
}

// --- sesje ---
// status: 'done' | 'cancelled' (system sam: na czas / za późno) | 'no_show' | 'coach_cancelled'
export async function logSession({ clientId, sessionAt, status, sessionType = "solo", cancelledAt, pairId, note }) {
  return unwrap(await supabase.rpc("ks_log_session", {
    p_client: clientId,
    p_session_at: sessionAt,
    p_status: status,
    p_session_type: sessionType,
    p_cancelled_at: cancelledAt || new Date().toISOString(),
    p_pair: pairId || null,
    p_note: note || null,
  }));
}

export async function logPairSession({ pairId, sessionAt, note }) {
  return unwrap(await supabase.rpc("ks_log_pair_session", {
    p_pair: pairId, p_session_at: sessionAt, p_note: note || null,
  }));
}

// Zmiana statusu wpisu. sessionType 'solo' = "odbyła się jako 1:1"
export async function updateSession({ ledgerId, status, cancelledAt, sessionType }) {
  return unwrap(await supabase.rpc("ks_update_session", {
    p_ledger: ledgerId,
    p_status: status,
    p_cancelled_at: cancelledAt || new Date().toISOString(),
    p_session_type: sessionType || null,
  }));
}

export async function deleteSession(ledgerId) {
  return unwrap(await supabase.from("session_ledger").delete().eq("id", ledgerId));
}

// Auto "odbyta" dla minionych slotów — wołane przy otwarciu panelu coacha
export async function runAutolog() {
  return unwrap(await supabase.rpc("ks_autolog_due"));
}

// Wpisy do sprawdzenia (np. partner z duo trenował sam)
export async function getReviewQueue() {
  return unwrap(await supabase.from("session_ledger")
    .select("*, clients(full_name)").eq("review_needed", true).order("session_at"));
}

export async function getRecentAutoLogged(hours = 48) {
  const since = new Date(Date.now() - hours * 3600000).toISOString();
  return unwrap(await supabase.from("session_ledger")
    .select("*, clients(full_name)").eq("source", "auto").gte("created_at", since)
    .order("session_at", { ascending: false }));
}

// --- pakiety / wpłaty ---
// Zwykły zakup cash/transfer — idzie przez adapter płatności (src/lib/payments)
export async function addManualPurchase({ clientId, packageId, method, purchasedAt, price, note }) {
  return unwrap(await supabase.rpc("ks_add_purchase", {
    p_client: clientId,
    p_package: packageId,
    p_method: method,
    p_purchased_at: purchasedAt || new Date().toISOString(),
    p_price: price === "" || price === undefined || price === null ? null : Number(price),
    p_note: note || null,
  }));
}

// Przeniesienie starego salda (migracja obecnych klientów).
// Cena £0, żeby nie liczyć przychodu drugi raz. Ważność liczona od podanej daty zakupu.
export async function carryOverBalance({ clientId, packageId, sessionsLeft, purchasedAt, note }) {
  return unwrap(await supabase.from("purchases").insert({
    client_id: clientId,
    package_id: packageId,
    sessions_total: Number(sessionsLeft),
    price_gbp: 0,
    method: "cash",
    status: "paid",
    purchased_at: purchasedAt || new Date().toISOString(),
    note: note || "Przeniesienie salda sprzed systemu",
  }).select().single());
}

export async function freezePurchase(purchaseId, days) {
  return unwrap(await supabase.rpc("ks_freeze_purchase", { p_purchase: purchaseId, p_days: Number(days) }));
}

export async function cancelPurchase(purchaseId) {
  return unwrap(await supabase.from("purchases").update({ status: "cancelled" }).eq("id", purchaseId));
}

// --- override cen ---
export async function setPriceOverride(clientId, packageId, price, note) {
  if (price === "" || price === null || price === undefined) {
    return unwrap(await supabase.from("client_price_overrides")
      .delete().eq("client_id", clientId).eq("package_id", packageId));
  }
  return unwrap(await supabase.from("client_price_overrides").upsert({
    client_id: clientId, package_id: packageId, price_gbp: Number(price),
    note: note || null, updated_at: new Date().toISOString(),
  }));
}

// --- przychód ---
export async function getMonthlyRevenue() {
  return unwrap(await supabase.from("v_monthly_revenue").select("*").order("month", { ascending: false }));
}

export function sumRevenueForMonth(rows, date = new Date()) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  const r = (rows || []).filter((x) => String(x.month).slice(0, 10) === key);
  return {
    total: r.reduce((s, x) => s + Number(x.revenue_gbp), 0),
    byMethod: r.reduce((m, x) => { m[x.method] = Number(x.revenue_gbp); return m; }, {}),
    count: r.reduce((s, x) => s + Number(x.purchases), 0),
  };
}

// --- ustawienia ---
export async function updateSetting(key, value) {
  return unwrap(await supabase.from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }));
}
