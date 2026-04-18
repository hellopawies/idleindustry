const GROW_MS = { grass: 4000, bush: 5000, tree: 8000, carrot: 6000 };

const ICONS = {
  grass:  { g: '🌱', r: '🌿' },
  bush:   { g: '🌿', r: '🫐' },
  tree:   { g: '🌿', r: '🌲' },
  carrot: { g: '🌱', r: '🥕' },
};

const DROPS = {
  grass:  { item: 'hay',   n: 1 },
  bush:   { item: 'wood',  n: 1 },
  tree:   { item: 'wood',  n: 3 },
  carrot: { item: 'carrot', n: 1 },
};

const INV_DISPLAY = [
  { key: 'hay',    icon: '🌾', name: 'Hay'    },
  { key: 'wood',   icon: '🪵', name: 'Wood'   },
  { key: 'carrot', icon: '🥕', name: 'Carrot' },
];

const RESEARCH = [
  { id: 'bush',    name: 'Bush',              desc: 'Unlock Bush. Grows on Turf, drops Wood.',      cost: { hay: 10 },             grants: ['bush'] },
  { id: 'tree',    name: 'Tree',              desc: 'Unlock Tree. Drops 3 Wood per harvest.',        cost: { wood: 15 },            req: ['bush'], grants: ['tree'] },
  { id: 'carrot',  name: 'Carrot',            desc: 'Unlock Carrot. Needs tilled Soil.',             cost: { wood: 20, hay: 20 },   req: ['tree'], grants: ['carrot'] },
  { id: 'speed1',  name: 'Speed I',           desc: 'Drone runs 2× faster.',                        cost: { hay: 30 },             speed: 2 },
  { id: 'speed2',  name: 'Speed II',          desc: 'Drone runs 5× faster.',                        cost: { hay: 80, wood: 40 },   req: ['speed1'], speed: 5 },
  { id: 'speed3',  name: 'Speed III',         desc: 'Drone runs 10× faster.',                       cost: { hay: 200, wood: 150 }, req: ['speed2'], speed: 10 },
  { id: 'expand1', name: 'Expand Farm (5×5)', desc: 'Grow the farm to a 5×5 grid.',                 cost: { wood: 30, hay: 30 },   expand: 5 },
  { id: 'expand2', name: 'Expand Farm (7×7)', desc: 'Grow the farm to a 7×7 grid.',                 cost: { wood: 100, hay: 100 }, req: ['expand1'], expand: 7 },
];
