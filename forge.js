/* forge.js — procedural question generator (engine).

   Topic-agnostic engine file. Every FORGE.draw() builds brand-new questions:
   randomized numbers, rotated stems, sampled distractors, so depth is
   effectively unlimited. Topic content registers itself from data/forge.js:

     FORGE.calc(id, domain, cert, diff, make)  a calculation generator; make()
                                               returns { q, options, correct, explanation }
     FORGE.concepts(tables, opts)              term/definition fact tables
     FORGE.tricks(tables)                      EXCEPT / FALSE / TRUE statement sets

   FORGE.helpers has R, pick, shuf, fmt, mkOptions, lcfirst, ucfirst for
   writing generators. Generated questions match the bank's shape:
     { domain, cert, q, options[], correct, explanation, _diff, _qi, _forged }
   A generator that throws or returns a malformed question is retried with
   another draw, so draw() never throws. Pure logic, no network. */
const FORGE = (function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  // Lowercase a leading capital for mid-sentence use, leaving acronyms
  // ("EDID", "RT60", "4K") and single capitals before capitals alone.
  const lcfirst = s => /^[A-Z](?![A-Z0-9])/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const ucfirst = s => s.charAt(0).toUpperCase() + s.slice(1);
  function shuf(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // pretty number: trim to `dec` decimals, drop trailing zeros
  function fmt(n, dec) {
    const s = (+n).toFixed(dec === undefined ? 2 : dec);
    return s.indexOf('.') === -1 ? s : s.replace(/\.?0+$/, '');
  }
  // Build a 4-option array from string values; returns { options, correct }.
  // Throws when fewer than 3 unique distractors remain (draw() retries).
  function mkOptions(correctStr, distractorStrs) {
    const seen = new Set([correctStr]);
    const ds = [];
    for (const d of shuf(distractorStrs)) {
      if (!seen.has(d)) { seen.add(d); ds.push(d); }
      if (ds.length === 3) break;
    }
    if (ds.length < 3) throw new Error('mkOptions: only ' + ds.length + ' unique distractors for "' + correctStr + '"');
    const options = shuf([correctStr, ...ds]);
    return { options, correct: options.indexOf(correctStr) };
  }

  const generators = [];
  function add(g) { generators.push(Object.assign({ weight: 1 }, g)); }
  // Members of a family (one per table) share one generator's worth of
  // weight per track, so adding tables adds variety without crowding out
  // the calculation generators.
  function rebalance(family) {
    const byCert = {};
    generators.filter(g => g.family === family).forEach(g => { (byCert[g.cert] = byCert[g.cert] || []).push(g); });
    Object.keys(byCert).forEach(c => byCert[c].forEach(g => { g.weight = 1 / byCert[c].length; }));
  }

  /* ---------- calculation generators ---------- */
  function calc(id, domain, cert, diff, make) {
    add({ id, domain, cert, diff, kind: 'calc', make });
  }

  /* ---------- concept fact tables ----------
     table: { domain, cert, diff, facts: [{ t: term, d: definition }] }
     Write each term as it reads mid-sentence ("the inverse square law",
     "EDID"); it is capitalized automatically at the start of a sentence.
     One fact is asked about; distractors are other definitions from the
     same table, so wrong answers are always plausible and on-topic.
     Needs at least 4 facts per table. */
  const conceptTables = [];
  const DEFAULT_STEMS = ['Which of the following best describes {term}?', 'Which statement best defines {term}?'];
  function concepts(tables, opts) {
    const stems = (opts && opts.stems) || DEFAULT_STEMS;
    tables.forEach(table => {
      const ti = conceptTables.length;
      conceptTables.push(table);
      add({
        id: 'concept-' + ti, domain: table.domain, cert: table.cert, diff: table.diff || 2, kind: 'concept',
        make() {
          const fact = pick(table.facts);
          const distract = shuf(table.facts.filter(f => f !== fact)).slice(0, 3).map(f => f.d);
          const o = mkOptions(fact.d, distract);
          return {
            q: ucfirst(pick(stems).replace('{term}', fact.t)),
            ...o,
            explanation: `${ucfirst(fact.t)}: ${lcfirst(fact.d)}`
          };
        }
      });
      // "Does NOT belong": three terms from this table plus one outsider
      add({
        id: 'belong-' + ti, family: 'belong', domain: table.domain, cert: table.cert, diff: 2, kind: 'trick',
        make() {
          const others = conceptTables.filter(t => t !== table);
          const sameTrack = others.filter(t => t.cert === table.cert);
          const outsiderTable = pick(sameTrack.length ? sameTrack : others);
          if (!outsiderTable) throw new Error('belong: needs a second concept table');
          const homeTerms = shuf(table.facts.map(f => ucfirst(f.t))).slice(0, 3);
          const outsider = ucfirst(pick(outsiderTable.facts).t);
          const o = mkOptions(outsider, homeTerms);
          const area = table.domain.replace(/^[^:]+:\s*/, '');
          return {
            q: `Three of these terms belong to ${area}. Which one does NOT belong?`,
            ...o,
            explanation: `${outsider} belongs to ${outsiderTable.domain}, not ${table.domain}.`
          };
        }
      });
    });
    // "does NOT belong" needs an outsider table, so it waits for a second table
    generators.forEach(g => { if (g.family === 'belong') g.disabled = conceptTables.length < 2; });
    rebalance('belong');
  }

  /* ---------- trick question tables ----------
     Trick questions defeat pattern-matching: EXCEPT, NOT, TRUE/FALSE stems
     with always/never absolute traps.
     table: { domain, cert, diff, items: [{ topic, trueStmts[3+], falseStmts[3+] }] }
     `topic` reads mid-sentence ("the inverse square law"). Keep true and
     false statements to similar lengths so "pick the longest" fails. */
  function tricks(tables) {
    tables.forEach((table, i) => {
      const base = { domain: table.domain, cert: table.cert, diff: table.diff || 3, kind: 'trick' };
      const n = generators.length + '-' + i;
      add(Object.assign({}, base, {
        id: 'trick-except-' + n, family: 'trick-except',
        make() {
          const item = pick(table.items);
          const answer = pick(item.falseStmts);
          const o = mkOptions(answer, shuf(item.trueStmts).slice(0, 3));
          return {
            q: pick([`All of the following statements about ${item.topic} are true EXCEPT:`,
              `Which of the following statements about ${item.topic} is NOT true?`]),
            ...o,
            explanation: `The false statement is the answer: ${answer} The other three are accurate.`
          };
        }
      }));
      add(Object.assign({}, base, {
        id: 'trick-false-' + n, family: 'trick-false',
        make() {
          const item = pick(table.items);
          const answer = pick(item.falseStmts);
          const o = mkOptions(answer, shuf(item.trueStmts).slice(0, 3));
          return {
            q: `Which of the following statements about ${item.topic} is FALSE?`,
            ...o,
            explanation: `False: ${answer} The other three statements are accurate.`
          };
        }
      }));
      add(Object.assign({}, base, {
        id: 'trick-true-' + n, family: 'trick-true',
        make() {
          const item = pick(table.items);
          const answer = pick(item.trueStmts);
          const o = mkOptions(answer, shuf(item.falseStmts).slice(0, 3));
          return {
            q: pick([`Which of the following statements about ${item.topic} is TRUE?`,
              `Regarding ${item.topic}, which statement is accurate?`]),
            ...o,
            explanation: `True: ${answer} The other three statements are false.`
          };
        }
      }));
    });
    ['trick-except', 'trick-false', 'trick-true'].forEach(rebalance);
  }

  /* ---------- drawing ---------- */
  function wpick(list) {
    let total = 0;
    for (const g of list) total += g.weight;
    let r = Math.random() * total;
    for (const g of list) { r -= g.weight; if (r < 0) return g; }
    return list[list.length - 1];
  }
  function valid(m) {
    return !!m && typeof m.q === 'string' && m.q.length > 0 &&
      Array.isArray(m.options) && m.options.length >= 2 && m.options.length <= 6 &&
      new Set(m.options).size === m.options.length &&
      Number.isInteger(m.correct) && m.correct >= 0 && m.correct < m.options.length &&
      typeof m.explanation === 'string';
  }
  let seq = 0;
  // opts: { cert: track id or '__all', diff: 1–5 target difficulty }
  function draw(n, opts) {
    opts = opts || {};
    const cert = opts.cert || '__all';
    const target = opts.diff || 2;
    const inCert = generators.filter(g => !g.disabled && (cert === '__all' || g.cert === cert));
    if (!inCert.length) return [];
    let elig = inCert.filter(g => Math.abs(g.diff - target) <= 1);
    if (!elig.length) elig = inCert;
    const out = [];
    for (let i = 0; i < n; i++) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const g = wpick(elig);
        let made = null;
        try { made = g.make(); } catch (e) { made = null; }
        if (!valid(made)) continue;
        made.domain = made.domain || g.domain;
        made.cert = g.cert;
        made._diff = g.diff;
        made._qi = 'f' + (seq++);
        made._forged = true;
        made._gen = g.id;
        out.push(made);
        break;
      }
    }
    return out;
  }

  return {
    draw, calc, concepts, tricks, generators,
    helpers: { R, pick, shuf, fmt, mkOptions, lcfirst, ucfirst },
    tracks: () => [...new Set(generators.filter(g => !g.disabled).map(g => g.cert))],
    // introspection for tests / debugging
    info: () => generators.map(g => ({ id: g.id, domain: g.domain, cert: g.cert, diff: g.diff, kind: g.kind, weight: g.weight, disabled: !!g.disabled }))
  };
})();
