/* topic.js — everything that makes this app about its subject lives here.

   This is the starter topic from the study-app template (a small astronomy
   sample that exercises every feature). Edit the fields below, replace the
   files in data/ with your own content, then run
     node tools/validate.mjs
   to check it. TEMPLATE.md documents every field and content format.

   Written as a plain `var` (no window/document) so the service worker can
   importScripts() it as well. */
var TOPIC = {
  // Short slug (lowercase letters, digits, hyphens). It namespaces local
  // storage keys, the offline cache and the cloud collection, so every app on
  // the same site (username.github.io/...) needs its own. Never change it
  // once people have progress saved.
  id: 'astro',

  name: 'Astro Prep',
  title: 'Astro Prep — astronomy study app',
  version: '1.0',

  // Default accent color: sky | violet | emerald | amber | rose | indigo.
  accent: 'violet',
  // Letters on the generated home-screen / favicon icon (1–4 characters).
  iconText: 'AST',

  // Tracks are separate exams, certifications or levels. Every question
  // carries `cert` set to one of these ids. Keep just one entry and every
  // track selector hides itself (questions can then omit `cert`).
  trackLabel: 'Level',
  tracks: [
    { id: 'BASICS', label: 'Basics' },
    { id: 'ADV', label: 'Advanced' }
  ],
  defaultTrack: 'BASICS',

  exam: {
    passMark: 70, // default pass heuristic; adjustable in Settings
    lengths: [
      { n: 10, label: 'Quick' },
      { n: 20, label: 'Standard', default: true },
      { n: 30, label: 'Full mock' }
    ],
    // Exam pace for the practice-test timer: simMinutes for simQuestions.
    simQuestions: 30,
    simMinutes: 40,
    disclaimer: 'Treat this as a practice benchmark, not an official score.'
  },

  // Domains that start with this prefix get a violet "beyond the core" tag.
  // Leave empty to turn the styling off.
  advancedPrefix: '',

  // User-facing copy. {questions} {cards} {guides} {drills} and {track:ID}
  // are replaced with live counts. Any key can be left out for a default.
  copy: {
    blurb: 'A sample topic that shows every feature of the template: {questions} questions across two levels, ' +
      '{cards} flashcards, {guides} study guides and {drills} scenario drills, plus generated questions in Endless mode. ' +
      'Replace it with your own subject — see TEMPLATE.md.',
    readinessTitle: 'Readiness',
    careersTitle: 'Goals',
    careersIntro: 'Ranked by your readiness in the domains each goal leans on.',
    drillsIntro: 'Short observing and reasoning scenarios that end in a decision.'
  },

  // Optional goals / career targets, ranked by readiness in their domains.
  // Delete every entry to hide the card.
  careers: [
    { title: 'Backyard observer', domains: ['Earth & Moon', 'Light & Telescopes'],
      why: 'Plans observing nights and picks the right gear for the sky overhead.' },
    { title: 'Planetarium guide', domains: ['Solar System', 'Earth & Moon', 'Stars'],
      why: 'Explains the sky to visitors and answers the questions they actually ask.' },
    { title: 'Astronomy student', domains: ['Stars', 'Galaxies & Cosmology', 'Light & Telescopes'],
      why: 'Ready for an intro astrophysics course: stellar lives, light and the expanding universe.' }
  ],

  // Endless mode level names, easiest first (exactly five).
  levels: ['Stargazer', 'Observer', 'Navigator', 'Astronomer', 'Astrophysicist'],

  // Endless mode auto-tags question difficulty 1–5 from stem length plus
  // these signal words (regular-expression source, case-insensitive). A
  // question can also set `diff: 1..5` explicitly.
  difficulty: {
    hard: 'calculat|scenario|why|explain|most likely|except|compare|how long|how far|how many',
    easy: '^(what is|which planet|which object)'
  },

  // Endless mode brings repeats back rephrased; these lead-ins rotate in.
  rephrasePrefixes: ['Quick check: ', 'Think it through: ', 'Once more: '],

  // Google sign-in + cloud progress sync (Firebase). null = this device only,
  // and the sign-in button is hidden. TEMPLATE.md explains how to turn it on.
  sync: null
};
