import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";
import { sendPushToAllUsers } from "../lib/push";

const TYPE_META = {
  competition: { icon: "🏆", label: "COMP", color: "var(--red)" },
  record:      { icon: "🔥", label: "RECORD", color: "var(--gold)" },
  milestone:   { icon: "⭐", label: "MILESTONE", color: "var(--steel)" },
};

const fmtEventDate = (iso) => {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.ceil((d - today) / 86400000);
  const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (diff < 0) return { dateStr, badge: "past", days: diff };
  if (diff === 0) return { dateStr, badge: "TODAY", days: 0 };
  if (diff === 1) return { dateStr, badge: "TOMORROW", days: 1 };
  if (diff <= 7) return { dateStr, badge: `${diff} DAYS`, days: diff };
  return { dateStr, badge: `${diff}d`, days: diff };
};

export function ComingUp({ authUser, isCoach, userName }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", event_type: "competition", event_date: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true });
      setEvents(data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addEvent = async () => {
    if (!form.title.trim() || !form.event_date) return;
    setSaving(true);
    try {
      await supabase.from("events").insert({
        user_id: authUser.id,
        athlete_name: userName || "Athlete",
        title: form.title.trim(),
        event_type: form.event_type,
        event_date: form.event_date,
      });
      setForm({ title: "", event_type: "competition", event_date: "" });
      setShowAdd(false);
      await load();
    } catch (e) {}
    setSaving(false);
  };

  const deleteEvent = async (id) => {
    if (!confirm("Remove this event?")) return;
    try {
      await supabase.from("events").delete().eq("id", id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e) {}
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ ...s.sectionLabel, marginBottom: 0 }}>⚔️ COMING UP</div>
        <div onClick={() => setShowAdd(v => !v)}
          style={{ fontSize: 12, color: "var(--gold)", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
          {showAdd ? "✕ CLOSE" : "+ ADD"}
        </div>
      </div>

      {showAdd && (
        <div style={{ ...s.card, marginBottom: 12, borderColor: "var(--gold-dim)" }}>
          <label style={s.label}>WHAT'S HAPPENING?</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. London Open, PR attempt, first muscle-up..."
            style={{ ...s.input, marginBottom: 12 }} />

          <label style={s.label}>TYPE</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {Object.entries(TYPE_META).map(([key, m]) => (
              <div key={key} onClick={() => setForm(f => ({ ...f, event_type: key }))}
                style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${form.event_type === key ? m.color : "var(--border)"}`,
                  background: form.event_type === key ? `${m.color}15` : "transparent" }}>
                <div style={{ fontSize: 18 }}>{m.icon}</div>
                <div style={{ fontSize: 9, color: form.event_type === key ? m.color : "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <label style={s.label}>DATE</label>
          <input type="date" value={form.event_date}
            onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
            style={{ ...s.input, marginBottom: 12, colorScheme: "dark" }} />

          <button onClick={addEvent} disabled={saving || !form.title.trim() || !form.event_date}
            style={{ ...s.btn, opacity: (saving || !form.title.trim() || !form.event_date) ? 0.5 : 1 }}>
            {saving ? "ADDING..." : "ADD TO BOARD →"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ ...s.card, textAlign: "center", padding: 20, fontSize: 12, color: "var(--gray)" }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⚔️</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.5 }}>
            No upcoming events yet.<br/>Add your comp or record attempt — let the tribe know.
          </div>
        </div>
      ) : (
        events.map(ev => {
          const meta = TYPE_META[ev.event_type] || TYPE_META.competition;
          const dt = fmtEventDate(ev.event_date);
          const isSoon = dt.days <= 7;
          const canDelete = ev.user_id === authUser.id || isCoach;
          return (
            <div key={ev.id} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${meta.color}`, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>
                  <span style={{ color: meta.color, fontWeight: 700 }}>{ev.athlete_name}</span> · {dt.dateStr}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ display: "inline-block", background: isSoon ? `${meta.color}22` : "var(--bg3)", color: isSoon ? meta.color : "var(--gray2)", fontSize: 10, padding: "3px 8px", borderRadius: 5, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
                  {dt.badge}
                </div>
                {canDelete && (
                  <div onClick={() => deleteEvent(ev.id)}
                    style={{ fontSize: 10, color: "var(--gray2)", cursor: "pointer", marginTop: 6 }}>✕ remove</div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Broadcast (coach only) — send message to all athletes ─────────────────────

export function BroadcastButton({ isCoach }) {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isCoach) return null;

  const broadcast = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await sendPushToAllUsers(title.trim() || "📢 Message from Coach Karlito", msg.trim(), "broadcast", "/");
      setSent(true);
      setMsg(""); setTitle("");
      setTimeout(() => { setSent(false); setShow(false); }, 1800);
    } catch (e) {}
    setSending(false);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {!show ? (
        <button onClick={() => setShow(true)} style={{ ...s.btnGhost, fontSize: 13 }}>
          📢 BROADCAST TO ALL ATHLETES
        </button>
      ) : (
        <div style={{ ...s.card, borderColor: "var(--red-dim)" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, marginBottom: 12, color: "var(--accent)" }}>
            📢 BROADCAST
          </div>
          {sent ? (
            <div style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900 }}>SENT TO ALL ATHLETES</div>
            </div>
          ) : (
            <>
              <label style={s.label}>TITLE (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="📢 Message from Coach Karlito"
                style={{ ...s.input, marginBottom: 12 }} />
              <label style={s.label}>MESSAGE</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="e.g. Gym closed this Saturday — sessions moved to Sunday. Details in chat."
                rows={3} style={{ ...s.input, resize: "none", lineHeight: 1.5, marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={broadcast} disabled={sending || !msg.trim()}
                  style={{ ...s.btn, flex: 1, opacity: (sending || !msg.trim()) ? 0.5 : 1 }}>
                  {sending ? "SENDING..." : "SEND TO ALL →"}
                </button>
                <button onClick={() => setShow(false)} style={{ ...s.btnGhost, width: "auto", padding: "12px 20px" }}>CANCEL</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
