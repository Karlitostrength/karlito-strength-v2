import { useState } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";
import FitParser from "fit-file-parser";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const ss = Math.round(sec % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
};

const sportLabel = (sport) => {
  const map = {
    "running": "🏃 Running", "biking": "🚴 Cycling", "cycling": "🚴 Cycling",
    "strength_training": "🏋️ Strength", "indoor_cardio": "💪 Cardio",
    "cardio_training": "💪 Cardio", "lap_swimming": "🏊 Swimming",
    "Running": "🏃 Running", "Other": "💪 Cardio", "training": "🏋️ Strength",
  };
  return map[sport] || `⚡ ${sport || "Workout"}`;
};

// ── FIT parser (strength with sets) ───────────────────────────────────────────

function parseFIT(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: "km/h",
      lengthUnit: "km",
      temperatureUnit: "celsius",
      elapsedRecordField: true,
      mode: "list",
    });

    fitParser.parse(arrayBuffer, (error, data) => {
      if (error) { reject(new Error(error)); return; }

      // Session summary
      const session = (data.sessions && data.sessions[0]) || {};
      const activity = data.activity || {};

      // Sets (strength)
      const rawSets = data.sets || [];
      const activeSets = rawSets
        .filter(st => st.set_type === "active" || st.set_type === 1)
        .map((st, i) => ({
          idx: i + 1,
          reps: st.repetitions || 0,
          weight: st.weight || 0,
          durationSec: Math.round(st.duration || 0),
        }));

      // HR from records
      const records = data.records || [];
      const hrValues = records.map(r => r.heart_rate).filter(h => h > 0);
      const avgHR = session.avg_heart_rate || (hrValues.length ? Math.round(hrValues.reduce((a,b)=>a+b,0)/hrValues.length) : 0);
      const maxHR = session.max_heart_rate || (hrValues.length ? Math.max(...hrValues) : 0);

      const step = Math.max(1, Math.floor(hrValues.length / 40));
      const hrChart = hrValues.filter((_, i) => i % step === 0);

      const sport = session.sub_sport || session.sport || "strength_training";

      resolve({
        source: "Garmin",
        format: "FIT",
        sport,
        date: (session.start_time || activity.timestamp || new Date()).toString(),
        durationSec: Math.round(session.total_timer_time || session.total_elapsed_time || 0),
        distanceM: Math.round((session.total_distance || 0) * 1000),
        calories: session.total_calories || 0,
        avgHR, maxHR, hrChart,
        sets: activeSets,
        isStrength: activeSets.length > 0,
      });
    });
  });
}

// ── TCX parser (cardio) ───────────────────────────────────────────────────────

function parseTCX(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const activity = doc.querySelector("Activity");
  if (!activity) return null;

  const sport = activity.getAttribute("Sport") || "Other";
  const id = doc.querySelector("Activity > Id")?.textContent || new Date().toISOString();
  const laps = [...doc.querySelectorAll("Lap")];
  let totalTime = 0, totalDist = 0, totalCal = 0, maxHR = 0;

  laps.forEach(lap => {
    totalTime += parseFloat(lap.querySelector("TotalTimeSeconds")?.textContent || 0);
    totalDist += parseFloat(lap.querySelector("DistanceMeters")?.textContent || 0);
    totalCal += parseInt(lap.querySelector("Calories")?.textContent || 0);
    const lapMax = parseInt(lap.querySelector("MaximumHeartRateBpm > Value")?.textContent || 0);
    if (lapMax > maxHR) maxHR = lapMax;
  });

  const hrValues = [...doc.querySelectorAll("Trackpoint")]
    .map(tp => parseInt(tp.querySelector("HeartRateBpm > Value")?.textContent || 0))
    .filter(hr => hr > 0);

  const avgHR = hrValues.length ? Math.round(hrValues.reduce((a,b)=>a+b,0)/hrValues.length) : 0;
  if (!maxHR && hrValues.length) maxHR = Math.max(...hrValues);

  const step = Math.max(1, Math.floor(hrValues.length / 40));
  const hrChart = hrValues.filter((_, i) => i % step === 0);

  return {
    source: "Garmin", format: "TCX", sport, date: id,
    durationSec: Math.round(totalTime), distanceM: Math.round(totalDist),
    calories: totalCal, avgHR, maxHR, hrChart,
    sets: [], isStrength: false,
    pointCount: hrValues.length,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GarminImport({ authUser, onImported }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [setNames, setSetNames] = useState([]);

  const handleFile = async (file) => {
    if (!file) return;
    setError(""); setSaved(false); setParsed(null);
    setFileName(file.name);
    const name = file.name.toLowerCase();

    try {
      let result;
      if (name.endsWith(".fit")) {
        const buf = await file.arrayBuffer();
        result = await parseFIT(buf);
      } else if (name.endsWith(".tcx")) {
        result = parseTCX(await file.text());
      } else if (name.endsWith(".gpx")) {
        setError("GPX has no workout data. Use 'Export Original' (.FIT) for strength, or 'Export to TCX' for cardio.");
        return;
      } else {
        setError("Upload a .FIT (strength) or .TCX (cardio) file from Garmin.");
        return;
      }

      if (!result || (result.durationSec === 0 && result.sets.length === 0)) {
        setError("No workout data found in this file.");
        return;
      }

      setParsed(result);
      setCustomTitle(sportLabel(result.sport).replace(/^[^\s]+\s/, ""));
      // Pre-fill set names as empty (user names them)
      setSetNames(result.sets.map(() => ""));
    } catch (e) {
      setError("Error reading file: " + (e.message || e));
    }
  };

  const saveSession = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const targetId = authUser?.id || au?.id;

      let exercises;
      if (parsed.isStrength && parsed.sets.length > 0) {
        // Each set becomes an exercise line
        exercises = parsed.sets.map((st, i) => ({
          name: setNames[i]?.trim() || `Set ${st.idx}`,
          result: [
            `${st.reps} reps`,
            st.weight ? `@ ${st.weight}kg` : "",
            `· ${fmtDuration(st.durationSec)}`,
          ].filter(Boolean).join(" "),
          done: true,
        }));
        // Add summary line
        exercises.push({
          name: "📊 Session totals",
          result: [
            `Duration: ${fmtDuration(parsed.durationSec)}`,
            parsed.calories ? `${parsed.calories} kcal` : "",
            parsed.avgHR ? `Avg HR ${parsed.avgHR}` : "",
            parsed.maxHR ? `Max HR ${parsed.maxHR}` : "",
          ].filter(Boolean).join(" · "),
          done: true,
        });
      } else {
        // Cardio — single summary entry
        const parts = [];
        if (parsed.durationSec) parts.push(`Duration: ${fmtDuration(parsed.durationSec)}`);
        if (parsed.distanceM) parts.push(`Distance: ${(parsed.distanceM/1000).toFixed(2)}km`);
        if (parsed.avgHR) parts.push(`Avg HR: ${parsed.avgHR}`);
        if (parsed.maxHR) parts.push(`Max HR: ${parsed.maxHR}`);
        if (parsed.calories) parts.push(`${parsed.calories} kcal`);
        exercises = [{ name: customTitle || sportLabel(parsed.sport), result: parts.join(" · "), done: true }];
      }

      await supabase.from("workouts").insert({
        user_id: targetId,
        week: 0,
        day: "G",
        workout_title: customTitle || sportLabel(parsed.sport),
        exercises,
        comment: `⌚ Imported from Garmin · ${new Date(parsed.date).toLocaleDateString("en-GB")}`,
        created_at: parsed.date,
      });

      setSaved(true);
      setTimeout(() => {
        setParsed(null); setFileName(""); setSaved(false);
        if (onImported) onImported();
      }, 1500);
    } catch (e) {
      setError("Save failed: " + (e.message || e));
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
          Garmin Connect → open activity → menu (···) →<br/>
          <strong style={{ color: "var(--text)" }}>Export Original</strong> for strength (sets & reps)<br/>
          <strong style={{ color: "var(--text)" }}>Export to TCX</strong> for cardio (HR & calories)
        </div>

        <label style={{ ...s.card, borderStyle: "dashed", borderColor: "var(--border)", textAlign: "center", padding: "24px 16px", cursor: "pointer", display: "block", marginBottom: 0 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⌚</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, marginBottom: 4 }}>
            {fileName || "TAP TO UPLOAD FIT / TCX"}
          </div>
          <div style={{ fontSize: 11, color: "var(--gray2)" }}>Garmin Connect export file</div>
          <input type="file" accept=".fit,.tcx,.gpx" style={{ display: "none" }}
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
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 14 }}>
            PREVIEW · {parsed.format} {parsed.isStrength ? "· STRENGTH" : "· CARDIO"}
          </div>

          <label style={s.label}>SESSION TITLE</label>
          <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
            placeholder="e.g. Leg Day, Morning Cardio..."
            style={{ ...s.input, marginBottom: 16 }} />

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              parsed.durationSec ? ["DURATION", fmtDuration(parsed.durationSec)] : null,
              parsed.distanceM ? ["DISTANCE", `${(parsed.distanceM/1000).toFixed(2)}km`] : null,
              parsed.calories ? ["CALORIES", parsed.calories] : null,
              parsed.avgHR ? ["AVG HR", parsed.avgHR] : null,
              parsed.maxHR ? ["MAX HR", parsed.maxHR] : null,
            ].filter(Boolean).map(([label, val]) => (
              <div key={label} style={{ background: "var(--bg3)", borderRadius: 6, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--accent)" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Strength sets — editable names */}
          {parsed.isStrength && parsed.sets.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 10 }}>
                SETS — name each exercise (Garmin doesn't save names)
              </div>
              {parsed.sets.map((st, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, background: "var(--bg3)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, color: "var(--red)", opacity: 0.5, minWidth: 24 }}>{st.idx}</div>
                  <input value={setNames[i]} onChange={e => { const a=[...setNames]; a[i]=e.target.value; setSetNames(a); }}
                    placeholder="Exercise name..."
                    style={{ ...s.input, flex: 1, marginBottom: 0, padding: "8px 10px", fontSize: 13 }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", color: "var(--accent)" }}>
                    {st.reps}× {st.weight ? `${st.weight}kg` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HR chart */}
          {parsed.hrChart.length > 2 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 8 }}>HEART RATE</div>
              <svg width="100%" height="70" viewBox="0 0 100 70" preserveAspectRatio="none" style={{ display: "block" }}>
                <polyline fill="none" stroke="var(--red)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                  points={parsed.hrChart.map((hr, i) => {
                    const x = (i / (parsed.hrChart.length - 1)) * 100;
                    const range = maxChartHR - minChartHR || 1;
                    const y = 65 - ((hr - minChartHR) / range) * 60;
                    return `${x},${y}`;
                  }).join(" ")} />
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--gray2)", marginTop: 2 }}>
                <span>{minChartHR} bpm</span><span>{maxChartHR} bpm</span>
              </div>
            </div>
          )}

          <button onClick={saveSession} disabled={saving} style={{ ...s.btn, opacity: saving ? 0.6 : 1 }}>
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
