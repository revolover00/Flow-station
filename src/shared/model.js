export const ids = [
  "reader",
  "notes",
  "timer",
  "calc",
  "video",
  "translate",
  "ai",
  "web",
];
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  Date.now().toString(36) + Math.random().toString(36).slice(2);
export const empty = (title = "جلسة جديدة") => ({
  id: uid(),
  title,
  updated: Date.now(),
  tools: [],
  active: null,
  primary: null,
  side: null,
  ratio: 59,
  notes: "",
  clips: [],
  files: [],
  doc: null,
  page: 1,
  chat: [],
  video: "",
  at: 0,
  bookmarks: [],
  timer: { mode: "focus", focus: 25, rest: 5, left: 1500, end: null, done: 0 },
});
export function openTool(s, k) {
  if (!ids.includes(k)) return s;
  const tools = s.tools.includes(k) ? s.tools : [...s.tools, k];
  return {
    ...s,
    tools,
    primary: s.primary || k,
    active: k,
    side: s.primary && k !== s.primary ? k : s.side,
  };
}
export function closeTool(s, k) {
  const tools = s.tools.filter((t) => t !== k),
    primary = tools.includes(s.primary) ? s.primary : tools[0] || null;
  return {
    ...s,
    tools,
    primary,
    active: tools.includes(s.active) ? s.active : primary,
    side:
      s.side !== k && s.side !== primary && tools.includes(s.side)
        ? s.side
        : tools.find((t) => t !== primary) || null,
  };
}
export function remain(t, now = Date.now()) {
  return Math.max(0, t.end ? Math.ceil((t.end - now) / 1000) : t.left);
}
export function stamp(n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  return (
    (n >= 3600 ? Math.floor(n / 3600) + ":" : "") +
    String(Math.floor(n / 60) % 60).padStart(2, "0") +
    ":" +
    String(n % 60).padStart(2, "0")
  );
}
export function youtube(raw) {
  let u;
  const x = raw.trim();
  if (/^[\w-]{11}$/.test(x)) return { id: x, at: 0 };
  try {
    u = new URL(x.includes("://") ? x : "https://" + x);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  if (
    u.protocol !== "https:" ||
    !["youtu.be", "youtube.com", "youtube-nocookie.com"].includes(host)
  )
    return null;
  const id =
    host === "youtu.be"
      ? u.pathname.slice(1)
      : u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
  if (!/^[\w-]{11}$/.test(id || "")) return null;
  const t = u.searchParams.get("t") || u.searchParams.get("start") || "0";
  const at = /^\d+$/.test(t)
    ? Number(t)
    : (Number(t.match(/(\d+)h/)?.[1]) || 0) * 3600 +
      (Number(t.match(/(\d+)m/)?.[1]) || 0) * 60 +
      (Number(t.match(/(\d+)s/)?.[1]) || 0);
  return { id, at: Math.min(at, 86400) };
}
export function webUrl(raw) {
  const s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  try {
    const u = new URL(/^[a-z][\w+.-]*:/i.test(s) ? s : "https://" + s);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.port ||
      !u.hostname.includes(".") ||
      !/[a-z]{2,}$/i.test(u.hostname) ||
      /\.(localhost|local|internal|lan|test|invalid|home|arpa)$/i.test(
        u.hostname,
      )
    )
      return null;
    return u.href;
  } catch {
    return null;
  }
}
export function load() {
  try {
    const d = JSON.parse(localStorage.getItem("flow:desk:v1") || "null");
    if (d?.version === 1 && Array.isArray(d.list) && d.list.length) {
      const list = d.list
        .filter((x) => typeof x.id === "string" && Array.isArray(x.tools))
        .map((x) => ({
          ...empty(),
          ...x,
          tools: x.tools.filter((t) => ids.includes(t)),
        }));
      if (list.length)
        return {
          version: 1,
          list,
          current: list.some((s) => s.id === d.current)
            ? d.current
            : list[0].id,
        };
    }
  } catch {}
  const s = empty();
  return { version: 1, list: [s], current: s.id };
}
export async function callApi(action, body, signal) {
  let code = "";
  try {
    code = sessionStorage.getItem("flow-access") || "";
  } catch {}
  const r = await fetch("/api/" + action, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-flow-code": code },
    body: JSON.stringify(body),
    signal,
  });
  let j;
  try {
    j = await r.json();
  } catch {
    throw new Error("تعذّر الاتصال بخادم Flow Station.");
  }
  if (!r.ok) throw new Error(j.error || "تعذّر إكمال الطلب.");
  return j;
}
let dbp;
function db() {
  if (!dbp)
    dbp = new Promise((ok, fail) => {
      const r = indexedDB.open("flow-station-files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("blobs");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => {
        dbp = null;
        fail(r.error);
      };
    });
  return dbp;
}
export async function saveFile(key, file) {
  const d = await db();
  return new Promise((ok, fail) => {
    const tx = d.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(file, key);
    tx.oncomplete = ok;
    tx.onabort = () => fail(tx.error);
    tx.onerror = () => fail(tx.error);
  });
}
export async function getFile(key) {
  if (key === "demo-motion") {
    const r = await fetch("/motion-notes.txt");
    if (!r.ok) throw new Error("تعذّر تحميل الورقة النموذجية.");
    return r.blob();
  }
  const d = await db();
  return new Promise((ok, fail) => {
    let q = d.transaction("blobs").objectStore("blobs").get(key);
    q.onsuccess = () =>
      q.result
        ? ok(q.result)
        : fail(new Error("الملف مش موجود على الجهاز. ارفعه تاني."));
    q.onerror = () => fail(q.error);
  });
}
export function download(name, text) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}
