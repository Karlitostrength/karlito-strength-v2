import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";


export function Row({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--gray)" }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.05em" }}>{val}</span>
    </div>
  );
}


export function EMOMTimer({ minutes, targetReps, kgKB, onDone }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [currentMinute, setCurrentMinute] = useState(1);
  const [repsLog, setRepsLog] = useState([]);
  const [done, setDone] = useState(false);
  const [rpeVal, setRpeVal] = useState(7);
  const intRef = useRef(null);

  useEffect(() => {
    if (running) {
      intRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setCurrentMinute(m => {
              if (m >= minutes) {
                clearInterval(intRef.current);
                setRunning(false);
                setDone(true);
              }
              return m + 1;
            });
            setRepsLog(prev => [...prev, targetReps]);
            return 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intRef.current);
  }, [running]);

  const pct = ((60 - seconds) / 60) * 100;

  return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>SWING EMOM TIMER</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
        {minutes} min × {targetReps} reps @ {kgKB}kg
      </div>

      {!done ? (
        <>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto 16px" }}>
              <svg viewBox="0 0 180 180" style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="90" cy="90" r="80" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="90" cy="90" r="80" fill="none" stroke="var(--red)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 80}`}
                  strokeDashoffset={`${2 * Math.PI * 80 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={s.bigNum}>{seconds}</div>
                <div style={{ fontSize: 12, color: "var(--gray)", letterSpacing: "0.1em" }}>SEC</div>
              </div>
            </div>

            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, marginBottom: 4 }}>
              Round {Math.min(currentMinute, minutes)} / {minutes}
            </div>
            <div style={{ fontSize: 13, color: "var(--gray)" }}>
              Do {targetReps} reps NOW — rest the remainder
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button style={{ ...s.btn, flex: 1 }} onClick={() => setRunning(r => !r)}>
              {running ? "⏸ PAUSE" : currentMinute === 1 && seconds === 60 ? "▶ START" : "▶ RESUME"}
            </button>
            <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => {
              setRunning(false);
              clearInterval(intRef.current);
              setSeconds(60);
              setCurrentMinute(1);
              setRepsLog([]);
            }}>RESET</button>
          </div>

          {repsLog.length > 0 && (
            <div style={s.card}>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 8 }}>ROUNDS COMPLETED</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {repsLog.map((r, i) => (
                  <div key={i} style={{ ...s.badge("var(--red-dim)"), fontSize: 13 }}>R{i+1}: {r}✓</div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 4 }}>SESSION COMPLETE</div>
          <div style={{ fontSize: 14, color: "var(--gray)", marginBottom: 20 }}>{repsLog.length} rounds · {repsLog.reduce((a,b) => a+b, 0)} total reps</div>

          <div style={s.card}>
            <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 10 }}>How hard was that? RPE {rpeVal}</div>
            <input type="range" min={5} max={10} step={0.5} value={rpeVal} onChange={e => setRpeVal(parseFloat(e.target.value))} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gray2)", marginTop: 4 }}>
              <span>Easy</span><span>Max Effort</span>
            </div>
          </div>

          <button style={s.btn} onClick={() => onDone(rpeVal)}>LOG & CONTINUE</button>
        </div>
      )}
    </div>
  );
}


export function initSetLogs(exercises) {
  const logs = {};
  exercises.forEach((ex, ei) => {
    if (!ex.sets) return;
    logs[ei] = Array.from({ length: ex.sets }, () => ({
      weight: ex.weight ? String(ex.weight) : "",
      reps: String(ex.reps || ""),
      rpe: 8,
      done: false,
    }));
  });
  return logs;
}

export function SetRow({ setIdx, log, plannedWeight, plannedReps, onUpdate, onToggleDone, suggestedWeight }) {
  const inputStyle = {
    background: "var(--bg3)", border: `1px solid ${log.done ? "var(--gold-dim)" : "var(--border)"}`,
    borderRadius: 4, padding: "6px 4px", color: "var(--white)",
    fontSize: 15, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
    textAlign: "center", outline: "none", WebkitAppearance: "none",
  };
  const rpeColors = { 7: "#4caf50", 8: "var(--gold)", 9: "#f06400", 10: "var(--red)" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5, padding: "10px 0",
      borderBottom: "1px solid var(--border)",
      background: log.done ? "rgba(201,168,76,0.04)" : "transparent",
    }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: log.done ? "var(--gold)" : "var(--gray2)", width: 24, flexShrink: 0, fontWeight: 700 }}>
        S{setIdx + 1}
      </div>
      <div style={{ position: "relative" }}>
        <input type="number" inputMode="decimal" value={log.weight} onChange={e => onUpdate("weight", e.target.value)}
          placeholder={suggestedWeight || plannedWeight} style={{ ...inputStyle, width: 54 }} />
        {suggestedWeight && !log.weight && (
          <div style={{ position: "absolute", top: -8, right: -4, fontSize: 8, background: "var(--gold)", color: "#0a0f15", borderRadius: 3, padding: "1px 4px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>
            ↑{suggestedWeight}
          </div>
        )}
      </div>
      <span style={{ fontSize: 10, color: "var(--gray2)", flexShrink: 0 }}>kg</span>
      <input type="number" inputMode="numeric" value={log.reps} onChange={e => onUpdate("reps", e.target.value)}
        placeholder={plannedReps} style={{ ...inputStyle, width: 42 }} />
      <span style={{ fontSize: 10, color: "var(--gray2)", flexShrink: 0 }}>rep</span>
      <div style={{ display: "flex", gap: 3, flex: 1, justifyContent: "flex-end" }}>
        {[7, 8, 9, 10].map(r => (
          <div key={r} onClick={() => onUpdate("rpe", r)} style={{
            width: 24, height: 24, borderRadius: 4, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
            background: log.rpe === r ? rpeColors[r] : "var(--bg3)",
            border: `1px solid ${log.rpe === r ? rpeColors[r] : "var(--border)"}`,
            color: log.rpe === r ? "var(--white)" : "var(--gray2)",
            cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, flexShrink: 0,
          }}>{r}</div>
        ))}
      </div>
      <div onClick={onToggleDone} style={{
        width: 34, height: 34, borderRadius: 6, flexShrink: 0,
        background: log.done ? "var(--red)" : "var(--bg3)",
        border: `1px solid ${log.done ? "var(--red)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16, transition: "all 0.2s",
      }}>
        {log.done ? "✓" : "○"}
      </div>
    </div>
  );
}




export function ReadinessWidget({ authUser }) {
  const key = READINESS_KEY + todayKey();
  const [checked, setChecked] = useState(false);
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [saved, setSaved] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) { setSaved(JSON.parse(stored)); setChecked(true); }
    } catch(e) {}
  }, []);

  const score = Math.round(((sleep + stress + fatigue) / 3) * 2);
  // sleep & stress: 1=bad 5=great → fatigue inverse: 1=very fatigued 5=fresh
  const readinessScore = Math.round(((sleep + (6 - stress) + (6 - fatigue)) / 15) * 10);

  const handleSave = () => {
    const data = { sleep, stress, fatigue, score: readinessScore, date: todayKey() };
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    setSaved(data);
    setChecked(true);
    setOpen(false);
    // Optionally sync to Supabase
    if (authUser) {
      supabase.from("workouts").upsert({
        user_id: authUser.id,
        day: "READINESS",
        week: 0,
        exercises: [],
        comment: `Readiness: ${readinessScore}/10 | Sleep:${sleep} Stress:${stress} Fatigue:${fatigue}`,
        created_at: new Date().toISOString().slice(0,10) + "T06:00:00Z",
      }, { onConflict: "user_id,day,week" }).catch(() => {});
    }
  };

  const displayScore = saved ? saved.score : null;
  const color = displayScore !== null ? getReadinessColor(displayScore) : "var(--gray2)";

  if (!open && !checked) {
    return (
      <div onClick={() => setOpen(true)} style={{
        ...s.card,
        cursor: "pointer",
        border: `1px solid var(--border)`,
        marginBottom: 12,
        display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      }}>
        <div style={{ fontSize: 28, fontFamily: "'Cinzel', serif", color: "var(--gray2)" }}>I</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "0.2em", color: "var(--gray)", marginBottom: 2 }}>DAILY READINESS</div>
          <div style={{ fontSize: 12, color: "var(--gray2)" }}>How do you feel today? Tap to check in</div>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--gold)", letterSpacing: "0.1em" }}>CHECK IN →</div>
      </div>
    );
  }

  if (checked && saved && !open) {
    return (
      <div onClick={() => setOpen(true)} style={{
        ...s.card,
        cursor: "pointer",
        border: `1px solid ${color}33`,
        background: `linear-gradient(135deg, var(--bg2), ${color}0a)`,
        marginBottom: 12,
        display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      }}>
        <div style={{ fontSize: 32, color, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>{getReadinessRune(saved.score)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "0.25em", color: "var(--gray2)", marginBottom: 3 }}>READINESS TODAY</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>
            {saved.score}/10 <span style={{ fontSize: 13, letterSpacing: "0.1em" }}>{getReadinessLabel(saved.score)}</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--gray2)" }}>TAP TO EDIT</div>
      </div>
    );
  }

  const sliderStyle = (val, max = 5) => ({
    position: "relative",
    margin: "8px 0 16px",
  });

  const labels5 = ["1", "2", "3", "4", "5"];

  return (
    <div style={{ ...s.card, border: `1px solid var(--gold-dim)`, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "var(--gold)" }}>DAILY READINESS</div>
          <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>Rate your state before training</div>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: getReadinessColor(readinessScore), lineHeight: 1 }}>
          {readinessScore}<span style={{ fontSize: 14 }}>/10</span>
        </div>
      </div>

      {[
        { label: "SLEEP QUALITY", val: sleep, set: setSleep, hi: "Deep rest", lo: "Restless" },
        { label: "STRESS LEVEL", val: stress, set: setStress, hi: "Very stressed", lo: "Calm" },
        { label: "BODY FATIGUE", val: fatigue, set: setFatigue, hi: "Very fatigued", lo: "Fresh" },
      ].map(({ label, val, set, hi, lo }) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "var(--gray)" }}>{label}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1,2,3,4,5].map(v => (
                <div key={v} onClick={() => set(v)} style={{
                  width: 28, height: 28, borderRadius: 4, cursor: "pointer",
                  background: v === val ? "var(--gold)" : "var(--bg4)",
                  border: `1px solid ${v === val ? "var(--gold)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700,
                  color: v === val ? "#0a0f15" : "var(--gray2)", transition: "all 0.15s",
                }}>{v}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--gray2)" }}>{lo}</span>
            <span style={{ fontSize: 10, color: "var(--gray2)" }}>{hi}</span>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={handleSave} style={{ ...s.btn, flex: 2, padding: "12px" }}>
          SAVE — {getReadinessLabel(readinessScore)}
        </button>
        {checked && <button onClick={() => setOpen(false)} style={{ ...s.btnGhost, flex: 1, padding: "12px" }}>
          CANCEL
        </button>}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// ─── SCHEDULE ────────────────────────────────────────────────────────────────
