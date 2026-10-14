# The Prep Hub pipeline: topic in, study app out

One engine powers every app. What changes per topic is **research** and
**content**, and both follow fixed contracts so any agent (or person) can do
a stage and the next stage can trust the result.

```
  Isaac names a topic
        |
        v
  1. RESEARCH ....... Claude (idw-1 cluster)
     Official sources only: content outline, candidate handbook, fees,
     prerequisites. Output: dossier.json (schemas/dossier.schema.json).
        |
        v
  2. SCAFFOLD ....... tools/from-dossier.mjs (deterministic, no AI)
     dossier.json -> new app folder: topic.js fully configured (tracks,
     duties, library, roadmap), empty data/ files, data/docs/ checklist.
        |
        v
  3. CONTENT ........ NotebookLM + OpenCode (idw-1 cluster)
     Sources go into a NotebookLM notebook; its quiz / flashcard /
     report artifacts are exported and converted to the data schemas.
     OpenCode writes and converts content, Claude reviews hard cases.
        |
        v
  4. VALIDATE ....... tools/validate.mjs --strict
     Schema shape, answer-position bias, duplicate keys, blueprint
     coverage vs the dossier weights. Nothing ships red.
        |
        v
  5. REVIEW + SHIP .. Muse (conductor) + Isaac
     Spot-check facts against the library originals, deploy to GitHub
     Pages, announce. Isaac approves anything public.
```

## The contracts

| Artifact | Contract | Producer | Consumer |
|---|---|---|---|
| Research dossier | `schemas/dossier.schema.json` | Claude | from-dossier, builder |
| topic.js | `schemas/topic.schema.json` | from-dossier | the engine |
| data/questions.js | `schemas/questions.schema.json` | OpenCode / NotebookLM import | the engine |
| data/cards.js | `schemas/cards.schema.json` | OpenCode / NotebookLM import | the engine |
| data/guides.js | `schemas/guides.schema.json` | Claude / NotebookLM reports | the engine |
| data/drills.js | `schemas/drills.schema.json` | OpenCode / Claude | the engine |

The engine never changes per topic. If a topic seems to need an engine
change, that is a template change: make it here, in the template, so every
app benefits, and note it in CHANGELOG.md.

## Roles at a glance

- **Claude** owns research and judgment: the dossier, source verification,
  guide writing, and reviewing generated questions for factual errors.
- **OpenCode** owns production: scaffolding, bulk content writing and
  conversion, importer/validator tooling, mechanical fixes at scale.
- **NotebookLM** owns source-grounded generation: quizzes, flashcards,
  briefing reports and audio overviews built only from the notebook's
  sources. It is a content source, never a dependency: every app works
  fully without it.
- **Muse** conducts: assigns the stages, integrates results, verifies,
  deploys, and keeps memory of where each topic stands.
- **Isaac** names topics, does the one human-only step (NotebookLM
  sign-in on idw-1), and approves publishing.

Playbooks: [RESEARCH.md](RESEARCH.md) · [BUILD.md](BUILD.md) ·
[NOTEBOOKLM.md](NOTEBOOKLM.md)
