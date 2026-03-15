import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PHASES } from "../constants/phases";
import { getPct, getPhase, getSquatExercise } from "../engine/workout";
import { HallOfStrengthWidget } from "../components/RankComponents";
import { ReadinessWidget } from "../components/SmallComponents";


export function DashboardScreen({ user, week, setWeek, onStartWorkout, hasCoach }) {
  const phase = getPhase(week);
  const phaseData = PHASES[phase];
  const weekInPhase = phase === 1 ? week : phase === 2 ? week - 2 : phase === 3 ? week - 4 : week - 6;
  const totalInPhase = 2; // all phases are 2 weeks in 8-week program
  const pct = getPct(week, user.level);
  const days = ["A", "B", "C"];

  const [coachDays, setCoachDays] = useState([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [streak, setStreak] = useState(0);
  const [thisWeekCount, setThisWeekCount] = useState(0);
  const [todayDone, setTodayDone] = useState(false);

  // Detect today's day of week → suggest which day to train
  const now = new Date();
  const dowMap = [null, "A", "B", "C", "A", "B", "C", null]; // Sun=0 rest, Mon=A, Tue=B...
  const suggestedDay = dowMap[now.getDay()];
  const todayStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  useEffect(() => {
    const loadCoachDays = async () => {
      if (!hasCoach) { setLoadingDays(false); return; }
      setLoadingDays(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase.from("program_days").select("*").eq("athlete_id", authUser.id).eq("week", week);
          setCoachDays(data || []);
        }
      } catch(e) {}
      setLoadingDays(false);
    };

    const calcStreak = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data: logs } = await supabase.from("workouts").select("created_at").eq("user_id", authUser.id).order("created_at", { ascending: false });
        if (!logs || logs.length === 0) return;

        // Count this week
        const now = new Date();
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0,0,0,0);
        const twc = logs.filter(l => new Date(l.created_at) >= startOfWeek).length;
        setThisWeekCount(twc);

        // Calculate weekly streak — weeks with at least 1 workout
        const weekKeys = new Set(logs.map(l => {
          const d = new Date(l.created_at);
          const day = d.getDay() || 7;
          const monday = new Date(d); monday.setDate(d.getDate() - day + 1); monday.setHours(0,0,0,0);
          return monday.toISOString().slice(0, 10);
        }));

        const sortedWeeks = [...weekKeys].sort().reverse();
        let s = 0;
        const nowMonday = new Date(now); nowMonday.setDate(now.getDate() - (now.getDay() || 7) + 1); nowMonday.setHours(0,0,0,0);

        for (let i = 0; i < sortedWeeks.length; i++) {
          const expected = new Date(nowMonday); expected.setDate(nowMonday.getDate() - i * 7);
          const expectedKey = expected.toISOString().slice(0, 10);
          if (sortedWeeks[i] === expectedKey) { s++; } else { break; }
        }
        setStreak(s);
      } catch(e) {}
    };

    loadCoachDays();
    calcStreak();
  }, [week, hasCoach]);

  const hasCoachProgram = coachDays.length > 0;

  return (
    <div style={s.screen}>
      {/* Nordic header rune */}
      <div style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.5em", color: "var(--gray2)", marginBottom: 16, fontFamily: "'Barlow Condensed', sans-serif" }}>
        · KARLITO STRENGTH ·
      </div>

      {/* Readiness check-in */}
      <ReadinessWidget authUser={null} />
      {/* Gladiator / Personal Touch */}
      <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>⚔️</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, color: "var(--white)", letterSpacing: "0.15em", fontWeight: 900, textTransform: "uppercase" }}>
          STRENGTH AND HONOR
        </div>
      </div>
      {/* Program type badge */}
      {hasCoach ? (
        <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--gold-dim)", borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "var(--accent)" }}>⚔</span>
          <div>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>COACHED ATHLETE</div>
            <div style={{ fontSize: 11, color: "var(--gray)" }}>Personalized program from your coach</div>
          </div>
        </div>
      ) : (
        <div style={{ background: "rgba(74,127,165,0.08)", border: "1px solid var(--steel-dim)", borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "var(--steel)" }}>ᛒ</span>
          <div>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, fontWeight: 700, color: "var(--steel)" }}>FREE 8-WEEK PROGRAM</div>
            <div style={{ fontSize: 11, color: "var(--gray)" }}>SBD + Kettlebell periodization</div>
          </div>
        </div>
      )}

      {/* Streak + This Week */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ ...s.card, padding: "12px 14px", background: streak >= 3 ? "linear-gradient(135deg, rgba(192,57,43,0.18), rgba(201,168,76,0.06))" : undefined, borderColor: streak >= 3 ? "rgba(201,168,76,0.4)" : "var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: streak >= 1 ? 22 : 16 }}>{streak >= 4 ? "🔥" : streak >= 2 ? "⚡" : streak >= 1 ? "💪" : "○"}</span>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, lineHeight: 1, color: streak >= 3 ? "#f06400" : "var(--white)" }}>
                {streak}
              </div>
              <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em" }}>WEEK STREAK</div>
            </div>
          </div>
          {streak >= 3 && <div style={{ fontSize: 10, color: "#f06400", marginTop: 4 }}>Don't break the chain!</div>}
          {streak === 0 && <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 4 }}>Start your streak today</div>}
        </div>
        <div style={{ ...s.card, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, lineHeight: 1, color: thisWeekCount >= 2 ? "var(--red)" : "var(--white)" }}>
                {thisWeekCount}
              </div>
              <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em" }}>THIS WEEK</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 4 }}>
            {thisWeekCount === 0 ? "No sessions yet" : thisWeekCount === 1 ? "1 session done" : `${thisWeekCount} sessions 💪`}
          </div>
        </div>
      </div>

    {/* Phase header - only for free users */}
      {!hasCoach && <div style={{ ...s.card, background: `linear-gradient(135deg, var(--bg2) 0%, rgba(196,30,30,0.08) 100%)`, borderColor: phaseData.color + "44", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 4 }}>CURRENT PHASE</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, color: phaseData.color, lineHeight: 1 }}>{phaseData.name}</div>
            <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>Week {week} of 8 · {weekInPhase}/{totalInPhase} in phase · {phaseData.scheme}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{week}</div>
            <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.1em" }}>WEEK</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
            <div style={{ ...s.progressBar((week / 8) * 100, phaseData.color) }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 4 }}>{Math.round((week / 8) * 100)}% complete</div>
       </div>
      </div>}

      {/* Week indicator for coached athletes */}
      {hasCoach && (
        <div style={{ ...s.card, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.2em", marginBottom: 4 }}>CURRENT WEEK</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900 }}>Week {week}</div>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 48, fontWeight: 900, color: "var(--red)" }}>{week}</div>
        </div>
      )}

      {/* Intensity today - only for free users */}
      {!hasCoach && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[["INTENSITY", `${Math.round(pct * 100)}%`, "of 1RM"], ["KB", `${user.kgKB}kg`, "kettlebell"], ["LEVEL", (user?.level || 'beginner').toUpperCase().slice(0,3), user.level]].map(([label, val, sub]) => (
          <div key={label} style={{ ...s.card, textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: "var(--gray2)" }}>{sub}</div>
         </div>
        ))}
      </div>}

      {/* This week's sessions */}
      {/* HALL OF STRENGTH mini feed */}
      <HallOfStrengthWidget />

      {/* TODAY BANNER */}
      <div style={{ ...s.card, borderColor: "rgba(192,57,43,0.5)", background: "linear-gradient(135deg, rgba(192,57,43,0.1) 0%, rgba(192,57,43,0.03) 100%)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--red)", fontFamily: "'Cinzel', serif", letterSpacing: "0.2em", marginBottom: 4 }}>TODAY</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>{todayStr}</div>
            {suggestedDay && !hasCoach && (
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>
                Suggested: <span style={{ color: "var(--accent)", fontWeight: 600 }}>Day {suggestedDay}</span>
              </div>
            )}
            {suggestedDay === null && (
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>Rest day — recover well</div>
            )}
          </div>
          {suggestedDay && (
            <button onClick={() => onStartWorkout(suggestedDay)}
              style={{ background: "var(--red)", border: "none", borderRadius: 4, padding: "10px 18px", fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", color: "#fff", cursor: "pointer" }}>
              TRAIN →
            </button>
          )}
        </div>
      </div>

      <div style={s.sectionLabel}>THIS WEEK'S SESSIONS</div>

      {loadingDays ? (
        <div style={{ ...s.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>Loading...</div>
        </div>
      ) : hasCoach ? (
        // COACHED ATHLETE - show only assigned days, or "AWAITING" if none
        hasCoachProgram ? (
          <>
            {coachDays.map(coachDay => (
              <div key={coachDay.id} style={{ ...s.card, marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s", borderColor: "var(--red-dim)" }}
                onClick={() => onStartWorkout(coachDay.day)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: "var(--red)" }}>DAY {coachDay.day}</div>
                      <div style={{ fontSize: 10, color: "var(--accent)", background: "rgba(232,213,160,0.1)", padding: "2px 6px", borderRadius: 3 }}>COACH</div>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700 }}>{coachDay.title}</div>
                    {coachDay.notes && <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>{coachDay.notes}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--gray)", fontFamily: "'Barlow Condensed', sans-serif" }}>START</span>
                    <span style={{ color: "var(--gray2)", fontSize: 16 }}>›</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ ...s.card, textAlign: "center", padding: 32, borderColor: "var(--red-dim)" }}>
            <div style={{ fontSize: 24 }}>⏳</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginTop: 8 }}>AWAITING YOUR PROGRAM</div>
            <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6 }}>Your coach hasn't assigned Week {week} yet. Check back soon!</div>
          </div>
        )
      ) : (
        // FREE USER - show default 8-week program
        days.map(day => {
          const dayName = day === "A" ? "SQUAT DOMINANT" : day === "B" ? "DEADLIFT DOMINANT" : "BENCH DOMINANT";
          const sqName = getSquatExercise(week, user.injuries);
          const dlPaused = (user.level === "beginner" && week <= 5) || (user.level === "intermediate" && week <= 4);
          const dlName = (user.injuries?.lowerBack ? "Block Pull" : "Deadlift") + (dlPaused ? " (paused)" : "");
          const bpPaused = user.level !== "advanced" && week <= 4;
          const bpName = (bpPaused ? "Paused " : "") + "Bench Press";
          return (
            <div key={day} style={{ ...s.card, marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }}
              onClick={() => onStartWorkout(day)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: "var(--red)" }}>DAY {day}</div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700 }}>{dayName}</div>
                  <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>
                    {day === "A" ? sqName : day === "B" ? dlName : bpName}
                  </div>
                </div>
                <div style={{ color: "var(--gray2)", fontSize: 20 }}>›</div>
              </div>
            </div>
          );
        })
      )}

      {/* Week navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => setWeek(w => Math.max(1, w - 1))}>← PREV WEEK</button>
        <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => setWeek(w => Math.min(8, w + 1))}>NEXT WEEK →</button>
      </div>

      {week === 12 && (
        <div style={{ ...s.card, borderColor: "var(--accent)", background: "rgba(232,213,160,0.05)", marginTop: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--accent)", marginBottom: 8 }}>🏆 TEST WEEK</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.7 }}>
            Squat 1RM · Bench 1RM · Deadlift 1RM<br />
            5 min Snatch Test · Max Pull Ups · Max Dips
          </div>
        </div>
      )}

      {/* Upgrade CTA for free users */}
      {!hasCoach && (
        <div style={{ ...s.card, borderColor: "var(--accent)", background: "rgba(232,213,160,0.05)", marginTop: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--accent)", marginBottom: 6 }}>🎯 WANT PERSONALIZED COACHING?</div>
          <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.6, marginBottom: 12 }}>
            Get a custom program tailored to your goals,<br />with direct feedback from Coach Karlito.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a href="https://www.instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" style={{ ...s.btn, display: "inline-block", textDecoration: "none", padding: "10px 16px", fontSize: 13 }}>
              📸 INSTAGRAM
            </a>
            <a href="mailto:karolprzybycien91@gmail.com" style={{ ...s.btnGhost, display: "inline-block", textDecoration: "none", padding: "10px 16px", fontSize: 13 }}>
              ✉️ EMAIL
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
