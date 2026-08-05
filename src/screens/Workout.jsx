import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PHASES, getPhase } from "../engine/workout";
import { EMOMTimer } from "../components/SmallComponents";
import { s } from "../lib/styles";
import { GarminImport } from "./GarminImport";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  let videoId = "";
  if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
  else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
  else if (url.includes("shorts/")) videoId = url.split("shorts/")[1]?.split("?")[0];
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
}

// ─── WorkoutScreen ────────────────────────────────────────────────────────────

export function WorkoutScreen({ user, week, dayKey, authUser, onComplete }) {
  const [coachProgram, setCoachProgram]       = useState(null);
  const [loadingProgram, setLoadingProgram]   = useState(true);
  const [exResults, setExResults]             = useState({});
  const [prevWorkouts, setPrevWorkouts]       = useState([]);
  const [libraryMap, setLibraryMap]           = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});
  const [athleteComment, setAthleteComment]   = useState("");
  const [videoLink, setVideoLink]             = useState("");
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!authUser) { setLoadingProgram(false); return; }
      try {
        const { data: days } = await supabase.from("program_days").select("*")
          .eq("athlete_id", authUser.id).eq("week", week).eq("day", dayKey);
        const day = days && days.length > 0 ? days[0] : null;
        if (day) {
          const { data: exs } = await supabase.from("custom_exercises").select("*")
            .eq("athlete_id", authUser.id).eq("week", week).eq("day", dayKey)
            .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
          setCoachProgram({ ...day, exercises: exs || [] });
        }
      } catch (e) { console.error("WorkoutScreen load error:", e); }

      try {
        const { data: prev } = await supabase.from("workouts").select("*")
          .eq("user_id", authUser.id).eq("day", dayKey)
          .order("created_at", { ascending: false }).limit(4);
        setPrevWorkouts(prev || []);
      } catch (e) {}

      try {
        const { data: lib } = await supabase.from("exercise_library").select("name, youtube_url");
        const map = {};
        (lib || []).forEach(e => { map[e.name] = e.youtube_url; });
        setLibraryMap(map);
      } catch (e) {}

      setLoadingProgram(false);
    };
    load();
  }, [authUser, week, dayKey]);

  useEffect(() => {
    if (!coachProgram) return;
    const init = {};
    (coachProgram.exercises || []).forEach((ex, i) => { init[i] = { result: "", done: false }; });
    setExResults(init);
  }, [coachProgram]);

  if (loadingProgram) return (
    <div style={s.screen}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--gray)", fontSize: 13, letterSpacing: "0.1em" }}>LOADING...</div>
    </div>
  );

  // No coach program — show waiting screen
  if (!coachProgram) return (
    <div style={s.screen}>
      <div style={{ ...s.card, textAlign: "center", padding: 40, borderColor: "var(--border)" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
          AWAITING YOUR PROGRAMME
        </div>
        <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6 }}>
          Your coach hasn't assigned Day {dayKey} for Week {week} yet.{"\n"}Check back soon or message your coach.
        </div>
      </div>
    </div>
  );

  const saveWorkout = async () => {
    setSaving(true);
    const exercises = coachProgram.exercises.map((ex, i) => ({
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
          workout_title: `DAY ${dayKey} — ${coachProgram.title?.toUpperCase() || "TRAINING"}`,
          exercises,
          comment: athleteComment,
          video_link: videoLink,
        });
      }
    } catch (e) { console.log("Save error:", e); }
    setSaving(false);
    setSaved(true);
  };

  const doneCount = Object.values(exResults).filter(r => r.done).length;
  const totalExs = coachProgram.exercises.length;

  return (
    <div style={s.screen}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={s.sectionLabel}>Week {week}</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900 }}>
            DAY {dayKey} — {coachProgram.title?.toUpperCase()}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: doneCount === totalExs && totalExs > 0 ? "var(--red)" : "var(--white)" }}>
            {doneCount}<span style={{ fontSize: 13, color: "var(--gray2)" }}>/{totalExs}</span>
          </div>
          <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em" }}>DONE</div>
        </div>
      </div>

      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${totalExs > 0 ? (doneCount / totalExs) * 100 : 0}%`, background: "var(--red)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      {coachProgram.notes ? (
        <div style={{ ...s.card, borderColor: "rgba(200,160,40,0.4)", background: "rgba(200,160,40,0.05)", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 6 }}>📋 COACH NOTES</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6 }}>{coachProgram.notes}</div>
        </div>
      ) : null}

      {coachProgram.exercises.map((ex, ei) => {
        const res = exResults[ei] || { result: "", done: false };
        const videoUrl = libraryMap[ex.name];
        const histExpanded = expandedHistory[ei];
        const prevResults = prevWorkouts
          .map(w => {
            const found = (w.exercises || []).find(e => e.name === ex.name);
            return found ? { date: w.created_at, week: w.week, result: found.result, planned: found.planned, coach_comment: w.coach_comment } : null;
          })
          .filter(Boolean).slice(0, 3);
        const embedUrl = getYouTubeEmbedUrl(videoUrl);

        return (
          <div key={ei} style={{ ...s.card, borderColor: res.done ? "rgba(196,30,30,0.7)" : "var(--border)", marginBottom: 12, transition: "border-color 0.3s", padding: 0, overflow: "hidden" }}>
            {embedUrl && (
              <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
                <iframe src={embedUrl}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            )}
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: "0.04em" }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 2, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                    {ex.sets} × {ex.unit === "sec" ? `${ex.reps}sec` : ex.unit === "m" ? `${ex.reps}m` : ex.reps}
                    {ex.rpe ? ` · RPE ${ex.rpe}` : ex.weight ? ` @ ${ex.weight}kg` : ""}
                  </div>
                  {ex.notes ? <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 6, lineHeight: 1.6, whiteSpace: "pre-wrap", background: "var(--bg3)", borderRadius: 6, padding: "8px 10px", borderLeft: "2px solid var(--gold-dim)" }}>{ex.notes}</div> : null}
                </div>
                <div onClick={() => setExResults(p => ({ ...p, [ei]: { ...res, done: !res.done } }))}
                  style={{ width: 32, height: 32, borderRadius: 6, background: res.done ? "var(--red)" : "var(--bg3)",
                    border: `1px solid ${res.done ? "var(--red)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
                  {res.done ? "✓" : "○"}
                </div>
              </div>

              <textarea value={res.result}
                onChange={e => setExResults(p => ({ ...p, [ei]: { ...res, result: e.target.value } }))}
                placeholder={`Result... e.g. 5×5 @ ${ex.weight || "?"}kg, RPE 8`}
                rows={2} style={{ ...s.input, resize: "none", fontSize: 13, lineHeight: 1.5, marginBottom: 0 }} />

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
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div style={{ fontSize: 10, color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                              WK {pr.week} · {new Date(pr.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </div>
                            {pr.planned && <div style={{ fontSize: 10, color: "var(--gray2)" }}>Plan: {pr.planned.sets}×{pr.planned.reps}@{pr.planned.weight}kg</div>}
                          </div>
                          {pr.result
                            ? <div style={{ fontSize: 12, color: "var(--text)", marginTop: 3, lineHeight: 1.4 }}>{pr.result}</div>
                            : <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 3, fontStyle: "italic" }}>No result logged</div>}
                          {pr.coach_comment && <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4, fontStyle: "italic" }}>🎯 {pr.coach_comment}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

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

// ─── ScheduleScreen ───────────────────────────────────────────────────────────

export function ScheduleScreen({ authUser, week, setWeek, onStartWorkout }) {
  const [allDays, setAllDays]             = useState([]);
  const [completedDays, setCompletedDays] = useState({});
  const [completedLogs, setCompletedLogs] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [expandedLog, setExpandedLog]     = useState(null);
  const [showHistory, setShowHistory]     = useState(false);
  const [editingLog, setEditingLog]       = useState(null);
  const [editResult, setEditResult]       = useState("");
  const [editIdx, setEditIdx]             = useState(null);
  const [savingEdit, setSavingEdit]       = useState(false);
  const [showQuickLog, setShowQuickLog]   = useState(false);
  const [showGarmin, setShowGarmin]       = useState(false);
  const [qlTitle, setQlTitle]             = useState("");
  const [qlExercises, setQlExercises]     = useState([{ name: "", sets: "", reps: "", weight: "", notes: "" }]);
  const [qlComment, setQlComment]         = useState("");
  const [qlSaving, setQlSaving]           = useState(false);
  const [qlSaved, setQlSaved]             = useState(false);

  const load = async () => {
    if (!authUser) { setLoading(false); return; }
    try {
      const { data: days } = await supabase.from("program_days").select("*")
        .eq("athlete_id", authUser.id).order("week", { ascending: true });
      const { data: logs } = await supabase.from("workouts").select("*")
        .eq("user_id", authUser.id).order("created_at", { ascending: false });
      const done = {};
      (logs || []).forEach(l => { done[`${l.week}-${l.day}`] = true; });
      setAllDays(days || []);
      setCompletedDays(done);
      setCompletedLogs(logs || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [authUser]);

  const saveExerciseResult = async (log, exIdx, newResult) => {
    setSavingEdit(true);
    try {
      const updatedExercises = (log.exercises || []).map((ex, i) =>
        i === exIdx ? { ...ex, result: newResult } : ex
      );
      await supabase.from("workouts").update({ exercises: updatedExercises }).eq("id", log.id);
      setCompletedLogs(prev => prev.map(l => l.id === log.id ? { ...l, exercises: updatedExercises } : l));
      setEditingLog(null);
      setEditIdx(null);
    } catch (e) { console.log("Edit error:", e); }
    setSavingEdit(false);
  };

  const saveQuickLog = async () => {
    if (!qlTitle.trim()) return;
    setQlSaving(true);
    const exercises = qlExercises
      .filter(e => e.name.trim())
      .map(e => ({
        name: e.name,
        result: [e.sets && e.reps ? `${e.sets}×${e.reps}` : "", e.weight ? `@ ${e.weight}kg` : "", e.notes].filter(Boolean).join(" "),
        done: true,
      }));
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (au) {
        await supabase.from("workouts").insert({
          user_id: au.id,
          week: 0,
          day: "Q",
          workout_title: qlTitle,
          exercises,
          comment: qlComment,
        });
        setQlSaved(true);
        setQlTitle("");
        setQlExercises([{ name: "", sets: "", reps: "", weight: "", notes: "" }]);
        setQlComment("");
        setTimeout(() => { setQlSaved(false); setShowQuickLog(false); load(); }, 1500);
      }
    } catch (e) { console.log("QuickLog save error:", e); }
    setQlSaving(false);
  };

  if (loading) return (
    <div style={s.screen}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--gray)", fontSize: 13, letterSpacing: "0.1em" }}>LOADING...</div>
    </div>
  );

  const byWeek = {};
  allDays.forEach(d => {
    if (!byWeek[d.week]) byWeek[d.week] = [];
    byWeek[d.week].push(d);
  });
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);
  const dayCol = { A: "#4a9eff", B: "#f0a020", C: "var(--red)", D: "#a78bfa" };
  const currentWeek = weeks.find(w => byWeek[w].some(d => !completedDays[`${w}-${d.day}`])) || weeks[weeks.length - 1] || week;

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div style={s.screen}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>TRAINING PLAN</div>
      <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 20 }}>
        {allDays.length > 0
          ? `${Object.keys(completedDays).length} sessions completed · ${allDays.length - Object.keys(completedDays).length} remaining`
          : "No programme assigned yet — contact your coach"}
      </div>

      {allDays.length === 0 && (
        <div style={{ ...s.card, textAlign: "center", padding: 40, borderColor: "var(--border)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginBottom: 8 }}>AWAITING YOUR PROGRAMME</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, marginBottom: 20 }}>Your coach will assign your programme soon. Message them if you have questions.</div>
          <button onClick={() => setShowQuickLog(true)} style={{ ...s.btn, fontSize: 13, marginBottom: 8 }}>+ LOG A SESSION →</button>
          <button onClick={() => setShowGarmin(v => !v)} style={{ ...s.btnGhost, fontSize: 13 }}>⌚ IMPORT FROM GARMIN</button>
        </div>
      )}

      {allDays.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setShowGarmin(v => !v)}
            style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12 }}>
            ⌚ GARMIN
          </button>
          <button onClick={() => setShowQuickLog(true)}
            style={{ ...s.btnGhost, width: "auto", padding: "8px 16px", fontSize: 12 }}>
            + QUICK LOG
          </button>
        </div>
      )}

      {showGarmin && (
        <div style={{ marginBottom: 16 }}>
          <GarminImport authUser={authUser} onImported={() => { setShowGarmin(false); load(); }} />
        </div>
      )}

      {showQuickLog && (
        <div style={{ ...s.card, marginBottom: 16, borderColor: "var(--red-dim)" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)", marginBottom: 16 }}>
            📝 LOG SESSION
          </div>

          <label style={s.label}>SESSION TITLE</label>
          <input value={qlTitle} onChange={e => setQlTitle(e.target.value)}
            placeholder="e.g. Upper Body, Kettlebell, Legs..."
            style={{ ...s.input, marginBottom: 16 }} />

          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 10 }}>EXERCISES</div>

          {qlExercises.map((ex, i) => (
            <div key={i} style={{ background: "var(--bg3)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input value={ex.name} onChange={e => { const a=[...qlExercises]; a[i].name=e.target.value; setQlExercises(a); }}
                  placeholder="Exercise name..."
                  style={{ ...s.input, flex: 1, marginBottom: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700 }} />
                {qlExercises.length > 1 && (
                  <div onClick={() => setQlExercises(qlExercises.filter((_,j) => j !== i))}
                    style={{ color: "var(--gray2)", fontSize: 18, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>✕</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["Sets","sets"],["Reps","reps"],["kg","weight"]].map(([lbl, key]) => (
                  <div key={key} style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "var(--gray2)", marginBottom: 3 }}>{lbl}</div>
                    <input type="number" value={ex[key]}
                      onChange={e => { const a=[...qlExercises]; a[i][key]=e.target.value; setQlExercises(a); }}
                      placeholder="—" style={{ ...s.input, padding: "8px 6px", textAlign: "center" }} />
                  </div>
                ))}
              </div>
              <input value={ex.notes} onChange={e => { const a=[...qlExercises]; a[i].notes=e.target.value; setQlExercises(a); }}
                placeholder="Notes... e.g. RPE 8, paused, per side"
                style={{ ...s.input, marginTop: 8, fontSize: 12 }} />
            </div>
          ))}

          <button onClick={() => setQlExercises([...qlExercises, { name: "", sets: "", reps: "", weight: "", notes: "" }])}
            style={{ ...s.btnGhost, fontSize: 12, marginBottom: 16 }}>+ ADD EXERCISE</button>

          <label style={s.label}>SESSION COMMENT (optional)</label>
          <textarea value={qlComment} onChange={e => setQlComment(e.target.value)}
            placeholder="How did it feel? Any notes for your coach..."
            rows={3} style={{ ...s.input, resize: "none", lineHeight: 1.5, marginBottom: 16 }} />

          {qlSaved ? (
            <div style={{ ...s.card, textAlign: "center", padding: 20, borderColor: "var(--red)" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔥</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>SESSION SAVED!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={saveQuickLog} disabled={qlSaving || !qlTitle.trim()}
                style={{ ...s.btn, opacity: (qlSaving || !qlTitle.trim()) ? 0.5 : 1 }}>
                {qlSaving ? "SAVING..." : "💾 SAVE SESSION →"}
              </button>
              <button onClick={() => { setShowQuickLog(false); setQlTitle(""); setQlExercises([{ name: "", sets: "", reps: "", weight: "", notes: "" }]); setQlComment(""); }}
                style={s.btnGhost}>CANCEL</button>
            </div>
          )}
        </div>
      )}

      {weeks.map(wk => {
        const wkDays = byWeek[wk].sort((a, b) => a.day < b.day ? -1 : 1);
        const wkDone = wkDays.filter(d => completedDays[`${wk}-${d.day}`]).length;
        const isCurrentWk = wk === currentWeek;
        const isPast = wkDone === wkDays.length;
        const phase = PHASES[getPhase(wk)];

        return (
          <div key={wk} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 900, color: isCurrentWk ? "var(--red)" : "var(--gray2)", letterSpacing: "0.08em" }}>
                WEEK {wk}
              </div>
              {phase?.name && <div style={{ fontSize: 10, color: "var(--gray2)", background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>{phase.name}</div>}
              <div style={{ marginLeft: "auto", fontSize: 11, color: isPast ? "var(--red)" : isCurrentWk ? "var(--gold)" : "var(--gray2)" }}>
                {isPast ? "✓ DONE" : `${wkDone}/${wkDays.length}`}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {wkDays.map(d => {
                const isDone = completedDays[`${wk}-${d.day}`];
                const col = dayCol[d.day] || "var(--red)";
                return (
                  <div key={d.id} style={{ ...s.card, borderLeft: `3px solid ${isDone ? "rgba(196,30,30,0.4)" : col}`, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900, color: isDone ? "var(--gray2)" : col, letterSpacing: "0.1em" }}>DAY {d.day}</div>
                          {isDone && <div style={{ fontSize: 10, color: "var(--red)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>✓ COMPLETED</div>}
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: isDone ? "var(--gray)" : "var(--text)" }}>{d.title || `Day ${d.day}`}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {isDone && (
                          <button onClick={() => { setWeek(wk); onStartWorkout(d.day); }}
                            style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: 6, color: "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                            REDO
                          </button>
                        )}
                        {!isDone && (
                          <button onClick={() => { setWeek(wk); onStartWorkout(d.day); }}
                            style={{ padding: "8px 16px", background: "var(--red)", border: "none", borderRadius: 6, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, cursor: "pointer", letterSpacing: "0.08em" }}>
                            START →
                          </button>
                        )}
                      </div>
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

      {/* ── HISTORY ── */}
      {completedLogs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 20 }} />
          <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif" }}>
            YOUR TRAINING LOG
          </div>
          <div onClick={() => setShowHistory(v => !v)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900 }}>
              📋 WORKOUT HISTORY
            </div>
            <div style={{ fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
              {completedLogs.length} sessions
              <span style={{ fontSize: 16, color: "var(--gray2)" }}>{showHistory ? " ▲" : " ▼"}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: showHistory ? 12 : 0, lineHeight: 1.5 }}>
            {showHistory ? "Tap any session to expand. Tap EDIT to update a result." : "Your full session log — tap to expand and edit results."}
          </div>

          {showHistory && completedLogs.map((log, idx) => {
            const col = dayCol[log.day] || "var(--red)";
            const isOpen = expandedLog === idx;
            const hasCoachFeedback = !!log.coach_comment;

            return (
              <div key={log.id || idx} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${hasCoachFeedback ? "var(--gold)" : col}`, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpandedLog(isOpen ? null : idx)}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 900, color: col }}>DAY {log.day}</div>
                      <div style={{ fontSize: 10, color: "var(--gray2)", fontFamily: "'Barlow Condensed', sans-serif" }}>WK {log.week}</div>
                      {hasCoachFeedback && (
                        <div style={{ fontSize: 9, background: "rgba(201,168,76,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                          🎯 FEEDBACK
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                      {(log.workout_title || "").replace(/DAY [ABCD] — /, "")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>{fmtDate(log.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 18, color: "var(--gray2)", paddingLeft: 8 }}>{isOpen ? "▲" : "▼"}</div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    {(log.exercises || []).map((ex, ei) => {
                      const isEditing = editingLog === log.id && editIdx === ei;
                      return (
                        <div key={ei} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: col }}>{ex.name}</div>
                            <div onClick={() => {
                              if (isEditing) { setEditingLog(null); setEditIdx(null); }
                              else { setEditingLog(log.id); setEditIdx(ei); setEditResult(ex.result || ""); }
                            }} style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", padding: "2px 8px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                              {isEditing ? "CANCEL" : "EDIT"}
                            </div>
                          </div>
                          {isEditing ? (
                            <div>
                              <textarea value={editResult} onChange={e => setEditResult(e.target.value)} rows={2}
                                style={{ ...s.input, resize: "none", fontSize: 13, marginBottom: 6 }} />
                              <button onClick={() => saveExerciseResult(log, ei, editResult)} disabled={savingEdit}
                                style={{ ...s.btn, fontSize: 12, padding: "8px 16px", opacity: savingEdit ? 0.6 : 1 }}>
                                {savingEdit ? "SAVING..." : "SAVE ✓"}
                              </button>
                            </div>
                          ) : (
                            ex.result
                              ? <div style={{ fontSize: 13, color: "var(--text)", background: "var(--bg3)", borderRadius: 4, padding: "5px 8px" }}>{ex.result}</div>
                              : <div style={{ fontSize: 11, color: "var(--gray2)", fontStyle: "italic" }}>No result logged — tap EDIT to add</div>
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
                      <div style={{ fontSize: 13, color: "var(--text)", background: "rgba(201,168,76,0.06)", borderRadius: 6, padding: "10px 12px", marginTop: 8, border: "1px solid rgba(201,168,76,0.2)" }}>
                        <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 4 }}>🎯 COACH FEEDBACK</div>
                        {log.coach_comment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
