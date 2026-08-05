
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";

// ── TCX / GPX parser ──────────────────────────────────────────────────────────

function parseTCX(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  const activity = doc.querySelector("Activity");
  if (!activity) return null;

  const sport = activity.getAttribute("Sport") || "Other";
  const id = doc.querySelector("Activity > Id")?.textContent || new Date().toISOString();

  // Aggregate all laps
  const laps = [...doc.querySelectorAll("Lap")];
  let totalTime = 0, totalDist = 0, totalCal = 0;
  let hrValues = [];
  let maxHR = 0;

  laps.forEach(lap => {
    totalTime += parseFloat(lap.querySelector("TotalTimeSeconds")?.textContent || 0);
    totalDist += parseFloat(lap.querySelector("DistanceMeters")?.textContent || 0);
    totalCal += parseInt(lap.querySelector("Calories")?.textContent || 0);
    const lapMax = parseInt(lap.querySelector("MaximumHeartRateBpm > Value")?.textContent || 0);
    if (lapMax > maxHR) maxHR = lapMax;
  });

  // Collect all trackpoint HR for average + chart
  const trackpoints = [...doc.querySelectorAll("Trackpoint")];
  trackpoints.forEach(tp => {
    const hr = parseInt(tp.querySelector("HeartRateBpm > Value")?.textContent || 0);
    if (hr > 0) hrValues.push(hr);
  });

  const avgHR = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : 0;
  if (!maxHR && hrValues.length) maxHR = Math.max(...hrValues);

  // Downsample HR for chart (max 40 points)
  const step = Math.max(1, Math.floor(hrValues.length / 40));
  const hrChart = hrValues.filter((_, i) => i % step === 0);

  return {
    source: "Garmin",
    sport,
    date: id,
    durationSec: Math.round(totalTime),
    distanceM: Math.round(totalDist),
    calories: totalCal,
    avgHR,
    maxHR,
    hrChart,
    pointCount: hrValues.length,
  };
}

function parseGPX(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const trk = doc.querySelector("trk");
  if (!trk) return null;

  const name = trk.querySelector("n, name")?.textContent || "Activity";
  const type = trk.querySelector("type")?.textContent || "Other";
  const time = doc.querySelector("metadata > time")?.textContent || new Date().toISOString();
  const points = [...doc.querySelectorAll("trkpt")];

  // GPX indoor often has no data — flag it
  return {
    source: "Garmin",
    sport: type,
    date: time,
    durationSec: 0,
    distanceM: 0,
    calories: 0,
    avgHR: 0,
    maxHR: 0,
    hrChart: [],
    pointCount: points.length,
    isEmpty: points.length === 0,
  };
}

const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const sportLabel = (sport) => {
  const map = {
    "Running": "🏃 Running", "Biking": "🚴 Cycling", "Other": "💪 Cardio",
    "indoor_cardio": "💪 Indoor Cardio", "running": "🏃 Running",
    "lap_swimming": "🏊 Swimming", "strength_training": "🏋️ Strength",
  };
  return map[sport] || `⚡ ${sport}`;
};

// ── GarminImport component ────────────────────────────────────────────────────

export function GarminImport({ authUser, onImported }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setError(""); setSaved(false); setParsed(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      let result;
      if (file.name.toLowerCase().endsWith(".tcx")) {
        result = parseTCX(text);
      } else if (file.name.toLowerCase().endsWith(".gpx")) {
        result = parseGPX(text);
      } else {
        setError("Please upload a .TCX or .GPX file from Garmin Connect.");
        return;
      }

      if (!result) {
        setError("Couldn't read this file — is it a valid Garmin export?");
        return;
      }
      if (result.isEmpty || (result.durationSec === 0 && result.pointCount === 0)) {
        setError("This file has no workout data. For indoor activities, export as TCX instead of GPX.");
        return;
      }

      setParsed(result);
      setCustomTitle(sportLabel(result.sport).replace(/^[^\s]+\s/, ""));
    } catch (e) {
      setError("Error reading file: " + e.message);
    }
  };

  const saveSession = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const targetId = authUser?.id || au?.id;

      // Build a readable result string
      const parts = [];
      if (parsed.durationSec) parts.push(`Duration: ${fmtDuration(parsed.durationSec)}`);
      if (parsed.distanceM) parts.push(`Distance: ${(parsed.distanceM / 1000).toFixed(2)}km`);
      if (parsed.avgHR) parts.push(`Avg HR: ${parsed.avgHR}bpm`);
      if (parsed.maxHR) parts.push(`Max HR: ${parsed.maxHR}bpm`);
      if (parsed.calories) parts.push(`Calories: ${parsed.calories}`);

      const exercise = {
        name: customTitle || sportLabel(parsed.sport),
        result: parts.join(" · "),
        done: true,
        garmin: {
          durationSec: parsed.durationSec,
          distanceM: parsed.distanceM,
          avgHR: parsed.avgHR,
          maxHR: parsed.maxHR,
          calories: parsed.calories,
          hrChart: parsed.hrChart,
        },
      };

      await supabase.from("workouts").insert({
        user_id: targetId,
        week: 0,
        day: "G",
        workout_title: customTitle || sportLabel(parsed.sport),
        exercises: [exercise],
        comment: `Imported from Garmin · ${new Date(parsed.date).toLocaleDateString("en-GB")}`,
        created_at: parsed.date,
      });

      setSaved(true);
      setTimeout(() => {
        setParsed(null);
        setFileName("");
        setSaved(false);
        if (onImported) onImported();
      }, 1500);
    } catch (e) {
      setError("Save failed: " + e.message);
    }
    setSaving(false);
  };

  const maxChartHR = parsed?.hrChart?.length ? Math.max(...parsed.hrChart) : 0;
  const minChartHR = parsed?.hrChart?.length ? Math.min(...parsed.hrChart) : 0;

  return (
    <div>
      <div style={{ ...s.card, borderColor: "var(--gold-dim)", background: "rgba(201,168,76,0.03)", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
          ⌚ IMPORT FROM GARMIN
        </div>
        <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.6, marginBottom: 12 }}>
          In Garmin Connect → open activity → menu (···) → <strong style={{ color: "var(--text)" }}>Export to TCX</strong>. Then upload the file here.
        </div>

        <label style={{ ...s.card, borderStyle: "dashed", borderColor: "var(--border)", textAlign: "center", padding: "24px 16px", cursor: "pointer", display: "block", marginBottom: 0 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⌚</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, marginBottom: 4 }}>
            {fileName || "TAP TO UPLOAD TCX / GPX"}
          </div>
          <div style={{ fontSize: 11, color: "var(--gray2)" }}>Garmin Connect export file</div>
          <input type="file" accept=".tcx,.gpx" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </label>
      </div>

      {error && (
        <div style={{ ...s.card, borderColor: "var(--red-dim)", background: "rgba(196,30,30,0.06)", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "var(--red)", lineHeight: 1.5 }}>⚠ {error}</div>
        </div>
      )}

      {parsed && !saved && (
        <div style={{ ...s.card, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 14 }}>PREVIEW</div>

          <label style={s.label}>SESSION TITLE</label>
          <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
            placeholder="e.g. Morning Cardio, Zone 2 Run..."
            style={{ ...s.input, marginBottom: 16 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              parsed.durationSec ? ["DURATION", fmtDuration(parsed.durationSec)] : null,
              parsed.distanceM ? ["DISTANCE", `${(parsed.distanceM / 1000).toFixed(2)}km`] : null,
              parsed.calories ? ["CALORIES", parsed.calories] : null,
              parsed.avgHR ? ["AVG HR", `${parsed.avgHR}`] : null,
              parsed.maxHR ? ["MAX HR", `${parsed.maxHR}`] : null,
            ].filter(Boolean).map(([label, val]) => (
              <div key={label} style={{ background: "var(--bg3)", borderRadius: 6, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--accent)" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* HR chart */}
          {parsed.hrChart.length > 2 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 8 }}>HEART RATE</div>
              <svg width="100%" height="80" style={{ display: "block" }}>
                <polyline
                  fill="none"
                  stroke="var(--red)"
                  strokeWidth="2"
                  points={parsed.hrChart.map((hr, i) => {
                    const x = (i / (parsed.hrChart.length - 1)) * 100;
                    const range = maxChartHR - minChartHR || 1;
                    const y = 75 - ((hr - minChartHR) / range) * 70;
                    return `${x},${y}`;
                  }).join(" ")}
                  vectorEffect="non-scaling-stroke"
                  style={{ transform: "scaleX(1)", transformOrigin: "left" }}
                />
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--gray2)", marginTop: 2 }}>
                <span>{minChartHR} bpm</span>
                <span>{maxChartHR} bpm</span>
              </div>
            </div>
          )}

          <button onClick={saveSession} disabled={saving}
            style={{ ...s.btn, opacity: saving ? 0.6 : 1 }}>
            {saving ? "SAVING..." : "💾 SAVE TO HISTORY →"}
          </button>
        </div>
      )}

      {saved && (
        <div style={{ ...s.card, textAlign: "center", padding: 24, borderColor: "var(--red)" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>SESSION IMPORTED!</div>
        </div>
      )}
    </div>
  );
}
