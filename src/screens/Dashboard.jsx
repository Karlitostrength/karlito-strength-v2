import { s } from "../lib/styles";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { HallOfStrengthWidget } from "../components/RankComponents";
import { ReadinessWidget } from "../components/SmallComponents";
import { ComingUp, BroadcastButton } from "./ComingUp";

export function DashboardScreen({ user, week, setWeek, onStartWorkout, hasCoach }) {
  const days = ["A", "B", "C"];

  const [coachDays, setCoachDays] = useState([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [streak, setStreak] = useState(0);
  const [thisWeekCount, setThisWeekCount] = useState(0);
  const [authUserId, setAuthUserId] = useState(null);
  const [isCoach, setIsCoach] = useState(false);

  const now = new Date();
  const dowMap = [null, "A", "B", "C", "A", "B", "C", null];
  const suggestedDay = dowMap[now.getDay()];
  const todayStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setAuthUserId(authUser.id);
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", authUser.id).single().catch(() => ({ data: null }));
        setIsCoach(profile?.role === "coach");
      }
    };
    loadUser();
  }, []);

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

        const now = new Date();
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0,0,0,0);
        const twc = logs.filter(l => new Date(l.created_at) >= startOfWeek).length;
        setThisWeekCount(twc);

        const weekKeys = new Set(logs.map(l => {
          const d = new Date(l.created_at);
          const day = d.getDay() || 7;
          const monday = new Date(d); monday.setDate(d.getDate() - day + 1); monday.setHours(0,0,0,0);
          return monday.toISOString().slice(0, 10);
        }));

        const sortedWeeks = [...weekKeys].sort().reverse();
        let st = 0;
        const nowMonday = new Date(now); nowMonday.setDate(now.getDate() - (now.getDay() || 7) + 1); nowMonday.setHours(0,0,0,0);

        for (let i = 0; i < sortedWeeks.length; i++) {
          const expected = new Date(nowMonday); expected.setDate(nowMonday.getDate() - i * 7);
          const expectedKey = expected.toISOString().slice(0, 10);
          if (sortedWeeks[i] === expectedKey) { st++; } else { break; }
        }
        setStreak(st);
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

      {/* Strength and Honor */}
      <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>⚔️</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, color: "var(--text)", letterSpacing: "0.15em", fontWeight: 900, textTransform: "uppercase" }}>
          STRENGTH AND HONOR
        </div>
      </div>

      {/* ── COMING UP — tribe events board ── */}
      {authUserId && <ComingUp authUser={{ id: authUserId }} isCoach={isCoach} userName={user?.name} />}

      {/* ── BROADCAST (coach only) ── */}
      <BroadcastButton isCoach={isCoach} />

      {/* Streak + This Week */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ ...s.card, padding: "12px 14px", background: streak >= 3 ? "linear-gradient(135deg, rgba(192,57,43,0.18), rgba(201,168,76,0.06))" : undefined, borderColor: streak >= 3 ? "rgba(201,168,76,0.4)" : "var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: streak >= 1 ? 22 : 16 }}>{streak >= 4 ? "🔥" : streak >= 2 ? "⚡" : streak >= 1 ? "💪" : "○"}</span>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, lineHeight: 1, color: streak >= 3 ? "var(--red)" : "var(--text)" }}>
                {streak}
              </div>
              <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em" }}>WEEK STREAK</div>
            </div>
          </div>
          {streak >= 3 && <div style={{ fontSize: 10, color: "var(--red)", marginTop: 4 }}>Don't break the chain!</div>}
          {streak === 0 && <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 4 }}>Start your streak today</div>}
        </div>
        <div style={{ ...s.card, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, lineHeight: 1, color: thisWeekCount >= 2 ? "var(--red)" : "var(--text)" }}>
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

      {/* HALL OF STRENGTH mini feed */}
      <HallOfStrengthWidget />

      {/* TODAY BANNER */}
      <div style={{ ...s.card, borderColor: "rgba(192,57,43,0.5)", background: "linear-gradient(135deg, rgba(192,57,43,0.1) 0%, rgba(192,57,43,0.03) 100%)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--red)", fontFamily: "'Cinzel', serif", letterSpacing: "0.2em", marginBottom: 4 }}>TODAY</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>{todayStr}</div>
            {suggestedDay === null && (
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>Rest day — recover well</div>
            )}
          </div>
        </div>
      </div>

      <div style={s.sectionLabel}>THIS WEEK'S SESSIONS</div>

      {loadingDays ? (
        <div style={{ ...s.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>Loading...</div>
        </div>
      ) : hasCoach ? (
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
                    {coachDay.notes && <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{coachDay.notes}</div>}
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
        <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 24 }}>💪</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, marginTop: 8 }}>NO PROGRAMME ASSIGNED</div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6, lineHeight: 1.6 }}>
            Head to <strong style={{ color: "var(--text)" }}>TRAIN</strong> to log your own session, or message your coach.
          </div>
        </div>
      )}

      {/* Week navigation — coached only */}
      {hasCoach && (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => setWeek(w => Math.max(1, w - 1))}>← PREV WEEK</button>
          <button style={{ ...s.btnGhost, flex: 1, width: "auto" }} onClick={() => setWeek(w => w + 1)}>NEXT WEEK →</button>
        </div>
      )}
    </div>
  );
}
