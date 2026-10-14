# {{NAME}}

An offline-first study app: study guides, spaced-repetition flashcards, quizzes,
a practice-test generator, scenario drills and an endless adaptive mode, with a
settings menu for theme, accent color, text size, pass mark, timers and more.

It was created from the CTS Prep study-app template and still holds the
**astronomy sample content**. Replace it with your own subject:

1. Edit **`topic.js`**: name, tracks (levels or exams), exam length and pace, copy, goals.
2. Replace the files in **`data/`** with your content (formats are in `TEMPLATE.md`).
3. Run **`node tools/validate.mjs`** and fix anything it reports.

{{SYNC}}

## Run it locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

## Publish on GitHub Pages

Push this folder to the `main` branch of a new repo, then
**Settings → Pages → Deploy from a branch → `main` / root**.
The app is live at `https://<username>.github.io/<repo>/` within a minute or two.
Its storage id is `{{ID}}`, so it never collides with your other apps on the same site.

## Files

| File | What it is |
|---|---|
| `topic.js` | everything specific to this subject — edit this |
| `data/questions.js` | the question bank |
| `data/cards.js` | flashcards |
| `data/guides.js` | study guides |
| `data/drills.js` | scenario drills |
| `data/forge.js` | generated-question recipes for Endless mode (optional) |
| `index.html`, `styles.css`, `settings.js`, `app.js`, `forge.js`, `auth.js`, `sw.js` | the engine — identical in every app built from the template; copy newer versions over to upgrade |
| `tools/validate.mjs` | content checker |
| `TEMPLATE.md` | full guide to every field and content format |
