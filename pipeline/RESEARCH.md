# RESEARCH.md — Claude's playbook: turn a topic into a dossier

You are the research stage of the Prep Hub pipeline. Isaac names a topic
(usually a certification or a structured body of knowledge). You return
**one file**: `dossier.json`, valid against
`schemas/dossier.schema.json`. Everything downstream — the app scaffold,
the question bank, the NotebookLM notebook — is generated from it, so
errors here multiply. Verify against primary sources; do not work from
memory of a syllabus.

## What to find, in order

1. **The governing body and the official exam/programme page.** Confirm the
   topic exists as named, its tracks (exams, levels, certifications) and
   how they relate: prerequisites, forced order, standalone tracks.
2. **The exam content outline (blueprint).** This is the most important
   document. Transcribe it faithfully:
   - per track: duties (or domains) with **official weights**,
   - per duty: the task list with ids (A1, A2, ...) and names.
   Weights must sum to 100 per track; if the published weights do not,
   record what the document says and flag it in `researchNotes`.
3. **The candidate handbook.** Eligibility, exam format (question count,
   pilot questions, minutes), scoring, retake policy, ID requirements,
   validity/renewal. Feeds `exam`, the roadmap checklists and the
   disclaimer. The disclaimer must say scores here are a study signal
   unless the body publishes a true pass mark.
4. **Fees.** Current published schedule per track (member / non-member,
   retest), with the currency. State only what the posting says; never
   estimate a price.
5. **Supporting official documents.** Formula sheets, code of ethics,
   renewal charts, glossaries. Each becomes a `sources` entry; public
   PDFs that may ship with the app get a `localFile` name
   (`lowercase_with_underscores.pdf`).
6. **Study domains for the app.** Map the blueprint into app domains:
   `<Track>: <Domain>` names, each tied to its main duty. Domains are how
   readiness is reported, so keep them stable and use them verbatim later.

## Rules

- **Primary sources only.** The governing body's own site and documents.
  Third-party blogs may point you to a document; they are never the
  citation. Record the canonical URL for every source.
- **Gated is a fact, not a failure.** If a document needs a login,
  membership or purchase, set `gated: true`, say so in `researchNotes`,
  and continue with what is public. Never invent the contents of a gated
  document.
- **Dates matter.** Record the edition/date of every outline and handbook
  in its source `description`. Blueprints change; a dossier built on a
  superseded outline is worse than none.
- **Conflicts are recorded, not resolved silently.** Two official pages
  disagreeing goes in `researchNotes` with both values.
- **Copyright discipline.** Outlines are transcribed as structure — duty
  and task *names and weights* (facts) — never as copied prose. Handbook
  content is summarized, not reproduced.
- **Content targets are realistic.** Base `questionsPerTrack` on the
  exam's size and the blueprint weights (a 38% duty deserves roughly
  double the questions of a 19% duty). Note the intended split in
  `researchNotes`.

## The NotebookLM section

Fill `notebooklm` with: the notebook title (`<Topic> — Prep Hub sources`),
every public source URL worth grounding on, the generated artifacts to
request (default: quiz, flashcards, report), and 3–6 chat prompts that
will draft the study guides from the sources (e.g. "Write a one-page
guide to <duty> for a first-time candidate, with worked examples").

## Deliverable

`dossier.json` plus a short summary for the conductor: tracks and weights
headline, what is gated, anything uncertain. If the topic has no official
blueprint at all (a general subject, not a certification), say so: duties
stay empty, domains come from the subject's standard structure, and
readiness falls back to per-domain scoring.
