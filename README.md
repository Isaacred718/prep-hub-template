# Prep Hub Template

A topic-agnostic study app engine — guides, Leitner flashcards, quizzes, a
practice-test generator, scenario drills, endless adaptive mode, settings,
offline mode and optional Google sign-in — plus the **agent pipeline** that
fills it for any topic:

- **Claude researches** the topic (official blueprint, handbook, fees,
  sources) into a structured **research dossier**.
- **`tools/from-dossier.mjs`** turns the dossier into a configured app.
- **NotebookLM** generates source-grounded quizzes, flashcards and
  briefing reports from the topic's own documents.
- **OpenCode builds** the content to fixed schemas and validates it.

The reference implementation is the AVIXA hub
([CTS-Prep](https://github.com/Isaacred718/CTS-Prep), live at
isaacred718.github.io/CTS-Prep): 530 questions across CTS / CTS-D / CTS-I,
duty-weighted readiness against the official blueprints, the official PDF
library, and a certification roadmap — all of it expressed as topic
configuration, zero engine changes.

## Use this template

**Generate a repo from it** (this repository is a GitHub template), or
scaffold locally:

```bash
# from a dossier (the pipeline path)
node tools/from-dossier.mjs dossier.json ../my-topic-app

# or start from the bundled astronomy sample
node tools/new-topic.mjs ../my-topic-app --name "My Topic" --id mytopic
```

Open the folder, everything already works with the sample content.
Replace `topic.js` and `data/`, then gate with:

```bash
node tools/validate.mjs . --strict
```

## Where things live

| Path | What it is |
|---|---|
| `app.js`, `settings.js`, `auth.js`, `forge.js`, `styles.css`, `index.html`, `sw.js` | The engine. Topic-agnostic; never edited per topic. |
| `topic.js` + `data/` | One app's topic: config and content. This repo ships a small astronomy sample so the template runs as-is. |
| `schemas/` | The contracts: dossier, topic, questions, cards, guides, drills (JSON Schema). |
| `pipeline/` | The agent playbooks: `WORKFLOW.md` (the whole flow), `RESEARCH.md` (Claude), `BUILD.md` (OpenCode), `NOTEBOOKLM.md` (NotebookLM). |
| `tools/from-dossier.mjs` | Dossier → app scaffold (deterministic). |
| `tools/new-topic.mjs` | Sample → new app scaffold. |
| `tools/validate.mjs` | Content gate: schema shape, bias checks, progress-key safety. |
| `TEMPLATE.md` | Every topic.js field and content format, in prose. |

## The one rule

If a topic seems to need an engine change, it is a **template** change:
make it here so every app benefits, and log it in `CHANGELOG.md`.
Topic-specific data (blueprints, document lists, roadmaps) lives in
`topic.js`, always.
