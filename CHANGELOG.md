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
