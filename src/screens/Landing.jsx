import { useState, useEffect, useRef } from "react";

const TXT = {
  en: {
    nav: [["about","About"],["method","Method"],["pricing","Pricing"],["dom-sily","House of Strength"],["contact","Contact"]],
    enterApp: "ENTER APP →",
    heroTag: "Online & In-Person · Wimbledon SW19",
    heroTitle: ["GET", "GENUINELY", "STRONG."],
    heroP1: "I don't just coach — I practice what I preach as a competitive kettlebell sport athlete. I know what it takes because I put myself through it too.",
    heroP2: "Structured strength coaching for people aged 35–55+ who want results that last. No templates. No guesswork. Built around you.",
    startToday: "START TODAY →",
    enterAppBtn: "ENTER APP",
    stats: [["5+","Years coaching"],["35–55+","Specialist age group"],["KB Sport","Competing athlete"]],
    aboutTag: "About",
    aboutTitle: ["I COACH WHAT","I LIVE."],
    aboutP1: "I don't just coach — I compete. As a kettlebell sport athlete at national level, I train the same movements I teach. No dogma, no \"my method is best\" tribalism. Just what works for your body, your schedule, your goals.",
    aboutP2: "Training and competing alongside some of the best kettlebell athletes in Poland and the UK shaped how I coach: simple, structured, effective.",
    aboutP3: "I specialise in working with people aged 35–55+ who want to get genuinely strong — and stay that way for decades, not just for summer.",
    aboutImg: "COMPETING AT NATIONAL LEVEL · KETTLEBELL SPORT",
    methodTag: "The Method",
    methodTitle: ["NO WASTED REPS.","NO GUESSWORK."],
    methodP: "Every session is built around you — your injury history, your recovery, your life. Not copied from a template. Not generic \"do 3 sets of 10.\" We test, we track, we adjust.",
    methodSteps: [
      ["01","ASSESSMENT","We start with movement quality — how you squat, hinge, push and carry. Injury history, recovery capacity and training background shape every decision before we touch a weight."],
      ["02","SMART PROGRESSION","We work in 8-week cycles. Weeks 1–2: learn the movements. Weeks 3–6: build strength and stamina. Weeks 7–8: test your progress and set new targets. No plateaus. No spinning wheels."],
      ["03","THE BEST OF BOTH WORLDS","Barbell for strength. Kettlebells for stability, conditioning and real-world movement. Most coaches pick one. I use both — because your body needs both."],
      ["04","YOU SEE PROGRESS. I SEE NUMBERS.","Everything logged in the app — reps, weights, how you felt. If something's not working, we adjust in real time. No waiting weeks to figure out you're stuck."],
    ],
    dsTag: "The Ranking System",
    dsP1: "Strength is not a number. It is the quiet certainty that you can handle what life puts in front of you.",
    dsP2: "Dom Siły is a six-rank system built on six pillars of real strength: Push, Pull, Hinge, Squat, Carry, Engine. You earn each rank through tested, verified performance. Your coach confirms it. The record stands.",
    dsQuote: "\"The iron never lies to you. You can walk outside and listen to all kinds of talk, get told that you're a god or a total bastard. The iron will always kick you the real deal.\"",
    dsEnter: "ENTER THE HOUSE →",
    dsRank: "CHECK YOUR RANK",
    prTag: "Pricing",
    prTitle: ["LIMITED SPOTS.","FULL ATTENTION."],
    prNote: "I work with a small number of clients so I can give you the time and focus you deserve. Spaces are limited — not to be exclusive, but to keep quality high.",
    prInPerson: "In-Person · Wimbledon SW19",
    prPlans: [
      { label: "Single Session", price: "£60", note: "Per session", featured: false },
      { label: "2× Per Week", price: "£400", note: "Per month", featured: false },
      { label: "3× Per Week + Nutrition", price: "£600", note: "Per month · Full support", featured: true, extra: "Includes nutrition coaching + app access + weekly check-ins" },
    ],
    prOnline: "Online Coaching · Worldwide",
    prMonthly: "Monthly Programme",
    prMonthlyNote: "Weekly check-ins · App access · Direct messaging",
    prFeatures: "✓ Personalised 8-week programme  ·  ✓ Video exercise library  ·  ✓ Progress tracking app  ·  ✓ Direct coach messaging",
    prEnquire: "ENQUIRE NOW →",
    teTag: "What clients say",
    teTitle: ["REAL PEOPLE.","REAL RESULTS."],
    apTag: "The App",
    apTitle: ["YOUR PROGRAMME.","IN YOUR POCKET."],
    apP: "Every client gets access to the Karlito Strength app — video demos, session logging, progress tracking, Dom Siły rank system and direct messaging with your coach.",
    apOpen: "OPEN APP →",
    coTag: "Get in touch",
    coTitle: ["READY TO","START?"],
    coSub: "Fill in the form and I'll get back to you within 24 hours. First session is a trial — if it's not a good fit, no hard feelings.",
    coName: "Your name *",
    coEmail: "Email address *",
    coGoalPlaceholder: "What's your main goal?",
    coGoals: ["Get stronger (powerlifting / barbell)","Learn kettlebells","Lose weight and build muscle","Compete in kettlebell sport","General fitness and health"],
    coMsg: "Anything else you'd like me to know...",
    coSend: "SEND ENQUIRY →",
    coSentTitle: "MESSAGE SENT",
    coSentSub: "I'll be in touch within 24 hours.",
    ftEnterApp: "Enter App",
    ftEmail: "Email",
  },
  pl: {
    nav: [["about","O mnie"],["method","Metoda"],["pricing","Cennik"],["dom-sily","Dom Siły"],["contact","Kontakt"]],
    enterApp: "WEJDŹ DO APKI →",
    heroTag: "Online i stacjonarnie · Wimbledon SW19",
    heroTitle: ["ZBUDUJ", "PRAWDZIWĄ", "SIŁĘ."],
    heroP1: "Nie tylko trenuję innych — sam startuję jako zawodnik kettlebell sport. Wiem czego to wymaga, bo przechodzę przez to na własnej skórze.",
    heroP2: "Ustrukturyzowany trening siłowy dla osób 35–55+, które chcą trwałych efektów. Bez szablonów. Bez zgadywania. Wszystko dopasowane do Ciebie.",
    startToday: "ZACZNIJ DZIŚ →",
    enterAppBtn: "WEJDŹ DO APKI",
    stats: [["5+","Lat doświadczenia"],["35–55+","Specjalizacja wiekowa"],["KB Sport","Czynny zawodnik"]],
    aboutTag: "O mnie",
    aboutTitle: ["TRENUJĘ TO,","CZYM ŻYJĘ."],
    aboutP1: "Nie tylko trenuję innych — sam rywalizuję. Jako zawodnik kettlebell sport na poziomie mistrzowskim trenuję te same ruchy, których uczę. Bez dogmatów, bez podziałów \"moja metoda jest najlepsza\". Po prostu to, co działa dla Twojego ciała, Twojego grafiku, Twoich celów.",
    aboutP2: "Trening i rywalizacja u boku najlepszych zawodników kettlebell w Polsce i UK ukształtowały sposób, w jaki trenuję: prosto, strukturalnie, skutecznie.",
    aboutP3: "Specjalizuję się w pracy z osobami 35–55+, które chcą zbudować prawdziwą siłę — i utrzymać ją przez dekady, nie tylko na lato.",
    aboutImg: "STARTUJĘ NA POZIOMIE KRAJOWYM · KETTLEBELL SPORT",
    methodTag: "Metoda",
    methodTitle: ["ZERO ZMARNOWANYCH SERII.","ZERO ZGADYWANIA."],
    methodP: "Każdy trening budowany jest wokół Ciebie — Twojej historii kontuzji, regeneracji, Twojego życia. Nie kopiowany z szablonu. Bez ogólnego \"zrób 3 serie po 10\". Testujemy, mierzymy, dostosowujemy.",
    methodSteps: [
      ["01","OCENA","Zaczynamy od jakości ruchu — jak przysiadasz, robisz hinge, pchasz i nosisz. Historia kontuzji, zdolność regeneracji i doświadczenie treningowe kształtują każdą decyzję zanim dotkniemy ciężaru."],
      ["02","MĄDRA PROGRESJA","Pracujemy w cyklach 8-tygodniowych. Tydzień 1–2: nauka ruchów. Tydzień 3–6: budowanie siły i wytrzymałości. Tydzień 7–8: test postępów i nowe cele. Bez plateau. Bez dreptania w miejscu."],
      ["03","TO CO NAJLEPSZE Z OBU ŚWIATÓW","Sztanga dla siły. Kettlebell dla stabilności, kondycji i ruchu użytkowego. Większość trenerów wybiera jedno. Ja używam obu — bo Twoje ciało potrzebuje obu."],
      ["04","TY WIDZISZ POSTĘP. JA WIDZĘ LICZBY.","Wszystko zapisane w aplikacji — powtórzenia, ciężary, jak się czułeś. Jeśli coś nie działa, korygujemy na bieżąco. Bez czekania tygodniami żeby zauważyć że utknąłeś."],
    ],
    dsTag: "System Rang",
    dsP1: "Siła to nie liczba. To ciche przekonanie, że poradzisz sobie z tym, co postawi przed Tobą życie.",
    dsP2: "Dom Siły to system sześciu rang oparty na sześciu filarach prawdziwej siły: Push, Pull, Hinge, Squat, Carry, Engine. Każdą rangę zdobywasz przez sprawdzoną, zweryfikowaną formę. Twój trener ją potwierdza. Rekord zostaje.",
    dsQuote: "\"Żelazo nigdy Cię nie okłamie. Możesz wyjść na zewnątrz i słuchać różnych opinii, usłyszeć że jesteś bogiem albo kompletnym zerem. Żelazo zawsze da Ci prawdę.\"",
    dsEnter: "WEJDŹ DO DOMU →",
    dsRank: "SPRAWDŹ SWOJĄ RANGĘ",
    prTag: "Cennik",
    prTitle: ["OGRANICZONE MIEJSCA.","PEŁNA UWAGA."],
    prNote: "Pracuję z małą liczbą klientów, żeby dać Ci czas i skupienie na jakie zasługujesz. Miejsca są ograniczone — nie dla ekskluzywności, ale żeby utrzymać wysoką jakość.",
    prInPerson: "Stacjonarnie · Wimbledon SW19",
    prPlans: [
      { label: "Pojedyncza sesja", price: "£60", note: "Za sesję", featured: false },
      { label: "2× w tygodniu", price: "£400", note: "Miesięcznie", featured: false },
      { label: "3× w tygodniu + Dieta", price: "£600", note: "Miesięcznie · Pełne wsparcie", featured: true, extra: "Zawiera plan żywieniowy + dostęp do aplikacji + cotygodniowe podsumowania" },
    ],
    prOnline: "Trening online · Cały świat",
    prMonthly: "Program miesięczny",
    prMonthlyNote: "Cotygodniowe podsumowania · Dostęp do aplikacji · Bezpośredni kontakt",
    prFeatures: "✓ Spersonalizowany program 8-tygodniowy  ·  ✓ Biblioteka wideo ćwiczeń  ·  ✓ Aplikacja śledząca postępy  ·  ✓ Bezpośredni kontakt z trenerem",
    prEnquire: "ZAPYTAJ TERAZ →",
    teTag: "Opinie klientów",
    teTitle: ["PRAWDZIWI LUDZIE.","PRAWDZIWE EFEKTY."],
    apTag: "Aplikacja",
    apTitle: ["TWÓJ PROGRAM.","W TWOJEJ KIESZENI."],
    apP: "Każdy klient dostaje dostęp do aplikacji Karlito Strength — instruktaże wideo, zapis sesji, śledzenie postępów, system rang Dom Siły i bezpośredni kontakt z trenerem.",
    apOpen: "OTWÓRZ APKĘ →",
    coTag: "Kontakt",
    coTitle: ["GOTOWY BY","ZACZĄĆ?"],
    coSub: "Wypełnij formularz, a odezwę się w ciągu 24 godzin. Pierwsza sesja jest próbna — jeśli to nie pasuje, bez urazy.",
    coName: "Twoje imię *",
    coEmail: "Adres email *",
    coGoalPlaceholder: "Jaki jest Twój główny cel?",
    coGoals: ["Zbudować siłę (trójbój / sztanga)","Nauczyć się kettlebell","Schudnąć i zbudować mięśnie","Startować w kettlebell sport","Ogólna sprawność i zdrowie"],
    coMsg: "Coś jeszcze, co powinienem wiedzieć...",
    coSend: "WYŚLIJ ZAPYTANIE →",
    coSentTitle: "WIADOMOŚĆ WYSŁANA",
    coSentSub: "Odezwę się w ciągu 24 godzin.",
    ftEnterApp: "Wejdź do apki",
    ftEmail: "Email",
  },
};

export function LandingScreen({ onSignUp }) {
  const [visible, setVisible] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", goal: "", message: "" });
  const [formSent, setFormSent] = useState(false);
  const [lang, setLang] = useState("en");
  const observerRef = useRef(null);
  const t = TXT[lang];

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setVisible(prev => ({ ...prev, [e.target.dataset.reveal]: true }));
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal]").forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, [lang]);

  const reveal = (id, delay = 0) => ({
    "data-reveal": id,
    style: {
      opacity: visible[id] ? 1 : 0,
      transform: visible[id] ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return;
    const subject = encodeURIComponent("Karlito Strength — Coaching Enquiry");
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nGoal: ${formData.goal}\n\n${formData.message}`
    );
    window.location.href = `mailto:karolprzybycien91@gmail.com?subject=${subject}&body=${body}`;
    setFormSent(true);
  };

  const testimonials = [
    { name: "Tina Hansen", text: "Karol has a razor sharp eye for getting the technique right and avoiding injury, with excellent teaching skills. He'll help you achieve progress regardless of the starting point." },
    { name: "Paul Sheehan", text: "A master of kettlebell workouts in particular, but equally skilled in other weight and strength exercises. An excellent technician — clear in his approach and genuinely invested in your progress." },
    { name: "Clive Wilson", text: "I have had Karol as a coach for the last 4 years. In this time he has taught me so much about strength training, the correct techniques and given me tailored workout programmes for overall strength." },
    { name: "Zahid Hai", text: "I've been training with Karol three times a week since January 2025 and couldn't be more impressed. Exceptional trainer — highly recommend." },
    { name: "Russell Hanson", text: "Karol has changed my way of looking after myself. His attention to detail is always there, constantly improving technique. I'm so glad I joined his gym." },
    { name: "Javid Moosaji", text: "Karol is an amazing and experienced coach. He not only helps you get into the best shape of your life, but really understands how each body, muscle and piece of equipment are supposed to work in tandem." },
  ];

  const langBtn = (
    <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--bg3)", borderRadius: 6, padding: 3, border: "1px solid var(--border2)" }}>
      {["en","pl"].map(l => (
        <div key={l} onClick={() => setLang(l)}
          style={{ padding: "5px 11px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em",
            background: lang === l ? "var(--gold)" : "transparent",
            color: lang === l ? "#0c0f14" : "var(--gray)" }}>
          {l.toUpperCase()}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#07090c", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #c9a84c;
          --gold-dim: rgba(201,168,76,0.22);
          --gold-glow: rgba(201,168,76,0.06);
          --red: #c41e1e;
          --red-dim: rgba(196,30,30,0.22);
          --bg2: #0c0f14;
          --bg3: #131820;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(201,168,76,0.12);
          --gray: #7a7a7a;
          --gray2: #444;
        }
        html { scroll-behavior: smooth; }
        .nav-link { color: var(--gray); text-decoration: none; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; transition: color 0.2s; background: none; border: none; cursor: pointer; }
        .nav-link:hover { color: var(--gold); }
        .btn-primary { background: var(--red); color: #fff; border: none; padding: 16px 36px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s, transform 0.15s; display: inline-block; text-decoration: none; }
        .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--gold); border: 1px solid var(--gold-dim); padding: 14px 32px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: inline-block; text-decoration: none; }
        .btn-ghost:hover { border-color: var(--gold); background: var(--gold-glow); }
        .section { padding: 90px 24px; max-width: 720px; margin: 0 auto; }
        .tag { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 0.3em; color: var(--gold); text-transform: uppercase; margin-bottom: 14px; opacity: 0.85; font-weight: 600; }
        .divider { width: 36px; height: 1px; background: linear-gradient(90deg, var(--gold), transparent); margin-bottom: 24px; }
        .input-field { background: #0c0f14; border: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid var(--border2); color: #e8e0d0; padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 14px; width: 100%; outline: none; margin-bottom: 12px; transition: border-color 0.2s; -webkit-appearance: none; border-radius: 0; }
        .input-field:focus { border-color: var(--gold-dim); }
        .input-field::placeholder { color: var(--gray2); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .h1 { animation: fadeUp 0.8s ease forwards; }
        .h2 { animation: fadeUp 0.8s ease 0.2s forwards; opacity:0; }
        .h3 { animation: fadeUp 0.8s ease 0.4s forwards; opacity:0; }
        .h4 { animation: fadeUp 0.8s ease 0.6s forwards; opacity:0; }
        .h5 { animation: fadeUp 0.8s ease 0.8s forwards; opacity:0; }
        .hamburger { display: none; cursor: pointer; padding: 8px; flex-direction: column; gap: 5px; }
        .hamburger div { width: 22px; height: 1px; background: #e8e0d0; }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex; }
          .mobile-nav { position: fixed; top: 56px; left: 0; right: 0; background: #07090c; border-bottom: 1px solid var(--border); padding: 24px; display: flex; flex-direction: column; gap: 20px; z-index: 999; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(7,9,12,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: 56 }}>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
          KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {t.nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="nav-link">{label}</a>
          ))}
          {langBtn}
          <button className="btn-primary" onClick={onSignUp} style={{ padding: "9px 20px", fontSize: 12 }}>{t.enterApp}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="mobile-only-lang">
          {langBtn}
          <div className="hamburger" onClick={() => setMenuOpen(v => !v)}><div /><div /><div /></div>
        </div>
        {menuOpen && (
          <div className="mobile-nav">
            {t.nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="nav-link" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <button className="btn-primary" onClick={() => { setMenuOpen(false); onSignUp(); }} style={{ padding: "12px 20px", fontSize: 13, textAlign: "center" }}>{t.enterApp}</button>
          </div>
        )}
      </nav>
      <style>{`
        .mobile-only-lang { display: none; }
        @media (max-width: 640px) { .mobile-only-lang { display: flex !important; } }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "110px 28px 80px", maxWidth: 720, margin: "0 auto" }}>
        <div className="h1"><div className="tag">{t.heroTag}</div></div>
        <h1 className="h2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(56px, 13vw, 100px)", fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.01em", marginBottom: 28 }}>
          {t.heroTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.heroTitle[1]}</span><br />{t.heroTitle[2]}
        </h1>
        <p className="h3" style={{ fontSize: 16, lineHeight: 1.9, color: "#777", maxWidth: 500, marginBottom: 16, fontWeight: 300 }}>
          {t.heroP1}
        </p>
        <p className="h3" style={{ fontSize: 15, lineHeight: 1.85, color: "#555", maxWidth: 480, marginBottom: 44, fontWeight: 300 }}>
          {t.heroP2}
        </p>
        <div className="h4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="#contact" className="btn-primary">{t.startToday}</a>
          <button className="btn-ghost" onClick={onSignUp}>{t.enterAppBtn}</button>
        </div>
        <div className="h5" style={{ display: "flex", gap: 40, marginTop: 64, paddingTop: 36, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
          {t.stats.map(([num, label]) => (
            <div key={label}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 11, color: "var(--gray)", letterSpacing: "0.12em", marginTop: 6, textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div {...reveal("ab-tag")} className="tag">{t.aboutTag}</div>
          <div className="divider" />
          <h2 {...reveal("ab-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(34px, 8vw, 58px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 32 }}>
            {t.aboutTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.aboutTitle[1]}</span>
          </h2>
          <p {...reveal("ab-p1")} style={{ fontSize: 16, lineHeight: 1.9, color: "#777", marginBottom: 20 }}>{t.aboutP1}</p>
          <p {...reveal("ab-p2")} style={{ fontSize: 16, lineHeight: 1.9, color: "#777", marginBottom: 20 }}>{t.aboutP2}</p>
          <p {...reveal("ab-p3")} style={{ fontSize: 16, lineHeight: 1.9, color: "#777", marginBottom: 36 }}>{t.aboutP3}</p>
          <div {...reveal("ab-img")} style={{ position: "relative", overflow: "hidden", borderLeft: "2px solid var(--red-dim)" }}>
            <img src="/karlito.jpg" alt="Karol — kettlebell sport"
              style={{ width: "100%", maxHeight: 600, objectFit: "contain", objectPosition: "center center", display: "block", filter: "brightness(0.88) contrast(1.05)", background: "#07090c" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(0deg, rgba(7,9,12,0.9) 0%, transparent 100%)" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "var(--gold)", opacity: 0.8 }}>{t.aboutImg}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METHOD ── */}
      <section id="method">
        <div className="section">
          <div {...reveal("me-tag")} className="tag">{t.methodTag}</div>
          <div className="divider" />
          <h2 {...reveal("me-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(34px, 8vw, 58px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 12 }}>
            {t.methodTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.methodTitle[1]}</span>
          </h2>
          <p {...reveal("me-p")} style={{ fontSize: 16, lineHeight: 1.9, color: "#666", marginBottom: 40 }}>{t.methodP}</p>
          {t.methodSteps.map(([num, title, desc], i) => (
            <div key={num} {...reveal(`me${i}`, i * 0.08)} style={{ display: "flex", gap: 24, marginBottom: 10, background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "2px solid var(--red-dim)", padding: "20px 22px" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "var(--red)", opacity: 0.35, lineHeight: 1, flexShrink: 0, paddingTop: 2 }}>{num}</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 7 }}>{title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.75, color: "#666" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOUSE OF STRENGTH ── */}
      <section id="dom-sily" style={{ background: "linear-gradient(180deg, #07090c 0%, #090c08 50%, #07090c 100%)", borderTop: "1px solid var(--border2)", borderBottom: "1px solid var(--border2)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", fontFamily: "serif", fontSize: 500, opacity: 0.02, color: "var(--gold)", userSelect: "none" }}>ᛏ</div>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, transparent, var(--gold-dim), transparent)" }} />
        <div className="section" style={{ position: "relative", zIndex: 1 }}>
          <div {...reveal("ds-tag")} className="tag">{t.dsTag}</div>
          <div className="divider" />
          <h2 {...reveal("ds-h")} style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 900, lineHeight: 1.0, marginBottom: 8, letterSpacing: "0.02em" }}>
            HOUSE OF<br />STRENGTH
          </h2>
          <div {...reveal("ds-sub")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "0.3em", color: "var(--gold)", marginBottom: 40, opacity: 0.8 }}>
            FERRUM · SANGUIS · GLORIA
          </div>
          <p {...reveal("ds-p1")} style={{ fontSize: 16, lineHeight: 1.9, color: "#666", marginBottom: 20 }}>{t.dsP1}</p>
          <p {...reveal("ds-p2")} style={{ fontSize: 16, lineHeight: 1.9, color: "#666", marginBottom: 40 }}>{t.dsP2}</p>
          <div {...reveal("ds-quote")} style={{ borderLeft: "1px solid var(--gold-dim)", paddingLeft: 24, marginBottom: 40 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.9, color: "#555", fontStyle: "italic" }}>{t.dsQuote}</p>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "var(--gold)", marginTop: 10 }}>— HENRY ROLLINS</div>
          </div>
          <div {...reveal("ds-cta")} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={onSignUp}>{t.dsEnter}</button>
            <button className="btn-ghost" onClick={onSignUp}>{t.dsRank}</button>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div {...reveal("pr-tag")} className="tag">{t.prTag}</div>
          <div className="divider" />
          <h2 {...reveal("pr-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(34px, 8vw, 58px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 12 }}>
            {t.prTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.prTitle[1]}</span>
          </h2>
          <p {...reveal("pr-note")} style={{ fontSize: 14, color: "var(--gray)", marginBottom: 48, lineHeight: 1.8, maxWidth: 480 }}>{t.prNote}</p>

          <div {...reveal("pr-l1")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "0.3em", color: "var(--gray2)", marginBottom: 14, textTransform: "uppercase" }}>{t.prInPerson}</div>
          {t.prPlans.map((p, i) => (
            <div key={i} {...reveal(`prc${i}`, i * 0.08)} style={{ border: `1px solid ${p.featured ? "rgba(201,168,76,0.28)" : "var(--border)"}`, background: p.featured ? "linear-gradient(135deg, rgba(201,168,76,0.04), transparent)" : "transparent", padding: "20px 22px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "var(--gray)" }}>{p.note}</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, color: p.featured ? "var(--gold)" : "#e8e0d0", lineHeight: 1 }}>{p.price}</div>
              </div>
              {p.extra && <div style={{ marginTop: 12, fontSize: 12, color: "var(--gray)", lineHeight: 1.7, borderTop: "1px solid var(--border)", paddingTop: 12 }}>{p.extra}</div>}
            </div>
          ))}

          <div {...reveal("pr-l2")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "0.3em", color: "var(--gray2)", marginBottom: 14, marginTop: 28, textTransform: "uppercase" }}>{t.prOnline}</div>
          <div {...reveal("pr-online")} style={{ border: "1px solid rgba(201,168,76,0.28)", background: "linear-gradient(135deg, rgba(201,168,76,0.04), transparent)", padding: "20px 22px", marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>{t.prMonthly}</div>
                <div style={{ fontSize: 12, color: "var(--gray)" }}>{t.prMonthlyNote}</div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>£100<span style={{ fontSize: 12, color: "var(--gray)", fontWeight: 400 }}>/mo</span></div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--gray)", lineHeight: 1.9, borderTop: "1px solid var(--border)", paddingTop: 12 }}>{t.prFeatures}</div>
          </div>
          <div {...reveal("pr-cta")} style={{ textAlign: "center" }}>
            <a href="#contact" className="btn-primary">{t.prEnquire}</a>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section>
        <div className="section">
          <div {...reveal("te-tag")} className="tag">{t.teTag}</div>
          <div className="divider" />
          <h2 {...reveal("te-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 48 }}>
            {t.teTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.teTitle[1]}</span>
          </h2>
          {testimonials.map((tm, i) => (
            <div key={i} {...reveal(`te${i}`, (i % 2) * 0.08)} style={{ borderLeft: "1px solid var(--gold-dim)", paddingLeft: 24, marginBottom: 32 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#666", marginBottom: 10, fontStyle: "italic" }}>"{tm.text}"</p>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.18em", color: "var(--gold)", opacity: 0.8 }}>— {tm.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APP PROMO ── */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <div {...reveal("ap-tag")} className="tag">{t.apTag}</div>
          <div className="divider" style={{ margin: "0 auto 24px" }} />
          <h2 {...reveal("ap-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 16 }}>
            {t.apTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.apTitle[1]}</span>
          </h2>
          <p {...reveal("ap-p")} style={{ fontSize: 15, color: "#666", lineHeight: 1.85, maxWidth: 440, margin: "0 auto 40px" }}>{t.apP}</p>
          <div {...reveal("ap-btns")} style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={onSignUp}>{t.apOpen}</button>
            <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="btn-ghost">@KARLITOSTRENGTH</a>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact">
        <div className="section">
          <div {...reveal("co-tag")} className="tag">{t.coTag}</div>
          <div className="divider" />
          <h2 {...reveal("co-h")} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(34px, 8vw, 58px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 12 }}>
            {t.coTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.coTitle[1]}</span>
          </h2>
          <p {...reveal("co-sub")} style={{ fontSize: 15, color: "#666", lineHeight: 1.85, marginBottom: 40, maxWidth: 480 }}>{t.coSub}</p>
          {formSent ? (
            <div style={{ border: "1px solid var(--gold-dim)", background: "var(--gold-glow)", padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 32, color: "var(--gold)", marginBottom: 12 }}>✓</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "var(--gold)", letterSpacing: "0.1em", marginBottom: 8 }}>{t.coSentTitle}</div>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>{t.coSentSub}</div>
            </div>
          ) : (
            <div>
              <input className="input-field" placeholder={t.coName} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              <input className="input-field" type="email" placeholder={t.coEmail} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              <select className="input-field" value={formData.goal} onChange={e => setFormData(p => ({ ...p, goal: e.target.value }))}>
                <option value="">{t.coGoalPlaceholder}</option>
                {t.coGoals.map((g, i) => <option key={i}>{g}</option>)}
              </select>
              <textarea className="input-field" placeholder={t.coMsg} rows={4} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} style={{ resize: "vertical" }} />
              <button className="btn-primary" onClick={handleSubmit} style={{ width: "100%", marginTop: 4 }}>{t.coSend}</button>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 28px", maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span></div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "0.3em", color: "var(--gray2)" }}>MOVE · LIFT · LAST</div>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
          <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="nav-link">Instagram</a>
          <button onClick={onSignUp} className="nav-link">{t.ftEnterApp}</button>
          <a href="mailto:karolprzybycien91@gmail.com" className="nav-link">{t.ftEmail}</a>
        </div>
        <div style={{ fontSize: 11, color: "var(--gray2)" }}>© 2026 Karlito Strength</div>
      </footer>

    </div>
  );
}
