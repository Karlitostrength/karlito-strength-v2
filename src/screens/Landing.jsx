import { useState, useEffect } from "react";
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

const PAGES = ["home", "prices", "app", "contact"];

const TXT = {
  en: {
    nav: { home: "About", prices: "Prices", app: "App", contact: "Contact" },
    login: "CLIENT LOGIN",

    // HOME
    heroTag: "1:1 · Duo · Online · Wimbledon SW19",
    heroTitle: ["STRENGTH", "IS FOR", "EVERYONE."],
    heroP: "Personal strength coaching in my private studio in Wimbledon, specialising in people aged 35–55+. Whatever your fitness level, we start where you are.",
    seePrices: "SEE PRICES",
    whatsapp: "WHATSAPP ME",
    abTag: "About me",
    abTitle: ["I PRACTISE", "WHAT I TEACH."],
    abP1: "I'm Karol, a Level 3 qualified personal trainer and kettlebell sport athlete. I train the same movements I teach, so I know what consistent training takes — and what it gives back.",
    abP2: "I've been coaching in South West London for over five years. Most of my clients are 35–55+: busy people who want to get strong and stay that way for decades, not just for summer.",
    creds: [
      "Level 3 Personal Trainer",
      "StrongFirst kettlebell certification",
      "Master of Sport World Class — IKMF kettlebell pentathlon",
      "5+ years coaching clients in South West London",
    ],
    phTag: "My philosophy",
    phTitle: ["SIMPLE.", "CONSISTENT. YOURS."],
    phil: [
      ["Strength is for everyone", "Age, fitness level or experience is not a barrier. It's just the starting point."],
      ["Technique first, then load", "We learn to move well before we add weight. Good technique keeps you training for years."],
      ["Simple tools, done well", "Barbell for strength, kettlebells for conditioning. No gimmicks, no endless variety."],
      ["Consistency beats intensity", "A plan that fits your life, followed week after week, beats any heroic workout."],
    ],
    gaTag: "In the studio",
    gaTitle: ["TRAINING", "IN ACTION."],
    teTag: "What clients say",
    teTitle: ["REAL PEOPLE.", "REAL RESULTS."],
    moreReviews: "MORE REVIEWS",
    lessReviews: "SHOW FEWER",
    nextPrices: "SEE PRICES & PACKAGES →",

    // PRICES
    svTag: "Training & Prices",
    svTitle: ["CHOOSE HOW", "YOU TRAIN."],
    svNote: "We always start with a free consultation. Pay by bank transfer — your package starts as soon as the payment is confirmed.",
    solo: {
      title: "1:1 Personal Training",
      sub: "One-to-one in my private studio in Wimbledon — a calm, fully equipped space. No crowds, no queueing for equipment.",
      bullets: [
        "Free consultation in person at the studio",
        "Movement assessment before we add load",
        "A programme built for you, progressed at your pace",
        "Technique videos sent in the app or on WhatsApp",
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
        "Free remote consultation (video call)",
        "3 workouts a week, built around your goals and equipment",
        "Video demo and written instructions for every exercise",
        "Film your sets and get my feedback; weekly check-in",
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

    // APP
    apTag: "The App",
    apTitle: ["YOUR PROGRAMME.", "IN YOUR POCKET."],
    apP: "Every client — in the studio or online — gets the Karlito Strength app.",
    apFeatures: [
      ["Your programme", "Every session laid out: exercises, sets, reps and weights."],
      ["Video demos", "Short technique videos for every exercise, in English and Polish."],
      ["Session log", "Log what you lifted and how it felt. Your progress, in numbers."],
      ["Direct messages", "Questions and form checks go straight to me."],
      ["Your account", "Sessions left, package expiry, payments and invoices in one place."],
      ["Strength tests & ranks", "Test yourself and earn ranks as you get stronger."],
    ],
    apOpen: "OPEN APP →",

    // CONTACT
    coTag: "Get in touch",
    coTitle: ["READY TO", "START?"],
    coSub: "Message me on WhatsApp for the fastest reply, or leave your details and I'll get back to you within 24 hours. We start with a free consultation — in person at the studio, or by video call if you train online.",
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
  },
  pl: {
    nav: { home: "O mnie", prices: "Cennik", app: "Aplikacja", contact: "Kontakt" },
    login: "LOGOWANIE",

    heroTag: "1:1 · Duo · Online · Wimbledon SW19",
    heroTitle: ["TRENING SIŁOWY", "JEST DLA", "KAŻDEGO."],
    heroP: "Indywidualny trening siłowy w moim prywatnym studiu w Wimbledonie, ze specjalizacją w pracy z osobami 35–55+. Niezależnie od poziomu — zaczynamy tam, gdzie jesteś.",
    seePrices: "ZOBACZ CENY",
    whatsapp: "NAPISZ NA WHATSAPP",
    abTag: "O mnie",
    abTitle: ["TRENUJĘ TO,", "CZEGO UCZĘ."],
    abP1: "Jestem Karol, wykwalifikowany trener personalny (Level 3) i zawodnik kettlebell sport. Sam robię te same ruchy, których uczę, więc wiem, ile wymaga regularny trening — i ile daje.",
    abP2: "Trenuję klientów w południowo-zachodnim Londynie od ponad pięciu lat. Większość z nich ma 35–55+ lat: zajęci ludzie, którzy chcą być silni i zostać silni na dekady, nie tylko na lato.",
    creds: [
      "Trener personalny Level 3",
      "Certyfikacja kettlebell StrongFirst",
      "Mistrz Sportu Klasy Światowej — pięciobój kettlebell IKMF",
      "5+ lat trenowania klientów w południowo-zachodnim Londynie",
    ],
    phTag: "Moja filozofia",
    phTitle: ["PROSTO.", "REGULARNIE. PO TWOJEMU."],
    phil: [
      ["Siła jest dla każdego", "Wiek, kondycja czy doświadczenie to nie przeszkoda. To tylko punkt startu."],
      ["Najpierw technika, potem ciężar", "Uczymy się dobrze ruszać, zanim dołożymy obciążenie. Dobra technika pozwala trenować latami."],
      ["Proste narzędzia, dobrze użyte", "Sztanga dla siły, kettlebell dla kondycji. Bez gadżetów i bez wymyślania na siłę."],
      ["Regularność wygrywa z intensywnością", "Plan dopasowany do Twojego życia, robiony tydzień po tygodniu, daje więcej niż jeden heroiczny trening."],
    ],
    gaTag: "W studiu",
    gaTitle: ["TRENING", "W PRAKTYCE."],
    teTag: "Opinie klientów",
    teTitle: ["PRAWDZIWI LUDZIE.", "PRAWDZIWE EFEKTY."],
    moreReviews: "WIĘCEJ OPINII",
    lessReviews: "POKAŻ MNIEJ",
    nextPrices: "ZOBACZ CENY I PAKIETY →",

    svTag: "Treningi i ceny",
    svTitle: ["WYBIERZ, JAK", "TRENUJESZ."],
    svNote: "Zawsze zaczynamy od darmowej konsultacji. Płatność przelewem — pakiet startuje, gdy wpłata zostanie potwierdzona.",
    solo: {
      title: "Trening personalny 1:1",
      sub: "Jeden na jeden w moim prywatnym studiu w Wimbledonie — spokojna, w pełni wyposażona przestrzeń. Bez tłumu i bez czekania na sprzęt.",
      bullets: [
        "Darmowa konsultacja na miejscu w studiu",
        "Ocena ruchu, zanim dołożymy ciężar",
        "Program ułożony pod Ciebie, w Twoim tempie",
        "Filmy z techniką w aplikacji lub na WhatsAppie",
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
        "Darmowa konsultacja zdalna (rozmowa wideo)",
        "3 treningi tygodniowo, pod Twoje cele i sprzęt",
        "Wideo i opis każdego ćwiczenia",
        "Nagrywasz serie, ja odsyłam uwagi; cotygodniowe podsumowanie",
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

    apTag: "Aplikacja",
    apTitle: ["TWÓJ PROGRAM.", "W TWOJEJ KIESZENI."],
    apP: "Każdy klient — w studiu i online — dostaje aplikację Karlito Strength.",
    apFeatures: [
      ["Twój program", "Każdy trening rozpisany: ćwiczenia, serie, powtórzenia i ciężary."],
      ["Filmy z techniką", "Krótkie wideo do każdego ćwiczenia, po polsku i po angielsku."],
      ["Dziennik treningów", "Zapisujesz, co podniosłeś i jak się czułeś. Twój postęp w liczbach."],
      ["Wiadomości", "Pytania i nagrania techniki trafiają prosto do mnie."],
      ["Twoje konto", "Pozostałe sesje, ważność pakietu, płatności i faktury w jednym miejscu."],
      ["Testy siły i rangi", "Sprawdzasz się i zdobywasz kolejne rangi, gdy rośnie Twoja siła."],
    ],
    apOpen: "OTWÓRZ APKĘ →",

    coTag: "Kontakt",
    coTitle: ["GOTOWY BY", "ZACZĄĆ?"],
    coSub: "Najszybciej odpowiem na WhatsAppie. Możesz też zostawić dane — odezwę się w ciągu 24 godzin. Zaczynamy od darmowej konsultacji — na miejscu w studiu albo przez rozmowę wideo, jeśli trenujesz online.",
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
  },
};

const TESTIMONIALS = [
  { name: "Clive Wilson", text: "I have had Karol as a coach for the last 4 years. In this time he has taught me so much about strength training, the correct techniques and given me tailored workout programmes for overall strength." },
  { name: "Tina Hansen", text: "Karol has a razor sharp eye for getting the technique right and avoiding injury, with excellent teaching skills. He'll help you achieve progress regardless of the starting point." },
  { name: "Zahid Hai", text: "I've been training with Karol three times a week since January 2025 and couldn't be more impressed. Exceptional trainer — highly recommend." },
  { name: "Paul Sheehan", text: "A master of kettlebell workouts in particular, but equally skilled in other weight and strength exercises. An excellent technician — clear in his approach and genuinely invested in your progress." },
  { name: "Russell Hanson", text: "Karol has changed my way of looking after myself. His attention to detail is always there, constantly improving technique. I'm so glad I joined his gym." },
  { name: "Javid Moosaji", text: "Karol is an amazing and experienced coach. He not only helps you get into the best shape of your life, but really understands how each body, muscle and piece of equipment are supposed to work in tandem." },
];

// ── PHOTOS & VIDEOS WITH CLIENTS ──
// 1. Put files in the GitHub folder public/clients/ (e.g. public/clients/aga-swing.jpg or .mp4)
// 2. Add one line per file below. Empty list = the section is hidden.
// Only use photos/videos of clients who agreed to be shown on the website.
const CLIENT_MEDIA = [
  // { type: "image", src: "/clients/aga-swing.jpg", alt: "Kettlebell swing in the studio" },
  // { type: "video", src: "/clients/deadlift.mp4", poster: "/clients/deadlift.jpg" },
];

const BC = "'Barlow Condensed', sans-serif";
const gbp = (n) => "£" + (Number(n) % 1 === 0 ? Number(n).toFixed(0) : Number(n).toFixed(2));
const perHour = (p) => (p.sessions ? gbp(p.price / p.sessions) + "/h" : "");
const pageFromHash = () => {
  const h = (window.location.hash || "").replace("#", "");
  return PAGES.includes(h) ? h : "home";
};

export function LandingScreen({ onSignUp }) {
  const [page, setPage] = useState(pageFromHash());
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [whatsapp, setWhatsapp] = useState("");
  const [cancelHours, setCancelHours] = useState(12);
  const [allReviews, setAllReviews] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", goal: "", message: "" });
  const [formState, setFormState] = useState("idle"); // idle | sending | sent | error
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

  // tabs follow the URL hash (#prices, #app, #contact) so links and the back button work
  useEffect(() => {
    const onHash = () => { setPage(pageFromHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (p) => {
    setMenuOpen(false);
    if (p === page) { window.scrollTo(0, 0); return; }
    window.location.hash = p === "home" ? "" : p;
    setPage(p);
    window.scrollTo(0, 0);
  };

  const waProps = (text) => (whatsapp
    ? { href: `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, target: "_blank", rel: "noopener noreferrer" }
    : { href: "#contact" });

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

  // ---------- small render helpers (plain functions, not components) ----------
  const heading = (tag, title, center) => (
    <div style={{ textAlign: center ? "center" : "left" }}>
      <div className="tag">{tag}</div>
      <div className="divider" style={center ? { margin: "0 auto 22px" } : undefined} />
      <h2 style={{ fontFamily: BC, fontSize: "clamp(34px, 8vw, 54px)", fontWeight: 900, lineHeight: 0.95, marginBottom: 20 }}>
        {title[0]}<br /><span style={{ color: "var(--gold)" }}>{title[1]}</span>
      </h2>
    </div>
  );

  const ticks = (items) => (
    <div style={{ margin: "4px 0 14px" }}>
      {items.map((b) => (
        <div key={b} style={{ display: "flex", gap: 10, fontSize: 13, color: "#b8b0a0", lineHeight: 1.55, padding: "4px 0" }}>
          <span style={{ color: "var(--gold)", flexShrink: 0 }}>✓</span><span>{b}</span>
        </div>
      ))}
    </div>
  );

  const priceRow = (p, perPerson) => (
    <div key={p.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
      <div>
        <div style={{ fontFamily: BC, fontSize: 16, fontWeight: 700, letterSpacing: "0.05em" }}>{p.sessions === 1 ? t.single : t.sessions(p.sessions)}</div>
        {p.validity_months && <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{t.valid(p.validity_months)}</div>}
      </div>
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: BC, fontSize: 24, fontWeight: 900, color: "#e8e0d0" }}>{gbp(p.price)}</span>
        {p.sessions > 1 && <span style={{ fontSize: 12, color: "var(--gold)", marginLeft: 6 }}>({perHour(p)})</span>}
        {perPerson && p.sessions === 1 && <span style={{ fontSize: 11, color: "var(--gray)", marginLeft: 6 }}>{t.perPerson}</span>}
      </div>
    </div>
  );

  const card = (data, list, featured, ctaProps, body) => (
    <div style={{ border: `1px solid ${featured ? "rgba(201,168,76,0.35)" : "var(--border)"}`,
      background: featured ? "linear-gradient(135deg, rgba(201,168,76,0.05), transparent)" : "var(--bg2)", padding: "22px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <div style={{ fontFamily: BC, fontSize: 22, fontWeight: 900, letterSpacing: "0.04em" }}>{data.title}</div>
        {list && list.length > 0 && <div style={{ fontSize: 12, color: "var(--gold)", whiteSpace: "nowrap" }}>{t.from} {minPerHour(list)}</div>}
      </div>
      <div style={{ fontSize: 14, color: "#8a8a8a", lineHeight: 1.65, marginBottom: 10 }}>{data.sub}</div>
      {data.bullets && ticks(data.bullets)}
      {body}
      <a {...ctaProps} className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 16 }}>{data.cta}</a>
    </div>
  );

  // ---------- pages ----------
  const Home = (
    <>
      <section className="section" style={{ paddingTop: 124 }}>
        <div className="tag">{t.heroTag}</div>
        <h1 style={{ fontFamily: BC, fontSize: "clamp(52px, 12vw, 92px)", fontWeight: 900, lineHeight: 0.92, marginBottom: 22 }}>
          {t.heroTitle[0]}<br /><span style={{ color: "var(--gold)" }}>{t.heroTitle[1]}</span><br />{t.heroTitle[2]}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: "#9a9a9a", maxWidth: 520, marginBottom: 28 }}>{t.heroP}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => go("prices")}>{t.seePrices}</button>
          <a {...waProps(t.waText)} className={whatsapp ? "btn-wa" : "btn-ghost"} onClick={whatsapp ? undefined : (e) => { e.preventDefault(); go("contact"); }}>{t.whatsapp}</a>
        </div>
      </section>

      <section className="band">
        <div className="section">
          {heading(t.abTag, t.abTitle)}
          <img src="/karlito.jpg" alt="Karol Przybycień"
            style={{ width: "100%", maxHeight: 520, objectFit: "contain", display: "block", background: "#07090c", marginBottom: 24, borderLeft: "2px solid var(--red-dim)" }} />
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#9a9a9a", marginBottom: 16 }}>{t.abP1}</p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#9a9a9a", marginBottom: 20 }}>{t.abP2}</p>
          <div style={{ border: "1px solid var(--border2)", background: "var(--gold-glow)", padding: "14px 18px" }}>
            {t.creds.map((c) => (
              <div key={c} style={{ display: "flex", gap: 12, padding: "5px 0", fontSize: 14, color: "#d8d0c0", lineHeight: 1.5 }}>
                <span style={{ color: "var(--gold)" }}>◆</span><span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        {heading(t.phTag, t.phTitle)}
        <div className="phil-grid">
          {t.phil.map(([title, desc], i) => (
            <div key={title} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderTop: "2px solid var(--gold-dim)", padding: "18px 18px" }}>
              <div style={{ fontFamily: BC, fontSize: 13, color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 6 }}>0{i + 1}</div>
              <div style={{ fontFamily: BC, fontSize: 18, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: "#8a8a8a" }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {CLIENT_MEDIA.length > 0 && (
        <section className="section">
          {heading(t.gaTag, t.gaTitle)}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {CLIENT_MEDIA.map((m) => (
              m.type === "video" ? (
                <video key={m.src} src={m.src} poster={m.poster} controls playsInline preload="metadata"
                  style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", background: "#000", display: "block" }} />
              ) : (
                <img key={m.src} src={m.src} alt={m.alt || ""} loading="lazy"
                  style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", display: "block" }} />
              )
            ))}
          </div>
        </section>
      )}

      <section className="band">
        <div className="section">
          {heading(t.teTag, t.teTitle)}
          {(allReviews ? TESTIMONIALS : TESTIMONIALS.slice(0, 3)).map((tm) => (
            <div key={tm.name} style={{ borderLeft: "1px solid var(--gold-dim)", paddingLeft: 20, marginBottom: 24 }}>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "#8a8a8a", marginBottom: 6, fontStyle: "italic" }}>"{tm.text}"</p>
              <div style={{ fontFamily: BC, fontSize: 11, letterSpacing: "0.18em", color: "var(--gold)" }}>— {tm.name}</div>
            </div>
          ))}
          <button className="btn-ghost" onClick={() => setAllReviews(!allReviews)} style={{ padding: "10px 18px", fontSize: 12 }}>
            {allReviews ? t.lessReviews : t.moreReviews}
          </button>
        </div>
      </section>

      <section className="section" style={{ textAlign: "center" }}>
        <button className="btn-primary" onClick={() => go("prices")}>{t.nextPrices}</button>
      </section>
    </>
  );

  const Prices = (
    <section className="section" style={{ paddingTop: 120 }}>
      {heading(t.svTag, t.svTitle)}
      <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 28, lineHeight: 1.75, maxWidth: 520 }}>{t.svNote}</p>
      {card(t.solo, solo, true, { href: "/buy" }, solo.map((p) => priceRow(p)))}
      {card(t.duo, duo, false, waProps(t.waDuo), duo.map((p) => priceRow(p, true)))}
      {online && card(t.online, null, false, { href: "/buy" }, (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: BC, fontSize: 40, fontWeight: 900, color: "var(--gold)" }}>{gbp(online.price)}</span>
          <span style={{ fontSize: 14, color: "var(--gray)" }}>{t.perMonth}</span>
        </div>
      ))}
      <p style={{ fontSize: 12, color: "var(--gray2)", lineHeight: 1.7, marginTop: 4 }}>{t.terms(cancelHours)}</p>
    </section>
  );

  const App = (
    <section className="section" style={{ paddingTop: 120 }}>
      {heading(t.apTag, t.apTitle)}
      <p style={{ fontSize: 15, color: "#9a9a9a", lineHeight: 1.75, marginBottom: 24 }}>{t.apP}</p>
      <div className="phil-grid">
        {t.apFeatures.map(([title, desc]) => (
          <div key={title} style={{ background: "var(--bg2)", border: "1px solid var(--border)", padding: "16px 18px" }}>
            <div style={{ fontFamily: BC, fontSize: 17, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#8a8a8a" }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
        <button className="btn-primary" onClick={onSignUp}>{t.apOpen}</button>
        <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="btn-ghost">@KARLITOSTRENGTH</a>
      </div>
    </section>
  );

  const Contact = (
    <section className="section" style={{ paddingTop: 120 }}>
      {heading(t.coTag, t.coTitle)}
      <p style={{ fontSize: 15, color: "#8a8a8a", lineHeight: 1.75, marginBottom: 24, maxWidth: 520 }}>{t.coSub}</p>
      {whatsapp && (
        <>
          <a {...waProps(t.waText)} className="btn-wa" style={{ display: "block", marginBottom: 18 }}>💬 {t.coWhats}</a>
          <div style={{ fontFamily: BC, fontSize: 11, letterSpacing: "0.25em", color: "var(--gray2)", textAlign: "center", marginBottom: 18, textTransform: "uppercase" }}>{t.coOr}</div>
        </>
      )}
      {formState === "sent" ? (
        <div style={{ border: "1px solid var(--gold-dim)", background: "var(--gold-glow)", padding: "40px 24px", textAlign: "center" }}>
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
    </section>
  );

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
        .nav-link { color: var(--gray); text-decoration: none; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; background: none; border: none; cursor: pointer; padding: 6px 0; border-bottom: 1px solid transparent; }
        .nav-link:hover { color: var(--gold); }
        .nav-link.active { color: var(--gold); border-bottom-color: var(--gold); }
        .btn-primary { background: var(--red); color: #fff; border: none; padding: 15px 28px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; display: inline-block; text-decoration: none; }
        .btn-primary:hover { opacity: 0.88; }
        .btn-ghost { background: transparent; color: var(--gold); border: 1px solid var(--gold-dim); padding: 13px 24px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; display: inline-block; text-decoration: none; }
        .btn-ghost:hover { border-color: var(--gold); background: var(--gold-glow); }
        .btn-wa { background: #1f9d55; color: #fff; border: none; padding: 15px 24px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; display: inline-block; text-decoration: none; text-align: center; }
        .section { padding: 64px 22px; max-width: 720px; margin: 0 auto; }
        .band { background: #090b0f; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .tag { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 0.3em; color: var(--gold); text-transform: uppercase; margin-bottom: 12px; font-weight: 600; }
        .divider { width: 36px; height: 1px; background: linear-gradient(90deg, var(--gold), transparent); margin-bottom: 22px; }
        .phil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 560px) { .phil-grid { grid-template-columns: 1fr; } }
        .input-field { background: #0c0f14; border: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid var(--border2); color: #e8e0d0; padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 16px; width: 100%; outline: none; margin-bottom: 12px; -webkit-appearance: none; border-radius: 0; }
        .input-field:focus { border-color: var(--gold-dim); }
        .input-field::placeholder { color: var(--gray2); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .page { animation: fadeUp 0.4s ease forwards; }
        .hamburger { display: none; cursor: pointer; padding: 8px; flex-direction: column; gap: 5px; }
        .hamburger div { width: 22px; height: 1px; background: #e8e0d0; }
        .mobile-only { display: none; }
        .tabbar { display: none; }
        @media (max-width: 680px) {
          .desktop-nav { display: none !important; }
          .mobile-only { display: flex !important; }
          .tabbar { display: flex; position: fixed; top: 56px; left: 0; right: 0; z-index: 999; background: rgba(7,9,12,0.97); border-bottom: 1px solid var(--border); justify-content: space-around; padding: 0 8px; height: 42px; align-items: center; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(7,9,12,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", height: 56 }}>
        <div onClick={() => go("home")} style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer" }}>
          KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {PAGES.map((p) => <button key={p} className={`nav-link ${page === p ? "active" : ""}`} onClick={() => go(p)}>{t.nav[p]}</button>)}
          {langBtn}
          <button className="btn-ghost" onClick={onSignUp} style={{ padding: "8px 14px", fontSize: 11 }}>{t.login}</button>
        </div>
        <div className="mobile-only" style={{ alignItems: "center", gap: 10 }}>
          {langBtn}
          <button className="btn-ghost" onClick={onSignUp} style={{ padding: "6px 10px", fontSize: 10 }}>{t.login}</button>
        </div>
      </nav>
      {/* mobile tab bar under the header */}
      <div className="tabbar">
        {PAGES.map((p) => <button key={p} className={`nav-link ${page === p ? "active" : ""}`} onClick={() => go(p)}>{t.nav[p]}</button>)}
      </div>

      <main key={page + lang} className="page">
        {page === "home" && Home}
        {page === "prices" && Prices}
        {page === "app" && App}
        {page === "contact" && Contact}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 22px", maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>KARLITO <span style={{ color: "var(--gold)" }}>STRENGTH</span></div>
          <div style={{ fontFamily: BC, fontSize: 10, letterSpacing: "0.3em", color: "var(--gray2)" }}>FERRUM · SANGUIS · GLORIA</div>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
          {PAGES.map((p) => <button key={p} className="nav-link" onClick={() => go(p)}>{t.nav[p]}</button>)}
          <a href="https://instagram.com/karlitostrength" target="_blank" rel="noopener noreferrer" className="nav-link">Instagram</a>
        </div>
        <div style={{ fontSize: 11, color: "var(--gray2)" }}>© {new Date().getFullYear()} Karlito Strength</div>
      </footer>
    </div>
  );
}
