import { useState, useEffect, useRef } from "react";

export function LandingScreen({ onSignUp }) {
  const WA_LINK = "https://wa.me/447543497081?text=Hi%20Karol%2C%20I'm%20interested%20in%20coaching.%20Found%20you%20through%20your%20website.";
  const [visible, setVisible] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setVisible(prev => ({ ...prev, [e.target.dataset.reveal]: true }));
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll("[data-reveal]").forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const rv = (id, delay = 0) => ({
    "data-reveal": id,
    style: {
      opacity: visible[id] ? 1 : 0,
      transform: visible[id] ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }
  });

  return (
    <div style={{ minHeight: "100vh", background: "#07090c", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #c9a84c; --gold-dim: rgba(201,168,76,0.25); --gold-glow: rgba(201,168,76,0.07);
          --red: #c41e1e; --red-dim: rgba(196,30,30,0.25);
          --bg2: #0c0f14; --bg3: #131820;
          --border: rgba(255,255,255,0.06); --border2: rgba(201,168,76,0.15);
          --gray: #7a7a7a; --gray2: #444; --green: #25D366;
        }
        html { scroll-behavior: smooth; }
        .nav-link { color: var(--gray); text-decoration: none; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; transition: color 0.2s; background: none; border: none; cursor: pointer; }
        .nav-link:hover { color: var(--gold); }
        .btn-wa { background: var(--green); color: #fff; border: none; padding: 16px 36px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s, transform 0.15s; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .btn-wa:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--gold); border: 1px solid var(--gold-dim); padding: 14px 32px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: inline-block; text-decoration: none; }
        .btn-ghost:hover { border-color: var(--gold); background: var(--gold-glow); }
        .section { padding: 90px 24px; max-width: 720px; margin: 0 auto; }
        .tag { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.35em; color: var(--gold); text-transform: uppercase; margin-bottom: 14px; opacity: 0.8; }
        .divider { width: 40px; height: 1px; background: linear-gradient(90deg, var(--gold), transparent); margin-bottom: 24px; }
        .input-field { background: var(--bg3); border: 1px solid var(--border); border-bottom: 1px solid var(--border2); color: #e8e0d0; padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 14px; width: 100%; outline: none; margin-bottom: 12px; -webkit-appearance: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .h1 { animation: fadeUp 1s ease forwards; }
        .h2 { animation: fadeUp 1s ease 0.2s forwards; opacity:0; }
        .h3 { animation: fadeUp 1s ease 0.4s forwards; opacity:0; }
        .h4 { animation: fadeUp 1s ease 0.6s forwards; opacity:0; }
        .h5 { animation: fadeUp 1s ease 0.8s forwards; opacity:0; }
        .hamburger { display: none; cursor: pointer; padding: 8px; flex-direction: column; gap: 5px; }
        .hamburger div { width: 22px; height: 1px; background: #e8e0d0; }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex; }
          .mobile-nav { position: fixed; top: 56px; left: 0; right: 0; background: #07090c; border-bottom: 1px solid var(--border); padding: 24px; display: flex; flex-direction: column; gap: 20px; z-index: 999; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(7,9,12,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 28px", height: 56 }}>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
          KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[["#results","Results"],["#method","Method"],["#pricing","Pricing"],["#contact","Contact"]].map(([href, label]) => (
            <a key={href} href={href} className="nav-link">{label}</a>
          ))}
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ padding: "9px 18px", fontSize: 12 }}>
            💬 MESSAGE ME
          </a>
        </div>
        <div className="hamburger" onClick={() => setMenuOpen(v => !v)}><div /><div /><div /></div>
        {menuOpen && (
          <div className="mobile-nav">
            {[["#results","Results"],["#method","Method"],["#pricing","Pricing"],["#contact","Contact"]].map(([href, label]) => (
              <a key={href} href={href} className="nav-link" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ textAlign: "center", justifyContent: "center" }}>💬 MESSAGE ME</a>
            <button onClick={() => { setMenuOpen(false); onSignUp(); }} className="nav-link" style={{ textAlign: "left" }}>Client login →</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "110px 28px 80px", maxWidth: 720, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, transparent 10%, var(--border2) 50%, transparent 90%)", pointerEvents: "none" }} />

        <div className="h1"><div className="tag">Strength Coaching · Wimbledon SW19 · Online Worldwide</div></div>

        <h1 className="h2" style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(38px, 9vw, 78px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: 14 }}>
          HOUSE OF<br /><span style={{ color: "var(--gold)" }}>STRENGTH</span>
        </h1>

        <div className="h3" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "0.35em", color: "var(--gold)", opacity: 0.7, marginBottom: 32, textTransform: "uppercase" }}>
          Ferrum · Sanguis · Gloria
        </div>

        <p className="h4" style={{ fontSize: 16, lineHeight: 1.85, color: "#888", maxWidth: 480, marginBottom: 44, fontWeight: 300 }}>
          Structured strength coaching for people 35–55+ who want results that last.
          Barbell. Kettlebell. Engine. No templates. No shortcuts.
        </p>

        <div className="h4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-wa">
            💬 START TODAY
          </a>
          <button className="btn-ghost" onClick={onSignUp}>CLIENT LOGIN</button>
        </div>

        {/* Trust strip */}
        <div className="h5" style={{ display: "flex", gap: 32, marginTop: 64, paddingTop: 40, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
          {[["5+","Years coaching"],["35–55+","Age specialist"],["3","Disciplines"]].map(([num, label]) => (
            <div key={label}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 11, color: "var(--gray)", letterSpacing: "0.12em", marginTop: 6, textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div {...rv("prob-tag")} className="tag">Why most people stay stuck</div>
          <div className="divider" />
          <h2 {...rv("prob-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 32 }}>
            MOST PEOPLE DON'T FAIL<br />
            <span style={{ color: "var(--gold)" }}>BECAUSE THEY DON'T TRAIN.</span>
          </h2>
          <p {...rv("prob-p")} style={{ fontSize: 16, lineHeight: 1.9, color: "#888", marginBottom: 24 }}>
            They fail because they repeat the same workouts, don't track anything, and don't adjust when progress stalls.
          </p>
          {[
            "They repeat the same sessions hoping something changes",
            "They don't track anything so they can't see what's working",
            "They don't adjust when progress stalls — so they stay stuck for months",
          ].map((text, i) => (
            <div key={i} {...rv(`prob-${i}`, i * 0.1)} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", marginTop: 8, flexShrink: 0 }} />
              <div style={{ fontSize: 16, lineHeight: 1.7, color: "#777" }}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* REAL RESULTS */}
      <section id="results">
        <div className="section">
          <div {...rv("res-tag")} className="tag">Real people. Real progress.</div>
          <div className="divider" />
          <h2 {...rv("res-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 40 }}>
            REAL RESULTS.<br /><span style={{ color: "var(--gold)" }}>NOT PROMISES.</span>
          </h2>

          {[
            { name: "Sam", result: "106.8kg → 97.4kg", period: "10 weeks", quote: "Everyone at work noticed." },
            { name: "Tomek", result: "103kg → 93kg", period: "4 months", quote: "From inconsistent training to competing in kettlebell sport." },
            { name: "Maciek, 44", result: "Stress & health issues → Polish representative", period: "Kettlebell sport", quote: "Representing Poland at international level." },
          ].map((r, i) => (
            <div key={i} {...rv(`res-${i}`, i * 0.1)} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "2px solid var(--gold-dim)", padding: "20px 24px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "var(--gold)" }}>{r.result}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--gray)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>{r.period}</div>
              <div style={{ fontSize: 14, color: "#888", fontStyle: "italic" }}>"{r.quote}"</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div {...rv("how-tag")} className="tag">Simple process</div>
          <div className="divider" />
          <h2 {...rv("how-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 40 }}>
            HOW IT<br /><span style={{ color: "var(--gold)" }}>WORKS.</span>
          </h2>
          {[
            ["1", "You message me", "Tell me where you are and what you want. No forms, no calls."],
            ["2", "We talk about your goals", "A quick conversation — I ask questions, you get clarity."],
            ["3", "You get your programme", "Built around your movement, history and lifestyle. Not a template."],
            ["4", "You start training", "With a full app, video library and direct access to me. Every week."],
          ].map(([num, title, desc], i) => (
            <div key={num} {...rv(`how-${i}`, i * 0.08)} style={{ display: "flex", gap: 20, marginBottom: 12, background: "#07090c", border: "1px solid var(--border)", padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 900, color: "var(--gold)", opacity: 0.3, lineHeight: 1, flexShrink: 0 }}>{num}</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#777" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* METHOD */}
      <section id="method">
        <div className="section">
          <div {...rv("me-tag")} className="tag">The method</div>
          <div className="divider" />
          <h2 {...rv("me-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 16 }}>
            EVERY SESSION<br /><span style={{ color: "var(--gold)" }}>HAS A PURPOSE.</span>
          </h2>
          <p {...rv("me-p")} style={{ fontSize: 16, lineHeight: 1.9, color: "#888", marginBottom: 40 }}>
            No templates. No random sessions. Everything is built around your movement quality, training history, recovery and lifestyle. You always know what you're doing — and why.
          </p>
          {[
            ["01","ASSESSMENT","We look at how you move: squat, hinge, push, carry. Injuries, history and limitations come first."],
            ["02","STRUCTURE","8-week blocks with clear progression. Volume builds first. Then intensity. No guesswork."],
            ["03","STRENGTH + KETTLEBELLS","Barbell builds strength. Kettlebells build everything around it — carries, presses, swings, TGU."],
            ["04","ACCOUNTABILITY","Every set logged in the app. Every week adjusted. You can't drift if everything is tracked."],
          ].map(([num, title, desc], i) => (
            <div key={num} {...rv(`me${i}`, i * 0.08)} style={{ display: "flex", gap: 20, marginBottom: 12, background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "2px solid var(--red-dim)", padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: "var(--red)", opacity: 0.35, lineHeight: 1, flexShrink: 0, paddingTop: 2 }}>{num}</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.75, color: "#777" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div {...rv("ab-tag")} className="tag">Coach</div>
          <div className="divider" />
          <h2 {...rv("ab-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 28 }}>
            BUILT BY PEOPLE<br /><span style={{ color: "var(--gold)" }}>WHO ACTUALLY TRAIN.</span>
          </h2>
          <p {...rv("ab-p1")} style={{ fontSize: 16, lineHeight: 1.9, color: "#888", marginBottom: 16 }}>
            Two coaches. Combined background in powerlifting, strongman, kettlebell sport and strength & conditioning — hardstyle and sport style. No dogma, no tribalism, just what works.
          </p>
          <p {...rv("ab-p2")} style={{ fontSize: 16, lineHeight: 1.9, color: "#888" }}>
            We specialise in working with people aged 35–55+ who want to get genuinely strong — not just look good on Instagram.
          </p>
        </div>
      </section>

      {/* APP */}
      <section>
        <div className="section">
          <div {...rv("app-tag")} className="tag">The app</div>
          <div className="divider" />
          <h2 {...rv("app-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 16 }}>
            YOUR TRAINING.<br /><span style={{ color: "var(--gold)" }}>IN YOUR POCKET.</span>
          </h2>
          <p {...rv("app-p")} style={{ fontSize: 16, lineHeight: 1.9, color: "#888", marginBottom: 28 }}>
            Every client gets access to the Karlito Strength app — so you never guess what to do.
          </p>
          <div {...rv("app-list")} style={{ marginBottom: 32 }}>
            {["Full personalised programme","Exercise video library","Session logging","Progress tracking","Direct messaging with your coach"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "center" }}>
                <div style={{ color: "var(--gold)", fontSize: 14, flexShrink: 0 }}>✓</div>
                <div style={{ fontSize: 15, color: "#888" }}>{item}</div>
              </div>
            ))}
          </div>
          <div {...rv("app-teaser")} style={{ borderLeft: "1px solid var(--gold-dim)", paddingLeft: 20, marginBottom: 32 }}>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, fontStyle: "italic" }}>
              As you progress, you'll unlock ranks inside the House of Strength — a system that tracks real-world capability across six pillars of strength.
            </p>
          </div>
          <div {...rv("app-cta")}>
            <button className="btn-ghost" onClick={onSignUp}>CLIENT LOGIN →</button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div {...rv("pr-tag")} className="tag">Pricing</div>
          <div className="divider" />
          <h2 {...rv("pr-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 12 }}>
            SMALL GROUP.<br /><span style={{ color: "var(--gold)" }}>HIGH STANDARDS.</span>
          </h2>
          <p {...rv("pr-note")} style={{ fontSize: 14, color: "var(--gray)", marginBottom: 40, lineHeight: 1.7 }}>I work with a small number of clients to keep quality high. Spaces are limited.</p>

          <div {...rv("pr-l1")} style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.3em", color: "var(--gray2)", marginBottom: 12, textTransform: "uppercase" }}>Wimbledon SW19 · In-Person</div>
          {[
            { label: "Single Session", price: "£60", note: "Per session", extra: "1-on-1 personal training" },
            { label: "Membership", price: "£249", note: "Per month", extra: "Unlimited group sessions · App access · Progress tracking" },
            { label: "Personal Training", price: "£400", note: "From · per month", featured: true, extra: "2× per week · Personalised programming · App access · Weekly check-ins" },
          ].map((p, i) => (
            <div key={i} {...rv(`pi${i}`)} style={{ border: `1px solid ${p.featured ? "rgba(201,168,76,0.3)" : "var(--border)"}`, background: p.featured ? "rgba(201,168,76,0.04)" : "transparent", padding: "20px 24px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "var(--gray)" }}>{p.note}</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, color: p.featured ? "var(--gold)" : "#e8e0d0" }}>{p.price}</div>
              </div>
              {p.extra && <div style={{ marginTop: 12, fontSize: 12, color: "var(--gray)", lineHeight: 1.7, borderTop: "1px solid var(--border)", paddingTop: 10 }}>{p.extra}</div>}
            </div>
          ))}


          <div {...rv("pr-cta")} style={{ textAlign: "center", marginTop: 28 }}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-wa">💬 ENQUIRE NOW</a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <div className="section">
          <div {...rv("te-tag")} className="tag">What clients say</div>
          <div className="divider" />
          <h2 {...rv("te-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 40 }}>
            IN THEIR<br /><span style={{ color: "var(--gold)" }}>OWN WORDS.</span>
          </h2>
          {[
            { name: "Tina Hansen", text: "Karol has a razor sharp eye for getting the technique right and avoiding injury. He'll help you achieve progress regardless of the starting point." },
            { name: "Paul Sheehan", text: "A master of kettlebell workouts, but equally skilled in other strength exercises. An excellent technician — clear in his approach and genuinely invested in your progress." },
            { name: "Clive Wilson", text: "I have had Karol as a coach for the last 4 years. He's taught me so much about strength training, the correct techniques and given me tailored programmes." },
            { name: "Zahid Hai", text: "I've been training with Karol three times a week since January 2025 and couldn't be more impressed. Exceptional trainer — highly recommend." },
            { name: "Russell Hanson", text: "Karol has changed my way of looking after myself. His attention to detail is always there, constantly improving technique." },
          ].map((t, i) => (
            <div key={i} {...rv(`te${i}`, (i % 2) * 0.1)} style={{ borderLeft: "1px solid var(--gold-dim)", paddingLeft: 20, marginBottom: 32 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#777", marginBottom: 10, fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", color: "var(--gold)", opacity: 0.8 }}>— {t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section id="contact" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <div {...rv("co-tag")} className="tag">Ready to start</div>
          <div className="divider" style={{ margin: "0 auto 24px" }} />
          <h2 {...rv("co-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 8vw, 64px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 20 }}>
            SEND ME<br /><span style={{ color: "var(--gold)" }}>A MESSAGE.</span>
          </h2>
          <p {...rv("co-p")} style={{ fontSize: 16, color: "#888", lineHeight: 1.8, maxWidth: 440, margin: "0 auto 40px" }}>
            Tell me where you are and what you want. I'll get back to you within a few hours. No sales pitch — just a conversation.
          </p>
          <div {...rv("co-cta")} style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ fontSize: 15, padding: "18px 40px" }}>
              💬 WHATSAPP ME
            </a>
          </div>
          <div {...rv("co-sub")} style={{ marginTop: 20, fontSize: 12, color: "var(--gray2)" }}>
            Or email: <a href="mailto:karolprzybycien91@gmail.com" style={{ color: "var(--gray)", textDecoration: "underline" }}>karolprzybycien91@gmail.com</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 28px", maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
            KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span>
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.3em", color: "var(--gray2)" }}>FERRUM · SANGUIS · GLORIA</div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="nav-link">Instagram</a>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="nav-link">WhatsApp</a>
          <button onClick={onSignUp} className="nav-link">Client login</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--gray2)" }}>© 2026 Karlito Strength</div>
      </footer>

    </div>
  );
}
