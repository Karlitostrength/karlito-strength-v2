export const DOM_SILY_LEVELS = [
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


export function getDomSilyLevel(user, bodyweight, gender = "men") {
  if (!user || !bodyweight) return { current: null, rank: 0 };
  let highestPassed = null;
  for (const level of DOM_SILY_LEVELS) {
    const standards = level[gender] || level.men;
    const allPassed = Object.values(standards).every(s => {
      try { return s.fn(user, bodyweight); } catch { return false; }
    });
    if (allPassed) highestPassed = level;
  }
  return highestPassed || null;
}

// Get checklist of what's missing for the next level
export function getNextLevelGaps(user, bodyweight, currentRank, gender = "men") {
  const nextLevel = DOM_SILY_LEVELS.find(l => l.rank === (currentRank || 0) + 1);
  if (!nextLevel) return null;
  const standards = nextLevel[gender] || nextLevel.men;
  const gaps = Object.entries(standards).map(([pillar, s]) => {
    let passed = false;
    try { passed = s.fn(user, bodyweight); } catch {}
    return { pillar, label: s.label, passed };
  });
  return { level: nextLevel, gaps };
}


