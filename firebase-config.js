/**
 * firebase-config.js
 * ─────────────────────────────────────────────
 * PURPOSE  : Connect project to Firebase Realtime Database
 * USED BY  : Every other JS file that needs database access
 * EXPORTS  : db, auth, and all database helper functions
 * ─────────────────────────────────────────────
 *
 * NOTE: Since this is a standalone HTML project (no bundler),
 * we load Firebase from CDN and expose it via window globals.
 * In a real Node/React project you would use ES module imports.
 */

// ─── YOUR FIREBASE CONFIG ──────────────────────────────────────
// Replace these values with your own from:
// Firebase Console → Project Settings → Your Apps → Config
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ──────────────────────────────────────────────────────────────

// ─── DATABASE SCHEMA ──────────────────────────────────────────
// Firebase root/
// ├── products/{productId}          → all product info
// ├── users/{userId}                → user profiles
// ├── negotiations/{userId_prodId}  → session state per user-product
// ├── offers/{autoId}               → every single offer made
// ├── orders/{autoId}               → confirmed deals
// └── logs/{autoId}                 → system event logs
// ──────────────────────────────────────────────────────────────

let _db   = null;
let _auth = null;
let _firebaseReady = false;

/**
 * initFirebase()
 * Called once on page load. Initializes Firebase app,
 * database, and auth. Sets _firebaseReady = true when done.
 */
function initFirebase() {
  try {
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    _db        = firebase.database();
    _auth      = firebase.auth();
    _firebaseReady = true;
    console.log("[Firebase] Initialized successfully");
    return true;
  } catch (e) {
    console.warn("[Firebase] Init failed — using local storage fallback", e.message);
    _firebaseReady = false;
    return false;
  }
}

/** Returns true if Firebase connected */
function isFirebaseReady() { return _firebaseReady; }

// ─── DATABASE OPERATIONS ──────────────────────────────────────

/**
 * dbGet(path)
 * Read data once from given Firebase path.
 * Returns the value or null if not found.
 * Example: dbGet("products/p001") → { name: "Watch", mrp: 2000 }
 */
async function dbGet(path) {
  if (!_firebaseReady) return localGet(path);
  try {
    const snap = await _db.ref(path).once("value");
    return snap.exists() ? snap.val() : null;
  } catch(e) {
    console.error("[Firebase] GET error:", path, e);
    return null;
  }
}

/**
 * dbSet(path, data)
 * Write or overwrite data at given path.
 * Use for updating existing records.
 * Example: dbSet("negotiations/u1_p1", { round: 2, status: "negotiating" })
 */
async function dbSet(path, data) {
  if (!_firebaseReady) return localSet(path, data);
  try {
    await _db.ref(path).set(data);
    return true;
  } catch(e) {
    console.error("[Firebase] SET error:", path, e);
    return false;
  }
}

/**
 * dbPush(path, data)
 * Add new record with auto-generated unique ID.
 * Use for adding to collections (offers, orders, logs).
 * Returns the auto-generated key.
 * Example: dbPush("orders/", { userId, finalPrice }) → "-NxK9m..."
 */
async function dbPush(path, data) {
  if (!_firebaseReady) return localPush(path, data);
  try {
    const ref = await _db.ref(path).push(data);
    return ref.key;
  } catch(e) {
    console.error("[Firebase] PUSH error:", path, e);
    return null;
  }
}

/**
 * dbGetAll(path)
 * Get all records under a path as an array.
 * Example: dbGetAll("products") → [{ id, name, mrp, ... }, ...]
 */
async function dbGetAll(path) {
  if (!_firebaseReady) return localGetAll(path);
  try {
    const snap = await _db.ref(path).once("value");
    if (!snap.exists()) return [];
    const val = snap.val();
    // Convert Firebase object to array, injecting the key as 'id'
    return Object.entries(val).map(([key, value]) => ({
      ...value,
      _firebaseKey: key
    }));
  } catch(e) {
    console.error("[Firebase] GETALL error:", path, e);
    return [];
  }
}

/**
 * dbUpdate(path, updates)
 * Update specific fields without overwriting entire record.
 * Example: dbUpdate("negotiations/u1_p1", { status: "accepted" })
 */
async function dbUpdate(path, updates) {
  if (!_firebaseReady) return localUpdate(path, updates);
  try {
    await _db.ref(path).update(updates);
    return true;
  } catch(e) {
    console.error("[Firebase] UPDATE error:", path, e);
    return false;
  }
}

/**
 * dbListen(path, callback)
 * Real-time listener — fires callback whenever data at path changes.
 * This is what makes Firebase "real-time" — no page refresh needed.
 * Returns unsubscribe function.
 */
function dbListen(path, callback) {
  if (!_firebaseReady) return () => {};
  const ref = _db.ref(path);
  ref.on("value", snap => callback(snap.exists() ? snap.val() : null));
  return () => ref.off("value"); // call this to stop listening
}

/**
 * dbDelete(path)
 * Delete data at given path.
 */
async function dbDelete(path) {
  if (!_firebaseReady) return localDelete(path);
  try {
    await _db.ref(path).remove();
    return true;
  } catch(e) {
    console.error("[Firebase] DELETE error:", path, e);
    return false;
  }
}

// ─── AUTH OPERATIONS ──────────────────────────────────────────

/**
 * signInAnon()
 * Signs user in anonymously — no email/password needed.
 * Firebase gives a unique UID that persists in same browser.
 * Returns userId string.
 */
async function signInAnon() {
  if (!_firebaseReady) {
    // Generate a local guest ID if Firebase not available
    let guestId = localStorage.getItem("guestUserId");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substr(2,10);
      localStorage.setItem("guestUserId", guestId);
    }
    return guestId;
  }
  try {
    const cred = await _auth.signInAnonymously();
    return cred.user.uid;
  } catch(e) {
    console.warn("[Firebase] Auth failed, using local ID");
    return "guest_" + Math.random().toString(36).substr(2,10);
  }
}

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────────
// When Firebase config is not set up, use localStorage
// so the app still works for demo/testing purposes

const LOCAL_KEY = "ai_bargain_db";

function _getLocalDb() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); }
  catch(e) { return {}; }
}

function _saveLocalDb(db) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
}

function _resolvePath(db, path, value, del=false) {
  const parts = path.split("/").filter(Boolean);
  let cur = db;
  for (let i=0; i<parts.length-1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  const last = parts[parts.length-1];
  if (value !== undefined) cur[last] = value;
  if (del) delete cur[last];
  return cur[last];
}

function localGet(path) {
  const db = _getLocalDb();
  const parts = path.split("/").filter(Boolean);
  let cur = db;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return null;
    cur = cur[p];
  }
  return cur ?? null;
}

function localSet(path, data) {
  const db = _getLocalDb();
  _resolvePath(db, path, data);
  _saveLocalDb(db);
  return true;
}

function localUpdate(path, updates) {
  const existing = localGet(path) || {};
  localSet(path, { ...existing, ...updates });
  return true;
}

function localPush(path, data) {
  const db = _getLocalDb();
  const key = "-L" + Math.random().toString(36).substr(2,10);
  const fullPath = path.replace(/\/$/, "") + "/" + key;
  _resolvePath(db, fullPath, data);
  _saveLocalDb(db);
  return key;
}

function localGetAll(path) {
  const val = localGet(path);
  if (!val || typeof val !== "object") return [];
  return Object.entries(val).map(([k,v]) => ({ ...v, _firebaseKey: k }));
}

function localDelete(path) {
  const db = _getLocalDb();
  _resolvePath(db, path, undefined, true);
  _saveLocalDb(db);
  return true;
}
