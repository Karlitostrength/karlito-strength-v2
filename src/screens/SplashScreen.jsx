import { useState, useEffect } from "react";

export function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // in | hold | out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2400);
    const t2 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#07090c",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: phase === "out" ? 0 : 1,
      transition: phase === "out" ? "opacity 0.6s ease" : "none",
    }}>

      {/* PHOTO — full bleed, B&W */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        filter: "grayscale(100%) contrast(1.15)",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 0.8s ease",
        animation: phase === "in" ? "none" : "none",
      }} />

      {/* dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(7,9,12,0.3) 0%, rgba(7,9,12,0.1) 40%, rgba(7,9,12,0.7) 80%, rgba(7,9,12,0.95) 100%)",
      }} />

      {/* gold vertical line left */}
      <div style={{
        position: "absolute", left: 32, top: "15%", bottom: "15%",
        width: 1,
        background: "linear-gradient(180deg, transparent, rgba(201,168,76,0.4), transparent)",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 1s ease 0.4s",
      }} />

      {/* LOGO */}
      <div style={{
        position: "absolute", bottom: 64,
        textAlign: "center",
        opacity: phase === "in" ? 0 : 1,
        transform: phase === "in" ? "translateY(16px)" : "translateY(0)",
        transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
      }}>
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 22, fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#e8e0d0",
          marginBottom: 8,
        }}>
          KARLITO <span style={{ color: "#c9a84c" }}>STRENGTH</span>
        </div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9, letterSpacing: "0.4em",
          color: "rgba(201,168,76,0.6)",
          textTransform: "uppercase",
        }}>
          Ferrum · Sanguis · Gloria
        </div>
      </div>

      {/* PHOTO fade-in trigger */}
      <PhotoReveal phase={phase} setPhase={setPhase} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Cinzel+Decorative:wght@700&display=swap');
      `}</style>
    </div>
  );
}

// triggers photo fade-in after mount
function PhotoReveal({ phase, setPhase }) {
  useEffect(() => {
    const t = setTimeout(() => setPhase("hold"), 50);
    return () => clearTimeout(t);
  }, []);
  return null;
}
