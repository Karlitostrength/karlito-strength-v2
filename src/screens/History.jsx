import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";

export function HistoryScreen({ authUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (authUser) {
          const { data } = await supabase
            .from("workouts")
            .select("*")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false });
          if (data && data.length > 0) {
            setLogs(data.map(w => ({
              ...w,
              date: w.created_at,
              workout: w.workout_title,
              exercises: w.exercises || [],
              comment: w.comment,
              coach_comment: w.coach_comment,
            })));
            setLoading(false);
            return;
          }
        }
        // Fallback to localStorage
        const raw = localStorage.getItem("ks_logs");
        const entries = raw ? JSON.parse(raw) : [];
        setLogs(entries.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch { }
      setLoading(false);
    };
    load();
  }, [authUser]);

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const dayCol = { A: "#4a9eff", B: "#f0a020", C: "var(--red)" };

  const volKg = (exercises) => exercises?.reduce((s, ex) =>
    s + (ex.sets || []).filter(st => st.done && st.weight && st.reps)
      .reduce((s2, st) => s2 + parseFloat(st.weight) * parseFloat(st.reps), 0), 0) || 0;

  const maxRPE = (exercises) => {
    const all = exercises?.flatMap(ex => (ex.sets || []).filter(s => s.done).map(s => s.rpe)) || [];
    return all.length ? Math.max(...all) : null;
  };

  if (loading) return (
    <div style={{ ...s.screen, textAlign: "center", paddingTop: 60 }}>
      <div style={{ fontSize: 13, color: "var(--gray)", letterSpacing: "0.1em" }}>LOADING...</div>
    </div>
  );

  if (logs.length === 0) return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>WORKOUT HISTORY</div>
      <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No logs yet</div>
        <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.7 }}>
          After a workout press<br /><strong style={{ color: "var(--white)" }}>💾 SAVE WORKOUT</strong><br />and it will appear here.
        </div>
      </div>
    </div>
  );

  const totalVol = logs.reduce((s, l) => s + volKg(l.exercises), 0);
  const totalSessions = logs.length;
  const withFeedback = logs.filter(l => l.coach_comment).length;

  return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>WORKOUT HISTORY</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          ["SESSIONS", totalSessions, "total"],
          ["VOLUME", totalVol > 0 ? `${Math.round(totalVol / 1000)}t` : "—", "total"],
          ["FEEDBACK", withFeedback > 0 ? withFeedback : "—", "from coach"],
        ].map(([label, val, sub]) => (
          <div key={label} style={{ ...s.card, textAlign: "center", padding: "10px 6px" }}>
            <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: label === "FEEDBACK" && withFeedback > 0 ? "var(--gold)" : "var(--red)" }}>{val}</div>
            <div style={{ fontSize: 9, color: "var(--gray2)", marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {logs.map((log, idx) => {
        const vol = volKg(log.exercises);
        const rpe = maxRPE(log.exercises);
        const isOpen = expanded === idx;
        const col = dayCol[log.day] || "var(--red)";
        const hasCoachFeedback = !!log.coach_comment;
        const doneSets = log.exercises?.reduce((s, ex) => s + ((ex.sets || []).filter(st => st.done).length || (ex.done ? 1 : 0)), 0) || 0;
        const allSets = log.exercises?.reduce((s, ex) => s + Math.max((ex.sets || []).length, 1), 0) || 0;

        return (
          <div key={idx}
            style={{ ...s.card, marginBottom: 10, borderLeft: `3px solid ${hasCoachFeedback ? "var(--gold)" : col}`, cursor: "pointer" }}
            onClick={() => setExpanded(isOpen ? null : idx)}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ ...s.badge(col), fontSize: 10 }}>DAY {log.day}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {log.week}</div>
                  {hasCoachFeedback && (
                    <div style={{ fontSize: 9, background: "rgba(201,168,76,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
                      🎯 FEEDBACK
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  {(log.workout || "").replace(/DAY [ABC] — /, "")}
                </div>
                <div style={{ fontSize: 11, color: "var(--gray)" }}>{fmtDate(log.date)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {vol > 0 && (
                  <>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{Math.round(vol)}</div>
                    <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em" }}>KG VOL</div>
                  </>
                )}
                <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>{doneSets}/{allSets} sets</div>
                {rpe != null && (
                  <div style={{ ...s.badge(rpe >= 9 ? "var(--red)" : "var(--gray2)"), fontSize: 9, marginTop: 4, display: "inline-block" }}>RPE {rpe}</div>
                )}
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 14, animation: "fadeIn 0.2s ease" }}>
                <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />

                {log.exercises?.map((ex, ei) => {
                  const hasOldSets = (ex.sets || []).filter(st => st.done && st.weight).length > 0;
                  const hasNewResult = ex.result;
                  if (!hasOldSets && !hasNewResult && !ex.done) return null;
                  return (
                    <div key={ei} style={{ marginBottom: 10 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: col, marginBottom: 4, letterSpacing: "0.06em", display: "flex", justifyContent: "space-between" }}>
                        <span>{ex.name}</span>
                        {ex.planned && <span style={{ fontSize: 11, color: "var(--gray2)", fontWeight: 400 }}>Plan: {ex.planned.sets}×{ex.planned.reps}@{ex.planned.weight}kg</span>}
                      </div>
                      {hasNewResult ? (
                        <div style={{ fontSize: 13, color: "var(--text)", background: "var(--bg3)", borderRadius: 5, padding: "6px 10px", lineHeight: 1.5 }}>
                          {ex.result}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {ex.sets?.map((set, si) => !set.done ? null : (
                            <div key={si} style={{ background: "var(--bg3)", border: `1px solid ${set.rpe >= 9 ? "rgba(196,30,30,0.5)" : "var(--border)"}`, borderRadius: 5, padding: "4px 8px", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{set.weight}kg</span>
                              <span style={{ fontSize: 12, color: "var(--gray2)" }}>×</span>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{set.reps}</span>
                              <span style={{ fontSize: 10, color: "var(--gray2)", marginLeft: 2 }}>@{set.rpe}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {log.comment && (
                  <div style={{ fontSize: 12, color: "var(--gray)", fontStyle: "italic", background: "var(--bg3)", borderRadius: 4, padding: "8px 10px", marginTop: 8, lineHeight: 1.5, borderLeft: `2px solid ${col}` }}>
                    💬 {log.comment}
                  </div>
                )}

                {log.coach_comment && (
                  <div style={{ fontSize: 13, color: "var(--text)", background: "rgba(201,168,76,0.06)", borderRadius: 6, padding: "12px 14px", marginTop: 10, lineHeight: 1.6, border: "1px solid rgba(201,168,76,0.25)" }}>
                    <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 6 }}>
                      🎯 COACH FEEDBACK
                    </div>
                    {log.coach_comment}
                  </div>
                )}

                <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 10, textAlign: "right", letterSpacing: "0.08em" }}>
                  CLICK TO COLLAPSE ↑
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
