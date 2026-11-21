// ============================================================
// KARLITO STRENGTH — PAYMENT ADAPTER (single entry point)
// Screens only call these functions. They don't know whether it's
// a bank transfer or Revolut underneath.
//
// Phase 1: "manual" (bank transfer / cash, Karol confirms).
// Phase 2: add ./revolut.js + /api/create-order + /api/revolut-webhook,
//          then switch PROVIDER to "revolut". Nothing else changes.
// ============================================================
import * as manual from "./manual";

const providers = { manual };
export const PROVIDER = "manual";

// Result: { kind: "bank_transfer", reference, price, ... }
//    or (Phase 2) { kind: "redirect", url }
export async function startPortalCheckout({ token, clientName, pkg, payForPartner, termsAccepted }) {
  if (!termsAccepted) throw new Error("Zaakceptuj zasady");
  return providers[PROVIDER].checkoutFromPortal({ token, clientName, pkg, payForPartner });
}

export async function startPublicCheckout({ name, email, phone, pkg, partner, payForPartner, partnerEmail, termsAccepted }) {
  if (!termsAccepted) throw new Error("Zaakceptuj zasady");
  return providers[PROVIDER].checkoutPublic({ name, email, phone, pkg, partner, payForPartner, partnerEmail });
}

export const COACH_METHODS = manual.METHODS;
