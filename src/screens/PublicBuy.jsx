// ============================================================
// PUBLIC BUY PAGE — karlitostrength.com/buy
// New clients, no login. 1:1 and online only, standard prices.
// (Duo and personal prices: existing clients use their personal link.)
// ============================================================
import { useState, useEffect } from "react";
import { s } from "../lib/styles";
import { getPublicPrices, gbp, friendlyError } from "../lib/portal";
import { startPublicCheckout } from "../lib/payments";
import { PageShell, PriceOption, TermsList, BankBox, Notice } from "./ClientPortal";

const cond = "'Barlow Condensed', sans-serif";

export function PublicBuyScreen() {
  const [prices, setPrices] = useState(null);
  const [cancelHours, setCancelHours] = useState(12);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getPublicPrices()
      .then((r) => { setPrices(r?.packages || []); setCancelHours(r?.cancellation_hours ?? 12); })
      .catch(() => setPrices([]));
  }, []);

  const valid = form.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) && accepted;

  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await startPublicCheckout({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        pkg: selected, termsAccepted: accepted,
      });
      if (r.kind === "redirect" && r.url) { window.location.href = r.url; return; }
      setResult(r);
      window.scrollTo(0, 0);
    } catch (e) { setErr(friendlyError(e)); }
    setBusy(false);
  };

  if (result) {
    const link = result.accessToken ? `${window.location.origin}/k/${result.accessToken}` : null;
    return (
      <PageShell>
        <div style={{ fontFamily: cond, fontSize: 28, fontWeight: 900, color: "var(--gold)" }}>Order received ✓</div>
        <div style={{ fontSize: 14, color: "var(--gray)", margin: "6px 0 4px" }}>
          {result.name}. Your package starts as soon as Karol confirms your payment.
        </div>
        <BankBox bank={result.bank} reference={result.reference} price={result.price} />
        {link && (
          <div style={{ ...s.card, marginTop: 16, borderColor: "var(--gold)" }}>
            <div style={s.sectionLabel}>YOUR PERSONAL PAGE</div>
            <div style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.5, marginBottom: 12 }}>
              See your sessions, balance, expiry date and invoices here. Save this link — no login needed.
            </div>
            <a href={link} style={{ ...s.btnGold, display: "block", textAlign: "center", textDecoration: "none" }}>OPEN MY PAGE</a>
            <div onClick={() => { try { navigator.clipboard.writeText(link); } catch (e) {} }}
              style={{ fontSize: 12, color: "var(--gray2)", marginTop: 10, wordBreak: "break-all", cursor: "pointer" }}>
              {link} (tap to copy)
            </div>
          </div>
        )}
        {result.existingClient && (
          <Notice>You're already registered with Karol — he'll send you your personal page link.</Notice>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ fontFamily: cond, fontSize: 28, fontWeight: 900, letterSpacing: "0.04em" }}>Train with Karol</div>
      <div style={{ fontSize: 14, color: "var(--gray)", margin: "4px 0 20px", lineHeight: 1.5 }}>
        Personal training in South West London and online coaching. Choose a package, pay by bank transfer and you're in.
      </div>

      <div style={s.sectionLabel}>1. CHOOSE A PACKAGE</div>
      {prices === null && <div style={{ fontFamily: cond, color: "var(--gray)", letterSpacing: "0.2em" }}>LOADING...</div>}
      {prices && prices.map((p) => (
        <PriceOption key={p.package_id} p={p} selected={selected?.package_id === p.package_id}
          onClick={() => setSelected(p)} />
      ))}
      <div style={{ fontSize: 12, color: "var(--gray2)", margin: "4px 0 20px" }}>
        Training as a pair (duo)? Message Karol for duo pricing.
      </div>

      {selected && (
        <>
          <div style={s.sectionLabel}>2. YOUR DETAILS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <input style={s.input} placeholder="Full name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            <input style={s.input} placeholder="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            <input style={s.input} placeholder="Phone (optional)" type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
          </div>

          <div style={s.sectionLabel}>3. TERMS</div>
          <TermsList pkg={selected} cancelHours={cancelHours} />
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, cursor: "pointer", marginBottom: 14 }}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
            <span>I understand and accept these terms</span>
          </label>

          {err && <Notice tone="error">{err}</Notice>}
          <button onClick={go} disabled={!valid || busy} style={{ ...s.btnGold, opacity: valid && !busy ? 1 : 0.4 }}>
            {busy ? "..." : `ORDER · ${gbp(selected.price)}`}
          </button>
        </>
      )}
    </PageShell>
  );
}
