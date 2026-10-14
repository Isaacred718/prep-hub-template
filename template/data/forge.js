// Question forge content: generators that build brand-new questions on every
// draw for Endless mode ("Generated" and "Mixed" sources). Optional — delete
// the body of this function and Endless simply uses the question bank.
//
// Three building blocks (see TEMPLATE.md for details):
//   F.calc(id, domain, track, difficulty 1–5, make)  — make() returns
//       { q, options, correct, explanation }; mkOptions(answer, wrongAnswers)
//       builds a shuffled 4-option set and needs 3+ distinct wrong answers.
//   F.concepts(tables)  — term/definition tables; distractors come from the
//       other definitions in the same table (4+ facts per table).
//   F.tricks(tables)    — true/false statement sets for EXCEPT / NOT / TRUE
//       questions (3+ true and 3+ false statements per item).
(function (F) {
  const { R, pick, fmt, mkOptions } = F.helpers;

  /* ---------- calculation generators ---------- */

  // Light travel time across the solar system: 1 AU ≈ 8.3 light-minutes
  F.calc('light-time', 'Light & Telescopes', 'BASICS', 3, () => {
    const p = pick([['Mars', 1.5], ['Jupiter', 5.2], ['Saturn', 9.5], ['Uranus', 19.2], ['Neptune', 30]]);
    const mins = p[1] * 8.3;
    const o = mkOptions(`About ${fmt(mins, 0)} minutes`, [
      `About ${fmt(mins * 2, 0)} minutes`, `About ${fmt(mins / 2, 0)} minutes`,
      `About ${fmt(p[1] + 8.3, 0)} minutes`, `About ${fmt(mins * 60, 0)} minutes`
    ]);
    return {
      q: `${p[0]} orbits about ${p[1]} AU from the Sun, and light crosses 1 AU in about 8.3 minutes. Roughly how long does sunlight take to reach ${p[0]}?`,
      ...o,
      explanation: `Travel time scales with distance: ${p[1]} AU × 8.3 minutes per AU ≈ ${fmt(mins, 0)} minutes.`
    };
  });

  // Weight on another world: weight scales with surface gravity
  F.calc('weight', 'Solar System', 'BASICS', 2, () => {
    const w = R(6, 10) * 100; // 600–1000 N; R(a, b) is a random integer from a to b
    const g = pick([['the Moon', 0.165], ['Mars', 0.38], ['Venus', 0.91], ['Titan', 0.14]]); // solid surfaces only
    const ans = w * g[1];
    const o = mkOptions(`${fmt(ans, 0)} N`, [
      `${fmt(w / g[1], 0)} N`, `${w} N`, `${fmt(ans * 2, 0)} N`, `${fmt(Math.abs(w - ans), 0)} N`
    ]);
    return {
      q: `A rover weighs ${w} N on Earth. Surface gravity on ${g[0]} is about ${g[1]} times Earth's. What does the rover weigh there?`,
      ...o,
      explanation: `Mass stays the same; weight scales with gravity: ${w} N × ${g[1]} ≈ ${fmt(ans, 0)} N.`
    };
  });

  // Distance from parallax: d (parsecs) = 1 / p (arcseconds)
  F.calc('parallax', 'Stars', 'ADV', 4, () => {
    const p = pick([0.1, 0.2, 0.25, 0.5]);
    const d = 1 / p;
    const o = mkOptions(`${fmt(d, 1)} parsecs`, [
      `${fmt(p, 2)} parsecs`, `${fmt(d * 2, 1)} parsecs`, `${fmt(d / 2, 1)} parsecs`, `${fmt(d * 3.26, 1)} parsecs`
    ]);
    return {
      q: `A star shows a parallax of ${p} arcseconds. How far away is it?`,
      ...o,
      explanation: `Distance in parsecs = 1 ÷ parallax in arcseconds = 1 ÷ ${p} = ${fmt(d, 1)} parsecs (about ${fmt(d * 3.26, 1)} light-years).`
    };
  });

  /* ---------- concept fact tables ----------
     Write each term as it reads mid-sentence; it is capitalized
     automatically where a sentence starts. */
  F.concepts([
    {
      domain: 'Solar System', cert: 'BASICS', diff: 2,
      facts: [
        { t: 'Mercury', d: 'The smallest planet and the closest to the Sun, with almost no atmosphere.' },
        { t: 'Venus', d: 'The hottest planet, wrapped in thick clouds over a carbon dioxide atmosphere.' },
        { t: 'Mars', d: 'The red planet, home to Olympus Mons, the tallest volcano known.' },
        { t: 'Jupiter', d: 'The largest planet, with a giant storm called the Great Red Spot.' },
        { t: 'Saturn', d: 'The gas giant with the brightest, most extensive ring system.' },
        { t: 'Uranus', d: 'The ice giant tipped on its side, its axis tilted about 98 degrees.' },
        { t: 'Neptune', d: 'The outermost planet, with the fastest winds measured in the solar system.' }
      ]
    },
    {
      domain: 'Stars', cert: 'ADV', diff: 3,
      facts: [
        { t: 'a protostar', d: 'A young star still contracting from its birth cloud, before fusion begins.' },
        { t: 'a main-sequence star', d: 'A star steadily fusing hydrogen into helium in its core.' },
        { t: 'a red giant', d: 'A swollen, cooler star that has run out of hydrogen in its core.' },
        { t: 'a white dwarf', d: 'The hot, dense, Earth-sized remnant of a Sun-like star.' },
        { t: 'a neutron star', d: "An ultra-dense, city-sized remnant of a massive star's collapsed core." },
        { t: 'a brown dwarf', d: 'An object too small to sustain hydrogen fusion, between a planet and a star.' }
      ]
    }
  ]);

  /* ---------- trick question tables ----------
     Keep true and false statements to similar lengths so the longest answer
     is not a giveaway. */
  F.tricks([
    {
      domain: 'Earth & Moon', cert: 'BASICS', diff: 3,
      items: [
        {
          topic: 'the seasons',
          trueStmts: [
            "Earth's seasons are caused by the tilt of its rotation axis.",
            'When it is summer in the north, it is winter in the south.',
            'Earth is actually closest to the Sun in early January.'
          ],
          falseStmts: [
            'Seasons happen because Earth is much closer to the Sun in summer.',
            'Both hemispheres always have summer at the same time of year.',
            "Earth's axis flips direction every six months to make winter."
          ]
        },
        {
          topic: 'the phases of the Moon',
          trueStmts: [
            'Phases come from the changing angle at which we see the sunlit half.',
            'A full moon rises around sunset and sets around sunrise.',
            'The Moon takes about 29.5 days to cycle through all of its phases.'
          ],
          falseStmts: [
            "Phases are caused by Earth's shadow falling across the Moon.",
            'The Moon makes its own light, which brightens and dims each month.',
            'A new moon is always visible high overhead at midnight.'
          ]
        }
      ]
    }
  ]);
})(FORGE);
