// ============================================================
// COACH — PAYMENTS & PACKAGES PANEL (Coach tab → 💷)
// TODAY: orders to confirm, sessions to review, new enquiries, revenue
// CLIENTS: balances + client card (log sessions, payments, prices, plan, pair, slots, link)
// ============================================================
import { useState, useEffect } from "react";
import { s } from "../lib/styles";
import {
  runAutolog, getPendingOrders, confirmPayment, rejectOrder, setOrderPrice, getReviewQueue,
  getLeads, updateLead, getMonthlyRevenue, sumRevenueForMonth, generatePlanOrders,
  getBalances, getClientsSimple, createClientRecord, updateClientRecord, getClientDetails,
  createPair, endPair, addSlot, endSlot, logSession, logPairSession, updateSession, deleteSession,
  addManualPurchase, freezePurchase, setPriceOverride, setPlan, endPlan, getPackages,
  STATUS_LABELS, STATUS_COUNTS, WEEKDAYS, METHOD_LABELS,
  formatGBP, formatDate, formatDateTime, daysUntil, lastValidDay, isEndingSoon, portalLink, toLocalInput,
} from "../lib/packages";

const cond = "'Barlow Condensed', sans-serif";
const small = { fontSize: 12, color: "var(--gray2)" };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" };
const btnS = (bg = "var(--gold)", fg = "#111") => ({ background: bg, color: fg, border: "none", borderRadius: 6, padding: "8px 12px", fontFamily: cond, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap" });
const ghostS = { ...s.btnGhost, width: "auto", padding: "7px 12px", fontSize: 12 };

function Toast({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", bottom: 86, left: 16, right: 16, maxWidth: 448, margin: "0 auto", zIndex: 999,
      background: msg.error ? "var(--red)" : "var(--bg4)", color: "#fff", padding: "12px 14px", borderRadius: 10, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
      {msg.text}
    </div>
  );
}

function Section({ title, right, children, open: openDefault = true }) {
  const [open, setOpen] = useState(openDefault);
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ ...s.sectionLabel, marginBottom: 0 }}>{title}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          {right}
          <span onClick={() => setOpen(!open)} style={{ color: "var(--gray2)", fontSize: 12, cursor: "pointer" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

function errText(e) {
  const m = String(e?.message || e || "");
  if (m.includes("ledger_client_time_uniq") || m.includes("duplicate key")) return "There is already a session at this time.";
  if (m.includes("Max zamrożenie")) return "Max freeze is 14 days.";
  if (m.includes("nie czeka na płatność")) return "This order is no longer waiting for payment.";
  if (m.includes("Tylko coach")) return "Coach account required.";
  return m || "Something went wrong";
}

// ============================================================
export function CoachPackages() {
  const [tab, setTab] = useState("today");
  const [clientId, setClientId] = useState(null);
  const [toast, setToast] = useState(null);
  const notify = (text, error = false) => { setToast({ text, error }); setTimeout(() => setToast(null), 3500); };

  return (
    <div>
      {!clientId && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["today", "TODAY"], ["clients", "CLIENTS"]].map(([k, label]) => (
            <div key={k} onClick={() => setTab(k)} style={{ ...s.pill(tab === k), flex: 1, textAlign: "center" }}>{label}</div>
          ))}
        </div>
      )}
      {clientId ? (
        <ClientCard id={clientId} onBack={() => setClientId(null)} notify={notify} />
      ) : tab === "today" ? (
        <Today notify={notify} openClient={setClientId} />
      ) : (
        <Clients notify={notify} openClient={setClientId} />
      )}
      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ============================================================
// TODAY
// ============================================================
function Today({ notify, openClient }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [review, setReview] = useState([]);
  const [leads, setLeads] = useState([]);
  const [balances, setBalances] = useState([]);
  const [revenue, setRevenue] = useState({ total: 0, count: 0, byMethod: {} });
  const [autoLogged, setAutoLogged] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      const auto = await runAutolog().catch(() => []);
      setAutoLogged(auto || []);
      const [o, r, l, b, rev] = await Promise.all([getPendingOrders(), getReviewQueue(), getLeads().catch(() => []), getBalances(), getMonthlyRevenue()]);
      setOrders(o || []); setReview(r || []); setLeads((l || []).filter((x) => x.status === "new"));
      setBalances(b || []); setRevenue(sumRevenueForMonth(rev));
    } catch (e) { notify(errText(e), true); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // group "pay for both" orders into one
  const groups = [];
  const seen = {};
  orders.forEach((o) => {
    const key = o.order_group || o.id;
    if (!seen[key]) { seen[key] = { key, items: [] }; groups.push(seen[key]); }
    seen[key].items.push(o);
  });

  const confirm = async (purchaseId, method) => {
    setBusy(purchaseId);
    try { await confirmPayment(purchaseId, method); notify("Payment confirmed ✓ Package started, invoice created."); await load(); }
    catch (e) { notify(errText(e), true); }
    setBusy(null);
  };
  const reject = async (purchaseId) => {
    setBusy(purchaseId);
    try { await rejectOrder(purchaseId); notify("Order cancelled."); await load(); } catch (e) { notify(errText(e), true); }
    setBusy(null);
  };
  const savePrice = async (purchaseId) => {
    try { await setOrderPrice(purchaseId, editPrice); setEditId(null); notify("Amount updated."); await load(); }
    catch (e) { notify(errText(e), true); }
  };
  const resolveReview = async (l, type) => {
    try { await updateSession({ ledgerId: l.id, status: "done", sessionType: type }); notify("Saved."); await load(); }
    catch (e) { notify(errText(e), true); }
  };
  const setLeadStatus = async (id, status) => {
    try { await updateLead(id, status); await load(); } catch (e) { notify(errText(e), true); }
  };
  const genNextMonth = async () => {
    const d = new Date(); const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const month = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
    try { const r = await generatePlanOrders(month); notify(`Created ${r?.length || 0} payment request(s) for ${next.toLocaleDateString("en-GB", { month: "long" })}.`); await load(); }
    catch (e) { notify(errText(e), true); }
  };

  if (loading) return <div style={{ fontFamily: cond, color: "var(--gray)", letterSpacing: "0.2em", textAlign: "center", padding: 30 }}>LOADING...</div>;

  const ending = balances.filter((b) => b.active && (isEndingSoon(b) || b.unpaid_sessions > 0));

  return (
    <div>
      {/* revenue */}
      <div style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={s.sectionLabel}>PAID THIS MONTH</div>
          <div style={{ ...small }}>
            {revenue.count} payment{revenue.count === 1 ? "" : "s"}
            {Object.entries(revenue.byMethod).map(([m, v]) => ` · ${METHOD_LABELS[m] || m} ${formatGBP(v)}`).join("")}
          </div>
        </div>
        <div style={{ ...s.bigNum, fontSize: 40, color: "var(--gold)" }}>{formatGBP(revenue.total)}</div>
      </div>

      {/* orders */}
      <Section title={`WAITING FOR PAYMENT (${groups.length})`}>
        {groups.length === 0 && <div style={small}>Nothing to confirm.</div>}
        {groups.map((g) => {
          const lead = g.items.find((i) => i.group_lead) || g.items[0];
          const total = g.items.reduce((sum, i) => sum + Number(i.price_gbp), 0);
          const names = g.items.map((i) => i.clients?.full_name).join(" + ");
          const isPlan = !!lead.period_start;
          return (
            <div key={g.key} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div onClick={() => openClient(lead.client_id)} style={{ cursor: "pointer" }}>
                  <div style={{ fontFamily: cond, fontSize: 18 }}>{names}</div>
                  <div style={small}>
                    {lead.packages?.name}{g.items.length > 1 ? ` × ${g.items.length} (paid by ${lead.clients?.full_name})` : ""}
                    {isPlan ? ` · ${lead.note}` : ""} · ref <b style={{ color: "var(--gold)" }}>{lead.reference}</b> · {formatDate(lead.created_at)}
                  </div>
                  {lead.note && !isPlan && <div style={{ ...small, color: "var(--gray)" }}>{lead.note}</div>}
                </div>
                <div style={{ fontFamily: cond, fontSize: 22, fontWeight: 900, color: "var(--gold)" }}>{formatGBP(total)}</div>
              </div>
              {editId === lead.id ? (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input style={{ ...s.input, padding: "8px 10px" }} type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="New amount £" />
                  <button style={btnS()} onClick={() => savePrice(lead.id)}>SAVE</button>
                  <button style={ghostS} onClick={() => setEditId(null)}>✕</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <button disabled={busy === lead.id} style={btnS("#1f9d55", "#fff")} onClick={() => confirm(lead.id, "transfer")}>PAID ✓ TRANSFER</button>
                  <button disabled={busy === lead.id} style={btnS()} onClick={() => confirm(lead.id, "cash")}>PAID CASH</button>
                  {isPlan && g.items.length === 1 && <button style={ghostS} onClick={() => { setEditId(lead.id); setEditPrice(lead.price_gbp); }}>EDIT £</button>}
                  <button disabled={busy === lead.id} style={ghostS} onClick={() => reject(lead.id)}>CANCEL ORDER</button>
                </div>
              )}
            </div>
          );
        })}
        <button style={{ ...ghostS, marginTop: 12 }} onClick={genNextMonth}>CREATE NEXT MONTH'S PLAN PAYMENTS</button>
        <div style={{ ...small, marginTop: 4 }}>Happens automatically from the 25th — this button is just for doing it earlier.</div>
      </Section>

      {/* review */}
      {review.length > 0 && (
        <Section title={`CHECK (${review.length}) — PARTNER CANCELLED`}>
          {review.map((l) => (
            <div key={l.id} style={row}>
              <div>
                <div style={{ fontFamily: cond, fontSize: 16 }}>{l.clients?.full_name}</div>
                <div style={small}>{formatDateTime(l.session_at)} — trained alone?</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={ghostS} onClick={() => resolveReview(l, "duo")}>DUO</button>
                <button style={btnS()} onClick={() => resolveReview(l, "solo")}>AS 1:1</button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ending soon / unpaid */}
      <Section title={`ENDING SOON / UNPAID (${ending.length})`}>
        {ending.length === 0 && <div style={small}>All good.</div>}
        {ending.map((b) => (
          <div key={b.client_id} style={{ ...row, cursor: "pointer" }} onClick={() => openClient(b.client_id)}>
            <div>
              <div style={{ fontFamily: cond, fontSize: 16 }}>{b.full_name}</div>
              <div style={small}>
                {b.sessions_left} left{b.next_expiry ? ` · until ${formatDate(lastValidDay(b.next_expiry))}` : ""}
                {b.unpaid_sessions > 0 && <span style={{ color: "var(--red)" }}> · {b.unpaid_sessions} unpaid</span>}
              </div>
            </div>
            <span style={{ color: "var(--gray2)" }}>›</span>
          </div>
        ))}
      </Section>

      {/* leads */}
      <Section title={`NEW ENQUIRIES (${leads.length})`} open={leads.length > 0}>
        {leads.length === 0 && <div style={small}>No new enquiries.</div>}
        {leads.map((l) => (
          <div key={l.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: cond, fontSize: 17 }}>{l.name}</div>
              <div style={small}>{formatDate(l.created_at)}</div>
            </div>
            <div style={small}>{[l.goal, l.email, l.phone].filter(Boolean).join(" · ")}</div>
            {l.message && <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>"{l.message}"</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {l.phone && <a style={{ ...btnS("#1f9d55", "#fff"), textDecoration: "none" }} target="_blank" rel="noreferrer"
                href={`https://wa.me/${l.phone.replace(/\D/g, "").replace(/^0/, "44")}`}>WHATSAPP</a>}
              <a style={{ ...ghostS, textDecoration: "none" }} href={`mailto:${l.email}`}>EMAIL</a>
              <button style={ghostS} onClick={() => setLeadStatus(l.id, "contacted")}>CONTACTED</button>
              <button style={ghostS} onClick={() => setLeadStatus(l.id, "lost")}>✕</button>
            </div>
          </div>
        ))}
      </Section>

      {autoLogged.length > 0 && (
        <div style={{ ...small, marginTop: 4 }}>
          Auto-logged now from the schedule: {autoLogged.map((a) => `${a.client_name} (${formatDateTime(a.session_at)})`).join(", ")}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CLIENTS LIST
// ============================================================
function Clients({ notify, openClient }) {
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("active");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", mode: "in_person" });

  const load = async () => {
    try { setList(await getBalances()); } catch (e) { notify(errText(e), true); setList([]); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.full_name.trim()) return;
    try {
      const c = await createClientRecord({ ...form, full_name: form.full_name.trim(), email: form.email.trim().toLowerCase() });
      notify("Client added."); setAdding(false); setForm({ full_name: "", email: "", phone: "", mode: "in_person" });
      openClient(c.id);
    } catch (e) { notify(errText(e), true); }
  };

  if (!list) return <div style={{ fontFamily: cond, color: "var(--gray)", letterSpacing: "0.2em", textAlign: "center", padding: 30 }}>LOADING...</div>;

  const shown = list
    .filter((b) => (filter === "active" ? b.active : filter === "ending" ? b.active && isEndingSoon(b) : filter === "unpaid" ? b.unpaid_sessions > 0 : true))
    .filter((b) => !q || b.full_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input style={s.input} placeholder="Search client..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button style={btnS()} onClick={() => setAdding(!adding)}>{adding ? "✕" : "+ ADD"}</button>
      </div>

      {adding && (
        <div style={s.card}>
          <div style={s.sectionLabel}>NEW CLIENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={s.input} placeholder="Full name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input style={s.input} placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input style={s.input} placeholder="Phone (optional, for WhatsApp)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              {[["in_person", "IN PERSON"], ["online", "ONLINE"]].map(([k, l]) => (
                <div key={k} onClick={() => setForm({ ...form, mode: k })} style={{ ...s.pill(form.mode === k), flex: 1, textAlign: "center" }}>{l}</div>
              ))}
            </div>
            <button style={s.btnGold} onClick={add}>ADD CLIENT</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[["active", "ACTIVE"], ["ending", "ENDING SOON"], ["unpaid", "UNPAID"], ["all", "ALL"]].map(([k, l]) => (
          <div key={k} onClick={() => setFilter(k)} style={s.pill(filter === k)}>{l}</div>
        ))}
      </div>

      <div style={s.card}>
        {shown.length === 0 && <div style={small}>No clients here.</div>}
        {shown.map((b) => {
          const d = daysUntil(b.next_expiry);
          return (
            <div key={b.client_id} onClick={() => openClient(b.client_id)} style={{ ...row, cursor: "pointer", opacity: b.active ? 1 : 0.5 }}>
              <div>
                <div style={{ fontFamily: cond, fontSize: 17 }}>{b.full_name}{b.mode === "online" ? " · online" : ""}</div>
                <div style={small}>
                  {b.has_online ? "online active" : `${b.sessions_left} left`}
                  {b.next_expiry ? ` · ${d} day${d === 1 ? "" : "s"}` : ""}
                  {b.unpaid_sessions > 0 && <span style={{ color: "var(--red)" }}> · {b.unpaid_sessions} unpaid</span>}
                  {!b.profile_id && " · no app"}
                </div>
              </div>
              <div style={{ fontFamily: cond, fontSize: 24, fontWeight: 900, color: isEndingSoon(b) ? "var(--red)" : "var(--gold)" }}>{b.has_online ? "∞" : b.sessions_left}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CLIENT CARD
// ============================================================
function ClientCard({ id, onBack, notify }) {
  const [d, setD] = useState(null);
  const [packages, setPackages] = useState([]);
  const [allClients, setAllClients] = useState([]);

  const load = async () => {
    try {
      const [det, pk, cl] = await Promise.all([getClientDetails(id), getPackages(), getClientsSimple()]);
      setD(det); setPackages(pk || []); setAllClients(cl || []);
    } catch (e) { notify(errText(e), true); }
  };
  useEffect(() => { load(); }, [id]);

  if (!d) return <div style={{ fontFamily: cond, color: "var(--gray)", letterSpacing: "0.2em", textAlign: "center", padding: 30 }}>LOADING...</div>;

  const { client, purchases, ledger, overrides, plan, pair, partner, slots } = d;
  const kind = client.mode === "online" ? "online" : pair ? "duo" : "solo";
  const run = async (fn, ok) => { try { await fn(); if (ok) notify(ok); await load(); } catch (e) { notify(errText(e), true); } };

  return (
    <div>
      <button onClick={onBack} style={{ ...ghostS, marginBottom: 12 }}>← BACK</button>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: cond, fontSize: 30, fontWeight: 900, letterSpacing: "0.03em" }}>{client.full_name}</div>
        <div style={small}>
          {kind === "duo" ? `Duo with ${partner?.full_name}` : kind === "online" ? "Online" : "1:1"}
          {plan ? ` · Monthly plan ${plan.sessions_per_month} × ${formatGBP(plan.monthly_price)}` : ""}
          {!client.active ? " · INACTIVE" : ""}
        </div>
      </div>

      <LinkBox client={client} notify={notify} />
      <Balance purchases={purchases} run={run} />
      <LogSession client={client} pair={pair} partner={partner} run={run} />
      <Sessions ledger={ledger} run={run} />
      <AddPayment client={client} packages={packages.filter((p) => p.kind === kind)} overrides={overrides} run={run} />
      <Prices client={client} packages={packages.filter((p) => p.kind === kind)} overrides={overrides} run={run} />
      <Plan client={client} plan={plan} run={run} />
      <Pair client={client} pair={pair} partner={partner} allClients={allClients} run={run} />
      <Slots client={client} pair={pair} slots={slots} run={run} />
      <Details client={client} run={run} />
    </div>
  );
}

function LinkBox({ client, notify }) {
  const link = portalLink(client.access_token);
  const first = client.full_name.split(" ")[0];
  const text = `Hi ${first}! Here's your personal page — your sessions, payments and invoices, no login needed: ${link}`;
  const phone = (client.phone || "").replace(/\D/g, "").replace(/^0/, "44");
  return (
    <div style={{ ...s.card, borderColor: "var(--gold)" }}>
      <div style={s.sectionLabel}>CLIENT'S PERSONAL PAGE</div>
      <div style={{ fontSize: 12, color: "var(--gray)", wordBreak: "break-all", marginBottom: 10 }}>{link}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <a style={{ ...btnS("#1f9d55", "#fff"), textDecoration: "none" }} target="_blank" rel="noreferrer"
          href={phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`}>SEND ON WHATSAPP</a>
        <button style={btnS()} onClick={() => { try { navigator.clipboard.writeText(link); notify("Link copied."); } catch (e) {} }}>COPY LINK</button>
        <a style={{ ...ghostS, textDecoration: "none" }} href={link} target="_blank" rel="noreferrer">OPEN</a>
      </div>
    </div>
  );
}

function Balance({ purchases, run }) {
  const [freezeId, setFreezeId] = useState(null);
  const [days, setDays] = useState(7);
  const now = Date.now();
  const active = purchases.filter((p) => p.status === "paid" && (!p.expires_at || new Date(p.expires_at).getTime() > now) && (p.sessions_left === null || p.sessions_left > 0));
  const pending = purchases.filter((p) => p.status === "pending");
  const past = purchases.filter((p) => !active.includes(p) && !pending.includes(p)).slice(0, 6);
  const left = active.filter((p) => p.kind !== "online").reduce((n, p) => n + (p.sessions_left || 0), 0);

  return (
    <Section title="PACKAGES" right={<span style={{ fontFamily: cond, fontSize: 20, fontWeight: 900, color: "var(--gold)" }}>{left} left</span>}>
      {active.length === 0 && pending.length === 0 && <div style={small}>No active package.</div>}
      {[...pending, ...active].map((p) => (
        <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: cond, fontSize: 16 }}>{p.packages?.name}{p.note && p.period_start ? ` · ${p.note}` : ""}</div>
            <div style={{ fontFamily: cond, fontSize: 16, color: p.status === "pending" ? "var(--red)" : "var(--gold)" }}>
              {p.status === "pending" ? "UNPAID" : p.sessions_left !== null ? `${p.sessions_left}/${p.sessions_total}` : "active"}
            </div>
          </div>
          <div style={small}>
            {formatGBP(p.price_gbp)} · {METHOD_LABELS[p.method] || p.method} · {p.status === "pending" ? `ordered ${formatDate(p.created_at)} · ref ${p.reference}` : `paid ${formatDate(p.purchased_at)}`}
            {p.expires_at && p.status !== "pending" && ` · until ${formatDate(lastValidDay(p.expires_at))}`}
            {p.freeze_days > 0 && ` (frozen +${p.freeze_days}d)`}
          </div>
          {p.status === "pending" && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button style={btnS("#1f9d55", "#fff")} onClick={() => run(() => confirmPayment(p.id, "transfer"), "Payment confirmed ✓")}>PAID ✓ TRANSFER</button>
              <button style={btnS()} onClick={() => run(() => confirmPayment(p.id, "cash"), "Payment confirmed ✓")}>CASH</button>
            </div>
          )}
          {p.status === "paid" && p.expires_at && (
            freezeId === p.id ? (
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                <span style={small}>Extend by</span>
                <input style={{ ...s.input, width: 70, padding: "6px 8px" }} type="number" min="0" max="14" value={days} onChange={(e) => setDays(e.target.value)} />
                <span style={small}>days (max 14 total)</span>
                <button style={btnS()} onClick={() => { run(() => freezePurchase(p.id, days), "Validity extended."); setFreezeId(null); }}>SAVE</button>
              </div>
            ) : (
              <button style={{ ...ghostS, marginTop: 6 }} onClick={() => { setFreezeId(p.id); setDays(p.freeze_days || 7); }}>FREEZE / EXTEND</button>
            )
          )}
        </div>
      ))}
      {past.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ ...small, marginBottom: 4 }}>PAST</div>
          {past.map((p) => (
            <div key={p.id} style={{ ...small, padding: "3px 0" }}>
              {p.packages?.name} · {formatGBP(p.price_gbp)} · {formatDate(p.purchased_at)} · {p.sessions_left > 0 ? `expired, ${p.sessions_left} unused` : "used"}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function LogSession({ client, pair, partner, run }) {
  const [at, setAt] = useState(toLocalInput());
  const [type, setType] = useState(pair ? "duo" : "solo");
  const iso = () => new Date(at).toISOString();
  const log = (status, label) => run(() => logSession({ clientId: client.id, sessionAt: iso(), status, sessionType: type, pairId: type === "duo" ? pair?.id : null }), label);

  return (
    <Section title="LOG A SESSION">
      <input style={{ ...s.input, marginBottom: 10 }} type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      {pair && (
        <>
          <button style={{ ...s.btnGold, marginBottom: 10 }} onClick={() => run(() => logPairSession({ pairId: pair.id, sessionAt: iso() }), `Duo session logged for ${client.full_name.split(" ")[0]} + ${partner?.full_name.split(" ")[0]}.`)}>
            ✓ DUO SESSION DONE (BOTH)
          </button>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[["duo", "DUO"], ["solo", "AS 1:1"]].map(([k, l]) => (
              <div key={k} onClick={() => setType(k)} style={{ ...s.pill(type === k), flex: 1, textAlign: "center", fontSize: 12 }}>ONLY {client.full_name.split(" ")[0].toUpperCase()} · {l}</div>
            ))}
          </div>
        </>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button style={btnS("#1f9d55", "#fff")} onClick={() => log("done", "Session logged.")}>DONE</button>
        <button style={btnS("var(--bg4)", "#fff")} onClick={() => log("cancelled", "Cancellation logged (12h rule applied).")}>CLIENT CANCELLED</button>
        <button style={btnS("var(--red)", "#fff")} onClick={() => log("no_show", "No-show logged.")}>NO-SHOW</button>
        <button style={btnS("var(--bg3)", "#fff")} onClick={() => log("coach_cancelled", "Logged — not charged.")}>I CANCELLED</button>
      </div>
      <div style={{ ...small, marginTop: 6 }}>Client cancelled: the system checks the 12h rule against the time above. "I cancelled" never uses a session.</div>
    </Section>
  );
}

function Sessions({ ledger, run }) {
  const [delId, setDelId] = useState(null);
  return (
    <Section title={`SESSIONS (${ledger.length})`} open={false}>
      {ledger.length === 0 && <div style={small}>No sessions yet.</div>}
      {ledger.map((l) => (
        <div key={l.id} style={row}>
          <div>
            <div style={{ fontSize: 14 }}>
              {formatDateTime(l.session_at)}
              {l.session_type === "duo" && <span style={{ ...s.badge("var(--steel)"), marginLeft: 6 }}>DUO</span>}
            </div>
            <div style={small}>
              {l.source === "auto" ? "auto" : l.source === "client" ? "by client" : "manual"}
              {STATUS_COUNTS[l.status] && !l.purchase_id && <span style={{ color: "var(--red)" }}> · unpaid</span>}
              {l.review_needed && <span style={{ color: "var(--gold)" }}> · check</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select value={l.status} onChange={(e) => run(() => updateSession({ ledgerId: l.id, status: e.target.value }), "Updated.")}
              style={{ ...s.input, padding: "6px 8px", width: "auto", fontSize: 13 }}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              <option value="coach_cancelled">I cancelled</option>
            </select>
            {delId === l.id ? (
              <button style={btnS("var(--red)", "#fff")} onClick={() => { run(() => deleteSession(l.id), "Deleted."); setDelId(null); }}>DELETE</button>
            ) : (
              <span onClick={() => setDelId(l.id)} style={{ color: "var(--gray2)", cursor: "pointer", padding: 4 }}>✕</span>
            )}
          </div>
        </div>
      ))}
    </Section>
  );
}

function AddPayment({ client, packages, overrides, run }) {
  const [pkgId, setPkgId] = useState("");
  const [method, setMethod] = useState("transfer");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState("");
  const priceFor = (id) => {
    const o = overrides.find((x) => x.package_id === id);
    const p = packages.find((x) => x.id === id);
    return o ? o.price_gbp : p?.price_gbp;
  };
  const pick = (id) => { setPkgId(id); setPrice(id ? priceFor(id) : ""); };
  return (
    <Section title="ADD A PAYMENT (CASH / TRANSFER)" open={false}>
      <select style={{ ...s.input, marginBottom: 8 }} value={pkgId} onChange={(e) => pick(e.target.value)}>
        <option value="">Choose package...</option>
        {packages.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatGBP(priceFor(p.id))}</option>)}
      </select>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[["transfer", "TRANSFER"], ["cash", "CASH"]].map(([k, l]) => (
          <div key={k} onClick={() => setMethod(k)} style={{ ...s.pill(method === k), flex: 1, textAlign: "center" }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input style={s.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input style={s.input} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="£" />
      </div>
      <button style={{ ...s.btnGold, opacity: pkgId ? 1 : 0.4 }} disabled={!pkgId}
        onClick={() => run(() => addManualPurchase({ clientId: client.id, packageId: pkgId, method, price, purchasedAt: new Date(date + "T12:00:00").toISOString() }), "Payment added ✓ Package started.")}>
        ADD PAYMENT
      </button>
      <div style={{ ...small, marginTop: 6 }}>Validity counts from the payment date. Earlier unpaid sessions are taken from this package automatically.</div>
    </Section>
  );
}

function Prices({ client, packages, overrides, run }) {
  const [vals, setVals] = useState(() => Object.fromEntries(overrides.map((o) => [o.package_id, o.price_gbp])));
  return (
    <Section title="THIS CLIENT'S PRICES" open={overrides.length > 0}>
      <div style={{ ...small, marginBottom: 8 }}>Leave empty = standard price. Their personal page shows these prices.</div>
      {packages.map((p) => (
        <div key={p.id} style={row}>
          <div>
            <div style={{ fontSize: 14 }}>{p.name}</div>
            <div style={small}>standard {formatGBP(p.price_gbp)}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={{ ...s.input, width: 90, padding: "6px 8px" }} type="number" placeholder="—" value={vals[p.id] ?? ""}
              onChange={(e) => setVals({ ...vals, [p.id]: e.target.value })} />
            <button style={btnS()} onClick={() => run(() => setPriceOverride(client.id, p.id, vals[p.id] ?? ""), "Price saved.")}>SAVE</button>
          </div>
        </div>
      ))}
    </Section>
  );
}

function Plan({ client, plan, run }) {
  const [sessions, setSessions] = useState(plan?.sessions_per_month || 8);
  const [price, setPrice] = useState(plan?.monthly_price || "");
  const nm = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const [start, setStart] = useState(plan?.starts_month?.slice(0, 7) || `${nm.getFullYear()}-${String(nm.getMonth() + 1).padStart(2, "0")}`);
  return (
    <Section title="MONTHLY PLAN (FIXED PRICE)" open={!!plan}>
      <div style={{ ...small, marginBottom: 8 }}>
        For regular clients on a fixed monthly price. From the 25th the system creates next month's payment request. Sessions are valid only in that month.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}><div style={s.label}>Sessions / month</div><input style={s.input} type="number" value={sessions} onChange={(e) => setSessions(e.target.value)} /></div>
        <div style={{ flex: 1 }}><div style={s.label}>Price / month £</div><input style={s.input} type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      {!plan && (
        <div style={{ marginBottom: 8 }}><div style={s.label}>Starts (month)</div><input style={s.input} type="month" value={start} onChange={(e) => setStart(e.target.value)} /></div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ ...s.btnGold, flex: 2 }} disabled={!price}
          onClick={() => run(() => setPlan({ clientId: client.id, sessions, price, startsMonth: plan ? null : `${start}-01` }), plan ? "Plan updated (also unpaid months)." : "Plan created.")}>
          {plan ? "UPDATE PLAN" : "CREATE PLAN"}
        </button>
        {plan && <button style={{ ...ghostS, flex: 1 }} onClick={() => run(() => endPlan(client.id), "Plan ended.")}>END PLAN</button>}
      </div>
    </Section>
  );
}

function Pair({ client, pair, partner, allClients, run }) {
  const [pid, setPid] = useState("");
  return (
    <Section title="DUO PARTNER" open={!!pair}>
      {pair ? (
        <div style={row}>
          <div style={{ fontSize: 15 }}>Trains with <b>{partner?.full_name}</b></div>
          <button style={ghostS} onClick={() => run(() => endPair(pair.id), "Pair ended.")}>END PAIR</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <select style={s.input} value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">Choose partner...</option>
            {allClients.filter((c) => c.id !== client.id && c.active).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <button style={btnS()} disabled={!pid} onClick={() => run(() => createPair(client.id, pid), "Pair created — they now see duo prices.")}>PAIR</button>
        </div>
      )}
    </Section>
  );
}

function Slots({ client, pair, slots, run }) {
  const [weekday, setWeekday] = useState(2);
  const [time, setTime] = useState("08:00");
  const [forPair, setForPair] = useState(!!pair);
  return (
    <Section title={`REGULAR SLOTS (${slots.length})`} open={slots.length > 0}>
      <div style={{ ...small, marginBottom: 8 }}>Sessions in regular slots are logged as done automatically after they end. You only log exceptions.</div>
      {slots.map((sl) => (
        <div key={sl.id} style={row}>
          <div style={{ fontSize: 15 }}>
            {WEEKDAYS[sl.weekday]} {String(sl.start_time).slice(0, 5)} · {sl.duration_min} min{sl.pair_id ? " · duo" : ""}
          </div>
          <button style={ghostS} onClick={() => run(() => endSlot(sl.id), "Slot removed.")}>REMOVE</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <select style={{ ...s.input, width: "auto" }} value={weekday} onChange={(e) => setWeekday(e.target.value)}>
          {WEEKDAYS.slice(1).map((w, i) => <option key={w} value={i + 1}>{w}</option>)}
        </select>
        <input style={{ ...s.input, width: "auto" }} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        {pair && (
          <div onClick={() => setForPair(!forPair)} style={s.pill(forPair)}>{forPair ? "DUO SLOT" : "1:1 SLOT"}</div>
        )}
        <button style={btnS()} onClick={() => run(() => addSlot({ clientId: client.id, pairId: forPair && pair ? pair.id : null, weekday, startTime: time }), "Slot added.")}>+ ADD SLOT</button>
      </div>
    </Section>
  );
}

function Details({ client, run }) {
  const [f, setF] = useState({ full_name: client.full_name, email: client.email || "", phone: client.phone || "", mode: client.mode, active: client.active });
  return (
    <Section title="DETAILS" open={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input style={s.input} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Full name" />
        <input style={s.input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" />
        <input style={s.input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone" />
        <div style={{ display: "flex", gap: 6 }}>
          {[["in_person", "IN PERSON"], ["online", "ONLINE"]].map(([k, l]) => (
            <div key={k} onClick={() => setF({ ...f, mode: k })} style={{ ...s.pill(f.mode === k), flex: 1, textAlign: "center" }}>{l}</div>
          ))}
          <div onClick={() => setF({ ...f, active: !f.active })} style={{ ...s.pill(f.active), flex: 1, textAlign: "center" }}>{f.active ? "ACTIVE" : "INACTIVE"}</div>
        </div>
        <button style={s.btnGold} onClick={() => run(() => updateClientRecord(client.id, {
          full_name: f.full_name.trim(), email: f.email.trim().toLowerCase() || null, phone: f.phone.trim() || null, mode: f.mode, active: f.active,
        }), "Saved.")}>SAVE</button>
      </div>
    </Section>
  );
}
