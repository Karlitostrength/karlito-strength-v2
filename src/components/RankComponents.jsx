import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { DOM_SILY_LEVELS } from "../constants/levels";


export function LevelCard({ level, isCurrentLevel, compact = false, showStandards = false, gender = "men" }) {
  if (!level) return null;
  const iconSize = compact ? 28 : 48;
  const standards = level[gender] || level.men;
  const PILLAR_LABELS = { push:"Push", pull:"Pull", hinge:"Hinge", squat:"Squat", carry:"Carry", engine:"Engine" };
  return (
    <div style={{
      background: `linear-gradient(135deg, ${level.color}22 0%, ${level.color}08 100%)`,
      border: `2px solid ${isCurrentLevel ? level.color : level.color + "44"}`,
      borderRadius: 8, padding: compact ? "10px 14px" : "20px 16px",
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: compact ? "left" : "center",
        flexDirection: compact ? "row" : "column" }}>
        <div style={{ fontSize: iconSize, flexShrink: 0 }}>{level.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: compact ? 14 : 22, fontWeight: 900,
            color: level.color, letterSpacing: "0.15em" }}>{level.name}</div>
          {!compact && (
            <>
              <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4, letterSpacing: "0.1em" }}>
                {level.subtitle}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>
                "{level.description}"
              </div>
            </>
          )}
          {compact && (
            <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 2 }}>{level.subtitle}</div>
          )}
        </div>
      </div>

      {/* Standards — shown when showStandards=true */}
      {showStandards && standards && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${level.color}55`, paddingTop: 12 }}>
          <div style={{ fontSize: 10, color: level.color, letterSpacing: "0.2em",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 10 }}>STANDARDS</div>
          {Object.entries(standards).map(([pillar, s]) => (
            <div key={pillar} style={{ display: "flex", gap: 10, marginBottom: 8,
              paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 52, fontSize: 10, color: level.color,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                letterSpacing: "0.06em", flexShrink: 0, paddingTop: 2, textTransform: "uppercase" }}>
                {PILLAR_LABELS[pillar] || pillar}
              </div>
              <div style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
          {level.engineOptions && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg3)",
              borderRadius: 6, borderLeft: `3px solid ${level.color}` }}>
              <div style={{ fontSize: 10, color: level.color, letterSpacing: "0.15em",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 8 }}>ENGINE — CHOOSE ONE</div>
              {level.engineOptions.map((opt, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--white)", marginBottom: 5, lineHeight: 1.4 }}>
                  {i + 1}. {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isCurrentLevel && (
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9,
          background: level.color, color: "#fff", padding: "2px 8px",
          borderRadius: 3, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
          YOU ARE HERE
        </div>
      )}
    </div>
  );
}

function DomSilyPathScreen({ user, authUser }) {
  const [gender, setGender] = useState(user?.gender || "men");
  const [bodyweight, setBodyweight] = useState(user?.bodyweight || 80);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [testVals, setTestVals] = useState({
    pushups: 0, inverted_rows: 0, kb_swing_test: 0, goblet_test: 0,
    farmers_carry: 0, tgu_test: 0, kb_press_test: 0, swing_100_test: 0,
    snatch_test_kg: 0, front_squat: 0, ohs: 0, weighted_pullup_kg: 0,
    dbl_kb_press_test: 0, gladiator_engine: false,
  });

  // Load test results from DB on mount
  useEffect(() => {
    if (!authUser) return;
    supabase.from("profiles").select(
      "gender, bodyweight, pushups, inverted_rows, kb_swing_test, goblet_test, farmers_carry, tgu_test, kb_press_test, swing_100_test, snatch_test_kg, front_squat_test, ohs_test, weighted_pullup_kg, dbl_kb_press_test, gladiator_engine"
    ).eq("id", authUser.id).single().then(({ data }) => {
      if (!data) return;
      if (data.gender) setGender(data.gender);
      if (data.bodyweight) setBodyweight(data.bodyweight);
      setTestVals({
        pushups:            data.pushups            || 0,
        inverted_rows:      data.inverted_rows       || 0,
        kb_swing_test:      data.kb_swing_test       || 0,
        goblet_test:        data.goblet_test          || 0,
        farmers_carry:      data.farmers_carry        || 0,
        tgu_test:           data.tgu_test             || 0,
        kb_press_test:      data.kb_press_test        || 0,
        swing_100_test:     data.swing_100_test       || 0,
        snatch_test_kg:     data.snatch_test_kg       || 0,
        front_squat:        data.front_squat_test     || 0,
        ohs:                data.ohs_test             || 0,
        weighted_pullup_kg: data.weighted_pullup_kg   || 0,
        dbl_kb_press_test:  data.dbl_kb_press_test    || 0,
        gladiator_engine:   data.gladiator_engine     || false,
      });
    });
  }, [authUser]);
  const [savingTests, setSavingTests] = useState(false);
  const [testsSaved, setTestsSaved] = useState(false);
  const [testError, setTestError] = useState("");

  // Merge testVals back into user-like object for level computation
  const computedUser = {
    ...user,
    ...testVals,
    oneRM: { ...(user?.oneRM || {}), front_squat: testVals.front_squat, ohs: testVals.ohs },
  };

  const saveTests = async () => {
    setSavingTests(true); setTestError(""); setTestsSaved(false);
    try {
      const updates = {
        pushups:            testVals.pushups,
        inverted_rows:      testVals.inverted_rows,
        kb_swing_test:      testVals.kb_swing_test,
        goblet_test:        testVals.goblet_test,
        farmers_carry:      testVals.farmers_carry,
        tgu_test:           testVals.tgu_test,
        kb_press_test:      testVals.kb_press_test,
        swing_100_test:     testVals.swing_100_test,
        snatch_test_kg:     testVals.snatch_test_kg,
        front_squat_test:   testVals.front_squat,
        ohs_test:           testVals.ohs,
        weighted_pullup_kg: testVals.weighted_pullup_kg,
        dbl_kb_press_test:  testVals.dbl_kb_press_test,
        gladiator_engine:   testVals.gladiator_engine,
        bodyweight:         bodyweight,
        gender:             gender,
      };
      const { error } = await supabase.from("profiles").update(updates).eq("id", authUser.id);
      if (error) {
        // Jeśli brakuje kolumn w tabeli profiles — zapisz co się da, pomiń brakujące
        if (error.message?.includes("column") || error.code === "42703") {
          const safeUpdates = { bodyweight: updates.bodyweight, gender: updates.gender };
          await supabase.from("profiles").update(safeUpdates).eq("id", authUser.id);
          setTestError("⚠ Niektóre kolumny testów nie istnieją w bazie. Uruchom SQL migration — szczegóły w README.");
          setTestsSaved(true);
          setTimeout(() => setTestsSaved(false), 4000);
          setSavingTests(false);
          return;
        }
        throw error;
      }
      setTestsSaved(true);
      setTimeout(() => setTestsSaved(false), 2000);
    } catch(e) { setTestError(e.message || "Save failed"); }
    setSavingTests(false);
  };

  const currentLevel = getDomSilyLevel(computedUser, bodyweight, gender);
  const currentRank = currentLevel ? currentLevel.rank : 0;
  const nextGaps = getNextLevelGaps(computedUser, bodyweight, currentRank, gender);
  const progressPct = currentRank > 0
    ? Math.round((currentRank / 6) * 100)
    : nextGaps
      ? Math.round((nextGaps.gaps.filter(g => g.passed).length / nextGaps.gaps.length) * 50)
      : 0;

  // Test fields definition for the form
  const testFields = [
    { key: "pushups",          label: "Push Ups (max reps)",            unit: "reps", type: "number" },
    { key: "inverted_rows",    label: "Inverted Rows (max reps)",       unit: "reps", type: "number" },
    { key: "kb_swing_test",    label: "KB Swing — heaviest bell used",  unit: "kg",   type: "number" },
    { key: "goblet_test",      label: "Goblet Squat — heaviest bell",   unit: "kg",   type: "number" },
    { key: "farmers_carry",    label: "Farmer Walk — per hand",         unit: "kg",   type: "number" },
    { key: "tgu_test",         label: "TGU — heaviest bell (quality)",  unit: "kg",   type: "number" },
    { key: "kb_press_test",    label: "KB Press — heaviest bell / side",unit: "kg",   type: "number" },
    { key: "swing_100_test",   label: "100 One-Hand Swings — bell",     unit: "kg",   type: "number" },
    { key: "snatch_test_kg",   label: "Snatch Test (100 reps / 5min) — bell", unit: "kg", type: "number" },
    { key: "front_squat",      label: "Front Squat 1RM",                unit: "kg",   type: "number" },
    { key: "weighted_pullup_kg",label:"Weighted Pull Up — added weight", unit: "kg",   type: "number" },
    { key: "dbl_kb_press_test",label: "Double KB Press — combined weight", unit: "kg", type: "number" },
    { key: "gladiator_engine", label: "Gladiator Engine test completed", unit: "",    type: "bool" },
  ];

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.3em",
          color: "var(--accent)", marginBottom: 8 }}>DOM SIŁY</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28,
          fontWeight: 900, letterSpacing: "0.05em" }}>YOUR PATH</div>
        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>
          FERRUM · SANGUIS · GLORIA
        </div>
      </div>

      {/* Gender + BW selector */}
      <div style={{ ...s.card, padding: "12px 14px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {["men", "women"].map(g => (
            <button key={g} onClick={() => setGender(g)} style={{
              flex: 1, ...s.btnGhost, fontSize: 12, padding: "8px",
              borderColor: gender === g ? "var(--accent)" : "var(--border)",
              color: gender === g ? "var(--accent)" : "var(--gray)",
              background: gender === g ? "rgba(232,213,160,0.08)" : "transparent",
            }}>{g === "men" ? "MEN" : "WOMEN"}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--gray)", letterSpacing: "0.1em", flexShrink: 0 }}>BODYWEIGHT</span>
          <input type="number" value={bodyweight}
            onChange={e => setBodyweight(Number(e.target.value))}
            style={{ ...s.input, width: 80, textAlign: "center", padding: "8px" }} />
          <span style={{ fontSize: 11, color: "var(--gray2)" }}>kg</span>
        </div>
      </div>

      {/* Current Level Card */}
      {currentLevel ? (
        <LevelCard level={currentLevel} isCurrentLevel={true} />
      ) : (
        <div style={{ ...s.card, textAlign: "center", padding: "24px 16px",
          borderColor: DOM_SILY_LEVELS[0].color + "44" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔰</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 900,
            color: "var(--gray)", letterSpacing: "0.1em" }}>NOT YET RANKED</div>
          <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 8 }}>
            Complete the tests below to earn your first rank
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ margin: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em" }}>ADEPT</span>
          <span style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em" }}>GLADIATOR</span>
        </div>
        <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${currentLevel?.color || "#6B7280"}, var(--accent))`,
            borderRadius: 3, transition: "width 0.5s ease" }} />
        </div>
        {/* Level markers */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {DOM_SILY_LEVELS.map((l, i) => (
            <div key={l.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: currentRank >= l.rank ? l.color : "var(--bg3)",
                border: `1px solid ${l.color}` }} />
              <div style={{ fontSize: 7, color: currentRank >= l.rank ? l.color : "var(--gray2)",
                fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
                {l.name.slice(0,3)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Level Requirements */}
      {nextGaps && (
        <div style={{ marginBottom: 16 }}>
          <div style={s.sectionLabel}>
            NEXT LEVEL — {nextGaps.level.name}
          </div>
          <div style={{ ...s.card, borderColor: nextGaps.level.color + "44",
            background: nextGaps.level.color + "08" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>{nextGaps.level.icon}</span>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 900,
                  color: nextGaps.level.color }}>{nextGaps.level.name}</div>
                <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{nextGaps.level.subtitle}</div>
              </div>
            </div>
            {nextGaps.gaps.map(({ pillar, label, passed }) => (
              <div key={pillar} style={{ display: "flex", alignItems: "flex-start", gap: 10,
                padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  background: passed ? "var(--red)" : "var(--bg3)",
                  border: `1px solid ${passed ? "var(--red)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff" }}>
                  {passed ? "✓" : ""}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em",
                    textTransform: "uppercase", marginBottom: 2 }}>{pillar}</div>
                  <div style={{ fontSize: 13, color: passed ? "var(--gray2)" : "var(--text)",
                    textDecoration: passed ? "line-through" : "none", lineHeight: 1.3 }}>{label}</div>
                </div>
              </div>
            ))}
            {nextGaps.level.engineOptions && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg3)",
                borderRadius: 4, borderLeft: "2px solid var(--accent)" }}>
                <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em",
                  marginBottom: 8, fontFamily: "'Cinzel', serif" }}>ENGINE — CHOOSE ONE</div>
                {nextGaps.level.engineOptions.map((opt, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--gray)", marginBottom: 4 }}>
                    {i + 1}. {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Path */}
      <button onClick={() => setShowAllLevels(v => !v)}
        style={{ ...s.btnGhost, fontSize: 12, marginBottom: 12 }}>
        {showAllLevels ? "▲ HIDE FULL PATH" : "▼ VIEW FULL PATH — ADEPT TO GLADIATOR"}
      </button>

      {showAllLevels && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[...DOM_SILY_LEVELS].reverse().map(level => (
            <div key={level.id}>
              <LevelCard
                level={level}
                isCurrentLevel={level.rank === currentRank}
                compact={false}
                showStandards={true}
                gender={gender}
              />
              {level.rank > 1 && (
                <div style={{ textAlign: "center", color: "var(--gray2)", fontSize: 16, margin: "2px 0" }}>↑</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* UPDATE TEST RESULTS */}
      <button onClick={() => setShowTests(v => !v)}
        style={{ ...s.btnGhost, marginBottom: 10, fontSize: 12,
          borderColor: showTests ? "var(--accent)" : "var(--border)",
          color: showTests ? "var(--accent)" : "var(--gray)" }}>
        {showTests ? "▲ HIDE" : "📊 UPDATE MY TEST RESULTS"}
      </button>

      {showTests && (
        <div style={{ ...s.card, borderColor: "rgba(232,213,160,0.3)", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--accent)",
            letterSpacing: "0.2em", marginBottom: 14 }}>MY TEST RESULTS</div>
          <div style={{ fontSize: 11, color: "var(--gray2)", marginBottom: 14, lineHeight: 1.5 }}>
            Enter your best results. The checklist above updates automatically.
            Enter the heaviest weight you've actually completed the standard with.
          </div>
          {testFields.map(({ key, label, unit, type }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
              paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, fontSize: 12, color: "var(--gray)", lineHeight: 1.3 }}>{label}</div>
              {type === "bool" ? (
                <div onClick={() => setTestVals(v => ({ ...v, [key]: !v[key] }))}
                  style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                    background: testVals[key] ? "var(--red)" : "var(--bg3)",
                    border: `1px solid ${testVals[key] ? "var(--red)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: "#fff" }}>
                  {testVals[key] ? "✓" : ""}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" min="0" value={testVals[key] || ""}
                    onChange={e => setTestVals(v => ({ ...v, [key]: Number(e.target.value) }))}
                    style={{ ...s.input, width: 64, textAlign: "center", padding: "8px 4px",
                      marginBottom: 0, fontSize: 15, fontWeight: 700 }} />
                  {unit && <span style={{ fontSize: 11, color: "var(--gray2)", flexShrink: 0 }}>{unit}</span>}
                </div>
              )}
            </div>
          ))}
          {testError && (
            <div style={{ fontSize: 11, color: "var(--red-dim)", marginBottom: 8,
              background: "rgba(196,30,30,0.1)", padding: "6px 10px", borderRadius: 4 }}>
              ⚠ {testError}
            </div>
          )}
          <button onClick={saveTests} disabled={savingTests}
            style={{ ...s.btn, opacity: savingTests ? 0.6 : 1 }}>
            {testsSaved ? "✓ SAVED" : savingTests ? "SAVING..." : "SAVE TEST RESULTS"}
          </button>
        </div>
      )}

      {/* CLAIM LEVEL button */}
      {nextGaps && (
        <button onClick={() => setShowClaim(true)}
          style={{ ...s.btn, background: nextGaps.level.color, marginBottom: 16,
            fontFamily: "'Cinzel', serif", letterSpacing: "0.15em" }}>
          {nextGaps.level.icon} CLAIM {nextGaps.level.name}
        </button>
      )}
      {currentRank === 6 && (
        <div style={{ ...s.card, textAlign: "center", padding: 20,
          borderColor: "#4A0000", background: "rgba(74,0,0,0.1)" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🏛️</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#C0392B" }}>
            GLADIATOR — ELITE OF THE HOUSE OF STRENGTH
          </div>
        </div>
      )}

      {/* COMMUNITY FEED */}
      <div style={s.sectionLabel}>HALL OF STRENGTH</div>
      <div style={s.card}>
        <CommunityFeed authUser={authUser} compact={true} />
      </div>

      <div style={{ textAlign: "center", padding: "20px 0", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.2em",
          fontFamily: "'Cinzel', serif" }}>FERRUM · SANGUIS · GLORIA</div>
        <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 6 }}>
          Inspired by strength standards from the tradition of Dan John & Pavel Tsatsouline
        </div>
      </div>

      {showClaim && nextGaps && (
        <ClaimLevelModal
          level={nextGaps.level}
          authUser={authUser}
          onClose={() => setShowClaim(false)}
          onSuccess={() => { setShowClaim(false); }}
        />
      )}
    </div>
  );
}


export function HallOfStrengthWidget() {
  const [recentAch, setRecentAch] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: achs } = await supabase
          .from("level_achievements").select("*")
          .eq("status", "approved")
          .order("approved_at", { ascending: false }).limit(3);
        if (!achs || !achs.length) return;
        const ids = [...new Set(achs.map(a => a.user_id))];
        const { data: profs } = await supabase.from("profiles").select("id, name").in("id", ids);
        const nameMap = {};
        (profs || []).forEach(p => { nameMap[p.id] = p.name; });
        setRecentAch(achs.map(a => ({ ...a, profiles: { name: nameMap[a.user_id] || null } })));
      } catch(e) {}
    };
    load();
  }, []);

  if (!recentAch.length) return null;

  return (
    <div style={{ ...s.card, marginBottom: 16, borderColor: "rgba(184,134,11,0.3)",
      background: "rgba(184,134,11,0.04)" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--accent)",
        letterSpacing: "0.2em", marginBottom: 10 }}>HALL OF STRENGTH</div>
      {recentAch.map(a => {
        const level = DOM_SILY_LEVELS.find(l => l.id === a.level_id);
        if (!level) return null;
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8,
            paddingBottom: 6, marginBottom: 6, borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 16 }}>{level.icon}</span>
            <div style={{ flex: 1, fontSize: 12 }}>
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                {a.profiles?.name || "Athlete"}
              </span>
              {" → "}
              <span style={{ fontFamily: "'Cinzel', serif", color: level.color,
                fontSize: 11 }}>{level.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export function CommunityFeed({ authUser, compact = false }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: achs } = await supabase
          .from("level_achievements").select("*")
          .eq("status", "approved")
          .order("approved_at", { ascending: false })
          .limit(compact ? 5 : 30);
        if (achs && achs.length) {
          const ids = [...new Set(achs.map(a => a.user_id))];
          const { data: profs } = await supabase.from("profiles").select("id, name").in("id", ids);
          const nameMap = {};
          (profs || []).forEach(p => { nameMap[p.id] = p.name; });
          setAchievements(achs.map(a => ({ ...a, profiles: { name: nameMap[a.user_id] || null } })));
        } else {
          setAchievements([]);
        }
      } catch(e) {}
      setLoading(false);
    };
    load();

    // Realtime subscription
    const sub = supabase
      .channel("achievements_feed")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "level_achievements",
        filter: "status=eq.approved"
      }, () => load())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [compact]);

  const levelMeta = (id) => DOM_SILY_LEVELS.find(l => l.id === id);
  const timeAgo = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (d < 60) return "just now";
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`;
    return `${Math.floor(d/86400)}d ago`;
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 20, color: "var(--gray2)", fontSize: 13 }}>
      Loading...
    </div>
  );
  if (!achievements.length) return (
    <div style={{ ...s?.card, textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🏛️</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900 }}>
        NO ACHIEVEMENTS YET
      </div>
      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 6 }}>
        Be the first to claim your rank
      </div>
    </div>
  );

  return (
    <div>
      {achievements.map(a => {
        const lv = levelMeta(a.level_id);
        if (!lv) return null;
        const isOwn = a.user_id === authUser?.id;
        return (
          <div key={a.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 0", borderBottom: "1px solid var(--border)"
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: lv.color + "22", border: `2px solid ${lv.color}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
            }}>{lv.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                <span style={{ color: "var(--accent)" }}>
                  {isOwn ? "You" : (a.profiles?.name || "Athlete")}
                </span>
                {" "}unlocked
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 900,
                color: lv.color, letterSpacing: "0.1em" }}>{lv.name}</div>
              <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>{lv.subtitle}</div>
            </div>
            <div style={{ fontSize: 10, color: "var(--gray2)", flexShrink: 0 }}>
              {timeAgo(a.approved_at)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClaimLevelModal({ level, authUser, onClose, onSuccess }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("level_achievements").insert({
        user_id: authUser.id,
        level_id: level.id,
        level_rank: level.rank,
        status: "pending",
        video_url: videoUrl || null,
        note: note || null,
      });
      if (!error) {
        // Notify coach
        sendPushToUser(
          "a6efb4f6-a5aa-4829-89c3-adb486cf187c",
          `🏆 Level claim: ${level.name}`,
          `An athlete is claiming ${level.name} — review in Coach panel`,
          "achievement", "/"
        );
        setSubmitted(true);
        setTimeout(() => { onSuccess(); onClose(); }, 1800);
      }
    } catch(e) {}
    setSubmitting(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg2)", borderRadius: "12px 12px 0 0", padding: 24,
        width: "100%", maxWidth: 480
      }} onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: "var(--accent)" }}>
              CLAIM SUBMITTED
            </div>
            <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 8 }}>
              Coach will review and approve your {level.name} rank
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 36 }}>{level.icon}</div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 900,
                  color: level.color }}>CLAIM {level.name}</div>
                <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>{level.subtitle}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 16, lineHeight: 1.5,
              background: "var(--bg3)", padding: "10px 12px", borderRadius: 6,
              borderLeft: "2px solid var(--accent)" }}>
              Submit a video link or confirm you completed all tests in the presence of Coach Karlito.
              Your claim will be reviewed before the rank is officially awarded.
            </div>

            <label style={s?.label}>VIDEO LINK (YouTube / Google Drive / optional)</label>
            <input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://..."
              style={{ ...s?.input, marginBottom: 12 }}
            />

            <label style={s?.label}>NOTE (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Done in person at training on 10 March..."
              rows={2}
              style={{ ...s?.input, resize: "none", marginBottom: 16 }}
            />

            <button onClick={submit} disabled={submitting}
              style={{ ...s?.btn, opacity: submitting ? 0.6 : 1, marginBottom: 10,
                background: level.color }}>
              {submitting ? "SUBMITTING..." : `CLAIM ${level.name} →`}
            </button>
            <button onClick={onClose} style={{ ...s?.btnGhost, fontSize: 13 }}>CANCEL</button>
          </>
        )}
      </div>
    </div>
  );
}


export function RanksCoachView({ athletes }) {
  const COACH_ID = "a6efb4f6-a5aa-4829-89c3-adb486cf187c";
  const [subview, setSubview] = useState("pending"); // pending | manual | feed
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personAchievements, setPersonAchievements] = useState([]);
  const [loadingPerson, setLoadingPerson] = useState(false);
  const [awardingLevel, setAwardingLevel] = useState(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const { data: achs } = await supabase
        .from("level_achievements").select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (achs && achs.length) {
        const ids = [...new Set(achs.map(a => a.user_id))];
        const { data: profs } = await supabase.from("profiles").select("id, name, email").in("id", ids);
        const profMap = {};
        (profs || []).forEach(p => { profMap[p.id] = p; });
        setPending(achs.map(a => ({ ...a, profiles: profMap[a.user_id] || null })));
      } else {
        setPending([]);
      }
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { loadPending(); }, []);

  const loadPersonAchievements = async (userId) => {
    setLoadingPerson(true);
    try {
      const { data } = await supabase
        .from("level_achievements")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved");
      setPersonAchievements(data || []);
    } catch(e) { setPersonAchievements([]); }
    setLoadingPerson(false);
  };

  const decide = async (id, userId, levelId, levelRank, approve) => {
    setProcessing(id);
    try {
      await supabase.from("level_achievements").update({
        status: approve ? "approved" : "rejected",
        approved_by: COACH_ID,
        approved_at: approve ? new Date().toISOString() : null,
      }).eq("id", id);
      if (approve) {
        const lv = DOM_SILY_LEVELS.find(l => l.id === levelId);
        const claim = pending.find(a => a.id === id);
        const name = claim?.profiles?.name || "An athlete";
        sendPushToUser(userId, `🏆 Rank approved: ${lv?.name}!`,
          `Coach Karlito confirmed your ${lv?.name} rank. Keep going!`, "achievement", "/");
        sendPushToAllUsers(`🏛️ ${name} reached ${lv?.name}!`,
          `${name} just earned the ${lv?.name} rank at House of Strength`, "achievement", "/");
      }
      await loadPending();
    } catch(e) {}
    setProcessing(null);
  };

  const [awardError, setAwardError] = useState("");

  const manualAward = async (userId, userName, levelId, levelRank, revoke) => {
    setAwardingLevel(levelId); setAwardError("");
    try {
      if (revoke) {
        const { error } = await supabase.from("level_achievements")
          .delete().eq("user_id", userId).eq("level_id", levelId).eq("status", "approved");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("level_achievements").insert({
          user_id: userId, level_id: levelId, level_rank: levelRank,
          status: "approved", approved_by: COACH_ID,
          approved_at: new Date().toISOString(), note: "Awarded by coach",
        });
        if (error) throw error;
        const lv = DOM_SILY_LEVELS.find(l => l.id === levelId);
        sendPushToUser(userId, `🏆 ${lv?.name} awarded by Coach Karlito!`,
          `Your ${lv?.name} rank has been officially confirmed.`, "achievement", "/");
        if (userId !== COACH_ID) {
          sendPushToAllUsers(`🏛️ ${userName} reached ${lv?.name}!`,
            `${userName} just earned the ${lv?.name} rank at House of Strength`, "achievement", "/");
        }
      }
      await loadPersonAchievements(userId);
    } catch(e) {
      setAwardError(e.message || "Error — check if level_achievements table exists in Supabase");
    }
    setAwardingLevel(null);
  };

  const allPeople = [
    { id: COACH_ID, name: "👑 Karlito (you)" },
    ...(athletes || []).map(a => ({
      id: a.id,
      name: a.profiles?.name || a.name || a.email?.split("@")[0] || "Athlete"
    }))
  ];

  if (loading) return <div style={{ textAlign: "center", padding: 30, color: "var(--gray2)" }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["pending", `⏳ CLAIMS${pending.length > 0 ? ` (${pending.length})` : ""}`],
          ["manual", "⚔️ AWARD"],
          ["feed", "🏛️ FEED"]].map(([v, label]) => (
          <button key={v} onClick={() => { setSubview(v); setSelectedPerson(null); }}
            style={{ flex: 1, ...s.btnGhost, fontSize: 11, padding: "9px 4px",
              borderColor: subview === v ? "var(--accent)" : "var(--border)",
              color: subview === v ? "var(--accent)" : "var(--gray)",
              background: subview === v ? "rgba(232,213,160,0.08)" : "transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {subview === "pending" && (
        <div>
          <div style={s.sectionLabel}>PENDING CLAIMS</div>
          {pending.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 13, color: "var(--gray2)" }}>No pending claims</div>
            </div>
          ) : pending.map(a => {
            const lv = DOM_SILY_LEVELS.find(l => l.id === a.level_id);
            if (!lv) return null;
            return (
              <div key={a.id} style={{ ...s.card, borderColor: lv.color + "44", background: lv.color + "08", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 28 }}>{lv.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700 }}>
                      {a.profiles?.name || a.profiles?.email?.split("@")[0] || "Athlete"}
                    </div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: lv.color, letterSpacing: "0.1em" }}>{lv.name}</div>
                    <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                {a.video_url && (
                  <a href={a.video_url} target="_blank" rel="noreferrer"
                    style={{ display: "block", fontSize: 12, color: "var(--accent)", marginBottom: 8, textDecoration: "underline" }}>
                    🎥 View video
                  </a>
                )}
                {a.note && (
                  <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 10,
                    background: "var(--bg3)", padding: "8px 10px", borderRadius: 4, borderLeft: "2px solid var(--accent)" }}>
                    "{a.note}"
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => decide(a.id, a.user_id, a.level_id, a.level_rank, true)}
                    disabled={processing === a.id}
                    style={{ ...s.btn, flex: 1, background: lv.color, fontSize: 13, opacity: processing === a.id ? 0.6 : 1 }}>
                    ✓ APPROVE
                  </button>
                  <button onClick={() => decide(a.id, a.user_id, a.level_id, a.level_rank, false)}
                    disabled={processing === a.id}
                    style={{ ...s.btnGhost, flex: 1, fontSize: 13, color: "var(--red-dim)", borderColor: "var(--red-dim)" }}>
                    ✗ REJECT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subview === "manual" && (
        <div>
          {!selectedPerson ? (
            <div>
              <div style={s.sectionLabel}>SELECT PERSON</div>
              <div style={s.card}>
                {allPeople.map(p => (
                  <div key={p.id} onClick={() => { setSelectedPerson(p); loadPersonAchievements(p.id); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--accent)" }}>SET RANKS →</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setSelectedPerson(null); setAwardError(""); }}
                  style={{ ...s.btnGhost, width: "auto", padding: "6px 14px", fontSize: 12 }}>← BACK</button>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>
                  {selectedPerson.name}
                </div>
              </div>
              {awardError && (
                <div style={{ fontSize: 12, color: "var(--red-dim)", marginBottom: 12,
                  background: "rgba(196,30,30,0.1)", padding: "10px 12px", borderRadius: 6,
                  borderLeft: "2px solid var(--red-dim)" }}>
                  ❌ {awardError}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--gray2)", marginBottom: 14, padding: "8px 12px",
                background: "var(--bg3)", borderRadius: 6, borderLeft: "2px solid var(--accent)" }}>
                Tap a rank to AWARD or REVOKE it. Push notification sent on award.
              </div>
              {loadingPerson ? (
                <div style={{ textAlign: "center", padding: 20, color: "var(--gray2)" }}>Loading...</div>
              ) : DOM_SILY_LEVELS.map(lv => {
                const hasIt = personAchievements.some(a => a.level_id === lv.id);
                const isProcessing = awardingLevel === lv.id;
                return (
                  <div key={lv.id} style={{ ...s.card, borderColor: hasIt ? lv.color : "var(--border)",
                    background: hasIt ? lv.color + "14" : "var(--bg2)",
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 26, flexShrink: 0 }}>{lv.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 900,
                        color: hasIt ? lv.color : "var(--gray)", letterSpacing: "0.1em" }}>{lv.name}</div>
                      <div style={{ fontSize: 10, color: "var(--gray2)" }}>{lv.subtitle}</div>
                    </div>
                    <button
                      onClick={() => manualAward(selectedPerson.id, selectedPerson.name, lv.id, lv.rank, hasIt)}
                      disabled={isProcessing}
                      style={{
                        flexShrink: 0, minWidth: 72, textAlign: "center",
                        background: hasIt ? "transparent" : lv.color,
                        color: hasIt ? "var(--red-dim)" : "#fff",
                        border: hasIt ? "1px solid var(--red-dim)" : "none",
                        borderRadius: 6, padding: "8px 10px",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                        cursor: "pointer", opacity: isProcessing ? 0.4 : 1,
                      }}>
                      {isProcessing ? "..." : hasIt ? "REVOKE" : "AWARD"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subview === "feed" && (
        <div>
          <div style={s.sectionLabel}>HALL OF STRENGTH — ALL TIME</div>
          <div style={s.card}>
            <CommunityFeed authUser={{ id: COACH_ID }} compact={false} />
          </div>
        </div>
      )}
    </div>
  );
}



const s = {
  app: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", maxWidth: 480, margin: "0 auto", padding: "0 0 80px 0", position: "relative" },
  header: { padding: "20px 20px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg)" },
  logo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: "0.1em", color: "var(--white)", lineHeight: 1 },
  logoRed: { color: "var(--gold)" },
  tagline: { fontSize: 10, letterSpacing: "0.28em", color: "var(--gold)", marginTop: 5, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", opacity: 0.65 },
  screen: { padding: "20px 20px", animation: "fadeIn 0.3s ease" },
  sectionLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.25em", color: "var(--gray)", textTransform: "uppercase", marginBottom: 12 },
  card: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 12, position: "relative", overflow: "hidden" },
  bigNum: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 56, fontWeight: 900, lineHeight: 1, color: "var(--white)" },
  redLine: { width: 32, height: 2, background: "linear-gradient(90deg, var(--gold), transparent)", marginBottom: 8 },
  btn: { background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, padding: "14px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnGold: { background: "var(--gold)", color: "#111", border: "none", borderRadius: 8, padding: "14px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnGhost: { background: "transparent", color: "var(--gray)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 20px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", width: "100%", transition: "border-color 0.2s" },
  input: { background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "13px 14px", color: "var(--white)", fontSize: 15, width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none", lineHeight: 1.4 },
  label: { fontSize: 11, color: "var(--gray)", marginBottom: 6, letterSpacing: "0.1em", display: "block", textTransform: "uppercase", fontWeight: 600 },
  pill: (active, color = "var(--gold)") => ({ display: "inline-block", padding: "7px 14px", borderRadius: 6, border: `1px solid ${active ? color : "var(--border)"}`, background: active ? `rgba(201,168,76,0.15)` : "var(--bg3)", color: active ? color : "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s" }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "var(--bg2)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 0 14px" },
  navItem: (active) => ({ flex: 1, textAlign: "center", padding: "6px 2px", cursor: "pointer", opacity: active ? 1 : 0.35, transition: "opacity 0.2s" }),
  navLabel: { fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3, color: "var(--white)" },
  exerciseRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid var(--border)" },
  badge: (color) => ({ background: color || "var(--red)", padding: "2px 8px", borderRadius: 4, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#fff" }),
  phaseBar: (color) => ({ height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: 2, marginBottom: 20 }),
  progressBar: (pct, color) => ({ height: "100%", width: `${pct}%`, background: color || "var(--red)", borderRadius: 2, transition: "width 0.5s ease" }),
};
