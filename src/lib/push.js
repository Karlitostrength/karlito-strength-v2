import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = "BOYjSxB8XPMWutCtu_-aHx5PkZBXCSQVmwsOlYz8Q6n-QGo2_6UxEgGBzJp3PuSr6aJgvcSQbavVV8Muss0Hgmc";
const SUPABASE_FUNCTIONS_URL = "https://ebpdfalmzkvxfuzaamqh.supabase.co/functions/v1";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function sendPushToAllUsers(title, message, tag = "ks", url = "/") {
  try {
    const { data: subs } = await supabase.from("push_subscriptions").select("user_id");
    if (!subs) return;
    const ids = [...new Set(subs.map(s => s.user_id))];
    for (const uid of ids) await sendPushToUser(uid, title, message, tag, url);
  } catch(e) { console.log("push all error:", e); }
}

export async function sendPushToUser(userId, title, message, tag = "ks", url = "/") {
  try {
    await fetch(`${SUPABASE_FUNCTIONS_URL}/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, title, message, tag, url }),
    });
  } catch(e) { console.log("Push failed (non-critical):", e); }
}

export async function registerPushSubscription(userId) {
  try {
    if (!("serviceWorker" in navigator)) throw new Error("Service Workers not supported");
    if (!("PushManager" in window)) throw new Error("Push not supported in this browser");
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permission denied");
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    const { error } = await supabase.from("push_subscriptions").insert({
      user_id: userId,
      subscription: JSON.stringify(sub),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("DB error: " + error.message);
    return { ok: true };
  } catch(e) {
    console.error("Push registration failed:", e);
    return { ok: false, error: e.message };
  }
}

export async function unregisterPushSubscription(userId) {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}
