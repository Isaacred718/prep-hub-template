// Flashcards (Leitner spaced repetition). Every entry: { domain, front, back }
// Use the same domain names as the questions so flashcard mastery feeds the
// readiness score for that domain. domain + front must be unique: together
// they are the card's progress key.
const CARDS = [
  { "domain": "Solar System", "front": "Astronomical unit (AU)", "back": "The average Earth–Sun distance: about 150 million km." },
  { "domain": "Solar System", "front": "Terrestrial planets", "back": "Mercury, Venus, Earth and Mars — small, dense, rocky worlds." },
  { "domain": "Solar System", "front": "Gas giants", "back": "Jupiter and Saturn — huge planets made mostly of hydrogen and helium." },
  { "domain": "Solar System", "front": "Ice giants", "back": "Uranus and Neptune — rich in water, ammonia and methane ices." },
  { "domain": "Solar System", "front": "Dwarf planet", "back": "Round and orbits the Sun, but has not cleared its orbital neighborhood (Pluto, Ceres)." },
  { "domain": "Earth & Moon", "front": "Axial tilt", "back": "Earth's 23.5° tilt. It causes the seasons — not our distance from the Sun." },
  { "domain": "Earth & Moon", "front": "Tidal locking", "back": "A moon spins once per orbit, so the same face always points at its planet." },
  { "domain": "Earth & Moon", "front": "Solar eclipse", "back": "The Moon passes between the Sun and Earth. Only possible at new moon." },
  { "domain": "Earth & Moon", "front": "Lunar eclipse", "back": "Earth's shadow falls on the Moon. Only possible at full moon." },
  { "domain": "Light & Telescopes", "front": "Light-year", "back": "A distance, not a time: about 9.46 trillion km, how far light travels in a year." },
  { "domain": "Light & Telescopes", "front": "Aperture", "back": "The diameter of a telescope's main lens or mirror. Bigger collects more light." },
  { "domain": "Light & Telescopes", "front": "Refractor vs. reflector", "back": "Refractors focus light with lenses; reflectors focus it with mirrors." },
  { "domain": "Stars", "front": "Main sequence", "back": "The long, stable stage when a star fuses hydrogen into helium in its core." },
  { "domain": "Stars", "front": "White dwarf", "back": "The hot, Earth-sized core left after a Sun-like star sheds its outer layers." },
  { "domain": "Stars", "front": "Supernova", "back": "The explosion that ends a massive star, leaving a neutron star or black hole." },
  { "domain": "Stars", "front": "Parallax", "back": "A star's tiny yearly shift against the background. Distance in parsecs = 1 ÷ parallax in arcseconds." },
  { "domain": "Galaxies & Cosmology", "front": "Redshift", "back": "Light stretched to longer wavelengths as its source recedes or space expands." },
  { "domain": "Galaxies & Cosmology", "front": "Event horizon", "back": "The boundary around a black hole beyond which nothing, not even light, escapes." }
];
