import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { sendPushToUser } from "../lib/push";
import { s } from "../lib/styles";
import { RanksCoachView } from "../components/RankComponents";

export function CoachScreen() {
  const [clients, setClients]           = useState([]);
  const [workouts, setWorkouts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [view, setView]                 = useState("dashboard");
  const [saving, setSaving]             = useState(false);
  const [exercises, setExercises]       = useState([]);
  const [programDays, setProgramDays]   = useState([]);
  const [buildMode, setBuildMode]       = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [templates, setTemplates]       = useState([]);
  const [tplMode, setTplMode]           = useState("list");
  const [tplName, setTplName]           = useState("");
  const [tplDays, setTplDays]           = useState([{ day: "A", title: "", notes: "", exercises: [{ name: "", sets: 3, reps: 5, weight: 0 }] }]);
  const [selectedTpl, setSelectedTpl]   = useState(null);
  const [tplWeekStart, setTplWeekStart] = useState(1);
  const [tplAssignClients, setTplAssignClients] = useState([]);
  const [savingTpl, setSavingTpl]       = useState(false);
  const [dietClient, setDietClient]     = useState(null);
  const [dietUploading, setDietUploading] = useState(false);
  const [dietFiles, setDietFiles]       = useState([]);
  const [dietError, setDietError]       = useState("");
  const dietFileRef                     = useRef(null);
  const [coachComment, setCoachComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);
  const [editingDay, setEditingDay]     = useState(null);
  const [buildWeek, setBuildWeek]       = useState(1);
  const [buildDay, setBuildDay]         = useState("A");
  const [buildTitle, setBuildTitle]     = useState("");
  const [buildNotes, setBuildNotes]     = useState("");
  const [buildExercises, setBuildExercises] = useState([{ name: "", sets: 3, reps: 8, weight: 0, notes: "" }]);
  const [libraryPicker, setLibraryPicker] = useState(null);
  const [libraryList, setLibraryList]   = useState([]);
  const [libPickerCat, setLibPickerCat] = useState("All");
  const [libPickerSearch, setLibPickerSearch] = useState("");
  const [copyWeekFrom, setCopyWeekFrom] = useState(1);
  const [copyWeekTo, setCopyWeekTo]     = useState(2);
  const [copyingWeek, setCopyingWeek]   = useState(false);
  const [showCopyWeek, setShowCopyWeek] = useState(false);
  const [clientFilter, setClientFilter] = useState("all"); // all | active | inactive

  // ── DATA ──────────────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("*");
      setClients(profiles || []);
      const { data: logs } = await supabase.from("workouts").select("*").order("created_at", { ascending: false });
      setWorkouts(logs || []);
      const { data: exs } = await supabase.from("custom_exercises").select("*")
        .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      setExercises(exs || []);
      const { data: days } = await supabase.from("program_days").select("*").order("week", { ascending: true });
      setProgramDays(days || []);
    } catch(e) { console.log("Coach load error:", e); }
    setLoading(false);
  };

  const loadTemplates = async () => {
    const { data } = await supabase.from("program_templates").select("*").order("created_at", { ascending: false });
    setTemplates(data || []);
  };

  useEffect(() => { loadData(); loadTemplates(); }, []);

  // ── COPY WEEK (fixed — checks for existing days) ──────────────────────────

  const copyWeek = async () => {
    if (!selectedClient) return;
    setCopyingWeek(true);
    try {
      const { data: sourceDays } = await supabase.from("program_days").select("*")
        .eq("athlete_id", selectedClient).eq("week", copyWeekFrom);

      if (!sourceDays || sourceDays.length === 0) {
        alert(`Week ${copyWeekFrom} has no days to copy.`);
        setCopyingWeek(false);
        return;
      }

      const { data: au } = await supabase.auth.getUser();
      const coachId = au.user?.id;

      for (const day of sourceDays) {
        // Check if destination day already exists
        const { data: existing } = await supabase.from("program_days").select("id")
          .eq("athlete_id", selectedClient).eq("week", copyWeekTo).eq("day", day.day)
          .maybeSingle();

        let destDayId;
        if (existing) {
          // Update existing — delete old exercises first
          await supabase.from("custom_exercises").delete()
            .eq("athlete_id", selectedClient).eq("week", copyWeekTo).eq("day", day.day);
          await supabase.from("program_days").update({ title: day.title, notes: day.notes }).eq("id", existing.id);
          destDayId = existing.id;
        } else {
          const { data: newDay } = await supabase.from("program_days").insert({
            coach_id: coachId, athlete_id: selectedClient,
            week: copyWeekTo, day: day.day, title: day.title, notes: day.notes,
          }).select().single();
          destDayId = newDay?.id;
        }

        if (destDayId) {
          const { data: exs } = await supabase.from("custom_exercises").select("*")
            .eq("athlete_id", selectedClient).eq("week", copyWeekFrom).eq("day", day.day)
            .order("sort_order", { ascending: true }).order("created_at", { ascending: true });

          for (let idx = 0; idx < (exs || []).length; idx++) {
            const ex = exs[idx];
            await supabase.from("custom_exercises").insert({
              athlete_id: ex.athlete_id, coach_id: ex.coach_id,
              week: copyWeekTo, day: ex.day, name: ex.name,
              sets: ex.sets, reps: ex.reps, weight: ex.weight,
              notes: ex.notes || "", sort_order: idx,
            });
          }
        }
      }

      await loadData();
      setShowCopyWeek(false);
      alert(`✅ Week ${copyWeekFrom} → Week ${copyWeekTo} copied!`);
    } catch(e) { console.log("Copy week error:", e); alert("Error copying week"); }
    setCopyingWeek(false);
  };

  // ── SAVE PROGRAM DAY (fixed — no duplicates, sort_order) ─────────────────

  const saveProgramDay = async () => {
    if (!selectedClient || !buildTitle) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const validExercises = buildExercises.filter(e => e.name.trim());

      if (editingDay) {
        // Editing existing day
        await supabase.from("program_days").update({ title: buildTitle, notes: buildNotes }).eq("id", editingDay.dayId);
        await supabase.from("custom_exercises").delete().eq("athlete_id", selectedClient).eq("week", buildWeek).eq("day", buildDay);
        for (let idx = 0; idx < validExercises.length; idx++) {
          const ex = validExercises[idx];
          await supabase.from("custom_exercises").insert({
            coach_id: user.id, athlete_id: selectedClient,
            name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
            notes: ex.notes || "", day: buildDay, week: buildWeek, sort_order: idx,
          });
        }
        setEditingDay(null);
      } else {
        // New day — check if already exists
        const { data: existing } = await supabase.from("program_days").select("id")
          .eq("athlete_id", selectedClient).eq("week", buildWeek).eq("day", buildDay)
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase.from("custom_exercises").delete()
            .eq("athlete_id", selectedClient).eq("week", buildWeek).eq("day", buildDay);
          await supabase.from("program_days").update({ title: buildTitle, notes: buildNotes }).eq("id", existing.id);
        } else {
          await supabase.from("program_days").insert({
            coach_id: user.id, athlete_id: selectedClient,
            week: buildWeek, day: buildDay, title: buildTitle, notes: buildNotes,
          });
          sendPushToUser(selectedClient, "💪 New programme from your coach", `Week ${buildWeek} · Day ${buildDay} — ${buildTitle}`, "program", "/");
        }

        for (let idx = 0; idx < validExercises.length; idx++) {
          const ex = validExercises[idx];
          await supabase.from("custom_exercises").insert({
            coach_id: user.id, athlete_id: selectedClient,
            name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
            notes: ex.notes || "", day: buildDay, week: buildWeek, sort_order: idx,
          });
        }
      }

      setBuildMode(false);
      setBuildTitle("");
      setBuildNotes("");
      setBuildExercises([{ name: "", sets: 3, reps: 5, weight: 0, notes: "" }]);
      await loadData();
      setView("profile");
    } catch(e) { console.log("Save program day error:", e); }
    setSaving(false);
  };

  const deleteProgramDay = async (dayId, wk, dy) => {
    await supabase.from("program_days").delete().eq("id", dayId);
    await supabase.from("custom_exercises").delete()
      .eq("athlete_id", selectedClient).eq("week", wk).eq("day", dy);
    await loadData();
  };

  // ── TEMPLATES ─────────────────────────────────────────────────────────────

  const saveTemplate = async () => {
    if (!tplName.trim()) return;
    setSavingTpl(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const { data: tpl } = await supabase.from("program_templates").insert({
        coach_id: au.id, name: tplName, days: tplDays,
      }).select().single();
      setTemplates(prev => [tpl, ...prev]);
      setTplMode("list");
      setTplName("");
      setTplDays([{ day: "A", title: "", notes: "", exercises: [{ name: "", sets: 3, reps: 5, weight: 0 }] }]);
    } catch(e) { console.log("Template save error:", e); }
    setSavingTpl(false);
  };

  const assignTemplate = async () => {
    if (!selectedTpl || tplAssignClients.length === 0) return;
    setSavingTpl(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      for (const clientId of tplAssignClients) {
        for (const tday of (selectedTpl.days || [])) {
          const { data: existing } = await supabase.from("program_days").select("id")
            .eq("athlete_id", clientId).eq("week", tplWeekStart).eq("day", tday.day).maybeSingle();

          if (existing) {
            await supabase.from("custom_exercises").delete()
              .eq("athlete_id", clientId).eq("week", tplWeekStart).eq("day", tday.day);
            await supabase.from("program_days").update({ title: tday.title || selectedTpl.name, notes: tday.notes || "" }).eq("id", existing.id);
          } else {
            await supabase.from("program_days").insert({
              coach_id: au.id, athlete_id: clientId,
              week: tplWeekStart, day: tday.day,
              title: tday.title || selectedTpl.name, notes: tday.notes || "",
            });
          }

          const exs = (tday.exercises || []).filter(e => e.name?.trim());
          for (let idx = 0; idx < exs.length; idx++) {
            const ex = exs[idx];
            await supabase.from("custom_exercises").insert({
              coach_id: au.id, athlete_id: clientId,
              name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight || 0,
              day: tday.day, week: tplWeekStart, sort_order: idx,
            });
          }
        }
        sendPushToUser(clientId, "💪 New programme assigned", `${selectedTpl.name} — Week ${tplWeekStart}`, "program", "/");
      }
      setTplMode("list");
      setSelectedTpl(null);
      setTplAssignClients([]);
      await loadData();
    } catch(e) { console.log("Assign template error:", e); }
    setSavingTpl(false);
  };

  // ── MISC ──────────────────────────────────────────────────────────────────

  const saveCoachComment = async () => {
    if (!selectedSession?.id) return;
    setSavingComment(true);
    try {
      await supabase.from("workouts").update({ coach_comment: coachComment }).eq("id", selectedSession.id);
      setCommentSaved(true);
      setSelectedSession(prev => ({ ...prev, coach_comment: coachComment }));
      sendPushToUser(selectedSession.user_id, "💬 Coach feedback on your workout", "Tap to read your coach's feedback", "feedback", "/");
      setTimeout(() => setCommentSaved(false), 3000);
    } catch(e) {}
    setSavingComment(false);
  };

  const loadDietFiles = async (clientId) => {
    if (!clientId) return;
    const { data } = await supabase.from("diet_files").select("*").eq("athlete_id", clientId).order("created_at", { ascending: false });
    setDietFiles(data || []);
  };

  const uploadDiet = async (file, clientId) => {
    if (!file || !clientId) return;
    setDietUploading(true); setDietError("");
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const fileName = `diets/${clientId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("diet-files").upload(fileName, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("diet-files").getPublicUrl(fileName);
      await supabase.from("diet_files").insert({ coach_id: au.id, athlete_id: clientId, file_name: file.name, file_url: urlData.publicUrl });
      sendPushToUser(clientId, "🥗 New diet plan from your coach", "Tap to download your nutrition plan", "diet", "/");
      await loadDietFiles(clientId);
    } catch(e) { setDietError(e.message || "Upload failed"); }
    setDietUploading(false);
  };

  const loadLibraryList = async () => {
    if (libraryList.length > 0) return;
    const { data } = await supabase.from("exercise_library").select("name, category").order("category").order("name");
    setLibraryList(data || []);
  };

  // ── DERIVED DATA ───────────────────────────────────────────────────────────

  const selectedClientData = clients.find(c => c.id === selectedClient);
  const athletes = clients.filter(c => c.role === "athlete");
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const clientWks = (id) => workouts.filter(w => w.user_id === id);
  const wksThisWeek = (id) => clientWks(id).filter(w => new Date(w.created_at) >= startOfWeek).length;
  const wksThisMonth = (id) => clientWks(id).filter(w => new Date(w.created_at) >= startOfMonth).length;
  const lastWorkout = (id) => clientWks(id)[0];
  const hasProgram = (id) => programDays.some(d => d.athlete_id === id);
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const clientExercises = selectedClient ? exercises.filter(e => e.athlete_id === selectedClient) : [];
  const clientWorkouts = selectedClient ? workouts.filter(w => w.user_id === selectedClient) : workouts;

  const weeklyData = (() => {
    if (!selectedClient) return [];
    return [3,2,1,0].map(i => {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1 - i * 7); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      const wks = clientWks(selectedClient).filter(w => { const d = new Date(w.created_at); return d >= start && d < end; });
      const vol = wks.reduce((s, w) => s + (w.exercises || []).reduce((s2, ex) =>
        s2 + (ex.sets || []).filter(st => st.done && st.weight && st.reps)
          .reduce((s3, st) => s3 + parseFloat(st.weight) * parseFloat(st.reps), 0), 0), 0);
      return { label: i === 0 ? "now" : `-${i}w`, sessions: wks.length, vol: Math.round(vol) };
    });
  })();

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div style={s.screen}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["dashboard","📊"],["sessions","📋"],["templates","📁"],["diet","🥗"],["ranks","🏆"]].map(([v, icon]) => (
          <div key={v} onClick={() => { setView(v); setSelectedClient(null); setBuildMode(false); setEditingDay(null); }}
            style={{ ...s.pill(view === v && !selectedClient), padding: "8px 0", flex: 1, textAlign: "center", fontSize: 18 }}>
            {icon}
          </div>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {view === "dashboard" && !selectedClient && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              ["ATHLETES", athletes.length, "total"],
              ["SESSIONS", workouts.length, "all time"],
              ["THIS WEEK", workouts.filter(w => new Date(w.created_at) >= startOfWeek).length, "all clients"],
            ].map(([label, val, sub]) => (
              <div key={label} style={{ ...s.card, textAlign: "center", padding: "10px 6px" }}>
                <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, color: "var(--red)", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: "var(--gray2)", marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={s.sectionLabel}>ATHLETE STATUS</div>
          {athletes.map(a => {
            const isActive = wksThisWeek(a.id) > 0;
            const last = lastWorkout(a.id);
            const daysSince = last ? Math.floor((now - new Date(last.created_at)) / 86400000) : null;
            const statusColor = isActive ? "var(--red)" : daysSince !== null && daysSince >= 5 ? "#b8860b" : "var(--gray2)";
            const statusText = isActive ? `${wksThisWeek(a.id)} session${wksThisWeek(a.id) > 1 ? "s" : ""} this week`
              : daysSince === null ? "No sessions yet"
              : daysSince === 0 ? "Trained today"
              : `Last trained ${daysSince}d ago`;

            return (
              <div key={a.id} onClick={() => { setSelectedClient(a.id); setView("profile"); }}
                style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${statusColor}` }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700 }}>{a.name || a.email?.split("@")[0] || "Athlete"}</div>
                  <div style={{ fontSize: 11, color: statusColor, marginTop: 2 }}>{statusText}</div>
                  {!hasProgram(a.id) && <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 2 }}>⚠ No programme assigned</div>}
                </div>
                <span style={{ color: "var(--gray2)", fontSize: 16 }}>›</span>
              </div>
            );
          })}
        </>
      )}

      {/* ── CLIENT PROFILE ── */}
      {selectedClient && selectedClientData && view === "profile" && !buildMode && (
        <>
          <button onClick={() => { setSelectedClient(null); setView("dashboard"); }} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 14 }}>← BACK</button>

          <div style={{ ...s.card, borderColor: "var(--red-dim)", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{selectedClientData.name || "Athlete"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {[["SQ", selectedClientData.squat], ["BP", selectedClientData.bench], ["DL", selectedClientData.deadlift], ["KB", selectedClientData.kb_weight]].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg3)", borderRadius: 6, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.08em" }}>{k}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900 }}>{v || "—"}</div>
                  {v && <div style={{ fontSize: 9, color: "var(--gray2)" }}>kg</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 6 }}>LAST 4 WEEKS — SESSIONS</div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 48, marginBottom: 12 }}>
              {weeklyData.map((w, i) => {
                const maxV = Math.max(...weeklyData.map(x => x.sessions), 1);
                const h = Math.max(4, (w.sessions / maxV) * 40);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ fontSize: 9, color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif" }}>{w.sessions > 0 ? w.sessions : ""}</div>
                    <div style={{ width: "100%", borderRadius: 3, background: i === 3 ? "var(--red)" : "var(--bg3)", border: "1px solid var(--border)", height: h }} />
                    <div style={{ fontSize: 8, color: "var(--gray2)" }}>{w.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["TOTAL", clientWorkouts.length], ["THIS WK", wksThisWeek(selectedClient)], ["THIS MO", wksThisMonth(selectedClient)], ["PROG", hasProgram(selectedClient) ? "✓" : "✗"]].map(([k, v]) => (
                <div key={k} style={{ flex: 1, background: "var(--bg3)", borderRadius: 6, padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "var(--gray2)", letterSpacing: "0.06em" }}>{k}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: v === "✗" ? "var(--gray2)" : "var(--accent)" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          {(selectedClientData.main_goal || selectedClientData.athlete_notes) && (
            <div style={{ ...s.card, borderColor: "rgba(184,134,11,0.2)", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 10, fontFamily: "'Cinzel', serif" }}>GOALS & NOTES</div>
              {selectedClientData.main_goal && <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>{selectedClientData.main_goal}</div>}
              {selectedClientData.athlete_notes && <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, background: "var(--bg3)", borderRadius: 4, padding: "8px 12px", borderLeft: "2px solid var(--accent)" }}>{selectedClientData.athlete_notes}</div>}
            </div>
          )}

          {/* Program actions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setBuildMode(true)} style={{ ...s.btn, flex: 1, fontSize: 12, padding: "10px" }}>+ PROGRAMME DAY</button>
            <button onClick={() => setShowCopyWeek(v => !v)} style={{ ...s.btnGhost, flex: 1, fontSize: 12, padding: "10px" }}>⧉ COPY WEEK</button>
          </div>

          {showCopyWeek && (
            <div style={{ ...s.card, marginBottom: 12, borderColor: "rgba(200,160,40,0.3)" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900, color: "var(--gold)", marginBottom: 10 }}>COPY WEEK</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--gray2)", marginBottom: 4 }}>FROM WEEK</div>
                  <input type="number" min={1} max={12} value={copyWeekFrom} onChange={e => setCopyWeekFrom(+e.target.value)} style={s.input} />
                </div>
                <div style={{ fontSize: 18, color: "var(--gray2)", paddingTop: 16 }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--gray2)", marginBottom: 4 }}>TO WEEK</div>
                  <input type="number" min={1} max={12} value={copyWeekTo} onChange={e => setCopyWeekTo(+e.target.value)} style={s.input} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--gray2)", marginBottom: 10 }}>
                ℹ️ If Week {copyWeekTo} already has sessions, they will be overwritten.
              </div>
              <button onClick={copyWeek} disabled={copyingWeek || copyWeekFrom === copyWeekTo}
                style={{ ...s.btn, fontSize: 13, opacity: (copyingWeek || copyWeekFrom === copyWeekTo) ? 0.5 : 1 }}>
                {copyingWeek ? "COPYING..." : `COPY WEEK ${copyWeekFrom} → WEEK ${copyWeekTo}`}
              </button>
            </div>
          )}

          {/* Programme overview */}
          {programDays.filter(d => d.athlete_id === selectedClient).length > 0 && (
            <div style={{ ...s.card, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>PROGRAMME</div>
              {programDays
                .filter(d => d.athlete_id === selectedClient)
                .sort((a, b) => a.week !== b.week ? a.week - b.week : a.day < b.day ? -1 : 1)
                .map(day => {
                  const dayExs = exercises.filter(e => e.athlete_id === selectedClient && e.week === day.week && e.day === day.day);
                  const col = { A: "#4a9eff", B: "#f0a020", C: "var(--red)", D: "#a78bfa" }[day.day] || "var(--red)";
                  return (
                    <div key={day.id} style={{ borderLeft: `3px solid ${col}`, paddingLeft: 10, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 900 }}>
                          Wk {day.week} · Day {day.day} — {day.title}
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <div onClick={() => {
                            setBuildWeek(day.week); setBuildDay(day.day); setBuildTitle(day.title);
                            setBuildNotes(day.notes || "");
                            setBuildExercises(dayExs.length > 0
                              ? dayExs.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, notes: e.notes || "" }))
                              : [{ name: "", sets: 3, reps: 5, weight: 0, notes: "" }]);
                            setEditingDay({ dayId: day.id });
                            setBuildMode(true);
                          }} style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", padding: "4px 8px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>EDIT</div>
                          <div onClick={() => deleteProgramDay(day.id, day.week, day.day)}
                            style={{ color: "var(--red-dim)", fontSize: 16, cursor: "pointer", padding: "4px 8px" }}>✕</div>
                        </div>
                      </div>
                      {dayExs.map(ex => (
                        <div key={ex.id} style={{ fontSize: 11, color: "var(--gray)", marginTop: 3 }}>
                          · {ex.name} — {ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ""}
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Recent workouts */}
          {clientWorkouts.length > 0 && (
            <div style={{ ...s.card, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>RECENT SESSIONS</div>
              {clientWorkouts.slice(0, 5).map((w, i) => {
                const col = { A: "#4a9eff", B: "#f0a020", C: "var(--red)" }[w.day] || "var(--red)";
                return (
                  <div key={i} onClick={() => { setSelectedSession(w); setCoachComment(w.coach_comment || ""); setView("sessions"); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                        <div style={{ ...s.badge(col), fontSize: 9 }}>DAY {w.day}</div>
                        <div style={{ fontSize: 10, color: "var(--gray2)", fontFamily: "'Barlow Condensed', sans-serif" }}>WK {w.week}</div>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                        {(w.workout_title || "").replace(/DAY [ABCD] — /, "")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray)" }}>{fmtDate(w.created_at)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {w.comment && <div style={{ fontSize: 10, color: "var(--accent)" }}>💬</div>}
                      {w.coach_comment && <div style={{ fontSize: 10, color: "var(--gold)" }}>🎯</div>}
                      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 4 }}>VIEW ›</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── BUILD MODE ── */}
      {buildMode && selectedClient && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 14, color: "var(--accent)" }}>
            {editingDay ? "✏️ EDIT PROGRAMME DAY" : "BUILD PROGRAMME DAY"}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}><label style={s.label}>WEEK</label><input type="number" min="1" max="12" value={buildWeek} onChange={e => setBuildWeek(+e.target.value)} style={s.input} /></div>
            <div style={{ flex: 1 }}><label style={s.label}>DAY</label><select value={buildDay} onChange={e => setBuildDay(e.target.value)} style={s.input}>{["A","B","C","D"].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          </div>
          <label style={s.label}>TITLE</label>
          <input value={buildTitle} onChange={e => setBuildTitle(e.target.value)} placeholder="e.g. Squat / Deadlift" style={{ ...s.input, marginBottom: 12 }} />
          <label style={s.label}>NOTES (optional)</label>
          <input value={buildNotes} onChange={e => setBuildNotes(e.target.value)} placeholder="Focus points for this session..." style={{ ...s.input, marginBottom: 12 }} />
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>EXERCISES</div>
          {buildExercises.map((ex, i) => (
            <div key={i} style={{ background: "var(--bg3)", borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input value={ex.name}
                  onChange={e => { const a=[...buildExercises]; a[i].name=e.target.value; setBuildExercises(a); }}
                  placeholder="Exercise name..."
                  style={{ ...s.input, flex: 2, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, marginBottom: 0 }} />
                <div onClick={() => { setLibraryPicker(i); loadLibraryList(); }}
                  style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "13px 10px", cursor: "pointer", flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>📚</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, alignSelf: "center" }}>
                  <div onClick={() => { if (i === 0) return; const a=[...buildExercises]; [a[i-1],a[i]]=[a[i],a[i-1]]; setBuildExercises(a); }}
                    style={{ color: i===0?"var(--bg4)":"var(--accent)", cursor:"pointer", fontSize:14, padding:"0 6px", lineHeight:1 }}>▲</div>
                  <div onClick={() => { if (i===buildExercises.length-1) return; const a=[...buildExercises]; [a[i],a[i+1]]=[a[i+1],a[i]]; setBuildExercises(a); }}
                    style={{ color: i===buildExercises.length-1?"var(--bg4)":"var(--accent)", cursor:"pointer", fontSize:14, padding:"0 6px", lineHeight:1 }}>▼</div>
                  <div onClick={() => setBuildExercises(buildExercises.filter((_,j)=>j!==i))}
                    style={{ color:"var(--red-dim)", cursor:"pointer", fontSize:14, padding:"0 6px", lineHeight:1 }}>✕</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["Sets","sets",1,20],["Reps","reps",1,100],["kg","weight",0,500]].map(([lbl,key,min,max]) => (
                  <div key={key} style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "var(--gray2)", marginBottom: 2 }}>{lbl}</div>
                    <input type="number" min={min} max={max} value={ex[key]}
                      onChange={e => { const a=[...buildExercises]; a[i][key]=+e.target.value; setBuildExercises(a); }}
                      style={{ ...s.input, padding: "8px 6px" }} />
                  </div>
                ))}
              </div>
              <input value={ex.notes} onChange={e => { const a=[...buildExercises]; a[i].notes=e.target.value; setBuildExercises(a); }}
                placeholder="Notes... e.g. per side, paused, RPE 8"
                style={{ ...s.input, marginTop: 6, fontSize: 12 }} />
            </div>
          ))}
          <button onClick={() => setBuildExercises([...buildExercises,{name:"",sets:3,reps:8,weight:0,notes:""}])}
            style={{ ...s.btnGhost, width: "100%", marginBottom: 10, fontSize: 12 }}>+ ADD EXERCISE</button>
          <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={saveProgramDay} disabled={saving}>
            {saving ? "SAVING..." : "SAVE PROGRAMME DAY"}
          </button>
          <button style={{ ...s.btnGhost, marginTop: 8 }} onClick={() => { setBuildMode(false); setEditingDay(null); }}>← CANCEL</button>
        </div>
      )}

      {/* ── SESSIONS VIEW ── */}
      {view === "sessions" && !selectedSession && !selectedClient && (
        <>
          <div style={s.sectionLabel}>SESSIONS BY ATHLETE</div>
          {athletes.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: 32 }}><div style={{ fontSize: 13, color: "var(--gray)" }}>No athletes yet</div></div>
          ) : athletes.map(a => {
            const aw = workouts.filter(w => w.user_id === a.id);
            const lastW = aw[0];
            const unread = aw.filter(w => w.comment && !w.coach_comment).length;
            return (
              <div key={a.id} onClick={() => setSelectedClient(a.id)}
                style={{ ...s.card, marginBottom: 8, cursor: "pointer", borderLeft: `3px solid ${unread > 0 ? "var(--gold)" : "var(--border)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 900, marginBottom: 3 }}>{a.name || "Athlete"}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>
                      {aw.length} session{aw.length !== 1 ? "s" : ""} total
                      {lastW ? ` · last: ${fmtDate(lastW.created_at)}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {unread > 0 && (
                      <div style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontSize: 10, padding: "3px 8px", borderRadius: 4, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                        {unread} NEEDS FEEDBACK
                      </div>
                    )}
                    <span style={{ color: "var(--gray2)", fontSize: 16 }}>›</span>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {view === "sessions" && !selectedSession && selectedClient && (() => {
        const a = clients.find(c => c.id === selectedClient);
        const aw = workouts.filter(w => w.user_id === selectedClient);
        return (
          <>
            <button onClick={() => setSelectedClient(null)} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 14 }}>← BACK</button>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{a?.name || "Athlete"}</div>
            <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 16 }}>{aw.length} sessions logged</div>
            {aw.length === 0 ? (
              <div style={{ ...s.card, textAlign: "center", padding: 32 }}><div style={{ fontSize: 13, color: "var(--gray)" }}>No sessions yet</div></div>
            ) : aw.map((w, i) => {
              const col = {A:"#4a9eff",B:"#f0a020",C:"var(--red)"}[w.day]||"var(--red)";
              const needsFeedback = w.comment && !w.coach_comment;
              return (
                <div key={i} onClick={() => { setSelectedSession(w); setCoachComment(w.coach_comment || ""); setCommentSaved(false); }}
                  style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${needsFeedback ? "var(--gold)" : col}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <div style={{ ...s.badge(col), fontSize: 10 }}>DAY {w.day}</div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {w.week}</div>
                        {needsFeedback && <div style={{ fontSize: 10, background: "rgba(201,168,76,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>NEEDS FEEDBACK</div>}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700 }}>
                        {(w.workout_title || "").replace(/DAY [ABCD] — /,"")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray)" }}>{fmtDate(w.created_at)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {w.comment && <div style={{ fontSize: 10, color: "var(--accent)" }}>💬 comment</div>}
                      {w.coach_comment && <div style={{ fontSize: 10, color: "var(--gold)" }}>🎯 feedback</div>}
                      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 4 }}>VIEW ›</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}

      {view === "sessions" && selectedSession && (() => {
        const w = selectedSession;
        const client = clients.find(c => c.id === w.user_id);
        const col = {A:"#4a9eff",B:"#f0a020",C:"var(--red)"}[w.day]||"var(--red)";
        return (
          <div>
            <button onClick={() => setSelectedSession(null)} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 14 }}>← BACK</button>
            <div style={{ ...s.card, borderLeft: `3px solid ${col}`, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <div style={{ ...s.badge(col), fontSize: 10 }}>DAY {w.day}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {w.week} · {fmtDate(w.created_at)}</div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>
                {(w.workout_title || "").replace(/DAY [ABCD] — /,"")}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>{client?.name || "Athlete"}</div>
            </div>
            {(w.exercises || []).map((ex, ei) => (
              <div key={ei} style={{ ...s.card, marginBottom: 8, borderLeft: `3px solid ${ex.done ? "var(--red)" : "var(--border)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ex.result ? 6 : 0 }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 900 }}>{ex.name}</div>
                    {ex.planned && <div style={{ fontSize: 11, color: "var(--gray2)" }}>Plan: {ex.planned.sets}×{ex.planned.reps} @ {ex.planned.weight}kg</div>}
                  </div>
                  <div style={{ fontSize: 12, color: ex.done ? "var(--red)" : "var(--gray2)", fontWeight: 700 }}>{ex.done ? "✓" : "—"}</div>
                </div>
                {ex.result && <div style={{ fontSize: 13, color: "var(--text)", background: "var(--bg3)", borderRadius: 5, padding: "6px 10px", lineHeight: 1.5 }}>{ex.result}</div>}
              </div>
            ))}
            {w.comment && (
              <div style={{ ...s.card, borderColor: "var(--red-dim)", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 6 }}>💬 ATHLETE COMMENT</div>
                <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, fontStyle: "italic" }}>{w.comment}</div>
              </div>
            )}
            {w.video_link && (
              <a href={w.video_link} target="_blank" rel="noopener noreferrer"
                style={{ ...s.card, display: "flex", alignItems: "center", gap: 10, marginBottom: 12, borderColor: "var(--gold-dim)", textDecoration: "none", cursor: "pointer" }}>
                <span style={{ fontSize: 24 }}>▶</span>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>WATCH VIDEO</div>
              </a>
            )}
            <div style={{ ...s.card, borderColor: "rgba(196,30,30,0.4)", background: "rgba(196,30,30,0.03)", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.15em", marginBottom: 8 }}>🎯 COACH FEEDBACK</div>
              {w.coach_comment && (
                <div style={{ fontSize: 13, color: "var(--gray)", fontStyle: "italic", background: "var(--bg3)", borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>{w.coach_comment}</div>
              )}
              <textarea value={coachComment} onChange={e => setCoachComment(e.target.value)}
                placeholder="Add or update feedback..." rows={3}
                style={{ ...s.input, resize: "none", lineHeight: 1.5, fontSize: 13, marginBottom: 10 }} />
              <button onClick={saveCoachComment} disabled={savingComment || !coachComment.trim()}
                style={{ ...s.btn, opacity: (savingComment || !coachComment.trim()) ? 0.5 : 1 }}>
                {commentSaved ? "✓ SENT" : savingComment ? "SAVING..." : "SEND FEEDBACK →"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── TEMPLATES ── */}
      {view === "templates" && !selectedClient && (
        <div>
          {tplMode === "list" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={s.sectionLabel}>PROGRAMME TEMPLATES</div>
                <button onClick={() => setTplMode("create")} style={{ ...s.btn, width: "auto", padding: "8px 16px", fontSize: 12 }}>+ NEW</button>
              </div>
              {templates.length === 0 ? (
                <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 6 }}>NO TEMPLATES YET</div>
                  <div style={{ fontSize: 13, color: "var(--gray)" }}>Create a template to quickly assign a programme to multiple athletes.</div>
                </div>
              ) : templates.map(tpl => (
                <div key={tpl.id} style={{ ...s.card, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900 }}>{tpl.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 2 }}>{(tpl.days || []).length} days</div>
                    </div>
                    <button onClick={() => { setSelectedTpl(tpl); setTplWeekStart(1); setTplAssignClients([]); setTplMode("assign"); }}
                      style={{ ...s.btn, width: "auto", padding: "8px 14px", fontSize: 11 }}>ASSIGN →</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {(tpl.days || []).map((d, di) => {
                      const col = { A: "#4a9eff", B: "#f0a020", C: "var(--red)", D: "#a78bfa" }[d.day] || "var(--red)";
                      return <div key={di} style={{ background: "var(--bg3)", borderRadius: 6, padding: "4px 10px", borderLeft: `2px solid ${col}`, fontSize: 11 }}>Day {d.day} — {d.title || "Untitled"}</div>;
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {tplMode === "create" && (
            <div>
              <button onClick={() => setTplMode("list")} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 16 }}>← BACK</button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 14, color: "var(--accent)" }}>CREATE TEMPLATE</div>
              <label style={s.label}>TEMPLATE NAME</label>
              <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. 8-Week Strength Block" style={{ ...s.input, marginBottom: 16 }} />
              {tplDays.map((tday, di) => (
                <div key={di} style={{ ...s.card, marginBottom: 12, borderColor: "var(--red-dim)" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>DAY</label>
                      <select value={tday.day} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, day: e.target.value } : d))} style={s.input}>
                        {["A","B","C","D"].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 3 }}>
                      <label style={s.label}>TITLE</label>
                      <input value={tday.title} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, title: e.target.value } : d))} placeholder="e.g. Squat / Deadlift" style={s.input} />
                    </div>
                    {tplDays.length > 1 && (
                      <div onClick={() => setTplDays(p => p.filter((_, i) => i !== di))} style={{ color: "var(--red-dim)", fontSize: 18, cursor: "pointer", padding: "24px 4px 0" }}>✕</div>
                    )}
                  </div>
                  {(tday.exercises || []).map((ex, ei) => (
                    <div key={ei} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                      <input value={ex.name} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, exercises: d.exercises.map((x, j) => j === ei ? { ...x, name: e.target.value } : x) } : d))} placeholder="Exercise" style={{ ...s.input, flex: 3, marginBottom: 0 }} />
                      <input type="number" value={ex.sets} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, exercises: d.exercises.map((x, j) => j === ei ? { ...x, sets: +e.target.value } : x) } : d))} style={{ ...s.input, width: 48, marginBottom: 0, textAlign: "center", padding: "10px 4px" }} />
                      <span style={{ fontSize: 11, color: "var(--gray2)" }}>×</span>
                      <input type="number" value={ex.reps} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, exercises: d.exercises.map((x, j) => j === ei ? { ...x, reps: +e.target.value } : x) } : d))} style={{ ...s.input, width: 48, marginBottom: 0, textAlign: "center", padding: "10px 4px" }} />
                      <input type="number" value={ex.weight} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, exercises: d.exercises.map((x, j) => j === ei ? { ...x, weight: +e.target.value } : x) } : d))} placeholder="kg" style={{ ...s.input, width: 52, marginBottom: 0, textAlign: "center", padding: "10px 4px" }} />
                      <div onClick={() => setTplDays(p => p.map((d, i) => i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d))} style={{ color: "var(--gray2)", fontSize: 14, cursor: "pointer", padding: "0 4px" }}>✕</div>
                    </div>
                  ))}
                  <button onClick={() => setTplDays(p => p.map((d, i) => i === di ? { ...d, exercises: [...d.exercises, { name: "", sets: 3, reps: 5, weight: 0 }] } : d))} style={{ ...s.btnGhost, fontSize: 11, padding: "6px 12px", marginTop: 4 }}>+ Exercise</button>
                </div>
              ))}
              <button onClick={() => setTplDays(p => [...p, { day: "B", title: "", notes: "", exercises: [{ name: "", sets: 3, reps: 5, weight: 0 }] }])} style={{ ...s.btnGhost, marginBottom: 12 }}>+ ADD DAY</button>
              <button onClick={saveTemplate} disabled={savingTpl || !tplName.trim()} style={{ ...s.btn, opacity: savingTpl || !tplName.trim() ? 0.5 : 1 }}>
                {savingTpl ? "SAVING..." : "SAVE TEMPLATE"}
              </button>
            </div>
          )}

          {tplMode === "assign" && selectedTpl && (
            <div>
              <button onClick={() => { setTplMode("list"); setSelectedTpl(null); }} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 16 }}>← BACK</button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 4, color: "var(--accent)" }}>ASSIGN: {selectedTpl.name.toUpperCase()}</div>
              <label style={s.label}>START WEEK</label>
              <input type="number" min="1" max="12" value={tplWeekStart} onChange={e => setTplWeekStart(+e.target.value)} style={{ ...s.input, marginBottom: 16 }} />
              <div style={{ fontSize: 11, color: "var(--gray2)", marginBottom: 16 }}>ℹ️ Existing sessions for this week will be overwritten.</div>
              <label style={s.label}>SELECT ATHLETES</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {athletes.map(a => {
                  const selected = tplAssignClients.includes(a.id);
                  return (
                    <div key={a.id} onClick={() => setTplAssignClients(p => selected ? p.filter(id => id !== a.id) : [...p, a.id])}
                      style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderColor: selected ? "var(--red)" : "var(--border)", padding: "12px 16px" }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>{a.name || a.email}</div>
                      <div style={{ width: 24, height: 24, borderRadius: 5, background: selected ? "var(--red)" : "var(--bg3)", border: `1px solid ${selected ? "var(--red)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                        {selected ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={assignTemplate} disabled={savingTpl || tplAssignClients.length === 0}
                style={{ ...s.btn, opacity: savingTpl || tplAssignClients.length === 0 ? 0.5 : 1 }}>
                {savingTpl ? "ASSIGNING..." : `ASSIGN TO ${tplAssignClients.length} ATHLETE${tplAssignClients.length !== 1 ? "S" : ""} →`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RANKS ── */}
      {view === "ranks" && !selectedClient && (
        <RanksCoachView athletes={athletes} authUser={{ id: "a6efb4f6-a5aa-4829-89c3-adb486cf187c" }} />
      )}

      {/* ── DIET ── */}
      {view === "diet" && !selectedClient && (
        <div>
          <div style={s.sectionLabel}>DIET PLANS</div>
          <label style={s.label}>SELECT ATHLETE</label>
          <select value={dietClient || ""} onChange={e => { setDietClient(e.target.value || null); setDietFiles([]); if (e.target.value) loadDietFiles(e.target.value); }}
            style={{ ...s.input, marginBottom: 16 }}>
            <option value="">— Choose athlete —</option>
            {athletes.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
          </select>
          {dietClient && (
            <>
              <div onClick={() => dietFileRef.current?.click()}
                style={{ ...s.card, borderColor: dietUploading ? "var(--red)" : "var(--border)", borderStyle: "dashed", textAlign: "center", padding: "28px 16px", cursor: "pointer", marginBottom: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{dietUploading ? "⏳" : "📄"}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, marginBottom: 4 }}>{dietUploading ? "UPLOADING..." : "TAP TO UPLOAD PDF"}</div>
                <div style={{ fontSize: 12, color: "var(--gray2)" }}>PDF only · Max 10MB</div>
              </div>
              <input ref={dietFileRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadDiet(f, dietClient); e.target.value = ""; }} />
              {dietError && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>⚠ {dietError}</div>}
              {dietFiles.map((f, i) => (
                <div key={i} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700 }}>📄 {f.file_name}</div>
                    <div style={{ fontSize: 11, color: "var(--gray2)" }}>{new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textDecoration: "none" }}>VIEW →</a>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── LIBRARY PICKER ── */}
      {libraryPicker !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end" }}
          onClick={() => setLibraryPicker(null)}>
          <div style={{ width: "100%", background: "var(--bg2)", borderRadius: "16px 16px 0 0", padding: 16, maxHeight: "75vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)" }}>PICK EXERCISE</div>
              <button onClick={() => setLibraryPicker(null)} style={{ background: "none", border: "none", color: "var(--gray)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <input value={libPickerSearch} onChange={e => setLibPickerSearch(e.target.value)} placeholder="Search..." style={{ ...s.input, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {["All","Squat","Hinge","Press","Pull","KB","Accessories"].map(cat => (
                <div key={cat} onClick={() => setLibPickerCat(cat)}
                  style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    background: libPickerCat === cat ? "var(--accent)" : "var(--bg3)", color: libPickerCat === cat ? "#fff" : "var(--gray)" }}>
                  {cat}
                </div>
              ))}
            </div>
            {libraryList
              .filter(e => (libPickerCat === "All" || e.category === libPickerCat) && e.name.toLowerCase().includes(libPickerSearch.toLowerCase()))
              .map((ex, i) => (
                <div key={i} onClick={() => {
                  const a = [...buildExercises]; a[libraryPicker].name = ex.name;
                  setBuildExercises(a); setLibraryPicker(null); setLibPickerSearch("");
                }} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray2)", background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>{ex.category}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
