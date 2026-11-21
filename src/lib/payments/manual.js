// ============================================================
// ADAPTER "MANUAL" — gotówka / przelew
// Pakiet dodaje coach. Klient w apce dostaje instrukcję,
// a coach dostaje push, że ktoś chce kupić pakiet.
// ============================================================
import { addManualPurchase } from "../packages";
import { supabase } from "../supabase";
import { sendPushToUser } from "../push";

export const METHODS = [
  { value: "transfer", label: "Przelew" },
  { value: "cash", label: "Gotówka" },
];

export async function recordPayment({ clientId, packageId, method, purchasedAt, price, note }) {
  if (!METHODS.some((m) => m.value === method)) throw new Error("Metoda: gotówka albo przelew");
  return addManualPurchase({ clientId, packageId, method, purchasedAt, price, note });
}

export async function startClientCheckout({ client, pkg, price }) {
  // powiadom wszystkich coachów (Karol, Sharad)
  try {
    const { data: coaches } = await supabase.from("profiles").select("id").eq("role", "coach");
    const who = client?.full_name || "Klient";
    for (const c of coaches || []) {
      await sendPushToUser(c.id, "Prośba o pakiet", `${who}: ${pkg.name} (£${price})`, "ks-package", "/");
    }
  } catch (e) {
    console.log("Push do coacha nie poszedł (niekrytyczne):", e);
  }
  return {
    kind: "manual",
    title: "Prawie gotowe",
    message:
      `Zapłać £${price} przelewem albo gotówką na najbliższej sesji. ` +
      "Pakiet pojawi się na Twoim koncie, gdy Karol potwierdzi wpłatę.",
  };
}
