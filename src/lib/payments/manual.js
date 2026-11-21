// ============================================================
// PAYMENT ADAPTER "MANUAL" — bank transfer / cash
// The client creates an order (pending) and gets bank details + reference.
// Karol confirms the payment in the coach panel → package starts + invoice.
// ============================================================
import { portalOrder, publicOrder } from "../portal";
import { sendPushToUser } from "../push";

// Karol's account (same id App.jsx uses for coach notifications)
const COACH_ID = "a6efb4f6-a5aa-4829-89c3-adb486cf187c";

export const METHODS = [
  { value: "transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
];

function notifyCoach(title, message) {
  try { sendPushToUser(COACH_ID, title, message, "ks-order", "/"); } catch (e) { /* non-critical */ }
}

// Existing client, from their personal page
export async function checkoutFromPortal({ token, clientName, pkg, payForPartner }) {
  const r = await portalOrder(token, pkg.package_id, payForPartner);
  const both = r.partner_name ? ` (paying for ${r.partner_name} too)` : "";
  notifyCoach("💷 New order", `${clientName || "Client"}${both}: ${r.name} — £${r.price} (ref ${r.reference})`);
  return { kind: "bank_transfer", reference: r.reference, price: r.price, name: r.name,
           ownPrice: r.own_price, partnerPrice: r.partner_price, partnerName: r.partner_name || null };
}

// New client, from the public /buy page
export async function checkoutPublic({ name, email, phone, pkg, partner, payForPartner, partnerEmail }) {
  const r = await publicOrder({ name, email, phone, packageId: pkg.package_id, partner, payForPartner, partnerEmail });
  const who = partner ? (payForPartner ? ` (paying for ${partner} too)` : ` (duo with ${partner})`) : "";
  notifyCoach("🆕 New client order", `${name}${who}: ${r.name} — £${r.price} (ref ${r.reference})`);
  return {
    kind: "bank_transfer",
    reference: r.reference,
    price: r.price,
    name: r.name,
    accessToken: r.access_token || null,
    existingClient: !!r.existing_client,
    ownPrice: r.own_price, partnerPrice: r.partner_price, partnerName: r.partner_name || null,
    bank: {
      account_name: r.bank_account_name,
      sort_code: r.bank_sort_code,
      account_no: r.bank_account_no,
    },
  };
}
