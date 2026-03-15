import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";

const LIBRARY_CATEGORIES = ["All", "Squat", "Hinge", "Press", "Pull", "KB", "Accessories"];

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  let videoId = "";
  if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
  else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
  else if (url.includes("shorts/")) videoId = url.split("shorts/")[1]?.split("?")[0];
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
}

export function LibraryScreen({ authUser, isCoach }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "KB", youtube_url: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadExercises(); }, []);

  const loadExercises = async () => {
    setLoading(true);
    const { data } = await supabase.from("exercise_library").select("*").order("category").order("name");
    setExercises(data || []);
    setLoading(false);
  };

  const saveExercise = async () => {
    if (!form.name.trim() || !form.youtube_url.trim()) {
      alert("Name and YouTube URL are required!");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from("exercise_library").update(form).eq("id", editingId);
      } else {
        await supabase.from("exercise_library").insert(form);
      }
      setForm({ name: "", category: "KB", youtube_url: "", description: "" });
      setEditMode(false);
      setEditingId(null);
      await loadExercises();
    } catch(e) { console.log(e); }
    setSaving(false);
  };

  const deleteExercise = async (id) => {
    await supabase.from("exercise_library").delete().eq("id", id);
    setDeleteConfirm(null);
    setExpanded(null);
    await loadExercises();
  };

  const startEdit = (ex) => {
    setForm({ name: ex.name, category: ex.category, youtube_url: ex.youtube_url || "", description: ex.description || "" });
    setEditingId(ex.id);
    setEditMode(true);
    setExpanded(null);
  };

  const filtered = selectedCat === "All" ? exercises : exercises.filter(e => e.category === selectedCat);
  const catColor = { KB: "#4a9eff", Squat: "#f0a020", Hinge: "#c41e1e", Press: "#e8d5a0", Pull: "#a0e8d5", Accessories: "#888880" };

  if (loading) return (
    <div style={s.screen}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--gray)", fontSize: 13, letterSpacing: "0.1em" }}>LOADING...</div>
    </div>
  );

  return (
    <div style={s.screen}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={s.sectionLabel}>EXERCISE LIBRARY</div>
        {isCoach && !editMode && (
          <button onClick={() => { setEditMode(true); setEditingId(null); setForm({ name: "", category: "KB", youtube_url: "", description: "" }); }}
            style={{ ...s.btn, width: "auto", padding: "8px 16px", fontSize: 13 }}>
            + ADD
          </button>
        )}
      </div>

      {/* Coach add/edit form */}
      {isCoach && editMode && (
        <div style={{ ...s.card, marginBottom: 16, borderColor: "var(--red-dim)" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, marginBottom: 14, color: "var(--accent)" }}>
            {editingId ? "✏️ EDIT EXERCISE" : "➕ NEW EXERCISE"}
          </div>

          <label style={s.label}>NAME *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. KB Swing" style={{ ...s.input, marginBottom: 12 }} />

          <label style={s.label}>CATEGORY</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {LIBRARY_CATEGORIES.filter(c => c !== "All").map(cat => (
              <div key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  background: form.category === cat ? (catColor[cat] || "var(--red)") : "var(--bg3)",
                  color: form.category === cat ? "#000" : "var(--gray)",
                  border: `1px solid ${form.category === cat ? (catColor[cat] || "var(--red)") : "var(--border)"}`,
                  transition: "all 0.15s",
                }}>{cat}</div>
            ))}
          </div>

          <label style={s.label}>YOUTUBE LINK *</label>
          <input value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
            placeholder="https://youtube.com/watch?v=..." style={{ ...s.input, marginBottom: 12 }} />

          <label style={s.label}>DESCRIPTION / COACHING CUES (optional)</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Key coaching points..."
            rows={4}
            style={{ ...s.input, resize: "vertical", lineHeight: 1.6, minHeight: 90 }} />

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={saveExercise} disabled={saving || !form.name.trim() || !form.youtube_url.trim()}
              style={{ ...s.btn, flex: 1, opacity: (!form.name.trim() || !form.youtube_url.trim()) ? 0.5 : 1 }}>
              {saving ? "SAVING..." : editingId ? "UPDATE" : "SAVE EXERCISE"}
            </button>
            <button onClick={() => { setEditMode(false); setEditingId(null); }} style={{ ...s.btnGhost, flex: 1 }}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {LIBRARY_CATEGORIES.map(cat => (
          <div key={cat} onClick={() => setSelectedCat(cat)}
            style={{
              padding: "7px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              whiteSpace: "nowrap", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              background: selectedCat === cat ? (catColor[cat] || "var(--red)") : "var(--bg3)",
              color: selectedCat === cat ? (cat === "All" ? "var(--white)" : "#000") : "var(--gray)",
              border: `1px solid ${selectedCat === cat ? (catColor[cat] || "var(--red)") : "var(--border)"}`,
              letterSpacing: "0.05em",
            }}>
            {cat}
          </div>
        ))}
      </div>

      {/* Exercises list */}
      {filtered.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>
            {isCoach ? "NO EXERCISES YET" : "LIBRARY EMPTY"}
          </div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6 }}>
            {isCoach ? "Tap + ADD to create your first exercise" : "Your coach hasn't added exercises yet"}
          </div>
        </div>
      ) : (
        filtered.map((ex) => {
          const isOpen = expanded === ex.id;
          const embedUrl = getYouTubeEmbedUrl(ex.youtube_url);
          const col = catColor[ex.category] || "var(--red)";

          return (
            <div key={ex.id} style={{ ...s.card, marginBottom: 10, borderLeft: `3px solid ${col}`, cursor: "pointer" }}
              onClick={() => setExpanded(isOpen ? null : ex.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{
                      background: col, color: "#000", fontSize: 10,
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                      padding: "2px 8px", borderRadius: 4, letterSpacing: "0.08em"
                    }}>{ex.category.toUpperCase()}</div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700 }}>
                    {ex.name}
                  </div>
                  {!isOpen && ex.description && (
                    <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                      {ex.description.substring(0, 60)}...
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 18, color: "var(--gray2)", transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>›</div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 14, animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                  <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

                  {embedUrl && (
                    <div style={{ marginBottom: 14, borderRadius: 8, overflow: "hidden", position: "relative", paddingBottom: "56.25%", height: 0 }}>
                      <iframe
                        src={embedUrl}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 8 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={ex.name}
                      />
                    </div>
                  )}

                  {ex.description && (
                    <div style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.7, background: "var(--bg3)", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
                      {ex.description.split('\n').map((line, i) => (
                        <span key={i}>{line}{i < ex.description.split('\n').length - 1 && <br />}</span>
                      ))}
                    </div>
                  )}

                  {isCoach && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(ex)}
                        style={{ ...s.btnGhost, flex: 1, padding: "10px", fontSize: 13 }}>
                        ✏️ EDIT
                      </button>
                      {deleteConfirm === ex.id ? (
                        <div style={{ display: "flex", gap: 6, flex: 1 }}>
                          <button onClick={() => deleteExercise(ex.id)}
                            style={{ ...s.btn, flex: 1, padding: "10px", fontSize: 12, background: "var(--red)" }}>
                            CONFIRM DELETE
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            style={{ ...s.btnGhost, padding: "10px 12px", fontSize: 12 }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(ex.id)}
                          style={{ ...s.btnGhost, padding: "10px 14px", fontSize: 13, color: "var(--red-dim)" }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
