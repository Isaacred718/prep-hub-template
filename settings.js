/* settings.js — user preferences: storage, appearance, and the Settings sheet.

   Topic-agnostic engine file. Loads before app.js. Exposes window.Settings:
     get(key) / set(key, value) / all() / reset()
     onChange(fn)            fn(key, value) after any change
     synced() / adopt(obj)   the study preferences that ride cloud sync
   Appearance (theme, accent, text size, motion, sound, keyboard) stays on
   this device; study preferences sync with progress when signed in.
   The pre-paint bit (theme/accent/text size) runs inline in index.html so
   the page never flashes the wrong theme. */
(function () {
'use strict';

var T = window.TOPIC || {};
var KEY = (T.id || 'study') + '_settings_v1';
var TRACKS = T.tracks && T.tracks.length ? T.tracks : [{ id: 'main', label: 'All' }];
var EXAM = T.exam || {};
var LENGTHS = EXAM.lengths && EXAM.lengths.length ? EXAM.lengths : [{ n: 25, label: 'Quick' }, { n: 50, label: 'Standard', default: true }];
var defaultLength = (LENGTHS.filter(function (l) { return l.default; })[0] || LENGTHS[0]).n;

var DEFAULTS = {
  // appearance (this device)
  theme: 'dark',            // dark | light | system
  accent: '',               // '' = the topic's default accent
  textSize: 'md',           // sm | md | lg | xl
  reduceMotion: false,
  sounds: false,
  shortcuts: true,
  // study (synced)
  track: T.defaultTrack || TRACKS[0].id,
  passMark: EXAM.passMark || 70,
  testWeight: 60,           // readiness: % practice performance (rest = flashcards)
  quizLength: 25,           // 0 = all
  testLength: defaultLength,
  autoAdvance: false,
  cardFront: 'term',        // term | definition
  testPace: 'exam',         // off | exam | relaxed | extended
  endlessSecs: 150,
  lightningMs: 700,
  endlessStart: 1,
  endlessRamp: 'normal',    // gentle | normal | steep
  mixedShare: 45
};
var DEVICE_KEYS = ['theme', 'accent', 'textSize', 'reduceMotion', 'sounds', 'shortcuts'];

var ACCENTS = [
  ['sky', 'Sky', '#38bdf8'], ['violet', 'Violet', '#a78bfa'], ['emerald', 'Emerald', '#34d399'],
  ['amber', 'Amber', '#fbbf24'], ['rose', 'Rose', '#fb7185'], ['indigo', 'Indigo', '#818cf8']
];
// gradient stops used for the generated app icon
var ICON_GRADIENT = {
  sky: ['#0284c7', '#2563eb'], violet: ['#7c3aed', '#6d28d9'], emerald: ['#059669', '#0d9488'],
  amber: ['#d97706', '#ea580c'], rose: ['#e11d48', '#db2777'], indigo: ['#4f46e5', '#4338ca']
};

/* ---------- store ---------- */
var values = load();
var listeners = [];
function load() {
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  return sanitize(Object.assign({}, DEFAULTS, saved));
}
function sanitize(v) {
  // never let a corrupt or foreign value break the app
  Object.keys(DEFAULTS).forEach(function (k) {
    if (typeof v[k] !== typeof DEFAULTS[k]) v[k] = DEFAULTS[k];
  });
  if (v.track !== '__all' && !TRACKS.some(function (t) { return t.id === v.track; })) v.track = DEFAULTS.track;
  v.passMark = clamp(v.passMark, 30, 100);
  v.testWeight = clamp(v.testWeight, 0, 100);
  v.mixedShare = clamp(v.mixedShare, 5, 95);
  v.endlessStart = clamp(Math.round(v.endlessStart), 1, 5);
  if (!LENGTHS.some(function (l) { return l.n === v.testLength; })) v.testLength = DEFAULTS.testLength;
  return v;
}
function clamp(n, lo, hi) { n = +n; if (!isFinite(n)) n = lo; return Math.min(hi, Math.max(lo, n)); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(values)); } catch (e) {} }
function emit(key) { listeners.forEach(function (fn) { try { fn(key, values[key]); } catch (e) {} }); }

var Settings = {
  defaults: DEFAULTS,
  deviceKeys: DEVICE_KEYS,
  get: function (k) { return values[k]; },
  all: function () { return Object.assign({}, values); },
  set: function (k, v) {
    if (!(k in DEFAULTS) || values[k] === v) return;
    values[k] = v;
    values = sanitize(values);
    save();
    applyAppearance();
    emit(k);
  },
  reset: function () {
    values = Object.assign({}, DEFAULTS);
    save();
    applyAppearance();
    emit('*');
  },
  onChange: function (fn) { listeners.push(fn); },
  isSynced: function (k) { return DEVICE_KEYS.indexOf(k) === -1; },
  synced: function () {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) { if (DEVICE_KEYS.indexOf(k) === -1) out[k] = values[k]; });
    return out;
  },
  adopt: function (obj) { // cloud copy wins for study prefs; device prefs stay put
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(function (k) {
      if (k in DEFAULTS && DEVICE_KEYS.indexOf(k) === -1) values[k] = obj[k];
    });
    values = sanitize(values);
    save();
    emit('*');
  },
  replaceAll: function (obj) { // import: everything, including device prefs
    values = sanitize(Object.assign({}, DEFAULTS, obj || {}));
    save();
    applyAppearance();
    emit('*');
  },
  open: open,
  close: close,
  accents: ACCENTS
};
window.Settings = Settings;

/* ---------- appearance ---------- */
var mqLight = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
function effectiveTheme() {
  if (values.theme === 'system') return mqLight && mqLight.matches ? 'light' : 'dark';
  return values.theme === 'light' ? 'light' : 'dark';
}
function applyAppearance() {
  var d = document.documentElement;
  var theme = effectiveTheme();
  d.setAttribute('data-theme', theme);
  d.setAttribute('data-accent', values.accent || T.accent || 'sky');
  d.setAttribute('data-text', values.textSize);
  d.classList.toggle('reduce-motion', !!values.reduceMotion);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f1f5f9' : '#0f172a');
}
if (mqLight) {
  var onScheme = function () { if (values.theme === 'system') applyAppearance(); };
  if (mqLight.addEventListener) mqLight.addEventListener('change', onScheme);
  else if (mqLight.addListener) mqLight.addListener(onScheme);
}
applyAppearance();

/* ---------- generated app icon (favicon + iOS home-screen icon) ---------- */
function makeIcon() {
  try {
    var size = 180, c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var stops = ICON_GRADIENT[T.accent] || ICON_GRADIENT.sky;
    var grad = g.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, stops[0]); grad.addColorStop(1, stops[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size); // iOS rounds the corners itself
    var text = String(T.iconText || (T.name || '?').slice(0, 2)).slice(0, 4);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    var fs = text.length <= 1 ? 110 : text.length === 2 ? 88 : text.length === 3 ? 64 : 50;
    g.font = '800 ' + fs + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    g.fillText(text, size / 2, size / 2 + fs * 0.04);
    var url = c.toDataURL('image/png');
    [['icon', 'image/png'], ['apple-touch-icon', '']].forEach(function (p) {
      var l = document.querySelector('link[rel="' + p[0] + '"]');
      if (!l) { l = document.createElement('link'); l.rel = p[0]; document.head.appendChild(l); }
      if (p[1]) l.type = p[1];
      l.href = url;
    });
  } catch (e) {}
}
makeIcon();

/* ---------- the Settings sheet ---------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function paceHint() {
  var q = EXAM.simQuestions || 110, m = EXAM.simMinutes || 150;
  return 'Exam pace is ' + m + ' min for ' + q + ' questions. Sets the timer each time you pick a test length.';
}
function hasForge() {
  return typeof FORGE !== 'undefined' && FORGE.generators && FORGE.generators.length > 0;
}

// Schema-driven: each item renders a control bound to one setting.
function schema() {
  var trackOpts = TRACKS.map(function (t) { return [t.id, t.label]; }).concat([['__all', 'All']]);
  return [
    { title: 'Appearance', note: 'Saved on this device.', items: [
      { key: 'theme', label: 'Theme', type: 'seg', options: [['dark', 'Dark'], ['light', 'Light'], ['system', 'Auto']] },
      { key: 'accent', label: 'Accent color', type: 'swatch' },
      { key: 'textSize', label: 'Text size', type: 'seg', options: [['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']] },
      { key: 'reduceMotion', label: 'Reduce motion', type: 'toggle', hint: 'Turns off card flips, fades and pulsing timers.' }
    ] },
    { title: 'Study', note: 'Syncs with your progress when you are signed in.', items: [
      { key: 'track', label: 'Default ' + (T.trackLabel || 'track').toLowerCase(), type: 'seg', options: trackOpts,
        hint: 'Preselected in Readiness, Quiz, Practice and Endless.', when: function () { return TRACKS.length > 1; } },
      { key: 'passMark', label: 'Pass mark', type: 'range', min: 50, max: 90, step: 5, fmt: function (v) { return v + '%'; },
        hint: 'Drives pass/fail verdicts, score colors and readiness bands.' },
      { key: 'testWeight', label: 'Readiness weighting', type: 'range', min: 0, max: 100, step: 10,
        fmt: function (v) { return 'Practice ' + v + '% · Cards ' + (100 - v) + '%'; },
        hint: 'How much quiz and test results count against flashcard mastery.' },
      { key: 'quizLength', label: 'Quiz length', type: 'seg', options: [[10, '10'], [25, '25'], [50, '50'], [0, 'All']] },
      { key: 'testLength', label: 'Practice test length', type: 'seg',
        options: LENGTHS.map(function (l) { return [l.n, String(l.n)]; }) },
      { key: 'autoAdvance', label: 'Auto-advance on correct answers', type: 'toggle',
        hint: 'Quiz and Endless move on by themselves a moment after you get one right.' },
      { key: 'cardFront', label: 'Flashcards show first', type: 'seg', options: [['term', 'Term'], ['definition', 'Definition']] }
    ] },
    { title: 'Timers', items: [
      { key: 'testPace', label: 'Practice test timer', type: 'seg',
        options: [['off', 'Off'], ['exam', 'Exam pace'], ['relaxed', '1.5×'], ['extended', '2×']], hint: paceHint() },
      { key: 'endlessSecs', label: 'Endless question timer', type: 'seg',
        options: [[30, '0:30'], [60, '1:00'], [90, '1:30'], [150, '2:30'], [300, '5:00']],
        hint: 'Used when the per-question timer is switched on for a run.' },
      { key: 'lightningMs', label: 'Lightning round speed', type: 'seg', options: [[400, 'Fast'], [700, 'Normal'], [1200, 'Slow']] }
    ] },
    { title: 'Endless mode', items: [
      { key: 'endlessStart', label: 'Starting level', type: 'seg', options: [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']] },
      { key: 'endlessRamp', label: 'Difficulty ramp', type: 'seg', options: [['gentle', 'Gentle'], ['normal', 'Normal'], ['steep', 'Steep']],
        hint: 'How fast the level climbs on a correct answer and drops on a miss.' },
      { key: 'mixedShare', label: 'Generated share in Mixed', type: 'range', min: 10, max: 90, step: 5,
        fmt: function (v) { return v + '% generated'; }, when: hasForge }
    ] },
    { title: 'Sound & keyboard', note: 'Saved on this device.', items: [
      { key: 'sounds', label: 'Sound effects', type: 'toggle', hint: 'A soft tone for right and wrong answers and level-ups.' },
      { key: 'shortcuts', label: 'Keyboard shortcuts', type: 'toggle', keys: true }
    ] }
  ];
}

var KEY_HELP = [
  ['1–4 or A–D', 'Choose an answer'],
  ['Enter or →', 'Next question'],
  ['← →', 'Move through a practice test'],
  ['Space', 'Flip a flashcard'],
  ['← / →', 'Flashcard missed / got it'],
  ['Esc', 'Close this panel']
];

function controlHtml(it) {
  var v = values[it.key];
  var id = 'set-' + it.key;
  var head = '<div class="set-head"><label class="set-label" for="' + id + '">' + esc(it.label) + '</label>' +
    (it.type === 'range' ? '<span class="set-val" id="' + id + '-val">' + esc(it.fmt(v)) + '</span>' : '') + '</div>';
  var body = '';
  if (it.type === 'seg') {
    body = '<div class="seg set-seg" role="group" aria-label="' + esc(it.label) + '" data-key="' + it.key + '">' +
      it.options.map(function (o) {
        var on = String(o[0]) === String(v);
        return '<button type="button" data-v="' + esc(o[0]) + '" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '">' + esc(o[1]) + '</button>';
      }).join('') + '</div>';
    head = '<div class="set-head"><span class="set-label">' + esc(it.label) + '</span></div>';
  } else if (it.type === 'swatch') {
    var cur = v || T.accent || 'sky';
    body = '<div class="swatches" role="group" aria-label="Accent color" data-key="accent">' +
      ACCENTS.map(function (a) {
        var on = a[0] === cur;
        return '<button type="button" class="swatch' + (on ? ' on' : '') + '" data-v="' + a[0] + '" aria-pressed="' + on +
          '" aria-label="' + a[1] + '" title="' + a[1] + '" style="--sw:' + a[2] + '"></button>';
      }).join('') + '</div>';
    head = '<div class="set-head"><span class="set-label">' + esc(it.label) + '</span></div>';
  } else if (it.type === 'toggle') {
    head = '';
    body = '<label class="set-toggle" for="' + id + '"><span class="set-label">' + esc(it.label) + '</span>' +
      '<input type="checkbox" class="switch" id="' + id + '" data-key="' + it.key + '"' + (v ? ' checked' : '') + '></label>';
  } else if (it.type === 'range') {
    body = '<input type="range" class="set-range" id="' + id + '" data-key="' + it.key + '" min="' + it.min + '" max="' + it.max +
      '" step="' + it.step + '" value="' + v + '">';
  }
  var hint = it.hint ? '<p class="muted small set-hint">' + esc(it.hint) + '</p>' : '';
  var keys = it.keys ? '<div class="keys">' + KEY_HELP.map(function (k) {
    return '<div class="key-row"><kbd>' + esc(k[0]) + '</kbd><span>' + esc(k[1]) + '</span></div>';
  }).join('') + '</div>' : '';
  return '<div class="set-item">' + head + body + hint + keys + '</div>';
}

function counts() {
  // data files declare top-level consts, reachable by name from any script
  return {
    questions: typeof QUESTIONS !== 'undefined' ? QUESTIONS.length : 0,
    cards: typeof CARDS !== 'undefined' ? CARDS.length : 0,
    guides: typeof GUIDES !== 'undefined' ? GUIDES.length : 0,
    drills: typeof DRILLS !== 'undefined' ? DRILLS.length : 0
  };
}

function render() {
  var body = $('settings-body');
  if (!body) return;
  var html = schema().map(function (sec) {
    var items = sec.items.filter(function (it) { return !it.when || it.when(); });
    if (!items.length) return '';
    return '<section class="set-sec"><h3>' + esc(sec.title) + '</h3>' +
      (sec.note ? '<p class="muted small set-note">' + esc(sec.note) + '</p>' : '') +
      items.map(controlHtml).join('') + '</section>';
  }).join('');
  var c = counts();
  var parts = [c.questions + ' questions'];
  if (c.cards) parts.push(c.cards + ' flashcards');
  if (c.guides) parts.push(c.guides + ' guides');
  if (c.drills) parts.push(c.drills + ' drills');
  html +=
    '<section class="set-sec"><h3>Your data</h3>' +
    '<p class="muted small set-note">Progress lives in this browser' + (T.sync ? ' and syncs to your Google account when signed in' : '') +
    '. Export a backup any time.</p>' +
    '<div class="btnrow"><button class="btn sec" type="button" data-act="export">Export progress</button>' +
    '<button class="btn sec" type="button" data-act="import">Import progress</button></div>' +
    '<input type="file" id="set-import-file" accept="application/json,.json" hidden>' +
    '<div class="set-danger">' +
    '<button class="btn ghost" type="button" data-act="reset-cards">Reset flashcard progress</button>' +
    '<button class="btn ghost" type="button" data-act="clear-history">Clear session history</button>' +
    '<button class="btn ghost" type="button" data-act="reset-best">Reset Endless personal bests</button>' +
    '<button class="btn ghost" type="button" data-act="reset-settings">Restore default settings</button>' +
    '<button class="btn ghost danger" type="button" data-act="erase">Erase all progress</button>' +
    '</div></section>' +
    '<section class="set-sec"><h3>About</h3>' +
    '<p class="small"><b>' + esc(T.name || 'Study app') + '</b> · v' + esc(T.version || '1.0') + '</p>' +
    '<p class="muted small">' + esc(parts.join(' · ')) + '. Works offline once loaded.</p>' +
    '<div class="btnrow"><button class="btn sec" type="button" data-act="update">Check for updates</button>' +
    '<button class="btn sec" type="button" data-act="repair">Repair offline copy</button></div>' +
    '</section>';
  body.innerHTML = html;
}

function syncControls() {
  // reflect current values without re-rendering (keeps scroll position)
  var body = $('settings-body');
  if (!body) return;
  body.querySelectorAll('[data-key]').forEach(function (el) {
    var k = el.getAttribute('data-key'), v = values[k];
    if (el.classList.contains('switch')) el.checked = !!v;
    else if (el.type === 'range') {
      el.value = v;
      var lab = $('set-' + k + '-val'), it = findItem(k);
      if (lab && it) lab.textContent = it.fmt(v);
    } else {
      var cur = k === 'accent' ? (v || T.accent || 'sky') : v;
      el.querySelectorAll('button').forEach(function (b) {
        var on = b.getAttribute('data-v') === String(cur);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
    }
  });
}
function findItem(k) {
  var out = null;
  schema().forEach(function (s) { s.items.forEach(function (it) { if (it.key === k) out = it; }); });
  return out;
}

function coerce(k, raw) {
  var d = DEFAULTS[k];
  if (typeof d === 'number') return +raw;
  if (typeof d === 'boolean') return !!raw;
  return String(raw);
}

function wire() {
  var sheet = $('settings');
  var body = $('settings-body');
  if (!sheet || !body) return;
  body.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var group = b.closest('[data-key]');
    if (group && b.hasAttribute('data-v')) {
      var k = group.getAttribute('data-key');
      Settings.set(k, coerce(k, b.getAttribute('data-v')));
      syncControls();
      return;
    }
    var act = b.getAttribute('data-act');
    if (act) runAction(act);
  });
  body.addEventListener('input', function (e) {
    var el = e.target;
    if (el.type !== 'range') return;
    var k = el.getAttribute('data-key'), it = findItem(k);
    var lab = $('set-' + k + '-val');
    if (lab && it) lab.textContent = it.fmt(+el.value);
  });
  body.addEventListener('change', function (e) {
    var el = e.target, k = el.getAttribute('data-key');
    if (el.id === 'set-import-file') { importFile(el); return; }
    if (!k) return;
    if (el.classList.contains('switch')) Settings.set(k, el.checked);
    else if (el.type === 'range') Settings.set(k, +el.value);
    syncControls();
  });
  sheet.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheet.hidden) { e.preventDefault(); close(); }
    if (e.key === 'Tab' && !sheet.hidden) trapFocus(e, sheet);
  });
  var gear = $('btn-settings');
  if (gear) gear.addEventListener('click', open);
}

var lastFocus = null;
function open() {
  var sheet = $('settings');
  if (!sheet) return;
  render();
  lastFocus = document.activeElement;
  sheet.hidden = false;
  document.body.classList.add('sheet-open');
  var panel = sheet.querySelector('.sheet-panel');
  if (panel) panel.scrollTop = 0;
  var x = sheet.querySelector('.sheet-close');
  if (x) x.focus();
}
function close() {
  var sheet = $('settings');
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  document.body.classList.remove('sheet-open');
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
}
function trapFocus(e, root) {
  var f = root.querySelectorAll('button:not([disabled]), input:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- data actions (delegate to the app.js bridge) ---------- */
function app() { return window.Study; }
function toast(msg, action) { if (app() && app().toast) app().toast(msg, action); else alert(msg); }

function runAction(act) {
  var a = app();
  if (!a) return;
  var signedIn = !!(window.StudyAuth && window.StudyAuth.signedIn && window.StudyAuth.signedIn());
  var cloudNote = signedIn ? '\n\nYou are signed in, so your synced copy will match.' : '';
  if (act === 'export') return a.exportData();
  if (act === 'import') { var f = $('set-import-file'); if (f) { f.value = ''; f.click(); } return; }
  if (act === 'reset-cards') {
    if (confirm('Reset all flashcard progress? Every card goes back to Box 1.' + cloudNote)) { a.reset('cards'); toast('Flashcard progress reset.'); }
    return;
  }
  if (act === 'clear-history') {
    if (confirm('Clear your session history? Readiness scores are built from it.' + cloudNote)) { a.reset('history'); toast('Session history cleared.'); }
    return;
  }
  if (act === 'reset-best') {
    if (confirm('Reset your Endless personal bests?' + cloudNote)) { a.reset('best'); toast('Personal bests reset.'); }
    return;
  }
  if (act === 'reset-settings') {
    if (confirm('Restore every setting to its default?')) { Settings.reset(); render(); toast('Settings restored to defaults.'); }
    return;
  }
  if (act === 'erase') {
    if (confirm('Erase ALL progress — flashcards, session history and personal bests? This cannot be undone. Export a backup first if unsure.' + cloudNote)) {
      a.reset('all'); toast('All progress erased.');
    }
    return;
  }
  if (act === 'update') return checkForUpdates();
  if (act === 'repair') return repairOffline();
}

function importFile(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    var data = null;
    try { data = JSON.parse(String(reader.result)); } catch (e) {}
    if (!data || !data.progress) { toast('That file is not a progress backup.'); return; }
    if (data.app && data.app !== T.id &&
        !confirm('This backup is from a different app ("' + (data.name || data.app) + '"). Import it anyway?')) return;
    if (!confirm('Replace the progress on this device with the backup from ' + (data.exportedAt ? new Date(data.exportedAt).toLocaleString() : 'this file') + '?')) return;
    if (app().importData(data)) { render(); toast('Progress imported.'); }
    else toast('Could not import that file.');
  };
  reader.readAsText(file);
}

function checkForUpdates() {
  if (!navigator.onLine) { toast("You're offline — connect to check for updates."); return; }
  fetch('topic.js?check=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (txt) {
    var m = txt.match(/version\s*:\s*['"]([^'"]+)['"]/);
    var latest = m ? m[1] : null;
    if (latest && latest !== T.version) {
      toast('Version ' + latest + ' is available.', { label: 'Reload', fn: function () { location.reload(); } });
    } else {
      toast("You're on the latest version (v" + (T.version || '?') + ').');
    }
  }).catch(function () { toast('Could not reach the server. Try again in a moment.'); });
}

function repairOffline() {
  if (!confirm('Re-download the app and rebuild its offline copy? Your progress is not affected.')) return;
  var prefix = (T.id || 'study') + '-prep-';
  var scope = new URL('./', location.href).href;
  var jobs = [];
  if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
    jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
      // only this app's worker: other apps on the same site keep theirs
      return Promise.all(regs.filter(function (r) { return r.scope === scope; }).map(function (r) { return r.unregister(); }));
    }));
  }
  if (window.caches && caches.keys) {
    jobs.push(caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(prefix) === 0; }).map(function (k) { return caches.delete(k); }));
    }));
  }
  Promise.all(jobs).catch(function () {}).then(function () { location.reload(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();

})();
