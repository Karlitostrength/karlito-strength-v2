import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────

const parseWeight = (result) => {
  if (!result) return null;
  const match = result.match(/(\d+(?:\.\d+)?)\s*kg/i);
  return match ? parseFloat(match[1]) : null;
};

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtShort = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
const dayCol = { A: "#4a9eff", B: "#f0a020", C: "var(--red)", D: "#a78bfa" };

const volKg = (exercises) => exercises?.reduce((s, ex) =>
  s + (ex.sets || []).filter(st => st.done && st.weight && st.reps)
    .reduce((s2, st) => s2 + parseFloat(st.weight) * parseFloat(st.reps), 0), 0) || 0;

const maxRPE = (exercises) => {
  const all = exercises?.flatMap(ex => (ex.sets || []).filter(s => s.done).map(s => s.rpe)) || [];
  return all.length ? Math.max(...all) : null;
};

// ── ProgressChart ─────────────────────────────────────────────────────────────

function ProgressChart({ logs }) {
  const [selectedEx, setSelectedEx] = useState("");

  // Extract all exercise names from logs
  const exerciseNames = [...new Set(
    logs.flatMap(l => (l.exercises || []).map(e => e.name)).filter(Boolean)
  )].sort();

  useEffect(() => {
    if (exerciseNames.length > 0 && !selectedEx) {
      // Default to main lift if available
      const preferred = ["Squat", "Deadlift", "Bench Press", "Back Squat"];
      const found = preferred.find(p => exerciseNames.some(n => n.includes(p)));
      setSelectedEx(found ? exerciseNames.find(n => n.includes(found)) : exerciseNames[0]);
    }
  }, [exerciseNames.length]);

  // Build chart data for selected exercise
  const chartData = logs
    .map(log => {
      const ex = (log.exercises || []).find(e => e.name === selectedEx);
      if (!ex) return null;
      // Try result first, then planned weight
      const weight = parseWeight(ex.result) || ex.planned?.weight || ex.weight || null;
      if (!weight || weight === 0) return null;
      return {
        date: fmtShort(log.created_at),
        weight,
        rpe: ex.planned?.rpe || null,
        sets: ex.planned?.sets,
        reps: ex.planned?.reps,
        result: ex.result,
      };
    })
    .filter(Boolean)
    .reverse(); // chronological order

  const maxWeight = chartData.length ? Math.max(...chartData.map(d => d.weight)) : 0;
  const minWeight = chartData.length ? Math.min(...chartData.map(d => d.weight)) : 0;
  const gain = chartData.length >= 2 ? chartData[chartData.length - 1].weight - chartData[0].weight : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: "var(--gray2)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--red)" }}>
          {d.weight}kg
        </div>
        {d.sets && d.reps && <div style={{ fontSize: 11, color: "var(--gray)" }}>{d.sets}×{d.reps}</div>}
        {d.result && <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4, maxWidth: 160, lineHeight: 1.4 }}>{d.result}</div>}
      </div>
    );
  };

  if (exerciseNames.length === 0) return (
    <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 6 }}>NO DATA YET</div>
      <div style={{ fontSize: 13, color: "var(--gray)" }}>Complete some workouts to see your progress.</div>
    </div>
  );

  return (
    <div>
      {/* Exercise selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.15em", marginBottom: 8 }}>SELECT EXERCISE</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {exerciseNames.map(name => (
            <div key={name} onClick={() => setSelectedEx(name)}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                background: selectedEx === name ? "var(--red)" : "var(--bg3)",
                color: selectedEx === name ? "#fff" : "var(--gray)",
                border: `1px solid ${selectedEx === name ? "var(--red)" : "var(--border)"}`,
              }}>
              {name}
            </div>
          ))}
        </div>
      </div>

      {chartData.length < 2 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 6 }}>NOT ENOUGH DATA</div>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>Need at least 2 sessions with {selectedEx} to show a trend.</div>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              ["BEST", `${maxWeight}kg`, ""],
              ["SESSIONS", chartData.length, "logged"],
              ["PROGRESS", gain > 0 ? `+${gain}kg` : gain < 0 ? `${gain}kg` : "—", gain > 0 ? "↑" : gain < 0 ? "↓" : ""],
            ].map(([label, val, sub]) => (
              <div key={label} style={{ ...s.card, textAlign: "center", padding: "10px 6px" }}>
                <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, lineHeight: 1.1, color: label === "PROGRESS" && gain > 0 ? "var(--red)" : "var(--accent)" }}>{val}</div>
                {sub && <div style={{ fontSize: 9, color: gain > 0 ? "var(--red)" : "var(--gray2)", marginTop: 2 }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ ...s.card, padding: "16px 8px 8px" }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 12, paddingLeft: 8 }}>
              {selectedEx.toUpperCase()} — WEIGHT OVER TIME
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#666", fontFamily: "'Barlow Condensed', sans-serif" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  domain={[Math.max(0, minWeight - 10), maxWeight + 10]}
                  tick={{ fontSize: 9, fill: "#666", fontFamily: "'Barlow Condensed', sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--red)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--red)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "var(--red)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <div style={{ ...s.card, marginTop: 12 }}>
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.15em", marginBottom: 10 }}>SESSION LOG</div>
            {[...chartData].reverse().map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < chartData.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: 12, color: "var(--gray)" }}>{d.date}</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {d.sets && d.reps && <div style={{ fontSize: 11, color: "var(--gray2)" }}>{d.sets}×{d.reps}</div>}
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)" }}>{d.weight}kg</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── HistoryScreen ─────────────────────────────────────────────────────────────

export function HistoryScreen({ authUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("log"); // log | progress

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
        const raw = localStorage.getItem("ks_logs");
        const entries = raw ? JSON.parse(raw) : [];
        setLogs(entries.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {}
      setLoading(false);
    };
    load();
  }, [authUser]);

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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["log", "📋 SESSION LOG"], ["progress", "📈 PROGRESS"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, ...s.btnGhost, fontSize: 13, padding: "10px",
            borderColor: activeTab === tab ? "var(--red)" : "var(--border)",
            color: activeTab === tab ? "var(--white)" : "var(--gray)",
            background: activeTab === tab ? "rgba(196,30,30,0.1)" : "transparent",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          }}>{label}</button>
        ))}
      </div>

      {/* Progress Chart Tab */}
      {activeTab === "progress" && <ProgressChart logs={logs} />}

      {/* Log Tab */}
      {activeTab === "log" && logs.map((log, idx) => {
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
                    <div style={{ fontSize: 9, background: "rgba(201,168,76,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
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
                {rpe != null && <div style={{ ...s.badge(rpe >= 9 ? "var(--red)" : "var(--gray2)"), fontSize: 9, marginTop: 4, display: "inline-block" }}>RPE {rpe}</div>}
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />
                {log.exercises?.map((ex, ei) => {
                  const hasResult = ex.result || (ex.sets || []).filter(st => st.done && st.weight).length > 0 || ex.done;
                  if (!hasResult) return null;
                  return (
                    <div key={ei} style={{ marginBottom: 10 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: col, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                        <span>{ex.name}</span>
                        {ex.planned && <span style={{ fontSize: 11, color: "var(--gray2)", fontWeight: 400 }}>Plan: {ex.planned.sets}×{ex.planned.reps}@{ex.planned.weight}kg</span>}
                      </div>
                      {ex.result ? (
                        <div style={{ fontSize: 13, color: "var(--text)", background: "var(--bg3)", borderRadius: 5, padding: "6px 10px", lineHeight: 1.5 }}>{ex.result}</div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {ex.sets?.map((set, si) => !set.done ? null : (
                            <div key={si} style={{ background: "var(--bg3)", border: `1px solid ${set.rpe >= 9 ? "rgba(196,30,30,0.5)" : "var(--border)"}`, borderRadius: 5, padding: "4px 8px", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{set.weight}kg</span>
                              <span style={{ fontSize: 12, color: "var(--gray2)" }}>×</span>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{set.reps}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {log.comment && (
                  <div style={{ fontSize: 12, color: "var(--gray)", fontStyle: "italic", background: "var(--bg3)", borderRadius: 4, padding: "8px 10px", marginTop: 8, borderLeft: `2px solid ${col}` }}>
                    💬 {log.comment}
                  </div>
                )}
                {log.coach_comment && (
                  <div style={{ fontSize: 13, color: "var(--text)", background: "rgba(201,168,76,0.06)", borderRadius: 6, padding: "12px 14px", marginTop: 10, border: "1px solid rgba(201,168,76,0.25)" }}>
                    <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 6 }}>🎯 COACH FEEDBACK</div>
                    {log.coach_comment}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 10, textAlign: "right" }}>CLICK TO COLLAPSE ↑</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
