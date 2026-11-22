// ============================================================
// CLIENT PAGE — karlitostrength.com/k/<token>
// No login needed. Clear overview: balance, plan, payments due,
// sessions, cancellations, invoices, buy next package.
// Also embedded in the app (HOME tab) for clients who use the app.
// ============================================================
import { useState, useEffect } from "react";
import { s } from "../lib/styles";
import {
  getPortal, portalCancel, portalInvoice, getMyPortalToken,
  gbp, perHour, dateLong, dateShort, sessionTime, monthName, daysLeft, lastValidDay,
  validityText, STATUS_TEXT, friendlyError,
} from "../lib/portal";
import { startPortalCheckout } from "../lib/payments";

const cond = "'Barlow Condensed', sans-serif";

// ---------- shared pieces (also used by /buy) ----------
export function PageShell({ children }) {
  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>KARLITO <span style={s.logoRed}>STRENGTH</span></div>
        <div style={s.tagline}>FERRUM · SANGUIS · GLORIA</div>
      </div>
      <div style={{ padding: "20px 20px 40px" }}>{children}</div>
    </div>
  );
}

export function Notice({ children, tone = "info", onClose }) {
  const color = tone === "error" ? "var(--red)" : tone === "gold" ? "var(--gold)" : "var(--border)";
  return (
    <div style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: 10, border: `1px solid ${color}`, fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
      {onClose && <span onClick={onClose} style={{ float: "right", cursor: "pointer", color: "var(--gray2)", marginLeft: 8 }}>✕</span>}
      {children}
    </div>
  );
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => {
    try { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {}
  };
  return (
    <div onClick={copy} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
      <span style={{ color: "var(--gray)", fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: cond, fontSize: 17, letterSpacing: "0.04em" }}>{copied ? "Copied ✓" : value}</span>
    </div>
  );
}

export function BankBox({ bank, reference, price, dueText }) {
  const hasBank = bank && (bank.account_no || bank.sort_code);
  return (
    <div style={{ padding: 14, background: "var(--bg3)", borderRadius: 10, border: "1px solid var(--gold)", marginTop: 10 }}>
      <div style={{ ...s.sectionLabel, color: "var(--gold)", marginBottom: 6 }}>PAY BY BANK TRANSFER</div>
      {dueText && <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 6 }}>{dueText}</div>}
      <CopyRow label="Amount" value={gbp(price)} />
      {hasBank ? (
        <>
          <CopyRow label="Account name" value={bank.account_name} />
          <CopyRow label="Sort code" value={bank.sort_code} />
          <CopyRow label="Account number" value={bank.account_no} />
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--gray)", padding: "8px 0" }}>Karol will send you the bank details.</div>
      )}
      <CopyRow label="Reference" value={reference} />
      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 8, lineHeight: 1.5 }}>
        Tap a line to copy it. Please use the reference so the payment is matched to you.
        Cash at your next session is fine too.
      </div>
    </div>
  );
}

export function TermsList({ pkg, cancelHours }) {
  return (
    <ul style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, paddingLeft: 18, margin: "0 0 12px" }}>
      {pkg?.validity_months && !pkg?.is_subscription && (
        <li>Valid for {pkg.validity_months === 1 ? "1 month" : pkg.validity_months + " months"} from the payment date. Sessions not used by then expire.</li>
      )}
      {pkg?.is_subscription && <li>Monthly coaching, paid in advance each month.</li>}
      <li>Cancel at least {cancelHours} hours before a session and it stays on your balance.</li>
      <li>Later cancellations and no-shows use a session.</li>
      <li>The package is personal and can't be shared.</li>
    </ul>
  );
}

// ---------- duo: "who are you paying for?" ----------
export function WhoPays({ payBoth, onChange, ownPrice, partnerPrice, partnerName }) {
  const partner = partnerName || "my partner";
  const opt = (active, title, price, note, onClick) => (
    <div onClick={onClick} style={{ flex: 1, minWidth: 140, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
      background: active ? "var(--gold-dim)" : "var(--bg3)", border: `2px solid ${active ? "var(--gold)" : "var(--border)"}` }}>
      <div style={{ fontFamily: cond, fontSize: 16, letterSpacing: "0.04em", marginBottom: 2 }}>{active ? "● " : "○ "}{title}</div>
      <div style={{ fontFamily: cond, fontSize: 24, fontWeight: 900, color: "var(--gold)" }}>{gbp(price)}</div>
      <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.4 }}>{note}</div>
    </div>
  );
  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      <div style={{ ...s.sectionLabel, marginBottom: 8 }}>WHO ARE YOU PAYING FOR?</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {opt(!payBoth, "Just me", ownPrice, `${partnerName || "Your partner"} pays separately`, () => onChange(false))}
        {opt(payBoth, `Me + ${partner}`, Number(ownPrice) + Number(partnerPrice || 0), "2 packages · 1 payment · 1 invoice for you", () => onChange(true))}
      </div>
    </div>
  );
}

export function SplitSummary({ ownPrice, partnerPrice, partnerName, pkgName }) {
  const row = { display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 14 };
  return (
    <div style={{ padding: 14, background: "var(--bg3)", borderRadius: 10, border: "1px solid var(--border)", margin: "10px 0" }}>
      <div style={{ ...s.sectionLabel, marginBottom: 6 }}>YOUR ORDER — 2 PACKAGES</div>
      <div style={row}><span>You — {pkgName}</span><span>{gbp(ownPrice)}</span></div>
      <div style={{ ...row, borderBottom: "1px solid var(--border)" }}><span>{partnerName} — {pkgName}</span><span>{gbp(partnerPrice)}</span></div>
      <div style={{ ...row, fontFamily: cond, fontSize: 20, fontWeight: 900 }}>
        <span>TOTAL TO PAY</span><span style={{ color: "var(--gold)" }}>{gbp(Number(ownPrice) + Number(partnerPrice))}</span>
      </div>
      <ul style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.6, paddingLeft: 18, margin: "6px 0 0" }}>
        <li>One bank transfer, one invoice in your name.</li>
        <li>Duo sessions are for the two of you together. If one of you can't make it, cancel at least 12 hours before and we move the session for both.</li>
        <li>Later cancellations or no-shows: the session goes ahead for whoever comes and counts for both of you.</li>
        <li>{partnerName} gets their own page to see their sessions.</li>
      </ul>
    </div>
  );
}

export function PriceOption({ p, selected, onClick }) {
  const ph = !p.is_subscription ? perHour(p.price, p.sessions) : null;
  const isOverride = p.standard_price !== undefined && Number(p.standard_price) !== Number(p.price);
  return (
    <div onClick={onClick}
      style={{ padding: "12px 14px", marginBottom: 8, borderRadius: 10, cursor: "pointer",
        background: selected ? "var(--gold-dim)" : "var(--bg3)",
        border: `1px solid ${selected ? "var(--gold)" : "var(--border)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontFamily: cond, fontSize: 17, letterSpacing: "0.04em" }}>{p.name}</div>
        <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: cond, fontSize: 21, fontWeight: 900, color: "var(--gold)" }}>{gbp(p.price)}</span>
          {p.is_subscription
            ? <span style={{ fontSize: 13, color: "var(--gray)" }}> / month</span>
            : ph && <span style={{ fontSize: 13, color: "var(--gray)" }}> ({ph})</span>}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 2 }}>
        {validityText(p)}{isOverride ? " · your price" : ""}
      </div>
    </div>
  );
}

// ---------- page entry: /k/<token> and /k/<token>/invoice/<id> ----------
export function ClientPortalRoute() {
  const parts = window.location.pathname.split("/").filter(Boolean); // ["k", token, "invoice", id]
  const token = parts[1] || "";
  if (parts[2] === "invoice" && parts[3]) return <InvoicePage token={token} invoiceId={parts[3]} />;
  return (
    <PageShell>
      <ClientPortal token={token} standalone />
    </PageShell>
  );
}

// ---------- in-app (HOME tab) for clients who use the app ----------
export function InAppClientPortal() {
  const [token, setToken] = useState(undefined);
  useEffect(() => { getMyPortalToken().then(setToken).catch(() => setToken(null)); }, []);
  if (!token) return null;
  return (
    <div style={{ padding: "20px 20px 0" }}>
      <ClientPortal token={token} />
    </div>
  );
}

// ---------- the client overview ----------
export function ClientPortal({ token, standalone = false }) {
  const [data, setData] = useState(undefined);
  const [msg, setMsg] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    try { setData(await getPortal(token)); }
    catch (e) { console.log("portal error", e); setData(null); }
  };

  useEffect(() => {
    load();
    if (new URLSearchParams(window.location.search).get("buy") === "1") setShowBuy(true);
  }, [token]);

  if (data === undefined) {
    return <div style={{ fontFamily: cond, color: "var(--gray)", letterSpacing: "0.2em", padding: 20, textAlign: "center" }}>LOADING...</div>;
  }
  if (data === null) {
    if (!standalone) return null;
    return <Notice tone="error">This link is not valid. Please ask Karol for your personal link.</Notice>;
  }

  const cancelHours = data.settings?.cancellation_hours ?? 12;
  const bank = {
    account_name: data.settings?.bank_account_name,
    sort_code: data.settings?.bank_sort_code,
    account_no: data.settings?.bank_account_no,
  };
  const now = Date.now();
  const paid = (data.purchases || []).filter((p) => p.status === "paid");
  const pending = (data.purchases || []).filter((p) => p.status === "pending");
  const isActive = (p) =>
    (!p.expires_at || new Date(p.expires_at).getTime() > now) && (p.sessions_left === null || p.sessions_left > 0);
  // monthly-plan payments are shown in the plan card, not as packages
  const isPlanPurchase = (p) => String(p.name || "").startsWith("Monthly plan");
  const activePacks = paid.filter((p) => p.kind !== "online" && !isPlanPurchase(p) && isActive(p));
  const online = paid.find((p) => p.kind === "online" && isActive(p));
  const sessionsLeft = activePacks.reduce((n, p) => n + (p.sessions_left || 0), 0);
  const expiries = activePacks.map((p) => p.expires_at).filter(Boolean).sort();
  const nextExpiry = expiries[0] || null;
  const dLeft = daysLeft(nextExpiry);
  const unpaid = (data.sessions || []).filter((x) => x.unpaid).length;
  const plan = data.plan?.has_plan ? data.plan : null;
  const planPendingIds = new Set((plan?.due || []).map((d) => d.purchase_id));
  const otherPending = pending.filter((p) => !planPendingIds.has(p.id));
  const openUpcoming = (data.upcoming || []).filter((u) => !u.status).slice(0, 6);
  const endingSoon = !plan && activePacks.length > 0 && (sessionsLeft <= 2 || (dLeft !== null && dLeft <= 7));
  const firstName = (data.client?.name || "").split(" ")[0];

  const doCancel = async () => {
    setBusy(true);
    try {
      const r = await portalCancel(token, confirmCancel.session_at);
      setMsg({ tone: "info", text: r === "cancelled_early"
        ? "Cancelled. The session stays on your balance."
        : `Cancelled. As it was less than ${cancelHours}h before, the session was used.` });
    } catch (e) {
      setMsg({ tone: "error", text: friendlyError(e) });
    }
    setConfirmCancel(null);
    setBusy(false);
    load();
  };

  return (
    <div>
      {standalone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: cond, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em" }}>Hi {firstName} 👋</div>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>Your training & payments with Karol</div>
        </div>
      )}

      {msg && <Notice tone={msg.tone} onClose={() => setMsg(null)}>{msg.text}</Notice>}

      {/* ===== MONTHLY PLAN ===== */}
      {plan && (
        <div style={{ ...s.card, borderColor: plan.due.length ? "var(--gold)" : "var(--border)" }}>
          <div style={s.sectionLabel}>MY MONTHLY PLAN</div>
          <div style={{ fontFamily: cond, fontSize: 20, marginBottom: 8 }}>
            {plan.sessions_per_month} sessions / month · {gbp(plan.monthly_price)}
            <span style={{ fontSize: 14, color: "var(--gray)" }}> ({perHour(plan.monthly_price, plan.sessions_per_month)})</span>
          </div>
          {plan.current ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                <div style={s.bigNum}>{plan.current.sessions_left}</div>
                <div style={{ fontFamily: cond, fontSize: 14, color: "var(--gray)", letterSpacing: "0.08em", paddingBottom: 8 }}>
                  OF {plan.current.sessions_total} LEFT IN {monthName(plan.current.period).toUpperCase()}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--gray2)", marginTop: 4 }}>
                Unused sessions end on {dateLong(lastValidDay(plan.current.expires_at))}.
              </div>
            </>
          ) : (
            !plan.due.length && <div style={{ fontSize: 14, color: "var(--gray)" }}>No active month right now.</div>
          )}
          {plan.due.map((d) => (
            <BankBox key={d.purchase_id} bank={bank} reference={d.reference} price={d.price}
              dueText={`${monthName(d.period)} — ${d.sessions} sessions · due by ${dateLong(d.due_date)}`} />
          ))}
        </div>
      )}

      {/* ===== PACKAGE BALANCE ===== */}
      {(activePacks.length > 0 || online || !plan) && (
        <div style={{ ...s.card, borderColor: endingSoon ? "var(--gold)" : "var(--border)" }}>
          <div style={s.sectionLabel}>{online && !activePacks.length ? "MY ONLINE COACHING" : "MY PACKAGE"}</div>
          {activePacks.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                <div style={s.bigNum}>{sessionsLeft}</div>
                <div style={{ fontFamily: cond, fontSize: 14, color: "var(--gray)", letterSpacing: "0.08em", paddingBottom: 8 }}>
                  {sessionsLeft === 1 ? "SESSION LEFT" : "SESSIONS LEFT"}
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 4 }}>
                {nextExpiry
                  ? <>Valid until <b style={{ color: "var(--text)" }}>{dateLong(lastValidDay(nextExpiry))}</b> · {dLeft} {dLeft === 1 ? "day" : "days"} left</>
                  : "No expiry date"}
              </div>
            </>
          )}
          {online && (
            <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 4 }}>
              Online coaching active until <b style={{ color: "var(--text)" }}>{dateLong(lastValidDay(online.expires_at))}</b>
            </div>
          )}
          {!activePacks.length && !online && !plan && (
            <div style={{ fontSize: 14, color: "var(--gray)" }}>You don't have an active package right now.</div>
          )}
          {endingSoon && <div style={{ fontSize: 13, color: "var(--gold)", marginTop: 8 }}>Almost finished — buy your next package to keep your spot.</div>}
        </div>
      )}

      {unpaid > 0 && (
        <Notice tone="error">
          {unpaid === 1 ? "1 session is" : `${unpaid} sessions are`} waiting for payment — {unpaid === 1 ? "it" : "they"} will be taken from your next payment.
        </Notice>
      )}

      {/* ===== ORDERS WAITING FOR PAYMENT ===== */}
      {otherPending.map((p) => (
        p.in_group && !p.group_lead ? (
          <div key={p.id} style={{ ...s.card, borderColor: "var(--gold)" }}>
            <div style={s.sectionLabel}>YOUR NEXT PACKAGE</div>
            <div style={{ fontFamily: cond, fontSize: 18 }}>{p.name}</div>
            <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 6, lineHeight: 1.5 }}>
              <b style={{ color: "var(--text)" }}>{p.group_other}</b> is paying for this package. It starts as soon as Karol confirms the payment — nothing for you to do.
            </div>
          </div>
        ) : (
          <div key={p.id} style={{ ...s.card, borderColor: "var(--gold)" }}>
            <div style={s.sectionLabel}>WAITING FOR PAYMENT</div>
            <div style={{ fontFamily: cond, fontSize: 18 }}>
              {p.name}{p.in_group ? ` × 2 — for you and ${p.group_other}` : ""}
            </div>
            <BankBox bank={bank} reference={p.reference} price={p.in_group ? p.group_total : p.price}
              dueText={p.in_group
                ? `One payment for both packages. They start when Karol confirms the payment.`
                : `Ordered ${dateShort(p.purchased_at)}. Your package starts when Karol confirms the payment.`} />
          </div>
        )
      ))}

      {/* ===== NEXT SESSIONS ===== */}
      {openUpcoming.length > 0 && (
        <div style={s.card}>
          <div style={s.sectionLabel}>NEXT SESSIONS</div>
          {openUpcoming.map((u) => (
            <div key={u.session_at} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontFamily: cond, fontSize: 17, letterSpacing: "0.03em" }}>
                {sessionTime(u.session_at)}
                {u.type === "duo" && <span style={{ ...s.badge("var(--steel)"), marginLeft: 8 }}>DUO</span>}
              </div>
              <button onClick={() => setConfirmCancel(u)} style={{ ...s.btnGhost, width: "auto", padding: "6px 12px", fontSize: 12 }}>CANCEL</button>
            </div>
          ))}
          {confirmCancel && (
            <div style={{ marginTop: 12, padding: 14, background: "var(--bg3)", borderRadius: 10, border: `1px solid ${confirmCancel.can_cancel_free ? "var(--border)" : "var(--red)"}` }}>
              <div style={{ fontFamily: cond, fontSize: 17, marginBottom: 6 }}>Cancel {sessionTime(confirmCancel.session_at)}?</div>
              <div style={{ fontSize: 13, color: confirmCancel.can_cancel_free ? "var(--gray)" : "var(--red)", marginBottom: 12, lineHeight: 1.5 }}>
                {confirmCancel.can_cancel_free
                  ? `More than ${cancelHours}h before — the session stays on your balance.`
                  : `Less than ${cancelHours}h before — this session will be used.`}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmCancel(null)} disabled={busy} style={{ ...s.btnGhost, flex: 1 }}>KEEP IT</button>
                <button onClick={doCancel} disabled={busy} style={{ ...s.btn, flex: 1 }}>{busy ? "..." : "CANCEL SESSION"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ACTIONS ===== */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {!plan && (
          <button onClick={() => setShowBuy(!showBuy)} style={{ ...s.btnGold, flex: 2 }}>
            {showBuy ? "CLOSE" : activePacks.length || online ? "BUY NEXT PACKAGE" : "BUY A PACKAGE"}
          </button>
        )}
        <button onClick={() => setShowHistory(!showHistory)} style={{ ...s.btnGhost, flex: 1 }}>
          {showHistory ? "HIDE HISTORY" : "HISTORY & INVOICES"}
        </button>
      </div>

      {showBuy && !plan && (
        <BuyFromPortal token={token} data={data} bank={bank} cancelHours={cancelHours}
          onDone={() => { setShowBuy(false); load(); }} />
      )}

      {showHistory && <History token={token} data={data} />}

      {standalone && (
        <div style={{ fontSize: 12, color: "var(--gray2)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          This is your personal page — save it to your home screen or bookmarks.<br />Don't share the link.
        </div>
      )}
    </div>
  );
}

// ---------- buy next package (client's own prices) ----------
function BuyFromPortal({ token, data, bank, cancelHours, onDone }) {
  const [selected, setSelected] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const [payBoth, setPayBoth] = useState(false);
  const options = data.prices || [];
  const partnerName = data.client?.partner_name || null;
  const canPayBoth = !!partnerName && selected?.kind === "duo";
  const total = selected ? Number(selected.price) + (canPayBoth && payBoth ? Number(selected.partner_price || 0) : 0) : 0;

  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await startPortalCheckout({ token, clientName: data.client?.name, pkg: selected,
        payForPartner: canPayBoth && payBoth, termsAccepted: accepted });
      if (r.kind === "redirect" && r.url) { window.location.href = r.url; return; }
      setResult(r);
    } catch (e) { setErr(friendlyError(e)); }
    setBusy(false);
  };

  if (result) {
    return (
      <div style={s.card}>
        <div style={{ fontFamily: cond, fontSize: 20, color: "var(--gold)", marginBottom: 4 }}>Order received ✓</div>
        <div style={{ fontSize: 14, color: "var(--gray)" }}>
          {result.partnerName
            ? `${result.name} for you and ${result.partnerName}. Both packages start as soon as Karol confirms the payment.`
            : `${result.name}. Your package starts as soon as Karol confirms the payment.`}
        </div>
        {result.partnerName && (
          <SplitSummary ownPrice={result.ownPrice} partnerPrice={result.partnerPrice} partnerName={result.partnerName} pkgName={result.name} />
        )}
        <BankBox bank={bank} reference={result.reference} price={result.price} />
        <button onClick={onDone} style={{ ...s.btnGhost, marginTop: 12 }}>DONE</button>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <div style={s.sectionLabel}>CHOOSE YOUR PACKAGE</div>
      {options.length === 0 && <div style={{ fontSize: 13, color: "var(--gray2)" }}>No packages available — message Karol.</div>}
      {options.map((p) => (
        <PriceOption key={p.package_id} p={p} selected={selected?.package_id === p.package_id}
          onClick={() => { setSelected(p); setAccepted(false); }} />
      ))}
      {canPayBoth && (
        <WhoPays payBoth={payBoth} onChange={setPayBoth} ownPrice={selected.price}
          partnerPrice={selected.partner_price} partnerName={partnerName} />
      )}
      {canPayBoth && payBoth && (
        <SplitSummary ownPrice={selected.price} partnerPrice={selected.partner_price} partnerName={partnerName} pkgName={selected.name} />
      )}
      {selected && (
        <div style={{ marginTop: 8 }}>
          <div style={{ ...s.sectionLabel, marginBottom: 8 }}>TERMS</div>
          <TermsList pkg={selected} cancelHours={cancelHours} />
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
            <span>I understand and accept these terms</span>
          </label>
          {err && <Notice tone="error">{err}</Notice>}
          <button onClick={go} disabled={!accepted || busy} style={{ ...s.btnGold, opacity: accepted && !busy ? 1 : 0.4 }}>
            {busy ? "..." : `ORDER · ${gbp(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- history: sessions + payments + invoices ----------
function History({ token, data }) {
  const paid = (data.purchases || []).filter((p) => p.status === "paid");
  return (
    <div style={s.card}>
      <div style={s.sectionLabel}>PAYMENTS</div>
      {paid.length === 0 && <div style={{ fontSize: 13, color: "var(--gray2)", marginBottom: 8 }}>No payments yet.</div>}
      {paid.map((p) => (
        <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span>{p.name}{p.in_group && p.group_lead ? ` × 2 (you + ${p.group_other})` : ""}</span>
            <span style={{ fontFamily: cond, fontSize: 17 }}>
              {p.in_group && !p.group_lead ? `paid by ${p.group_other}`
                : p.in_group ? gbp(p.group_total)
                : Number(p.price) > 0 ? gbp(p.price) : "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gray2)", marginTop: 2 }}>
            <span>
              Paid {dateShort(p.purchased_at)}
              {p.sessions_total !== null && ` · ${p.sessions_left} of ${p.sessions_total} left`}
              {p.expires_at && ` · ${new Date(p.expires_at).getTime() > Date.now() ? "until" : "ended"} ${dateShort(lastValidDay(p.expires_at))}`}
            </span>
            {p.invoice_id && (
              <a href={`/k/${token}/invoice/${p.invoice_id}`} style={{ color: "var(--gold)", textDecoration: "none" }}>
                Invoice {p.invoice_number} →
              </a>
            )}
          </div>
        </div>
      ))}

      <div style={{ ...s.sectionLabel, marginTop: 18 }}>SESSIONS</div>
      {(data.sessions || []).length === 0 && <div style={{ fontSize: 13, color: "var(--gray2)" }}>No sessions yet.</div>}
      {(data.sessions || []).map((x) => (
        <div key={x.session_at} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
          <span style={{ color: "var(--gray)" }}>{sessionTime(x.session_at)}</span>
          <span style={{ color: x.counted ? "var(--text)" : "var(--gray2)" }}>
            {STATUS_TEXT[x.status]}{x.counted ? " · −1" : ""}{x.unpaid ? " · unpaid" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- printable invoice: /k/<token>/invoice/<id> ----------
function InvoicePage({ token, invoiceId }) {
  const [inv, setInv] = useState(undefined);
  useEffect(() => { portalInvoice(token, invoiceId).then(setInv).catch(() => setInv(null)); }, [token, invoiceId]);

  if (inv === undefined) return <div style={{ padding: 40, fontFamily: cond, letterSpacing: "0.2em" }}>LOADING...</div>;
  if (inv === null) return <div style={{ padding: 40 }}>Invoice not found.</div>;

  const row = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #ddd" };
  const method = { cash: "Cash", transfer: "Bank transfer", revolut: "Card (Revolut)" }[inv.method] || inv.method;

  return (
    <div style={{ background: "#fff", color: "#111", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 18mm; } }`}</style>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <a href={`/k/${token}`} style={{ ...s.btnGhost, color: "#333", borderColor: "#ccc", textDecoration: "none", textAlign: "center", width: "auto" }}>← BACK</a>
          <button onClick={() => window.print()} style={{ ...s.btnGold, width: "auto" }}>PRINT / SAVE AS PDF</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: cond, fontSize: 28, fontWeight: 900, letterSpacing: "0.08em" }}>
              {(inv.business_name || "KARLITO STRENGTH").toUpperCase()}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#444", whiteSpace: "pre-line", marginTop: 6 }}>
              {[inv.business_owner, inv.business_address, inv.business_email].filter(Boolean).join("\n")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: cond, fontSize: 30, fontWeight: 900, letterSpacing: "0.1em" }}>INVOICE</div>
            <div style={{ fontSize: 14 }}>{inv.number}</div>
            <div style={{ fontSize: 13, color: "#444" }}>{dateLong(inv.issued_at)}</div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#777", marginBottom: 4 }}>BILLED TO</div>
          <div style={{ fontSize: 15 }}>{inv.client_name}</div>
          {inv.client_email && <div style={{ fontSize: 13, color: "#444" }}>{inv.client_email}</div>}
        </div>

        <div style={{ ...row, fontSize: 11, letterSpacing: "0.15em", color: "#777", borderBottom: "2px solid #111" }}>
          <span>DESCRIPTION</span><span>AMOUNT</span>
        </div>
        <div style={row}><span>{inv.description}</span><span>{gbp(inv.amount_gbp)}</span></div>
        <div style={{ ...row, fontWeight: 700, fontSize: 17, borderBottom: "none" }}>
          <span>TOTAL</span><span>{gbp(inv.amount_gbp)}</span>
        </div>

        <div style={{ marginTop: 24, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
          <div><b>Status:</b> Paid — {method}, {dateLong(inv.issued_at)}</div>
          {inv.vat_note && <div>{inv.vat_note}</div>}
        </div>
        <div style={{ marginTop: 40, fontSize: 12, color: "#888" }}>Thank you for training with Karlito Strength.</div>
      </div>
    </div>
  );
}
