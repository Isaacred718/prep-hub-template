#!/usr/bin/env node
/* new-topic.mjs — start a new study app with this engine and a starter topic.

   Usage:
     node tools/new-topic.mjs <target-folder> [options]

   Options:
     --name "Spanish Prep"   app name shown in the header and browser tab
     --id spanish            short slug for storage, offline cache and sync
                             (default: from the folder name; must differ from
                             every other app on the same site)
     --accent emerald        sky | violet | emerald | amber | rose | indigo
     --icon ES               1–4 letters for the generated app icon
     --sync                  reuse this app's Firebase project for Google
                             sign-in (new collection "<id>_users")
     --force                 allow a target folder that is not empty

   The new folder gets the engine files unchanged, a topic.js to edit, and
   the astronomy sample content in data/ to replace with your own. See
   TEMPLATE.md for every field and content format. No dependencies. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ENGINE = ['index.html', 'styles.css', 'settings.js', 'app.js', 'forge.js', 'auth.js', 'sw.js'];
const CONTENT = ['data/questions.js', 'data/cards.js', 'data/guides.js', 'data/drills.js', 'data/forge.js'];
const ACCENTS = ['sky', 'violet', 'emerald', 'amber', 'rose', 'indigo'];

function fail(msg) { console.error('new-topic: ' + msg); process.exit(1); }
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force' || a === '--sync' || a === '--help' || a === '-h') out[a.replace(/^-+/, '')] = true;
    else if (a.startsWith('--')) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) fail(`${a} needs a value`);
      out[a.slice(2)] = v; i++;
    } else out._.push(a);
  }
  return out;
}
const opts = parseArgs(process.argv.slice(2));
if (opts.help || opts.h || !opts._[0]) {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\s?/, ''));
  process.exit(opts._[0] ? 0 : 1);
}

const target = path.resolve(opts._[0]);
const folder = path.basename(target);
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const id = opts.id ? String(opts.id) : slug(folder).replace(/-?prep$/, '') || 'study';
const titleCase = s => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const name = opts.name || titleCase(folder);
const accent = opts.accent || 'violet';
const icon = (opts.icon || name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  .map(w => w[0]).join('').slice(0, 3) || name.slice(0, 2)).toUpperCase().slice(0, 4);

if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(`id "${id}" must be lowercase letters, digits or hyphens, starting with a letter (use --id)`);
if (!ACCENTS.includes(accent)) fail(`accent must be one of: ${ACCENTS.join(', ')}`);

// Load this app's topic.js: its id must not be reused, and --sync borrows its Firebase project.
function loadTopic(file) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;this.__t = TOPIC;', ctx);
  return ctx.__t;
}
const source = loadTopic(path.join(ROOT, 'topic.js'));
if (id === source.id) fail(`id "${id}" belongs to ${source.name}; two apps on one site must not share an id (pass --id)`);
if (opts.sync && !(source.sync && source.sync.firebase)) fail('--sync: this app has no Firebase project in topic.js to reuse');

if (fs.existsSync(target) && fs.readdirSync(target).length && !opts.force) {
  fail(`${target} is not empty (pass --force to write into it anyway)`);
}

/* ---------- write the new app ---------- */
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};
ENGINE.forEach(f => copy(path.join(ROOT, f), path.join(target, f)));
CONTENT.forEach(f => copy(path.join(ROOT, 'template', f), path.join(target, f)));
copy(path.join(ROOT, 'tools/validate.mjs'), path.join(target, 'tools/validate.mjs'));
copy(path.join(ROOT, 'TEMPLATE.md'), path.join(target, 'TEMPLATE.md'));

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
let topic = fs.readFileSync(path.join(ROOT, 'template/topic.js'), 'utf8');
function setField(re, value, label) {
  if (!re.test(topic)) fail(`template/topic.js: could not find the ${label} field`);
  topic = topic.replace(re, value);
}
setField(/^(\s*)id: '[^']*',/m, `$1id: ${q(id)},`, 'id');
setField(/^(\s*)name: '[^']*',/m, `$1name: ${q(name)},`, 'name');
setField(/^(\s*)title: '[^']*',/m, `$1title: ${q(name + ' — study app')},`, 'title');
setField(/^(\s*)accent: '[^']*',/m, `$1accent: ${q(accent)},`, 'accent');
setField(/^(\s*)iconText: '[^']*',/m, `$1iconText: ${q(icon)},`, 'iconText');
if (opts.sync) {
  const fb = source.sync.firebase;
  const lines = Object.keys(fb).map(k => `      ${k}: ${q(fb[k])}`).join(',\n');
  setField(/^(\s*)sync: null\s*$/m,
    `$1sync: {\n$1  collection: ${q(id + '_users')}, // one Firestore doc per user: ${id}_users/{uid}\n$1  firebase: {\n${lines}\n$1  }\n$1}`, 'sync');
}
fs.writeFileSync(path.join(target, 'topic.js'), topic);

const readme = fs.readFileSync(path.join(ROOT, 'template/README.md'), 'utf8')
  .replace(/\{\{NAME\}\}/g, name).replace(/\{\{ID\}\}/g, id).replace(/\{\{FOLDER\}\}/g, folder)
  .replace(/\{\{SYNC\}\}/g, opts.sync
    ? `Google sign-in is on and syncs to the Firestore collection \`${id}_users\` in the \`${source.sync.firebase.projectId}\` project. Add the security rule from TEMPLATE.md ("Google sign-in and sync") before people sign in.`
    : 'Google sign-in is off (`sync: null` in topic.js), so progress stays on each device. TEMPLATE.md explains how to turn it on.');
fs.writeFileSync(path.join(target, 'README.md'), readme);

/* ---------- next steps ---------- */
const rel = path.relative(process.cwd(), target) || '.';
console.log(`Created ${name} in ${rel}

  id: ${id}   accent: ${accent}   icon: ${icon}   sync: ${opts.sync ? id + '_users (' + source.sync.firebase.projectId + ')' : 'off'}

Next steps
  1. Try it:      cd ${rel} && python3 -m http.server 8080   → http://localhost:8080
  2. Make it yours: edit topic.js, then replace data/*.js with your content
  3. Check it:    node tools/validate.mjs
  4. Publish:     push the folder to a new GitHub repo and turn on Pages
                  (Settings → Pages → Deploy from a branch → main, / root)${opts.sync ? `
  5. Sync:        add the Firestore rule for ${id}_users (TEMPLATE.md, "Google sign-in and sync")` : ''}
`);
