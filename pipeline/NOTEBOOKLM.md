# NOTEBOOKLM.md — NotebookLM's role: source-grounded content generation

NotebookLM (Google; rebranded "Gemini Notebook" in 2026, same product)
holds a topic's approved sources and generates study material **only from
them**: quizzes, flashcards, briefing reports, mind maps and audio
overviews. In this pipeline it is a content factory whose output is
exported, converted to the app schemas, validated, and reviewed. The app
never calls NotebookLM at runtime.

## Where it runs

On **idw-1**, through the unofficial `notebooklm-py` CLI (v0.8.5),
installed at `~/.local/share/notebooklm-venv/bin/notebooklm`.
There is no official API for personal accounts; this tool drives a
logged-in Google session, so it can break when Google changes internals.
That is acceptable: every stage degrades gracefully to Claude/OpenCode
writing content directly.

**The one human-only step:** the first sign-in. Isaac runs
`notebooklm login` once on idw-1 (real Google browser sign-in; nobody
else types his password, ever). Check state with `notebooklm doctor`.

## Per-topic flow

1. **Create the notebook** named in the dossier's `notebooklm` section:
   `notebooklm create "<Topic> — Prep Hub sources"`.
2. **Add the sources** — the dossier's public source URLs and the PDFs
   already fetched into the app's `data/docs/`:
   `notebooklm source add <url-or-file>` for each, then
   `notebooklm source wait` until all are indexed.
3. **Generate artifacts** per the dossier (`quiz`, `flashcards`,
   `report` by default):
   `notebooklm generate quiz` / `generate flashcards` /
   `generate report`, then `notebooklm download <type>` to export.
   Quiz and flashcard exports are structured (JSON/Markdown) — that is
   what makes them importable.
4. **Run the dossier's chat prompts** (`notebooklm ask "..."`) to draft
   guide material grounded in the sources; save answers as notes.
5. **Hand off.** Exports land in the app workspace's `imports/` folder.
   OpenCode converts them with `tools/notebooklm-import.mjs`, tags them
   with dossier domains/duties, balances answer positions, adds missing
   explanations, and validates. NotebookLM output is a draft, never
   shipped raw: its quizzes can be shallow, and its "correct" flags must
   be re-checked against the sources like any other content.

## What NotebookLM is best at here

- First drafts of questions and flashcards at volume, grounded in the
  official documents instead of model memory.
- Briefing reports that become study guides after a schema rewrite.
- Audio overviews as a study asset linked from the app (optional;
  generated files are large, host them as downloads, not in the repo).

## Limits to respect

- One notebook per topic; sources are the dossier's approved list only —
  no random web content, or the grounding guarantee is gone.
- Session lives on idw-1 only. Do not copy `~/.notebooklm` profiles off
  the machine.
- If the CLI breaks after a Google change, note it and fall back to the
  manual web UI (same flow, by hand) or skip the stage entirely.
