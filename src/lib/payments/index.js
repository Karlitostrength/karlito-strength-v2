// ============================================================
// KARLITO STRENGTH — ADAPTER PŁATNOŚCI
// Reszta apki woła TYLKO te funkcje. Nie wie, czy pod spodem jest
// gotówka, przelew czy Revolut.
//
// Faza 1: dostępny tylko adapter "manual" (cash / transfer — dodaje coach).
// Faza 2: dodajemy ./revolut.js + /api/create-order + /api/revolut-webhook
//         i przełączamy CLIENT_CHECKOUT_PROVIDER na "revolut". Nic więcej.
// ============================================================
import * as manual from "./manual";

const providers = { manual };

// Jak klient płaci sam w apce. Faza 1 = "manual" (instrukcja + powiadomienie coacha).
export const CLIENT_CHECKOUT_PROVIDER = "manual";

// Klient klika "Kup pakiet" → zaakceptował zasady (checkbox).
// Zwraca { kind: "manual", ... } albo w Fazie 2 { kind: "redirect", url }.
export async function startClientCheckout({ client, pkg, price, termsAccepted }) {
  if (!termsAccepted) throw new Error("Zaakceptuj zasady ważności pakietu");
  const provider = providers[CLIENT_CHECKOUT_PROVIDER];
  return provider.startClientCheckout({ client, pkg, price });
}

// Coach dodaje wpłatę ręcznie (gotówka / przelew).
export async function recordCoachPayment({ clientId, packageId, method, purchasedAt, price, note }) {
  return manual.recordPayment({ clientId, packageId, method, purchasedAt, price, note });
}

export const COACH_METHODS = manual.METHODS;
