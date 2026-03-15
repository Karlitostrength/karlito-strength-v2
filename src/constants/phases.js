export const PHASES = {
  1: { name: "FUNDAMENTALS", color: "#4a9eff", weeks: [1,2], scheme: "5×8 paused" },
  2: { name: "BUILDING",     color: "#f0a020", weeks: [3,4], scheme: "6×6" },
  3: { name: "STRENGTH",     color: "#c41e1e", weeks: [5,6], scheme: "5×5" },
  4: { name: "PEAK",         color: "#a78bfa", weeks: [7,8], scheme: "5×3" },
};

export const ACCESSORIES = {
  // DAY A — SQUAT DAY (spec: Lunge + Copenhagen + KB conditioning per poziom)
  A: {
    beginner:     ["Reverse Lunge 3×8", "Copenhagen Plank (short lever) 3×20s"],
    intermediate: ["Goblet Hold Reverse Lunge 3×8", "Copenhagen Plank (long lever) 3×20s"],
    advanced:     ["Double KB Front Rack Reverse Lunge 3×6", "Copenhagen Side Plank 3×20s"],
  },
  // DAY B — DEADLIFT DAY (spec: KB EMOM per poziom)
  B: {
    beginner:     ["EMOM 5 min × 3 rounds: 1) KB Clean ×5 | 2) Farmers Carry 30m | 3) KB Press ×5/side | 4) Inverted Row | 5) Rest"],
    intermediate: ["EMOM 4 min × 3 rounds: 1) KB Clean 5/5 | 2) Suitcase Carry 15m/side | 3) Hollow Hold 30s | 4) Rest"],
    advanced:     ["15 min work block: 2×KB Clean & Press ×5 | Pull Ups ×5 (lub Rows ×10) | Sandbag Carry 30m"],
  },
  // DAY C — BENCH DAY (spec: TGU + Push/Pull per poziom)
  C: {
    beginner:     ["Turkish Get Up 3–5×1 EMOM (quality)", "Superset: Push Up + Gorilla Row", "15 min AMRAP: 8 KB Swing / 8 Skull Crusher / 8 Ab Wheel"],
    intermediate: ["Turkish Get Up 3–5×1 EMOM (quality)", "15 min AMRAP: Push Up ×10 / Pull Up ×5 / KB Swing ×10"],
    advanced:     ["Turkish Get Up 3–5×1 EMOM (quality)", "Dips + Pull Ups — 50+50 total (progress to 70+70)", "KB Snatch finisher: 15/15 × 3 sets"],
  },
};


// Bench progression per level (spec: Beginner/Intermediate week-by-week RPE, Advanced: single + back-off)
function getBenchScheme(week, level, oneRM) {
  if (level === "advanced") {
    if (week <= 4) {
      // 6×6 @70% + weight each session
      const advPct = 0.70 + (week - 1) * 0.02;
      return [{ name: "Paused Bench Press", sets: 6, reps: 6, weight: calcWeight(oneRM.bench, advPct), pct: advPct, note: `@${Math.round(advPct*100)}% — dodaj ciężar każdą sesję`, isMain: true }];
    }
    const advMap = {
      5: { topRPE: 8, workSets: 4, workReps: 4, drop: 0.20 },
      6: { topRPE: 8, workSets: 4, workReps: 4, drop: 0.15, lastRPE: 9 },
      7: { topRPE: 9, workSets: 3, workReps: 3, drop: 0.15 },
      8: { topRPE: 9, workSets: 4, workReps: 2, drop: 0.15 },
    };
    const d = advMap[week] || advMap[8];
    const topNote = week === 6 ? `1×1 RPE${d.topRPE} — ostatnia seria RPE9` : `1×1 RPE${d.topRPE}`;
    return [
      { name: "Bench Press", sets: 1, reps: 1, rpe: d.topRPE, note: topNote, isMain: true },
      { name: "Bench Press (back-off)", sets: d.workSets, reps: d.workReps, note: `−${d.drop*100}% od topu → ${d.workSets}×${d.workReps}` },
    ];
  }
  // Beginner & Intermediate — identyczny schemat tygodniowy
  const scheme = [
    { week: 1, sets: 4, reps: 10, rpe: 6, paused: true },
    { week: 2, sets: 4, reps: 10, rpe: 7, paused: true },
    { week: 3, sets: 4, reps: 8,  rpe: 7, paused: true },
    { week: 4, sets: 4, reps: 8,  rpe: 8, paused: true },
    { week: 5, sets: 5, reps: 6,  rpe: null, paused: false },
    { week: 6, sets: 5, reps: 5,  rpe: null, paused: false },
    { week: 7, sets: 4, reps: 4,  rpe: null, paused: false },
    { week: 8, sets: 5, reps: 3,  rpe: 9,   paused: false },
  ];
  const s = scheme[Math.min(week, 8) - 1];
  const exName = s.paused ? "Paused Bench Press" : "Bench Press";
  const exNote = s.rpe ? `RPE ${s.rpe}` : "";
  return [{ name: exName, sets: s.sets, reps: s.reps, rpe: s.rpe, note: exNote, isMain: true }];
}

// Deadlift progression per level (spec: Beginner/Intermediate paused→non-paused, Advanced: Bolton wave)
function getDeadliftScheme(week, level, oneRM, injuries) {
  injuries = injuries || {};
  const baseEx = injuries.lowerBack ? "Block Pull" : "Deadlift";

  if (level === "advanced") {
    // Andy Bolton wave
    const bolton = [
      { heavy: { pct: 0.75, sets: 1, reps: 2 }, speed: { pct: 0.60, sets: 5, reps: 3 } },
      { heavy: { pct: 0.80, sets: 1, reps: 2 }, speed: { pct: 0.65, sets: 5, reps: 3 } },
      { heavy: { pct: 0.85, sets: 1, reps: 2 }, speed: { pct: 0.70, sets: 5, reps: 3 } },
      { heavy: { pct: 0.90, sets: 1, reps: 2 }, speed: { pct: 0.75, sets: 5, reps: 3 } },
      { heavy: { pct: 0.80, sets: 3, reps: 3 }, speed: { pct: 0.65, sets: 3, reps: 3 } },
      { heavy: { pct: 0.85, sets: 1, reps: 2 }, speed: { pct: 0.70, sets: 3, reps: 3 } },
      { heavy: { pct: 0.90, sets: 1, reps: 2 }, speed: { pct: 0.75, sets: 3, reps: 3 } },
      { heavy: { pct: 0.95, sets: 1, reps: 2 }, speed: { pct: 0.70, sets: 3, reps: 3 } },
    ];
    const b = bolton[Math.min(week, 8) - 1];
    return [
      { name: baseEx, sets: b.heavy.sets, reps: b.heavy.reps, weight: calcWeight(oneRM.deadlift, b.heavy.pct), pct: b.heavy.pct, note: `HEAVY: ${b.heavy.sets}×${b.heavy.reps} @${Math.round(b.heavy.pct*100)}%`, isMain: true },
      { name: `${baseEx} (speed)`, sets: b.speed.sets, reps: b.speed.reps, weight: calcWeight(oneRM.deadlift, b.speed.pct), pct: b.speed.pct, note: `SPEED: ${b.speed.sets}×${b.speed.reps} @${Math.round(b.speed.pct*100)}% — eksplozywnie` },
    ];
  }
  if (level === "beginner") {
    if (week <= 3) return [{ name: `Paused ${baseEx}`, sets: 5, reps: 5, weight: calcWeight(oneRM.deadlift, 0.70), pct: 0.70, note: "5×5 — paused 2s nad podłogą", isMain: true }];
    if (week <= 5) return [{ name: `Paused ${baseEx}`, sets: 4, reps: 4, weight: calcWeight(oneRM.deadlift, 0.76), pct: 0.76, note: "4×4 — paused 2s", isMain: true }];
    return [{ name: baseEx, sets: 5, reps: 3, weight: calcWeight(oneRM.deadlift, 0.83), pct: 0.83, note: "5×3", isMain: true }];
  }
  // Intermediate
  if (week <= 2) return [{ name: `Paused ${baseEx}`, sets: 5, reps: 5, weight: calcWeight(oneRM.deadlift, 0.72), pct: 0.72, note: "5×5 — paused", isMain: true }];
  if (week <= 4) return [{ name: `Paused ${baseEx}`, sets: 4, reps: 4, weight: calcWeight(oneRM.deadlift, 0.78), pct: 0.78, note: "4×4 — paused", isMain: true }];
  if (week <= 6) return [{ name: baseEx, sets: 5, reps: 3, weight: calcWeight(oneRM.deadlift, 0.83), pct: 0.83, note: "5×3", isMain: true }];
  return [{ name: baseEx, sets: 3, reps: 3, weight: calcWeight(oneRM.deadlift, 0.87), pct: 0.87, note: "3×3", isMain: true }];
}

// Squat: wszystkie poziomy ten sam schemat (5×8→6×6→5×5→5×3), paused tygodnie 1–4
function getSquatExercise(week, injuries) {
  injuries = injuries || {};
  const base = injuries.knee ? "Box Squat" : "Back Squat";
  return week <= 4 ? `Paused ${base}` : base;
}

function generateWorkout(day, week, level, oneRM, injuries = {}) {
  injuries = injuries || {};
  const { sets, reps } = getSetsReps(week);
  const acc = ACCESSORIES[day]?.[level] || [];

  // ── DAY A — SQUAT ──────────────────────────────────────────────────────────
  // Spec: główny squat (paused tygodnie 1-4), brak back-off setów,
  //       akcesoria (Lunge + Copenhagen), KB conditioning per poziom
  if (day === "A") {
    const sqName = getSquatExercise(week, injuries);
    const pct = getPct(week, level);
    const sqWeight = calcWeight(oneRM.squat, pct);
    // KB conditioning: beginner = Swing, intermediate = Single Arm Swing, advanced = Snatch
    const kbA = level === "beginner"
      ? getSwingProtocol(week)
      : level === "intermediate"
        ? getSnatchMaxProtocol(week, "intermediate")   // single arm swing 7/7→12/12
        : getSnatchMaxProtocol(week, "advanced");      // hardstyle snatch 10/10→20/20
    return {
      title: "DAY A — SQUAT",
      sections: [
        { title: "SIŁA — SQUAT", exercises: [
          { name: sqName, sets, reps, weight: sqWeight, pct, isMain: true,
            note: week <= 4 ? "Pauza w dole — kontrola techniki" : "" },
        ]},
        { title: "AKCESORIA", exercises: acc.map(e => ({ name: e })) },
        level === "beginner"
          ? { title: "CONDITIONING — KB SWING (EMOM)", swing: true, swingData: kbA }
          : { title: "CONDITIONING — KB " + (level === "advanced" ? "SNATCH" : "SINGLE ARM SWING"),
              snatchMax: true, snatchMaxData: kbA },
      ]
    };
  }

  // ── DAY B — DEADLIFT ───────────────────────────────────────────────────────
  // Spec: progresja per poziom (Beginner/Int paused→heavy, Advanced: Bolton wave),
  //       brak back-off setów, akcesoria KB EMOM per poziom
  if (day === "B") {
    const dlExercises = getDeadliftScheme(week, level, oneRM, injuries);
    return {
      title: "DAY B — DEADLIFT",
      sections: [
        { title: level === "advanced" ? "SIŁA — DEADLIFT (Bolton Wave)" : "SIŁA — DEADLIFT",
          exercises: dlExercises },
        { title: "AKCESORIA KB", exercises: acc.map(e => ({ name: e })) },
      ]
    };
  }

  // ── DAY C — BENCH ──────────────────────────────────────────────────────────
  // Spec: progresja tygodniowa per poziom, TGU practice, akcesoria Push/Pull per poziom,
  //       back-off TYLKO advanced tygodnie 5-8 (wbudowany w getBenchScheme)
  const benchExercises = getBenchScheme(week, level, oneRM);
  return {
    title: "DAY C — BENCH",
    sections: [
      { title: level === "advanced" ? "SIŁA — BENCH (Advanced)" : "SIŁA — BENCH",
        exercises: benchExercises },
      { title: "AKCESORIA", exercises: acc.map(e => ({ name: e })) },
    ]
  };
}


// ─── DOM SIŁY — LEVEL SYSTEM ──────────────────────────────────────────────────

const DOM_SILY_LEVELS = [
  {
    id: "adept",
    rank: 1,
    name: "ADEPT",
    subtitle: "Movement Literacy",
    color: "#6B7280",
    icon: "🔰",
    description: "Learn the movements. Build the foundation.",
    men: {
      push:   { label: "Push Ups × 10", fn: u => (u.pushups || 0) >= 10 },
      pull:   { label: "Inverted Rows × 10", fn: u => (u.inverted_rows || 0) >= 10 },
      hinge:  { label: "KB Swing 16kg × 20", fn: u => (u.kb_swing_test || 0) >= 16 },
      squat:  { label: "Goblet Squat 16kg × 10", fn: u => (u.goblet_test || 0) >= 16 },
      carry:  { label: "Farmer Walk 16kg / hand", fn: u => (u.farmers_carry || 0) >= 16 },
      engine: { label: "TGU 12kg (quality)", fn: u => (u.tgu_test || 0) >= 12 },
    },
    women: {
      push:   { label: "Push Ups × 5", fn: u => (u.pushups || 0) >= 5 },
      pull:   { label: "Inverted Rows × 8", fn: u => (u.inverted_rows || 0) >= 8 },
      hinge:  { label: "KB Swing 12kg × 20", fn: u => (u.kb_swing_test || 0) >= 12 },
      squat:  { label: "Goblet Squat 12kg × 10", fn: u => (u.goblet_test || 0) >= 12 },
      carry:  { label: "Farmer Walk 12kg / hand", fn: u => (u.farmers_carry || 0) >= 12 },
      engine: { label: "TGU 8kg (quality)", fn: u => (u.tgu_test || 0) >= 8 },
    },
  },
  {
    id: "apprentice",
    rank: 2,
    name: "APPRENTICE",
    subtitle: "First Real Strength",
    color: "#B8860B",
    icon: "⚒️",
    description: "Basic strength developed. You are becoming a lifter.",
    men: {
      push:   { label: "KB Press 24kg × 5 / side", fn: u => (u.kb_press_test || 0) >= 24 },
      pull:   { label: "3 Pull Ups", fn: u => (u.pullups || 0) >= 3 },
      hinge:  { label: "Deadlift = Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw },
      squat:  { label: "Goblet Squat 24kg × 10", fn: u => (u.goblet_test || 0) >= 24 },
      carry:  { label: "Farmer Walk 24kg / hand", fn: u => (u.farmers_carry || 0) >= 24 },
      engine: { label: "TGU 24kg (quality)", fn: u => (u.tgu_test || 0) >= 24 },
    },
    women: {
      push:   { label: "KB Press 12kg × 5 / side", fn: u => (u.kb_press_test || 0) >= 12 },
      pull:   { label: "1 Pull Up / 5 Chin Ups (band)", fn: u => (u.pullups || 0) >= 1 },
      hinge:  { label: "Deadlift 0.75 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 0.75 },
      squat:  { label: "Goblet Squat 16kg × 10", fn: u => (u.goblet_test || 0) >= 16 },
      carry:  { label: "Farmer Walk 16kg / hand", fn: u => (u.farmers_carry || 0) >= 16 },
      engine: { label: "TGU 16kg (quality)", fn: u => (u.tgu_test || 0) >= 16 },
    },
  },
  {
    id: "lifter",
    rank: 3,
    name: "LIFTER",
    subtitle: "True Strength Foundation",
    color: "#C0392B",
    icon: "🏋️",
    description: "This is where real strength begins. Most people never get here.",
    men: {
      push:   { label: "Bench Press = Bodyweight", fn: (u, bw) => (u.oneRM?.bench || 0) >= bw },
      pull:   { label: "5 Pull Ups", fn: u => (u.pullups || 0) >= 5 },
      hinge:  { label: "Deadlift 1.5 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 1.5 },
      squat:  { label: "Back Squat = Bodyweight", fn: (u, bw) => (u.oneRM?.squat || 0) >= bw },
      carry:  { label: "Farmer Walk = Bodyweight total", fn: (u, bw) => (u.farmers_carry || 0) >= bw / 2 },
      engine: { label: "100 One-Hand Swings 24kg", fn: u => (u.swing_100_test || 0) >= 24 },
    },
    women: {
      push:   { label: "Bench Press 0.75 × Bodyweight", fn: (u, bw) => (u.oneRM?.bench || 0) >= bw * 0.75 },
      pull:   { label: "3 Pull Ups", fn: u => (u.pullups || 0) >= 3 },
      hinge:  { label: "Deadlift 1.25 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 1.25 },
      squat:  { label: "Back Squat 0.75 × Bodyweight", fn: (u, bw) => (u.oneRM?.squat || 0) >= bw * 0.75 },
      carry:  { label: "Farmer Walk 0.75 BW total", fn: (u, bw) => (u.farmers_carry || 0) >= bw * 0.375 },
      engine: { label: "100 Swings 16kg", fn: u => (u.swing_100_test || 0) >= 16 },
    },
  },
  {
    id: "warrior",
    rank: 4,
    name: "WARRIOR",
    subtitle: "Strong Human Performance",
    color: "#7B3F00",
    icon: "⚔️",
    description: "A strong human by any measure. Top 20% of people who train.",
    men: {
      push:   { label: "Strict Press 0.5 × Bodyweight", fn: (u, bw) => (u.oneRM?.press || 0) >= bw * 0.5 },
      pull:   { label: "10 Pull Ups", fn: u => (u.pullups || 0) >= 10 },
      hinge:  { label: "Deadlift 2 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 2 },
      squat:  { label: "Back Squat = Bodyweight × 15", fn: (u, bw) => (u.squat_15_test || 0) >= bw },
      carry:  { label: "Farmer Walk 32kg / hand", fn: u => (u.farmers_carry || 0) >= 32 },
      engine: { label: "Snatch Test: 100 reps / 5 min / 24kg", fn: u => (u.snatch_test_kg || 0) >= 24 },
    },
    women: {
      push:   { label: "Strict Press 0.35 × Bodyweight", fn: (u, bw) => (u.oneRM?.press || 0) >= bw * 0.35 },
      pull:   { label: "5 Pull Ups", fn: u => (u.pullups || 0) >= 5 },
      hinge:  { label: "Deadlift 1.75 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 1.75 },
      squat:  { label: "Back Squat = Bodyweight × 15", fn: (u, bw) => (u.squat_15_test || 0) >= bw },
      carry:  { label: "Farmer Walk 24kg / hand", fn: u => (u.farmers_carry || 0) >= 24 },
      engine: { label: "Snatch Test: 100 reps / 5 min / 16kg", fn: u => (u.snatch_test_kg || 0) >= 16 },
    },
  },
  {
    id: "titan",
    rank: 5,
    name: "TITAN",
    subtitle: "Rare Strength",
    color: "#1A237E",
    icon: "🔱",
    description: "Rarely seen. Earned through years of consistent, intelligent training.",
    men: {
      push:   { label: "Bench Press = Bodyweight × 15", fn: (u, bw) => (u.bench_15_test || 0) >= bw },
      pull:   { label: "15 Pull Ups", fn: u => (u.pullups || 0) >= 15 },
      hinge:  { label: "Deadlift 2.25 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 2.25 },
      squat:  { label: "Front Squat = Bodyweight", fn: (u, bw) => (u.oneRM?.front_squat || 0) >= bw },
      carry:  { label: "Farmer Walk = Bodyweight / hand", fn: (u, bw) => (u.farmers_carry || 0) >= bw },
      engine: { label: "Snatch Test: 100 reps / 5 min / 28kg", fn: u => (u.snatch_test_kg || 0) >= 28 },
    },
    women: {
      push:   { label: "Bench Press = Bodyweight", fn: (u, bw) => (u.oneRM?.bench || 0) >= bw },
      pull:   { label: "8 Pull Ups", fn: u => (u.pullups || 0) >= 8 },
      hinge:  { label: "Deadlift 2 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 2 },
      squat:  { label: "Front Squat 0.85 × Bodyweight", fn: (u, bw) => (u.oneRM?.front_squat || 0) >= bw * 0.85 },
      carry:  { label: "Farmer Walk = Bodyweight / hand", fn: (u, bw) => (u.farmers_carry || 0) >= bw },
      engine: { label: "Snatch Test: 100 reps / 5 min / 20kg", fn: u => (u.snatch_test_kg || 0) >= 20 },
    },
  },
  {
    id: "gladiator",
    rank: 6,
    name: "GLADIATOR",
    subtitle: "Elite of the House of Strength",
    color: "#4A0000",
    icon: "🏛️",
    description: "The horizon. Few reach it. Fewer stay there.",
    men: {
      push:   { label: "Double KB Press = Bodyweight", fn: (u, bw) => (u.dbl_kb_press_test || 0) >= bw },
      pull:   { label: "Weighted Pull Up +48kg", fn: u => (u.weighted_pullup_kg || 0) >= 48 },
      hinge:  { label: "Deadlift 2.5 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 2.5 },
      squat:  { label: "Overhead Squat = Bodyweight", fn: (u, bw) => (u.oneRM?.ohs || 0) >= bw },
      carry:  { label: "Farmer Walk = Bodyweight / hand", fn: (u, bw) => (u.farmers_carry || 0) >= bw },
      engine: { label: "Engine: one of 3 tests (see below)", fn: u => !!(u.gladiator_engine) },
    },
    women: {
      push:   { label: "Double KB Press 0.75 × Bodyweight", fn: (u, bw) => (u.dbl_kb_press_test || 0) >= bw * 0.75 },
      pull:   { label: "Weighted Pull Up +24kg", fn: u => (u.weighted_pullup_kg || 0) >= 24 },
      hinge:  { label: "Deadlift 2.25 × Bodyweight", fn: (u, bw) => (u.oneRM?.deadlift || 0) >= bw * 2.25 },
      squat:  { label: "Overhead Squat = Bodyweight", fn: (u, bw) => (u.oneRM?.ohs || 0) >= bw },
      carry:  { label: "Farmer Walk 0.75 BW / hand", fn: (u, bw) => (u.farmers_carry || 0) >= bw * 0.75 },
      engine: { label: "Engine: one of 3 tests (see below)", fn: u => !!(u.gladiator_engine) },
    },
    engineOptions: [
      "Long Cycle 40kg — 5 min set",
      "Long Cycle 32kg — 10 min / 100 reps",
      "200 Snatch 24kg — 10 min",
    ],
  },
];

// Determine user's current level based on 1RM data and test results

// ───────────────────────────────────────────────────────────────────────────
