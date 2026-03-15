
export function getPhase(week) {
  if (week <= 2) return 1;
  if (week <= 4) return 2;
  if (week <= 6) return 3;
  return 4;
}

export function getPct(week, level) {
  // Intensity by phase: FUNDAMENT 70%, BUDOWANIE 75%, SIŁA 80%, SZCZYT 87%
  const base = {
    beginner:     [0.68, 0.73, 0.78, 0.85],
    intermediate: [0.70, 0.75, 0.80, 0.87],
    advanced:     [0.72, 0.77, 0.83, 0.90],
  };
  const arr = base[level] || base.intermediate;
  return arr[getPhase(week) - 1];
}

export function getSetsReps(week) {
  if (week <= 2) return { sets: 5, reps: 8 };  // FUNDAMENT
  if (week <= 4) return { sets: 6, reps: 6 };  // BUDOWANIE
  if (week <= 6) return { sets: 5, reps: 5 };  // SIŁA
  return { sets: 5, reps: 3 };                  // SZCZYT
}

export function getSwingProtocol(week) {
  if (week <= 4) return { minutes: 8 + (week - 1), reps: 10 + (week - 1), label: `${8 + (week-1)} min × ${10 + (week-1)} reps/min` };
  if (week <= 8) return { minutes: 10, reps: 15, label: `10 min × 15 reps/min` };
  return { minutes: 10, reps: 20, label: `10 min × 20 reps/min (Power EMOM)` };
}

export function getSnatchMaxProtocol(week, level) {
  // 4×6/6, progress to 4×12/12, then heavier KB
  // Beginners: one arm swing; intermediate/advanced: snatch
  const startReps = 6;
  const targetReps = 12;
  // +1 rep every 2 weeks
  const currentReps = Math.min(startReps + Math.floor((week - 1) / 2), targetReps);
  const reachedTarget = currentReps >= targetReps;
  const isSwing = level === "beginner";
  const exercise = isSwing ? "One Arm Swing" : "KB Snatch";
  return {
    sets: 4,
    reps: currentReps,
    exercise,
    isSwing,
    label: `4 × ${currentReps}/${currentReps} · ${exercise}`,
    note: reachedTarget
      ? `🔥 12 reps reached — go up to a heavier KB!`
      : `Weight +2 sizes · Rest 2 min · Goal: 12 reps → heavier KB`,
    reachedTarget,
  };
}

export function adjustWeight(weight, rpe) {
  if (rpe > 9) return Math.round(weight * 0.95 / 2.5) * 2.5;
  if (rpe < 7) return Math.round(weight * 1.025 / 2.5) * 2.5;
  return weight;
}

export function calcWeight(oneRM, pct) {
  return Math.round(oneRM * pct / 2.5) * 2.5;
}

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
export function getBenchScheme(week, level, oneRM) {
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
export function getDeadliftScheme(week, level, oneRM, injuries) {
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
export function getSquatExercise(week, injuries) {
  injuries = injuries || {};
  const base = injuries.knee ? "Box Squat" : "Back Squat";
  return week <= 4 ? `Paused ${base}` : base;
}

export function generateWorkout(day, week, level, oneRM, injuries = {}) {
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



