// Styles & font injection — auto-executes on import

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0e0d;
    --bg2: #1a1816;
    --bg3: #242220;
    --bg4: #2e2b28;
    --border: #3a3632;
    --red: #e03428;
    --red-dim: #7a1a14;
    --red-glow: rgba(224,52,40,0.15);
    --gold: #d4a843;
    --gold-dim: rgba(212,168,67,0.18);
    --gold-glow: rgba(212,168,67,0.30);
    --steel: #4a7fa5;
    --steel-dim: rgba(74,127,165,0.15);
    --white: #ffffff;
    --text: #ffffff;
    --gray: #b8bfc8;
    --gray2: #737d8a;
    --accent: #c9a84c;
    --rune: #4a7fa5;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

  .condensed { font-family: 'Barlow Condensed', sans-serif; }
  .cinzel { font-family: 'DM Sans', sans-serif; font-weight: 700; }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background: var(--border);
    outline: none;
    border-radius: 2px;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--gold);
    cursor: pointer;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes timerPulse { 0% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); } 70% { box-shadow: 0 0 0 16px rgba(201,168,76,0); } 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); } }
  @keyframes runeGlow { 0%,100% { text-shadow: 0 0 8px rgba(201,168,76,0.3); } 50% { text-shadow: 0 0 20px rgba(201,168,76,0.8); } }
  @keyframes borderFlicker { 0%,100% { border-color: var(--gold-dim); } 50% { border-color: rgba(201,168,76,0.5); } }

  .fade-in { animation: fadeIn 0.35s ease forwards; }
  .pulse { animation: pulse 1.5s infinite; }
  .timer-pulse { animation: timerPulse 1s infinite; }
  .rune-glow { animation: runeGlow 3s ease infinite; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }

  /* Nordic border decoration */
  .nordic-border {
    border: 1px solid var(--border);
    position: relative;
  }
  .nordic-border::before {
    content: '';
    position: absolute;
    top: -1px; left: 20px; right: 20px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  }
`;
document.head.appendChild(style);

// ─── ENGINE ───────────────────────────────────────────────────────────────────

// DOM SIŁY — 8-week phases

// ───────────────────────────────────────────────────────────────────────────


export const s = {
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
