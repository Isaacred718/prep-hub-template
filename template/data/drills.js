// Scenario drills — short situations that end in a decision.
// Every entry: { duty, task, scenario, question, options[2–6], correct (index), explanation }
// duty = the category the results are grouped by; task = an optional sub-label.
const DRILLS = [
  {
    "duty": "Observing",
    "task": "Plan an observing night",
    "scenario": "You want to photograph a faint galaxy with your backyard telescope. Tonight the Moon is full and rises at sunset, and the forecast is clear for the next three weeks.",
    "question": "What is the best plan?",
    "options": [
      "Go out tonight and push the magnification higher to cut through the glare",
      "Wait for the nights around new moon, when moonlight won't wash out the sky",
      "Go out tonight and aim the telescope as close to the Moon as possible",
      "Wait for a partly cloudy night so the clouds block some of the moonlight"
    ],
    "correct": 1,
    "explanation": "Moonlight brightens the whole sky and drowns faint galaxies. Around new moon (about two weeks after full) the sky is darkest. Magnification does not remove sky glow, and clouds block the galaxy too."
  },
  {
    "duty": "Observing",
    "task": "Choose equipment",
    "scenario": "A friend lives downtown under heavy light pollution. They want to see Saturn's rings and craters on the Moon from their balcony and have a small budget.",
    "question": "What should you tell them?",
    "options": [
      "Nothing is visible from a city, so they should not buy anything at all",
      "Only a professional observatory can show Saturn's rings to the eye",
      "A small telescope works: the Moon and planets shine through city glow",
      "They need a large telescope above 40 cm before the rings become visible"
    ],
    "correct": 2,
    "explanation": "Light pollution mostly hurts faint, diffuse objects like galaxies. The Moon and bright planets cut right through it, and even a small 60–80 mm telescope shows Saturn's rings."
  },
  {
    "duty": "Reasoning",
    "task": "Explain a phenomenon",
    "scenario": "A student says northern summer happens because Earth is much closer to the Sun in July.",
    "question": "What is the most accurate correction?",
    "options": [
      "Agree: Earth reaches its closest point to the Sun in early July",
      "Earth is farthest from the Sun in July; axial tilt causes the seasons",
      "Seasons come from changes in the distance between Earth and the Moon",
      "Summer happens because the Sun itself burns hotter in those months"
    ],
    "correct": 1,
    "explanation": "Earth is actually farthest from the Sun (aphelion) in early July and closest in early January. Seasons come from the 23.5° tilt, which changes how directly sunlight strikes each hemisphere."
  },
  {
    "duty": "Reasoning",
    "task": "Interpret data",
    "scenario": "A spectrum of a distant galaxy shows the familiar hydrogen lines, but every one of them sits at a longer wavelength than in the lab.",
    "question": "What does this tell you?",
    "options": [
      "The galaxy contains no hydrogen, so the lines must belong to another element",
      "The galaxy is racing toward us, which stretches its light to longer wavelengths",
      "The galaxy is receding from us, consistent with the expansion of the universe",
      "The galaxy's stars are all much cooler than the Sun, which reddens their lines"
    ],
    "correct": 2,
    "explanation": "Lines shifted to longer wavelengths are redshifted: the source is moving away. For distant galaxies this redshift comes from the expansion of space. Motion toward us would shift lines to shorter wavelengths."
  }
];
