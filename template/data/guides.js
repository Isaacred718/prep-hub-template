// Study guides. Every entry: { title, domain, body }
// body is light markdown: ## and ### headings, - bullets, 1. numbered lists,
// **bold**, *italic* and `code`. Blank lines separate paragraphs.
const GUIDES = [
  {
    "title": "The solar system at a glance",
    "domain": "Solar System",
    "body": "The Sun holds about 99.8% of the solar system's mass. Everything else — eight planets, their moons, dwarf planets, asteroids and comets — orbits it.\n\n## The two families of planets\n\n- **Terrestrial planets** (Mercury, Venus, Earth, Mars): small, rocky and dense, with few or no moons.\n- **Giant planets**: the gas giants Jupiter and Saturn, and the ice giants Uranus and Neptune. All four have rings and many moons.\n\nThe **asteroid belt** between Mars and Jupiter divides the two families.\n\n## Distances you should know\n\n- 1 **astronomical unit (AU)** is the average Earth–Sun distance, about 150 million km.\n- Sunlight takes about **8 minutes 20 seconds** to cross 1 AU.\n- Neptune orbits at about **30 AU**; the Kuiper Belt starts just beyond it.\n\n## Common mix-ups\n\n- Venus, not Mercury, is the hottest planet: its thick carbon dioxide atmosphere traps heat.\n- Pluto is a **dwarf planet**: round and orbiting the Sun, but it has not cleared its neighborhood."
  },
  {
    "title": "The life cycle of stars",
    "domain": "Stars",
    "body": "A star's mass decides almost everything about its life: how bright it shines, how long it lasts and how it ends.\n\n## From cloud to main sequence\n\n1. A cold cloud of gas and dust collapses under its own gravity.\n2. The core heats up — a **protostar** — until hydrogen fusion ignites.\n3. The star settles onto the **main sequence**, fusing hydrogen into helium for most of its life.\n\n## Two endings\n\n- **Sun-like stars** swell into red giants, puff off their outer layers as a planetary nebula, and leave a **white dwarf**.\n- **Massive stars** (above about 8 solar masses) end in a **supernova**, leaving a **neutron star** or, for the heaviest, a **black hole**.\n\n## Reading a star's color\n\nColor tracks surface temperature: blue stars are hottest, red stars coolest. The Sun's surface is about 5,800 K.\n\n### Distance by parallax\n\nAs Earth orbits, nearby stars shift slightly against distant ones. Distance in parsecs = 1 ÷ parallax in arcseconds, and 1 parsec is about 3.26 light-years."
  },
  {
    "title": "How to use this app",
    "domain": "Reference",
    "body": "Everything runs in your browser and keeps working offline once the page has loaded. Progress is saved on this device; if sign-in is set up, it also syncs to your account.\n\n## The tabs\n\n- **Overview** — your dashboard: readiness by domain (weakest first), recent sessions and a suggested study loop.\n- **Guides** — short study guides like this one.\n- **Cards** — flashcards with Leitner spaced repetition. Cards you miss drop back to Box 1; cards you know climb toward Box 5. Box 4 and up counts as mastered.\n- **Quiz** — pick a domain and length, answer with instant explanations, and see results by domain.\n- **Practice** — builds a fresh randomized test every time, timed at exam pace, with a full review at the end.\n- **Drills** — short scenarios that end in a decision.\n- **Endless** — no finish line: questions adapt to your level as you go, repeats come back rephrased, and generated questions add endless variety.\n\n## Settings\n\nTap the gear in the header to change the theme, accent color and text size, set your pass mark and default level, adjust timers and the Endless difficulty ramp, turn on sound or keyboard shortcuts, and export or import a backup of your progress.\n\n## Suggested study loop\n\n1. Read the guide for your weakest domain.\n2. Drill its flashcards until most reach Box 4+.\n3. Take a quiz filtered to that domain.\n4. When every domain feels solid, run full practice tests until you consistently beat your target."
  }
];
