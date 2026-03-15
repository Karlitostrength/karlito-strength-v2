export const PHASES = {
  1: { name: "FUNDAMENTALS", color: "#4a9eff", weeks: [1,2], scheme: "5×8 paused" },
  2: { name: "BUILDING",     color: "#f0a020", weeks: [3,4], scheme: "6×6" },
  3: { name: "STRENGTH",     color: "#c41e1e", weeks: [5,6], scheme: "5×5" },
  4: { name: "PEAK",         color: "#a78bfa", weeks: [7,8], scheme: "5×3" },
};

export function getPhase(week) {
  if (week <= 2) return 1;
  if (week <= 4) return 2;
  if (week <= 6) return 3;
  return 4;
}
