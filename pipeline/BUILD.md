# BUILD.md — OpenCode's playbook: turn a dossier into an app

You are the build stage of the Prep Hub pipeline. Input: a validated
`dossier.json` (see pipeline/RESEARCH.md). Output: a working app folder
plus its content, valid against the schemas in `schemas/` and clean under
`tools/validate.mjs --strict`.

## Steps

1. **Scaffold.**
   ```bash
   node tools/from-dossier.mjs dossier.json ../<topic-app-dir>
   ```
   This writes the engine files unchanged, generates `topic.js` from the
   dossier (tracks, exam, duties, library, roadmap, copy), creates empty
   `data/` files and `data/docs/SOURCES.md` listing what to download.
   Never edit engine files for a topic. If the engine cannot express
   something, stop and report it; engine changes belong to the template.

2. **Fetch the library.** Download every dossier source with a
   `localFile` into `data/docs/` under exactly that name. Verify each
   file is a real PDF (`file` reports PDF document, size > 10 KB). Gated
   sources are skipped and noted, never fetched from unofficial mirrors.

3. **Write content to the dossier's targets.**
   - Questions: blueprint-proportioned (duty share of the track's
     questions ≈ duty weight). Every question: `domain` from the
     dossier's domain list verbatim, `cert` = track id, `duty`/`task`
     from the blueprint, 4 options, a real explanation that teaches the
     point (not "B is correct").
   - **Answer-position discipline:** the key is correct because of
     content, never because it is the longest or most detailed option.
     Write distractors at matching length and specificity. The validator
     reports the longest-answer rate; keep it near chance (~25–30%).
   - Cards: at minimum the dossier's `cardsPerDomain`, domain names
     identical to the questions.
   - Guides: the dossier's guide list, in the guides schema's light
     markdown. NotebookLM report exports (see NOTEBOOKLM.md) are the
     preferred draft source; rewrite into the schema, keep the facts,
     drop the citation markers.
   - Drills: scenario first, decision last; group by duty name.
   - Imported NotebookLM quizzes/flashcards arrive as JSON; convert with
     the importer (tools/notebooklm-import.mjs), then treat them like
     any other draft: tag, balance, explain, validate.

4. **Validate.** `node tools/validate.mjs <app-dir> --strict` must pass.
   Fix content, not the validator. Report the final counts per track and
   per duty next to the dossier weights.

5. **Self-check facts.** Sample 10% of the questions against the library
   originals. Any question whose key depends on a fact you cannot find in
   an official source gets flagged in your report, not silently kept.

## Rules

- Formats are contracts: exact field names from the schemas, no extras,
  no renames, no per-app improvisation.
- One topic per branch; commit messages name the stage
  (`content: CTS-D questions batch 2 (40q, duties A–D)`).
- Do not publish. The conductor reviews, deploys and announces.
