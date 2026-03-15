import { useState, useEffect } from "react";

export function LandingScreen({ onSignUp }) {
  const REVOLUT_LINK = "https://revolut.me/karolz7hb";
  const MONTHLY_PRICE = "£99";
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fade = (delay = 0) => ({
    opacity: heroVisible ? 1 : 0,
    transform: heroVisible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--white)", fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: "0 auto", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 48px" }}>
        {/* Hero photo background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/hero.jpg')", backgroundSize: "cover", backgroundPosition: "center 20%", filter: "grayscale(100%)", zIndex: 0 }} />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 50%, rgba(13,13,13,0.92) 85%, var(--bg) 100%)", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ ...fade(0), fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.5em", color: "var(--accent)", marginBottom: 16, textTransform: "uppercase" }}>
            Karlito Strength
          </div>
          <div style={{ ...fade(100), fontFamily: "'Cinzel', serif", fontSize: 44, fontWeight: 900, lineHeight: 1.05, marginBottom: 20, textTransform: "uppercase" }}>
            FORGED<br />
            THROUGH<br />
            <span style={{ color: "var(--accent)", WebkitTextStroke: "1px var(--accent)", WebkitTextFillColor: "transparent" }}>IRON</span>
          </div>
          <div style={{ ...fade(200), fontSize: 15, color: "var(--gray)", lineHeight: 1.75, marginBottom: 36, maxWidth: 340 }}>
            Strength training + kettlebell coaching. Built for people who want to get strong, move well, and actually enjoy the process.
          </div>

          {/* Two CTAs */}
          <div style={{ ...fade(300), display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => { localStorage.setItem("ks_invite", "KARLITO"); onSignUp(); }}
              style={{ background: "var(--red)", color: "#fff", border: "none", borderRadius: 10, padding: "18px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 19, fontWeight: 900, letterSpacing: "0.08em", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>GET COACHED</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>{MONTHLY_PRICE}/mo →</span>
            </button>
            <button onClick={onSignUp}
              style={{ background: "transparent", color: "var(--gray)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}>
              Try Free 8-Week Program
            </button>
          </div>
          <div style={{ ...fade(400), fontSize: 11, color: "var(--gray2)", marginTop: 14, textAlign: "center", letterSpacing: "0.05em" }}>
            No credit card · Cancel anytime
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)", margin: "0 24px" }} />

      {/* ── SOCIAL PROOF ── */}
      <div style={{ padding: "36px 24px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 36 }}>
          {[["5+", "Years coaching"], ["8", "Week program"], ["SBD+KB", "Methodology"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center", padding: "16px 8px", background: "var(--bg2)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 4, letterSpacing: "0.06em" }}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* ── DOM SIŁY PHILOSOPHY ── */}
        <div style={{ margin: "0 0 40px", padding: "28px 24px", background: "linear-gradient(135deg, rgba(184,134,11,0.08) 0%, rgba(184,134,11,0.02) 100%)", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.4em", color: "var(--accent)", marginBottom: 14 }}>PHILOSOPHY</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, color: "var(--white)" }}>
            DOM SIŁY<br />
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--accent)", letterSpacing: "0.15em" }}>HOUSE OF STRENGTH</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.8, marginBottom: 20 }}>
            This is not a fitness app. This is a school of strength — built on the model of a dojo, where training is a tool for human development. Physically and mentally.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { icon: "⚔️", name: "IRON", desc: "Barbell", isEmoji: true },
              { icon: "KB", name: "KETTLEBELL", desc: "Kettlebell skill", isEmoji: false },
              { icon: "🔥", name: "ENGINE", desc: "Endurance", isEmoji: true },
            ].map(({ icon, name, desc, isEmoji }) => (
              <div key={name} style={{ textAlign: "center", padding: "14px 8px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
                {isEmoji ? (
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif",
                    color: "#111", background: "var(--accent)", borderRadius: 4,
                    padding: "2px 6px", display: "inline-block", letterSpacing: "0.05em" }}>{icon}</div>
                )}
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em" }}>{name}</div>
                <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 3 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: "rgba(184,134,11,0.15)", margin: "0 0 16px" }} />
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.3em", color: "var(--accent)", marginBottom: 12 }}>THE PATH — 6 RANKS</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            {[
              { icon: "🔰", name: "ADEPT", color: "#6B7280" },
              { icon: "⚒️", name: "APP.", color: "#B8860B" },
              { icon: "🏋️", name: "LIFTER", color: "#C0392B" },
              { icon: "⚔️", name: "WARRIOR", color: "#7B3F00" },
              { icon: "🔱", name: "TITAN", color: "#1A237E" },
              { icon: "🏛️", name: "GLAD.", color: "#4A0000" },
            ].map((l, i) => (
              <div key={l.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                {i > 0 && <div style={{ display: "none" }} />}
                <div style={{ fontSize: 18 }}>{l.icon}</div>
                <div style={{ fontSize: 8, color: l.color, fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>{l.name}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--gray2)", lineHeight: 1.7, marginTop: 12, fontStyle: "italic" }}>
            "Each rank is earned through tested standards — not time served, not money paid. Like a belt in BJJ, it means something."
          </div>
        </div>

        {/* ── WHAT YOU GET ── */}
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.4em", color: "var(--gray2)", marginBottom: 20 }}>WHAT'S INCLUDED</div>
        {[
          ["🏋️", "Personalised Program", "Custom strength + kettlebell plan built around your lifts, schedule and goals. Updated weekly."],
          ["🎯", "Direct Coach Access", "Message Coach Karlito anytime. Get technique feedback, program adjustments, and accountability."],
          ["📹", "Video Technique Library", "Exercise demos for every movement. Watch before you lift, never guess on form."],
          ["📊", "Progress Tracking", "Log every session, track volume and intensity. See exactly how you're improving."],
          ["🥗", "Nutrition Guidance", "Personalised diet plans uploaded directly to your app by your coach."],
          ["🔔", "Smart Notifications", "Get notified when your program updates or your coach sends feedback."],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 16, marginBottom: 16, padding: "16px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 26, flexShrink: 0, width: 36, textAlign: "center" }}>{icon}</div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 4, letterSpacing: "0.02em" }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.65 }}>{desc}</div>
            </div>
          </div>
        ))}

        {/* ── HOW IT WORKS ── */}
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.4em", color: "var(--gray2)", marginTop: 32, marginBottom: 20 }}>HOW IT WORKS</div>
        {[
          ["01", "Create your account", "Sign up and complete your profile — current lifts, goals, training history."],
          ["02", "Pay via Revolut", `Send ${MONTHLY_PRICE} to @karolz7hb. Use your name as reference.`],
          ["03", "Get your program", "Within 24h your coach builds and assigns your first week."],
          ["04", "Train & communicate", "Log sessions, message your coach, get feedback. Every week."],
        ].map(([num, title, desc]) => (
          <div key={num} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "rgba(196,30,30,0.35)", flexShrink: 0, width: 36, lineHeight: 1 }}>{num}</div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}

        {/* ── PRICING ── */}
        <div style={{ background: "linear-gradient(135deg, rgba(196,30,30,0.12) 0%, rgba(196,30,30,0.04) 100%)", border: "1px solid rgba(196,30,30,0.35)", borderRadius: 16, padding: "28px 24px", margin: "32px 0" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.4em", color: "var(--gray2)", marginBottom: 12 }}>MONTHLY COACHING</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 58, fontWeight: 900, lineHeight: 1 }}>{MONTHLY_PRICE}</div>
            <div style={{ fontSize: 14, color: "var(--gray)" }}>/ month</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--gray2)", marginBottom: 24 }}>Cancel anytime · No contracts</div>
          {["Custom weekly program", "Unlimited coach messaging", "Video technique library", "Nutrition plan uploads", "Progress analytics", "Push notifications"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 900 }}>✓</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--gray)" }}>{item}</div>
            </div>
          ))}
          <a href={REVOLUT_LINK} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", marginTop: 24, background: "var(--red)", color: "#fff", borderRadius: 10, padding: "16px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 900, letterSpacing: "0.08em", textAlign: "center", textDecoration: "none" }}>
            PAY {MONTHLY_PRICE} VIA REVOLUT →
          </a>
          <div style={{ fontSize: 12, color: "var(--gray2)", marginTop: 12, textAlign: "center", lineHeight: 1.6 }}>
            After payment, message @karolz7hb on Revolut with your name.<br />Access activated within 24h.
          </div>
        </div>

        {/* ── FREE PROGRAM ── */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.4em", color: "var(--gray2)", marginBottom: 12 }}>FREE OPTION</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 8 }}>8-WEEK AUTO PROGRAM</div>
          <div style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.7, marginBottom: 20 }}>
            No coach, no payment. Get a full periodised 8-week Strength & Kettlebell program that auto-generates based on your 1RM. Track your sessions, access the exercise library.
          </div>
          <button onClick={onSignUp}
            style={{ background: "var(--bg3)", color: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: "0.06em", cursor: "pointer", width: "100%" }}>
            START FREE PROGRAM →
          </button>
        </div>

        {/* ── FINAL CTA ── */}
        <div style={{ textAlign: "center", paddingBottom: 48 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            READY TO ENTER<br /><span style={{ color: "var(--accent)" }}>THE ARENA?</span>
          </div>
          <button onClick={() => { localStorage.setItem("ks_invite", "KARLITO"); onSignUp(); }}
            style={{ background: "var(--red)", color: "#fff", border: "none", borderRadius: 10, padding: "18px 24px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 19, fontWeight: 900, letterSpacing: "0.08em", cursor: "pointer", width: "100%", marginBottom: 12 }}>
            GET COACHED — {MONTHLY_PRICE}/MONTH →
          </button>
          <div style={{ fontSize: 12, color: "var(--gray2)", marginBottom: 20 }}>
            Already have an account? <span onClick={onSignUp} style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>Sign in here</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--gray2)", letterSpacing: "0.15em" }}>
            KARLITO STRENGTH · FERRUM · SANGUIS · GLORIA
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY SCREEN ───────────────────────────────────────────────────────────
