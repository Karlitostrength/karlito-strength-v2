import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { generateWorkout, ACCESSORIES } from "../engine/workout";
import { PHASES } from "../constants/phases";
import { Row, EMOMTimer, SetRow, ReadinessWidget } from "../components/SmallComponents";


export function WorkoutScreen({ user, week, dayKey, authUser, onComplete, hasCoach }) {
  const [coachProgram, setCoachProgram]   = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [exResults, setExResults]         = useState({}); // { idx: { result: string, done: bool } }
  const [prevWorkouts, setPrevWorkouts]   = useState([]); // last 4 sessions same day
  const [libraryMap, setLibraryMap]       = useState({}); // { name: youtube_url }
  const [expandedHistory, setExpandedHistory] = useState({}); // { idx: bool }
  const [athleteComment, setAthleteComment] = useState("");
  const [videoLink, setVideoLink]         = useState("");
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [showTimer, setShowTimer]         = useState(false);
  const [condDone, setCondDone]           = useState({});
  const [accDone, setAccDone]             = useState({});

  useEffect(() => {
    const load = async () => {
      if (!authUser) { setLoadingProgram(false); return; }
      // Load coach program — own try/catch so library errors don't block workout
      try {
        const { data: days } = await supabase.from("program_days").select("*")
          .eq("athlete_id", authUser.id).eq("week", week).eq("day", dayKey);
        const day = days && days.length > 0 ? days[0] : null;
        if (day) {
          const { data: exs } = await supabase.from("custom_exercises").select("*")
            .eq("athlete_id", authUser.id).eq("week", week).eq("day", dayKey);
          setCoachProgram({ ...day, exercises: exs || [] });
        }
      } catch(e) { console.error("WorkoutScreen load error:", e); }

      // Previous workouts — non-critical
      try {
        const { data: prev } = await supabase.from("workouts").select("*")
          .eq("user_id", authUser.id).eq("day", dayKey)
          .order("created_at", { ascending: false }).limit(4);
        setPrevWorkouts(prev || []);
      } catch(e) {}

      // Exercise library — non-critical
      try {
        const { data: lib } = await supabase.from("exercise_library").select("name, youtube_url");
        const map = {};
        (lib || []).forEach(e => { map[e.name] = e.youtube_url; });
        setLibraryMap(map);
      } catch(e) {}
      setLoadingProgram(false);
    };
    load();
  }, [authUser, week, dayKey]);

  // Init exResults when coachProgram loads
  useEffect(() => {
    if (!coachProgram) return;
    const init = {};
    (coachProgram.exercises || []).forEach((ex, i) => {
      init[i] = { result: "", done: false };
    });
    setExResults(init);
  }, [coachProgram]);

  const defaultWorkout = generateWorkout(dayKey, week, user?.level, user?.oneRM, user?.injuries);
  // Zbierz ćwiczenia z pierwszej sekcji siłowej defaultWorkout (fallback)
  const defaultStrengthExercises = defaultWorkout?.sections
    ?.find(s => s.title?.startsWith("SIŁA") || s.title === "STRENGTH")?.exercises || [];

  const workout = coachProgram ? {
    title: `DAY ${dayKey} — ${coachProgram.title?.toUpperCase() || "COACH PROGRAM"}`,
    // Jeśli coachProgram istnieje ale nie ma ćwiczeń → użyj auto-generated jako fallback
    exercises: (coachProgram.exercises && coachProgram.exercises.length > 0)
      ? coachProgram.exercises
      : defaultStrengthExercises,
    notes: coachProgram.notes || (coachProgram.exercises?.length === 0
      ? "⚠ Brak ćwiczeń w bazie dla tego dnia — wyświetlam program automatyczny."
      : ""),
  } : {
    title: defaultWorkout?.title || `DAY ${dayKey}`,
    exercises: defaultStrengthExercises,
    notes: (authUser && hasCoach) ? "⚠ No program assigned for this day — showing default workout." : "",
  };

  if (loadingProgram) return (
    <div style={s.screen}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--gray)", fontSize: 13, letterSpacing: "0.1em" }}>LOADING...</div>
    </div>
  );

  if (!workout) return (
    <div style={s.screen}>
      <div style={{ ...s.card, textAlign: "center", padding: 32, borderColor: "var(--red-dim)" }}>
        <div style={{ fontSize: 24 }}>⏳</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginTop: 8 }}>AWAITING YOUR PROGRAM</div>
        <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6 }}>Your coach hasn't assigned this week yet. Check back soon!</div>
      </div>
    </div>
  );

  const saveWorkout = async () => {
    setSaving(true);
    const exercises = workout.exercises.map((ex, i) => ({
      name: ex.name,
      planned: { sets: ex.sets, reps: ex.reps, weight: ex.weight },
      result: exResults[i]?.result || "",
      done: exResults[i]?.done || false,
    }));
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (au) {
        await supabase.from("workouts").insert({
          user_id: au.id,
          week, day: dayKey,
          workout_title: workout.title,
          exercises,
          comment: athleteComment,
          video_link: videoLink,
        });
      }
    } catch(e) { console.log("Save error:", e); }
    setSaving(false);
    setSaved(true);
  };

  const phaseData = PHASES[getPhase(week)];
  const doneCount = Object.values(exResults).filter(r => r.done).length;
  const totalExs = workout.exercises.length;

  if (showTimer) {
    const swing = getSwingProtocol(week);
    return <EMOMTimer minutes={swing.minutes} targetReps={swing.reps} kgKB={user?.kgKB}
      onDone={() => { setShowTimer(false); setCondDone(p => ({ ...p, swing: true })); }} />;
  }

  return (
    <div style={s.screen}>
      {!coachProgram && <div style={{ ...s.phaseBar(phaseData.color) }} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={s.sectionLabel}>{coachProgram ? `Week ${week}` : `Week ${week} · ${phaseData.name}`}</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900 }}>{workout.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: doneCount === totalExs && totalExs > 0 ? "var(--red)" : "var(--white)" }}>
            {doneCount}<span style={{ fontSize: 13, color: "var(--gray2)" }}>/{totalExs}</span>
          </div>
          <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em" }}>DONE</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${totalExs > 0 ? (doneCount / totalExs) * 100 : 0}%`, background: "var(--red)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      {/* Coach notes */}
      {workout.notes ? (
        <div style={{ ...s.card, borderColor: "rgba(200,160,40,0.4)", background: "rgba(200,160,40,0.05)", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 6 }}>📋 COACH NOTES</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6 }}>{workout.notes}</div>
        </div>
      ) : null}

      {/* Exercises */}
      {workout.exercises.map((ex, ei) => {
        const res = exResults[ei] || { result: "", done: false };
        const videoUrl = libraryMap[ex.name];
        const histExpanded = expandedHistory[ei];

        // Get previous results for this exercise
        const prevResults = prevWorkouts
          .map(w => {
            const found = (w.exercises || []).find(e => e.name === ex.name);
            return found ? { date: w.created_at, week: w.week, result: found.result, planned: found.planned, coach_comment: w.coach_comment } : null;
          })
          .filter(Boolean)
          .slice(0, 4);

        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        return (
          <div key={ei} style={{ ...s.card, borderColor: res.done ? "rgba(196,30,30,0.7)" : "var(--border)", marginBottom: 12, transition: "border-color 0.3s", padding: 0, overflow: "hidden" }}>

            {/* Video embed above exercise */}
            {embedUrl && (
              <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
                <iframe
                  src={embedUrl}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div style={{ padding: "12px 14px" }}>
            {/* Exercise header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: "0.04em" }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 2, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                  {ex.sets} × {ex.unit === "sec" ? `${ex.reps}sec` : ex.reps}
                  {ex.rpe ? ` · RPE ${ex.rpe}` : ex.weight ? ` @ ${ex.weight}kg` : ""}
                </div>
                {ex.notes ? (
                  <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2, fontStyle: "italic" }}>
                    {ex.notes}
                  </div>
                ) : null}
              </div>
              <div onClick={() => setExResults(p => ({ ...p, [ei]: { ...res, done: !res.done } }))}
                style={{ width: 32, height: 32, borderRadius: 6, background: res.done ? "var(--red)" : "var(--bg3)",
                  border: `1px solid ${res.done ? "var(--red)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", transition: "all 0.2s" }}>
                {res.done ? "✓" : "○"}
              </div>
            </div>

            {/* Result input */}
            <textarea
              value={res.result}
              onChange={e => setExResults(p => ({ ...p, [ei]: { ...res, result: e.target.value } }))}
              placeholder={`Result... e.g. 3×5 @ ${ex.weight || "?"}kg, RPE 8, felt strong`}
              rows={2}
              style={{ ...s.input, resize: "none", fontSize: 13, lineHeight: 1.5, marginBottom: 0 }}
            />

            {/* History toggle */}
            {prevResults.length > 0 && (
              <div>
                <div onClick={() => setExpandedHistory(p => ({ ...p, [ei]: !histExpanded }))}
                  style={{ fontSize: 11, color: "var(--gray2)", marginTop: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{histExpanded ? "▲" : "▼"}</span>
                  <span>PREVIOUS {prevResults.length} SESSION{prevResults.length > 1 ? "S" : ""}</span>
                </div>
                {histExpanded && (
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {prevResults.map((pr, pi) => (
                      <div key={pi} style={{ background: "var(--bg3)", borderRadius: 6, padding: "6px 10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 10, color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                            WK {pr.week} · {new Date(pr.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </div>
                          {pr.planned && (
                            <div style={{ fontSize: 10, color: "var(--gray2)" }}>
                              Plan: {pr.planned.sets}×{pr.planned.reps}@{pr.planned.weight}kg
                            </div>
                          )}
                        </div>
                        {pr.result ? (
                          <div style={{ fontSize: 12, color: "var(--text)", marginTop: 3, lineHeight: 1.4 }}>{pr.result}</div>
                        ) : (
                          <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 3, fontStyle: "italic" }}>No result logged</div>
                        )}
                        {pr.coach_comment && (
                          <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, fontStyle: "italic" }}>
                            🎯 {pr.coach_comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>{/* end padding div */}
          </div>
        );
      })}

      {/* Free program KB sections (non-coached) */}
      {!coachProgram && defaultWorkout?.sections?.filter(s => s.title !== "STRENGTH").map((sec, si) => (
        <div key={si} style={{ marginBottom: 20 }}>
          <div style={{ ...s.sectionLabel, marginBottom: 8 }}>{sec.title}</div>
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
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: accDone[`${si}-${ei}`] ? "var(--red)" : "var(--bg3)",
                    border: `1px solid ${accDone[`${si}-${ei}`] ? "var(--red)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    {accDone[`${si}-${ei}`] ? "✓" : "○"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {sec.swing && (
            <div style={{ ...s.card, background: "rgba(196,30,30,0.05)", textAlign: "center" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{sec.swingData?.label}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 12 }}>2-hand swing · {user?.kgKB}kg KB</div>
              {!condDone.swing
                ? <button style={s.btn} onClick={() => setShowTimer(true)}>⏱ LAUNCH EMOM TIMER</button>
                : <div style={{ color: "var(--red)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>✓ DONE</div>}
            </div>
          )}
        </div>
      ))}

      {/* Save / Finish */}
      {!saved ? (
        <div style={s.card}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 12 }}>FINISH WORKOUT</div>

          <label style={s.label}>YOUR COMMENT (optional)</label>
          <textarea value={athleteComment} onChange={e => setAthleteComment(e.target.value)}
            placeholder="How did it feel? Any notes for your coach..."
            rows={3} style={{ ...s.input, resize: "none", lineHeight: 1.5, marginBottom: 12 }} />

          <label style={s.label}>VIDEO LINK (optional)</label>
          <input type="text" value={videoLink} onChange={e => setVideoLink(e.target.value)}
            placeholder="YouTube, Google Drive..." style={{ ...s.input, marginBottom: 16 }} />

          <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={saveWorkout} disabled={saving}>
            {saving ? "SAVING..." : "💾 SAVE WORKOUT"}
          </button>
        </div>
      ) : (
        <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.05)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔥</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 4 }}>WORKOUT SAVED</div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 16 }}>Week {week} · Day {dayKey} · {doneCount}/{totalExs} exercises done</div>
          <button style={s.btn} onClick={() => onComplete({ day: dayKey, week })}>DONE →</button>
        </div>
      )}
    </div>
  );
}

const READINESS_KEY = "ks_readiness_";
const todayKey = () => new Date().toISOString().slice(0, 10);

function getReadinessColor(score) {
  if (score >= 8) return "#4caf50";
  if (score >= 6) return "var(--gold)";
  if (score >= 4) return "#f06400";
  return "var(--red)";
}
function getReadinessLabel(score) {
  if (score >= 8) return "BATTLE READY";
  if (score >= 6) return "STEADY";
  if (score >= 4) return "TAKE CARE";
  return "REST DAY";
}
function getReadinessRune(score) {
  if (score >= 8) return "ᚠ"; // Fehu — prosperity
  if (score >= 6) return "ᚢ"; // Uruz — strength
  if (score >= 4) return "ᚾ"; // Naudiz — need
  return "ᛁ"; // Isa — ice/pause
}

function ReadinessWidget({ authUser }) {
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


function ScheduleScreen({ authUser, hasCoach, week, setWeek, onStartWorkout }) {
  const [allDays, setAllDays] = useState([]);
  const [completedDays, setCompletedDays] = useState({}); // { "wk-day": true }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!authUser) { setLoading(false); return; }
      try {
        // Load all program days
        const { data: days } = await supabase
          .from("program_days").select("*")
          .eq("athlete_id", authUser.id)
          .order("week", { ascending: true });

        // Load completed workouts
        const { data: logs } = await supabase
          .from("workouts").select("week, day")
          .eq("user_id", authUser.id);

        const done = {};
        (logs || []).forEach(l => { done[`${l.week}-${l.day}`] = true; });

        setAllDays(days || []);
        setCompletedDays(done);
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, [authUser]);

  if (loading) return (
    <div style={s.screen}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--gray)", fontSize: 13, letterSpacing: "0.1em" }}>LOADING...</div>
    </div>
  );

  // Group days by week
  const byWeek = {};
  allDays.forEach(d => {
    if (!byWeek[d.week]) byWeek[d.week] = [];
    byWeek[d.week].push(d);
  });
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  const dayCol = { A: "#4a9eff", B: "#f0a020", C: "var(--red)", D: "#a78bfa" };

  // Find current week (first incomplete week that has days)
  const currentWeek = weeks.find(w => byWeek[w].some(d => !completedDays[`${w}-${d.day}`])) || weeks[0] || week;

  return (
    <div style={s.screen}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>TRAINING PLAN</div>
      <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 20 }}>
        {allDays.length > 0
          ? `${Object.keys(completedDays).length} sessions completed · ${allDays.length - Object.keys(completedDays).length} remaining`
          : hasCoach ? "No program assigned yet" : "Free 8-week program"}
      </div>

      {allDays.length === 0 && !hasCoach && (
        <div style={{ ...s.card, borderColor: "var(--red-dim)", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 6 }}>⚡ FREE PROGRAM</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 8 }}>8-WEEK AUTO PROGRAM</div>
          <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.6, marginBottom: 12 }}>
            Your program is auto-generated week by week. Go to HOME to start each session.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["A","B","C"].map(d => (
              <div key={d} style={{ flex: 1, minWidth: 80, background: "var(--bg3)", borderRadius: 8, padding: "10px 8px", textAlign: "center", borderLeft: `3px solid ${dayCol[d]}` }}>
                <div style={{ fontSize: 10, color: dayCol[d], fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>DAY {d}</div>
                <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>Wk {week}</div>
                <button onClick={() => onStartWorkout(d)}
                  style={{ marginTop: 8, fontSize: 10, padding: "4px 10px", background: "var(--red)", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                  START
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {weeks.map(wk => {
        const wkDays = byWeek[wk];
        const wkDone = wkDays.filter(d => completedDays[`${wk}-${d.day}`]).length;
        const isCurrentWk = wk === currentWeek;
        const isPast = wkDone === wkDays.length;
        const phase = PHASES[getPhase(wk)];

        return (
          <div key={wk} style={{ marginBottom: 16 }}>
            {/* Week header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 900, color: isCurrentWk ? "var(--red)" : "var(--gray2)", letterSpacing: "0.08em" }}>
                WEEK {wk}
              </div>
              <div style={{ fontSize: 10, color: "var(--gray2)", background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>{phase?.name || ""}</div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: isPast ? "var(--red)" : isCurrentWk ? "var(--gold)" : "var(--gray2)" }}>
                {isPast ? "✓ DONE" : `${wkDone}/${wkDays.length}`}
              </div>
            </div>

            {/* Day cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {wkDays.sort((a,b) => a.day < b.day ? -1 : 1).map(d => {
                const isDone = completedDays[`${wk}-${d.day}`];
                const col = dayCol[d.day] || "var(--red)";
                return (
                  <div key={d.id} style={{ ...s.card, borderLeft: `3px solid ${isDone ? "rgba(196,30,30,0.5)" : col}`, opacity: isDone ? 0.6 : 1, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900, color: col, letterSpacing: "0.1em" }}>DAY {d.day}</div>
                          {isDone && <div style={{ fontSize: 10, color: "var(--red)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>✓ COMPLETED</div>}
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>{d.title || `Day ${d.day}`}</div>
                      </div>
                      {!isDone && isCurrentWk && (
                        <button onClick={() => { setWeek(wk); onStartWorkout(d.day); }}
                          style={{ padding: "8px 16px", background: "var(--red)", border: "none", borderRadius: 6, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, cursor: "pointer", letterSpacing: "0.08em" }}>
                          START →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {allDays.length > 0 && (
        <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.03)", marginTop: 8 }}>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>OVERALL PROGRESS</div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, marginBottom: 8 }}>
            <div style={{ height: "100%", borderRadius: 3, background: "var(--red)",
              width: `${allDays.length > 0 ? (Object.keys(completedDays).length / allDays.length) * 100 : 0}%`,
              transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gray2)" }}>
            <span>{Object.keys(completedDays).length} completed</span>
            <span>{allDays.length} total sessions</span>
          </div>
        </div>
      )}
    </div>
  );
}
