# Make a study app for any topic

CTS Prep runs on a topic-agnostic engine. Everything about CTS lives in
`topic.js` and the files in `data/`. Swap those and you have the same app
(guides, Leitner flashcards, quizzes, the practice-test generator, scenario
drills, endless adaptive mode, settings, offline mode and optional Google
sign-in) for a completely different subject.

> **Shortcut:** in a Claude Code session on this repo, ask *"Make a new study
> app for &lt;topic&gt; with tools/new-topic.mjs and TEMPLATE.md"*. Everything
> below is what that involves.

## The pipeline (research → app, with agents)

For a topic with an official structure (a certification, a syllabus), the
fastest path is the pipeline in `pipeline/`: Claude researches the topic
into a **dossier** (`schemas/dossier.schema.json`), `tools/from-dossier.mjs`
scaffolds the app from it, NotebookLM and OpenCode produce the content,
and `tools/validate.mjs --strict` gates shipping. Start with
`pipeline/WORKFLOW.md`. The manual path below works too.

## 1. Create the app

```bash
node tools/new-topic.mjs ../spanish-prep --name "Spanish Prep" --id spanish --accent emerald --icon ES
```

| Option | What it does |
|---|---|
| `--name` | App name in the header and browser tab |
| `--id` | Short slug (lowercase letters, digits, hyphens). It namespaces local storage, the offline cache and the cloud collection, so it must differ from every other app on the same site (`cts` is taken). Never change it after people have progress. |
| `--accent` | Default accent: `sky`, `violet`, `emerald`, `amber`, `rose`, `indigo` (each visitor can still pick their own in Settings) |
| `--icon` | 1–4 letters drawn on the generated home-screen icon |
| `--sync` | Reuse this app's Firebase project for Google sign-in, in a new collection `<id>_users` (see section 7) |
| `--force` | Write into a folder that is not empty |

The new folder is a complete, working app holding the **astronomy sample
content** from `template/`: open it and every feature already works. Then make it yours.

**Without Node:** copy the seven engine files (`index.html`, `styles.css`,
`settings.js`, `app.js`, `forge.js`, `auth.js`, `sw.js`) plus `template/topic.js`
and `template/data/` into a new folder, and edit `id` and `name` in `topic.js`.

## 2. Configure `topic.js`

| Field | Meaning |
|---|---|
| `id` | Storage namespace (see above). |
| `name`, `title` | Header name and browser-tab title. |
| `version` | Shown in Settings → About and used by *Check for updates*. Bump it when you publish changes. |
| `accent`, `iconText` | Default accent color and icon letters. |
| `trackLabel`, `tracks`, `defaultTrack` | Tracks are separate exams, certifications or levels (`[{ id, label }]`). Every question's `cert` names one. **One track hides every track picker**, and questions can then leave `cert` out. `trackLabel` is what a track is called in the UI ("Certification", "Level", "Exam"). |
| `exam.passMark` | Default pass heuristic in % (people can change it in Settings). |
| `exam.lengths` | Practice-test length buttons: `[{ n, label, default? }]`. The last one is treated as the full-length mock. |
| `exam.simQuestions`, `exam.simMinutes` | Exam pace for the practice-test timer, e.g. 110 questions in 150 minutes. |
| `exam.disclaimer` | One sentence shown under scores and readiness. |
| `advancedPrefix` | Domains that start with this (e.g. `"Advanced:"`) get a violet tag marking content beyond the core. `''` turns it off. |
| `copy` | Text for the dashboard and a few cards: `blurb`, `readinessTitle`, `careersTitle`, `careersIntro`, `drillsIntro`, and optionally `studyLoop` (an array of steps). `{questions}`, `{cards}`, `{guides}`, `{drills}` and `{track:ID}` expand to live counts. |
| `careers` | Optional goals ranked by your readiness: `[{ title, domains: [...], why }]`. An empty array hides the card. |
| `levels` | Five Endless-mode level names, easiest first. |
| `difficulty.hard`, `difficulty.easy` | Regular-expression words that push a question's auto-tagged Endless difficulty up or down (a question can set `diff: 1..5` instead). |
| `rephrasePrefixes` | Lead-ins rotated onto repeated questions in Endless mode. |
| `labels` | Optional tab renames, e.g. `{ drills: 'Cases', test: 'Mock exam' }`. Tabs with no content (no guides, cards or drills) hide themselves. |
| `sync` | `null` for this-device-only, or `{ collection, firebase: {...} }` for Google sign-in (section 7). |
| `duties` | Optional official blueprint per track: `{ <trackId>: { weights: { A: 35, ... }, names: { A: '...', ... } } }`. Drives the duty-weighted readiness on the home page. Comes from the research dossier; a track without an entry falls back to domain-only readiness. |
| `library` | Optional Document Library tab: `{ title, intro, groups: [{ cert, docs: [[file, title, desc], ...] }] }`. Files live in `data/docs/` and are cached offline. No `library` (or no groups) hides the tab. |
| `roadmap` | Optional Roadmap tab: `{ title, intro, footer (HTML), tracks: [{ id, status, note, items: [...] }] }` — one checklist per track, in order. No `roadmap` hides the tab. |

## 3. Write the content

All five files are plain JavaScript arrays (JSON syntax works). Domain names
are free text, but use **exactly the same domain names** in questions and
flashcards: readiness combines both per domain.

### Questions — `data/questions.js`

```js
const QUESTIONS = [
  {
    "domain": "Grammar",            // groups results, filters and readiness
    "cert": "A1",                    // a track id from topic.js (optional with one track)
    "q": "Which article goes with 'agua' in the singular?",
    "options": ["la", "el", "los", "las"],   // 2–6 options
    "correct": 1,                    // index into options
    "explanation": "Feminine nouns that start with a stressed 'a' take 'el' in the singular: el agua fría.",
    "diff": 3                        // optional 1–5 difficulty for Endless mode
  }
];
```

Options are shuffled on screen in every mode, so `correct` can be any index.

### Flashcards — `data/cards.js`

```js
const CARDS = [
  { "domain": "Grammar", "front": "Ser vs. estar", "back": "Ser for identity and traits; estar for states and location." }
];
```

`domain + front` must be unique: together they are the card's progress key.
Settings → *Flashcards show first* lets people study back-to-front.

### Study guides — `data/guides.js`

```js
const GUIDES = [
  { "title": "The subjunctive in one page", "domain": "Grammar",
    "body": "Intro paragraph.\n\n## A heading\n\n- a bullet with **bold**\n1. a numbered step\n\n### A subheading\n\nMore text with `code`." }
];
```

The body supports `##` / `###` headings, `-` bullets, `1.` numbered lists,
`**bold**`, `*italic*` and `` `code` ``. Keep a "How to use this app" guide
(the sample has one you can reuse as is).

### Scenario drills — `data/drills.js`

```js
const DRILLS = [
  {
    "duty": "Speaking",              // results are grouped by duty
    "task": "Order at a café",       // optional sub-label
    "scenario": "The waiter asks: ¿Qué le pongo?",
    "question": "What is the most natural reply?",
    "options": ["Me pone un café, por favor", "Yo pongo un café", "Pon me café", "Café es bueno"],
    "correct": 0,
    "explanation": "'Me pone…' mirrors the waiter's verb and is the everyday way to order in Spain."
  }
];
```

### Generated questions — `data/forge.js` (optional)

The forge builds brand-new questions on every draw for Endless mode
(*Generated* and *Mixed* sources). Leave the function body empty to skip it,
and Endless uses the bank. Three building blocks:

```js
(function (F) {
  const { R, pick, fmt, mkOptions } = F.helpers; // R(a,b) random int, pick(arr), fmt(n, decimals)

  // 1. Calculations: new numbers every draw.
  F.calc('percent-off', 'Shopping', 'A1', 2, () => {  // id, domain, track, difficulty 1–5
    const price = pick([40, 60, 80]), pct = pick([10, 20, 25]);
    const off = price * pct / 100, ans = price - off;
    // mkOptions(answer, wrongAnswers) needs 3+ distinct wrong answers; it shuffles for you.
    // Good wrong answers are real slips: the discount itself, adding it, subtracting the bare percent.
    const o = mkOptions(`$${fmt(ans)}`, [`$${fmt(off)}`, `$${fmt(price + off)}`, `$${price}`, `$${price - pct}`]);
    return { q: `A $${price} jacket is ${pct}% off. What does it cost?`, ...o,
             explanation: `${pct}% of $${price} is $${fmt(off)}, so it costs $${price} − $${fmt(off)} = $${fmt(ans)}.` };
  });

  // 2. Concept tables: term ↔ definition; wrong answers come from the same table (4+ facts each).
  F.concepts([
    { domain: 'Vocabulary', cert: 'A1', diff: 2, facts: [
      { t: 'la biblioteca', d: 'A place where you borrow books.' },      // t reads mid-sentence
      { t: 'la librería', d: 'A shop where you buy books.' },
      { t: 'el ayuntamiento', d: 'The town hall.' },
      { t: 'la farmacia', d: 'Where you buy medicine.' }
    ] }
  ], { stems: ['Which of the following best describes {term}?'] });     // stems are optional

  // 3. Trick tables: EXCEPT / NOT / TRUE / FALSE questions (3+ true and 3+ false per item).
  F.tricks([
    { domain: 'Grammar', cert: 'A1', diff: 3, items: [
      { topic: 'gendered nouns',
        trueStmts: ['Most nouns ending in -o are masculine.', 'Most nouns ending in -a are feminine.', 'El día is masculine despite its -a.'],
        falseStmts: ['Every noun ending in -a is feminine.', 'Nouns have no gender in Spanish.', 'La problema is the correct form.'] }
    ] }
  ]);
})(FORGE);
```

Concept tables also produce *"Which term does NOT belong?"* questions
automatically when there are at least two tables. A generator that throws or
returns duplicate options is retried with another draw, so a bad one can
never freeze a run, but the validator flags it.

## 4. Check it

```bash
node tools/validate.mjs            # or: node tools/validate.mjs path/to/app
node tools/validate.mjs --strict   # warnings fail too (handy before publishing)
```

**Errors** are problems that break the app or lose progress: a bad
`correct` index, duplicate flashcard keys, an unknown track, a broken
generator. **Warnings** are quality problems:

- **The answer-length tell.** If the correct answer is usually the longest
  option, "pick the longest" passes without knowing anything. The validator
  lists the biggest giveaways (correct answers 10%+ longer than every wrong
  one); aim for none, with the correct answer being the longest only about a
  quarter of the time.
- Flashcard domains with no questions, careers pointing at empty domains,
  and generators that fail often.

## 5. Try it locally

```bash
python3 -m http.server 8080   # in the app folder, then open http://localhost:8080
```

Opening `index.html` straight from disk also works, apart from offline mode
and sign-in.

## 6. Publish on GitHub Pages

1. Create a repo (say `spanish-prep`) and push the app folder to `main`, with `index.html` at the root.
2. **Settings → Pages → Deploy from a branch → `main` / root.**
3. It is live at `https://<username>.github.io/spanish-prep/` in a minute or two.

Several apps can live side by side on `<username>.github.io`: each one keeps
its own progress, offline copy and settings, because they are namespaced by
`id`. The offline worker fetches fresh files on every online load, so new
deploys show up without bumping anything. Bump `version` anyway so *Check for
updates* can tell people.

## 7. Google sign-in and sync (optional)

With `sync: null` the app works fully on each device and hides the sign-in
button. To sync progress across devices with Google sign-in:

1. **Reuse the CTS Prep Firebase project** (simplest): scaffold with `--sync`,
   or copy the `sync` block from CTS Prep's `topic.js` and set `collection` to
   `<id>_users`. The project already allows sign-in from `isaacred718.github.io`.
   For a different domain, add it under Firebase console → Authentication →
   Settings → Authorized domains.
2. **Allow the collection** in Firestore → Rules. Add this block once, next to
   the existing rules (don't replace them), and it covers every study app's
   `*_users` collection:

   ```
   match /{collection}/{uid} {
     allow read, write: if collection.matches('[a-z][a-z0-9-]*_users')
                        && request.auth != null && request.auth.uid == uid;
   }
   ```

   `firestore.rules` in this repo has the full set.

Each user gets one document, `<collection>/{uid}`, holding flashcard boxes,
session history, Endless personal bests and study settings. Appearance
settings stay on each device. On sign-in the newer side wins, by `updatedAt`.

## 8. Writing questions that teach

- **Distractors should be plausible.** Use real misconceptions, the right
  answer to a neighboring question, or a common calculation slip — never
  joke answers ("the rack's paint color").
- **Match lengths and detail.** Write the wrong answers with the same
  structure and precision as the right one.
- **Mix in the hard stems:** "Which is NOT…", "All of the following EXCEPT…",
  scenarios that end in a decision, and calculations.
- **Every explanation should teach:** say why the answer is right *and* what
  makes the tempting wrong answer wrong.
- **Keep facts consistent** across questions, flashcards and guides. A
  contradiction costs more trust than a missing fact.

## 9. Upgrading an app later

The seven engine files are identical in every app built from the template.
To pick up engine improvements, copy the newer `index.html`, `styles.css`,
`settings.js`, `app.js`, `forge.js`, `auth.js` and `sw.js` over the old ones.
Your `topic.js` and `data/` stay untouched, and people's progress carries over.

## How the engine fits together

| File | Role |
|---|---|
| `index.html` | App shell. Loads `topic.js` first and applies saved theme settings before the first paint. |
| `topic.js` | Topic configuration (the only file besides `data/` that differs between apps). |
| `settings.js` | Settings store, theme/accent/text size, the Settings sheet, export/import, update check. |
| `app.js` | Tabs, readiness, guides, flashcards, quiz, practice tests, drills, Endless mode, keyboard shortcuts. |
| `forge.js` | Question-generator engine; `data/forge.js` registers the topic's generators. |
| `auth.js` | Google sign-in and Firestore sync (offline-first; does nothing when `sync` is `null`). |
| `sw.js` | Offline service worker (network-first, caches namespaced by `id`). |
| `tools/new-topic.mjs` | Scaffolds a new app from the engine + `template/`. |
| `tools/validate.mjs` | Content checker. |
| `template/` | The starter topic (astronomy sample) the scaffold copies. |
