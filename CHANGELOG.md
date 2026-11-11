# Changelog — Prep Hub Template

## 1.0 (2026-10-13)

Template extracted from the AVIXA CTS Prep Hub, with the pipeline that
builds new topic apps:

- Engine is now fully topic-driven: the AVIXA duty tables, document
  library and certification roadmap that used to be hardcoded in app.js
  moved to `topic.js` (`duties`, `library`, `roadmap`). Library and
  Roadmap tabs hide when a topic does not configure them; sw.js derives
  its offline document cache from `topic.js` instead of a hardcoded list.
- `schemas/` — JSON Schema contracts for the research dossier, topic
  config, questions, cards, guides and drills.
- `pipeline/` — WORKFLOW plus per-agent playbooks: RESEARCH (Claude),
  BUILD (OpenCode), NOTEBOOKLM (source-grounded generation on idw-1 via
  notebooklm-py).
- `tools/from-dossier.mjs` — deterministic dossier → app scaffolding.
- Root content is the astronomy sample (runs as-is); the CTS hub remains
  the reference implementation in its own repo.

## 1.1 (2026-10-16)
- Installable + offline on any device: tools/make-icons.mjs generates
  real PNG icons (192/512/180) and manifest.json; new-topic.mjs and
  from-dossier.mjs emit them automatically; index.html links them;
  sw.js precaches them; Settings → About gains an Install app button;
  the app requests persistent storage for its offline copy.

## 1.2 (2026-10-31)
- Integrated the two cluster pilots. tools/notebooklm-import.mjs
  (OpenCode, branch tools/notebooklm-import) converts notebooklm-py quiz
  and flashcard exports into app content; hardened in review with a
  pre-flight target check (no half-written imports) and deduplication,
  with sample exports in tools/fixtures/notebooklm/.
- pipeline/examples/dante-l1-dossier.json (+ summary): the Dante
  Certification Level 1 research dossier (Claude, branch
  pilot/dante-l1-dossier), validated against schemas/dossier.schema.json;
  scaffolds cleanly with from-dossier.mjs.
- Fixes found during integration: the app now sets document.title from
  the topic config, and new-topic/from-dossier stamp the static <title>
  in index.html (generated apps no longer show a generic "Study" tab).

## 2.0 (2026-11-11)

- New look and navigation for every topic app: bundled rounded type, solid
  cards, big pressable buttons, a five-slot tab bar (Home, Guides, Cards,
  Quiz, More) with the other sections in a drag-to-close More sheet, and a
  Home card with a day streak and one-tap starts. New engine files:
  `ui.js` and `fonts/`.
- `android/` packages a topic app as an Android APK and a Meta Quest panel
  APK that work with no connection (see `android/README.md`). Copy the
  folder into a topic app and edit `android/app.properties`.
- Google sign-in is hidden inside the Android app, which shows "Saved on
  device" instead.
