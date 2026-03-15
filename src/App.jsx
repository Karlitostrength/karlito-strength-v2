import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { sendPushToUser } from "./lib/push";
import "./lib/styles";
import { PHASES } from "./constants/phases";
import { getPhase } from "./engine/workout";
import { LandingScreen } from "./screens/Landing";
import { AuthScreen, OnboardingScreen } from "./screens/Auth";
import { DashboardScreen } from "./screens/Dashboard";
import { WorkoutScreen } from "./screens/Workout";
import { ScheduleScreen, ProgressScreen } from "./screens/Progress";
import { CoachScreen } from "./screens/Coach";
import { ProfileScreen } from "./screens/Profile";
import { ChatScreen } from "./screens/Chat";
import { HistoryScreen } from "./screens/History";
import { LibraryScreen } from "./screens/Library";

const NAV_ATHLETE = [
  { id: "dashboard", icon: "⚡", label: "HOME" },
  { id: "workout",   icon: "🏋️", label: "TRAIN" },
  { id: "schedule",  icon: "📅", label: "PLAN" },
  { id: "chat",      icon: "💬", label: "CHAT" },
  { id: "profile",   icon: "👤", label: "ME" },
];
const NAV_COACH = [
  { id: "dashboard", icon: "⚡", label: "HOME" },
  { id: "library",   icon: "📚", label: "LIBRARY" },
  { id: "chat",      icon: "💬", label: "CHAT" },
  { id: "coach",     icon: "🎯", label: "COACH" },
  { id: "profile",   icon: "👤", label: "ME" },
];


export default function App() {
  // Check for invite code in URL
  const [inviteCode, setInviteCode] = useState(null);
  
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");

    if (path.startsWith("/invite/")) {
      const code = path.replace("/invite/", "").toUpperCase();
      setInviteCode(code);
      localStorage.setItem("ks_invite", code);
    } else if (refParam) {
      // ?ref=KARLITO or any code in query param
      const code = refParam.toUpperCase();
      setInviteCode(code);
      localStorage.setItem("ks_invite", code);
    } else if (path === "/free" || path === "/start" || path === "/join") {
      // Free program path - no invite code, clear any saved
      localStorage.removeItem("ks_invite");
      setInviteCode(null);
    } else {
      const saved = localStorage.getItem("ks_invite");
      if (saved) setInviteCode(saved);
    }
  }, []);

const [authUser, setAuthUser] = useState(undefined);
  const [user, setUser] = useState(null);
 const [isCoach, setIsCoach] = useState(false);
const [hasCoach, setHasCoach] = useState(false);
  const [week, setWeek] = useState(1);
  const [tab, setTab] = useState("dashboard");
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null);
    });
  }, []);

 useEffect(() => {
    if (!authUser) return;

    // Load from localStorage first (instant)
    const saved = localStorage.getItem("ks_profile");
    if (saved) setUser(JSON.parse(saved));

    // Sync full profile from Supabase
    supabase.from("profiles")
      .select("role, coach_id, name, squat, bench, deadlift, kb_weight, level, pullups, recovery, main_goal, competition_date, athlete_notes")
      .eq("id", authUser.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setIsCoach(data.role === "coach");
        setHasCoach(data.role === "athlete" && !!data.coach_id);

        // Merge DB data into user profile
        if (data.squat || data.bench || data.level) {
          const merged = {
            ...(saved ? JSON.parse(saved) : {}),
            name: data.name,
            level: data.level || (saved ? JSON.parse(saved).level : "intermediate"),
            oneRM: {
              squat: data.squat || (saved ? JSON.parse(saved).oneRM?.squat : ""),
              bench: data.bench || (saved ? JSON.parse(saved).oneRM?.bench : ""),
              deadlift: data.deadlift || (saved ? JSON.parse(saved).oneRM?.deadlift : ""),
            },
            kgKB: data.kb_weight || (saved ? JSON.parse(saved).kgKB : 16),
            pullups: data.pullups || (saved ? JSON.parse(saved).pullups : ""),
            recovery: data.recovery || (saved ? JSON.parse(saved).recovery : 3),
          };
          localStorage.setItem("ks_profile", JSON.stringify(merged));
          setUser(merged);
        }
      });
  }, [authUser]);

  const [showAuth, setShowAuth] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("ks_pwa_dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (!dismissed && !isStandalone) {
      const timer = setTimeout(() => setShowPwaBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (authUser === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: "var(--gray)", letterSpacing: "0.2em" }}>LOADING...</div>
      </div>
    );
  }

  if (!authUser && !showAuth) {
    return <LandingScreen onSignUp={() => setShowAuth(true)} />;
  }

  if (!authUser) {
    return <AuthScreen onAuth={async (u) => {
      setAuthUser(u);
      // If invite code, assign coach
      const code = localStorage.getItem("ks_invite");
      if (code === "KARLITO") {
        await supabase.from("profiles").update({ 
          coach_id: "a6efb4f6-a5aa-4829-89c3-adb486cf187c" 
        }).eq("id", u.id);
        localStorage.removeItem("ks_invite");
        setHasCoach(true);
      }
    }} />;
  }

  if (!user) {
    return <OnboardingScreen onComplete={async (u) => {
      localStorage.setItem("ks_profile", JSON.stringify(u));
      setUser(u);
      // Save to Supabase so coach can see it
      try {
        await supabase.from("profiles").update({
          squat: u.oneRM?.squat || null,
          bench: u.oneRM?.bench || null,
          deadlift: u.oneRM?.deadlift || null,
          kb_weight: u.kgKB || null,
          level: u.level || null,
          pullups: u.pullups || null,
          recovery: u.recovery || null,
        }).eq("id", authUser.id);
      } catch(e) {}
      setTab("dashboard");
    }} />;
  }

  const handleStartWorkout = (day) => { setActiveDay(day); setTab("workout"); };
  const handleWorkoutDone = async (workoutInfo) => {
    // Push to coach when athlete completes workout
    if (!isCoach && authUser) {
      const athleteName = user?.name || authUser.email?.split("@")[0] || "Athlete";
      const dayLabel = workoutInfo?.day ? `Day ${workoutInfo.day}` : "a session";
      const weekLabel = workoutInfo?.week ? `Wk ${workoutInfo.week}` : "";
      sendPushToUser(
        "a6efb4f6-a5aa-4829-89c3-adb486cf187c",
        `💪 ${athleteName} just logged ${dayLabel}`,
        `${weekLabel} — tap to review their session`,
        "workout",
        "/"
      );
    }
    setActiveDay(null);
    setTab("history");
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
<div style={{...s.app, background: `linear-gradient(rgba(6,8,10,0.92) 0%, rgba(6,8,10,0.88) 50%, rgba(6,8,10,0.95) 100%), url('https://drive.google.com/uc?export=view&id=1U8QROGZWsy5_BxVcrUFs98HIYt1yud7-') center 20% / cover fixed`}}>

      {showPwaBanner && (
        <div style={{ position: "fixed", bottom: 70, left: 12, right: 12, zIndex: 9999, background: "#1a1a1a", border: "1px solid var(--accent)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, letterSpacing: "0.1em", color: "var(--text)" }}>📲 ADD TO HOME SCREEN</div>
            <button onClick={() => { setShowPwaBanner(false); localStorage.setItem("ks_pwa_dismissed", "1"); }} style={{ background: "none", border: "none", color: "var(--gray)", fontSize: 18, cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "var(--gray)", letterSpacing: "0.05em", lineHeight: 1.5 }}>
            {isIOS
              ? "Tap the Share button below → \"Add to Home Screen\" for the full app experience."
              : "Tap the menu (⋮) in your browser → \"Add to Home Screen\" for the full app experience."}
          </div>
          <button onClick={() => { setShowPwaBanner(false); localStorage.setItem("ks_pwa_dismissed", "1"); }} style={{ background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "0.15em", padding: "8px 0", cursor: "pointer" }}>GOT IT</button>
        </div>
      )}
      <div style={s.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={s.logo}>KARLITO <span style={s.logoRed}>STRENGTH</span></div>
            <div style={s.tagline}>FERRUM · SANGUIS · GLORIA</div>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "var(--gray2)", textAlign: "right", letterSpacing: "0.1em" }}>
            <div style={{ color: "var(--gold)", fontSize: 10 }}>WK {week}</div>
            {!hasCoach && <div>{PHASES[getPhase(week)].name}</div>}
          </div>
        </div>
      </div>

      <div className="fade-in" key={tab + activeDay}>
        {tab === "dashboard" && <DashboardScreen user={user} week={week} setWeek={setWeek} onStartWorkout={handleStartWorkout} hasCoach={hasCoach} />}
        {tab === "workout" && !activeDay && <DashboardScreen user={user} week={week} setWeek={setWeek} onStartWorkout={handleStartWorkout} hasCoach={hasCoach} />}
        {tab === "workout" && activeDay && <WorkoutScreen user={user} week={week} dayKey={activeDay} authUser={authUser} onComplete={handleWorkoutDone} hasCoach={hasCoach} />}
        {tab === "schedule" && <ScheduleScreen authUser={authUser} hasCoach={hasCoach} week={week} setWeek={setWeek} onStartWorkout={(day) => { setActiveDay(day); setTab("workout"); }} />}
        {tab === "chat" && <ChatScreen authUser={authUser} isCoach={isCoach} />}
        {tab === "library" && <LibraryScreen authUser={authUser} isCoach={isCoach} />}
        {tab === "history" && <HistoryScreen />}
        {tab === "progress" && <ProgressScreen user={user} week={week} />}
   {tab === "profile" && <ProfileScreen user={user} authUser={authUser} />}
        {tab === "coach" && <CoachScreen />}
      </div>

      <nav style={s.navBar}>
        {(isCoach ? NAV_COACH : NAV_ATHLETE).map(n => (
          <div key={n.id} style={s.navItem(tab === n.id)} onClick={() => { setTab(n.id); if (n.id !== "workout") setActiveDay(null); }}>
            <div style={{ fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", color: tab === n.id ? "var(--gold)" : "var(--gray)" }}>{n.icon}</div>
            <div style={{ ...s.navLabel, color: tab === n.id ? "var(--gold)" : "var(--gray2)" }}>{n.label}</div>
          </div>
        ))}
      </nav>
    </div>
  );
}
