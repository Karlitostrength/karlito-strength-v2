import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { s } from "../lib/styles";
export function ChatScreen({ authUser, isCoach }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [photoMode, setPhotoMode] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const uploadPhotoToStorage = async (file) => {
    setUploading(true);
    setUploadError("");
    try {
      const ext = file.name.split('.').pop();
      const fileName = `chat/${authUser.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('chat-photos')
        .upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from('chat-photos')
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      if (!publicUrl || !selectedContact) throw new Error("Upload failed");
      await supabase.from("messages").insert({
        from_id: authUser.id,
        to_id: selectedContact,
        content: `[MEAL] ${publicUrl}`,
      });
      const senderName = isCoach ? "Coach Karlito" : "Athlete";
      sendPushToUser(selectedContact, `📸 New photo from ${senderName}`, "Tap to view the photo", "chat", "/");
      setPhotoMode(false);
    } catch (e) {
      setUploadError(e.message || "Upload failed. Check Supabase Storage bucket 'chat-photos' is public.");
    }
    setUploading(false);
  };

  // Load contacts (for coach: all athletes, for athlete: coach)
  useEffect(() => {
    const loadContacts = async () => {
      if (isCoach) {
        // Get athletes by coach_id
        const { data: byCoachId } = await supabase
          .from("profiles").select("id, name").eq("coach_id", authUser.id);
        // Get athletes from program_days (in case coach_id not set)
        const { data: byProgram } = await supabase
          .from("program_days").select("athlete_id").eq("coach_id", authUser.id);
        // Get athletes from messages
        const { data: byMessages } = await supabase
          .from("messages").select("from_id, to_id")
          .or(`from_id.eq.${authUser.id},to_id.eq.${authUser.id}`);

        // Collect unique athlete IDs
        const ids = new Set((byCoachId || []).map(p => p.id));
        (byProgram || []).forEach(d => ids.add(d.athlete_id));
        (byMessages || []).forEach(m => {
          if (m.from_id !== authUser.id) ids.add(m.from_id);
          if (m.to_id !== authUser.id) ids.add(m.to_id);
        });
        ids.delete(authUser.id);

        // Load profiles for all IDs
        let contacts = byCoachId || [];
        const existingIds = new Set((contacts || []).map(c => c.id));
        const missing = [...ids].filter(id => !existingIds.has(id));
        if (missing.length > 0) {
          const { data: extra } = await supabase
            .from("profiles").select("id, name").in("id", missing);
          contacts = [...contacts, ...(extra || [])];
        }
        // Sort by name
        contacts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setContacts(contacts);
        if (contacts.length > 0) setSelectedContact(contacts[0].id);
      } else {
        // Try profiles.coach_id first
        let coachId = null;
        try {
          const { data } = await supabase.from("profiles")
            .select("coach_id").eq("id", authUser.id).single();
          coachId = data?.coach_id;
        } catch(e) {}

        // Fallback: find coach from program_days assigned to this athlete
        if (!coachId) {
          try {
            const { data } = await supabase.from("program_days")
              .select("coach_id").eq("athlete_id", authUser.id).limit(1).single();
            coachId = data?.coach_id;
          } catch(e) {}
        }

        // Fallback: find coach from messages sent to this athlete
        if (!coachId) {
          try {
            const { data } = await supabase.from("messages")
              .select("from_id").eq("to_id", authUser.id).limit(1).single();
            if (data?.from_id && data.from_id !== authUser.id) coachId = data.from_id;
          } catch(e) {}
        }

        if (coachId) {
          // Try to get coach name
          let coachName = "Coach Karlito";
          try {
            const { data: cp } = await supabase.from("profiles")
              .select("name").eq("id", coachId).single();
            if (cp?.name) coachName = cp.name;
          } catch(e) {}
          setSelectedContact(coachId);
          setContacts([{ id: coachId, name: coachName }]);
        }
      }
      setLoading(false);
    };
    loadContacts();
  }, [authUser, isCoach]);

  // Load messages
  useEffect(() => {
    if (!selectedContact) return;
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(from_id.eq.${authUser.id},to_id.eq.${selectedContact}),and(from_id.eq.${selectedContact},to_id.eq.${authUser.id})`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    
    loadMessages();

    // Real-time subscription — unique channel per conversation
    const channelName = `messages:${[authUser.id, selectedContact].sort().join(":")}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "messages" 
      }, (payload) => {
        const msg = payload.new;
        if ((msg.from_id === authUser.id && msg.to_id === selectedContact) ||
            (msg.from_id === selectedContact && msg.to_id === authUser.id)) {
          // Replace temp message or add new one
          setMessages(prev => {
            const hasDup = prev.some(m => m.id === msg.id);
            if (hasDup) return prev;
            // Remove optimistic temp if it matches content
            const filtered = prev.filter(m => 
              !(String(m.id).startsWith("temp-") && m.content === msg.content && m.from_id === msg.from_id)
            );
            return [...filtered, msg];
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedContact, authUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedContact) return;
    const content = newMsg.trim();
    setNewMsg("");

    // Optimistic update — show immediately without waiting for realtime
    const tempMsg = {
      id: `temp-${Date.now()}`,
      from_id: authUser.id,
      to_id: selectedContact,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    await supabase.from("messages").insert({
      from_id: authUser.id,
      to_id: selectedContact,
      content,
    });

    // Push notification to recipient
    const senderName = isCoach ? "Coach Karlito" : "Athlete";
    sendPushToUser(selectedContact, `💬 New message from ${senderName}`, content, "chat", "/");
  };

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { 
    day: "numeric", 
    month: "short" 
  });

  if (loading) {
    return (
      <div style={s.screen}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div style={s.screen}>
        <div style={s.sectionLabel}>MESSAGES</div>
        <div style={{ ...s.card, textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900 }}>
            {isCoach ? "NO ATHLETES YET" : "NO COACH ASSIGNED"}
          </div>
          <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6 }}>
            {isCoach ? "Invite athletes to start chatting" : "Contact us to get a personal coach"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <div style={s.sectionLabel}>MESSAGES</div>

      {/* Contact selector for coach */}
      {isCoach && contacts.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {(contacts || []).map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedContact(c.id)}
              style={{ 
                ...s.pill(selectedContact === c.id), 
                padding: "8px 14px",
                whiteSpace: "nowrap"
              }}
            >
              {c.name || c.id.slice(0, 8)}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ 
        ...s.card, 
        height: "50vh", 
        overflowY: "auto", 
        display: "flex", 
        flexDirection: "column",
        padding: 12
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}>
            No messages yet. Say hi! 👋
          </div>
        ) : (
          (messages || []).map((msg, i) => {
            const isMe = msg.from_id === authUser.id;
            const showDate = i === 0 || fmtDate(messages[i-1].created_at) !== fmtDate(msg.created_at);
            
            return (
              <div key={msg.id}>
                {showDate && (
                  <div style={{ textAlign: "center", fontSize: 11, color: "var(--gray2)", margin: "12px 0" }}>
                    {fmtDate(msg.created_at)}
                  </div>
                )}
                <div style={{ 
                  display: "flex", 
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  marginBottom: 8
                }}>
                  <div style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: isMe ? "var(--red)" : "var(--bg3)",
                    border: isMe ? "none" : "1px solid var(--border)"
                  }}>
                    <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                      {msg.content.startsWith("[MEAL] ") ? (
                        <img 
                          src={msg.content.replace("[MEAL] ", "")} 
                          alt="Meal" 
                          style={{ maxWidth: "100%", borderRadius: 8, marginTop: 4 }} 
                          onClick={() => window.open(msg.content.replace("[MEAL] ", ""), "_blank")}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: isMe ? "rgba(255,255,255,0.6)" : "var(--gray2)", 
                      marginTop: 4,
                      textAlign: "right"
                    }}>
                      {fmtTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Native Photo Upload panel */}
      {photoMode && (
        <div style={{ ...s.card, marginTop: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
            📸 SEND MEAL PHOTO
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await uploadPhotoToStorage(file);
              e.target.value = "";
            }}
          />
          {uploadError && (
            <div style={{ fontSize: 11, color: "var(--red)", marginBottom: 8, background: "rgba(192,57,43,0.1)", padding: "6px 10px", borderRadius: 4 }}>
              ⚠ {uploadError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ ...s.btn, flex: 2, padding: "12px", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "⏳ UPLOADING..." : "📷 CHOOSE PHOTO"}
            </button>
            <button onClick={() => { setPhotoMode(false); setUploadError(""); }}
              style={{ ...s.btnGhost, flex: 1, padding: "12px" }}>✕ CANCEL</button>
          </div>
          <div style={{ fontSize: 10, color: "var(--gray2)", marginTop: 8, textAlign: "center" }}>
            Wybierz zdjęcie z galerii lub zrób nowe
          </div>
        </div>
      )}

      {/* Text input */}
      {!photoMode && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          {!isCoach && (
            <button onClick={() => setPhotoMode(true)}
              style={{ ...s.btnGhost, padding: "12px 14px", flexShrink: 0, width: "auto" }}>
              📸
            </button>
          )}
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyPress={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            style={{
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "12px 14px", color: "var(--white)",
              fontSize: 15, flex: 1, minWidth: 0,
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          />
          <button onClick={sendMessage}
            style={{ ...s.btn, width: "auto", padding: "12px 18px", flexShrink: 0 }}>
            ➤
          </button>
        </div>
      )}
    </div>
  );
}
