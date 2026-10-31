#!/usr/bin/env node
/* notebooklm-import.mjs — convert NotebookLM artifact exports into Prep Hub content files.

   NotebookLM (notebooklm-py) exports:
   - Quiz JSON: { title, questions: [{ question, answerOptions: [{ text, isCorrect }], hint? }] }
   - Flashcards JSON: { title, cards: [{ f, b }] }

   Usage:
     node tools/notebooklm-import.mjs <export.json> --app <app-dir> [--track <id>] [--domain <name>] [--dry-run]

   Appends converted entries to the app's data/questions.js and/or data/cards.js
   (whichever the export contains), preserving the files' existing format
   (const arrays, JSON-style entries). Converted questions satisfy
   schemas/questions.schema.json: domain (from --domain or TODO marker), options,
   correct index derived from isCorrect, explanation from hint/rationale when present.
   Flashcards map to { domain, front, back }.

   Reports correct-index distribution; warns if one position holds > 50% of keys.
   No dependencies; Node 16+.
*/

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node tools/notebooklm-import.mjs <export.json> --app <app-dir> [--track <id>] [--domain <name>] [--dry-run]');
  process.exit(1);
}

const exportPath = args[0];
const appIdx = args.indexOf('--app');
const appDir = appIdx >= 0 ? path.resolve(args[appIdx + 1]) : null;
const trackIdx = args.indexOf('--track');
const track = trackIdx >= 0 ? args[trackIdx + 1] : null;
const domainIdx = args.indexOf('--domain');
const domain = domainIdx >= 0 ? args[domainIdx + 1] : null;
const dryRun = args.includes('--dry-run');

if (!fs.existsSync(exportPath)) {
  console.error(`notebooklm-import: export file not found: ${exportPath}`);
  process.exit(1);
}
if (!appDir) {
  console.error('notebooklm-import: --app is required');
  process.exit(1);
}
if (!fs.existsSync(appDir)) {
  console.error(`notebooklm-import: app directory not found: ${appDir}`);
  process.exit(1);
}

function fail(msg) {
  console.error(`notebooklm-import: ${msg}`);
  process.exit(1);
}

let exportData;
try {
  exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
} catch (e) {
  fail(`export is not valid JSON: ${e.message}`);
}

const questionsPath = path.join(appDir, 'data', 'questions.js');
const cardsPath = path.join(appDir, 'data', 'cards.js');

if (!fs.existsSync(questionsPath) && !fs.existsSync(cardsPath)) {
  fail('app has no data/questions.js or data/cards.js');
}

const hasQuestions = Array.isArray(exportData.questions) && exportData.questions.length > 0;
const hasCards = Array.isArray(exportData.cards) && exportData.cards.length > 0;

/* Pre-flight: every content type in the export needs its target file, so an
   import never half-writes (questions appended, then cards failing). */
if (hasQuestions && !fs.existsSync(questionsPath)) fail('export has questions but the app has no data/questions.js');
if (hasCards && !fs.existsSync(cardsPath)) fail('export has cards but the app has no data/cards.js');

if (!hasQuestions && !hasCards) {
  fail('export contains neither questions nor cards in recognized format');
}

const result = {
  questionsAdded: 0,
  cardsAdded: 0,
  correctPositions: new Array(10).fill(0),
  positionCounts: [0, 0, 0, 0, 0, 0]
};

const convertedQuestions = [];
const convertedCards = [];

if (hasQuestions) {
  for (let i = 0; i < exportData.questions.length; i++) {
    const q = exportData.questions[i];
    if (!q || typeof q !== 'object') {
      fail(`question #${i + 1}: not an object`);
    }
    const questionText = q.question || q.q || '';
    if (!questionText || typeof questionText !== 'string') {
      fail(`question #${i + 1}: missing question text`);
    }
    const answerOptions = q.answerOptions || q.options || [];
    if (!Array.isArray(answerOptions) || answerOptions.length < 2) {
      fail(`question #${i + 1}: needs at least 2 answer options`);
    }

    const options = [];
    let correctIndex = -1;
    for (let j = 0; j < answerOptions.length; j++) {
      const opt = answerOptions[j];
      if (typeof opt === 'string') {
        options.push(opt);
      } else if (opt && typeof opt === 'object') {
        options.push(opt.text || opt.value || '');
        if (opt.isCorrect === true) {
          if (correctIndex !== -1) {
            fail(`question #${i + 1}: multiple correct answers marked`);
          }
          correctIndex = j;
        }
      } else {
        fail(`question #${i + 1}, option #${j + 1}: invalid option format`);
      }
    }

    if (correctIndex === -1) {
      fail(`question #${i + 1}: no correct answer marked with isCorrect`);
    }

    const explanation = q.explanation || q.rationale || q.hint || q.reason || 'TODO: add explanation';
    const qDomain = domain || q.domain || 'TODO: specify domain';

    convertedQuestions.push({
      domain: qDomain,
      q: questionText,
      options: options,
      correct: correctIndex,
      explanation: explanation,
      ...(track ? { cert: track } : {})
    });

    result.correctPositions[correctIndex] = (result.correctPositions[correctIndex] || 0) + 1;
    if (correctIndex <= 5) {
      result.positionCounts[correctIndex] = (result.positionCounts[correctIndex] || 0) + 1;
    }
    result.questionsAdded++;
  }
}

if (hasCards) {
  for (let i = 0; i < exportData.cards.length; i++) {
    const c = exportData.cards[i];
    if (!c || typeof c !== 'object') {
      fail(`card #${i + 1}: not an object`);
    }
    const front = c.front || c.f || c.question || '';
    const back = c.back || c.b || c.answer || '';
    if (!front || !back || typeof front !== 'string' || typeof back !== 'string') {
      fail(`card #${i + 1}: missing front/back`);
    }
    const cDomain = domain || c.domain || 'TODO: specify domain';
    convertedCards.push({
      domain: cDomain,
      front: front,
      back: back
    });
    result.cardsAdded++;
  }
}

const totalQ = result.questionsAdded;
if (totalQ > 0) {
  for (let i = 0; i < 4; i++) {
    const pct = (result.positionCounts[i] / totalQ) * 100;
    if (pct > 50) {
      console.warn(`WARNING: position ${i} (option index ${i}) holds ${pct.toFixed(1)}% of correct answers (>50%)`);
    }
  }
}

if (dryRun) {
  console.log('=== DRY RUN ===');
  console.log(`Export: ${exportPath}`);
  console.log(`App: ${appDir}`);
  if (track) console.log(`Track: ${track}`);
  if (domain) console.log(`Domain: ${domain}`);
  console.log('');
  console.log(`Questions to add: ${result.questionsAdded}`);
  console.log(`Cards to add: ${result.cardsAdded}`);
  if (result.questionsAdded > 0) {
    console.log(`Correct positions (by index): ${result.positionCounts.slice(0, 4).join(' / ')}`);
    console.log(`Position counts: [0:${result.positionCounts[0]},1:${result.positionCounts[1]},2:${result.positionCounts[2]},3:${result.positionCounts[3]}]`);
  }
  console.log('');
  if (convertedQuestions.length > 0) {
    console.log('Sample converted questions:');
    console.log(JSON.stringify(convertedQuestions.slice(0, 1), null, 2));
  }
  if (convertedCards.length > 0) {
    console.log('Sample converted cards:');
    console.log(JSON.stringify(convertedCards.slice(0, 1), null, 2));
  }
  process.exit(0);
}

function appendToArrayFile(filePath, items, arrayName) {
  if (items.length === 0) return;
  if (!fs.existsSync(filePath)) {
    fail(`file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let insertAt = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '];' || trimmed === ']') {
      insertAt = i;
      break;
    }
  }
  const before = lines.slice(0, insertAt);
  const after = lines.slice(insertAt);
  // Check if we need a comma before inserting - look at the line before insertAt
  let needsComma = false;
  if (insertAt > 0) {
    const prevLine = lines[insertAt - 1].trim();
    if (prevLine && prevLine !== '' && !prevLine.endsWith(',') && prevLine !== '{' && prevLine !== '[' && !prevLine.startsWith('//')) {
      // If the previous non-empty non-comment line doesn't end with comma and looks like an object end
      if (prevLine.endsWith('}')) {
        needsComma = true;
      }
    }
  }
  const itemLines = items.map((item, idx) => {
    const json = JSON.stringify(item, null, 2);
    const indented = json.split('\n').map(line => '  ' + line).join('\n');
    return indented;
  });
  let newContent = before.join('\n');
  if (needsComma) {
    newContent += ',\n';
  } else {
    newContent += '\n';
  }
  newContent += itemLines.join(',\n') + '\n';
  newContent += after.join('\n');
  fs.writeFileSync(filePath, newContent);
}

/* Dedupe against what is already in the app (re-running an import is a
   no-op): questions match on text, cards on domain + front. */
function loadArray(file) {
  try {
    const m = fs.readFileSync(file, 'utf8').match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
    return m ? eval(m[1]) : [];
  } catch (e) { return []; }
}
let skippedQ = 0, skippedC = 0;
if (convertedQuestions.length && fs.existsSync(questionsPath)) {
  const seen = new Set(loadArray(questionsPath).map(q => q.q));
  const before = convertedQuestions.length;
  for (let i = convertedQuestions.length - 1; i >= 0; i--) {
    if (seen.has(convertedQuestions[i].q)) convertedQuestions.splice(i, 1);
  }
  skippedQ = before - convertedQuestions.length;
}
if (convertedCards.length && fs.existsSync(cardsPath)) {
  const seen = new Set(loadArray(cardsPath).map(c => c.domain + '\n' + c.front));
  const before = convertedCards.length;
  for (let i = convertedCards.length - 1; i >= 0; i--) {
    const c = convertedCards[i];
    if (seen.has(c.domain + '\n' + c.front)) convertedCards.splice(i, 1);
  }
  skippedC = before - convertedCards.length;
}

result.questionsAdded = convertedQuestions.length;
result.cardsAdded = convertedCards.length;
appendToArrayFile(questionsPath, convertedQuestions, 'QUESTIONS');
appendToArrayFile(cardsPath, convertedCards, 'CARDS');
if (skippedQ || skippedC) console.log(`Skipped as duplicates: ${skippedQ} questions, ${skippedC} cards`);

console.log('=== IMPORT COMPLETE ===');
console.log(`Export: ${exportPath}`);
console.log(`App: ${appDir}`);
if (track) console.log(`Track: ${track}`);
if (domain) console.log(`Domain: ${domain}`);
console.log('');
console.log(`Questions added: ${result.questionsAdded}`);
console.log(`Cards added: ${result.cardsAdded}`);
if (result.questionsAdded > 0) {
  console.log(`Correct positions (by index): ${result.positionCounts.slice(0, 4).join(' / ')}`);
  console.log(`Position counts: [0:${result.positionCounts[0]},1:${result.positionCounts[1]},2:${result.positionCounts[2]},3:${result.positionCounts[3]}]`);
}

