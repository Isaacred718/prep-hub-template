/* auth.js — Google sign-in + Firestore progress sync.
   Topic-agnostic engine file: the Firebase project and the Firestore
   collection come from topic.js (TOPIC.sync). With TOPIC.sync set to null
   the app runs purely on this device and the sign-in button is hidden.

   Offline-first: every Firebase/Firestore call is guarded. If the SDK can't load,
   the user is offline, or a write fails, the app keeps working fully on
   localStorage and the header shows an Offline/Sync-failed status.

   iOS home-screen flow (v4): iOS bounces OAuth out of standalone web apps into
   Safari, so the redirect completes there. v4 makes that fast and patient:
   - index.html paints an instant "Completing sign-in…" splash in Safari and
     loads auth.js before the heavy question-bank scripts, so the sign-in
     finishes (and the "switch back" banner appears) in seconds;
   - the home-screen app, on return, waits up to ~40s for the session Safari
     created (polling shared site storage) and reloads once it appears;
   - v4: Firestore persistence removed (it could deadlock between Safari and
     a suspended home-screen app, hanging sync forever); cloud sync has a 12s
     cap and sign-in shows immediately; if the iOS OAuth sheet stalls, the app
     tells the user to open it in Safari via the compass icon. */
(function () {
'use strict';

var TOPIC = window.TOPIC || {};
var SYNC = TOPIC.sync && TOPIC.sync.firebase ? TOPIC.sync : null;
var FIREBASE_CONFIG = SYNC ? SYNC.firebase : {};
var COLLECTION = (SYNC && SYNC.collection) || ((TOPIC.id || 'study') + '_users'); // one doc per user
var KEY_PREFIX = (TOPIC.id || 'study') + '_';
var PUSH_DEBOUNCE_MS = 2000;
var HIST_MAX = 40;

function $(id) { return document.getElementById(id); }

var auth = null, db = null, user = null, authReady = false, firstAuthResolved = false;
var redirectSettled = false;
var pushTimer = null;

/* ---------- sync status indicator (header) ---------- */
function setStatus(mode, label) {
  var dot = $('sync-dot'), lab = $('sync-label');
  if (!dot || !lab) return;
  dot.className = 'sync-dot' + (mode === 'ok' ? ' ok' : mode === 'busy' ? ' busy' : mode === 'err' ? ' err' : '');
  lab.textContent = label || '';
  dot.title = label || 'Sync status';
}

/* ---------- offline mode ----------
   A service worker (sw.js) caches the app shell so it loads with no
   internet. Everything except Google sign-in and cloud sync works offline;
   progress keeps saving to localStorage and syncs when back online. */
function updateOfflineUI() {
  var offline = !navigator.onLine;
  var badge = $('offline-badge');
  if (badge) badge.style.display = offline ? '' : 'none';
  var btnIn = $('btn-signin');
  if (btnIn) {
    btnIn.disabled = offline;
    btnIn.title = offline ? 'Sign-in needs internet' : '';
    btnIn.style.opacity = offline ? '.5' : '';
  }
  // Don't stomp a more specific status (signing in, syncing, error).
  var lab = $('sync-label');
  if (offline && lab && !lab.textContent) {
    setStatus('', 'Offline — progress saves on this device');
  }
}
window.addEventListener('online', function () {
  var badge = $('offline-badge');
  if (badge) badge.style.display = 'none';
  setStatus('', '');
  if (typeof syncOnSignIn === 'function' && user) syncOnSignIn(user);
});
window.addEventListener('offline', updateOfflineUI);

/* ---------- standalone / PWA detection ----------
   Home-screen web apps (iOS "Add to Home Screen", Android TWA-ish installs)
   cannot open OAuth popups, so sign-in must go through the redirect flow. */
function isStandalone() {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.navigator && window.navigator.standalone === true) return true; // older iOS
  return false;
}

/* ---------- iOS home-screen auth handoff ----------
   iOS bounces OAuth out of standalone web apps into Safari: the redirect
   completes in Safari and the home-screen app never sees it. So before
   redirecting we mark a handoff in localStorage (site data is shared
   between Safari and the home-screen app for the same origin). Safari shows
   an instant splash, completes the sign-in, then shows a "go back" banner.
   When the user returns to the home-screen app it waits for the session
   Safari created (polling shared storage) and reloads to pick it up. */
var HANDOFF_KEY = KEY_PREFIX + 'auth_handoff';
var HANDOFF_TTL_MS = 2 * 3600 * 1000;
function markHandoff() { try { localStorage.setItem(HANDOFF_KEY, String(Date.now())); } catch (e) {} }
function readHandoff() {
  try {
    var t = +localStorage.getItem(HANDOFF_KEY);
    if (t && (Date.now() - t) < HANDOFF_TTL_MS) return t;
  } catch (e) {}
  return 0;
}
function clearHandoff() { try { localStorage.removeItem(HANDOFF_KEY); } catch (e) {} }
// Reload guard so the waiting-mode reload can never loop: value is "<handoffTs>:<count>".
var HANDOFF_RELOAD_KEY = KEY_PREFIX + 'auth_handoff_reloaded';
var MAX_HANDOFF_RELOADS = 2;
function handoffReloads(t) {
  try {
    var parts = (localStorage.getItem(HANDOFF_RELOAD_KEY) || '').split(':');
    if (parts[0] === String(t)) return Math.max(0, parseInt(parts[1], 10) || 0);
  } catch (e) {}
  return 0;
}
function noteHandoffReload(t) {
  try { localStorage.setItem(HANDOFF_RELOAD_KEY, String(t) + ':' + (handoffReloads(t) + 1)); }
  catch (e) {}
}
function clearHandoffReloaded() { try { localStorage.removeItem(HANDOFF_RELOAD_KEY); } catch (e) {} }
// Pure decision, unit-testable: should the standalone app wait for Safari's session on return?
function shouldWaitOnReturn(o) {
  return !!(o && o.visible && o.standalone && o.authReady && !o.hasUser &&
            o.handoffFresh && !o.waiting && o.reloadsLeft > 0);
}
/* ---------- sessionStorage mirror for the Firebase redirect flow ----------
   Firebase's signInWithRedirect keeps its pending state in sessionStorage,
   which does NOT survive the standalone -> Safari hop (per-tab storage).
   Mirror every sessionStorage write into localStorage (shared site data on
   iOS 16.4+) and restore it on load, so Safari's getRedirectResult() can
   actually complete the sign-in the home-screen app started. */
var FBSS_PREFIX = 'fbss:';
function restoreFirebaseSessionStorage() {
  try {
    Object.keys(localStorage).forEach(function (k) {
      if (k.indexOf(FBSS_PREFIX) === 0) {
        var sk = k.slice(FBSS_PREFIX.length);
        if (!sessionStorage.getItem(sk)) sessionStorage.setItem(sk, localStorage.getItem(k));
      }
    });
  } catch (e) {}
}
function installFirebaseSessionStorageMirror() {
  try {
    restoreFirebaseSessionStorage();
    var origSet = sessionStorage.setItem.bind(sessionStorage);
    var origRemove = sessionStorage.removeItem.bind(sessionStorage);
    sessionStorage.setItem = function (key, value) {
      origSet(key, value);
      try { localStorage.setItem(FBSS_PREFIX + key, value); } catch (e) {}
    };
    sessionStorage.removeItem = function (key) {
      origRemove(key);
      try { localStorage.removeItem(FBSS_PREFIX + key); } catch (e) {}
    };
  } catch (e) {}
}
/* ---------- Safari-side splash + banner ----------
   The splash is painted by inline HTML in index.html the moment <body> parses
   (no JS dependencies), so the user sees "Completing sign-in…" instantly and
   waits instead of switching back early. */
function hideSplash() { var s = $('handoff-splash'); if (s) s.style.display = 'none'; }
function showHandoffBanner() {
  hideSplash();
  if ($('cts-handoff-banner') || !document.body) return;
  var d = document.createElement('div');
  d.id = 'cts-handoff-banner';
  d.setAttribute('style', 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;' +
    'background:#10241a;color:#e8f5ec;border:1px solid #2ecc71;border-radius:14px;' +
    'padding:14px 16px;font:15px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45)');
  d.innerHTML = '<b>Signed in \u2713</b><br><span style="opacity:.85">Now switch back to your home-screen app ' +
    '\u2014 you\u2019re signed in there too, and your progress will sync.</span>' +
    '<br><button id="cts-handoff-ok" style="margin-top:10px;padding:8px 18px;border-radius:10px;border:0;' +
    'background:#2ecc71;color:#06281a;font-weight:700;font-size:15px">Got it</button>';
  document.body.appendChild(d);
  $('cts-handoff-ok').addEventListener('click', function () { d.remove(); });
}

/* ---------- shared-session probe ----------
   Firebase persists the signed-in user to shared site storage (localStorage,
   or IndexedDB `firebaseLocalStorageDb` / store `firebaseLocalStorage` by
   default). The home-screen app polls for that key while waiting for Safari
   to finish the sign-in. */
var AUTH_USER_KEY = 'firebase:authUser:' + FIREBASE_CONFIG.apiKey + ':[DEFAULT]';
function sharedSessionPresent(cb) {
  var done = false;
  function finish(v) { if (!done) { done = true; cb(!!v); } }
  try { if (localStorage.getItem(AUTH_USER_KEY)) { finish(true); return; } } catch (e) {}
  try {
    if (!window.indexedDB) { finish(false); return; }
    var req = window.indexedDB.open('firebaseLocalStorageDb');
    req.onsuccess = function () {
      var dbc = null;
      try {
        dbc = req.result;
        if (!dbc.objectStoreNames.contains('firebaseLocalStorage')) {
          try { dbc.close(); } catch (e2) {}
          finish(false); return;
        }
        var tx = dbc.transaction('firebaseLocalStorage', 'readonly');
        var g = tx.objectStore('firebaseLocalStorage').get(AUTH_USER_KEY);
        g.onsuccess = function () { try { dbc.close(); } catch (e3) {} finish(!!g.result); };
        g.onerror = function () { try { dbc.close(); } catch (e4) {} finish(false); };
      } catch (e5) {
        try { if (dbc) dbc.close(); } catch (e6) {}
        finish(false);
      }
    };
    req.onerror = function () { finish(false); };
    req.onblocked = function () { finish(false); };
    setTimeout(function () { finish(false); }, 1500); // never hang a poll tick
  } catch (e7) { finish(false); }
}

/* ---------- waiting mode (home-screen app return trip) ----------
   After the Safari round-trip the app waits for the session to appear in
   shared storage, then reloads once so the SDK restores it. Bounded: ~40s
   of polling, max 2 reloads per handoff — it can never loop. */
var WAITING_TICK_MS = 2000, WAITING_MAX_TICKS = 20;
var waiting = false, waitTimer = null, waitChecking = false;
function stopWaiting() {
  waiting = false;
  if (waitTimer !== null) { clearInterval(waitTimer); waitTimer = null; }
}
function enterWaitingMode(t) {
  if (waiting) return;
  waiting = true;
  setStatus('busy', 'Completing sign-in…');
  var ticks = 0;
  function check() {
    if (!waiting || waitChecking) return;
    waitChecking = true;
    sharedSessionPresent(function (found) {
      waitChecking = false;
      if (!waiting) return;
      if (found) {
        stopWaiting();
        // Give this page's SDK a beat to restore the session on its own
        // before paying for a reload.
        setTimeout(function () {
          if (auth && auth.currentUser) return; // onAuthStateChanged will take it from here
          if (handoffReloads(t) < MAX_HANDOFF_RELOADS) {
            noteHandoffReload(t);
            location.reload();
          } else {
            setStatus('', 'Signed out');
          }
        }, 1500);
        return;
      }
      ticks++;
      if (ticks >= WAITING_MAX_TICKS) {
        stopWaiting();
        setStatus('', 'Signed out');
      }
    });
  }
  waitTimer = setInterval(check, WAITING_TICK_MS);
  check(); // immediate first probe (the localStorage path answers synchronously)
}
function handleReturnTrip() {
  var t = readHandoff();
  if (shouldWaitOnReturn({
    visible: !document.hidden,
    standalone: isStandalone(),
    authReady: authReady,
    hasUser: !!(auth && auth.currentUser),
    handoffFresh: !!t,
    waiting: waiting,
    reloadsLeft: t ? (MAX_HANDOFF_RELOADS - handoffReloads(t)) : 0
  })) enterWaitingMode(t);
}

/* ---------- merge decision: pure function, newer updatedAt wins ----------
   local: { boxes, hist, updatedAt }   cloud: null | Firestore doc data
   'push'  -> write local state to the cloud doc
   'adopt' -> replace local state with the cloud doc (then refresh the UI) */
function decideSync(local, cloud) {
  if (!cloud) return 'push'; // first sign-in: nothing in the cloud yet
  var lu = (local && local.updatedAt) || 0;
  var cu = (cloud && cloud.updatedAt) || 0;
  return cu > lu ? 'adopt' : 'push'; // ties go to local (avoids flip-flopping)
}

/* ---------- local state (via the app.js bridge) ---------- */
function bridge() { return window.Study || window.CTS || null; } // CTS = pre-v6 name
function readLocal() {
  var b = bridge();
  return b ? b.getState() : { boxes: {}, hist: [], updatedAt: 0 };
}

/* ---------- cloud ops (all guarded, never throw into the app) ---------- */
function cloudDoc() {
  if (!db || !user) return null;
  try { return db.collection(COLLECTION).doc(user.uid); }
  catch (e) { return null; }
}
function toCloudPayload(state) {
  var out = {
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    updatedAt: (state && state.updatedAt) || Date.now(),
    leitnerBoxes: (state && state.boxes) || {},
    testHistory: ((state && state.hist) || []).slice(0, HIST_MAX)
  };
  if (state && state.best) out.endlessBest = state.best;       // v6+
  if (state && state.settings) out.settings = state.settings;   // v6+: study preferences only
  return out;
}
function fromCloudPayload(doc) {
  var out = {
    boxes: (doc && doc.leitnerBoxes) || {},
    hist: (doc && doc.testHistory) || [],
    updatedAt: (doc && doc.updatedAt) || 0
  };
  // docs written before v6 have neither field; leave local values alone then
  if (doc && doc.endlessBest) out.best = doc.endlessBest;
  if (doc && doc.settings) out.settings = doc.settings;
  return out;
}

function pushNow() {
  pushTimer = null;
  var ref = cloudDoc();
  if (!ref || !bridge()) return; // never push from an app that has not loaded
  var state = readLocal();
  setStatus('busy', 'Syncing…');
  var done = false;
  // Firestore must never hang the UI: 12s cap, then report offline.
  var timer = setTimeout(function () {
    if (!done) { done = true; setStatus('err', 'Sync slow — saved locally'); }
  }, 12000);
  ref.set(toCloudPayload(state), { merge: true }).then(
    function () { if (!done) { done = true; clearTimeout(timer); setStatus('ok', 'Synced'); } },
    function () { if (!done) { done = true; clearTimeout(timer); setStatus('err', 'Sync failed — saved locally'); } }
  );
}
function schedulePush() {
  if (!user || !db) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
}
// app.js loads deferred (after this script); wire the push hookup whenever it appears.
function wirePush() { var b = bridge(); if (b) b.onChange = schedulePush; }

// Deferred scripts (app.js) run after readyState turns 'interactive' but
// before DOMContentLoaded, so DOMContentLoaded is the reliable "app loaded" mark.
var domReady = document.readyState === 'complete';
document.addEventListener('DOMContentLoaded', function () { domReady = true; });
var syncDeferred = false;
function syncOnSignIn(u) {
  if (!bridge() && !domReady) {
    // app.js loads deferred: until it runs, local state reads as empty, so a
    // newer cloud copy would be dropped (and later overwritten) or an empty
    // state pushed. Wait for it; the latest signed-in user syncs once.
    if (!syncDeferred) {
      syncDeferred = true;
      document.addEventListener('DOMContentLoaded', function () {
        syncDeferred = false;
        if (user) syncOnSignIn(user);
      });
    }
    return;
  }
  if (!bridge()) return; // the app failed to load; never sync from an empty state
  var ref = cloudDoc();
  if (!ref) return;
  // Sign-in state is already shown by renderAuth(); the cloud sync is
  // best-effort and must never leave the UI stuck on "Syncing…".
  setStatus('busy', 'Syncing…');
  var done = false;
  var timer = setTimeout(function () {
    if (!done) { done = true; setStatus('ok', 'Signed in — sync pending'); }
  }, 12000);
  function finish(fn) { return function (a) { if (!done) { done = true; clearTimeout(timer); fn(a); } }; }
  ref.get().then(finish(function (snap) {
    var local = readLocal();
    var decision = decideSync(local, snap.exists ? snap.data() : null);
    if (decision === 'adopt') {
      var b = bridge();
      if (b) {
        b.applyState(fromCloudPayload(snap.data())); // adopts cloud updatedAt too
        b.refreshUI(); // reload Leitner boxes, history, readiness, settings
      }
      setStatus('ok', 'Synced');
    } else {
      pushNow(); // local is newer, or first run: push local up
    }
  }), finish(function () {
    setStatus('err', 'Offline — saved locally');
  }));
}

/* ---------- auth UI ---------- */
function renderAuth() {
  var out = $('auth-out'), inn = $('auth-in');
  if (!out || !inn) return;
  if (user) {
    out.style.display = 'none';
    inn.style.display = '';
    var av = $('auth-avatar');
    if (av) {
      if (user.photoURL) { av.src = user.photoURL; av.style.display = ''; }
      else { av.style.display = 'none'; }
    }
    var nm = $('auth-name');
    if (nm) nm.textContent = user.displayName || user.email || 'Signed in';
  } else {
    out.style.display = '';
    inn.style.display = 'none';
  }
}

function signIn() {
  if (!auth || !window.firebase) return;
  var provider = new firebase.auth.GoogleAuthProvider();
  setStatus('busy', 'Signing in…');
  if (isStandalone()) {
    // iOS home-screen web apps: popups don't work — redirect straight away.
    // iOS will bounce the OAuth into Safari; mark the handoff so the return
    // trip waits for the session Safari creates.
    markHandoff();
    auth.signInWithRedirect(provider).catch(function () { setStatus('err', 'Sign-in failed'); });
    // iOS opens the OAuth in an overlay sheet instead of navigating away,
    // so this page stays alive. If we're still here and signed-out 15s
    // later, the sheet likely stalled: start waiting (in case it actually
    // completed) and tell the user how to finish in Safari.
    setTimeout(function () {
      if (auth.currentUser || waiting) return;
      handleReturnTrip(); // enters waiting mode if the handoff is fresh
      if (!auth.currentUser && !waiting) {
        // No fresh handoff (or waiting already gave up): show the manual path.
        setStatus('busy', 'If the Google window is blank: tap compass, Open in Safari');
      } else if (!auth.currentUser) {
        // Waiting is running; make its status carry the Safari fallback.
        setStatus('busy', 'Completing sign-in… (blank window? tap compass, Open in Safari)');
      }
    }, 15000);
    return;
  }
  auth.signInWithPopup(provider).catch(function (e) {
    var code = e && e.code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment') {
      // popup unavailable (blockers, some in-app browsers) — fall back to redirect
      auth.signInWithRedirect(provider).catch(function () { setStatus('err', 'Sign-in failed'); });
    } else {
      setStatus('err', 'Sign-in failed');
    }
  });
}

function signOut() {
  if (!auth) return;
  auth.signOut().catch(function () {});
  // local progress stays on the device; the app keeps working offline
}

/* ---------- init ----------
   Split in two: initAuth() runs the moment this script executes (no DOM
   needed) so Safari completes the redirect in seconds; initDom() wires the
   buttons once the DOM is ready. */
function initAuth() {
  if (!SYNC) return; // this topic runs on-device only
  if (!window.firebase) return; // CDN blocked / file:// without network; initDom shows Offline
  installFirebaseSessionStorageMirror(); // before getRedirectResult: restores the redirect state after the Safari hop
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  } catch (e) { return; }
  auth = firebase.auth();
  db = firebase.firestore();
  // NOTE: no enablePersistence(). Firestore's IndexedDB persistence can
  // deadlock when Safari and the suspended home-screen app contend for the
  // lock, hanging every read/write forever. We go straight to network;
  // progress is also kept in localStorage so the app works offline anyway.

  // Completes redirect sign-ins (standalone / popup fallback). Settling it
  // tells us a no-user state is definitive, so the splash can hide.
  auth.getRedirectResult().then(
    function () { redirectSettled = true; if (!auth.currentUser) hideSplash(); },
    function () { redirectSettled = true; if (!auth.currentUser) hideSplash(); }
  );

  auth.onAuthStateChanged(function (u) {
    user = u;
    authReady = true;
    renderAuth(); // no-ops until the DOM exists
    if (u) {
      hideSplash();
      if (isStandalone()) {
        stopWaiting();
        clearHandoff(); // handoff consumed: this app now holds the session
        clearHandoffReloaded();
      } else if (readHandoff()) {
        showHandoffBanner(); // round-trip finished here (Safari); the home-screen app still needs the marker
      }
      syncOnSignIn(u);
    }
    else {
      if (redirectSettled) hideSplash();
      setStatus('', 'Signed out');
    }
    if (!firstAuthResolved) {
      firstAuthResolved = true;
      // Load-time check too: iOS may have killed the app in the background,
      // relaunching it fresh on return (no visibilitychange fires). Delay a
      // beat so the SDK can restore the shared session first.
      setTimeout(handleReturnTrip, 1200);
    }
  });

  // Returning to the home-screen app after the Safari round-trip: wait for
  // the session Safari created, then reload to pick it up. Bounded so it can
  // never loop.
  document.addEventListener('visibilitychange', handleReturnTrip);
  window.addEventListener('pageshow', function (e) { if (e.persisted) handleReturnTrip(); });
}

function initDom() {
  if (!SYNC) {
    // no cloud sync configured: hide the sign-in UI, keep the offline badge
    ['auth-out', 'auth-in', 'sync-dot', 'sync-label'].forEach(function (id) { var el = $(id); if (el) el.style.display = 'none'; });
    var off = $('offline-badge');
    var paint = function () { if (off) off.style.display = navigator.onLine ? 'none' : ''; };
    window.addEventListener('online', paint);
    window.addEventListener('offline', paint);
    paint();
    return;
  }
  var btnIn = $('btn-signin'), btnOut = $('btn-signout');
  if (btnIn) btnIn.addEventListener('click', signIn);
  if (btnOut) btnOut.addEventListener('click', signOut);
  wirePush(); // debounced cloud write on local progress
  if (!window.firebase || !auth) setStatus('', 'Offline');
  updateOfflineUI();
  renderAuth();
}

initAuth(); // immediate: Safari must complete the redirect ASAP
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDom);
else initDom();

// exposed for unit-testing the merge logic without a browser, and for
// settings.js (signedIn) to word its confirmations
window.StudyAuth = { decideSync: decideSync, isStandalone: isStandalone, collection: COLLECTION,
  signedIn: function () { return !!user; }, toCloudPayload: toCloudPayload, fromCloudPayload: fromCloudPayload,
  markHandoff: markHandoff, readHandoff: readHandoff, clearHandoff: clearHandoff,
  handoffReloads: handoffReloads, noteHandoffReload: noteHandoffReload,
  clearHandoffReloaded: clearHandoffReloaded,
  installFirebaseSessionStorageMirror: installFirebaseSessionStorageMirror,
  restoreFirebaseSessionStorage: restoreFirebaseSessionStorage,
  shouldWaitOnReturn: shouldWaitOnReturn, wirePush: wirePush,
  sharedSessionPresent: sharedSessionPresent };

})();
