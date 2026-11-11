/* ui.js — the friendly layer on top of the engine (v7). Topic-agnostic.

   - More sheet: the sections that do not fit the five-slot tab bar.
     Drag it down, tap outside, or press Escape/Back to close.
   - Home hero: day streak, this week's activity, one-tap starts.
   - Android app glue: Back closes sheets first; sign-in UI is replaced by a
     "Saved on device" chip, since Google sign-in cannot run inside the app. */
(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };
var T = window.TOPIC || {};
var P = (T.id || 'study') + '_';

/* ---------- bottom sheets ---------- */
/* Make a .sheet-panel draggable by its grab handle / header: follow the
   finger, close past a third of its height or on a quick flick. */
function dragToClose(sheet, close) {
  var panel = sheet.querySelector('.sheet-panel');
  if (!panel) return;
  var startY = 0, lastY = 0, lastT = 0, vel = 0, dragging = false;
  function down(e) {
    if (e.target.closest('button, a, input, select, textarea')) return;
    dragging = true; startY = lastY = e.clientY; lastT = e.timeStamp; vel = 0;
    panel.classList.add('dragging');
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
  }
  function move(e) {
    if (!dragging) return;
    var dy = Math.max(0, e.clientY - startY);
    var dt = e.timeStamp - lastT;
    if (dt > 0) vel = (e.clientY - lastY) / dt;
    lastY = e.clientY; lastT = e.timeStamp;
    panel.style.transform = 'translateY(' + dy + 'px)';
  }
  function up(e) {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('dragging');
    var dy = Math.max(0, e.clientY - startY);
    panel.style.transform = '';
    if (dy > panel.offsetHeight / 3 || vel > 0.6) close();
  }
  sheet.querySelectorAll('.sheet-grab, .sheet-head').forEach(function (h) {
    h.style.touchAction = 'none';
    h.addEventListener('pointerdown', down);
    h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', up);
    h.addEventListener('pointercancel', up);
  });
}

var more = $('more-sheet'), btnMore = $('btn-more');
var MORE_TABS = [];
function openMore() {
  if (!more) return;
  more.hidden = false;
  document.body.classList.add('sheet-open');
  var first = more.querySelector('.more-grid button:not([hidden])');
  if (first) first.focus({ preventScroll: true });
}
function closeMore() {
  if (!more || more.hidden) return false;
  more.hidden = true;
  document.body.classList.remove('sheet-open');
  if (btnMore) btnMore.focus({ preventScroll: true });
  return true;
}
if (more && btnMore) {
  more.querySelectorAll('.more-grid button[data-tab]').forEach(function (b) {
    MORE_TABS.push(b.dataset.tab);
    b.addEventListener('click', function () { closeMore(); });
  });
  // If the topic has none of the extra sections, the More slot goes away.
  if (!more.querySelector('.more-grid button:not([hidden])')) btnMore.hidden = true;
  btnMore.addEventListener('click', openMore);
  more.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeMore(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !more.hidden) { e.preventDefault(); closeMore(); }
  });
  dragToClose(more, closeMore);
  document.addEventListener('study:tab', function (e) {
    var on = MORE_TABS.indexOf(e.detail.tab) >= 0;
    btnMore.classList.toggle('active', on);
  });
}
var settings = $('settings');
if (settings) {
  dragToClose(settings, function () {
    var x = settings.querySelector('[data-close]');
    if (x) x.click();
  });
}

/* ---------- streak ---------- */
var ACT_KEY = P + 'activity_v1';
function dayKey(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function readDays() {
  var set = {};
  try { (JSON.parse(localStorage.getItem(ACT_KEY)) || []).forEach(function (k) { set[k] = 1; }); } catch (e) {}
  // Sessions recorded before v7 only carry a locale date string: match the last 60 days against it.
  try {
    var hist = JSON.parse(localStorage.getItem(P + 'test_history')) || [];
    var seen = {};
    hist.forEach(function (h) { if (h && h.date) seen[h.date] = 1; });
    for (var i = 0; i < 60; i++) {
      var d = new Date(); d.setDate(d.getDate() - i);
      if (seen[d.toLocaleDateString()]) set[dayKey(d)] = 1;
    }
  } catch (e) {}
  return set;
}
function markToday() {
  var k = dayKey(new Date()), list = [];
  try { list = JSON.parse(localStorage.getItem(ACT_KEY)) || []; } catch (e) {}
  if (list.indexOf(k) >= 0) return;
  list.push(k);
  try { localStorage.setItem(ACT_KEY, JSON.stringify(list.slice(-400))); } catch (e) {}
  renderHero();
}
function streak(set) {
  var d = new Date(), n = 0;
  if (!set[dayKey(d)]) d.setDate(d.getDate() - 1); // today not done yet: the streak is still alive
  while (set[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function renderHero() {
  if (!$('hero')) return;
  var set = readDays(), n = streak(set), today = !!set[dayKey(new Date())];
  $('hero-flame').classList.toggle('cold', !today);
  $('hero-count').textContent = n ? n + '-day streak' : 'Start your streak';
  $('hero-sub').textContent = today ? 'Done for today. Keep going if you are on a roll.'
    : n ? 'Answer one question today to keep it alive.'
    : 'Answer one question today to light the flame.';
  var names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], html = '';
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    html += '<span class="' + (set[dayKey(d)] ? 'done' : '') + (i === 0 ? ' now' : '') + '"><i></i>' + names[d.getDay()] + '</span>';
  }
  $('hero-week').innerHTML = html;
}
// Any answered question or rated flashcard counts as studying today.
document.addEventListener('click', function (e) {
  var t = e.target;
  if (t && t.closest && t.closest('.option, #pane-cards .btnrow .btn, #pane-cards .leitner-btns button')) markToday();
}, true);
document.querySelectorAll('[data-go]').forEach(function (b) {
  var target = document.querySelector('[data-tab="' + b.dataset.go + '"]');
  if (!target || target.hidden) { b.hidden = true; return; }
  b.addEventListener('click', function () { target.click(); });
});
document.addEventListener('study:tab', function (e) { if (e.detail.tab === 'overview') renderHero(); });
renderHero();

/* ---------- Android app ---------- */
// Called by the Android shell on Back: true = handled here.
window.__nativeBack = function () {
  if (closeMore()) return true;
  if (settings && !settings.hidden) { var x = settings.querySelector('[data-close]'); if (x) x.click(); return true; }
  var back = $('guide-back'), view = $('guide-view');
  if (back && view && view.style.display !== 'none' && view.offsetParent) { back.click(); return true; }
  var home = document.querySelector('nav.tabs button[data-tab="overview"]');
  if (home && !home.classList.contains('active')) { home.click(); return true; }
  return false;
};
})();
