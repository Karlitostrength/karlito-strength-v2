import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";

const STORAGE_KEY = "ks_nutrition_";
const todayKey = () => new Date().toISOString().slice(0, 10);

const MACRO_PRESETS = {
  fat_loss:    { label: "Fat Loss",    protein: 2.2, carbs: 2.0, fat: 0.8 },
  maintenance: { label: "Maintenance", protein: 1.8, carbs: 3.0, fat: 1.0 },
  muscle:      { label: "Muscle Gain", protein: 2.0, carbs: 4.0, fat: 1.0 },
};

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"];

export function NutritionScreen({ authUser, user }) {
  const [tab, setTab] = useState("journal"); // journal | macros
  const [date, setDate] = useState(todayKey());
  const [meals, setMeals] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMeal, setNewMeal] = useState({ type: "Breakfast", name: "", protein: "", carbs: "", fat: "", calories: "", notes: "" });
  const [bodyweight, setBodyweight] = useState(user?.bodyweight || 80);
  const [goal, setGoal] = useState("fat_loss");

  // Load meals for selected date
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY + date);
      setMeals(raw ? JSON.parse(raw) : []);
    } catch { setMeals([]); }
  }, [date]);

  const saveMeals = (updated) => {
    setMeals(updated);
    try { localStorage.setItem(STORAGE_KEY + date, JSON.stringify(updated)); } catch {}
  };

  const addMeal = () => {
    if (!newMeal.name.trim()) return;
    const meal = {
      ...newMeal,
      id: Date.now(),
      protein: parseFloat(newMeal.protein) || 0,
      carbs: parseFloat(newMeal.carbs) || 0,
      fat: parseFloat(newMeal.fat) || 0,
      calories: parseFloat(newMeal.calories) || Math.round((parseFloat(newMeal.protein)||0)*4 + (parseFloat(newMeal.carbs)||0)*4 + (parseFloat(newMeal.fat)||0)*9),
    };
    saveMeals([...meals, meal]);
    setNewMeal({ type: "Breakfast", name: "", protein: "", carbs: "", fat: "", calories: "", notes: "" });
    setShowAdd(false);
  };

  const deleteMeal = (id) => saveMeals(meals.filter(m => m.id !== id));

  const totals = meals.reduce((acc, m) => ({
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
    calories: acc.calories + (m.calories || 0),
  }), { protein: 0, carbs: 0, fat: 0, calories: 0 });

  const preset = MACRO_PRESETS[goal];
  const targets = {
    protein: Math.round(bodyweight * preset.protein),
    carbs: Math.round(bodyweight * preset.carbs),
    fat: Math.round(bodyweight * preset.fat),
    calories: Math.round(bodyweight * preset.protein * 4 + bodyweight * preset.carbs * 4 + bodyweight * preset.fat * 9),
  };

  const pct = (val, target) => Math.min(100, Math.round((val / target) * 100));
  const macroColor = (val, target) => val > target * 1.1 ? "var(--red)" : val > target * 0.8 ? "var(--gold)" : "var(--gray2)";

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0,10)); };
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0,10)); };
  const isToday = date === todayKey();

  const fmtDate = (iso) => {
    if (iso === todayKey()) return "Today";
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (iso === yesterday.toISOString().slice(0,10)) return "Yesterday";
    return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div style={s.screen}>
      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["journal", "📋 JOURNAL"], ["macros", "🧮 MACROS"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, ...s.btnGhost, fontSize: 12, padding: "10px",
            borderColor: tab === t ? "var(--accent)" : "var(--border)",
            color: tab === t ? "var(--accent)" : "var(--gray)",
            background: tab === t ? "rgba(232,213,160,0.08)" : "transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* ── JOURNAL TAB ── */}
      {tab === "journal" && (
        <>
          {/* Date navigator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div onClick={prevDay} style={{ padding: "8px 14px", cursor: "pointer", color: "var(--gray)", fontSize: 18 }}>‹</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.05em" }}>
              {fmtDate(date)}
            </div>
            <div onClick={nextDay} style={{ padding: "8px 14px", cursor: isToday ? "default" : "pointer", color: isToday ? "var(--bg3)" : "var(--gray)", fontSize: 18 }}>›</div>
          </div>

          {/* Daily totals */}
          <div style={{ ...s.card, marginBottom: 16, borderColor: totals.calories > 0 ? "var(--border2)" : "var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif" }}>DAILY TOTALS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                ["KCAL", Math.round(totals.calories), targets.calories, "var(--red)"],
                ["PROTEIN", `${Math.round(totals.protein)}g`, targets.protein + "g", "#4a9eff"],
                ["CARBS", `${Math.round(totals.carbs)}g`, targets.carbs + "g", "#f0a020"],
                ["FAT", `${Math.round(totals.fat)}g`, targets.fat + "g", "var(--gold)"],
              ].map(([label, val, target, color]) => (
                <div key={label} style={{ background: "var(--bg3)", borderRadius: 6, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "var(--gray2)", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 8, color: "var(--gray2)", marginTop: 3 }}>/ {target}</div>
                </div>
              ))}
            </div>
            {/* Progress bars */}
            {[
              ["Protein", totals.protein, targets.protein, "#4a9eff"],
              ["Carbs", totals.carbs, targets.carbs, "#f0a020"],
              ["Fat", totals.fat, targets.fat, "var(--gold)"],
            ].map(([label, val, target, color]) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "var(--gray)" }}>{label}</span>
                  <span style={{ fontSize: 10, color: macroColor(val, target) }}>{Math.round(val)}g / {target}g</span>
                </div>
                <div style={{ height: 4, background: "var(--bg4)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct(val, target)}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Meals list */}
          {MEAL_TYPES.map(type => {
            const typeMeals = meals.filter(m => m.type === type);
            if (typeMeals.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--gray)", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {type.toUpperCase()}
                </div>
                {typeMeals.map(meal => (
                  <div key={meal.id} style={{ ...s.card, padding: "12px 14px", marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{meal.name}</div>
                        <div style={{ display: "flex", gap: 10 }}>
                          {[["P", meal.protein, "#4a9eff"], ["C", meal.carbs, "#f0a020"], ["F", meal.fat, "var(--gold)"]].map(([l, v, c]) => (
                            <span key={l} style={{ fontSize: 11, color: "var(--gray2)" }}>
                              <span style={{ color: c, fontWeight: 700 }}>{l}</span> {Math.round(v)}g
                            </span>
                          ))}
                          {meal.calories > 0 && <span style={{ fontSize: 11, color: "var(--gray2)" }}>· {Math.round(meal.calories)} kcal</span>}
                        </div>
                        {meal.notes && <div style={{ fontSize: 11, color: "var(--gray2)", marginTop: 4, fontStyle: "italic" }}>{meal.notes}</div>}
                      </div>
                      <div onClick={() => deleteMeal(meal.id)} style={{ color: "var(--gray2)", cursor: "pointer", padding: "0 4px", fontSize: 16 }}>✕</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {meals.length === 0 && !showAdd && (
            <div style={{ ...s.card, textAlign: "center", padding: 32, marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🥗</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No meals logged yet</div>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>Tap below to add your first meal</div>
            </div>
          )}

          {/* Add meal form */}
          {showAdd && (
            <div style={{ ...s.card, borderColor: "var(--border2)", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif" }}>ADD MEAL</div>

              <label style={s.label}>MEAL TYPE</label>
              <select value={newMeal.type} onChange={e => setNewMeal(p => ({ ...p, type: e.target.value }))} style={{ ...s.input, marginBottom: 10 }}>
                {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={s.label}>FOOD / MEAL NAME</label>
              <input value={newMeal.name} onChange={e => setNewMeal(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Chicken + rice, Protein shake..." style={{ ...s.input, marginBottom: 10 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[["Protein (g)", "protein", "#4a9eff"], ["Carbs (g)", "carbs", "#f0a020"], ["Fat (g)", "fat", "var(--gold)"], ["Kcal", "calories", "var(--red)"]].map(([label, key, color]) => (
                  <div key={key}>
                    <div style={{ fontSize: 9, color, marginBottom: 4, letterSpacing: "0.1em", fontWeight: 700 }}>{label}</div>
                    <input type="number" min="0" value={newMeal[key]}
                      onChange={e => setNewMeal(p => ({ ...p, [key]: e.target.value }))}
                      style={{ ...s.input, textAlign: "center", padding: "8px 4px" }} />
                  </div>
                ))}
              </div>

              <label style={s.label}>NOTES (optional)</label>
              <input value={newMeal.notes} onChange={e => setNewMeal(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. post-workout, before bed..." style={{ ...s.input, marginBottom: 12 }} />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addMeal} style={{ ...s.btn, flex: 2 }}>ADD MEAL</button>
                <button onClick={() => setShowAdd(false)} style={{ ...s.btnGhost, flex: 1 }}>CANCEL</button>
              </div>
            </div>
          )}

          {!showAdd && (
            <button onClick={() => setShowAdd(true)} style={{ ...s.btn, marginBottom: 8 }}>+ LOG MEAL</button>
          )}
        </>
      )}

      {/* ── MACROS TAB ── */}
      {tab === "macros" && (
        <>
          <div style={{ ...s.card, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 14, fontFamily: "'Barlow Condensed', sans-serif" }}>MACRO CALCULATOR</div>

            <label style={s.label}>BODYWEIGHT (kg)</label>
            <input type="number" value={bodyweight} onChange={e => setBodyweight(+e.target.value)}
              style={{ ...s.input, marginBottom: 16 }} />

            <label style={s.label}>GOAL</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {Object.entries(MACRO_PRESETS).map(([key, p]) => (
                <div key={key} onClick={() => setGoal(key)} style={{
                  flex: 1, textAlign: "center", padding: "12px 6px",
                  border: `1px solid ${goal === key ? "var(--accent)" : "var(--border)"}`,
                  background: goal === key ? "rgba(232,213,160,0.08)" : "var(--bg3)",
                  borderRadius: 6, cursor: "pointer",
                }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: goal === key ? "var(--accent)" : "var(--gray)", letterSpacing: "0.08em" }}>{p.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "var(--gray2)", marginBottom: 12 }}>DAILY TARGETS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                ["CALORIES", `${targets.calories} kcal`, "var(--red)"],
                ["PROTEIN", `${targets.protein}g`, "#4a9eff"],
                ["CARBS", `${targets.carbs}g`, "#f0a020"],
                ["FAT", `${targets.fat}g`, "var(--gold)"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: "var(--bg3)", borderRadius: 8, padding: "14px 16px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 9, color: "var(--gray2)", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--bg3)", borderRadius: 6, padding: "12px 14px", borderLeft: "2px solid var(--accent)", fontSize: 12, color: "var(--gray)", lineHeight: 1.7 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 6 }}>HOW IT WORKS</div>
              Based on your bodyweight and goal, targets are calculated using standard evidence-based multipliers.
              Protein is always prioritised — it protects muscle during fat loss and drives growth during muscle gain.
              These are starting points — adjust based on progress every 2-4 weeks.
            </div>
          </div>

          <div style={{ ...s.card, borderColor: "var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--gray2)", letterSpacing: "0.15em", marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif" }}>PROTEIN SOURCES — QUICK REFERENCE</div>
            {[
              ["Chicken breast (100g)", "31g", "165 kcal"],
              ["Eggs (1 large)", "6g", "70 kcal"],
              ["Greek yogurt (200g)", "20g", "130 kcal"],
              ["Protein shake (1 scoop)", "25g", "120 kcal"],
              ["Salmon (100g)", "25g", "208 kcal"],
              ["Cottage cheese (100g)", "11g", "98 kcal"],
              ["Beef mince 5% (100g)", "26g", "137 kcal"],
            ].map(([food, protein, kcal]) => (
              <div key={food} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13 }}>{food}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: "#4a9eff" }}>{protein}</span>
                  <span style={{ fontSize: 11, color: "var(--gray2)" }}>{kcal}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
