// client/src/hooks/useLocalEvents.js

// ---- config ---------------------------------------------------------------
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";
const LS_KEY = "events_office_store_v1";

// ---- small helpers --------------------------------------------------------
function toISOMaybe(val) {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toISOString();
}
function isMongoId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}
function newLocalId() {
  // local-only id (won’t collide with Mongo _id)
  return `local_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function uiToApi(e) {
  return {
    title: e.name || "",
    description: e.shortDescription || "",
    location: e.location || "",
    startDateTime: toISOMaybe(e.startDateTime),
    endDateTime: toISOMaybe(e.endDateTime),
    registrationDeadline: toISOMaybe(e.registrationDeadline) || undefined,
    price: e.price ? Number(e.price) : undefined,
    capacity: e.capacity ? Number(e.capacity) : undefined,
    uiType: e.type, // optional – keep UI label in DB
  };
}
function apiToUi(doc, kind /* 'BAZAAR' | 'TRIP' */) {
  const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");
  return {
    id: doc._id, // UI expects "id"
    type: kind, // "BAZAAR" | "TRIP"
    name: doc.title || "",
    location: doc.location || "",
    shortDescription: doc.description || "",
    startDateTime: toInput(doc.startDateTime),
    endDateTime: toInput(doc.endDateTime),
    registrationDeadline: toInput(doc.registrationDeadline),
    price: doc.price ?? "",
    capacity: doc.capacity ?? "",
    _raw: doc,
  };
}

// ---- localStorage layer (your teammate's) ---------------------------------
function lsLoad() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}
function lsSave(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}
function lsList() {
  return lsLoad();
}
function lsGet(id) {
  return lsLoad().find((e) => e.id === id) || null;
}
function lsUpsert(event) {
  const all = lsLoad();
  const idx = all.findIndex((e) => e.id === event.id);
  if (idx === -1) all.push(event);
  else all[idx] = event;
  lsSave(all);
  return event;
}

// ---- small fetch helper with timeout --------------------------------------
async function tryFetch(url, opts = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// cache server reachability to avoid retrying every call
let serverReachable = null;
async function ensureServer() {
  if (serverReachable === true) return true;
  if (serverReachable === false) return false;
  try {
    const res = await tryFetch(`${API_BASE}/api/health`).catch(() => null);
    // if you don’t have /api/health, we’ll infer reachability later
    serverReachable = res ? res.ok : null;
  } catch {
    serverReachable = false;
  }
  return serverReachable ?? true; // “unknown” => try once
}

// ---- public hook -----------------------------------------------------------
export function useLocalEvents() {
  // Unified, fault-tolerant list/get/upsert.
  // They are async to support server + fallback. (See usage note below.)

  async function list() {
    // 1) try server
    try {
      await ensureServer(); // may be a no-op if missing
      const [bzRes, trRes] = await Promise.all([
        tryFetch(`${API_BASE}/api/bazaars`).catch(() => null),
        tryFetch(`${API_BASE}/api/trips`).catch(() => null),
      ]);

      if (bzRes?.ok && trRes?.ok) {
        serverReachable = true;
        const bzJson = await bzRes.json();
        const trJson = await trRes.json();
        const bazaars = Array.isArray(bzJson.items)
          ? bzJson.items.map((d) => apiToUi(d, "BAZAAR"))
          : [];
        const trips = Array.isArray(trJson.items)
          ? trJson.items.map((d) => apiToUi(d, "TRIP"))
          : [];
        const merged = [...bazaars, ...trips];
        // mirror to local cache (optional)
        lsSave(merged);
        return merged;
      }
      serverReachable = false;
    } catch {
      serverReachable = false;
    }

    // 2) fallback to local
    return lsList();
  }

  async function get(id) {
    // server first (try both collections), else local
    try {
      const r1 = await tryFetch(`${API_BASE}/api/bazaars/${id}`).catch(
        () => null
      );
      if (r1?.ok) {
        serverReachable = true;
        return apiToUi(await r1.json(), "BAZAAR");
      }
      const r2 = await tryFetch(`${API_BASE}/api/trips/${id}`).catch(
        () => null
      );
      if (r2?.ok) {
        serverReachable = true;
        return apiToUi(await r2.json(), "TRIP");
      }
    } catch {
      serverReachable = false;
    }
    return lsGet(id);
  }

  async function upsert(e) {
    const kind = (e.type || "").toUpperCase(); // "BAZAAR" | "TRIP"
    const base = `${API_BASE}/api/${kind === "TRIP" ? "trips" : "bazaars"}`;
    const payload = uiToApi(e);

    // server path
    try {
      const url = isMongoId(e.id) ? `${base}/${e.id}` : base;
      const method = isMongoId(e.id) ? "PUT" : "POST";
      const res = await tryFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res?.ok) {
        serverReachable = true;
        const json = await res.json();
        const ui = apiToUi(json, kind);
        // also mirror to local for offline views
        lsUpsert(ui);
        return ui;
      }
      serverReachable = false;
    } catch {
      serverReachable = false;
    }

    // fallback to local only
    const localEvent = {
      ...e,
      id: e.id || newLocalId(), // ensure an id exists
    };
    return lsUpsert(localEvent);
  }

  // Optional: sync-style API for legacy components (local only)
  // If you still have places that call list().sort(...) synchronously,
  // you can temporarily use these until you migrate them to async.
  function listSync() {
    return lsList();
  }
  function getSync(id) {
    return lsGet(id);
  }

  return { list, get, upsert, listSync, getSync };
}
