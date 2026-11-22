// Karlito Strength — codzienny automat (Vercel Cron) + faktury od razu po PAID.
//
//   /api/daily?mode=morning   07:00  sesje ze stałych terminów → done, płatności planów,
//                                    maile: zamówienia, przypomnienia, faktury, kończące się pakiety
//   /api/daily?mode=evening   18:00  "jutro sesja, a brak opłaconego pakietu"
//   /api/daily?mode=invoices         tylko faktury — woła panel trenera po kliknięciu PAID
//
// Zmienne w Vercel (bez VITE_): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET,
// APP_URL, RESEND_API_KEY. Opcjonalnie: EMAIL_FROM, EMAIL_REPLY_TO.

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const APP_URL = (process.env.APP_URL || "https://www.karlitostrength.com").replace(/\/$/, "");
const FROM = process.env.EMAIL_FROM || "Karlito Strength <hello@karlitostrength.com>";
const PUBLISHABLE = "sb_publishable_-9TPMx_XdGI0Ur5m-Utqeg_drghUgIy";

// ---------- Supabase ----------
function sbHeaders(userToken) {
  const h = { apikey: SB_KEY, "Content-Type": "application/json" };
  if (userToken) h.Authorization = `Bearer ${userToken}`;
  else if (SB_KEY.startsWith("eyJ")) h.Authorization = `Bearer ${SB_KEY}`; // stary format klucza
  return h;
}
async function rpc(fn, args = {}, userToken) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers: sbHeaders(userToken), body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${fn}: ${r.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
async function isCoach(userToken) {
  try { return (await rpc("ks_is_coach", {}, userToken)) === true; } catch { return false; }
}

// ---------- formatowanie ----------
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gbp = (n) => "£" + Number(n || 0).toFixed(2).replace(/\.00$/, "");
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "there";
const tz = { timeZone: "Europe/London" };
const dateLong = (d) => new Date(d).toLocaleDateString("en-GB", { ...tz, weekday: "long", day: "numeric", month: "long" });
const dateShort = (d) => new Date(d).toLocaleDateString("en-GB", { ...tz, day: "numeric", month: "long", year: "numeric" });
const timeHM = (d) => new Date(d).toLocaleTimeString("en-GB", { ...tz, hour: "2-digit", minute: "2-digit" });
const monthYear = (d) => new Date(d).toLocaleDateString("en-GB", { ...tz, month: "long", year: "numeric" });
const portal = (j) => `${APP_URL}/k/${j.token}`;

function layout(title, bodyHtml, cta) {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:#c9a227;color:#111;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:8px;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#111;color:#c9a227;padding:18px 22px;border-radius:10px 10px 0 0;font-weight:900;letter-spacing:.08em">KARLITO STRENGTH</div>
<div style="background:#fff;padding:24px 22px;border-radius:0 0 10px 10px;line-height:1.55;font-size:15px">
<h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>${bodyHtml}${button}
<p style="color:#888;font-size:12px;margin-top:28px">Questions? Just reply to this email.</p>
</div></div></body></html>`;
}

function bankBox(s, j) {
  const row = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0;font-weight:700">${esc(v)}</td></tr>`;
  return `<table style="background:#f7f3e6;border-radius:8px;padding:12px 14px;margin:14px 0;border-collapse:separate">
${row("Amount", gbp(j.amount))}${row("Account name", s.bank_account_name)}${row("Sort code", s.bank_sort_code)}
${row("Account no.", s.bank_account_no)}${row("Reference", j.reference)}</table>
<p style="font-size:13px;color:#666">Please use the reference exactly as shown so I can match your payment.</p>`;
}

const what = (j) => j.period_start ? `${j.package} — ${monthYear(j.period_start)}` : j.package;
const CASH_LINE = `<p>Prefer cash? Just bring it to your next session.</p>`;
// Płatność za styczeń wychodzi 28 grudnia → życzenia noworoczne + mocny start roku
const isJanuary = (j) => j.period_start && new Date(j.period_start).getUTCMonth() === 0;
const festive = (j) => isJanuary(j)
  ? `<p>Happy New Year! 🎉 Thank you for training with me this year — let's make ${new Date(j.period_start).getUTCFullYear()} your strongest yet.</p>`
  : "";

// ---------- treść maili ----------
function buildEmail(j, s) {
  const hi = `<p>Hi ${esc(first(j.name))},</p>`;
  switch (j.kind) {
    case "order":
      return {
        subject: isJanuary(j) ? `Happy New Year + your ${what(j)}` : `Payment details — ${what(j)} (${j.reference})`,
        html: layout(isJanuary(j) ? "Happy New Year! 🎉" : "Your order is ready", `${hi}
${festive(j)}
<p>Here are the payment details for <b>${esc(what(j))}</b>${j.for_also ? ` for you and <b>${esc(j.for_also)}</b>` : ""}.</p>
${bankBox(s, j)}
${CASH_LINE}
<p>Your sessions are activated as soon as the payment arrives — you'll get the invoice by email.</p>`,
          { label: "VIEW MY PAGE", url: portal(j) }),
      };
    case "order_reminder":
      return {
        subject: `Reminder: payment for ${what(j)} (${j.reference})`,
        html: layout("Friendly reminder", `${hi}
<p>I haven't received the payment for <b>${esc(what(j))}</b> yet. If you've already sent it — thank you, ignore this email.</p>
${bankBox(s, j)}
${CASH_LINE}`, { label: "VIEW MY PAGE", url: portal(j) }),
      };
    case "invoice": {
      const url = `${portal(j)}/invoice/${j.invoice_id}`;
      return {
        subject: `Invoice ${j.number} — Karlito Strength`,
        html: layout(`Invoice ${j.number}`, `${hi}
<p>Thank you — your payment is confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0">
<tr><td style="padding:6px 0;color:#666">Invoice</td><td style="text-align:right;font-weight:700">${esc(j.number)}</td></tr>
<tr><td style="padding:6px 0;color:#666">Date</td><td style="text-align:right">${esc(dateShort(j.issued_at))}</td></tr>
<tr><td style="padding:6px 0;color:#666">For</td><td style="text-align:right">${esc(j.description)}</td></tr>
<tr><td style="padding:6px 0;color:#666">Paid by</td><td style="text-align:right">${j.method === "cash" ? "Cash" : "Bank transfer"}</td></tr>
<tr><td style="padding:10px 0;border-top:1px solid #ddd;font-weight:700">Total</td><td style="text-align:right;border-top:1px solid #ddd;font-weight:900">${gbp(j.amount)}</td></tr>
</table>`, { label: "VIEW / PRINT INVOICE", url }),
      };
    }
    case "low_sessions": {
      const n = Number(j.sessions_left);
      const head = n === 0 ? "Your package is used up" : `${n} session${n === 1 ? "" : "s"} left`;
      return {
        subject: n === 0 ? "Your package is used up — book the next one" : `You have ${n} session${n === 1 ? "" : "s"} left`,
        html: layout(head, `${hi}
<p>${n === 0 ? `You've used all sessions from <b>${esc(j.package)}</b>.`
            : `You have <b>${n}</b> session${n === 1 ? "" : "s"} left on <b>${esc(j.package)}</b>.`}</p>
<p>To keep training without a gap, grab your next package — it takes a minute.</p>`,
          { label: "BUY NEXT PACKAGE", url: portal(j) }),
      };
    }
    case "expiring":
      return {
        subject: `Your package expires on ${dateShort(j.expires_at)}`,
        html: layout("Your package is ending soon", `${hi}
<p><b>${esc(j.package)}</b> is valid until <b>${esc(dateLong(j.expires_at))}</b> and you still have <b>${esc(j.sessions_left)}</b> session${Number(j.sessions_left) === 1 ? "" : "s"} left.</p>
<p>Sessions not used by then expire — let's get them booked in.</p>`, { label: "VIEW MY PAGE", url: portal(j) }),
      };
    case "no_package":
      return {
        subject: `Your session tomorrow at ${timeHM(j.session_at)} — package needed`,
        html: layout("See you tomorrow!", `${hi}
<p>You're booked in for <b>${esc(dateLong(j.session_at))} at ${esc(timeHM(j.session_at))}</b>.</p>
<p>${j.has_pending
            ? "I'm still waiting for the payment for your order — please send it before the session. The details are on your page."
            : "You don't have an active package at the moment — please get one before the session."}</p>`,
          { label: j.has_pending ? "PAYMENT DETAILS" : "BUY A PACKAGE", url: portal(j) }),
      };
    default:
      return null;
  }
}

const textFromHtml = (html) => html.replace(/<\/td>/g, "  ").replace(/<(br|\/p|\/tr|\/h2)>/g, "\n").replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\n{3,}/g, "\n\n").trim();

async function sendEmail(to, { subject, html }, replyTo) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text: textFromHtml(html),
                           ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

async function pushCoach(title, message) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/profiles?role=eq.coach&select=id`, { headers: sbHeaders() });
    const coaches = r.ok ? await r.json() : [];
    for (const c of coaches) {
      await fetch(`${SB_URL}/functions/v1/send-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${PUBLISHABLE}` },
        body: JSON.stringify({ user_id: c.id, title, message, tag: "ks-daily", url: "/" }),
      });
    }
  } catch (e) { console.log("push failed", e); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- handler ----------
export default async function handler(req, res) {
  const q = req.query || {};
  const mode = ["morning", "evening", "invoices"].includes(q.mode) ? q.mode : "morning";
  const auth = req.headers.authorization || "";
  const cron = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const coach = !cron && auth.startsWith("Bearer ") && mode === "invoices" && (await isCoach(auth.slice(7)));
  if (!cron && !coach) return res.status(401).json({ error: "unauthorized" });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: "missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });

  const out = { mode, autolog: 0, plan_orders: 0, sent: [], failed: [], skipped_no_resend: 0 };
  try {
    if (mode === "morning") {
      out.autolog = (await rpc("ks_autolog_due"))?.length || 0;
      out.plan_orders = (await rpc("ks_generate_plan_orders"))?.length || 0;
    }

    const data = await rpc("ks_daily_jobs", { p_mode: mode });
    const s = data.settings || {};
    const replyTo = process.env.EMAIL_REPLY_TO || s.business_email || undefined;
    const done = [];

    for (const j of data.jobs || []) {
      const email = buildEmail(j, s);
      if (!email || !j.to) continue;
      if (!RESEND_KEY) { out.skipped_no_resend++; continue; }
      try {
        await sendEmail(j.to, email, replyTo);
        done.push({ key: j.key, kind: j.kind, client_id: j.client_id });
        out.sent.push(`${j.kind}: ${j.name}`);
      } catch (e) {
        out.failed.push(`${j.kind}: ${j.name} — ${e.message}`);
      }
      await sleep(600); // limit Resend: 2 maile / sekundę
    }
    if (done.length) await rpc("ks_mark_sent", { p_items: done });

    // podsumowanie dla Karola
    if (mode === "morning") {
      const c = data.coach || {};
      const parts = [];
      if (c.pending_count) parts.push(`💷 ${c.pending_count} waiting for payment (${gbp(c.pending_total)})`);
      if (out.autolog) parts.push(`✓ ${out.autolog} sessions logged`);
      if (out.plan_orders) parts.push(`📅 ${out.plan_orders} plan payments created`);
      if (out.sent.length) parts.push(`✉️ ${out.sent.length} emails sent`);
      if (out.failed.length) parts.push(`⚠️ ${out.failed.length} emails failed`);
      if ((c.no_email || []).length) parts.push(`No email: ${c.no_email.join(", ")}`);
      if (parts.length) await pushCoach("Karlito — today", parts.join(" · "));
    }
    if (mode === "evening") {
      const names = (data.jobs || []).filter((j) => j.kind === "no_package").map((j) => j.name);
      if (names.length) await pushCoach("Tomorrow without a package", names.join(", "));
    }
    return res.status(200).json(out);
  } catch (e) {
    console.error(e);
    if (mode !== "invoices") await pushCoach("Karlito automat — error", String(e.message).slice(0, 120));
    return res.status(500).json({ ...out, error: e.message });
  }
}
