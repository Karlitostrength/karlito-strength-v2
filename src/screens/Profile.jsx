import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";
import { registerPushSubscription, unregisterPushSubscription } from "../lib/push";
import { getDomSilyLevel } from "../constants/levels";
import { Row } from "../components/SmallComponents";
import { DomSilyPathScreen } from "./DomSilyPath";

// ─── DietFilesSection ─────────────────────────────────────────────────────────

function DietFilesSection({ authUser }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("diet_files")
          .select("*").eq("athlete_id", authUser.id)
          .order("created_at", { ascending: false });
        setFiles(data || []);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [authUser]);

  if (loading || files.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={s.sectionLabel}>🥗 NUTRITION PLANS</div>
      <div style={s.card}>
        {files.map((f, i) => (
          <div key={i} style={{ ...s.exerciseRow, alignItems: "center", ...(i === files.length - 1 ? { borderBottom: "none" } : {}) }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700 }}>📄 {f.file_name}</div>
              <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>
                {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <a href={f.file_url} target="_blank" rel="noopener noreferrer"
              style={{ padding: "8px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
              OPEN →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OneRMEditor ──────────────────────────────────────────────────────────────

function OneRMEditor({ user, authUser }) {
  const [vals, setVals] = useState({
    squat:    user?.oneRM?.squat    || "",
    bench:    user?.oneRM?.bench    || "",
    deadlift: user?.oneRM?.deadlift || "",
    pullups:  user?.pullups         || "",
  });
  const [injuries, setInjuries] = useState({
    knee:      user?.injuries?.knee      || false,
    lowerBack: user?.injuries?.lowerBack || false,
    shoulder:  user?.injuries?.shoulder  || false,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const { error: e } = await supabase.from("profiles").update({
        squat:    parseFloat(vals.squat)    || null,
        bench:    parseFloat(vals.bench)    || null,
        deadlift: parseFloat(vals.deadlift) || null,
        pullups:  parseFloat(vals.pullups)  || null,
      }).eq("id", authUser.id);
      if (e) throw e;
      const saved_profile = localStorage.getItem("ks_profile");
      if (saved_profile) {
        const p = JSON.parse(saved_profile);
        p.oneRM = { squat: parseFloat(vals.squat)||0, bench: parseFloat(vals.bench)||0, deadlift: parseFloat(vals.deadlift)||0 };
        p.pullups = vals.pullups;
        p.injuries = injuries;
        localStorage.setItem("ks_profile", JSON.stringify(p));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message || "Save failed"); }
    setSaving(false);
  };

  return (
    <div style={s.card}>
      {[["Squat","squat"],["Bench Press","bench"],["Deadlift","deadlift"]].map(([label, key]) => (
        <div key={key} style={{ ...s.exerciseRow, alignItems: "center" }}>
          <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 600 }}>{label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" value={vals[key]}
              onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))}
              style={{ ...s.input, width: 80, textAlign: "center", padding: "6px 8px" }}
              placeholder="0" />
            <span style={{ fontSize: 12, color: "var(--gray2)" }}>kg</span>
          </div>
        </div>
      ))}
      <div style={{ ...s.exerciseRow, alignItems: "center" }}>
        <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 600 }}>Pull Ups Max</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="number" value={vals.pullups}
            onChange={e => setVals(v => ({ ...v, pullups: e.target.value }))}
            style={{ ...s.input, width: 80, textAlign: "center", padding: "6px 8px" }}
            placeholder="0" />
          <span style={{ fontSize: 12, color: "var(--gray2)" }}>reps</span>
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 8 }}>INJURY FLAGS</div>
        {[["knee","Knee"],["lowerBack","Lower Back"],["shoulder","Shoulder"]].map(([key, label]) => (
          <div key={key} onClick={() => setInjuries(v => ({ ...v, [key]: !v[key] }))}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              background: injuries[key] ? "var(--red)" : "var(--bg3)",
              border: `1px solid ${injuries[key] ? "var(--red)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>
              {injuries[key] ? "✓" : ""}
            </div>
            <span style={{ fontSize: 13, color: injuries[key] ? "var(--red)" : "var(--gray)" }}>{label}</span>
          </div>
        ))}
      </div>
      {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>⚠ {error}</div>}
      <button onClick={save} disabled={saving}
        style={{ ...s.btn, marginTop: 12, opacity: saving ? 0.6 : 1 }}>
        {saved ? "✓ SAVED" : saving ? "SAVING..." : "SAVE"}
      </button>
    </div>
  );
}

// ─── IntakeForm ───────────────────────────────────────────────────────────────

function IntakeForm({ authUser }) {
  const [intake, setIntake] = useState({
    date_of_birth: "", phone: "", gender: "",
    training_goal: "", training_history: "",
    injuries: "", sessions_per_week: "", equipment: "",
  });
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("profiles")
          .select("date_of_birth,phone,gender,training_goal,training_history,injuries,sessions_per_week,equipment,intake_completed")
          .eq("id", authUser.id).single();
        if (data) {
          setIntake({
            date_of_birth: data.date_of_birth || "",
            phone: data.phone || "",
            gender: data.gender || "",
            training_goal: data.training_goal || "",
            training_history: data.training_history || "",
            injuries: data.injuries || "",
            sessions_per_week: data.sessions_per_week || "",
            equipment: data.equipment || "",
          });
          setCompleted(data.intake_completed || false);
        }
      } catch (e) {}
    };
    load();
  }, [authUser]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await supabase.from("profiles").update({
        ...intake,
        sessions_per_week: intake.sessions_per_week ? parseInt(intake.sessions_per_week) : null,
        intake_completed: true,
      }).eq("id", authUser.id);
      setCompleted(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {}
    setSaving(false);
  };

  return (
    <div>
      {!completed && (
        <div style={{ ...s.card, borderColor: "rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.05)", marginBottom: 14, textAlign: "center", padding: "12px 16px" }}>
          <div style={{ fontSize: 13, color: "var(--gold)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>
            📝 Fill in your intake form so your coach can build the perfect programme for you.
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 14 }}>PERSONAL INFO</div>
        <label style={s.label}>DATE OF BIRTH</label>
        <input type="date" value={intake.date_of_birth}
          onChange={e => setIntake(p => ({ ...p, date_of_birth: e.target.value }))}
          style={{ ...s.input, marginBottom: 12, colorScheme: "dark" }} />
        <label style={s.label}>PHONE / WHATSAPP</label>
        <input type="tel" value={intake.phone}
          onChange={e => setIntake(p => ({ ...p, phone: e.target.value }))}
          placeholder="+44 7xxx xxxxxx" style={{ ...s.input, marginBottom: 12 }} />
        <label style={s.label}>GENDER</label>
        <select value={intake.gender}
          onChange={e => setIntake(p => ({ ...p, gender: e.target.value }))}
          style={{ ...s.input, marginBottom: 0 }}>
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div style={{ ...s.card, marginTop: 12 }}>
        <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 14 }}>TRAINING PROFILE</div>
        <label style={s.label}>MAIN GOAL</label>
        <select value={intake.training_goal}
          onChange={e => setIntake(p => ({ ...p, training_goal: e.target.value }))}
          style={{ ...s.input, marginBottom: 12 }}>
          <option value="">Select your main goal...</option>
          <option value="get_stronger">Get stronger (powerlifting / barbell)</option>
          <option value="kettlebells">Learn kettlebells</option>
          <option value="lose_weight">Lose weight and build muscle</option>
          <option value="compete">Compete in kettlebell sport</option>
          <option value="general_fitness">General fitness and health</option>
          <option value="rehab">Injury rehab / movement quality</option>
        </select>
        <label style={s.label}>TRAINING HISTORY</label>
        <select value={intake.training_history}
          onChange={e => setIntake(p => ({ ...p, training_history: e.target.value }))}
          style={{ ...s.input, marginBottom: 12 }}>
          <option value="">Select...</option>
          <option value="never">Never trained before</option>
          <option value="beginner">Sporadic training (less than 1 year)</option>
          <option value="intermediate">Regular training (1–3 years)</option>
          <option value="advanced">Advanced (3+ years, structured training)</option>
        </select>
        <label style={s.label}>SESSIONS PER WEEK (available)</label>
        <select value={intake.sessions_per_week}
          onChange={e => setIntake(p => ({ ...p, sessions_per_week: e.target.value }))}
          style={{ ...s.input, marginBottom: 12 }}>
          <option value="">Select...</option>
          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}× per week</option>)}
        </select>
        <label style={s.label}>EQUIPMENT AVAILABLE AT HOME</label>
        <select value={intake.equipment}
          onChange={e => setIntake(p => ({ ...p, equipment: e.target.value }))}
          style={{ ...s.input, marginBottom: 0 }}>
          <option value="">Select...</option>
          <option value="none">No equipment — gym only</option>
          <option value="kettlebells">Kettlebells</option>
          <option value="barbell">Barbell + plates</option>
          <option value="full_home_gym">Full home gym</option>
          <option value="resistance_bands">Resistance bands / light weights</option>
        </select>
      </div>

      <div style={{ ...s.card, marginTop: 12 }}>
        <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 14 }}>HEALTH & INJURIES</div>
        <label style={s.label}>INJURIES / LIMITATIONS (current or past)</label>
        <textarea value={intake.injuries}
          onChange={e => setIntake(p => ({ ...p, injuries: e.target.value }))}
          placeholder="e.g. lower back pain, left knee surgery 2022, shoulder impingement... or 'none'"
          rows={4} style={{ ...s.input, resize: "none", lineHeight: 1.5 }} />
      </div>

      <button onClick={save} disabled={saving}
        style={{ ...s.btn, opacity: saving ? 0.6 : 1, marginTop: 4 }}>
        {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE INTAKE →"}
      </button>
    </div>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export function ProfileScreen({ user, authUser }) {
  const [profileTab, setProfileTab] = useState("profile");
  const [goals, setGoals] = useState({ main_goal: "", competition_date: "", notes: "" });
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);

  const bw = user?.bodyweight || 80;
  const gender = user?.gender || "men";
  const currentLevel = getDomSilyLevel(user, bw, gender);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const { data } = await supabase.from("profiles")
          .select("main_goal, competition_date, athlete_notes")
          .eq("id", authUser.id).single();
        if (data) setGoals({
          main_goal: data.main_goal || "",
          competition_date: data.competition_date || "",
          notes: data.athlete_notes || "",
        });
      } catch (e) {}
    };
    loadGoals();
  }, [authUser]);

  const saveGoals = async () => {
    setSavingGoals(true);
    setGoalsSaved(false);
    try {
      await supabase.from("profiles").update({
        main_goal: goals.main_goal,
        competition_date: goals.competition_date || null,
        athlete_notes: goals.notes,
      }).eq("id", authUser.id);
      setGoalsSaved(true);
      setTimeout(() => setGoalsSaved(false), 2000);
    } catch (e) {}
    setSavingGoals(false);
  };

  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.from("push_subscriptions").select("id").eq("user_id", authUser.id).maybeSingle();
      setPushEnabled(!!data);
    };
    check();
  }, [authUser]);

  const enableNotifications = async () => {
    setPushError("");
    const result = await registerPushSubscription(authUser.id);
    if (result.ok) { setNotifStatus("granted"); setPushEnabled(true); }
    else { setNotifStatus("denied"); setPushError(result.error || "Unknown error"); }
  };

  const disableNotifications = async () => {
    setPushError("");
    const result = await unregisterPushSubscription(authUser.id);
    if (result.ok) setPushEnabled(false);
    else setPushError(result.error || "Unknown error");
  };

  return (
    <div style={s.screen}>
      {/* Avatar & rank */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%",
          background: currentLevel ? currentLevel.color + "22" : "var(--bg3)",
          border: `2px solid ${currentLevel ? currentLevel.color : "var(--red)"}`,
          margin: "0 auto 10px", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 36 }}>
          {currentLevel ? currentLevel.icon : "🏋️"}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>
          {user.name || "ATHLETE"}
        </div>
        {currentLevel ? (
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: currentLevel.color, letterSpacing: "0.2em", marginTop: 4 }}>
            {currentLevel.name}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>Unranked — take the test</div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["profile", "📋 PROFILE"], ["intake", "📝 INTAKE"], ["path", "⚔️ MY PATH"]].map(([t, label]) => (
          <button key={t} onClick={() => setProfileTab(t)} style={{
            flex: 1, ...s.btnGhost, fontSize: 11, padding: "10px 6px",
            borderColor: profileTab === t ? "var(--accent)" : "var(--border)",
            color: profileTab === t ? "var(--accent)" : "var(--gray)",
            background: profileTab === t ? "rgba(232,213,160,0.08)" : "transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* PATH TAB */}
      {profileTab === "path" && (
        <DomSilyPathScreen user={user} authUser={authUser} />
      )}

      {/* INTAKE TAB */}
      {profileTab === "intake" && (
        <IntakeForm authUser={authUser} />
      )}

      {/* PROFILE TAB */}
      {profileTab === "profile" && (<>
        <div style={s.sectionLabel}>1RM DATA</div>
        <OneRMEditor user={user} authUser={authUser} />

        <div style={s.sectionLabel}>RECOVERY & HEALTH</div>
        <div style={s.card}>
          <Row label="Recovery Score" val={`${user.recovery}/5`} />
          <Row label="Kettlebell" val={`${user.kgKB} kg`} />
          {Object.entries(user.injuries || {}).filter(([,v]) => v).map(([k]) => (
            <Row key={k} label="Injury flag" val={k} />
          ))}
          {!Object.values(user.injuries || {}).some(Boolean) && <Row label="Injuries" val="None — full program" />}
        </div>

        <div style={s.sectionLabel}>YOUR JOURNEY</div>
        <div style={{ ...s.card, textAlign: "center", padding: "30px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚔️</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, color: "var(--white)", letterSpacing: "0.05em", fontWeight: 900 }}>
            THE IRON NEVER LIES
          </div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 8 }}>
            Forged through discipline. Keep showing up.
          </div>
        </div>

        <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.05)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: "0.08em", marginBottom: 4 }}>KARLITO STRENGTH</div>
          <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 16 }}>BUILT THROUGH DISCIPLINE</div>

          {notifStatus === "unsupported" ? (
            <div style={{ fontSize: 12, color: "var(--gray2)", marginBottom: 12 }}>🔕 Push not supported in this browser</div>
          ) : pushEnabled ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 8 }}>🔔 Notifications enabled ✓</div>
              <button style={{ ...s.btnGhost, fontSize: 11, marginBottom: 6 }} onClick={enableNotifications}>↺ Re-register</button>
              <button style={{ ...s.btnGhost, fontSize: 11, color: "var(--red-dim)", borderColor: "var(--red-dim)" }} onClick={disableNotifications}>🔕 Disable notifications</button>
            </div>
          ) : (
            <button style={{ ...s.btn, marginBottom: 10, fontSize: 13 }} onClick={enableNotifications}>
              🔔 ENABLE NOTIFICATIONS
            </button>
          )}
          {notifStatus === "denied" && !pushEnabled && (
            <div style={{ fontSize: 11, color: "var(--gray2)", marginBottom: 8 }}>Blocked in browser — reset in site settings</div>
          )}
          {pushError ? (
            <div style={{ fontSize: 11, color: "var(--red-dim)", marginBottom: 10, background: "rgba(196,30,30,0.1)", padding: "6px 10px", borderRadius: 4 }}>
              ⚠ {pushError}
            </div>
          ) : null}

          <DietFilesSection authUser={authUser} />

          <div style={{ marginBottom: 20 }}>
            <div style={s.sectionLabel}>🎯 GOALS</div>
            <div style={s.card}>
              <label style={s.label}>MAIN GOAL</label>
              <input value={goals.main_goal}
                onChange={e => setGoals(g => ({ ...g, main_goal: e.target.value }))}
                placeholder="e.g. Total 500kg at nationals, lose 5kg, first powerlifting meet..."
                style={{ ...s.input, marginBottom: 12 }} />
              <label style={s.label}>COMPETITION DATE (optional)</label>
              <input type="date" value={goals.competition_date}
                onChange={e => setGoals(g => ({ ...g, competition_date: e.target.value }))}
                style={{ ...s.input, marginBottom: 12, colorScheme: "dark" }} />
              <label style={s.label}>NOTES FOR YOUR COACH</label>
              <textarea value={goals.notes}
                onChange={e => setGoals(g => ({ ...g, notes: e.target.value }))}
                placeholder="Injuries, schedule constraints, preferences..."
                rows={3} style={{ ...s.input, resize: "none", lineHeight: 1.5, marginBottom: 12 }} />
              <button onClick={saveGoals} disabled={savingGoals}
                style={{ ...s.btn, opacity: savingGoals ? 0.6 : 1 }}>
                {goalsSaved ? "✓ SAVED" : savingGoals ? "SAVING..." : "SAVE GOALS"}
              </button>
            </div>
          </div>

          <button style={{ ...s.btnGhost, fontSize: 12 }} onClick={() => supabase.auth.signOut()}>
            SIGN OUT
          </button>
        </div>
      </>)}
    </div>
  );
}
