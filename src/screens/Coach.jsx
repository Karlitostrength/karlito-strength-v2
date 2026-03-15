import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { sendPushToUser } from "../lib/push";
import { DOM_SILY_LEVELS } from "../constants/levels";
import { RanksCoachView } from "../components/RankComponents";


export function CoachScreen() {
  const [clients, setClients] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [view, setView] = useState("dashboard"); // dashboard | profile | sessions | addExercise
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: 10, weight: 0, rpe: 0, unit: "kg", notes: "", day: "A", week: 1 });
  const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [programDays, setProgramDays] = useState([]);
  const [buildMode, setBuildMode] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null); // workout object for detail view
  // Templates
  const [templates, setTemplates] = useState([]);
  const [tplMode, setTplMode] = useState("list"); // list | create | assign
  const [tplName, setTplName] = useState("");
  const [tplDays, setTplDays] = useState([{ day: "A", title: "", notes: "", exercises: [{ name: "", sets: 3, reps: 5, weight: 0 }] }]);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [tplWeekStart, setTplWeekStart] = useState(1);
  const [tplAssignClients, setTplAssignClients] = useState([]);
  const [savingTpl, setSavingTpl] = useState(false);
  // Diet
  const [dietClient, setDietClient] = useState(null);
  const [dietUploading, setDietUploading] = useState(false);
  const [dietFiles, setDietFiles] = useState([]);
  const [dietError, setDietError] = useState("");
  const dietFileRef = useRef(null);
  const [coachComment, setCoachComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);
  const [editingDay, setEditingDay] = useState(null); // { dayId, exIds[] } for edit mode
  const [buildWeek, setBuildWeek] = useState(1);
  const [buildDay, setBuildDay] = useState("A");
  const [buildTitle, setBuildTitle] = useState("");
  const [buildNotes, setBuildNotes] = useState("");
  const [buildExercises, setBuildExercises] = useState([
    { name: "", sets: 3, reps: 8, weight: 0, notes: "" }
  ]);
  const [libraryPicker, setLibraryPicker] = useState(null); // index of exercise being picked
  const [libraryList, setLibraryList] = useState([]);
  const [libPickerCat, setLibPickerCat] = useState("All");
  const [libPickerSearch, setLibPickerSearch] = useState("");
  const [copyWeekFrom, setCopyWeekFrom] = useState(1);
  const [copyWeekTo, setCopyWeekTo] = useState(2);
  const [copyingWeek, setCopyingWeek] = useState(false);
  const [showCopyWeek, setShowCopyWeek] = useState(false);

  const loadTemplates = async () => {
    const { data } = await supabase.from("program_templates")
      .select("*").order("created_at", { ascending: false });
    setTemplates(data || []);
  };

  const saveTemplate = async () => {
    if (!tplName.trim()) return;
    setSavingTpl(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const { data: tpl } = await supabase.from("program_templates").insert({
        coach_id: au.id,
        name: tplName,
        days: tplDays,
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
          const { data: newDay } = await supabase.from("program_days").insert({
            coach_id: au.id, athlete_id: clientId,
            week: tplWeekStart, day: tday.day,
            title: tday.title || selectedTpl.name, notes: tday.notes || "",
          }).select().single();
          if (newDay) {
            for (const ex of (tday.exercises || []).filter(e => e.name?.trim())) {
              await supabase.from("custom_exercises").insert({
                coach_id: au.id, athlete_id: clientId,
                name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
                day: tday.day, week: tplWeekStart,
              });
            }
          }
          sendPushToUser(clientId, "💪 New program from Coach Karlito", `Week ${tplWeekStart} — ${selectedTpl.name}`, "program", "/");
        }
      }
      setTplMode("list");
      setSelectedTpl(null);
      setTplAssignClients([]);
      await loadData();
    } catch(e) { console.log("Assign template error:", e); }
    setSavingTpl(false);
  };

  // ── Built-in DOM SIŁY 8-week programs — per level ──────────────────────────
  const DOM_SILY_8WK = {
    beginner: [
      // FUNDAMENTALS Wk 1-2 — 5×8 paused, basic KB
      { week:1, day:"A", title:"FUNDAMENTALS — Squat", exercises:[
        { name:"Squat (paused 2s)",        sets:5, reps:8,  weight:0, rpe:7 },
        { name:"Reverse Lunge",             sets:3, reps:8,  weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:20, unit:"sec" },
        { name:"KB Swing 2H",               sets:3, reps:10, weight:0 },
      ]},
      { week:1, day:"B", title:"FUNDAMENTALS — Deadlift", exercises:[
        { name:"Deadlift (paused at knee)", sets:5, reps:5,  weight:0, rpe:7 },
        { name:"KB Clean",                  sets:5, reps:5,  weight:0 },
        { name:"Farmer Carry 30m",          sets:3, reps:1,  weight:0 },
        { name:"KB Press",                  sets:5, reps:5,  weight:0 },
      ]},
      { week:1, day:"C", title:"FUNDAMENTALS — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:5, reps:8,  weight:0, rpe:7 },
        { name:"Push Up + Gorilla Row",     sets:3, reps:8,  weight:0 },
        { name:"Ab Wheel",                  sets:3, reps:8,  weight:0 },
      ]},
      { week:2, day:"A", title:"FUNDAMENTALS — Squat", exercises:[
        { name:"Squat (paused 2s)",        sets:5, reps:8,  weight:0, rpe:7 },
        { name:"Reverse Lunge",             sets:3, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:25, unit:"sec" },
        { name:"KB Swing 2H",               sets:3, reps:12, weight:0 },
      ]},
      { week:2, day:"B", title:"FUNDAMENTALS — Deadlift", exercises:[
        { name:"Deadlift (paused at knee)", sets:5, reps:5,  weight:0, rpe:7 },
        { name:"KB Clean",                  sets:5, reps:5,  weight:0 },
        { name:"Farmer Carry 30m",          sets:3, reps:1,  weight:0 },
        { name:"KB Press",                  sets:5, reps:5,  weight:0 },
      ]},
      { week:2, day:"C", title:"FUNDAMENTALS — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:5, reps:8,  weight:0, rpe:7 },
        { name:"Push Up + Gorilla Row",     sets:3, reps:10, weight:0 },
        { name:"Ab Wheel",                  sets:3, reps:10, weight:0 },
      ]},
      // BUILDING Wk 3-4 — 6×6
      { week:3, day:"A", title:"BUILDING — Squat", exercises:[
        { name:"Squat (paused)",            sets:6, reps:6,  weight:0, rpe:7 },
        { name:"Reverse Lunge",             sets:3, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:30, unit:"sec" },
        { name:"KB Swing 2H",               sets:3, reps:12, weight:0 },
      ]},
      { week:3, day:"B", title:"BUILDING — Deadlift", exercises:[
        { name:"Deadlift (paused)",         sets:6, reps:6,  weight:0, rpe:7 },
        { name:"KB Clean",                  sets:5, reps:5,  weight:0 },
        { name:"Farmer Carry 30m",          sets:3, reps:1,  weight:0 },
        { name:"KB Press",                  sets:5, reps:5,  weight:0 },
      ]},
      { week:3, day:"C", title:"BUILDING — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:6, reps:6,  weight:0, rpe:7 },
        { name:"Push Up + Gorilla Row",     sets:4, reps:10, weight:0 },
        { name:"Ab Wheel",                  sets:3, reps:12, weight:0 },
      ]},
      { week:4, day:"A", title:"BUILDING — Squat", exercises:[
        { name:"Squat (paused)",            sets:6, reps:6,  weight:0, rpe:8 },
        { name:"Reverse Lunge",             sets:3, reps:12, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:30, unit:"sec" },
        { name:"KB Swing 2H",               sets:4, reps:12, weight:0 },
      ]},
      { week:4, day:"B", title:"BUILDING — Deadlift", exercises:[
        { name:"Deadlift (paused)",         sets:6, reps:6,  weight:0, rpe:8 },
        { name:"KB Clean",                  sets:5, reps:5,  weight:0 },
        { name:"Farmer Carry 30m",          sets:4, reps:1,  weight:0 },
        { name:"KB Press",                  sets:5, reps:5,  weight:0 },
      ]},
      { week:4, day:"C", title:"BUILDING — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:6, reps:6,  weight:0, rpe:8 },
        { name:"Push Up + Gorilla Row",     sets:4, reps:12, weight:0 },
        { name:"Ab Wheel",                  sets:4, reps:12, weight:0 },
      ]},
      // STRENGTH Wk 5-6 — 5×5
      { week:5, day:"A", title:"STRENGTH — Squat", exercises:[
        { name:"Squat",                     sets:5, reps:5,  weight:0, rpe:8 },
        { name:"Reverse Lunge",             sets:3, reps:8,  weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:30, unit:"sec" },
        { name:"KB Swing 2H",               sets:4, reps:10, weight:0 },
      ]},
      { week:5, day:"B", title:"STRENGTH — Deadlift", exercises:[
        { name:"Deadlift",                  sets:5, reps:5,  weight:0, rpe:8 },
        { name:"KB Clean + Press",          sets:4, reps:5,  weight:0 },
        { name:"Farmer Carry 30m",          sets:3, reps:1,  weight:0 },
        { name:"Pull Ups / Rows",           sets:3, reps:8,  weight:0 },
      ]},
      { week:5, day:"C", title:"STRENGTH — Bench", exercises:[
        { name:"Bench Press",               sets:5, reps:5,  weight:0, rpe:8 },
        { name:"Dips",                      sets:3, reps:10, weight:0 },
        { name:"Pull Ups / Rows",           sets:3, reps:8,  weight:0 },
      ]},
      { week:6, day:"A", title:"STRENGTH — Squat", exercises:[
        { name:"Squat",                     sets:5, reps:5,  weight:0, rpe:8 },
        { name:"Reverse Lunge",             sets:3, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:35, unit:"sec" },
        { name:"KB Swing 2H",               sets:4, reps:12, weight:0 },
      ]},
      { week:6, day:"B", title:"STRENGTH — Deadlift", exercises:[
        { name:"Deadlift",                  sets:5, reps:5,  weight:0, rpe:8 },
        { name:"KB Clean + Press",          sets:4, reps:5,  weight:0 },
        { name:"Farmer Carry 30m",          sets:4, reps:1,  weight:0 },
        { name:"Pull Ups / Rows",           sets:3, reps:10, weight:0 },
      ]},
      { week:6, day:"C", title:"STRENGTH — Bench", exercises:[
        { name:"Bench Press",               sets:5, reps:5,  weight:0, rpe:8 },
        { name:"Dips",                      sets:3, reps:12, weight:0 },
        { name:"Pull Ups / Rows",           sets:3, reps:10, weight:0 },
      ]},
      // PEAK Wk 7-8 — 5×3
      { week:7, day:"A", title:"PEAK — Squat", exercises:[
        { name:"Squat",                     sets:5, reps:3,  weight:0, rpe:9 },
        { name:"Reverse Lunge",             sets:3, reps:6,  weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:30, unit:"sec" },
        { name:"KB Swing 2H",               sets:3, reps:8,  weight:0 },
      ]},
      { week:7, day:"B", title:"PEAK — Deadlift", exercises:[
        { name:"Deadlift",                  sets:5, reps:3,  weight:0, rpe:9 },
        { name:"KB Clean + Press",          sets:4, reps:4,  weight:0 },
        { name:"Farmer Carry 30m",          sets:3, reps:1,  weight:0 },
        { name:"Pull Ups / Rows",           sets:3, reps:6,  weight:0 },
      ]},
      { week:7, day:"C", title:"PEAK — Bench", exercises:[
        { name:"Bench Press",               sets:5, reps:3,  weight:0, rpe:9 },
        { name:"Dips",                      sets:3, reps:8,  weight:0 },
        { name:"Pull Ups",                  sets:3, reps:6,  weight:0 },
      ]},
      { week:8, day:"A", title:"PEAK — Squat", exercises:[
        { name:"Squat",                     sets:5, reps:2,  weight:0, rpe:9 },
        { name:"Reverse Lunge",             sets:2, reps:5,  weight:0 },
        { name:"Copenhagen Plank",          sets:2, reps:25, unit:"sec" },
      ]},
      { week:8, day:"B", title:"PEAK — Deadlift", exercises:[
        { name:"Deadlift",                  sets:5, reps:2,  weight:0, rpe:9 },
        { name:"KB Clean + Press",          sets:3, reps:3,  weight:0 },
        { name:"Farmer Carry 30m",          sets:2, reps:1,  weight:0 },
      ]},
      { week:8, day:"C", title:"PEAK — Bench", exercises:[
        { name:"Bench Press",               sets:5, reps:2,  weight:0, rpe:9 },
        { name:"Weighted Dips",             sets:3, reps:5,  weight:0 },
        { name:"Weighted Pull Ups",         sets:3, reps:5,  weight:0 },
      ]},
    ],

    intermediate: [
      // FUNDAMENTALS Wk 1-2 — 5×5 paused, heavier KB
      { week:1, day:"A", title:"FUNDAMENTALS — Squat", exercises:[
        { name:"Paused Back Squat",         sets:5, reps:5,  weight:0, rpe:7 },
        { name:"Goblet Hold Reverse Lunge", sets:3, reps:8,  weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:25, unit:"sec" },
        { name:"KB Single Arm Swing",       sets:4, reps:10, weight:0, notes:"per side" },
      ]},
      { week:1, day:"B", title:"FUNDAMENTALS — Deadlift", exercises:[
        { name:"Deadlift (paused at knee)", sets:5, reps:5,  weight:0, rpe:7 },
        { name:"KB Clean",                  sets:5, reps:5,  weight:0, notes:"per side" },
        { name:"Suitcase Carry 15m",        sets:3, reps:1,  weight:0, notes:"per side" },
        { name:"KB Press",                  sets:5, reps:5,  weight:0, notes:"per side" },
      ]},
      { week:1, day:"C", title:"FUNDAMENTALS — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:5, reps:5,  weight:0, rpe:7 },
        { name:"Turkish Get Up",            sets:5, reps:1,  weight:0, notes:"quality — per side EMOM" },
        { name:"Push Up + Gorilla Row",     sets:4, reps:10, weight:0 },
        { name:"Ab Wheel",                  sets:3, reps:10, weight:0 },
      ]},
      { week:2, day:"A", title:"FUNDAMENTALS — Squat", exercises:[
        { name:"Paused Back Squat",         sets:5, reps:5,  weight:0, rpe:7 },
        { name:"Goblet Hold Reverse Lunge", sets:3, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:30, unit:"sec" },
        { name:"KB Single Arm Swing",       sets:4, reps:12, weight:0, notes:"per side" },
      ]},
      { week:2, day:"B", title:"FUNDAMENTALS — Deadlift", exercises:[
        { name:"Deadlift (paused at knee)", sets:5, reps:5,  weight:0, rpe:7 },
        { name:"KB Clean",                  sets:5, reps:5,  weight:0, notes:"per side" },
        { name:"Suitcase Carry 15m",        sets:4, reps:1,  weight:0, notes:"per side" },
        { name:"KB Press",                  sets:5, reps:5,  weight:0, notes:"per side" },
      ]},
      { week:2, day:"C", title:"FUNDAMENTALS — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:5, reps:5,  weight:0, rpe:7 },
        { name:"Turkish Get Up",            sets:5, reps:1,  weight:0, notes:"quality — per side EMOM" },
        { name:"Push Up + Gorilla Row",     sets:4, reps:12, weight:0 },
        { name:"Ab Wheel",                  sets:3, reps:12, weight:0 },
      ]},
      // BUILDING Wk 3-4 — 5×4 paused, more volume
      { week:3, day:"A", title:"BUILDING — Squat", exercises:[
        { name:"Paused Back Squat",         sets:5, reps:4,  weight:0, rpe:7 },
        { name:"Goblet Hold Reverse Lunge", sets:3, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:30, unit:"sec" },
        { name:"KB Single Arm Swing",       sets:5, reps:10, weight:0, notes:"per side" },
      ]},
      { week:3, day:"B", title:"BUILDING — Deadlift", exercises:[
        { name:"Paused Deadlift",           sets:5, reps:4,  weight:0, rpe:7 },
        { name:"KB Clean + Press",          sets:5, reps:5,  weight:0, notes:"per side" },
        { name:"Suitcase Carry 15m",        sets:4, reps:1,  weight:0, notes:"per side" },
        { name:"Hollow Hold",               sets:3, reps:30, unit:"sec" },
      ]},
      { week:3, day:"C", title:"BUILDING — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:5, reps:4,  weight:0, rpe:7 },
        { name:"Turkish Get Up",            sets:5, reps:1,  weight:0, notes:"EMOM" },
        { name:"Dips",                      sets:3, reps:10, weight:0 },
        { name:"Pull Ups",                  sets:3, reps:8,  weight:0 },
      ]},
      { week:4, day:"A", title:"BUILDING — Squat", exercises:[
        { name:"Paused Back Squat",         sets:5, reps:4,  weight:0, rpe:8 },
        { name:"Goblet Hold Reverse Lunge", sets:4, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:35, unit:"sec" },
        { name:"KB Single Arm Swing",       sets:5, reps:12, weight:0, notes:"per side" },
      ]},
      { week:4, day:"B", title:"BUILDING — Deadlift", exercises:[
        { name:"Paused Deadlift",           sets:5, reps:4,  weight:0, rpe:8 },
        { name:"KB Clean + Press",          sets:5, reps:5,  weight:0, notes:"per side" },
        { name:"Suitcase Carry 15m",        sets:4, reps:1,  weight:0, notes:"per side" },
        { name:"Hollow Hold",               sets:3, reps:35, unit:"sec" },
      ]},
      { week:4, day:"C", title:"BUILDING — Bench", exercises:[
        { name:"Bench Press (paused)",      sets:5, reps:4,  weight:0, rpe:8 },
        { name:"Turkish Get Up",            sets:5, reps:1,  weight:0, notes:"EMOM" },
        { name:"Dips",                      sets:4, reps:10, weight:0 },
        { name:"Pull Ups",                  sets:4, reps:8,  weight:0 },
      ]},
      // STRENGTH Wk 5-6 — 5×3 comp
      { week:5, day:"A", title:"STRENGTH — Squat", exercises:[
        { name:"Back Squat",                sets:5, reps:3,  weight:0, rpe:8 },
        { name:"Reverse Lunge",             sets:4, reps:8,  weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:35, unit:"sec" },
        { name:"KB Single Arm Swing",       sets:5, reps:10, weight:0, notes:"per side" },
      ]},
      { week:5, day:"B", title:"STRENGTH — Deadlift", exercises:[
        { name:"Deadlift",                  sets:5, reps:3,  weight:0, rpe:8 },
        { name:"Double KB Clean + Press",   sets:4, reps:5,  weight:0 },
        { name:"Front Rack Carry 30m",      sets:3, reps:1,  weight:0 },
        { name:"Pull Ups",                  sets:3, reps:8,  weight:0 },
      ]},
      { week:5, day:"C", title:"STRENGTH — Bench", exercises:[
        { name:"Bench Press",               sets:5, reps:3,  weight:0, rpe:8 },
        { name:"Turkish Get Up",            sets:5, reps:1,  weight:0, notes:"EMOM" },
        { name:"Dips",                      sets:3, reps:12, weight:0 },
        { name:"Pull Ups",                  sets:3, reps:10, weight:0 },
      ]},
      { week:6, day:"A", title:"STRENGTH — Squat", exercises:[
        { name:"Back Squat",                sets:5, reps:3,  weight:0, rpe:8 },
        { name:"Reverse Lunge",             sets:4, reps:10, weight:0 },
        { name:"Copenhagen Plank",          sets:3, reps:40, unit:"sec" },
        { name:"KB Single Arm Swing",       sets:5, reps:12, weight:0, notes:"per side" },
      ]},
      { week:6, day:"B", title:"STRENGTH — Deadlift", exercises:[
        { name:"Deadlift",                  sets:5, reps:3,  weight:0, rpe:8 },
        { name:"Double KB Clean + Press",   sets:4, reps:5,  weight:0 },
        { name:"Front Rack Carry 30m",      sets:4, reps:1,  weight:0 },
        { name:"Pull Ups",                  sets:3, reps:10, weight:0 },
      ]},
      { week:6, day:"C", title:"STRENGTH — Bench", exercises:[
        { name:"Bench Press",               sets:5, reps:3,  weight:0, rpe:8 },
        { name:"Turkish Get Up",            sets:5, reps:1,  weight:0, notes:"EMOM" },
        { name:"Weighted Dips",             sets:3, reps:8,  weight:0 },
        { name:"Weighted Pull Ups",         sets:3, reps:6,  weight:0 },
      ]},
      // PEAK Wk 7-8 — 3×2-3 heavy
      { week:7, day:"A", title:"PEAK — Squat", exercises:[
        { name:"Back Squat",                sets:4, reps:2,  weight:0, rpe:9 },
        { name:"Reverse Lunge",             sets:3, reps:6,  weight:0 },
        { name:"Copenhagen Side Plank",     sets:3, reps:25, unit:"sec" },
      ]},
      { week:7, day:"B", title:"PEAK — Deadlift", exercises:[
        { name:"Deadlift",                  sets:4, reps:2,  weight:0, rpe:9 },
        { name:"Double KB Clean + Press",   sets:3, reps:4,  weight:0 },
        { name:"Farmer Carry 30m",          sets:3, reps:1,  weight:0 },
      ]},
      { week:7, day:"C", title:"PEAK — Bench", exercises:[
        { name:"Bench Press",               sets:4, reps:2,  weight:0, rpe:9 },
        { name:"Weighted Dips",             sets:3, reps:6,  weight:0 },
        { name:"Weighted Pull Ups",         sets:3, reps:6,  weight:0 },
      ]},
      { week:8, day:"A", title:"PEAK — Squat", exercises:[
        { name:"Back Squat",                sets:3, reps:1,  weight:0, rpe:9, notes:"build to heavy single" },
        { name:"Back Squat (back-off)",     sets:3, reps:3,  weight:0, notes:"~85% of today's single" },
      ]},
      { week:8, day:"B", title:"PEAK — Deadlift", exercises:[
        { name:"Deadlift",                  sets:3, reps:1,  weight:0, rpe:9, notes:"build to heavy single" },
        { name:"Deadlift (back-off)",       sets:3, reps:3,  weight:0, notes:"~85% of today's single" },
      ]},
      { week:8, day:"C", title:"PEAK — Bench", exercises:[
        { name:"Bench Press",               sets:3, reps:1,  weight:0, rpe:9, notes:"build to heavy single" },
        { name:"Bench Press (back-off)",    sets:3, reps:3,  weight:0, notes:"~85% of today's single" },
        { name:"Weighted Dips",             sets:3, reps:5,  weight:0 },
        { name:"Weighted Pull Ups",         sets:3, reps:5,  weight:0 },
      ]},
    ],

    advanced: [
      // FUNDAMENTALS Wk 1-2 — 6×4 paused, complex KB
      { week:1, day:"A", title:"FUNDAMENTALS — Squat", exercises:[
        { name:"Paused Back Squat",               sets:6, reps:4, weight:0, rpe:7 },
        { name:"Double KB Front Rack Reverse Lunge", sets:3, reps:6, weight:0, notes:"per side" },
        { name:"Copenhagen Side Plank",           sets:3, reps:25, unit:"sec" },
        { name:"KB Snatch",                       sets:5, reps:10, weight:0, notes:"per side EMOM" },
      ]},
      { week:1, day:"B", title:"FUNDAMENTALS — Deadlift", exercises:[
        { name:"Deadlift (paused below knee)",    sets:6, reps:4, weight:0, rpe:7 },
        { name:"Double KB Clean + Press",         sets:5, reps:5, weight:0 },
        { name:"Suitcase Carry 15m",              sets:4, reps:1, weight:0, notes:"per side — heavy" },
        { name:"Pull Ups",                        sets:4, reps:8, weight:0 },
      ]},
      { week:1, day:"C", title:"FUNDAMENTALS — Bench", exercises:[
        { name:"Paused Bench Press",              sets:6, reps:4, weight:0, rpe:7 },
        { name:"Turkish Get Up",                  sets:5, reps:1, weight:0, notes:"EMOM — quality" },
        { name:"Dips + Pull Ups (50+50 total)",   sets:1, reps:50, weight:0 },
        { name:"KB Snatch Finisher 10/10",        sets:3, reps:10, weight:0, notes:"per side" },
      ]},
      { week:2, day:"A", title:"FUNDAMENTALS — Squat", exercises:[
        { name:"Paused Back Squat",               sets:6, reps:4, weight:0, rpe:7 },
        { name:"Double KB Front Rack Reverse Lunge", sets:3, reps:8, weight:0, notes:"per side" },
        { name:"Copenhagen Side Plank",           sets:3, reps:30, unit:"sec" },
        { name:"KB Snatch",                       sets:5, reps:12, weight:0, notes:"per side EMOM" },
      ]},
      { week:2, day:"B", title:"FUNDAMENTALS — Deadlift", exercises:[
        { name:"Deadlift (paused below knee)",    sets:6, reps:4, weight:0, rpe:7 },
        { name:"Double KB Clean + Press",         sets:5, reps:5, weight:0 },
        { name:"Suitcase Carry 15m",              sets:4, reps:1, weight:0, notes:"per side — heavy" },
        { name:"Weighted Pull Ups",               sets:4, reps:6, weight:0 },
      ]},
      { week:2, day:"C", title:"FUNDAMENTALS — Bench", exercises:[
        { name:"Paused Bench Press",              sets:6, reps:4, weight:0, rpe:7 },
        { name:"Turkish Get Up",                  sets:5, reps:1, weight:0, notes:"EMOM — quality" },
        { name:"Dips + Pull Ups (50+50 total)",   sets:1, reps:50, weight:0 },
        { name:"KB Snatch Finisher 12/12",        sets:3, reps:12, weight:0, notes:"per side" },
      ]},
      // BUILDING Wk 3-4 — 5×3 paused heavy
      { week:3, day:"A", title:"BUILDING — Squat", exercises:[
        { name:"Paused Back Squat",               sets:5, reps:3, weight:0, rpe:8 },
        { name:"Double KB Front Rack Reverse Lunge", sets:4, reps:6, weight:0, notes:"per side" },
        { name:"Copenhagen Side Plank",           sets:3, reps:30, unit:"sec" },
        { name:"KB Snatch",                       sets:5, reps:15, weight:0, notes:"per side" },
      ]},
      { week:3, day:"B", title:"BUILDING — Deadlift", exercises:[
        { name:"Paused Deadlift",                 sets:5, reps:3, weight:0, rpe:8 },
        { name:"Double KB Clean + Press",         sets:5, reps:5, weight:0 },
        { name:"Front Rack Carry 30m",            sets:4, reps:1, weight:0 },
        { name:"Weighted Pull Ups",               sets:4, reps:6, weight:0 },
      ]},
      { week:3, day:"C", title:"BUILDING — Bench", exercises:[
        { name:"Paused Bench Press",              sets:5, reps:3, weight:0, rpe:8 },
        { name:"Turkish Get Up",                  sets:5, reps:1, weight:0, notes:"EMOM — heavier" },
        { name:"Dips + Pull Ups (70+70 total)",   sets:1, reps:70, weight:0 },
        { name:"KB Snatch Finisher 15/15",        sets:3, reps:15, weight:0, notes:"per side" },
      ]},
      { week:4, day:"A", title:"BUILDING — Squat", exercises:[
        { name:"Paused Back Squat",               sets:5, reps:3, weight:0, rpe:8 },
        { name:"Double KB Front Rack Reverse Lunge", sets:4, reps:8, weight:0, notes:"per side" },
        { name:"Copenhagen Side Plank",           sets:3, reps:35, unit:"sec" },
        { name:"KB Snatch",                       sets:6, reps:15, weight:0, notes:"per side" },
      ]},
      { week:4, day:"B", title:"BUILDING — Deadlift", exercises:[
        { name:"Paused Deadlift",                 sets:5, reps:3, weight:0, rpe:8 },
        { name:"Double KB Clean + Press",         sets:5, reps:5, weight:0 },
        { name:"Front Rack Carry 30m",            sets:5, reps:1, weight:0 },
        { name:"Weighted Pull Ups",               sets:4, reps:8, weight:0 },
      ]},
      { week:4, day:"C", title:"BUILDING — Bench", exercises:[
        { name:"Paused Bench Press",              sets:5, reps:3, weight:0, rpe:8 },
        { name:"Turkish Get Up",                  sets:5, reps:1, weight:0, notes:"EMOM — heavier" },
        { name:"Dips + Pull Ups (70+70 total)",   sets:1, reps:70, weight:0 },
        { name:"KB Snatch Finisher 15/15",        sets:4, reps:15, weight:0, notes:"per side" },
      ]},
      // STRENGTH Wk 5-6 — heavy singles + back-off
      { week:5, day:"A", title:"STRENGTH — Squat", exercises:[
        { name:"Back Squat",                      sets:5, reps:2, weight:0, rpe:9 },
        { name:"Back Squat (back-off)",           sets:3, reps:5, weight:0, notes:"~80%" },
        { name:"Double KB Front Rack Reverse Lunge", sets:3, reps:6, weight:0 },
        { name:"KB Snatch",                       sets:5, reps:20, weight:0, notes:"per side" },
      ]},
      { week:5, day:"B", title:"STRENGTH — Deadlift", exercises:[
        { name:"Deadlift",                        sets:5, reps:2, weight:0, rpe:9 },
        { name:"Deadlift (speed)",                sets:5, reps:3, weight:0, notes:"~70% — fast" },
        { name:"Double KB Clean + Press",         sets:5, reps:5, weight:0 },
        { name:"Farmer Carry 30m",                sets:4, reps:1, weight:0, notes:"bodyweight/hand" },
        { name:"Weighted Pull Ups",               sets:4, reps:5, weight:0 },
      ]},
      { week:5, day:"C", title:"STRENGTH — Bench", exercises:[
        { name:"Bench Press",                     sets:5, reps:2, weight:0, rpe:9 },
        { name:"Bench Press (back-off)",          sets:3, reps:5, weight:0, notes:"~80%" },
        { name:"Turkish Get Up",                  sets:5, reps:1, weight:0, notes:"EMOM" },
        { name:"Weighted Dips",                   sets:3, reps:8, weight:0 },
        { name:"Weighted Pull Ups",               sets:3, reps:8, weight:0 },
      ]},
      { week:6, day:"A", title:"STRENGTH — Squat", exercises:[
        { name:"Back Squat",                      sets:4, reps:2, weight:0, rpe:9 },
        { name:"Back Squat (back-off)",           sets:3, reps:4, weight:0, notes:"~82%" },
        { name:"Double KB Front Rack Reverse Lunge", sets:3, reps:8, weight:0 },
        { name:"KB Snatch",                       sets:5, reps:20, weight:0, notes:"per side" },
      ]},
      { week:6, day:"B", title:"STRENGTH — Deadlift", exercises:[
        { name:"Deadlift",                        sets:4, reps:2, weight:0, rpe:9 },
        { name:"Deadlift (speed)",                sets:5, reps:3, weight:0, notes:"~72% — fast" },
        { name:"Double KB Clean + Press",         sets:5, reps:5, weight:0 },
        { name:"Farmer Carry 30m",                sets:4, reps:1, weight:0, notes:"bodyweight/hand" },
        { name:"Weighted Pull Ups",               sets:4, reps:6, weight:0 },
      ]},
      { week:6, day:"C", title:"STRENGTH — Bench", exercises:[
        { name:"Bench Press",                     sets:4, reps:2, weight:0, rpe:9 },
        { name:"Bench Press (back-off)",          sets:3, reps:4, weight:0, notes:"~82%" },
        { name:"Turkish Get Up",                  sets:5, reps:1, weight:0, notes:"EMOM" },
        { name:"Weighted Dips",                   sets:3, reps:6, weight:0 },
        { name:"Weighted Pull Ups",               sets:3, reps:6, weight:0 },
      ]},
      // PEAK Wk 7-8 — competition prep
      { week:7, day:"A", title:"PEAK — Squat", exercises:[
        { name:"Back Squat",                      sets:3, reps:2, weight:0, rpe:9 },
        { name:"Back Squat (opener prep)",        sets:2, reps:1, weight:0, notes:"opener weight" },
      ]},
      { week:7, day:"B", title:"PEAK — Deadlift", exercises:[
        { name:"Deadlift",                        sets:3, reps:2, weight:0, rpe:9 },
        { name:"Deadlift (opener prep)",          sets:2, reps:1, weight:0, notes:"opener weight" },
        { name:"KB Snatch",                       sets:3, reps:20, weight:0, notes:"per side — conditioning" },
      ]},
      { week:7, day:"C", title:"PEAK — Bench", exercises:[
        { name:"Bench Press",                     sets:3, reps:2, weight:0, rpe:9 },
        { name:"Bench Press (opener prep)",       sets:2, reps:1, weight:0, notes:"opener weight" },
        { name:"Weighted Dips",                   sets:3, reps:5, weight:0 },
        { name:"Weighted Pull Ups",               sets:3, reps:5, weight:0 },
      ]},
      { week:8, day:"A", title:"PEAK — Squat", exercises:[
        { name:"Back Squat",                      sets:2, reps:1, weight:0, rpe:8, notes:"~90% — feel opener" },
      ]},
      { week:8, day:"B", title:"PEAK — Deadlift", exercises:[
        { name:"Deadlift",                        sets:2, reps:1, weight:0, rpe:8, notes:"~90% — feel opener" },
      ]},
      { week:8, day:"C", title:"PEAK — Bench", exercises:[
        { name:"Bench Press",                     sets:2, reps:1, weight:0, rpe:8, notes:"~90% — feel opener" },
        { name:"Weighted Dips",                   sets:2, reps:5, weight:0 },
        { name:"Weighted Pull Ups",               sets:2, reps:5, weight:0 },
      ]},
    ],
  };

  const [assign8wkClients, setAssign8wkClients] = useState([]);
  const [assign8wkLevel, setAssign8wkLevel] = useState("beginner");

  const assign8WeekProgram = async () => {
    if (assign8wkClients.length === 0) return;
    const lvl = assign8wkLevel;
    setSavingTpl(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      let exInsertErrors = 0;
      for (const clientId of assign8wkClients) {
        // Usuń stary program jeśli istnieje (unikamy duplikatów)
        await supabase.from("custom_exercises").delete().eq("athlete_id", clientId);
        await supabase.from("program_days").delete().eq("athlete_id", clientId);
        const programData = DOM_SILY_8WK[lvl] || DOM_SILY_8WK.beginner;
        for (const d of programData) {
          const { error: dayErr } = await supabase.from("program_days").insert({
            coach_id: au.id, athlete_id: clientId,
            week: d.week, day: d.day, title: d.title, notes: "",
          });
          if (dayErr) { console.error("program_days insert error:", dayErr); continue; }
          for (const ex of d.exercises) {
            const { error: exErr } = await supabase.from("custom_exercises").insert({
              coach_id: au.id, athlete_id: clientId,
              name: ex.name, sets: ex.sets, reps: ex.reps,
              weight: ex.weight || 0,
              notes: ex.notes || "",
              day: d.day, week: d.week,
            });
            if (exErr) { console.error("custom_exercises insert error:", JSON.stringify(exErr), "data:", {name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, day: d.day, week: d.week}); exInsertErrors++; }
          }
        }
        sendPushToUser(clientId, "💪 DOM SIŁY 8-Week Program assigned!", "Your full 8-week program is ready — start Week 1", "program", "/");
      }
      if (exInsertErrors > 0) { alert(`⚠️ Program assigned but ${exInsertErrors} exercises failed to save. Check console for details.`); return; }
      setTplMode("list");
      setAssign8wkClients([]);
      await loadData();
      alert(`✅ 8-week program assigned to ${assign8wkClients.length} athlete(s)!`);
    } catch(e) { console.log("8wk assign error:", e); alert("Error: " + e.message); }
    setSavingTpl(false);
  };

  const loadDietFiles = async (clientId) => {
    if (!clientId) return;
    try {
      const { data } = await supabase.from("diet_files")
        .select("*").eq("athlete_id", clientId)
        .order("created_at", { ascending: false });
      setDietFiles(data || []);
    } catch(e) {}
  };

  const uploadDiet = async (file, clientId) => {
    if (!file || !clientId) return;
    setDietUploading(true);
    setDietError("");
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const fileName = `diets/${clientId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("diet-files").upload(fileName, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("diet-files").getPublicUrl(fileName);
      await supabase.from("diet_files").insert({
        coach_id: au.id, athlete_id: clientId,
        file_name: file.name, file_url: urlData.publicUrl,
      });
      sendPushToUser(clientId, "🥗 New diet plan from Coach Karlito", "Tap to download your nutrition plan", "diet", "/");
      await loadDietFiles(clientId);
    } catch(e) { setDietError(e.message || "Upload failed"); }
    setDietUploading(false);
  };

  const loadLibraryList = async () => {
    if (libraryList.length > 0) return;
    const { data } = await supabase.from("exercise_library").select("name, category").order("category").order("name");
    setLibraryList(data || []);
  };

  const copyWeek = async () => {
    if (!selectedClient) return;
    setCopyingWeek(true);
    try {
      const { data: days } = await supabase.from("program_days").select("*")
        .eq("athlete_id", selectedClient).eq("week", copyWeekFrom);
      for (const day of (days || [])) {
        const { data: newDay } = await supabase.from("program_days").insert({
          coach_id: day.coach_id, athlete_id: day.athlete_id,
          week: copyWeekTo, day: day.day, title: day.title, notes: day.notes
        }).select().single();
        if (newDay) {
          const { data: exs } = await supabase.from("custom_exercises").select("*")
            .eq("athlete_id", selectedClient).eq("week", copyWeekFrom).eq("day", day.day);
          for (const ex of (exs || [])) {
            await supabase.from("custom_exercises").insert({
              athlete_id: ex.athlete_id, coach_id: ex.coach_id,
              week: copyWeekTo, day: ex.day, name: ex.name,
              sets: ex.sets, reps: ex.reps, weight: ex.weight, notes: ex.notes
            });
          }
        }
      }
      await loadData();
      setShowCopyWeek(false);
      alert(`Week ${copyWeekFrom} copied to Week ${copyWeekTo}!`);
    } catch(e) { alert("Error copying week"); }
    setCopyingWeek(false);
  };

  useEffect(() => { loadData(); loadTemplates(); }, []);

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
      setNewEx({ name: "", sets: 3, reps: 10, weight: 0, rpe: 0, unit: "kg", notes: "", day: "A", week: 1 });
      await loadData();
      setView("profile");
    } catch(e) { console.log("Save exercise error:", e); }
    setSaving(false);
  };
const saveCoachComment = async () => {
    if (!selectedSession?.id) return;
    setSavingComment(true);
    setCommentSaved(false);
    try {
      await supabase.from("workouts")
        .update({ coach_comment: coachComment })
        .eq("id", selectedSession.id);
      setCommentSaved(true);
      setSelectedSession(prev => ({ ...prev, coach_comment: coachComment }));
      // Send push to athlete
      sendPushToUser(selectedSession.user_id, "💬 Coach feedback on your workout", "Tap to read your coach's feedback", "feedback", "/");
      setTimeout(() => setCommentSaved(false), 3000);
    } catch(e) { console.log("Comment save error:", e); }
    setSavingComment(false);
  };

  const saveProgramDay = async () => {
    if (!selectedClient || !buildTitle) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const validExercises = buildExercises.filter(e => e.name.trim());

      if (editingDay) {
        // UPDATE existing day
        await supabase.from("program_days").update({ title: buildTitle, notes: buildNotes })
          .eq("id", editingDay.dayId);
        // Delete old exercises and re-insert
        await supabase.from("custom_exercises").delete().eq("athlete_id", selectedClient)
          .eq("week", buildWeek).eq("day", buildDay);
        for (const ex of validExercises) {
          await supabase.from("custom_exercises").insert({
            coach_id: user.id, athlete_id: selectedClient,
            name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
            notes: ex.notes, day: buildDay, week: buildWeek,
          });
        }
        setEditingDay(null);
      } else {
        // INSERT new day
        await supabase.from("program_days").insert({
          coach_id: user.id, athlete_id: selectedClient,
          week: buildWeek, day: buildDay, title: buildTitle, notes: buildNotes,
        }).select().single();
        for (const ex of validExercises) {
          await supabase.from("custom_exercises").insert({
            coach_id: user.id, athlete_id: selectedClient,
            name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
            notes: ex.notes, day: buildDay, week: buildWeek,
          });
        }
        sendPushToUser(selectedClient, "💪 New program from Coach Karlito", `Week ${buildWeek} · Day ${buildDay} — ${buildTitle}`, "program", "/");
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
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1 - i * 7); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      const wks = clientWks(selectedClient).filter(w => { const d = new Date(w.created_at); return d >= start && d < end; });
      const vol = wks.reduce((s, w) => s + (w.exercises || []).reduce((s2, ex) =>
        s2 + (ex.sets || []).filter(st => st.done && st.weight && st.reps)
          .reduce((s3, st) => s3 + parseFloat(st.weight) * parseFloat(st.reps), 0), 0), 0);
      weeks.push({ label: i === 0 ? "now" : `-${i}w`, sessions: wks.length, vol: Math.round(vol) });
    }
    return weeks;
  })();

  return (
    <div style={s.screen}>
      {/* View toggle */}
          {/* View toggle */}
      {/* View toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["dashboard", "📊"], ["sessions", "📋"], ["templates", "📁"], ["diet", "🥗"], ["ranks", "🏆"]].map(([v, icon]) => (
          <div key={v} onClick={() => { setView(v); setSelectedClient(null); setBuildMode(false); setEditingDay(null); }}
            style={{ ...s.pill(view === v && !selectedClient), padding: "8px 0", flex: 1, textAlign: "center", fontSize: 18 }}>
            {icon}
          </div>
        ))}
      </div>

      {/* OVERVIEW */}
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
                <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 26, fontWeight: 900, color: "var(--red)", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: "var(--gray2)", marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* WEEKLY SUMMARY */}
          {(() => {
            const thisWeekStart = startOfWeek;
            const athleteIds = [...new Set(workouts.map(w => w.user_id))];
            const summary = athletes.map(a => {
              const wkSessions = workouts.filter(w =>
                w.user_id === a.id && new Date(w.created_at) >= thisWeekStart
              );
              const lastSession = workouts
                .filter(w => w.user_id === a.id)
                .sort((x, y) => new Date(y.created_at) - new Date(x.created_at))[0];
              const daysSince = lastSession
                ? Math.floor((new Date() - new Date(lastSession.created_at)) / 86400000)
                : null;
              return { ...a, wkSessions: wkSessions.length, daysSince, lastDay: lastSession?.day };
            });

            return (
              <div style={{ marginBottom: 20 }}>
                <div style={s.sectionLabel}>THIS WEEK — ATHLETE STATUS</div>
                {summary.length === 0 && (
                  <div style={{ ...s.card, textAlign: "center", padding: 20, fontSize: 13, color: "var(--gray2)" }}>No athletes yet</div>
                )}
                {summary.map(a => {
                  const isActive = a.wkSessions > 0;
                  const isInactive = a.daysSince !== null && a.daysSince >= 5;
                  const statusColor = isActive ? "var(--red)" : isInactive ? "#b8860b" : "var(--gray2)";
                  const statusText = isActive
                    ? `${a.wkSessions} session${a.wkSessions > 1 ? "s" : ""} this week`
                    : a.daysSince === null ? "No sessions yet"
                    : a.daysSince === 0 ? "Trained today"
                    : `Last trained ${a.daysSince}d ago`;
                  return (
                    <div key={a.id}
                      onClick={() => { setSelectedClient(a.id); setView("profile"); }}
                      style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${statusColor}` }}>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700 }}>{a.name || a.email?.split("@")[0] || "Athlete"}</div>
                        <div style={{ fontSize: 11, color: statusColor, marginTop: 2 }}>{statusText}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {isInactive && (
                          <div style={{ fontSize: 10, background: "rgba(184,134,11,0.15)", color: "#b8860b", padding: "2px 8px", borderRadius: 3, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                            INACTIVE
                          </div>
                        )}
                        {isActive && (
                          <div style={{ fontSize: 10, background: "rgba(192,57,43,0.15)", color: "var(--red)", padding: "2px 8px", borderRadius: 3, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                            ACTIVE
                          </div>
                        )}
                        <span style={{ color: "var(--gray2)", fontSize: 16 }}>›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div style={s.sectionLabel}>CLIENTS</div>
          {athletes.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>No athletes yet</div>
            </div>
                 ) : athletes.map(client => {
            const last = lastWorkout(client.id);
            const thisWk = wksThisWeek(client.id);
            const thisMo = wksThisMonth(client.id);
            const prog = hasProgram(client.id);
            const active = thisWk > 0;
            const bars = [3,2,1,0].map(i => {
              const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1 - i * 7); start.setHours(0,0,0,0);
              const end = new Date(start); end.setDate(start.getDate() + 7);
              return clientWks(client.id).filter(w => { const d = new Date(w.created_at); return d >= start && d < end; }).length;
            });
            const maxB = Math.max(...bars, 1);
            return (
              <div key={client.id} onClick={() => { setSelectedClient(client.id); setView("profile"); }}
                style={{ ...s.card, marginBottom: 10, cursor: "pointer", borderLeft: `3px solid ${active ? "var(--red)" : "var(--border)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 18, fontWeight: 900 }}>{client.name || "Athlete"}</div>
                      {active && <div style={{ ...s.badge("var(--red)"), fontSize: 9 }}>ACTIVE</div>}
                      {!prog && <div style={{ background: "var(--bg3)", color: "var(--gray)", fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>NO PROGRAM</div>}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                      {[["SQ", client.squat], ["BP", client.bench], ["DL", client.deadlift], ["KB", client.kb_weight]].map(([k, v]) => (
                        <div key={k} style={{ fontSize: 11, color: "var(--gray2)" }}>
                          <span style={{ color: "var(--gray)", fontWeight: 700 }}>{k}</span> {v ? `${v}kg` : "—"}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--gray2)" }}><span style={{ color: "var(--accent)", fontWeight: 700 }}>{thisWk}</span> this wk</div>
                      <div style={{ fontSize: 11, color: "var(--gray2)" }}><span style={{ color: "var(--accent)", fontWeight: 700 }}>{thisMo}</span> this mo</div>
                      {last && <div style={{ fontSize: 11, color: "var(--gray2)" }}>last: <span style={{ color: "var(--white)" }}>{fmtDate(last.created_at)}</span></div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif" }}>VIEW</span>
                    <span style={{ color: "var(--gray2)", fontSize: 16 }}>›</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 }}>
                  <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", paddingBottom: 2 }}>ACTIVITY (4 WKS)</div>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 24, width: 100 }}>
                    {bars.map((n, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <div style={{ width: "100%", borderRadius: 2, background: n > 0 ? "var(--red)" : "var(--bg3)", height: Math.max(3, (n / maxB) * 18) }} />
                        <div style={{ fontSize: 7, color: "var(--gray2)" }}>{i === 3 ? "now" : `-${3-i}w`}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* CLIENT DETAIL */}
      {selectedClient && selectedClientData && view === "profile" && !buildMode && (
        <>
          <button onClick={() => { setSelectedClient(null); setView("dashboard"); }}
            style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 14 }}>
            ← BACK
          </button>
          <div style={{ ...s.card, borderColor: "var(--red-dim)", marginBottom: 12 }}>
            <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{selectedClientData.name || "Athlete"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {[["SQUAT", selectedClientData.squat], ["BENCH", selectedClientData.bench], ["DEADLIFT", selectedClientData.deadlift], ["KB", selectedClientData.kb_weight]].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg3)", borderRadius: 6, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.08em" }}>{k}</div>
                  <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 20, fontWeight: 900 }}>{v || "—"}</div>
                  {v && <div style={{ fontSize: 9, color: "var(--gray2)" }}>kg</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 6 }}>LAST 4 WEEKS — VOLUME</div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 52, marginBottom: 12 }}>
              {weeklyData.map((w, i) => {
                const maxVol = Math.max(...weeklyData.map(x => x.vol), 1);
                const h = Math.max(4, (w.vol / maxVol) * 44);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ fontSize: 9, color: "var(--accent)", fontFamily: "\'Barlow Condensed\', sans-serif" }}>{w.sessions > 0 ? w.sessions : ""}</div>
                    <div style={{ width: "100%", borderRadius: 3, background: i === 3 ? "var(--red)" : "var(--bg3)", border: "1px solid var(--border)", height: h }} />
                    <div style={{ fontSize: 8, color: "var(--gray2)" }}>{w.label}</div>
                    {w.vol > 0 && <div style={{ fontSize: 8, color: "var(--gray2)" }}>{w.vol > 999 ? `${(w.vol/1000).toFixed(1)}t` : `${w.vol}kg`}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["SESSIONS", clientWorkouts.length, "total"], ["THIS WK", wksThisWeek(selectedClient), ""], ["THIS MO", wksThisMonth(selectedClient), ""], ["PROGRAM", hasProgram(selectedClient) ? "YES" : "NO", ""]].map(([k, v, sub]) => (
                <div key={k} style={{ flex: 1, background: "var(--bg3)", borderRadius: 6, padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "var(--gray2)", letterSpacing: "0.06em" }}>{k}</div>
                  <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 16, fontWeight: 900, color: v === "NO" ? "var(--gray2)" : "var(--accent)" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Full Athlete Profile */}
          <div style={{ ...s.card, borderColor: "rgba(184,134,11,0.25)", background: "rgba(184,134,11,0.03)", marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 14, fontFamily: "'Cinzel', serif" }}>ATHLETE PROFILE</div>

            {/* 1RM */}
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 8 }}>1RM</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["SQUAT", selectedClientData.squat], ["BENCH", selectedClientData.bench], ["DEADLIFT", selectedClientData.deadlift]].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg3)", borderRadius: 4, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: v ? "var(--white)" : "var(--gray2)" }}>{v ? `${v}` : "—"}</div>
                  {v && <div style={{ fontSize: 9, color: "var(--gray2)" }}>kg</div>}
                </div>
              ))}
            </div>

            {/* Other stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["KB WEIGHT", selectedClientData.kb_weight ? `${selectedClientData.kb_weight}kg` : "—"],
                ["LEVEL", selectedClientData.level ? selectedClientData.level.toUpperCase() : "—"],
                ["PULL-UPS MAX", selectedClientData.pullups || "—"],
                ["RECOVERY", selectedClientData.recovery ? `${selectedClientData.recovery}/5` : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "var(--bg3)", borderRadius: 4, padding: "10px 12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Goals */}
            {(selectedClientData.main_goal || selectedClientData.competition_date || selectedClientData.athlete_notes) && (
              <>
                <div style={{ height: 1, background: "var(--border)", margin: "4px 0 14px" }} />
                <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", marginBottom: 12, fontFamily: "'Cinzel', serif" }}>GOALS</div>
                {selectedClientData.main_goal && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 3 }}>MAIN GOAL</div>
                    <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600, lineHeight: 1.4 }}>{selectedClientData.main_goal}</div>
                  </div>
                )}
                {selectedClientData.competition_date && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 3 }}>COMPETITION DATE</div>
                    <div style={{ fontSize: 13, color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                      {new Date(selectedClientData.competition_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      <span style={{ color: "var(--gray2)", fontWeight: 400, marginLeft: 8 }}>
                        ({Math.ceil((new Date(selectedClientData.competition_date) - new Date()) / (1000*60*60*24))} days out)
                      </span>
                    </div>
                  </div>
                )}
                {selectedClientData.athlete_notes && (
                  <div>
                    <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 3 }}>NOTES FOR COACH</div>
                    <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, background: "var(--bg3)", borderRadius: 4, padding: "10px 12px", borderLeft: "2px solid var(--accent)" }}>{selectedClientData.athlete_notes}</div>
                  </div>
                )}
              </>
            )}

            {/* No data fallback */}
            {!selectedClientData.squat && !selectedClientData.main_goal && (
              <div style={{ fontSize: 12, color: "var(--gray2)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
                Athlete hasn't completed their profile yet
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setBuildMode(true)} style={{ ...s.btn, flex: 1, fontSize: 12, padding: "10px" }}>+ PROGRAM DAY</button>
            <button onClick={() => setShowCopyWeek(v => !v)} style={{ ...s.btnGhost, flex: 1, fontSize: 12, padding: "10px" }}>⧉ COPY WEEK</button>
            <button onClick={() => setView("addExercise")} style={{ ...s.btnGhost, flex: 1, fontSize: 12, padding: "10px" }}>+ EXERCISE</button>
          </div>

          {showCopyWeek && (
            <div style={{ ...s.card, marginBottom: 12, borderColor: "rgba(200,160,40,0.3)" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900, color: "var(--gold)", marginBottom: 10, letterSpacing: "0.1em" }}>⧇ COPY WEEK</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--gray2)", marginBottom: 4 }}>FROM WEEK</div>
                  <input type="number" min={1} max={8} value={copyWeekFrom} onChange={e => setCopyWeekFrom(+e.target.value)} style={s.input} />
                </div>
                <div style={{ fontSize: 18, color: "var(--gray2)", paddingTop: 16 }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--gray2)", marginBottom: 4 }}>TO WEEK</div>
                  <input type="number" min={1} max={8} value={copyWeekTo} onChange={e => setCopyWeekTo(+e.target.value)} style={s.input} />
                </div>
              </div>
              <button onClick={copyWeek} disabled={copyingWeek || copyWeekFrom === copyWeekTo} style={{ ...s.btn, fontSize: 13, opacity: (copyingWeek || copyWeekFrom === copyWeekTo) ? 0.5 : 1 }}>
                {copyingWeek ? "COPYING..." : "COPY WEEK " + copyWeekFrom + " → WEEK " + copyWeekTo}
              </button>
            </div>
          )}

          {clientExercises.length > 0 && (
            <div style={{ ...s.card, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>CUSTOM EXERCISES</div>
              {clientExercises.map(ex => (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)" }}>{ex.sets}×{ex.reps} · {ex.weight}kg · Day {ex.day} · Wk {ex.week}</div>
                  </div>
                  <div onClick={() => deleteExercise(ex.id)} style={{ color: "var(--red-dim)", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</div>
                </div>
              ))}
            </div>
          )}
          {programDays.filter(d => d.athlete_id === selectedClient).length > 0 && (
            <div style={{ ...s.card, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>PROGRAM</div>
              {programDays.filter(d => d.athlete_id === selectedClient).map(day => {
                const dayExs = exercises.filter(e => e.athlete_id === selectedClient && e.week === day.week && e.day === day.day);
                const col = { A: "#4a9eff", B: "#f0a020", C: "var(--red)" }[day.day] || "var(--red)";
                return (
                  <div key={day.id} style={{ borderLeft: `3px solid ${col}`, paddingLeft: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 14, fontWeight: 900 }}>Wk {day.week} · Day {day.day} — {day.title}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <div onClick={() => {
                          setBuildWeek(day.week); setBuildDay(day.day); setBuildTitle(day.title);
                          setBuildNotes(day.notes || "");
                          setBuildExercises(dayExs.length > 0 ? dayExs.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, notes: e.notes || "", _id: e.id })) : [{ name: "", sets: 3, reps: 5, weight: 0, notes: "" }]);
                          setEditingDay({ dayId: day.id, exIds: dayExs.map(e => e.id) });
                          setBuildMode(true);
                        }} style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", padding: "4px 8px", fontFamily: "\'Barlow Condensed\', sans-serif", fontWeight: 700 }}>EDIT</div>
                        <div onClick={() => deleteProgramDay(day.id)} style={{ color: "var(--red-dim)", fontSize: 16, cursor: "pointer", padding: "4px 8px" }}>✕</div>
                      </div>
                    </div>
                    {dayExs.map(ex => <div key={ex.id} style={{ fontSize: 11, color: "var(--gray)", marginTop: 3 }}>· {ex.name} — {ex.sets}×{ex.reps} @ {ex.weight}kg</div>)}
                  </div>
                );
              })}
            </div>
          )}
          {/* RECENT WORKOUTS WITH VIDEO FEEDBACK */}
          {clientWorkouts.filter(w => w.video_link).length > 0 && (
            <div style={{ ...s.card, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 8 }}>🎥 VIDEO FEEDBACK</div>
              {clientWorkouts.filter(w => w.video_link).slice(0, 5).map((w, i) => {
                const col = { A: "#4a9eff", B: "#f0a020", C: "var(--red)" }[w.day] || "var(--red)";
                return (
                  <div key={i} style={{ borderBottom: i < 4 ? "1px solid var(--border)" : "none", padding: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div>
                        <span style={{ ...s.badge(col), fontSize: 9 }}>DAY {w.day}</span>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--gray)", marginLeft: 8 }}>WK {w.week} · {fmtDate(w.created_at)}</span>
                      </div>
                    </div>
                    {w.comment && <div style={{ fontSize: 11, color: "var(--gray)", fontStyle: "italic", marginBottom: 6 }}>"{w.comment}"</div>}
                    <a href={w.video_link} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(201,168,76,0.1)", border: "1px solid var(--gold-dim)", borderRadius: 6, textDecoration: "none", cursor: "pointer" }}>
                      <span style={{ fontSize: 14 }}>▶</span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.08em" }}>OBEJRZYJ WIDEO</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* BUILD PROGRAM DAY */}
      {buildMode && selectedClient && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 14, color: "var(--accent)" }}>{editingDay ? "✏️ EDIT PROGRAM DAY" : "BUILD PROGRAM DAY"}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}><label style={s.label}>WEEK</label><input type="number" min="1" max="8" value={buildWeek} onChange={e => setBuildWeek(+e.target.value)} style={s.input} /></div>
            <div style={{ flex: 1 }}><label style={s.label}>DAY</label><select value={buildDay} onChange={e => setBuildDay(e.target.value)} style={s.input}>{["A","B","C","D"].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          </div>
          <label style={s.label}>TITLE</label>
          <input value={buildTitle} onChange={e => setBuildTitle(e.target.value)} placeholder="e.g. Upper Strength" style={{ ...s.input, marginBottom: 12 }} />
          <label style={s.label}>NOTES (optional)</label>
          <input value={buildNotes} onChange={e => setBuildNotes(e.target.value)} placeholder="Focus points..." style={{ ...s.input, marginBottom: 12 }} />
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 8 }}>EXERCISES</div>
          {buildExercises.map((ex, i) => (
            <div key={i} style={{ background: "var(--bg3)", borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <div onClick={() => { setLibraryPicker(i); loadLibraryList(); }} style={{ ...s.input, flex: 2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: ex.name ? "var(--text)" : "var(--gray2)" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14 }}>{ex.name || `Pick exercise ${i+1}...`}</span>
                  <span style={{ fontSize: 11, color: "var(--accent)" }}>📚</span>
                </div>
                <div onClick={() => setBuildExercises(buildExercises.filter((_,j)=>j!==i))} style={{ color: "var(--red-dim)", cursor: "pointer", padding: "0 6px", alignSelf: "center", fontSize: 16 }}>✕</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["Sets","sets",1,8],["Reps","reps",1,30],["kg","weight",0,500]].map(([lbl,key,min,max]) => (
                  <div key={key} style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "var(--gray2)", marginBottom: 2 }}>{lbl}</div>
                    <input type="number" min={min} max={max} value={ex[key]} onChange={e => { const a=[...buildExercises]; a[i][key]=+e.target.value; setBuildExercises(a); }} style={{ ...s.input, padding: "8px 6px" }} />
                  </div>
                ))}
              </div>
              <input value={ex.notes} onChange={e => { const a=[...buildExercises]; a[i].notes=e.target.value; setBuildExercises(a); }} placeholder="Notes..." style={{ ...s.input, marginTop: 6, fontSize: 12 }} />
            </div>
          ))}
          <button onClick={() => setBuildExercises([...buildExercises,{name:"",sets:3,reps:8,weight:0,notes:""}])} style={{ ...s.btnGhost, width: "100%", marginBottom: 10, fontSize: 12 }}>+ ADD EXERCISE</button>
          <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={saveProgramDay} disabled={saving}>{saving ? "SAVING..." : "SAVE PROGRAM DAY"}</button>
          <button style={{ ...s.btnGhost, marginTop: 8 }} onClick={() => { setBuildMode(false); setEditingDay(null); }}>← CANCEL</button>
        </div>
      )}

      {/* ── TEMPLATES VIEW ── */}
      {view === "templates" && !selectedClient && (
        <div>
          {tplMode === "list" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={s.sectionLabel}>PROGRAM TEMPLATES</div>
                <button onClick={() => setTplMode("create")} style={{ ...s.btn, width: "auto", padding: "8px 16px", fontSize: 12 }}>+ NEW</button>
              </div>

              {/* ── BUILT-IN 8-WEEK DOM SIŁY PROGRAM ── */}
              <div style={{ ...s.card, borderColor: "rgba(184,134,11,0.5)", background: "rgba(184,134,11,0.06)", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 8 }}>BUILT-IN PROGRAM</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>DOM SIŁY — 8 WEEKS</div>
                    <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 2 }}>3 days/week · SBD + Kettlebell · 4 phases</div>
                  </div>
                  <button onClick={() => setTplMode("assign8wk")} style={{ ...s.btn, width: "auto", padding: "8px 14px", fontSize: 11, background: "var(--accent)", color: "#111" }}>ASSIGN →</button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["Wk 1–2", "FUNDAMENT 5×8", "#4a9eff"],["Wk 3–4","BUDOWANIE 6×6","#f0a020"],["Wk 5–6","SIŁA 5×5","var(--red)"],["Wk 7–8","SZCZYT 5×3","#a78bfa"]].map(([wk,ph,col])=>(
                    <div key={wk} style={{ background:"var(--bg3)", borderRadius:6, padding:"4px 10px", borderLeft:`2px solid ${col}`, fontSize:11 }}>
                      {wk} · {ph}
                    </div>
                  ))}
                </div>
              </div>
              {templates.length === 0 ? (
                <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 6 }}>NO TEMPLATES YET</div>
                  <div style={{ fontSize: 13, color: "var(--gray)" }}>Create reusable program templates to assign to multiple athletes at once.</div>
                </div>
              ) : (templates || []).map(tpl => (
                <div key={tpl.id} style={{ ...s.card, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900 }}>{tpl.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 2 }}>{(tpl.days || []).length} days · {(tpl.days || []).reduce((s, d) => s + (d.exercises || []).filter(e => e.name).length, 0)} exercises</div>
                    </div>
                    <button onClick={() => { setSelectedTpl(tpl); setTplWeekStart(1); setTplAssignClients([]); setTplMode("assign"); }}
                      style={{ ...s.btn, width: "auto", padding: "8px 14px", fontSize: 11 }}>ASSIGN →</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {(tpl.days || []).map((d, di) => {
                      const col = { A: "#4a9eff", B: "#f0a020", C: "var(--red)", D: "#a78bfa" }[d.day] || "var(--red)";
                      return (
                        <div key={di} style={{ background: "var(--bg3)", borderRadius: 6, padding: "4px 10px", borderLeft: `2px solid ${col}`, fontSize: 11 }}>
                          Day {d.day} — {d.title || "Untitled"}
                        </div>
                      );
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
              <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Week 1 Accumulation, Beginner Base..." style={{ ...s.input, marginBottom: 16 }} />

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
                      <label style={s.label}>DAY TITLE</label>
                      <input value={tday.title} onChange={e => setTplDays(p => p.map((d, i) => i === di ? { ...d, title: e.target.value } : d))} placeholder="e.g. Squat / Deadlift" style={s.input} />
                    </div>
                    {tplDays.length > 1 && (
                      <div onClick={() => setTplDays(p => p.filter((_, i) => i !== di))} style={{ color: "var(--red-dim)", fontSize: 18, cursor: "pointer", padding: "24px 4px 0", alignSelf: "flex-start" }}>✕</div>
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

          {tplMode === "assign8wk" && (
            <div>
              <button onClick={() => { setTplMode("list"); setAssign8wkClients([]); }}
                style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 16 }}>← BACK</button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "var(--accent)" }}>
                DOM SIŁY — 8-WEEK PROGRAM
              </div>
              <div style={{ fontSize: 12, color: "var(--gray2)", marginBottom: 4 }}>24 training days · Weeks 1–8 · A/B/C</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {[["Wk 1–2","FUNDAMENT 5×8","#4a9eff"],["Wk 3–4","BUDOWANIE 6×6","#f0a020"],["Wk 5–6","SIŁA 5×5","var(--red)"],["Wk 7–8","SZCZYT 5×3","#a78bfa"]].map(([wk,ph,col])=>(
                  <div key={wk} style={{ background:"var(--bg3)", borderRadius:6, padding:"4px 10px", borderLeft:`2px solid ${col}`, fontSize:11 }}>{wk} · {ph}</div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 16, padding: "10px 12px",
                background: "var(--bg3)", borderRadius: 6, borderLeft: "2px solid var(--accent)" }}>
                ⚠️ This will write all 24 training days to the athlete's calendar (Weeks 1–8). Weights are left at 0 — coach adjusts individually.
              </div>
              <label style={s.label}>ATHLETE LEVEL</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[["beginner","BEGINNER","#4a9eff"],["intermediate","INTERMEDIATE","#f0a020"],["advanced","ADVANCED","var(--red)"]].map(([val,label,col]) => (
                  <div key={val} onClick={() => setAssign8wkLevel(val)}
                    style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderRadius: 6, cursor: "pointer",
                      border: `2px solid ${assign8wkLevel === val ? col : "var(--border)"}`,
                      background: assign8wkLevel === val ? col + "22" : "var(--bg3)",
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700,
                      color: assign8wkLevel === val ? col : "var(--gray)" }}>
                    {label}
                  </div>
                ))}
              </div>
              <label style={s.label}>SELECT ATHLETES</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {athletes.map(a => {
                  const selected = assign8wkClients.includes(a.id);
                  return (
                    <div key={a.id} onClick={() => setAssign8wkClients(p => selected ? p.filter(id => id !== a.id) : [...p, a.id])}
                      style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center",
                        cursor: "pointer", borderColor: selected ? "var(--accent)" : "var(--border)", padding: "12px 16px" }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>
                        {a.name || a.profiles?.name || a.email}
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: 5,
                        background: selected ? "var(--accent)" : "var(--bg3)",
                        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: "#111" }}>
                        {selected ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={assign8WeekProgram}
                disabled={savingTpl || assign8wkClients.length === 0}
                style={{ ...s.btn, background: "var(--accent)", color: "#111",
                  opacity: savingTpl || assign8wkClients.length === 0 ? 0.5 : 1 }}>
                {savingTpl ? "ASSIGNING..." : `ASSIGN 8 WEEKS TO ${assign8wkClients.length || "?"} ATHLETE${assign8wkClients.length !== 1 ? "S" : ""} →`}
              </button>
            </div>
          )}

          {tplMode === "assign" && selectedTpl && (
            <div>
              <button onClick={() => { setTplMode("list"); setSelectedTpl(null); }} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 16 }}>← BACK</button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 4, color: "var(--accent)" }}>ASSIGN: {selectedTpl.name.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: "var(--gray2)", marginBottom: 16 }}>{(selectedTpl.days || []).length} days · select athletes + week</div>

              <label style={s.label}>START WEEK</label>
              <input type="number" min="1" max="8" value={tplWeekStart} onChange={e => setTplWeekStart(+e.target.value)} style={{ ...s.input, marginBottom: 16 }} />

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

      {/* ── RANKS VIEW ── */}
      {view === "ranks" && !selectedClient && (
        <RanksCoachView athletes={athletes} authUser={{ id: "a6efb4f6-a5aa-4829-89c3-adb486cf187c" }} />
      )}

      {/* ── DIET VIEW ── */}
      {view === "diet" && !selectedClient && (
        <div>
          <div style={s.sectionLabel}>DIET PLANS</div>
          <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 16 }}>Upload PDF nutrition plans for your athletes.</div>

          {/* Select athlete */}
          <label style={s.label}>SELECT ATHLETE</label>
          <select value={dietClient || ""} onChange={e => { setDietClient(e.target.value || null); setDietFiles([]); if (e.target.value) loadDietFiles(e.target.value); }}
            style={{ ...s.input, marginBottom: 16 }}>
            <option value="">— Choose athlete —</option>
            {athletes.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
          </select>

          {dietClient && (
            <>
              {/* Upload area */}
              <div onClick={() => dietFileRef.current?.click()}
                style={{ ...s.card, borderColor: dietUploading ? "var(--red)" : "var(--border)", borderStyle: "dashed", textAlign: "center", padding: "28px 16px", cursor: "pointer", marginBottom: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{dietUploading ? "⏳" : "📄"}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, marginBottom: 4 }}>
                  {dietUploading ? "UPLOADING..." : "TAP TO UPLOAD PDF"}
                </div>
                <div style={{ fontSize: 12, color: "var(--gray2)" }}>PDF files only · Max 10MB</div>
              </div>
              <input ref={dietFileRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadDiet(f, dietClient); e.target.value = ""; }} />
              {dietError && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>⚠ {dietError}</div>}

              {/* Existing files */}
              {dietFiles.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.15em", marginBottom: 10, marginTop: 8 }}>UPLOADED PLANS</div>
                  {(dietFiles || []).map((f, i) => (
                    <div key={i} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "12px 16px" }}>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700 }}>📄 {f.file_name}</div>
                        <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>{new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textDecoration: "none" }}>VIEW →</a>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* LIBRARY PICKER MODAL */}
      {libraryPicker !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end" }}
          onClick={() => setLibraryPicker(null)}>
          <div style={{ width: "100%", background: "var(--bg2)", borderRadius: "16px 16px 0 0", padding: 16, maxHeight: "75vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)" }}>PICK EXERCISE</div>
              <button onClick={() => setLibraryPicker(null)} style={{ background: "none", border: "none", color: "var(--gray)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <input value={libPickerSearch} onChange={e => setLibPickerSearch(e.target.value)}
              placeholder="Search..." style={{ ...s.input, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {["All", "Squat", "Hinge", "Press", "Pull", "KB", "Accessories"].map(cat => (
                <div key={cat} onClick={() => setLibPickerCat(cat)}
                  style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    background: libPickerCat === cat ? "var(--accent)" : "var(--bg3)",
                    color: libPickerCat === cat ? "#fff" : "var(--gray)" }}>
                  {cat}
                </div>
              ))}
            </div>
            {libraryList
              .filter(e => (libPickerCat === "All" || e.category === libPickerCat) && e.name.toLowerCase().includes(libPickerSearch.toLowerCase()))
              .map((ex, i) => (
                <div key={i} onClick={() => {
                  const a = [...buildExercises];
                  a[libraryPicker].name = ex.name;
                  setBuildExercises(a);
                  setLibraryPicker(null);
                  setLibPickerSearch("");
                }} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700 }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray2)", background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>{ex.category}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ADD EXERCISE */}
      {view === "addExercise" && selectedClient && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 14, color: "var(--accent)" }}>ADD CUSTOM EXERCISE</div>
          <label style={s.label}>EXERCISE NAME</label>
          <input value={newEx.name} onChange={e => setNewEx({...newEx,name:e.target.value})} placeholder="e.g. DB Row" style={{ ...s.input, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[["SETS","sets",1],["REPS","reps",1],["KG","weight",0],["RPE","rpe",0]].map(([lbl,key,min]) => (
              <div key={key} style={{ flex: 1 }}><label style={s.label}>{lbl}</label><input type="number" min={min} value={newEx[key]} onChange={e => setNewEx({...newEx,[key]:+e.target.value})} style={s.input} /></div>
            ))}
          </div>
          <label style={s.label}>UNIT</label>
          <select value={newEx.unit} onChange={e => setNewEx({...newEx, unit: e.target.value})} style={{ ...s.input, marginBottom: 10 }}>
            <option value="kg">kg (weight)</option>
            <option value="sec">sec (time hold)</option>
            <option value="m">m (distance)</option>
            <option value="reps">reps only</option>
          </select>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={s.label}>DAY</label><select value={newEx.day} onChange={e => setNewEx({...newEx,day:e.target.value})} style={s.input}>{["A","B","C","D"].map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={s.label}>WEEK</label><input type="number" min="1" max="8" value={newEx.week} onChange={e => setNewEx({...newEx,week:+e.target.value})} style={s.input} /></div>
          </div>
          <label style={s.label}>NOTES</label>
          <input value={newEx.notes} onChange={e => setNewEx({...newEx,notes:e.target.value})} placeholder="Cues..." style={{ ...s.input, marginBottom: 10 }} />
          <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={saveExercise} disabled={saving}>{saving ? "SAVING..." : "SAVE EXERCISE"}</button>
          <button style={{ ...s.btnGhost, marginTop: 8 }} onClick={() => setView("profile")}>← CANCEL</button>
        </div>
      )}

      {/* ALL SESSIONS — list */}
      {view === "sessions" && !selectedClient && !selectedSession && (
        <>
          <div style={s.sectionLabel}>ALL SESSIONS</div>
          {workouts.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: 32 }}><div style={{ fontSize: 13, color: "var(--gray)" }}>No sessions yet</div></div>
          ) : workouts.map((w, i) => {
            const client = clients.find(c => c.id === w.user_id);
            const exs = w.exercises || [];
            const doneExs = exs.filter(ex => ex.done || (ex.sets||[]).some(s=>s.done)).length;
            const col = {A:"#4a9eff",B:"#f0a020",C:"var(--red)"}[w.day]||"var(--red)";
            return (
              <div key={i} onClick={() => { setSelectedSession(w); setCoachComment(w.coach_comment || ""); setCommentSaved(false); }}
                style={{ ...s.card, marginBottom: 10, borderLeft: `3px solid ${col}`, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <div style={{ ...s.badge(col), fontSize: 10 }}>DAY {w.day}</div>
                      <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {w.week}</div>
                    </div>
                    <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 15, fontWeight: 700 }}>{w.workout_title?.replace(/DAY [ABCD] — /,"")}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{fmtDate(w.created_at)} · {client?.name||"Athlete"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--gray2)" }}>{doneExs}/{exs.length} done</div>
                    {w.comment && <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 4 }}>💬 comment</div>}
                    {w.video_link && <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 2 }}>▶ video</div>}
                    <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 4 }}>VIEW ›</div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* SESSION DETAIL VIEW */}
      {view === "sessions" && !selectedClient && selectedSession && (() => {
        const w = selectedSession;
        const client = clients.find(c => c.id === w.user_id);
        const col = {A:"#4a9eff",B:"#f0a020",C:"var(--red)"}[w.day]||"var(--red)";
        return (
          <div>
            <button onClick={() => setSelectedSession(null)} style={{ ...s.btnGhost, width: "auto", padding: "8px 14px", fontSize: 12, marginBottom: 14 }}>← BACK</button>
            <div style={{ ...s.card, borderLeft: `3px solid ${col}`, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <div style={{ ...s.badge(col), fontSize: 10 }}>DAY {w.day}</div>
                <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 11, color: "var(--gray2)" }}>WK {w.week} · {fmtDate(w.created_at)}</div>
              </div>
              <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 18, fontWeight: 900 }}>{w.workout_title?.replace(/DAY [ABCD] — /,"")}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>{client?.name || "Athlete"}</div>
            </div>

            {/* Exercises with results */}
            {(w.exercises || []).map((ex, ei) => (
              <div key={ei} style={{ ...s.card, marginBottom: 10, borderLeft: `3px solid ${ex.done ? "var(--red)" : "var(--border)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ex.result ? 8 : 0 }}>
                  <div>
                    <div style={{ fontFamily: "\'Barlow Condensed\', sans-serif", fontSize: 14, fontWeight: 900 }}>{ex.name}</div>
                    {ex.planned && <div style={{ fontSize: 11, color: "var(--gray2)" }}>Plan: {ex.planned.sets}×{ex.planned.reps} @ {ex.planned.weight}kg</div>}
                  </div>
                  <div style={{ fontSize: 12, color: ex.done ? "var(--red)" : "var(--gray2)", fontWeight: 700 }}>{ex.done ? "✓ DONE" : "—"}</div>
                </div>
                {ex.result && (
                  <div style={{ fontSize: 13, color: "var(--text)", background: "var(--bg3)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>
                    {ex.result}
                  </div>
                )}
              </div>
            ))}

            {/* Athlete comment */}
            {w.comment && (
              <div style={{ ...s.card, borderColor: "var(--red-dim)", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 6 }}>💬 ATHLETE COMMENT</div>
                <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, fontStyle: "italic" }}>{w.comment}</div>
              </div>
            )}

            {/* Video feedback */}
            {w.video_link && (
              <a href={w.video_link} target="_blank" rel="noopener noreferrer"
                style={{ ...s.card, display: "flex", alignItems: "center", gap: 10, marginBottom: 12, borderColor: "var(--gold-dim)", textDecoration: "none", cursor: "pointer" }}>
                <span style={{ fontSize: 24 }}>▶</span>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>WATCH VIDEO FEEDBACK</div>
                  <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 2 }}>{w.video_link}</div>
                </div>
              </a>
            )}

            {/* Coach comment */}
            <div style={{ ...s.card, borderColor: "rgba(196,30,30,0.4)", background: "rgba(196,30,30,0.03)", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.15em", marginBottom: 8 }}>🎯 COACH FEEDBACK</div>
              {w.coach_comment && !coachComment && (
                <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6, fontStyle: "italic", background: "var(--bg3)", borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>
                  {w.coach_comment}
                </div>
              )}
              <textarea
                value={coachComment}
                onChange={e => setCoachComment(e.target.value)}
                placeholder="Add feedback for this session... technique notes, adjustments, encouragement"
                rows={3}
                style={{ ...s.input, resize: "none", lineHeight: 1.5, fontSize: 13, marginBottom: 10 }}
              />
              <button
                onClick={saveCoachComment}
                disabled={savingComment || !coachComment.trim()}
                style={{ ...s.btn, opacity: (savingComment || !coachComment.trim()) ? 0.5 : 1 }}>
                {commentSaved ? "✓ FEEDBACK SENT" : savingComment ? "SAVING..." : "SEND FEEDBACK →"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

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
      } catch(e) {}
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


function OneRMEditor({ user, authUser }) {
  const [vals, setVals] = useState({
    squat:   user?.oneRM?.squat   || "",
    bench:   user?.oneRM?.bench   || "",
    deadlift:user?.oneRM?.deadlift|| "",
    pullups: user?.pullups        || "",
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
      // Update localStorage
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
    } catch(e) { setError(e.message || "Save failed"); }
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
