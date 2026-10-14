// Question bank. Every entry:
//   { domain, cert, q, options[2–6], correct (index into options), explanation, diff? }
// cert = a track id from topic.js (optional when there is only one track).
// diff = optional 1–5 difficulty for Endless mode (otherwise auto-tagged).
// Answer order is shuffled on screen, so `correct` can point anywhere —
// but keep the right answer about as long as the wrong ones.
const QUESTIONS = [
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "Which planet is closest to the Sun?",
    "options": [
      "Mercury",
      "Mars",
      "Earth",
      "Venus"
    ],
    "correct": 0,
    "explanation": "Mercury orbits at about 0.39 AU, closer than any other planet. It is also the smallest planet."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "Which planet is the largest in the solar system?",
    "options": [
      "Neptune",
      "Jupiter",
      "Uranus",
      "Saturn"
    ],
    "correct": 1,
    "explanation": "Jupiter is more than twice as massive as all the other planets combined and about 11 times Earth's diameter."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "Why is Venus hotter than Mercury, even though Mercury is closer to the Sun?",
    "options": [
      "Constant volcanic eruptions release more heat than the Sun delivers to it",
      "It rotates so slowly that one face is turned toward the Sun permanently",
      "Its dense carbon dioxide atmosphere traps heat in a runaway greenhouse effect",
      "Its orbit carries it closer to the Sun than Mercury for half of each year"
    ],
    "correct": 2,
    "explanation": "Venus's thick CO2 atmosphere traps heat so well that its surface sits near 465 °C day and night. Its orbit is always outside Mercury's, and although it rotates very slowly it is not locked facing the Sun."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "What is the main ingredient of the Sun by mass?",
    "options": [
      "Helium",
      "Oxygen",
      "Carbon",
      "Hydrogen"
    ],
    "correct": 3,
    "explanation": "The Sun is roughly 73% hydrogen and 25% helium by mass; everything else adds up to about 2%."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "What lies between the orbits of Mars and Jupiter?",
    "options": [
      "The asteroid belt",
      "The Oort Cloud",
      "The heliopause",
      "The Kuiper Belt"
    ],
    "correct": 0,
    "explanation": "The main asteroid belt separates the rocky inner planets from the giant outer planets. The Kuiper Belt lies beyond Neptune, and the Oort Cloud is far beyond that."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "Since 2006, Pluto has been classified as which kind of object?",
    "options": [
      "A moon of Neptune",
      "A dwarf planet",
      "A short-period comet",
      "A main-belt asteroid"
    ],
    "correct": 1,
    "explanation": "Pluto is round and orbits the Sun but has not cleared its orbital neighborhood, so the IAU classifies it as a dwarf planet."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "What are Saturn's rings mostly made of?",
    "options": [
      "Iron-rich dust swept up from comets passing through",
      "A few solid sheets of frozen methane spinning as one disk",
      "Countless pieces of water ice, from dust grains to boulders",
      "Glowing gas trapped by Saturn's strong magnetic field lines"
    ],
    "correct": 2,
    "explanation": "The rings are billions of separate chunks of mostly water ice, ranging from tiny grains to house-sized boulders, each orbiting Saturn on its own."
  },
  {
    "domain": "Solar System",
    "cert": "BASICS",
    "q": "About how long does sunlight take to reach Earth?",
    "options": [
      "About 1 hour",
      "About 8 hours",
      "About 8 seconds",
      "About 8 minutes"
    ],
    "correct": 3,
    "explanation": "Earth is about 150 million km (1 AU) from the Sun. At 300,000 km/s, light covers that in roughly 8 minutes 20 seconds."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "What causes Earth's seasons?",
    "options": [
      "The 23.5° tilt of Earth's rotation axis",
      "The Moon's pull shifting Earth's orbit",
      "Earth's changing distance from the Sun",
      "Yearly swings in the Sun's energy output"
    ],
    "correct": 0,
    "explanation": "The tilted axis means each hemisphere takes turns leaning toward the Sun, getting more direct sunlight and longer days. Earth is actually closest to the Sun in January, during northern winter."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "Why do we always see the same side of the Moon?",
    "options": [
      "The Moon does not spin on its axis at all",
      "Its spin period matches its orbital period",
      "Earth's shadow always covers the far side",
      "The far side faces away and stays dark"
    ],
    "correct": 1,
    "explanation": "The Moon is tidally locked: it rotates exactly once per orbit, so one face always points at Earth. It does spin, and the far side gets just as much sunlight as the near side."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "During which lunar phase can a solar eclipse happen?",
    "options": [
      "Full moon",
      "First quarter",
      "New moon",
      "Waning gibbous"
    ],
    "correct": 2,
    "explanation": "A solar eclipse needs the Moon between the Sun and Earth, which only happens at new moon. Lunar eclipses happen at full moon."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "What causes the phases of the Moon?",
    "options": [
      "Clouds of dust passing between Earth and Moon",
      "The Moon producing more or less of its own light",
      "Earth's shadow covering different parts of it",
      "The changing angle at which we see its sunlit half"
    ],
    "correct": 3,
    "explanation": "The Sun always lights half of the Moon. As the Moon orbits, we see different amounts of that lit half. Earth's shadow only matters during a lunar eclipse."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "What mainly causes ocean tides on Earth?",
    "options": [
      "Differences in the Moon's gravitational pull across Earth",
      "Earth's rotation flinging water outward at the equator",
      "Heat from the Sun expanding the oceans each afternoon",
      "Wind pushing water toward the coasts twice a day"
    ],
    "correct": 0,
    "explanation": "The Moon pulls harder on the side of Earth facing it than on the far side, stretching the oceans into two bulges. The Sun adds a smaller effect, which is why spring and neap tides alternate."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "Roughly how far is the Moon from Earth on average?",
    "options": [
      "About 38,400 km",
      "About 384,000 km",
      "About 3.8 million km",
      "About 150 million km"
    ],
    "correct": 1,
    "explanation": "The average Earth–Moon distance is about 384,400 km. 150 million km is the Earth–Sun distance."
  },
  {
    "domain": "Earth & Moon",
    "cert": "BASICS",
    "q": "Why does the Moon look red during a total lunar eclipse?",
    "options": [
      "Its surface heats up in Earth's shadow and glows red",
      "Sunlight reflected off Mars falls on it in shadow",
      "Earth's atmosphere bends reddened sunlight onto it",
      "Light reflected from Earth's oceans tints it red"
    ],
    "correct": 2,
    "explanation": "Earth's atmosphere scatters away blue light and bends the remaining red light into the shadow — the Moon is lit by every sunrise and sunset on Earth at once."
  },
  {
    "domain": "Light & Telescopes",
    "cert": "BASICS",
    "q": "What is a light-year?",
    "options": [
      "A distance: how far Earth travels in one orbit",
      "A time: how long starlight takes to reach Earth",
      "A time: one year measured on a fast-moving clock",
      "A distance: how far light travels in one year"
    ],
    "correct": 3,
    "explanation": "Despite the name, a light-year is a distance — about 9.46 trillion km, the distance light covers in one year."
  },
  {
    "domain": "Light & Telescopes",
    "cert": "BASICS",
    "q": "What is the main advantage of a telescope with a larger aperture?",
    "options": [
      "It collects more light, revealing fainter objects",
      "It lets the telescope see through daytime clouds",
      "It magnifies every object by a fixed larger amount",
      "It removes the twinkling caused by the atmosphere"
    ],
    "correct": 0,
    "explanation": "Aperture is light-gathering area: doubling the diameter collects four times the light and also sharpens the finest detail the telescope can resolve. Magnification comes from the eyepiece."
  },
  {
    "domain": "Light & Telescopes",
    "cert": "BASICS",
    "q": "Why are many large telescopes built on high mountains?",
    "options": [
      "Thin, cold air magnifies the light passing through",
      "Less air above them means steadier, clearer views",
      "Being closer to the stars makes them appear larger",
      "Mountain rock shields them from magnetic storms"
    ],
    "correct": 1,
    "explanation": "High sites sit above much of the atmosphere's turbulence, water vapor and city light, so images are steadier and sharper. The few kilometers of height make no difference to how big stars look."
  },
  {
    "domain": "Light & Telescopes",
    "cert": "BASICS",
    "q": "Why does the James Webb Space Telescope observe mainly in infrared?",
    "options": [
      "Stars emit infrared only, so visible images would be blank",
      "Infrared light crosses space faster than visible light does",
      "It sees through dust and catches light redshifted by expansion",
      "Gold mirrors cannot reflect the visible part of the spectrum"
    ],
    "correct": 2,
    "explanation": "Infrared passes through dust clouds that block visible light, and the light of the most distant galaxies has been stretched into the infrared by the expansion of the universe. All light travels at the same speed."
  },
  {
    "domain": "Light & Telescopes",
    "cert": "BASICS",
    "q": "What is the difference between a reflecting and a refracting telescope?",
    "options": [
      "Reflectors see radio waves; refractors see visible light",
      "Refractors gather light with mirrors; reflectors use lenses",
      "Reflectors work only in daylight; refractors work at night",
      "Reflectors gather light with mirrors; refractors use lenses"
    ],
    "correct": 3,
    "explanation": "Reflectors use a curved primary mirror; refractors bend light through a lens. Nearly all large research telescopes are reflectors because big mirrors are easier to make and support than big lenses."
  },
  {
    "domain": "Stars",
    "cert": "ADV",
    "q": "What powers a main-sequence star like the Sun?",
    "options": [
      "Fusion of hydrogen into helium in its core",
      "Chemical burning of hydrogen with oxygen",
      "Gravitational heat from slowly shrinking",
      "Fission of uranium deep inside its core"
    ],
    "correct": 0,
    "explanation": "In the core, hydrogen nuclei fuse into helium and release energy. Slow contraction heats young protostars, but it could only power the Sun for millions of years, not billions."
  },
  {
    "domain": "Stars",
    "cert": "ADV",
    "q": "A star's color mainly tells you its what?",
    "options": [
      "Distance from Earth",
      "Surface temperature",
      "Direction of motion",
      "Number of planets"
    ],
    "correct": 1,
    "explanation": "Hotter surfaces glow bluer and cooler ones redder: blue stars run above 10,000 K, while red stars are below about 3,500 K. The Sun's yellow-white light comes from a surface near 5,800 K."
  },
  {
    "domain": "Stars",
    "cert": "ADV",
    "q": "What will the Sun most likely become at the end of its life?",
    "options": [
      "A black hole, after a supernova blast",
      "A neutron star, after core collapse",
      "A white dwarf, after a red giant phase",
      "A brown dwarf, after it slowly cools"
    ],
    "correct": 2,
    "explanation": "The Sun is far too light to go supernova. It will swell into a red giant, shed its outer layers as a planetary nebula, and leave a hot, Earth-sized white dwarf."
  },
  {
    "domain": "Stars",
    "cert": "ADV",
    "q": "A star 20 times the Sun's mass runs out of fuel in its core. What is the most likely outcome?",
    "options": [
      "Collapse back into a younger main-sequence star",
      "A gentle planetary nebula leaving a white dwarf",
      "A slow fade until it cools into a brown dwarf",
      "A supernova leaving a neutron star or black hole"
    ],
    "correct": 3,
    "explanation": "Massive stars end in core-collapse supernovae. The leftover core becomes a neutron star, or a black hole if it is massive enough. Planetary nebulae and white dwarfs are the fate of Sun-like stars."
  },
  {
    "domain": "Stars",
    "cert": "ADV",
    "q": "What is the Hertzsprung–Russell (H–R) diagram used for?",
    "options": [
      "Plotting luminosity against temperature to classify stars",
      "Tracking how fast stars orbit the center of the galaxy",
      "Mapping where each star appears in the night sky by season",
      "Charting how each star's distance from the Sun changes"
    ],
    "correct": 0,
    "explanation": "The H–R diagram plots luminosity against surface temperature. Stars fall into groups — the main sequence, giants, supergiants and white dwarfs — that reveal their stage of life."
  },
  {
    "domain": "Stars",
    "cert": "ADV",
    "q": "Why do stars twinkle while planets usually shine steadily?",
    "options": [
      "Planets shine by their own light, which is much steadier",
      "Stars are near-points, so air turbulence jostles their light",
      "Stars pulse in brightness as nuclear fuel burns unevenly",
      "Planets sit too close to Earth for the air to bend their light"
    ],
    "correct": 1,
    "explanation": "A star is effectively a single point, so turbulence in our air makes it flicker. A planet shows a tiny disk; the flickering from different points averages out. Planets shine by reflected sunlight."
  },
  {
    "domain": "Galaxies & Cosmology",
    "cert": "ADV",
    "q": "What is the Milky Way?",
    "options": [
      "A nebula of gas between Earth and the nearest stars",
      "The band of asteroids that circles the inner planets",
      "The barred spiral galaxy that contains our solar system",
      "A cluster of a few hundred stars around the Sun"
    ],
    "correct": 2,
    "explanation": "The Milky Way is our home galaxy — a barred spiral of a few hundred billion stars. The milky band across the night sky is its disk seen edge-on from inside."
  },
  {
    "domain": "Galaxies & Cosmology",
    "cert": "ADV",
    "q": "What does the redshift of light from distant galaxies indicate?",
    "options": [
      "Their light is dimmed by dust in our galaxy",
      "They are made of cooler, redder stars than ours",
      "They are rushing toward us at very high speed",
      "They are moving away as space itself expands"
    ],
    "correct": 3,
    "explanation": "Spectral lines shifted to longer wavelengths mean the source is receding. Distant galaxies show larger redshifts — Hubble's law — which is the evidence for an expanding universe. Motion toward us causes blueshift."
  },
  {
    "domain": "Galaxies & Cosmology",
    "cert": "ADV",
    "q": "About how old is the universe, according to current measurements?",
    "options": [
      "About 13.8 billion years",
      "About 138 billion years",
      "About 4.6 billion years",
      "About 1.4 billion years"
    ],
    "correct": 0,
    "explanation": "Measurements of the cosmic microwave background put the age of the universe near 13.8 billion years. 4.6 billion years is the age of the solar system."
  },
  {
    "domain": "Galaxies & Cosmology",
    "cert": "ADV",
    "q": "What is a black hole's event horizon?",
    "options": [
      "The bright ring of hot gas that orbits just outside it",
      "The boundary beyond which not even light can escape",
      "The point where the hole's gravity finally switches off",
      "The surface of the collapsed star at the very center"
    ],
    "correct": 1,
    "explanation": "The event horizon is the point of no return: inside it, escape would require moving faster than light. The glowing ring in black hole images is hot gas outside the horizon."
  }
];
