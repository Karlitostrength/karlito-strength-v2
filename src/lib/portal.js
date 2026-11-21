// ============================================================
// KARLITO STRENGTH — CLIENT PAGE (no login) + PUBLIC /buy
// Everything here works without an app account: access is by the
// personal link token (karlitostrength.com/k/<token>).
// ============================================================
import { supabase } from "./supabase";

function unwrap({ data, error }) {
  if (error) throw new Error(error.message || "Database error");
  return data;
}

// ---------- data ----------
export async function getPortal(token) {
  const [portal, plan] = await Promise.all([
    supabase.rpc("ks_portal", { p_token: token }).then(unwrap),
    supabase.rpc("ks_portal_plan", { p_token: token }).then(unwrap),
  ]);
  if (!portal) return null;
  return { ...portal, plan };
}

export async function portalCancel(token, sessionAt) {
  return unwrap(await supabase.rpc("ks_portal_cancel", { p_token: token, p_session_at: sessionAt }));
}

export async function portalOrder(token, packageId) {
  return unwrap(await supabase.rpc("ks_portal_order", { p_token: token, p_package: packageId, p_accept_terms: true }));
}

export async function portalInvoice(token, invoiceId) {
  return unwrap(await supabase.rpc("ks_portal_invoice", { p_token: token, p_invoice: invoiceId }));
}

export async function getPublicPrices() {
  return unwrap(await supabase.rpc("ks_public_prices"));
}

export async function publicOrder({ name, email, phone, packageId }) {
  return unwrap(await supabase.rpc("ks_public_order", {
    p_name: name, p_email: email, p_phone: phone || "", p_package: packageId, p_accept_terms: true,
  }));
}

// Personal link for an app user (logged in) — their own client record
export async function getMyPortalToken() {
  const { data: id } = await supabase.rpc("ks_claim_my_client");
  if (!id) return null;
  const { data } = await supabase.from("clients").select("access_token").eq("id", id).single();
  return data?.access_token || null;
}

// ---------- formatting ----------
export function gbp(n) {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  return "£" + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
}

export function perHour(price, sessions) {
  if (!sessions || sessions < 1) return null;
  return gbp(Number(price) / Number(sessions)) + "/h";
}

export function dateLong(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
}

export function dateShort(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });
}

export function sessionTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}

export function monthName(d) {
  if (!d) return "";
  return new Date(d + (String(d).length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function daysLeft(d) {
  if (!d) return null;
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

// "the last moment of validity" shown as the last valid day (expires_at is midnight of next day)
export function lastValidDay(expiresAt) {
  if (!expiresAt) return null;
  return new Date(new Date(expiresAt).getTime() - 60000);
}

export function validityText(p) {
  if (p.is_subscription) return "Monthly";
  if (!p.validity_months) return "No expiry";
  return `Valid ${p.validity_months === 1 ? "1 month" : p.validity_months + " months"} from purchase`;
}

export const STATUS_TEXT = {
  done: "Done",
  cancelled_early: "Cancelled in time",
  cancelled_late: "Late cancellation",
  no_show: "No-show",
};

// Database messages are in Polish — clients see plain English
export function friendlyError(e) {
  const m = String(e?.message || e || "");
  if (m.includes("już odwołana")) return "This session is already cancelled.";
  if (m.includes("już się zaczęła")) return "This session has already started.";
  if (m.includes("Nie ma takiej sesji")) return "We couldn't find this session in your schedule.";
  if (m.includes("Nieprawidłowy link")) return "This link is not valid. Please ask Karol for a new one.";
  if (m.includes("nie jest dostępny")) return "This package isn't available for you.";
  if (m.includes("czekające na płatność")) return "You already have orders waiting for payment. Please pay those first or message Karol.";
  if (m.includes("Podaj imię")) return "Please enter your name and a valid email address.";
  if (m.includes("Zaakceptuj")) return "Please accept the terms first.";
  return "Something went wrong. Please try again or message Karol.";
}
