import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { registerPushSubscription, unregisterPushSubscription } from "../lib/push";
import { getDomSilyLevel } from "../constants/levels";
import { Row } from "../components/SmallComponents";
import { DomSilyPathScreen } from "./DomSilyPath";


export function ProfileScreen({ user, authUser }) {
  const [profileTab, setProfileTab] = useState("profile"); // profile | path
  const [goals, setGoals] = useState({ main_goal: "", competition_date: "", notes: "" });
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);

  // Compute current level for badge in profile header
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
      } catch(e) {}
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
    } catch(e) {}
    setSavingGoals(false);
  };

  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    // Check if actually subscribed in DB
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
      {/* Header with level badge */}
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
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: currentLevel.color,
            letterSpacing: "0.2em", marginTop: 4 }}>
            {currentLevel.name}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>Unranked — take the test</div>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["profile", "📋 PROFILE"], ["path", "⚔️ MY PATH"]].map(([t, label]) => (
          <button key={t} onClick={() => setProfileTab(t)} style={{
            flex: 1, ...s.btnGhost, fontSize: 12, padding: "10px",
            borderColor: profileTab === t ? "var(--accent)" : "var(--border)",
            color: profileTab === t ? "var(--accent)" : "var(--gray)",
            background: profileTab === t ? "rgba(232,213,160,0.08)" : "transparent",
          }}>{label}</button>
        ))}
      </div>

      {profileTab === "path" && (
        <DomSilyPathScreen user={user} authUser={authUser} />
      )}

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

        {/* DIET FILES */}
        <DietFilesSection authUser={authUser} />

        {/* GOALS SECTION */}
        <div style={{ marginBottom: 20 }}>
          <div style={s.sectionLabel}>🎯 GOALS</div>
          <div style={s.card}>
            <label style={s.label}>MAIN GOAL</label>
            <input
              value={goals.main_goal}
              onChange={e => setGoals(g => ({ ...g, main_goal: e.target.value }))}
              placeholder="e.g. Total 500kg at nationals, lose 5kg, first powerlifting meet..."
              style={{ ...s.input, marginBottom: 12 }}
            />
            <label style={s.label}>COMPETITION DATE (optional)</label>
            <input
              type="date"
              value={goals.competition_date}
              onChange={e => setGoals(g => ({ ...g, competition_date: e.target.value }))}
              style={{ ...s.input, marginBottom: 12, colorScheme: "dark" }}
            />
            <label style={s.label}>NOTES FOR YOUR COACH</label>
            <textarea
              value={goals.notes}
              onChange={e => setGoals(g => ({ ...g, notes: e.target.value }))}
              placeholder="Injuries, schedule constraints, preferences..."
              rows={3}
              style={{ ...s.input, resize: "none", lineHeight: 1.5, marginBottom: 12 }}
            />
            <button
              onClick={saveGoals}
              disabled={savingGoals}
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
