import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { sendPushToUser } from "../lib/push";

// Karol's account — gets a push when someone sends the contact form
const COACH_ID = "a6efb4f6-a5aa-4829-89c3-adb486cf187c";

// Fallback prices — the page loads live prices from the database (same as /buy).
const FALLBACK_PACKAGES = [
  { code: "solo_1", kind: "solo", sessions: 1, validity_months: 1, price: 70 },
  { code: "solo_4", kind: "solo", sessions: 4, validity_months: 1, price: 240 },
  { code: "solo_8", kind: "solo", sessions: 8, validity_months: 2, price: 440 },
  { code: "solo_12", kind: "solo", sessions: 12, validity_months: 2, price: 600 },
  { code: "duo_1", kind: "duo", sessions: 1, validity_months: 1, price: 45 },
  { code: "duo_4", kind: "duo", sessions: 4, validity_months: 1, price: 160 },
  { code: "duo_8", kind: "duo", sessions: 8, validity_months: 2, price: 280 },
  { code: "duo_12", kind: "duo", sessions: 12, validity_months: 2, price: 360 },
  { code: "online_m", kind: "online", sessions: null, validity_months: 1, price: 100, is_subscription: true },
];

const TXT = {
  en: {
    nav: [["services", "Prices"], ["about", "About"], ["reviews", "Reviews"], ["contact", "Contact"]],
    login: "CLIENT LOGIN",
    heroTag: "1:1 · Duo · Online · Wimbledon SW19",
    heroTitle: ["STRENGTH", "IS FOR", "EVERYONE."],
    heroP: "Strength training is for everyone — whatever your age, fitness level or experience. I specialise in people aged 35–55+ who want results that last: a clear plan, steady progress, no guesswork.",
    seePrices: "SEE PRICES",
    whatsapp: "WHATSAPP ME",
    stats: [["L3", "Qualified personal trainer"], ["MSWC", "Master of Sport World Class"], ["5+", "Years coaching in London"]],

    svTag: "Training & Prices",
    svTitle: ["CHOOSE HOW", "YOU TRAIN."],
    svNote: "Small number of clients, full attention. Pay by bank transfer — your package starts as soon as the payment is confirmed.",
    solo: {
      title: "1:1 Personal Training",
      sub: "One-to-one coaching in my own private studio in Wimbledon — a calm, fully equipped space. No crowds, no queueing for equipment.",
      bullets: [
        "Free consultation in person at the studio: your goals, training experience and health history",
        "Movement assessment to spot any limitations before we add load",
        "A programme built for you and progressed at your pace",
        "Technique videos for your exercises, sent in the app or on WhatsApp",
        "Every session logged in the app, so you can see your progress",
      ],
      cta: "BUY A PACKAGE →",
    },
    duo: {
      title: "Duo — Train With a Partner",
      sub: "Train with your partner or a friend in the same private studio. Same attention, lower price. Prices are per person.",
      cta: "ASK ABOUT DUO →",
    },
    online: {
      title: "Online Coaching",
      sub: "Your programme in the Karlito Strength app — train wherever you are, with my eyes on your technique.",
      bullets: [
        "Free remote consultation (video call): your goals, training experience and health history",
        "3 workouts a week, built around your goals and your equipment",
        "Video demo and written instructions for every exercise",
        "Prescribed weights and reps — log your sessions and note any issues",
        "Film your sets and get feedback and corrections from me",
        "Weekly check-in; your programme progresses with your technique and conditioning",
      ],
      cta: "START ONLINE →",
    },
    single: "Single session",
    sessions: (n) => `${n} sessions`,
    perMonth: "/ month",
    valid: (m) => (m === 1 ? "valid 1 month" : `valid ${m} months`),
    from: "from",
    perPerson: "per person",
    terms: (h) => `Packages are valid from the payment date. Cancel at least ${h}h before a session and it stays on your balance.`,

    abTag: "About",
    abTitle: ["I PRACTISE", "WHAT I TEACH."],
    abP1: "I'm Karol, a Level 3 qualified personal trainer and kettlebell sport athlete. In 2026 I earned the title of Master of Sport World Class in IKMF kettlebell pentathlon — so I know what consistent training takes, and I train the same movements I teach.",
    abP2: "My approach is simple: barbell for strength, kettlebells for conditioning, and a plan that fits your body, your schedule and your goals.",
    abP3: "I specialise in people aged 35–55+ who want to get genuinely strong — and stay that way for decades, not just for summer. Whatever your starting point, we begin where you are.",
    creds: [
      "Level 3 qualified Personal Trainer",
      "StrongFirst kettlebell certification",
      "Master of Sport World Class — IKMF pentathlon",
      "Top Team (Kettlebell Polska) — 200 snatches in 10 min, plus get-up, pull-up, pistol squat and press with a 42 kg kettlebell (half bodyweight)",
      "5+ years coaching clients in South West London",
    ],
    abImg: "MASTER OF SPORT WORLD CLASS · KETTLEBELL SPORT",

    meTag: "The Method",
    meTitle: ["A CLEAR PLAN.", "STEADY PROGRESS."],
    meSteps: [
      ["01", "ASSESSMENT", "We start with how you move — squat, hinge, push, carry — plus your injury history and recovery. Every decision is made before we touch a weight."],
      ["02", "8-WEEK CYCLES", "Weeks 1–2: learn the movements. Weeks 3–6: build strength and stamina. Weeks 7–8: test and set new targets."],
      ["03", "BARBELL + KETTLEBELLS", "Barbell for strength. Kettlebells for conditioning. Your body needs both."],
      ["04", "TRACKED IN THE APP", "Reps, weights, how you felt — all logged. If something isn't working, we adjust straight away."],
    ],

    teTag: "What clients say",
    teTitle: ["REAL PEOPLE.", "REAL RESULTS."],

    apTag: "The App",
    apTitle: ["YOUR PROGRAMME.", "IN YOUR POCKET."],
    apP: "Every client gets the Karlito Strength app: your programme, video demos, session logging, progress tracking and direct messaging. Plus strength tests and ranks to chase.",
    apOpen: "OPEN APP →",

    coTag: "Get in touch",
    coTitle: ["READY TO", "START?"],
    coSub: "Message me on WhatsApp for the fastest reply, or leave your details and I'll get back to you within 24 hours. We start with a free consultation — in person at the studio, or by video call if you train online. No pressure, no commitment.",
    coWhats: "MESSAGE ON WHATSAPP",
    coOr: "or leave your details",
    coName: "Your name *",
    coEmail: "Email address *",
    coPhone: "Phone (optional)",
    coGoalPlaceholder: "What's your main goal?",
    coGoals: ["Get stronger (barbell)", "Learn kettlebells", "Lose weight and build muscle", "Compete in kettlebell sport", "General fitness and health", "Online coaching"],
    coMsg: "Anything else I should know (injuries, schedule...)",
    coSend: "SEND →",
    coSentTitle: "MESSAGE SENT",
    coSentSub: "Thanks — I'll be in touch within 24 hours.",
    coErr: "Please enter your name and a valid email.",
    waText: "Hi Karol, I found your website and I'd like to ask about training.",
    waDuo: "Hi Karol, I'd like to ask about duo training.",
    ftLogin: "Client login",
  },
  pl: {
    nav: [["services", "Cennik"], ["about", "O mnie"], ["reviews", "Opinie"], ["contact", "Kontakt"]],
    login: "LOGOWANIE",
    heroTag: "1:1 · Duo · Online · Wimbledon SW19",
    heroTitle: ["TRENING SIŁOWY", "JEST DLA", "KAŻDEGO."],
    heroP: "Niezależnie od wieku, poziomu sprawności czy zaawansowania. Specjalizuję się w pracy z osobami 35–55+, które chcą trwałych efektów: jasny plan, stały postęp, bez zgadywania.",
    seePrices: "ZOBACZ CENY",
    whatsapp: "NAPISZ NA WHATSAPP",
    stats: [["L3", "Trener personalny"], ["MSWC", "Mistrz Sportu Klasy Światowej"], ["5+", "Lat trenowania w Londynie"]],

    svTag: "Treningi i ceny",
    svTitle: ["WYBIERZ, JAK", "TRENUJESZ."],
    svNote: "Mała liczba klientów, pełna uwaga. Płatność przelewem — pakiet startuje, gdy wpłata zostanie potwierdzona.",
    solo: {
      title: "Trening personalny 1:1",
      sub: "Trening jeden na jeden w moim prywatnym studiu w Wimbledonie — spokojna, w pełni wyposażona przestrzeń. Bez tłumu i bez czekania na sprzęt.",
      bullets: [
        "Darmowa konsultacja na miejscu w studiu: Twoje cele, doświadczenie treningowe i historia zdrowia",
        "Ocena ruchu, żeby wychwycić ograniczenia, zanim dołożymy ciężar",
        "Program ułożony pod Ciebie i rozwijany w Twoim tempie",
        "Filmy z techniką Twoich ćwiczeń — w aplikacji lub na WhatsAppie",
        "Każda sesja zapisana w aplikacji, więc widzisz swoje postępy",
      ],
      cta: "KUP PAKIET →",
    },
    duo: {
      title: "Duo — trening we dwoje",
      sub: "Trenuj z partnerem lub znajomym w tym samym prywatnym studiu. Ta sama uwaga, niższa cena. Ceny za osobę.",
      cta: "ZAPYTAJ O DUO →",
    },
    online: {
      title: "Trening online",
      sub: "Twój program w aplikacji Karlito Strength — trenujesz tam, gdzie jesteś, a ja pilnuję techniki.",
      bullets: [
        "Darmowa konsultacja zdalna (rozmowa wideo): Twoje cele, doświadczenie treningowe i historia zdrowia",
        "3 treningi tygodniowo, ułożone pod Twoje cele i sprzęt",
        "Wideo i opis każdego ćwiczenia",
        "Rozpisane ciężary i powtórzenia — zapisujesz trening i zgłaszasz problemy",
        "Nagrywasz swoje serie, a ja odsyłam uwagi i poprawki",
        "Cotygodniowe podsumowanie; program rośnie razem z Twoją techniką i kondycją",
      ],
      cta: "ZACZNIJ ONLINE →",
    },
    single: "Pojedyncza sesja",
    sessions: (n) => `${n} sesji`,
    perMonth: "/ mies.",
    valid: (m) => (m === 1 ? "ważny 1 mies." : `ważny ${m} mies.`),
    from: "od",
    perPerson: "za osobę",
    terms: (h) => `Pakiety są ważne od dnia płatności. Odwołanie min. ${h}h przed sesją — sesja wraca na saldo.`,

    abTag: "O mnie",
    abTitle: ["TRENUJĘ TO,", "CZEGO UCZĘ."],
    abP1: "Jestem Karol, wykwalifikowany trener personalny (Level 3) i zawodnik kettlebell sport. W 2026 zdobyłem tytuł Mistrza Sportu Klasy Światowej w pięcioboju kettlebell IKMF — wiem więc, ile daje regularny trening, i sam robię te same ruchy, których uczę.",
    abP2: "Moje podejście jest proste: sztanga dla siły, kettlebell dla kondycji, i plan dopasowany do Twojego ciała, grafiku i celów.",
    abP3: "Specjalizuję się w pracy z osobami 35–55+, które chcą zbudować prawdziwą siłę — i utrzymać ją przez dekady, nie tylko na lato. Niezależnie od punktu startu, zaczynamy tam, gdzie jesteś.",
    creds: [
      "Wykwalifikowany trener personalny — Level 3",
      "Certyfikacja kettlebell StrongFirst",
      "Mistrz Sportu Klasy Światowej — pięciobój IKMF",
      "Top Team (Kettlebell Polska) — 200 rwań w 10 min oraz get-up, podciąganie, pistol i wyciskanie z kettlem 42 kg (połowa wagi ciała)",
      "5+ lat trenowania klientów w południowo-zachodnim Londynie",
    ],
    abImg: "MISTRZ SPORTU KLASY ŚWIATOWEJ · KETTLEBELL SPORT",

    meTag: "Metoda",
    meTitle: ["JASNY PLAN.", "STAŁY POSTĘP."],
    meSteps: [
      ["01", "OCENA", "Zaczynamy od tego, jak się ruszasz — przysiad, hinge, pchanie, noszenie — oraz historii kontuzji i regeneracji. Decyzje zapadają, zanim dotkniemy ciężaru."],
      ["02", "CYKLE 8-TYGODNIOWE", "Tydzień 1–2: nauka ruchów. Tydzień 3–6: budowanie siły i kondycji. Tydzień 7–8: test i nowe cele."],
      ["03", "SZTANGA + KETTLEBELL", "Sztanga dla siły. Kettlebell dla kondycji. Twoje ciało potrzebuje obu."],
      ["04", "WSZYSTKO W APLIKACJI", "Powtórzenia, ciężary, samopoczucie — wszystko zapisane. Jeśli coś nie działa, korygujemy od razu."],
    ],

    teTag: "Opinie klientów",
    teTitle: ["PRAWDZIWI LUDZIE.", "PRAWDZIWE EFEKTY."],

    apTag: "Aplikacja",
    apTitle: ["TWÓJ PROGRAM.", "W TWOJEJ KIESZENI."],
    apP: "Każdy klient dostaje aplikację Karlito Strength: program, instruktaże wideo, zapis sesji, śledzenie postępów i bezpośredni kontakt. Do tego testy siły i rangi do zdobycia.",
    apOpen: "OTWÓRZ APKĘ →",

    coTag: "Kontakt",
    coTitle: ["GOTOWY BY", "ZACZĄĆ?"],
    coSub: "Najszybciej odpowiem na WhatsAppie. Możesz też zostawić dane — odezwę się w ciągu 24 godzin. Zaczynamy od darmowej konsultacji — na miejscu w studiu albo przez rozmowę wideo, jeśli trenujesz online. Bez presji i bez zobowiązań.",
    coWhats: "NAPISZ NA WHATSAPP",
    coOr: "albo zostaw swoje dane",
    coName: "Twoje imię *",
    coEmail: "Adres email *",
    coPhone: "Telefon (opcjonalnie)",
    coGoalPlaceholder: "Jaki jest Twój główny cel?",
    coGoals: ["Zbudować siłę (sztanga)", "Nauczyć się kettlebell", "Schudnąć i zbudować mięśnie", "Startować w kettlebell sport", "Ogólna sprawność i zdrowie", "Trening online"],
    coMsg: "Coś jeszcze, co powinienem wiedzieć (kontuzje, grafik...)",
    coSend: "WYŚLIJ →",
    coSentTitle: "WIADOMOŚĆ WYSŁANA",
    coSentSub: "Dzięki — odezwę się w ciągu 24 godzin.",
    coErr: "Podaj imię i poprawny email.",
    waText: "Cześć Karol, znalazłem Twoją stronę i chciałbym zapytać o treningi.",
    waDuo: "Cześć Karol, chciałbym zapytać o trening duo.",
    ftLogin: "Logowanie",
  },
};

const TESTIMONIALS = [
  { name: "Tina Hansen", text: "Karol has a razor sharp eye for getting the technique right and avoiding injury, with excellent teaching skills. He'll help you achieve progress regardless of the starting point." },
  { name: "Paul Sheehan", text: "A master of kettlebell workouts in particular, but equally skilled in other weight and strength exercises. An excellent technician — clear in his approach and genuinely invested in your progress." },
  { name: "Clive Wilson", text: "I have had Karol as a coach for the last 4 years. In this time he has taught me so much about strength training, the correct techniques and given me tailored workout programmes for overall strength." },
  { name: "Zahid Hai", text: "I've been training with Karol three times a week since January 2025 and couldn't be more impressed. Exceptional trainer — highly recommend." },
  { name: "Russell Hanson", text: "Karol has changed my way of looking after myself. His attention to detail is always there, constantly improving technique. I'm so glad I joined his gym." },
  { name: "Javid Moosaji", text: "Karol is an amazing and experienced coach. He not only helps you get into the best shape of your life, but really understands how each body, muscle and piece of equipment are supposed to work in tandem." },
];

const BC = "'Barlow Condensed', sans-serif";
const gbp = (n) => "£" + (Number(n) % 1 === 0 ? Number(n).toFixed(0) : Number(n).toFixed(2));
const perHour = (p) => (p.sessions ? gbp(p.price / p.sessions) + "/h" : "");

export function LandingScreen({ onSignUp }) {
  const [visible, setVisible] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [whatsapp, setWhatsapp] = useState("");
  const [cancelHours, setCancelHours] = useState(12);
  const [form, setForm] = useState({ name: "", email: "", phone: "", goal: "", message: "" });
  const [formState, setFormState] = useState("idle"); // idle | sending | sent | error
  const observerRef = useRef(null);
  const t = TXT[lang];

  // live prices + WhatsApp number from the database
  useEffect(() => {
    supabase.rpc("ks_public_info").then(({ data }) => {
      if (!data) return;
      if (Array.isArray(data.packages) && data.packages.length) setPackages(data.packages);
      if (data.whatsapp) setWhatsapp(String(data.whatsapp).replace(/\D/g, ""));
      if (data.cancellation_hours) setCancelHours(data.cancellation_hours);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setVisible((prev) => ({ ...prev, [e.target.dataset.reveal]: true }));
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, [lang, packages]);

  const reveal = (id, delay = 0) => ({
    "data-reveal": id,
    style: {
      opacity: visible[id] ? 1 : 0,
      transform: visible[id] ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    },
  });

  const waLink = (text) => (whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}` : "#contact");
  const waProps = (text) => (whatsapp ? { href: waLink(text), target: "_blank", rel: "noopener noreferrer" } : { href: "#contact" });

  const byKind = (kind) => packages.filter((p) => p.kind === kind).sort((a, b) => (a.sessions || 0) - (b.sessions || 0));
  const solo = byKind("solo");
  const duo = byKind("duo");
  const online = byKind("online")[0];
  const minPerHour = (list) => {
    const v = list.filter((p) => p.sessions).map((p) => p.price / p.sessions);
    return v.length ? gbp(Math.min(...v)) + "/h" : "";
  };

  const submit = async () => {
    if (!form.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) { setFormState("error"); return; }
    setFormState("sending");
    try {
      const { error } = await supabase.rpc("ks_submit_lead", {
        p_name: form.name.trim(), p_email: form.email.trim(), p_phone: form.phone.trim(),
        p_goal: form.goal, p_message: form.message, p_lang: lang,
      });
      if (error) throw error;
      try { sendPushToUser(COACH_ID, "📩 New enquiry", `${form.name.trim()}${form.goal ? " — " + form.goal : ""}`, "ks-lead", "/"); } catch (e) {}
      setFormState("sent");
    } catch (e) {
      setFormState("error");
    }
  };

  const langBtn = (
    <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--bg3)", borderRadius: 6, padding: 3, border: "1px solid var(--border2)" }}>
      {["en", "pl"].map((l) => (
        <div key={l} onClick={() => setLang(l)}
          style={{ padding: "5px 11px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: BC, letterSpacing: "0.1em",
            background: lang === l ? "var(--gold)" : "transparent", color: lang === l ? "#0c0f14" : "var(--gray)" }}>
          {l.toUpperCase()}
        </div>
      ))}
    </div>
  );

  const h2 = ({ id, title, mb = 12, center }) => (
    <h2 {...reveal(id)} style={{ ...reveal(id).style, fontFamily: BC, fontSize: "clamp(34px, 8vw, 58px)", fontWeight: 900, lineHeight: 0.95, marginBottom: mb, textAlign: center ? "center" : "left" }}>
      {title[0]}<br /><span style={{ color: "var(--gold)" }}>{title[1]}</span>
    </h2>
  );

  const priceRow = ({ p, perPerson }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
      <div>
        <div style={{ fontFamily: BC, fontSize: 16, fontWeight: 700, letterSpacing: "0.05em" }}>
          {p.sessions === 1 ? t.single : t.sessions(p.sessions)}
        </div>
        {p.validity_months && <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{t.valid(p.validity_months)}</div>}
      </div>
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: BC, fontSize: 24, fontWeight: 900, color: "#e8e0d0" }}>{gbp(p.price)}</span>
        {p.sessions > 1 && <span style={{ fontSize: 12, color: "var(--gold)", marginLeft: 6 }}>({perHour(p)})</span>}
        {perPerson && p.sessions === 1 && <span style={{ fontSize: 11, color: "var(--gray)", marginLeft: 6 }}>{t.perPerson}</span>}
      </div>
    </div>
  );

  const serviceCard = ({ id, data, list, featured, ctaProps, children }) => (
    <div {...reveal(id)} style={{ ...reveal(id).style, border: `1px solid ${featured ? "rgba(201,168,76,0.35)" : "var(--border)"}`,
      background: featured ? "linear-gradient(135deg, rgba(201,168,76,0.05), transparent)" : "var(--bg2)", padding: "24px 22px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <div style={{ fontFamily: BC, fontSize: 22, fontWeight: 900, letterSpacing: "0.04em" }}>{data.title}</div>
        {list && list.length > 0 && <div style={{ fontSize: 12, color: "var(--gold)", whiteSpace: "nowrap" }}>{t.from} {minPerHour(list)}</div>}
      </div>
      <div style={{ fontSize: 14, color: "#8a8a8a", lineHeight: 1.7, marginBottom: 12 }}>{data.sub}</div>
      {data.bullets && (
        <div style={{ margin: "4px 0 14px" }}>
          {data.bullets.map((b) => (
            <div key={b} style={{ display: "flex", gap: 10, fontSize: 13, color: "#b8b0a0", lineHeight: 1.55, padding: "4px 0" }}>
              <span style={{ color: "var(--gold)", flexShrink: 0 }}>✓</span><span>{b}</span>
            </div>
          ))}
        </div>
      )}
      {children}
      <a {...ctaProps} className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 18 }}>{data.cta}</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#07090c", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Cinzel+Decorative:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #c9a84c; --gold-dim: rgba(201,168,76,0.22); --gold-glow: rgba(201,168,76,0.06);
          --red: #c41e1e; --red-dim: rgba(196,30,30,0.22);
          --bg2: #0c0f14; --bg3: #131820;
          --border: rgba(255,255,255,0.07); --border2: rgba(201,168,76,0.12);
          --gray: #8a8a8a; --gray2: #555;
        }
        html { scroll-behavior: smooth; }
        .nav-link { color: var(--gray); text-decoration: none; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; transition: color 0.2s; background: none; border: none; cursor: pointer; }
        .nav-link:hover { color: var(--gold); }
        .btn-primary { background: var(--red); color: #fff; border: none; padding: 16px 32px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s, transform 0.15s; display: inline-block; text-decoration: none; }
        .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--gold); border: 1px solid var(--gold-dim); padding: 14px 28px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: inline-block; text-decoration: none; }
        .btn-ghost:hover { border-color: var(--gold); background: var(--gold-glow); }
        .btn-wa { background: #1f9d55; color: #fff; border: none; padding: 16px 28px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; display: inline-block; text-decoration: none; text-align: center; }
        .section { padding: 84px 24px; max-width: 720px; margin: 0 auto; }
        .tag { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 0.3em; color: var(--gold); text-transform: uppercase; margin-bottom: 14px; font-weight: 600; }
        .divider { width: 36px; height: 1px; background: linear-gradient(90deg, var(--gold), transparent); margin-bottom: 24px; }
        .input-field { background: #0c0f14; border: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid var(--border2); color: #e8e0d0; padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 16px; width: 100%; outline: none; margin-bottom: 12px; -webkit-appearance: none; border-radius: 0; }
        .input-field:focus { border-color: var(--gold-dim); }
        .input-field::placeholder { color: var(--gray2); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .h1 { animation: fadeUp 0.8s ease forwards; }
        .h2 { animation: fadeUp 0.8s ease 0.2s forwards; opacity:0; }
        .h3 { animation: fadeUp 0.8s ease 0.4s forwards; opacity:0; }
        .h4 { animation: fadeUp 0.8s ease 0.6s forwards; opacity:0; }
        .hamburger { display: none; cursor: pointer; padding: 8px; flex-direction: column; gap: 5px; }
        .hamburger div { width: 22px; height: 1px; background: #e8e0d0; }
        .mobile-only { display: none; }
        @media (max-width: 680px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex; }
          .mobile-only { display: flex !important; }
          .mobile-nav { position: fixed; top: 56px; left: 0; right: 0; background: #07090c; border-bottom: 1px solid var(--border); padding: 24px; display: flex; flex-direction: column; gap: 20px; z-index: 999; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(7,9,12,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: 56 }}>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
          KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {t.nav.map(([id, label]) => <a key={id} href={`#${id}`} className="nav-link">{label}</a>)}
          {langBtn}
          <button className="btn-ghost" onClick={onSignUp} style={{ padding: "8px 16px", fontSize: 11 }}>{t.login}</button>
        </div>
        <div className="mobile-only" style={{ alignItems: "center", gap: 12 }}>
          {langBtn}
          <div className="hamburger" onClick={() => setMenuOpen((v) => !v)}><div /><div /><div /></div>
        </div>
        {menuOpen && (
          <div className="mobile-nav">
            {t.nav.map(([id, label]) => <a key={id} href={`#${id}`} className="nav-link" onClick={() => setMenuOpen(false)}>{label}</a>)}
            <button className="btn-ghost" onClick={() => { setMenuOpen(false); onSignUp(); }} style={{ padding: "12px 20px", fontSize: 13 }}>{t.login}</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "110px 28px 64px", maxWidth: 720, margin: "0 auto" }}>
        <div className="h1"><div className="tag">{t.heroTag}</div></div>
        <h1 className="h2" style={{ fontFamily: BC, fontSize: "clamp(56px, 13vw, 100px)", fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.01em", marginBottom: 26 }}>
          {t.heroTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.heroTitle[1]}</span><br />{t.heroTitle[2]}
        </h1>
        <p className="h3" style={{ fontSize: 17, lineHeight: 1.8, color: "#9a9a9a", maxWidth: 520, marginBottom: 36 }}>{t.heroP}</p>
        <div className="h4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="#services" className="btn-primary">{t.seePrices}</a>
          <a {...waProps(t.waText)} className={whatsapp ? "btn-wa" : "btn-ghost"}>{t.whatsapp}</a>
        </div>
        <div className="h4" style={{ display: "flex", gap: 36, marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
          {t.stats.map(([num, label]) => (
            <div key={label}>
              <div style={{ fontFamily: BC, fontSize: 34, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 11, color: "var(--gray)", letterSpacing: "0.12em", marginTop: 6, textTransform: "uppercase", maxWidth: 160 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES & PRICES ── */}
      <section id="services" style={{ background: "#090b0f", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div className="tag">{t.svTag}</div>
          <div className="divider" />
          {h2({ id: "sv-h", title: t.svTitle })}
          <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 36, lineHeight: 1.8, maxWidth: 520 }}>{t.svNote}</p>

          {serviceCard({ id: "sv-solo", data: t.solo, list: solo, featured: true, ctaProps: { href: "/buy" },
            children: solo.map((p) => <div key={p.code}>{priceRow({ p })}</div>) })}

          {serviceCard({ id: "sv-duo", data: t.duo, list: duo, ctaProps: waProps(t.waDuo),
            children: duo.map((p) => <div key={p.code}>{priceRow({ p, perPerson: true })}</div>) })}

          {online && (
            serviceCard({ id: "sv-online", data: t.online, ctaProps: { href: "/buy" }, children: (
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: BC, fontSize: 40, fontWeight: 900, color: "var(--gold)" }}>{gbp(online.price)}</span>
                <span style={{ fontSize: 14, color: "var(--gray)" }}>{t.perMonth}</span>
              </div>
            ) })
          )}

          <p style={{ fontSize: 12, color: "var(--gray2)", lineHeight: 1.7, marginTop: 8 }}>{t.terms(cancelHours)}</p>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about">
        <div className="section">
          <div className="tag">{t.abTag}</div>
          <div className="divider" />
          {h2({ id: "ab-h", title: t.abTitle, mb: 28 })}
          <p {...reveal("ab-p1")} style={{ ...reveal("ab-p1").style, fontSize: 16, lineHeight: 1.85, color: "#9a9a9a", marginBottom: 18 }}>{t.abP1}</p>
          <div {...reveal("ab-creds")} style={{ ...reveal("ab-creds").style, border: "1px solid var(--border2)", background: "var(--gold-glow)", padding: "18px 20px", margin: "8px 0 24px" }}>
            {t.creds.map((c) => (
              <div key={c} style={{ display: "flex", gap: 12, padding: "6px 0", fontSize: 14, color: "#d8d0c0", lineHeight: 1.5 }}>
                <span style={{ color: "var(--gold)" }}>◆</span><span>{c}</span>
              </div>
            ))}
          </div>
          <p {...reveal("ab-p2")} style={{ ...reveal("ab-p2").style, fontSize: 16, lineHeight: 1.85, color: "#8a8a8a", marginBottom: 18 }}>{t.abP2}</p>
          <p {...reveal("ab-p3")} style={{ ...reveal("ab-p3").style, fontSize: 16, lineHeight: 1.85, color: "#8a8a8a", marginBottom: 32 }}>{t.abP3}</p>
          <div {...reveal("ab-img")} style={{ ...reveal("ab-img").style, position: "relative", overflow: "hidden", borderLeft: "2px solid var(--red-dim)" }}>
            <img src="/karlito.jpg" alt="Karol Przybycień — kettlebell sport"
              style={{ width: "100%", maxHeight: 600, objectFit: "contain", display: "block", filter: "brightness(0.9) contrast(1.05)", background: "#07090c" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(0deg, rgba(7,9,12,0.9) 0%, transparent 100%)" }}>
              <div style={{ fontFamily: BC, fontSize: 11, letterSpacing: "0.2em", color: "var(--gold)" }}>{t.abImg}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METHOD ── */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div className="tag">{t.meTag}</div>
          <div className="divider" />
          {h2({ id: "me-h", title: t.meTitle, mb: 32 })}
          {t.meSteps.map(([num, title, desc], i) => (
            <div key={num} {...reveal(`me${i}`, i * 0.06)} style={{ ...reveal(`me${i}`, i * 0.06).style, display: "flex", gap: 20, marginBottom: 10, background: "#07090c", border: "1px solid var(--border)", borderLeft: "2px solid var(--red-dim)", padding: "18px 20px" }}>
              <div style={{ fontFamily: BC, fontSize: 28, fontWeight: 900, color: "var(--red)", opacity: 0.45, lineHeight: 1, flexShrink: 0 }}>{num}</div>
              <div>
                <div style={{ fontFamily: BC, fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#8a8a8a" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews">
        <div className="section">
          <div className="tag">{t.teTag}</div>
          <div className="divider" />
          {h2({ id: "te-h", title: t.teTitle, mb: 40 })}
          {TESTIMONIALS.map((tm, i) => (
            <div key={tm.name} {...reveal(`te${i}`, (i % 2) * 0.06)} style={{ ...reveal(`te${i}`, (i % 2) * 0.06).style, borderLeft: "1px solid var(--gold-dim)", paddingLeft: 22, marginBottom: 28 }}>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "#8a8a8a", marginBottom: 8, fontStyle: "italic" }}>"{tm.text}"</p>
              <div style={{ fontFamily: BC, fontSize: 11, letterSpacing: "0.18em", color: "var(--gold)" }}>— {tm.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APP ── */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <div className="tag">{t.apTag}</div>
          <div className="divider" style={{ margin: "0 auto 24px" }} />
          {h2({ id: "ap-h", title: t.apTitle, mb: 16, center: true })}
          <p style={{ fontSize: 15, color: "#8a8a8a", lineHeight: 1.8, maxWidth: 460, margin: "0 auto 32px" }}>{t.apP}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-ghost" onClick={onSignUp}>{t.apOpen}</button>
            <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="btn-ghost">@KARLITOSTRENGTH</a>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact">
        <div className="section">
          <div className="tag">{t.coTag}</div>
          <div className="divider" />
          {h2({ id: "co-h", title: t.coTitle })}
          <p style={{ fontSize: 15, color: "#8a8a8a", lineHeight: 1.8, marginBottom: 28, maxWidth: 500 }}>{t.coSub}</p>

          {whatsapp && (
            <>
              <a {...waProps(t.waText)} className="btn-wa" style={{ display: "block", marginBottom: 20 }}>💬 {t.coWhats}</a>
              <div style={{ fontFamily: BC, fontSize: 11, letterSpacing: "0.25em", color: "var(--gray2)", textAlign: "center", marginBottom: 20, textTransform: "uppercase" }}>{t.coOr}</div>
            </>
          )}

          {formState === "sent" ? (
            <div style={{ border: "1px solid var(--gold-dim)", background: "var(--gold-glow)", padding: "44px 28px", textAlign: "center" }}>
              <div style={{ fontSize: 30, color: "var(--gold)", marginBottom: 10 }}>✓</div>
              <div style={{ fontFamily: BC, fontSize: 22, fontWeight: 900, color: "var(--gold)", letterSpacing: "0.1em", marginBottom: 8 }}>{t.coSentTitle}</div>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>{t.coSentSub}</div>
            </div>
          ) : (
            <div>
              <input className="input-field" placeholder={t.coName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              <input className="input-field" type="email" placeholder={t.coEmail} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              <input className="input-field" type="tel" placeholder={t.coPhone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              <select className="input-field" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                <option value="">{t.coGoalPlaceholder}</option>
                {t.coGoals.map((g) => <option key={g}>{g}</option>)}
              </select>
              <textarea className="input-field" placeholder={t.coMsg} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ resize: "vertical" }} />
              {formState === "error" && <div style={{ fontSize: 13, color: "#e05a4f", marginBottom: 10 }}>{t.coErr}</div>}
              <button className="btn-primary" onClick={submit} disabled={formState === "sending"} style={{ width: "100%", marginTop: 4, opacity: formState === "sending" ? 0.6 : 1 }}>
                {formState === "sending" ? "..." : t.coSend}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 28px", maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span></div>
          <div style={{ fontFamily: BC, fontSize: 10, letterSpacing: "0.3em", color: "var(--gray2)" }}>FERRUM · SANGUIS · GLORIA</div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="nav-link">Instagram</a>
          {whatsapp && <a {...waProps(t.waText)} className="nav-link">WhatsApp</a>}
          <a href="/buy" className="nav-link">{t.nav[0][1]}</a>
          <button onClick={onSignUp} className="nav-link">{t.ftLogin}</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--gray2)" }}>© {new Date().getFullYear()} Karlito Strength</div>
      </footer>
    </div>
  );
}
