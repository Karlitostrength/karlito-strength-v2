import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";
import { DOM_SILY_LEVELS, getDomSilyLevel, getNextLevelGaps } from "../constants/levels";
import { LevelCard, ClaimLevelModal, CommunityFeed } from "../components/RankComponents";
import { sendPushToUser } from "../lib/push";

export function DomSilyPathScreen({ user, authUser }) {
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
