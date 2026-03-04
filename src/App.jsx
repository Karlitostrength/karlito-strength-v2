import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ebpdfalmzkvxfuzaamqh.supabase.co",
  "sb_publishable_-9TPMx_XdGI0Ur5m-Utqeg_drghUgIy"
);

// ─── FONT INJECTION ──────────────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080808;
    --bg2: #111111;
    --bg3: #1a1a1a;
    --bg4: #222222;
    --border: #2a2a2a;
    --red: #c41e1e;
    --red-dim: #7a1212;
    --red-glow: rgba(196,30,30,0.15);
    --white: #f0ece4;
    --gray: #888880;
    --gray2: #555550;
    --accent: #e8d5a0;
  }

  body { background: var(--bg); color: var(--white); font-family: 'Barlow', sans-serif; }

  .condensed { font-family: 'Barlow Condensed', sans-serif; }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background: var(--border);
    outline: none;
    border-radius: 2px;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes timerPulse { 0% { box-shadow: 0 0 0 0 rgba(196,30,30,0.4); } 70% { box-shadow: 0 0 0 16px rgba(196,30,30,0); } 100% { box-shadow: 0 0 0 0 rgba(196,30,30,0); } }

  .fade-in { animation: fadeIn 0.35s ease forwards; }
  .pulse { animation: pulse 1.5s infinite; }
  .timer-pulse { animation: timerPulse 1s infinite; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }
`;
document.head.appendChild(style);

// ─── ENGINE ───────────────────────────────────────────────────────────────────

const PHASES = {
  1: { name: "ACCUMULATION", color: "#4a9eff", weeks: [1,4] },
  2: { name: "TRANSMUTATION", color: "#f0a020", weeks: [5,8] },
  3: { name: "INTENSIFICATION", color: "#c41e1e", weeks: [9,11] },
  4: { name: "PEAK", color: "#e8d5a0", weeks: [12,12] },
};

function getPhase(week) {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  if (week <= 11) return 3;
  return 4;
}

function getPct(week, level) {
  const base = { beginner: [0.65, 0.70, 0.78, 0.85], intermediate: [0.70, 0.77, 0.83, 0.90], advanced: [0.72, 0.80, 0.87, 0.93] };
  const arr = base[level];
  const phase = getPhase(week);
  return arr[phase - 1];
}

function getSetsReps(week) {
  if (week <= 2) return { sets: 4, reps: 6 };
  if (week <= 4) return { sets: 5, reps: 5 };
  if (week <= 6) return { sets: 4, reps: 4 };
  if (week <= 8) return { sets: 5, reps: 3 };
  if (week <= 10) return { sets: 3, reps: 3 };
  if (week === 11) return { sets: 3, reps: 2 };
  return { sets: 1, reps: 1 };
}

function getSquatVariation(week, injuries) {
  if (injuries.knee) {
    const vars = ["Box Squat","Box Squat","Tempo Box Squat","Banded Box Squat","Spanish Squat","Spanish Squat","Pin Box Squat","Pin Box Squat","Box Squat","Box Squat","Box Squat","Box Squat"];
    return vars[week - 1];
  }
  const vars = ["High Bar Squat","Tempo Low Bar Squat","Paused Low Bar Squat","Front Squat","Low Bar Squat","Pin Low Bar Squat","Paused Squat","Low Bar Squat","Low Bar Squat","Low Bar Squat","Low Bar Squat","Low Bar Squat"];
  return vars[week - 1];
}

function getDeadliftVariation(week, injuries) {
  if (injuries.lowerBack) {
    const vars = ["Block Pull","Block Pull","Block Pull","RDL","Block Pull","Block Pull","Block Pull","Block Pull","Block Pull","Block Pull","Block Pull","Block Pull"];
    return vars[week - 1];
  }
  const vars = ["Conv. Deadlift","Snatch Grip DL","Deficit DL","Paused Deadlift","Conv. Deadlift","Block Pull","Block Pull","Conv. Deadlift","Conv. Deadlift","Conv. Deadlift","Conv. Deadlift","Conv. Deadlift"];
  return vars[week - 1];
}

function getBenchVariation(week, injuries) {
  if (injuries.shoulder) {
    const vars = ["Close Grip Bench","DB Neutral Press","Close Grip Bench","DB Incline Press","Close Grip Bench","DB Neutral Press","Paused Close Grip","Close Grip Bench","Close Grip Bench","Close Grip Bench","Close Grip Bench","Close Grip Bench"];
    return vars[week - 1];
  }
  const vars = ["Bench Press","Tempo Bench","Paused Bench","Bench Press","Bench Press","Paused Bench","Close Grip Bench","Bench Press","Bench Press","Bench Press","Bench Press","Bench Press"];
  return vars[week - 1];
}

function getSwingProtocol(week) {
  if (week <= 4) return { minutes: 8 + (week - 1), reps: 10 + (week - 1), label: `${8 + (week-1)} min × ${10 + (week-1)} reps/min` };
  if (week <= 8) return { minutes: 10, reps: 15, label: `10 min × 15 reps/min` };
  return { minutes: 10, reps: 20, label: `10 min × 20 reps/min (Power EMOM)` };
}

function getSnatchLightProtocol(week) {
  // Start 15 reps/arm, +1 rep/week until 25, then cut rest 5-10s/week
  const startReps = 15;
  const targetReps = 25;
  const weeksToTarget = targetReps - startReps; // 10 weeks
  const currentReps = Math.min(startReps + (week - 1), targetReps);
  const progressDone = currentReps >= targetReps;
  // Once at 25 reps, cut rest from 180s by 7s/week
  const weeksAfterTarget = Math.max(0, week - 1 - weeksToTarget);
  const restSec = progressDone ? Math.max(120, 180 - weeksAfterTarget * 7) : 180;
  const restLabel = `${Math.floor(restSec / 60)}:${String(restSec % 60).padStart(2, "0")}`;
  return {
    sets: 4,
    reps: currentReps,
    rest: restLabel,
    progressDone,
    label: `4 × ${currentReps} pow/rękę`,
    note: progressDone
      ? `✓ 25 pow osiągnięte — skracaj przerwę o 5–10 sek/tydzień (przerwa: ${restLabel})`
      : `Przerwa: ${restLabel} · Cel: 25 pow/rękę · +1 pow/tydzień`,
  };
}

function getSnatchMaxProtocol(week, level) {
  // 4×6/6, progress to 4×12/12, then heavier KB
  // Beginners: one arm swing; intermediate/advanced: snatch
  const startReps = 6;
  const targetReps = 12;
  // +1 rep every 2 weeks
  const currentReps = Math.min(startReps + Math.floor((week - 1) / 2), targetReps);
  const reachedTarget = currentReps >= targetReps;
  const isSwing = level === "beginner";
  const exercise = isSwing ? "One Arm Swing" : "KB Snatch";
  return {
    sets: 4,
    reps: currentReps,
    exercise,
    isSwing,
    label: `4 × ${currentReps}/${currentReps} · ${exercise}`,
    note: reachedTarget
      ? `🔥 12 pow osiągnięte — skocz na cięższą kulę!`
      : `Ciężar +2 numery · Przerwa 2 min · Cel: 12 pow → cięższa kula`,
    reachedTarget,
  };
}

function adjustWeight(weight, rpe) {
  if (rpe > 9) return Math.round(weight * 0.95 / 2.5) * 2.5;
  if (rpe < 7) return Math.round(weight * 1.025 / 2.5) * 2.5;
  return weight;
}

function calcWeight(oneRM, pct) {
  return Math.round(oneRM * pct / 2.5) * 2.5;
}

const ACCESSORIES = {
  A: {
    beginner: ["Bulgarian Split Squat 3×8", "Copenhagen Plank 3×20s", "Glute Bridge 3×12"],
    intermediate: ["FFE Split Squat 3×6", "Nordic Curl 3×5", "Glute Bridge 3×10"],
    advanced: ["Zercher Lunge 3×6", "Nordic Curl 4×5", "Step Up 3×8"],
  },
  B: {
    beginner: ["RDL 3×8", "Pull Ups 4×AMRAP", "DB Row 3×10"],
    intermediate: ["Stiff Leg DL 3×6", "Weighted Pull Ups 4×5", "KB Row 3×8"],
    advanced: ["Good Morning 3×5", "Weighted Pull Ups 5×4", "Pendlay Row 3×6"],
  },
  C: {
    beginner: ["DB Shoulder Press 3×10", "Dips 3×AMRAP", "Tricep Pushdowns 3×12"],
    intermediate: ["Military Press 3×5", "Weighted Dips 3×6", "JM Press 3×8"],
    advanced: ["2KB Press 4×5", "Weighted Dips 4×5", "Skull Crushers 3×6"],
  },
};

function generateWorkout(day, week, level, oneRM, injuries) {
  const pct = getPct(week, level);
  const { sets, reps } = getSetsReps(week);
  const swing = getSwingProtocol(week);
  const snatchLight = getSnatchLightProtocol(week);
  const snatchMax = getSnatchMaxProtocol(week, level);
  const acc = ACCESSORIES[day]?.[level] || [];

  const backoffPct = pct - 0.1;

  if (day === "A") {
    const sqVar = getSquatVariation(week, injuries);
    const bpVar = getBenchVariation(week, injuries);
    return {
      title: "DAY A — SQUAT",
      sections: [
        { title: "STRENGTH", exercises: [
          { name: sqVar, sets, reps, weight: calcWeight(oneRM.squat, pct), pct, isMain: true },
          { name: "Back Off Set", sets: 2, reps: reps + 2, weight: calcWeight(oneRM.squat, backoffPct), pct: backoffPct },
          { name: bpVar, sets: sets - 1, reps: reps + 1, weight: calcWeight(oneRM.bench, pct - 0.05), pct: pct - 0.05 },
        ]},
        { title: "ACCESSORIES", exercises: acc.map(e => ({ name: e })) },
        { title: "CONDITIONING — KB SNATCH LEKKI", snatchLight: true, snatchLightData: snatchLight },
      ]
    };
  }

  if (day === "B") {
    const dlVar = getDeadliftVariation(week, injuries);
    return {
      title: "DAY B — DEADLIFT",
      sections: [
        { title: "STRENGTH", exercises: [
          { name: dlVar, sets, reps, weight: calcWeight(oneRM.deadlift, pct), pct, isMain: true },
          { name: "Back Off Set", sets: 2, reps: reps + 1, weight: calcWeight(oneRM.deadlift, backoffPct), pct: backoffPct },
          { name: "Military Press / OHP", sets: 3, reps: 6, weight: calcWeight(oneRM.bench * 0.65, pct - 0.05), pct: pct - 0.05 },
        ]},
        { title: "ACCESSORIES", exercises: acc.map(e => ({ name: e })) },
        { title: "CONDITIONING — KB SNATCH MAX EFFORT", snatchMax: true, snatchMaxData: snatchMax },
      ]
    };
  }

  // Day C
  const bpVar = getBenchVariation(week, injuries);
  const sqVar = getSquatVariation(week, injuries);
  return {
    title: "DAY C — BENCH",
    sections: [
      { title: "STRENGTH", exercises: [
        { name: bpVar, sets, reps, weight: calcWeight(oneRM.bench, pct), pct, isMain: true },
        { name: "Back Off Set", sets: 2, reps: reps + 2, weight: calcWeight(oneRM.bench, backoffPct), pct: backoffPct },
        { name: sqVar + " (light)", sets: 3, reps: 5, weight: calcWeight(oneRM.squat, pct - 0.15), pct: pct - 0.15 },
      ]},
      { title: "ACCESSORIES", exercises: acc.map(e => ({ name: e })) },
      { title: "CONDITIONING — KB COMPLEX", complex: true,
        complexData: { label: "5 Swing + 5 Push Ups + 5 Goblet Squat — AMRAP 8 min" } },
    ]
  };
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const s = {
  app: { minHeight: "100vh", background: "var(--bg)", color: "var(--white)", maxWidth: 480, margin: "0 auto", padding: "0 0 80px 0", position: "relative" },
  header: { padding: "24px 20px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg)" },
  logo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: "0.08em", color: "var(--white)", lineHeight: 1 },
  logoRed: { color: "var(--red)" },
  tagline: { fontSize: 11, letterSpacing: "0.2em", color: "var(--gray2)", marginTop: 2, textTransform: "uppercase" },
  screen: { padding: "20px 20px", animation: "fadeIn 0.3s ease" },
  sectionLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.25em", color: "var(--gray2)", textTransform: "uppercase", marginBottom: 12 },
 card: { background: "rgba(17,17,17,0.92)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 12, backdropFilter: "blur(4px)" },
  bigNum: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, lineHeight: 1, color: "var(--white)" },
  redLine: { width: 32, height: 3, background: "var(--red)", marginBottom: 6 },
  btn: { background: "var(--red)", color: "var(--white)", border: "none", borderRadius: 6, padding: "14px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnGhost: { background: "transparent", color: "var(--gray)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 20px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", width: "100%", transition: "border-color 0.2s" },
  input: { background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", color: "var(--white)", fontSize: 15, width: "100%", fontFamily: "'Barlow', sans-serif", outline: "none" },
  label: { fontSize: 12, color: "var(--gray)", marginBottom: 6, letterSpacing: "0.08em", display: "block" },
  pill: (active, color = "var(--red)") => ({ display: "inline-block", padding: "6px 14px", borderRadius: 4, border: `1px solid ${active ? color : "var(--border)"}`, background: active ? `rgba(196,30,30,0.1)` : "transparent", color: active ? color : "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s" }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "var(--bg2)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 0 12px" },
  navItem: (active) => ({ flex: 1, textAlign: "center", padding: "8px 4px", cursor: "pointer", opacity: active ? 1 : 0.45, transition: "opacity 0.2s" }),
  navLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4, color: "var(--white)" },
  exerciseRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid var(--border)" },
  badge: (color) => ({ background: color || "var(--red)", padding: "2px 8px", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--white)" }),
  phaseBar: (color) => ({ height: 3, background: color, borderRadius: 2, marginBottom: 20 }),
  progressBar: (pct, color) => ({ height: "100%", width: `${pct}%`, background: color || "var(--red)", borderRadius: 2, transition: "width 0.5s ease" }),
};

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true);
    setError("");
    try {
      let result;
      if (mode === "login") {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }
      if (result.error) throw result.error;
      onAuth(result.data.user);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
      <div style={s.header}>
        <div style={s.logo}>KARLITO <span style={s.logoRed}>STRENGTH</span></div>
        <div style={s.tagline}>Built Through Discipline</div>
      </div>
      <div style={s.screen}>
        <div style={{ marginBottom: 24 }}>
          <div style={s.redLine} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </div>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>
            {mode === "login" ? "Your data syncs to the cloud." : "Create your athlete account."}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>EMAIL</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="athlete@email.com" style={s.input} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={s.input} />
        </div>

        {error && (
          <div style={{ background: "rgba(196,30,30,0.1)", border: "1px solid var(--red-dim)", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={handle} disabled={loading}>
          {loading ? "..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>

        <div onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--gray)", cursor: "pointer", textDecoration: "underline" }}>
          {mode === "login" ? "No account? Register" : "Already have account? Sign in"}
        </div>
      </div>
    </div>
  );
}
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    level: "intermediate",
    oneRM: { squat: "", bench: "", deadlift: "" },
    pullups: "",
    kgKB: "24",
    recovery: 3,
    injuries: { knee: false, shoulder: false, lowerBack: false, elbow: false },
  });

  const set = (key, val) => setData(p => ({ ...p, [key]: val }));
  const setRM = (k, v) => setData(p => ({ ...p, oneRM: { ...p.oneRM, [k]: v } }));
  const setInj = (k) => setData(p => ({ ...p, injuries: { ...p.injuries, [k]: !p.injuries[k] } }));

  const steps = [
    // Step 0 — Welcome
    <div key="welcome" style={s.screen}>
      <div style={{ marginBottom: 32 }}>
        <div style={s.redLine} />
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
          BUILD YOUR<br />STRENGTH.
        </div>
        <div style={{ color: "var(--gray)", fontSize: 15, lineHeight: 1.6 }}>
          12-week periodised program. SBD. Kettlebell. Calisthenics. Built on science, tested on the platform.
        </div>
      </div>
      <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.05)" }}>
        <div style={{ fontSize: 12, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Method</div>
        <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.7 }}>
          Block periodisation → Accumulation → Transmutation → Intensification → Peak. RPE autoregulation. Progression built in.
        </div>
      </div>
      <button style={s.btn} onClick={() => setStep(1)}>START SETUP</button>
    </div>,

    // Step 1 — Level
    <div key="level" style={s.screen}>
      <div style={s.sectionLabel}>Step 1 of 4 — Training Level</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, marginBottom: 20 }}>YOUR LEVEL</div>
      {[
        { id: "beginner", label: "BEGINNER", sub: "0–2 years training", det: "Higher volume, more technique work, fundamental variations" },
        { id: "intermediate", label: "INTERMEDIATE", sub: "2–5 years", det: "Periodised volume, variation rotation, RPE-based loading" },
        { id: "advanced", label: "ADVANCED", sub: "5+ years", det: "High intensity, complex variations, full autoregulation" },
      ].map(lvl => (
        <div key={lvl.id} onClick={() => set("level", lvl.id)} style={{ ...s.card, border: `1px solid ${data.level === lvl.id ? "var(--red)" : "var(--border)"}`, background: data.level === lvl.id ? "rgba(196,30,30,0.07)" : "var(--bg2)", cursor: "pointer", transition: "all 0.2s", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em" }}>{lvl.label}</div>
            <div style={{ fontSize: 12, color: "var(--gray)" }}>{lvl.sub}</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--gray2)" }}>{lvl.det}</div>
        </div>
      ))}
      <button style={{ ...s.btn, marginTop: 12 }} onClick={() => setStep(2)}>NEXT →</button>
    </div>,

    // Step 2 — 1RM
    <div key="1rm" style={s.screen}>
      <div style={s.sectionLabel}>Step 2 of 4 — Strength Data</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, marginBottom: 6 }}>YOUR 1RM</div>
      <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 20 }}>Enter estimated 1RM in kg. Use a recent heavy 3–5 rep set if unsure.</div>

      {[["squat", "SQUAT"], ["bench", "BENCH PRESS"], ["deadlift", "DEADLIFT"]].map(([k, label]) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <label style={s.label}>{label} (kg)</label>
          <input
            type="number"
            value={data.oneRM[k]}
            onChange={e => setRM(k, e.target.value)}
            placeholder={k === "squat" ? "e.g. 120" : k === "bench" ? "e.g. 80" : "e.g. 150"}
            style={s.input}
          />
        </div>
      ))}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>MAX PULL UPS</label>
        <input type="number" value={data.pullups} onChange={e => set("pullups", e.target.value)} placeholder="e.g. 10" style={s.input} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>KETTLEBELL (swing/snatch) — kg</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["12", "16", "20", "24", "28", "32"].map(w => (
            <div key={w} onClick={() => set("kgKB", w)} style={{ ...s.pill(data.kgKB === w), padding: "8px 12px", flex: 1, textAlign: "center", fontSize: 14 }}>{w}</div>
          ))}
        </div>
      </div>
      <button style={s.btn} onClick={() => setStep(3)}>NEXT →</button>
    </div>,

    // Step 3 — Recovery + Injuries
    <div key="recovery" style={s.screen}>
      <div style={s.sectionLabel}>Step 3 of 4 — Recovery & Health</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, marginBottom: 20 }}>YOUR STATUS</div>

      <div style={s.card}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 12 }}>RECOVERY SCORE</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} onClick={() => set("recovery", n)} style={{ textAlign: "center", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${data.recovery >= n ? "var(--red)" : "var(--border)"}`, background: data.recovery >= n ? "rgba(196,30,30,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, transition: "all 0.2s" }}>{n}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.1em" }}>
          1 = poor sleep/high stress · 5 = well rested
        </div>
        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 8 }}>
          Score {data.recovery <= 2 ? "LOW — volume reduced 20%" : data.recovery >= 4 ? "HIGH — volume increased 10%" : "OPTIMAL — standard volume"}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 12 }}>INJURY FLAGS</div>
        <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 12 }}>Select any current issues — program adapts automatically.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["knee", "🦵 Knee"], ["shoulder", "🦾 Shoulder"], ["lowerBack", "🦴 Lower Back"], ["elbow", "💪 Elbow"]].map(([k, label]) => (
            <div key={k} onClick={() => setInj(k)} style={{ ...s.pill(data.injuries[k]), textAlign: "center", padding: "10px 8px" }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <button style={s.btn} onClick={() => setStep(4)}>NEXT →</button>
      <button style={{ ...s.btnGhost, marginTop: 8 }} onClick={() => setStep(3)}>← BACK</button>
    </div>,

    // Step 4 — Confirm
    <div key="confirm" style={s.screen}>
      <div style={s.sectionLabel}>Step 4 of 4 — Confirm</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, marginBottom: 20 }}>YOUR PROGRAM</div>

      <div style={s.card}>
        <Row label="Level" val={data.level.toUpperCase()} />
        <Row label="Squat 1RM" val={data.oneRM.squat ? `${data.oneRM.squat} kg` : "—"} />
        <Row label="Bench 1RM" val={data.oneRM.bench ? `${data.oneRM.bench} kg` : "—"} />
        <Row label="Deadlift 1RM" val={data.oneRM.deadlift ? `${data.oneRM.deadlift} kg` : "—"} />
        <Row label="Kettlebell" val={`${data.kgKB} kg`} />
        <Row label="Recovery" val={`${data.recovery}/5`} />
        <Row label="Injuries" val={Object.entries(data.injuries).filter(([,v]) => v).map(([k]) => k).join(", ") || "None"} />
      </div>

      <div style={{ ...s.card, borderColor: "var(--red-dim)" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 6 }}>PROGRAM OVERVIEW</div>
        <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.8 }}>
          3 days / week · 12 weeks total<br />
          Wks 1–4: Accumulation<br />
          Wks 5–8: Transmutation<br />
          Wks 9–11: Intensification<br />
          Wk 12: Peak / Test
        </div>
      </div>

      <button style={s.btn} onClick={() => {
        const safeRM = {
          squat: parseFloat(data.oneRM.squat) || 100,
          bench: parseFloat(data.oneRM.bench) || 70,
          deadlift: parseFloat(data.oneRM.deadlift) || 120,
        };
        onComplete({ ...data, oneRM: safeRM });
      }}>START PROGRAM 🔥</button>
    </div>,
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ ...s.header }}>
        <div style={s.logo}>KARLITO <span style={s.logoRed}>STRENGTH</span></div>
        <div style={s.tagline}>Built Through Discipline</div>
      </div>
      {steps[step]}
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--gray)" }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.05em" }}>{val}</span>
    </div>
  );
}

// ─── EMOM TIMER ───────────────────────────────────────────────────────────────

function EMOMTimer({ minutes, targetReps, kgKB, onDone }) {
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

// ─── PER-SET LOGGING ──────────────────────────────────────────────────────────

function initSetLogs(exercises) {
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

function SetRow({ setIdx, log, plannedWeight, plannedReps, onUpdate, onToggleDone }) {
  const inputStyle = {
    background: "var(--bg3)", border: `1px solid ${log.done ? "var(--red-dim)" : "var(--border)"}`,
    borderRadius: 4, padding: "6px 4px", color: "var(--white)",
    fontSize: 15, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
    textAlign: "center", outline: "none", WebkitAppearance: "none",
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5, padding: "10px 0",
      borderBottom: "1px solid var(--border)",
      background: log.done ? "rgba(196,30,30,0.04)" : "transparent",
    }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: log.done ? "var(--red)" : "var(--gray2)", width: 24, flexShrink: 0, fontWeight: 700 }}>
        S{setIdx + 1}
      </div>
      <input type="number" inputMode="decimal" value={log.weight} onChange={e => onUpdate("weight", e.target.value)}
        placeholder={plannedWeight} style={{ ...inputStyle, width: 54 }} />
      <span style={{ fontSize: 10, color: "var(--gray2)", flexShrink: 0 }}>kg</span>
      <input type="number" inputMode="numeric" value={log.reps} onChange={e => onUpdate("reps", e.target.value)}
        placeholder={plannedReps} style={{ ...inputStyle, width: 42 }} />
      <span style={{ fontSize: 10, color: "var(--gray2)", flexShrink: 0 }}>rep</span>
      <div style={{ display: "flex", gap: 3, flex: 1, justifyContent: "flex-end" }}>
        {[7, 8, 9, 10].map(r => (
          <div key={r} onClick={() => onUpdate("rpe", r)} style={{
            width: 24, height: 24, borderRadius: 4, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
            background: log.rpe === r ? "var(--red)" : "var(--bg3)",
            border: `1px solid ${log.rpe === r ? "var(--red)" : "var(--border)"}`,
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

// ─── WORKOUT SCREEN ───────────────────────────────────────────────────────────

function WorkoutScreen({ user, week, dayKey, authUser, onComplete }) {
  const [coachProgram, setCoachProgram] = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(true);

  useEffect(() => {
    const loadCoachProgram = async () => {
      if (!authUser) { setLoadingProgram(false); return; }
      try {
        const { data: days } = await supabase
          .from("program_days")
          .select("*")
          .eq("athlete_id", authUser.id)
          .eq("week", week)
          .eq("day", dayKey)
          .single();

        if (days) {
          const { data: exs } = await supabase
            .from("custom_exercises")
            .select("*")
            .eq("athlete_id", authUser.id)
            .eq("week", week)
            .eq("day", dayKey);
          setCoachProgram({ ...days, exercises: exs || [] });
        }
      } catch(e) {}
      setLoadingProgram(false);
    };
    loadCoachProgram();
  }, [authUser, week, dayKey]);

  const defaultWorkout = generateWorkout(dayKey, week, user.level, user.oneRM, user.injuries);
 
  
 const workout = coachProgram ? {
    title: `DAY ${dayKey} — ${coachProgram.title?.toUpperCase() || "COACH PROGRAM"}`,
    sections: [
      {
        title: "STRENGTH",
        exercises: coachProgram.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          isMain: true,
          pct: null,
        }))
      },
      ...(coachProgram.notes ? [{ title: "COACH NOTES", notes: coachProgram.notes }] : []),
    ]
  } : (authUser ? null : defaultWorkout);
  const strengthExercises = workout?.sections?.find(sec => sec.title === "STRENGTH")?.exercises || [];

  const [setLogs, setSetLogs] = useState(() => initSetLogs(strengthExercises));
  const [accDone, setAccDone] = useState({});
  const [condDone, setCondDone] = useState({});
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  if (!workout) return (
    <div style={s.screen}>
      <div style={{ ...s.card, textAlign: "center", padding: 32, borderColor: "var(--red-dim)" }}>
        <div style={{ fontSize: 24 }}>⏳</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginTop: 8 }}>PROGRAM NOT READY</div>
        <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6 }}>Your coach hasn't assigned this week yet. Check back soon!</div>
      </div>
    </div>
  );

  const updateSetLog = (exIdx, setIdx, field, value) => {
    setSetLogs(prev => ({
      ...prev,
      [exIdx]: prev[exIdx].map((s, i) => i === setIdx ? { ...s, [field]: value } : s),
    }));
  };

  const toggleSetDone = (exIdx, setIdx) => {
    setSetLogs(prev => ({
      ...prev,
      [exIdx]: prev[exIdx].map((s, i) => i === setIdx ? { ...s, done: !s.done } : s),
    }));
  };

  const totalSets = Object.values(setLogs).reduce((sum, sets) => sum + sets.length, 0);
  const doneSets = Object.values(setLogs).reduce((sum, sets) => sum + sets.filter(s => s.done).length, 0);

const saveWorkout = async () => {
    const now = new Date();
    const key = `log:${now.toISOString().slice(0,10)}:${dayKey}:${now.getTime()}`;
    const logData = {
      date: now.toISOString(),
      week, day: dayKey, workout: workout.title,
      exercises: strengthExercises.map((ex, ei) => ({
        name: ex.name,
        planned: { sets: ex.sets, reps: ex.reps, weight: ex.weight },
        sets: setLogs[ei] || [],
      })),
      comment,
    };
     try {
      const existing = JSON.parse(localStorage.getItem("ks_logs") || "[]");
      existing.unshift({ key, ...logData });
      localStorage.setItem("ks_logs", JSON.stringify(existing));
    } catch(e) {}

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from("workouts").insert({
          user_id: authUser.id,
          week: logData.week,
          day: logData.day,
          workout_title: logData.workout,
          exercises: logData.exercises,
          comment: logData.comment,
        });
      }
    } catch(e) { console.log("Supabase sync error:", e); }

    setSaved(true);
  };

  const phaseData = PHASES[getPhase(week)];

  if (showTimer) {
    const swing = getSwingProtocol(week);
    return <EMOMTimer minutes={swing.minutes} targetReps={swing.reps} kgKB={user.kgKB}
      onDone={() => { setShowTimer(false); setCondDone(p => ({ ...p, swing: true })); }} />;
  }

  return (
    <div style={s.screen}>
      <div style={{ ...s.phaseBar(phaseData.color) }} />

      {/* Header + progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={s.sectionLabel}>Tydzień {week} · {phaseData.name}</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900 }}>{workout.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: doneSets === totalSets && totalSets > 0 ? "var(--red)" : "var(--white)" }}>
            {doneSets}<span style={{ fontSize: 13, color: "var(--gray2)" }}>/{totalSets}</span>
          </div>
          <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em" }}>SERIE</div>
        </div>
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%`, background: "var(--red)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      {workout.sections.map((sec, si) => (
        <div key={si} style={{ marginBottom: 20 }}>
          <div style={{ ...s.sectionLabel, marginBottom: 8 }}>{sec.title}</div>

          {/* STRENGTH — per-set logging */}
          {sec.exercises && sec.title === "STRENGTH" && sec.exercises.map((ex, ei) => {
            const logs = setLogs[ei];
            const exDone = logs && logs.every(s => s.done);
            return (
              <div key={ei} style={{ ...s.card, borderColor: exDone ? "rgba(196,30,30,0.6)" : "var(--border)", marginBottom: 10, transition: "border-color 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.04em" }}>
                      {ex.isMain && <span style={{ color: "var(--red)", marginRight: 6 }}>●</span>}{ex.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>
                      Plan: {ex.sets}×{ex.reps}{ex.pct ? ` @ ${Math.round(ex.pct * 100)}%` : ""}{ex.weight ? ` · ${ex.weight}kg` : ""}
                    </div>
                  </div>
                  {exDone && <div style={{ ...s.badge("var(--red)"), fontSize: 9 }}>DONE ✓</div>}
                </div>
                {logs ? (
                  <>
                    <div style={{ display: "flex", gap: 5, paddingBottom: 5, borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 24, fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em" }}>#</div>
                      <div style={{ width: 54, fontSize: 9, color: "var(--gray2)", textAlign: "center" }}>KG</div>
                      <div style={{ width: 14 }} />
                      <div style={{ width: 42, fontSize: 9, color: "var(--gray2)", textAlign: "center" }}>REPS</div>
                      <div style={{ flex: 1, fontSize: 9, color: "var(--gray2)", textAlign: "right", paddingRight: 8 }}>RPE</div>
                      <div style={{ width: 34, fontSize: 9, color: "var(--gray2)", textAlign: "center" }}>OK</div>
                    </div>
                    {logs.map((log, si2) => (
                      <SetRow key={si2} setIdx={si2} log={log}
                        plannedWeight={ex.weight ? String(ex.weight) : ""}
                        plannedReps={String(ex.reps || "")}
                        onUpdate={(field, val) => updateSetLog(ei, si2, field, val)}
                        onToggleDone={() => toggleSetDone(ei, si2)}
                      />
                    ))}
                  </>
                ) : null}
              </div>
            );
          })}

          {/* ACCESSORIES — checkbox */}
          {sec.exercises && sec.title === "ACCESSORIES" && (
            <div style={s.card}>
              {sec.exercises.map((ex, ei) => (
                <div key={ei} onClick={() => setAccDone(p => ({ ...p, [`${si}-${ei}`]: !p[`${si}-${ei}`] }))}
                  style={{ ...s.exerciseRow, cursor: "pointer", ...(ei === sec.exercises.length - 1 ? { borderBottom: "none" } : {}) }}>
                  <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
                    color: accDone[`${si}-${ei}`] ? "var(--gray2)" : "var(--white)",
                    textDecoration: accDone[`${si}-${ei}`] ? "line-through" : "none" }}>
                    {ex.name}
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 5, transition: "all 0.2s",
                    background: accDone[`${si}-${ei}`] ? "var(--red)" : "var(--bg3)",
                    border: `1px solid ${accDone[`${si}-${ei}`] ? "var(--red)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    {accDone[`${si}-${ei}`] ? "✓" : "○"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* KB SNATCH LEKKI */}
          {sec.snatchLight && (
            <div style={{ ...s.card, borderColor: condDone.snatchLight ? "rgba(196,30,30,0.6)" : "#4a9eff44", background: "rgba(74,158,255,0.05)" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: "#4a9eff", marginBottom: 6 }}>🏋 KB SNATCH — DZIEŃ LEKKI</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color: "var(--white)", marginBottom: 4 }}>{sec.snatchLightData.label}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 8 }}>{sec.snatchLightData.note}</div>
              <div style={{ fontSize: 11, color: "var(--gray2)", borderTop: "1px solid var(--border)", paddingTop: 8, marginBottom: 12 }}>Dobierz ciężar na 15 pow/rękę · Chroń skórę dłoni</div>
              <button onClick={() => setCondDone(p => ({ ...p, snatchLight: !p.snatchLight }))}
                style={{ ...s.btn, background: condDone.snatchLight ? "var(--red-dim)" : "var(--red)" }}>
                {condDone.snatchLight ? "✓ ZROBIONE" : "ZAZNACZ JAKO ZROBIONE"}
              </button>
            </div>
          )}

          {/* KB SNATCH MAX EFFORT */}
          {sec.snatchMax && (
            <div style={{ ...s.card, borderColor: condDone.snatchMax ? "rgba(196,30,30,0.6)" : "#f0a02044", background: "rgba(240,160,32,0.05)" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: "#f0a020", marginBottom: 6 }}>💥 KB SNATCH — MAX EFFORT</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color: "var(--white)", marginBottom: 4 }}>{sec.snatchMaxData.label}</div>
              {sec.snatchMaxData.isSwing && (
                <div style={{ fontSize: 11, color: "#f0a020", background: "rgba(240,160,32,0.1)", borderRadius: 4, padding: "4px 8px", marginBottom: 6, display: "inline-block" }}>Początkujący: One Arm Swing zamiast Snatch</div>
              )}
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 8 }}>{sec.snatchMaxData.note}</div>
              <div style={{ fontSize: 11, color: "var(--gray2)", borderTop: "1px solid var(--border)", paddingTop: 8, marginBottom: 12 }}>Odważnik +2 numery · Przerwa 2 min → cięższa kula po 12/12</div>
              <button onClick={() => setCondDone(p => ({ ...p, snatchMax: !p.snatchMax }))}
                style={{ ...s.btn, background: condDone.snatchMax ? "var(--red-dim)" : "var(--red)" }}>
                {condDone.snatchMax ? "✓ ZROBIONE" : "ZAZNACZ JAKO ZROBIONE"}
              </button>
            </div>
          )}

          {/* SWING EMOM */}
          {sec.swing && (
            <div style={{ ...s.card, borderColor: condDone.swing ? "rgba(196,30,30,0.6)" : "var(--red-dim)", background: "rgba(196,30,30,0.05)", textAlign: "center" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{sec.swingData.label}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 12 }}>2-hand swing · {user.kgKB}kg KB</div>
              {!condDone.swing
                ? <button style={s.btn} onClick={() => setShowTimer(true)}>⏱ LAUNCH EMOM TIMER</button>
                : <div style={{ color: "var(--red)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>✓ ZROBIONE</div>}
            </div>
          )}

          {/* KB COMPLEX */}
          {sec.complex && (
            <div style={{ ...s.card, borderColor: condDone.complex ? "rgba(196,30,30,0.6)" : "var(--border)" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>KB COMPLEX</div>
              <div style={{ fontSize: 13, color: "var(--white)", marginBottom: 10 }}>{sec.complexData.label}</div>
              <button onClick={() => setCondDone(p => ({ ...p, complex: !p.complex }))}
                style={{ ...s.btn, background: condDone.complex ? "var(--red-dim)" : "var(--red)" }}>
                {condDone.complex ? "✓ ZROBIONE" : "ZAZNACZ JAKO ZROBIONE"}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* SAVE / FINISH */}
      {!saved ? (
        <div style={s.card}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 10 }}>ZAKOŃCZ TRENING</div>
          <div style={{ fontSize: 13, color: doneSets === totalSets && totalSets > 0 ? "#4a9eff" : "var(--gray)", marginBottom: 14 }}>
            {doneSets === totalSets && totalSets > 0 ? "✅ Wszystkie serie zalogowane" : `⏳ ${doneSets}/${totalSets} serii ukończonych — możesz zapisać w każdej chwili`}
          </div>
          {showComment ? (
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>KOMENTARZ (opcjonalny)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Np. Świetny trening, poprawiłem technikę snatcha, lekko bolało kolano..."
                style={{ ...s.input, minHeight: 72, resize: "none", lineHeight: 1.5 }} />
            </div>
          ) : (
            <div onClick={() => setShowComment(true)} style={{ fontSize: 12, color: "var(--gray)", marginBottom: 14, cursor: "pointer", textDecoration: "underline" }}>
              + Dodaj komentarz do treningu
            </div>
          )}
          <button style={s.btn} onClick={saveWorkout}>💾 ZAPISZ TRENING</button>
        </div>
      ) : (
        <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.05)", textAlign: "center", animation: "fadeIn 0.4s ease" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔥</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 4 }}>TRENING ZAPISANY</div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 4 }}>{doneSets} serii · Tydzień {week} · Dzień {dayKey}</div>
          {comment && (
            <div style={{ fontSize: 12, color: "var(--gray2)", fontStyle: "italic", margin: "10px 0", padding: 8, background: "var(--bg3)", borderRadius: 4 }}>
              "{comment}"
            </div>
          )}
          <button style={{ ...s.btn, marginTop: 12 }} onClick={onComplete}>KONIEC →</button>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardScreen({ user, week, setWeek, onStartWorkout, hasCoach }) {
  const phase = getPhase(week);
  const phaseData = PHASES[phase];
  const weekInPhase = phase === 1 ? week : phase === 2 ? week - 4 : phase === 3 ? week - 8 : 1;
  const totalInPhase = phase === 1 ? 4 : phase === 2 ? 4 : phase === 3 ? 3 : 1;
  const pct = getPct(week, user.level);
  const days = ["A", "B", "C"];

  const [coachDays, setCoachDays] = useState([]);
  const [loadingDays, setLoadingDays] = useState(true);

  useEffect(() => {
    const loadCoachDays = async () => {
      if (!hasCoach) {
        setLoadingDays(false);
        return;
      }
      setLoadingDays(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase
            .from("program_days")
            .select("*")
            .eq("athlete_id", authUser.id)
            .eq("week", week);
          setCoachDays(data || []);
        }
      } catch(e) {}
      setLoadingDays(false);
    };
    loadCoachDays();
  }, [week, hasCoach]);

  const hasCoachProgram = coachDays.length > 0;

  return (
    <div style={s.screen}>
      {/* Program type badge */}
      {hasCoach ? (
        <div style={{ background: "rgba(232,213,160,0.1)", border: "1px solid var(--accent)", borderRadius: 6, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>COACHED ATHLETE</div>
            <div style={{ fontSize: 11, color: "var(--gray)" }}>Personalized program from your coach</div>
          </div>
        </div>
      ) : (
        <div style={{ background: "rgba(74,158,255,0.1)", border: "1px solid #4a9eff", borderRadius: 6, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📘</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#4a9eff" }}>FREE 12-WEEK PROGRAM</div>
            <div style={{ fontSize: 11, color: "var(--gray)" }}>SBD + Kettlebell periodization</div>
          </div>
        </div>
      )}

    {/* Phase header - only for free users */}
      {!hasCoach && <div style={{ ...s.card, background: `linear-gradient(135deg, var(--bg2) 0%, rgba(196,30,30,0.08) 100%)`, borderColor: phaseData.color + "44", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 4 }}>CURRENT PHASE</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, color: phaseData.color, lineHeight: 1 }}>{phaseData.name}</div>
            <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>Week {week} of 12 · {weekInPhase}/{totalInPhase} in phase</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{week}</div>
            <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.1em" }}>WEEK</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
            <div style={{ ...s.progressBar((week / 12) * 100, phaseData.color) }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 4 }}>{Math.round((week / 12) * 100)}% complete</div>
       </div>
      </div>}

      {/* Week indicator for coached athletes */}
      {hasCoach && (
        <div style={{ ...s.card, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 4 }}>CURRENT WEEK</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>Week {week}</div>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 48, fontWeight: 900, color: "var(--red)" }}>{week}</div>
        </div>
      )}

      {/* Intensity today - only for free users */}
      {!hasCoach && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[["INTENSITY", `${Math.round(pct * 100)}%`, "of 1RM"], ["KB", `${user.kgKB}kg`, "kettlebell"], ["LEVEL", user.level.toUpperCase().slice(0,3), user.level]].map(([label, val, sub]) => (
          <div key={label} style={{ ...s.card, textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: "var(--gray2)" }}>{sub}</div>
         </div>
        ))}
      </div>}

      {/* This week's sessions */}
      <div style={s.sectionLabel}>THIS WEEK'S SESSIONS</div>

      {loadingDays ? (
        <div style={{ ...s.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>Loading...</div>
        </div>
      ) : hasCoach ? (
        // COACHED ATHLETE - show coach program or "not ready"
        hasCoachProgram ? (
          days.map(day => {
            const coachDay = coachDays.find(d => d.day === day);
            if (!coachDay) {
              return (
                <div key={day} style={{ ...s.card, marginBottom: 10, opacity: 0.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: "var(--gray2)" }}>DAY {day}</div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--gray)" }}>Not assigned yet</div>
                    </div>
                    <div style={{ color: "var(--gray2)", fontSize: 16 }}>⏳</div>
                  </div>
                </div>
              );
            }
            return (
              <div key={day} style={{ ...s.card, marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s", borderColor: "var(--red-dim)" }}
                onClick={() => onStartWorkout(day)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: "var(--red)" }}>DAY {day}</div>
                      <div style={{ fontSize: 10, color: "var(--accent)", background: "rgba(232,213,160,0.1)", padding: "2px 6px", borderRadius: 3 }}>COACH</div>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700 }}>{coachDay.title}</div>
                    {coachDay.notes && <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>{coachDay.notes}</div>}
                  </div>
                  <div style={{ color: "var(--gray2)", fontSize: 20 }}>›</div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ ...s.card, textAlign: "center", padding: 32, borderColor: "var(--red-dim)" }}>
            <div style={{ fontSize: 24 }}>⏳</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginTop: 8 }}>PROGRAM NOT READY</div>
            <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6 }}>Your coach hasn't assigned Week {week} yet. Check back soon!</div>
          </div>
        )
      ) : (
        // FREE USER - show default 12-week program
        days.map(day => {
          const dayName = day === "A" ? "SQUAT DOMINANT" : day === "B" ? "DEADLIFT DOMINANT" : "BENCH DOMINANT";
          const sqVar = day !== "B" ? getSquatVariation(week, user.injuries) : null;
          const dlVar = day === "B" ? getDeadliftVariation(week, user.injuries) : null;
          const bpVar = day !== "B" ? getBenchVariation(week, user.injuries) : null;
          return (
            <div key={day} style={{ ...s.card, marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }}
              onClick={() => onStartWorkout(day)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: "var(--red)" }}>DAY {day}</div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700 }}>{dayName}</div>
                  <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>
                    {day === "A" ? `${sqVar} · ${bpVar}` : day === "B" ? `${dlVar} · OHP · Pull Ups` : `${bpVar} · ${sqVar} · Rows`}
                  </div>
                </div>
                <div style={{ color: "var(--gray2)", fontSize: 20 }}>›</div>
              </div>
            </div>
          );
        })
      )}

      {/* Week navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => setWeek(w => Math.max(1, w - 1))}>← PREV WEEK</button>
        <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => setWeek(w => Math.min(12, w + 1))}>NEXT WEEK →</button>
      </div>

      {week === 12 && (
        <div style={{ ...s.card, borderColor: "var(--accent)", background: "rgba(232,213,160,0.05)", marginTop: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--accent)", marginBottom: 8 }}>🏆 TEST WEEK</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.7 }}>
            Squat 1RM · Bench 1RM · Deadlift 1RM<br />
            5 min Snatch Test · Max Pull Ups · Max Dips
          </div>
        </div>
      )}

      {/* Upgrade CTA for free users */}
      {!hasCoach && (
        <div style={{ ...s.card, borderColor: "var(--accent)", background: "rgba(232,213,160,0.05)", marginTop: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)", marginBottom: 6 }}>🎯 WANT PERSONALIZED COACHING?</div>
          <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.6, marginBottom: 12 }}>
            Get a custom program tailored to your goals,<br />with direct feedback from Coach Karlos.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a href="https://www.instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" style={{ ...s.btn, display: "inline-block", textDecoration: "none", padding: "10px 16px", fontSize: 13 }}>
              📸 INSTAGRAM
            </a>
            <a href="mailto:karolprzybycien91@gmail.com" style={{ ...s.btnGhost, display: "inline-block", textDecoration: "none", padding: "10px 16px", fontSize: 13 }}>
              ✉️ EMAIL
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── PROGRESS ─────────────────────────────────────────────────────────────────

function ProgressScreen({ user, week }) {
  const milestones = [
    { label: "DL 2× BW", key: "dl", threshold: (bw) => bw * 2, current: user.oneRM.deadlift, emoji: "🏋️" },
    { label: "SQ 1.75× BW", key: "sq", threshold: (bw) => bw * 1.75, current: user.oneRM.squat, emoji: "💪" },
    { label: "BP 1.5× BW", key: "bp", threshold: (bw) => bw * 1.5, current: user.oneRM.bench, emoji: "🔩" },
    { label: "15 Pull Ups", key: "pu", threshold: () => 15, current: parseFloat(user.pullups) || 0, emoji: "🔝" },
  ];

  const bw = 80; // assumed bodyweight

  return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>MILESTONES</div>

      {milestones.map(m => {
        const target = m.threshold(bw);
        const pct = Math.min((m.current / target) * 100, 100);
        const achieved = pct >= 100;
        return (
          <div key={m.key} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700 }}>
                  {m.emoji} {m.label}
                </div>
                <div style={{ fontSize: 12, color: "var(--gray)" }}>{m.current} / {target} {m.key !== "pu" ? "kg" : "reps"}</div>
              </div>
              {achieved && <div style={s.badge("var(--red)")}>✓ DONE</div>}
            </div>
            <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
              <div style={{ ...s.progressBar(pct, achieved ? "#4a9eff" : "var(--red)"), height: "100%", borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 4 }}>{Math.round(pct)}% to goal</div>
          </div>
        );
      })}

      <div style={s.sectionLabel}>PROGRAM PROGRESS</div>
      <div style={s.card}>
        {[1,2,3,4].map(ph => {
          const phData = PHASES[ph];
          const done = getPhase(week) > ph;
          const current = getPhase(week) === ph;
          return (
            <div key={ph} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: ph < 4 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: done ? phData.color : current ? phData.color : "var(--border)", opacity: current ? 1 : done ? 0.6 : 0.3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 600, color: current ? phData.color : done ? "var(--gray)" : "var(--gray2)" }}>
                  {phData.name} (Wk {phData.weeks[0]}–{phData.weeks[1]})
                </div>
              </div>
              {done && <div style={{ fontSize: 12, color: "var(--gray)" }}>✓</div>}
              {current && <div style={{ ...s.badge(phData.color), fontSize: 10 }}>NOW</div>}
            </div>
          );
        })}
      </div>

      <div style={s.sectionLabel}>SWING PROGRESSION</div>
      <div style={s.card}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
          const sw = getSwingProtocol(w);
          const isPast = w < week;
          const isCurrent = w === week;
          return (
            <div key={w} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: w < 12 ? "1px solid var(--border)" : "none", opacity: isPast ? 0.45 : 1 }}>
              <div style={{ fontSize: 13, color: isCurrent ? "var(--white)" : "var(--gray)" }}>
                {isCurrent && <span style={{ color: "var(--red)", marginRight: 6 }}>●</span>}Wk {w}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif" }}>{sw.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────


// Competition photos
const COMP_PHOTOS = [
  { src: "data:image/jpeg;base64,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", caption: "Po secie — wszystko z siebie" },
  { src: "data:image/jpeg;base64,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", caption: "Kettlebell Snatch — zawody" },
];
function CoachScreen() {
  const [clients, setClients] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [view, setView] = useState("sessions"); // sessions | profile | addExercise
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: 10, weight: 0, notes: "", day: "A", week: 1 });
   const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [programDays, setProgramDays] = useState([]);
  const [buildMode, setBuildMode] = useState(false);
  const [buildWeek, setBuildWeek] = useState(1);
  const [buildDay, setBuildDay] = useState("A");
  const [buildTitle, setBuildTitle] = useState("");
  const [buildNotes, setBuildNotes] = useState("");
  const [buildExercises, setBuildExercises] = useState([
    { name: "", sets: 3, reps: 8, weight: 0, notes: "" }
  ]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("*");
      setClients(profiles || []);
      const { data: logs } = await supabase.from("workouts").select("*").order("created_at", { ascending: false });
      setWorkouts(logs || []);
   const { data: exs } = await supabase.from("custom_exercises").select("*").order("created_at", { ascending: false });
      setExercises(exs || []);
      const { data: days } = await supabase.from("program_days").select("*").order("week", { ascending: true });
      setProgramDays(days || []);
    } catch(e) { console.log("Coach load error:", e); }
    setLoading(false);
  };

  const saveExercise = async () => {
    if (!selectedClient || !newEx.name) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("custom_exercises").insert({
        coach_id: user.id,
        athlete_id: selectedClient,
        ...newEx,
      });
      setNewEx({ name: "", sets: 3, reps: 10, weight: 0, notes: "", day: "A", week: 1 });
      await loadData();
      setView("profile");
    } catch(e) { console.log("Save exercise error:", e); }
    setSaving(false);
  };
const saveProgramDay = async () => {
    if (!selectedClient || !buildTitle) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Zapisz dzień programu
      const { data: dayData } = await supabase.from("program_days").insert({
        coach_id: user.id,
        athlete_id: selectedClient,
        week: buildWeek,
        day: buildDay,
        title: buildTitle,
        notes: buildNotes,
      }).select().single();

      // Zapisz ćwiczenia dla tego dnia
      const validExercises = buildExercises.filter(e => e.name.trim());
      for (const ex of validExercises) {
        await supabase.from("custom_exercises").insert({
          coach_id: user.id,
          athlete_id: selectedClient,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
          day: buildDay,
          week: buildWeek,
        });
      }

      setBuildMode(false);
      setBuildTitle("");
      setBuildNotes("");
      setBuildExercises([{ name: "", sets: 3, reps: 8, weight: 0, notes: "" }]);
      await loadData();
      setView("profile");
    } catch(e) { console.log("Save program day error:", e); }
    setSaving(false);
  };

  const deleteProgramDay = async (dayId) => {
    await supabase.from("program_days").delete().eq("id", dayId);
    await supabase.from("custom_exercises")
      .delete()
      .eq("athlete_id", selectedClient)
      .eq("week", buildWeek)
      .eq("day", buildDay);
    await loadData();
  };
  const deleteExercise = async (id) => {
    await supabase.from("custom_exercises").delete().eq("id", id);
    await loadData();
  };

  const clientWorkouts = selectedClient
    ? workouts.filter(w => w.user_id === selectedClient)
    : workouts;

  const clientExercises = selectedClient
    ? exercises.filter(e => e.athlete_id === selectedClient)
    : [];

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short"
  });

  const selectedClientData = clients.find(c => c.id === selectedClient);

  

  return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>COACH DASHBOARD</div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          ["CLIENTS", clients.filter(c => c.role === "athlete").length, "total"],
          ["SESSIONS", workouts.length, "total"],
          ["THIS WEEK", workouts.filter(w => {
            const diff = (new Date() - new Date(w.created_at)) / (1000 * 60 * 60 * 24);
            return diff <= 7;
          }).length, "last 7 days"],
        ].map(([label, val, sub]) => (
          <div key={label} style={{ ...s.card, textAlign: "center", padding: "10px 6px" }}>
            <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "var(--red)" }}>{val}</div>
            <div style={{ fontSize: 9, color: "var(--gray2)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div style={s.sectionLabel}>CLIENTS</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <div onClick={() => { setSelectedClient(null); setView("sessions"); }}
          style={{ ...s.pill(!selectedClient), padding: "8px 14px" }}>ALL</div>
        {clients.filter(c => c.role === "athlete").map(c => (
          <div key={c.id} onClick={() => { setSelectedClient(c.id); setView("profile"); }}
            style={{ ...s.pill(selectedClient === c.id), padding: "8px 14px" }}>
            {c.name || c.id.slice(0, 8)}
          </div>
        ))}
      </div>

      {/* Client profile view */}
      {selectedClient && selectedClientData && view !== "addExercise" && (
        <div style={{ ...s.card, borderColor: "var(--red-dim)", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
            {selectedClientData.name || "Athlete"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
            {[
              ["Level", selectedClientData.level || "—"],
              ["Squat", selectedClientData.squat ? `${selectedClientData.squat}kg` : "—"],
              ["Bench", selectedClientData.bench ? `${selectedClientData.bench}kg` : "—"],
              ["Deadlift", selectedClientData.deadlift ? `${selectedClientData.deadlift}kg` : "—"],
              ["KB", selectedClientData.kb_weight ? `${selectedClientData.kb_weight}kg` : "—"],
              ["Sessions", clientWorkouts.length],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg3)", borderRadius: 4, padding: "6px 10px" }}>
                <div style={{ fontSize: 10, color: "var(--gray2)" }}>{k}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Custom exercises for this client */}
          {clientExercises.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>CUSTOM EXERCISES</div>
              {clientExercises.map(ex => (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>
                      {ex.sets}×{ex.reps} · {ex.weight}kg · Day {ex.day} · Wk {ex.week}
                    </div>
                    {ex.notes && <div style={{ fontSize: 11, color: "var(--gray2)", fontStyle: "italic" }}>{ex.notes}</div>}
                  </div>
                  <div onClick={() => deleteExercise(ex.id)}
                    style={{ color: "var(--red-dim)", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</div>
                </div>
              ))}
            </>
          )}

         {/* Program days */}
          {programDays.filter(d => d.athlete_id === selectedClient).length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", margin: "12px 0 8px" }}>PROGRAM</div>
              {programDays.filter(d => d.athlete_id === selectedClient)
                .map(day => {
                  const dayExs = exercises.filter(e => 
                    e.athlete_id === selectedClient && 
                    e.week === day.week && 
                    e.day === day.day
                  );
                  const dayCol = { A: "#4a9eff", B: "#f0a020", C: "var(--red)" };
                  const col = dayCol[day.day] || "var(--red)";
                  return (
                    <div key={day.id} style={{ borderLeft: `3px solid ${col}`, paddingLeft: 10, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: col }}>
                            WK {day.week} · DAY {day.day}
                          </div>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900 }}>{day.title}</div>
                          {day.notes && <div style={{ fontSize: 11, color: "var(--gray)", fontStyle: "italic" }}>{day.notes}</div>}
                        </div>
                        <div onClick={() => deleteProgramDay(day.id)}
                          style={{ color: "var(--red-dim)", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</div>
                      </div>
                      {dayExs.map((ex, i) => (
                        <div key={i} style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>
                          · {ex.name} — {ex.sets}×{ex.reps} @ {ex.weight}kg
                          {ex.notes && <span style={{ color: "var(--gray2)", fontStyle: "italic" }}> ({ex.notes})</span>}
                        </div>
                      ))}
                    </div>
                  );
                })}
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ ...s.btn, flex: 1 }} onClick={() => { setBuildMode(true); setView("buildProgram"); }}>
              + BUILD PROGRAM DAY
            </button>
          </div>
        </div>
      )}

     
{/* Build program day */}
      {view === "buildProgram" && selectedClient && (
        <div style={{ ...s.card, borderColor: "var(--accent)", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)", marginBottom: 14 }}>
            BUILD PROGRAM DAY — {selectedClientData?.name || "ATHLETE"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div>
              <label style={s.label}>WEEK</label>
              <input type="number" min={1} max={52} value={buildWeek}
                onChange={e => setBuildWeek(parseInt(e.target.value))} style={s.input} />
            </div>
            <div>
              <label style={s.label}>DAY</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["A", "B", "C"].map(d => (
                  <div key={d} onClick={() => setBuildDay(d)}
                    style={{ ...s.pill(buildDay === d), flex: 1, textAlign: "center", padding: "10px 0" }}>{d}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>SESSION TITLE</label>
            <input value={buildTitle} onChange={e => setBuildTitle(e.target.value)}
              placeholder="e.g. Squat Focus — Heavy" style={s.input} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>SESSION NOTES</label>
            <input value={buildNotes} onChange={e => setBuildNotes(e.target.value)}
              placeholder="e.g. Focus on depth, no belt today" style={s.input} />
          </div>

          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 10 }}>EXERCISES</div>

          {buildExercises.map((ex, i) => (
            <div key={i} style={{ ...s.card, marginBottom: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--gray2)" }}>EXERCISE {i + 1}</div>
                {buildExercises.length > 1 && (
                  <div onClick={() => setBuildExercises(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ color: "var(--red-dim)", fontSize: 16, cursor: "pointer" }}>✕</div>
                )}
              </div>
              <input value={ex.name} onChange={e => setBuildExercises(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))}
                placeholder="Exercise name" style={{ ...s.input, marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                <div>
                  <label style={s.label}>SETS</label>
                  <input type="number" value={ex.sets} onChange={e => setBuildExercises(prev => prev.map((p, idx) => idx === i ? { ...p, sets: parseInt(e.target.value) } : p))} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>REPS</label>
                  <input type="number" value={ex.reps} onChange={e => setBuildExercises(prev => prev.map((p, idx) => idx === i ? { ...p, reps: parseInt(e.target.value) } : p))} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>KG</label>
                  <input type="number" value={ex.weight} onChange={e => setBuildExercises(prev => prev.map((p, idx) => idx === i ? { ...p, weight: parseFloat(e.target.value) } : p))} style={s.input} />
                </div>
              </div>
              <input value={ex.notes} onChange={e => setBuildExercises(prev => prev.map((p, idx) => idx === i ? { ...p, notes: e.target.value } : p))}
                placeholder="Notes (optional)" style={s.input} />
            </div>
          ))}

          <button style={{ ...s.btnGhost, marginBottom: 12 }}
            onClick={() => setBuildExercises(prev => [...prev, { name: "", sets: 3, reps: 8, weight: 0, notes: "" }])}>
            + ADD EXERCISE
          </button>

          <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={saveProgramDay} disabled={saving}>
            {saving ? "SAVING..." : "SAVE PROGRAM DAY"}
          </button>
          <button style={{ ...s.btnGhost, marginTop: 8 }} onClick={() => setView("profile")}>
            ← CANCEL
          </button>
        </div>
      )}
      {/* Sessions list */}
      <div style={s.sectionLabel}>
        {selectedClient ? `SESSIONS — ${selectedClientData?.name || "ATHLETE"}` : "ALL SESSIONS"}
      </div>
      {clientWorkouts.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>No sessions yet</div>
        </div>
      ) : (
        clientWorkouts.map((w, i) => {
          const client = clients.find(c => c.id === w.user_id);
          const exs = w.exercises || [];
          const totalSets = exs.reduce((s, ex) => s + (ex.sets || []).length, 0);
          const doneSets = exs.reduce((s, ex) => s + (ex.sets || []).filter(st => st.done).length, 0);
          const vol = exs.reduce((s, ex) =>
            s + (ex.sets || []).filter(st => st.done && st.weight && st.reps)
              .reduce((s2, st) => s2 + parseFloat(st.weight) * parseFloat(st.reps), 0), 0);
          const dayCol = { A: "#4a9eff", B: "#f0a020", C: "var(--red)" };
          const col = dayCol[w.day] || "var(--red)";

          return (
            <div key={i} style={{ ...s.card, marginBottom: 10, borderLeft: `3px solid ${col}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ ...s.badge(col), fontSize: 10 }}>DAY {w.day}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {w.week}</div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>
                    {w.workout_title?.replace(/DAY [ABC] — /, "")}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>
                    {fmtDate(w.created_at)} · {client?.name || "Athlete"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {vol > 0 && (
                    <>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{Math.round(vol)}</div>
                      <div style={{ fontSize: 9, color: "var(--gray2)" }}>KG VOL</div>
                    </>
                  )}
                  <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>{doneSets}/{totalSets} sets</div>
                </div>
              </div>
              {w.comment && (
                <div style={{ fontSize: 12, color: "var(--gray)", fontStyle: "italic", background: "var(--bg3)", borderRadius: 4, padding: "6px 10px", marginTop: 8, borderLeft: `2px solid ${col}` }}>
                  💬 {w.comment}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
function ProfileScreen({ user }) {
  return (
    <div style={s.screen}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg3)", border: "2px solid var(--red)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏋️</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>ATHLETE PROFILE</div>
        <div style={{ fontSize: 13, color: "var(--gray)" }}>{user.level.toUpperCase()}</div>
      </div>

      <div style={s.sectionLabel}>1RM DATA</div>
      <div style={s.card}>
        {[["Squat", user.oneRM.squat], ["Bench Press", user.oneRM.bench], ["Deadlift", user.oneRM.deadlift]].map(([k, v]) => (
          <div key={k} style={{ ...s.exerciseRow, alignItems: "center" }}>
            <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 600 }}>{k}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900 }}>{v}<span style={{ fontSize: 14, color: "var(--gray)", marginLeft: 4 }}>kg</span></div>
          </div>
        ))}
        <div style={{ ...s.exerciseRow, borderBottom: "none", alignItems: "center" }}>
          <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 600 }}>Pull Ups Max</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900 }}>{user.pullups || "—"}</div>
        </div>
      </div>

      <div style={s.sectionLabel}>RECOVERY & HEALTH</div>
      <div style={s.card}>
        <Row label="Recovery Score" val={`${user.recovery}/5`} />
        <Row label="Kettlebell" val={`${user.kgKB} kg`} />
        {Object.entries(user.injuries).filter(([,v]) => v).map(([k]) => (
          <Row key={k} label="Injury flag" val={k} />
        ))}
        {!Object.values(user.injuries).some(Boolean) && <Row label="Injuries" val="None — full program" />}
      </div>

      <div style={s.sectionLabel}>COMPETITION GALLERY</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {COMP_PHOTOS.map((p, i) => (
          <div key={i} style={{ borderRadius: 6, overflow: "hidden", position: "relative", border: "1px solid #222" }}>
            <img src={p.src} alt={p.caption} style={{ width: "100%", display: "block", objectFit: "cover", height: 300, objectPosition: i === 0 ? "center 20%" : "center 35%" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "24px 12px 10px", fontSize: 12, color: "var(--cream)", letterSpacing: "0.05em", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>{p.caption}</div>
          </div>
        ))}
      </div>

      <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.05)", textAlign: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: "0.08em", marginBottom: 4 }}>KARLITO STRENGTH</div>
        <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 16 }}>BUILT THROUGH DISCIPLINE</div>
        <button style={{ ...s.btnGhost, fontSize: 12 }} onClick={() => supabase.auth.signOut()}>
          SIGN OUT
        </button>
      </div>
    </div>
  );
}

// ─── HISTORY SCREEN ───────────────────────────────────────────────────────────

function HistoryScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ks_logs");
      const entries = raw ? JSON.parse(raw) : [];
      setLogs(entries.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch { }
    setLoading(false);
  }, []);

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
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
      <div style={{ fontSize: 13, color: "var(--gray)", letterSpacing: "0.1em" }}>ŁADOWANIE...</div>
    </div>
  );

  if (logs.length === 0) return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>HISTORIA TRENINGÓW</div>
      <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Brak logów</div>
        <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.7 }}>
          Po treningu naciśnij<br /><strong style={{ color: "var(--white)" }}>💾 ZAPISZ TRENING</strong><br />i log pojawi się tutaj.
        </div>
      </div>
    </div>
  );

  const totalVol = logs.reduce((s, l) => s + volKg(l.exercises), 0);
  const totalSessions = logs.length;

  return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>HISTORIA TRENINGÓW</div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          ["SESJE", totalSessions, "łącznie"],
          ["WOLUMIN", totalVol > 0 ? `${Math.round(totalVol / 1000)}t` : "—", "łączny"],
          ["OSTATNI", logs[0] ? fmtDate(logs[0].date) : "—", "trening"],
        ].map(([label, val, sub]) => (
          <div key={label} style={{ ...s.card, textAlign: "center", padding: "10px 6px" }}>
            <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: label === "OSTATNI" ? 13 : 22, fontWeight: 900, lineHeight: 1.1, color: "var(--red)" }}>{val}</div>
            <div style={{ fontSize: 9, color: "var(--gray2)", marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Entries */}
      {logs.map((log, idx) => {
        const vol = volKg(log.exercises);
        const rpe = maxRPE(log.exercises);
        const isOpen = expanded === idx;
        const col = dayCol[log.day] || "var(--red)";
        const doneSets = log.exercises?.reduce((s, ex) => s + (ex.sets || []).filter(st => st.done).length, 0) || 0;
        const allSets = log.exercises?.reduce((s, ex) => s + (ex.sets || []).length, 0) || 0;

        return (
          <div key={idx} style={{ ...s.card, marginBottom: 10, borderLeft: `3px solid ${col}`, cursor: "pointer" }}
            onClick={() => setExpanded(isOpen ? null : idx)}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ ...s.badge(col), fontSize: 10 }}>DZIEŃ {log.day}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {log.week}</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  {log.workout?.replace(/DAY [ABC] — /, "")}
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
                <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>{doneSets}/{allSets} serii</div>
                {rpe != null && (
                  <div style={{ ...s.badge(rpe >= 9 ? "var(--red)" : "var(--gray2)"), fontSize: 9, marginTop: 4, display: "inline-block" }}>RPE {rpe}</div>
                )}
              </div>
            </div>

            {/* Expanded */}
            {isOpen && (
              <div style={{ marginTop: 14, animation: "fadeIn 0.2s ease" }}>
                <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />

                {log.exercises?.map((ex, ei) => {
                  const doneSetsEx = (ex.sets || []).filter(st => st.done && st.weight && st.reps);
                  if (doneSetsEx.length === 0) return null;
                  return (
                    <div key={ei} style={{ marginBottom: 10 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: col, marginBottom: 5, letterSpacing: "0.06em" }}>
                        {ex.name}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {ex.sets?.map((set, si) => !set.done ? null : (
                          <div key={si} style={{
                            background: "var(--bg3)",
                            border: `1px solid ${set.rpe >= 9 ? "rgba(196,30,30,0.5)" : "var(--border)"}`,
                            borderRadius: 5, padding: "4px 8px",
                            fontFamily: "'Barlow Condensed', sans-serif",
                          }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{set.weight}kg</span>
                            <span style={{ fontSize: 12, color: "var(--gray2)" }}>×</span>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{set.reps}</span>
                            <span style={{ fontSize: 10, color: "var(--gray2)", marginLeft: 2 }}>@{set.rpe}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {log.comment && (
                  <div style={{ fontSize: 12, color: "var(--gray)", fontStyle: "italic", background: "var(--bg3)", borderRadius: 4, padding: "8px 10px", marginTop: 8, lineHeight: 1.5, borderLeft: `2px solid ${col}` }}>
                    💬 {log.comment}
                  </div>
                )}

                <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 10, textAlign: "right", letterSpacing: "0.08em" }}>
                  KLIKNIJ ABY ZWINĄĆ ↑
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const NAV_ATHLETE = [
  { id: "dashboard", icon: "⚡", label: "HOME" },
  { id: "workout", icon: "🏋️", label: "TRAIN" },
  { id: "history", icon: "📋", label: "LOGI" },
  { id: "progress", icon: "📈", label: "STATS" },
  { id: "profile", icon: "👤", label: "JA" },
];

const NAV_COACH = [
  { id: "dashboard", icon: "⚡", label: "HOME" },
  { id: "workout", icon: "🏋️", label: "TRAIN" },
  { id: "history", icon: "📋", label: "LOGI" },
  { id: "progress", icon: "📈", label: "STATS" },
  { id: "profile", icon: "👤", label: "JA" },
  { id: "coach", icon: "🎯", label: "COACH" },
];

export default function App() {
const [authUser, setAuthUser] = useState(undefined);
  const [user, setUser] = useState(null);
 const [isCoach, setIsCoach] = useState(false);
const [hasCoach, setHasCoach] = useState(false);
  const [week, setWeek] = useState(1);
  const [tab, setTab] = useState("dashboard");
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null);
    });
  }, []);

 useEffect(() => {
    if (!authUser) return;
    const saved = localStorage.getItem("ks_profile");
    if (saved) setUser(JSON.parse(saved));

    // Sprawdź rolę i coach_id
    supabase.from("profiles")
      .select("role, coach_id")
      .eq("id", authUser.id)
      .single()
      .then(({ data }) => {
        if (data?.role === "coach") setIsCoach(true);
        // Only athletes with coach_id get coached experience
        if (data?.role === "athlete" && data?.coach_id) setHasCoach(true);
      });
  }, [authUser]);

  if (authUser === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: "var(--gray)", letterSpacing: "0.2em" }}>LOADING...</div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuth={(u) => setAuthUser(u)} />;
  }

  if (!user) {
    return <OnboardingScreen onComplete={(u) => {
      localStorage.setItem("ks_profile", JSON.stringify(u));
      setUser(u);
      setTab("dashboard");
    }} />;
  }

  const handleStartWorkout = (day) => { setActiveDay(day); setTab("workout"); };
  const handleWorkoutDone = () => { setActiveDay(null); setTab("history"); };

  return (
<div style={{...s.app, background: `linear-gradient(rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.85) 50%, rgba(8,8,8,0.93) 100%), url(${COMP_PHOTOS[1].src}) center 35% / cover fixed`}}>
      <div style={s.header}>
        <div style={s.logo}>KARLITO <span style={s.logoRed}>STRENGTH</span></div>
        <div style={s.tagline}>Week {week} · {PHASES[getPhase(week)].name}</div>
      </div>

      <div className="fade-in" key={tab + activeDay}>
        {tab === "dashboard" && <DashboardScreen user={user} week={week} setWeek={setWeek} onStartWorkout={handleStartWorkout} hasCoach={hasCoach} />}
        {tab === "workout" && !activeDay && <DashboardScreen user={user} week={week} setWeek={setWeek} onStartWorkout={handleStartWorkout} hasCoach={hasCoach} />}
      {tab === "workout" && activeDay && <WorkoutScreen user={user} week={week} dayKey={activeDay} authUser={authUser} onComplete={handleWorkoutDone} />}
        {tab === "history" && <HistoryScreen />}
        {tab === "progress" && <ProgressScreen user={user} week={week} />}
   {tab === "profile" && <ProfileScreen user={user} />}
        {tab === "coach" && <CoachScreen />}
      </div>

      <nav style={s.navBar}>
        {(isCoach ? NAV_COACH : NAV_ATHLETE).map(n => (
          <div key={n.id} style={s.navItem(tab === n.id)} onClick={() => { setTab(n.id); if (n.id !== "workout") setActiveDay(null); }}>
            <div style={{ fontSize: 20 }}>{n.icon}</div>
            <div style={s.navLabel}>{n.label}</div>
          </div>
        ))}
      </nav>
    </div>
  );
}
