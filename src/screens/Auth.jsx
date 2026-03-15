import { useState } from "react";
import { s } from "../lib/styles";
import { supabase } from "../lib/supabase";


export function AuthScreen({ onAuth }) {
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
export function OnboardingScreen({ onComplete }) {
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
          8-week periodised program. Strength Training & Kettlebells. Built on science, tested in the gym.
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
          3 days / week · 8 weeks total<br />
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
