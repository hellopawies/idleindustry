// Story mode chapters — each teaches one coding concept progressively.
const CHAPTERS = [
  {
    id: 'ch1',
    title: 'Boot Sequence',
    badge: '1 / 7',
    story: 'Initializing... Unit 7-Delta online. 🟢\n\nWelcome to Greenfield Agricultural Station. I\'m <b>AGRI</b>, your farm management AI. You control the drone by writing <b>JavaScript</b> code in the editor on the left.\n\nEvery drone command needs the <code>await</code> keyword — it tells the drone to finish one action before starting the next.',
    objective: 'Move the drone one step North.',
    concept: 'await + function call',
    hint: 'await move(North);',
    starterCode: '// Move the drone one step north!\n// Drone actions need "await" before them.\n\nawait move(North);\n',
    setup() {
      initFarm(3);
      G.drone = { x: 1, y: 2 };
      G.inv   = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.drone.y < 2; },
  },
  {
    id: 'ch2',
    title: 'First Harvest',
    badge: '2 / 7',
    story: 'Motor systems: online. ✅\n\nThe drone is hovering over a patch of <b>ripe grass</b> — notice the growth bar is full and glowing yellow.\n\n<code>canHarvest()</code> checks if the current cell is ready to harvest. <code>await harvest()</code> cuts it and adds Hay to your inventory. Try it!',
    objective: 'Harvest the ripe grass the drone is standing on.',
    concept: 'canHarvest() + await harvest()',
    hint: 'if (canHarvest()) { await harvest(); }',
    starterCode: '// Harvest the crop beneath the drone!\n// canHarvest() returns true when it\'s ready.\n\nif (canHarvest()) {\n  await harvest();\n}\n',
    setup() {
      initFarm(3);
      G.drone      = { x: 1, y: 1 };
      G.grid[1][1] = makeCell('grass', 1);
      G.inv        = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.inv.hay >= 1; },
  },
  {
    id: 'ch3',
    title: 'Keep Moving',
    badge: '3 / 7',
    story: 'First hay collected! 🌾\n\nA single harvest won\'t sustain the farm. You need to <b>move and harvest in sequence</b>. Each <code>await</code> call finishes before the next one starts — actions happen in order.\n\nThe top row has 3 ripe cells. Harvest each one, moving East between them.',
    objective: 'Harvest all 3 ripe cells across the top row.',
    concept: 'Sequential await calls',
    hint: 'Repeat: await harvest(); await move(East);',
    starterCode: '// Visit each cell and harvest it.\n// The pattern: harvest, move, harvest, move...\n\nawait harvest();\nawait move(East);\nawait harvest();\nawait move(East);\nawait harvest();\n',
    setup() {
      initFarm(3);
      G.drone      = { x: 0, y: 0 };
      G.grid[0][0] = makeCell('grass', 1);
      G.grid[0][1] = makeCell('grass', 1);
      G.grid[0][2] = makeCell('grass', 1);
      G.inv        = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.inv.hay >= 3; },
  },
  {
    id: 'ch4',
    title: 'Loop It',
    badge: '4 / 7',
    story: 'Good sequencing! But writing the same lines over and over is tedious — and what about a 7×7 farm someday?\n\nProgrammers solve repetition with <b>loops</b>. A <code>for</code> loop repeats a block a set number of times:\n\n<code>for (let i = 0; i &lt; 3; i++) { ... }</code>\n\nRewrite the row harvest using a single loop.',
    objective: 'Use a for loop to harvest all 3 cells in the row.',
    concept: 'for loop',
    hint: 'for (let i = 0; i < 3; i++) { await harvest(); await move(East); }',
    starterCode: '// Use a for loop — no more copy-pasting!\n\nfor (let i = 0; i < 3; i++) {\n  await harvest();\n  await move(East);\n}\n',
    setup() {
      initFarm(3);
      G.drone      = { x: 0, y: 0 };
      G.grid[0][0] = makeCell('grass', 1);
      G.grid[0][1] = makeCell('grass', 1);
      G.grid[0][2] = makeCell('grass', 1);
      G.inv        = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.inv.hay >= 3; },
  },
  {
    id: 'ch5',
    title: 'Check Before You Act',
    badge: '5 / 7',
    story: 'Loops mastered! But crops don\'t all grow at the same rate. Harvesting an unripe cell does nothing.\n\nUse <code>canHarvest()</code> inside an <b>if statement</b> to only harvest when ready:\n\n<code>if (canHarvest()) { await harvest(); }</code>\n\nThe row ahead has a mix of ripe and unripe cells — skip the unripe one.',
    objective: 'Traverse the row and collect 2 hay (skip the unripe cell).',
    concept: 'if (canHarvest())',
    hint: 'if (canHarvest()) { await harvest(); }',
    starterCode: '// Only harvest when the crop is ready!\n// canHarvest() returns true or false.\n\nfor (let i = 0; i < 3; i++) {\n  if (canHarvest()) {\n    await harvest();\n  }\n  await move(East);\n}\n',
    setup() {
      initFarm(3);
      G.drone      = { x: 0, y: 0 };
      G.grid[0][0] = makeCell('grass', 1);
      G.grid[0][1] = makeCell('grass', 0.1);
      G.grid[0][2] = makeCell('grass', 1);
      G.inv        = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.inv.hay >= 2; },
  },
  {
    id: 'ch6',
    title: 'Sweep the Farm',
    badge: '6 / 7',
    story: 'Excellent! Now let\'s cover the <b>whole 3×3 farm</b>.\n\nYou already know how to sweep a row. To cover all rows, put a loop <i>inside</i> another — a <b>nested loop</b>. After finishing each row, move <b>South</b> to start the next.\n\n<code>getWorldSize()</code> returns the grid size, so your code scales to any farm size.',
    objective: 'Sweep all 3 rows and collect at least 6 hay.',
    concept: 'Nested for loops',
    hint: 'Outer loop moves South between rows; inner loop moves East across each row.',
    starterCode: '// Sweep every row with nested loops!\nconst size = getWorldSize();\n\nfor (let row = 0; row < size; row++) {\n  for (let col = 0; col < size; col++) {\n    if (canHarvest()) await harvest();\n    if (col < size - 1) await move(East);\n  }\n  await move(South);\n}\n',
    setup() {
      initFarm(3);
      G.drone = { x: 0, y: 0 };
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < 3; x++)
          G.grid[y][x] = makeCell('grass', 1);
      G.inv = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.inv.hay >= 6; },
  },
  {
    id: 'ch7',
    title: 'Never Stop',
    badge: '7 / 7',
    story: 'You\'ve learned the fundamentals! One last concept: a drone that stops is a drone that\'s failing.\n\nA <code>while (true)</code> loop runs <b>forever</b> — perfect for continuous farming. It never ends on its own; you stop it manually with the <b>Stop</b> button.\n\nWrite a farming loop, let it collect 15 hay, then click <b>Stop</b>. Free Play awaits!',
    objective: 'Collect 15 hay using a while loop, then click Stop.',
    concept: 'while (true) loop',
    hint: 'while (true) { if (canHarvest()) await harvest(); await move(East); }',
    starterCode: '// A while(true) loop runs until you click Stop.\n// Combine everything you\'ve learned!\n\nwhile (true) {\n  if (canHarvest()) await harvest();\n  await move(East);\n}\n',
    setup() {
      initFarm(3);
      G.drone = { x: 0, y: 0 };
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < 3; x++)
          G.grid[y][x] = makeCell('grass', Math.random());
      G.inv = { hay: 0, wood: 0, carrot: 0 };
    },
    check(G) { return G.inv.hay >= 15; },
  },
];
