const SAVE_KEY = 'matsuyoi_save_v0_1';
const TILE = 48;
const VIEW_COLS = 15;
const VIEW_ROWS = 11;
const WORLD_W = VIEW_COLS * TILE;
const WORLD_H = VIEW_ROWS * TILE;
const STEP_INTERVAL_MS = 240;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = WORLD_W;
canvas.height = WORLD_H;

const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const objectiveBox = document.getElementById('objectiveBox');
const interactBtn = document.getElementById('interactBtn');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueName = document.getElementById('dialogueName');
const dialogueText = document.getElementById('dialogueText');
const nextDialogueBtn = document.getElementById('nextDialogueBtn');
const controls = document.getElementById('controls');

const assets = {};
const assetPaths = {
  hero: 'assets/hero.png',
  land: 'assets/land.png',
  rurugar: 'assets/rurugar.png',
  taart: 'assets/taart.png',
  meru: 'assets/meru.png',
  mogamo: 'assets/mogamo.png',
  meruFather: 'assets/meru_father.png',
  lumina: 'assets/lumina.png',
  bird: 'assets/bird.png'
};

const state = {
  scene: 'home',
  move: { up: false, down: false, left: false, right: false },
  player: { x: 7, y: 8, dir: 'down', stepFrame: 1 },
  land: { x: 8, y: 8, dir: 'left', follow: false, stepFrame: 1 },
  progress: 0,
  objective: '',
  nearNpcId: null,
  nearHotspotId: null,
  dialogueQueue: [],
  currentDialogue: null,
  sceneTriggered: {},
  interactLocked: false,
  lastMoveAt: 0,
};

function makeFallbackSprite(label) {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const cctx = c.getContext('2d');
  cctx.fillStyle = '#4e6a85';
  cctx.fillRect(0, 0, 96, 96);
  cctx.fillStyle = '#fff';
  cctx.font = 'bold 20px sans-serif';
  cctx.textAlign = 'center';
  cctx.textBaseline = 'middle';
  cctx.fillText(label, 48, 48);
  return c;
}

function loadAssets() {
  return Promise.all(Object.entries(assetPaths).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { assets[key] = img; resolve(); };
    img.onerror = () => { assets[key] = makeFallbackSprite(key.slice(0, 4)); resolve(); };
    img.src = src;
  })));
}

function setControlsDisabled(disabled) {
  controls.classList.toggle('disabled', !!disabled);
}

function isDialogueOpen() {
  return !dialogueBox.classList.contains('hidden');
}

function updateObjective() {
  const messages = {
    0: '目的：テーブルにある母さんのメモを読む。',
    1: '目的：家の外へ出て、ランドと一緒にルルガーの家へ向かう。',
    2: '目的：ルルガーの家に入り、本人の前まで行く。',
    3: '目的：ここまでで初回再構築版の到達目標です。'
  };
  state.objective = messages[state.progress] || '目的：試作版';
  objectiveBox.textContent = state.objective;
}

function createBorderMap(cols, rows, fill = 'floor') {
  return Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => (
    x === 0 || y === 0 || x === cols - 1 || y === rows - 1 ? 'wall' : fill
  )));
}

function fillRect(map, x, y, w, h, tile) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (map[yy] && map[yy][xx] !== undefined) map[yy][xx] = tile;
    }
  }
}

function buildVillageScene() {
  const cols = 32;
  const rows = 24;
  const map = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'grass'));
  for (let x = 0; x < cols; x++) {
    map[0][x] = 'tree';
    map[rows - 1][x] = 'tree';
  }
  for (let y = 0; y < rows; y++) {
    map[y][0] = 'tree';
    map[y][cols - 1] = 'tree';
  }

  fillRect(map, 3, 11, 26, 3, 'road');
  fillRect(map, 12, 3, 3, 18, 'road');
  fillRect(map, 21, 7, 3, 10, 'road');
  fillRect(map, 25, 11, 4, 3, 'road');
  fillRect(map, 24, 5, 5, 5, 'dirt');
  fillRect(map, 2, 5, 6, 5, 'dirt');
  fillRect(map, 14, 17, 6, 4, 'dirt');

  const blocked = [];
  const houseDoors = [];
  const houses = [
    { id: 'home', x: 4, y: 7, w: 4, h: 4, doorX: 5, doorY: 11, roof: 'slate' },
    { id: 'rurugar', x: 14, y: 5, w: 6, h: 5, doorX: 16, doorY: 10, roof: 'brick' },
    { id: 'mogamo', x: 23, y: 12, w: 4, h: 4, doorX: 24, doorY: 11, roof: 'moss' }
  ];

  for (const house of houses) {
    for (let yy = house.y; yy < house.y + house.h; yy++) {
      for (let xx = house.x; xx < house.x + house.w; xx++) {
        map[yy][xx] = `house_${house.roof}`;
        blocked.push(`${xx},${yy}`);
      }
    }
    map[house.doorY][house.doorX] = 'door';
    const idx = blocked.indexOf(`${house.doorX},${house.doorY}`);
    if (idx >= 0) blocked.splice(idx, 1);
    houseDoors.push({ id: house.id, x: house.doorX, y: house.doorY });
  }

  fillRect(map, 29, 10, 2, 5, 'stone');
  fillRect(map, 29, 11, 2, 3, 'pathMarker');

  return {
    cols, rows, map,
    spawn: { x: 5, y: 12 },
    landOffset: { x: 1, y: 0 },
    blocked: new Set(blocked),
    npcs: [
      { id: 'taart', name: 'タート', sprite: 'taart', x: 19, y: 13, lines: ['配達はまだ先だが、村の空気はいつも見ておきたくてな。', '今日は静かな朝だ。'] },
      { id: 'lumina', name: 'ルミナ', sprite: 'lumina', x: 10, y: 16, lines: ['朝の村は、石の色がいちばんきれいに見える時間なの。'] }
    ],
    hotspots: [],
    autoStep() {
      const door = houseDoors.find(d => d.x === state.player.x && d.y === state.player.y);
      if (door?.id === 'home') warpToScene('home');
      if (door?.id === 'rurugar') {
        if (state.progress < 2) state.progress = 2;
        warpToScene('rurugar');
      }
    },
    drawDecor(camera) {
      drawVillageLabels(camera);
    }
  };
}

const scenes = {
  home: {
    cols: 16,
    rows: 12,
    map: (() => {
      const map = createBorderMap(16, 12);
      fillRect(map, 2, 2, 12, 8, 'wood');
      fillRect(map, 6, 10, 2, 1, 'exit');
      map[3][7] = 'table';
      map[3][8] = 'table';
      map[2][11] = 'bed';
      map[2][12] = 'bed';
      map[7][11] = 'shelf';
      map[7][12] = 'shelf';
      map[8][3] = 'rug';
      map[8][4] = 'rug';
      return map;
    })(),
    spawn: { x: 7, y: 8 },
    landPos: { x: 10, y: 8 },
    blocked: new Set(['7,3', '8,3', '11,2', '12,2', '11,7', '12,7']),
    npcs: [],
    hotspots: [
      {
        id: 'note', x: 7, y: 4, label: '母のメモ',
        lines: [
          { name: '母のメモ', text: '急に決まって、先に出ます。お父さんの友だちのお見舞いで、わたしも一緒に行ってきます。' },
          { name: '母のメモ', text: 'お願い\n・ルルガーおじさんの様子を毎日見に行く\n・できたら手伝う\n・ごはんは一緒に食べる\n・ランドのごはん\n・ランドの散歩\n\n三日くらいで帰れると思います。よろしく！' }
        ],
        onComplete() {
          if (state.progress === 0) {
            state.progress = 1;
            state.land.follow = true;
            updateObjective();
            saveGame();
          }
        }
      }
    ],
    autoStep() {
      if (state.player.x >= 6 && state.player.x <= 7 && state.player.y === 10 && state.progress >= 1) {
        warpToScene('village');
      }
    },
    drawDecor() {}
  },
  village: buildVillageScene(),
  rurugar: {
    cols: 18,
    rows: 13,
    map: (() => {
      const map = createBorderMap(18, 13);
      fillRect(map, 2, 2, 14, 9, 'stoneFloor');
      fillRect(map, 8, 11, 2, 1, 'exit');
      fillRect(map, 11, 3, 3, 2, 'kitchen');
      map[5][7] = 'table';
      map[5][8] = 'table';
      map[5][9] = 'table';
      map[3][4] = 'shelf';
      map[8][13] = 'barrel';
      return map;
    })(),
    spawn: { x: 9, y: 10 },
    landPos: { x: 10, y: 10 },
    blocked: new Set(['11,3', '12,3', '13,3', '11,4', '12,4', '13,4', '7,5', '8,5', '9,5', '4,3', '13,8']),
    npcs: [
      {
        id: 'rurugar', name: 'ルルガー', sprite: 'rurugar', x: 13, y: 6,
        lines: ['来たか、コルパン。まずは様子を見に来たというだけでも十分だ。', '昼の仕度はこれからだ。少しずつ整えていこう。']
      }
    ],
    hotspots: [],
    autoEnter() {
      if (!state.sceneTriggered.rurugar_intro) {
        state.sceneTriggered.rurugar_intro = true;
        showDialogue([
          { name: 'ナレーション', text: 'ルルガーの家は、自宅よりも広く、石と木の匂いが落ち着く。' },
          { name: 'ナレーション', text: 'まずは本人の前まで行って、顔を見せよう。' }
        ]);
      }
    },
    autoStep() {
      if (state.player.x >= 8 && state.player.x <= 9 && state.player.y === 11) {
        warpToScene('village', { x: 16, y: 11 });
      }
    },
    drawDecor() {}
  }
};

function currentScene() {
  return scenes[state.scene];
}

function saveGame() {
  const data = {
    scene: state.scene,
    player: state.player,
    land: state.land,
    progress: state.progress,
    sceneTriggered: state.sceneTriggered,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (!scenes[data.scene]) return false;
    state.scene = data.scene;
    state.player = { ...(data.player || { x: 7, y: 8, dir: 'down' }), stepFrame: 1 };
    state.land = { ...(data.land || { x: 8, y: 8, dir: 'left', follow: false }), stepFrame: 1 };
    state.progress = data.progress || 0;
    state.sceneTriggered = data.sceneTriggered || {};
    state.lastMoveAt = 0;
    updateObjective();
    return true;
  } catch {
    return false;
  }
}

function resetState() {
  state.scene = 'home';
  state.move = { up: false, down: false, left: false, right: false };
  state.player = { x: 7, y: 8, dir: 'down', stepFrame: 1 };
  state.land = { x: 10, y: 8, dir: 'left', follow: false, stepFrame: 1 };
  state.progress = 0;
  state.nearNpcId = null;
  state.nearHotspotId = null;
  state.dialogueQueue = [];
  state.currentDialogue = null;
  state.sceneTriggered = {};
  state.lastMoveAt = 0;
  updateObjective();
  localStorage.removeItem(SAVE_KEY);
}

function startGame(load = false) {
  titleScreen.classList.remove('active');
  gameScreen.classList.add('active');
  const ok = load && loadGame();
  if (!ok) {
    resetState();
    triggerSceneAutoEnter();
  }
  updateInteractionTargets();
  saveGame();
}

function showDialogue(queue, onComplete) {
  state.dialogueQueue = queue.slice();
  dialogueBox.classList.remove('hidden');
  setControlsDisabled(true);
  nextDialogueBtn.onclick = () => advanceDialogue(onComplete);
  advanceDialogue(onComplete);
}

function advanceDialogue(onComplete) {
  const next = state.dialogueQueue.shift();
  if (!next) {
    dialogueBox.classList.add('hidden');
    state.currentDialogue = null;
    setControlsDisabled(false);
    if (onComplete) onComplete();
    updateInteractionTargets();
    return;
  }
  state.currentDialogue = next;
  dialogueName.textContent = next.name;
  dialogueText.textContent = next.text;
}

function warpToScene(sceneName, overrideSpawn = null) {
  state.scene = sceneName;
  const scene = currentScene();
  const spawn = overrideSpawn || scene.spawn;
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  state.player.dir = 'down';
  state.player.stepFrame = 1;
  if (state.land.follow) {
    if (scene.landPos) {
      state.land.x = scene.landPos.x;
      state.land.y = scene.landPos.y;
    } else if (scene.landOffset) {
      state.land.x = state.player.x + scene.landOffset.x;
      state.land.y = state.player.y + scene.landOffset.y;
    } else {
      state.land.x = state.player.x + 1;
      state.land.y = state.player.y;
    }
    state.land.stepFrame = 1;
  }
  state.lastMoveAt = 0;
  triggerSceneAutoEnter();
  updateObjective();
  updateInteractionTargets();
  saveGame();
}

function triggerSceneAutoEnter() {
  const scene = currentScene();
  if (scene.autoEnter) scene.autoEnter();
  if (state.scene === 'home' && !state.sceneTriggered.home_intro) {
    state.sceneTriggered.home_intro = true;
    showDialogue([
      { name: 'ナレーション', text: '両親が出発した次の日の朝。家の中は少し静かだ。' },
      { name: 'ナレーション', text: '真ん中のテーブルに、母さんのメモが残されている。' }
    ]);
  }
}

function sceneBlocked(scene, x, y) {
  if (x < 0 || y < 0 || x >= scene.cols || y >= scene.rows) return true;
  return scene.blocked.has(`${x},${y}`);
}

function movePlayer(dx, dy, dir) {
  if (isDialogueOpen()) return;
  const scene = currentScene();
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  state.player.dir = dir;
  if (sceneBlocked(scene, nx, ny)) return;
  const prevX = state.player.x;
  const prevY = state.player.y;
  state.player.x = nx;
  state.player.y = ny;
  state.player.stepFrame = state.player.stepFrame === 1 ? 0 : state.player.stepFrame === 0 ? 2 : 1;
  if (state.land.follow) {
    state.land.x = prevX;
    state.land.y = prevY;
    state.land.dir = dir;
    state.land.stepFrame = state.player.stepFrame;
  }
  updateInteractionTargets();
  if (scene.autoStep) scene.autoStep();
  updateObjectiveByPosition();
  saveGame();
}

function updateObjectiveByPosition() {
  if (state.scene === 'rurugar' && state.progress === 2) {
    const npc = currentScene().npcs.find(n => n.id === 'rurugar');
    if (npc && Math.abs(state.player.x - npc.x) + Math.abs(state.player.y - npc.y) <= 1) {
      state.progress = 3;
      updateObjective();
      saveGame();
    }
  }
}

function updateInteractionTargets() {
  const scene = currentScene();
  state.nearHotspotId = null;
  state.nearNpcId = null;

  for (const hotspot of scene.hotspots) {
    if (Math.abs(state.player.x - hotspot.x) + Math.abs(state.player.y - hotspot.y) <= 1) {
      state.nearHotspotId = hotspot.id;
      break;
    }
  }
  for (const npc of scene.npcs) {
    if (Math.abs(state.player.x - npc.x) + Math.abs(state.player.y - npc.y) <= 1) {
      state.nearNpcId = npc.id;
      break;
    }
  }
  interactBtn.style.display = state.nearHotspotId || state.nearNpcId ? 'block' : 'none';
}

function interact() {
  if (isDialogueOpen()) return;
  const scene = currentScene();
  if (state.nearHotspotId) {
    const hotspot = scene.hotspots.find(h => h.id === state.nearHotspotId);
    if (!hotspot) return;
    showDialogue(hotspot.lines, hotspot.onComplete);
    return;
  }
  if (state.nearNpcId) {
    const npc = scene.npcs.find(n => n.id === state.nearNpcId);
    if (!npc) return;
    showDialogue(npc.lines.map(text => ({ name: npc.name, text })));
  }
}

function getCameraForScene(scene) {
  if (scene.cols <= VIEW_COLS && scene.rows <= VIEW_ROWS) {
    return { x: 0, y: 0, w: WORLD_W, h: WORLD_H };
  }
  const maxX = Math.max(0, scene.cols * TILE - WORLD_W);
  const maxY = Math.max(0, scene.rows * TILE - WORLD_H);
  let x = state.player.x * TILE + TILE / 2 - WORLD_W / 2;
  let y = state.player.y * TILE + TILE / 2 - WORLD_H / 2;
  x = Math.max(0, Math.min(maxX, x));
  y = Math.max(0, Math.min(maxY, y));
  return { x, y, w: WORLD_W, h: WORLD_H };
}

function draw() {
  const scene = currentScene();
  const camera = getCameraForScene(scene);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WORLD_W, WORLD_H);
  ctx.clip();
  ctx.translate(-camera.x, -camera.y);

  drawSceneTiles(scene, camera);
  drawHotspots(scene);
  drawNpcs(scene);
  if (state.land.follow || state.scene === 'home') drawActorSprite(assets.land, state.land, 0.88);
  drawActorSprite(assets.hero, state.player, 1.0, true);
  if (scene.drawDecor) scene.drawDecor(camera);

  ctx.restore();
}

function drawSceneTiles(scene, camera) {
  const startX = Math.max(0, Math.floor(camera.x / TILE) - 1);
  const endX = Math.min(scene.cols, Math.ceil((camera.x + camera.w) / TILE) + 1);
  const startY = Math.max(0, Math.floor(camera.y / TILE) - 1);
  const endY = Math.min(scene.rows, Math.ceil((camera.y + camera.h) / TILE) + 1);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      drawTile(scene.map[y][x], x, y);
    }
  }
}

function drawTile(tile, x, y) {
  const px = x * TILE;
  const py = y * TILE;
  if (tile === 'wall') {
    fillTile(px, py, '#5c5142');
    strokeTile(px, py, '#807057');
  } else if (tile === 'floor') {
    fillTile(px, py, '#8f7b60');
    drawGrid(px, py, '#7d6d58');
  } else if (tile === 'wood') {
    fillTile(px, py, '#8a6b46');
    drawPlanks(px, py, '#74593d');
  } else if (tile === 'stoneFloor') {
    fillTile(px, py, '#7e786f');
    drawGrid(px, py, '#6b655d');
  } else if (tile === 'exit') {
    fillTile(px, py, '#b29a71');
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px + 10, py + 10, TILE - 20, TILE - 20);
  } else if (tile === 'table') {
    fillTile(px, py, '#8f7b60');
    ctx.fillStyle = '#5e4029';
    ctx.fillRect(px + 6, py + 10, TILE - 12, TILE - 20);
  } else if (tile === 'bed') {
    fillTile(px, py, '#8f7b60');
    ctx.fillStyle = '#a54343';
    ctx.fillRect(px + 6, py + 8, TILE - 12, TILE - 16);
    ctx.fillStyle = '#ddd4c8';
    ctx.fillRect(px + 8, py + 10, 16, 12);
  } else if (tile === 'shelf') {
    fillTile(px, py, '#8f7b60');
    ctx.fillStyle = '#5f452c';
    ctx.fillRect(px + 8, py + 6, TILE - 16, TILE - 12);
  } else if (tile === 'kitchen') {
    fillTile(px, py, '#7e786f');
    ctx.fillStyle = '#6d4e2e';
    ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
  } else if (tile === 'rug') {
    fillTile(px, py, '#8a6b46');
    ctx.fillStyle = '#406c8a';
    ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
  } else if (tile === 'barrel') {
    fillTile(px, py, '#7e786f');
    ctx.fillStyle = '#6d4b2c';
    ctx.beginPath();
    ctx.ellipse(px + TILE / 2, py + TILE / 2, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (tile === 'grass') {
    fillTile(px, py, '#62814c');
    drawGrass(px, py);
  } else if (tile === 'road') {
    fillTile(px, py, '#9c927d');
    drawGrid(px, py, '#857a65');
  } else if (tile === 'dirt') {
    fillTile(px, py, '#856d51');
    drawPebbles(px, py);
  } else if (tile === 'stone') {
    fillTile(px, py, '#7e786f');
    drawGrid(px, py, '#666159');
  } else if (tile === 'pathMarker') {
    fillTile(px, py, '#7e786f');
    ctx.fillStyle = '#b8d0c0';
    ctx.fillRect(px + 14, py + 6, 20, TILE - 12);
  } else if (tile === 'tree') {
    fillTile(px, py, '#3b5a30');
    ctx.fillStyle = '#28401f';
    ctx.beginPath();
    ctx.arc(px + 24, py + 20, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6f4d31';
    ctx.fillRect(px + 20, py + 24, 8, 18);
  } else if (tile.startsWith('house_')) {
    fillTile(px, py, '#7c7060');
    const roof = tile.replace('house_', '');
    const color = roof === 'brick' ? '#9b5a4d' : roof === 'moss' ? '#61774f' : '#69707f';
    ctx.fillStyle = color;
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#e6dcc9';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
  } else if (tile === 'door') {
    fillTile(px, py, '#8f8a7b');
    ctx.fillStyle = '#5a3b25';
    ctx.fillRect(px + 12, py + 8, 24, 32);
    ctx.fillStyle = '#d9b35e';
    ctx.fillRect(px + 28, py + 23, 4, 4);
  } else {
    fillTile(px, py, '#cc00cc');
  }
}

function fillTile(px, py, color) {
  ctx.fillStyle = color;
  ctx.fillRect(px, py, TILE, TILE);
}
function strokeTile(px, py, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, TILE, TILE);
}
function drawGrid(px, py, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + TILE / 2, py);
  ctx.lineTo(px + TILE / 2, py + TILE);
  ctx.moveTo(px, py + TILE / 2);
  ctx.lineTo(px + TILE, py + TILE / 2);
  ctx.stroke();
}
function drawPlanks(px, py, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(px, py + i * 12);
    ctx.lineTo(px + TILE, py + i * 12);
    ctx.stroke();
  }
}
function drawGrass(px, py) {
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(px + 6, py + 8, 4, 12);
  ctx.fillRect(px + 22, py + 14, 3, 10);
  ctx.fillRect(px + 34, py + 10, 4, 14);
}
function drawPebbles(px, py) {
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(px + 10, py + 12, 4, 4);
  ctx.fillRect(px + 28, py + 24, 5, 5);
  ctx.fillRect(px + 18, py + 32, 3, 3);
}

function getSpriteFrameRect(img, dir, frameIndex) {
  const cols = 3;
  const rows = 4;
  const frameW = Math.floor(img.width / cols);
  const frameH = Math.floor(img.height / rows);
  const rowMap = { down: 0, left: 1, right: 2, up: 3 };
  const row = rowMap[dir] ?? 0;
  const col = Math.max(0, Math.min(2, frameIndex ?? 1));
  return { sx: col * frameW, sy: row * frameH, sw: frameW, sh: frameH };
}

function drawActorSprite(img, actor, scale = 1, emphasize = false) {
  const { sx, sy, sw, sh } = getSpriteFrameRect(img, actor.dir, actor.stepFrame ?? 1);
  const drawH = TILE * 1.72 * scale;
  const drawW = (sw / sh) * drawH;
  const x = actor.x * TILE + (TILE - drawW) / 2;
  const y = actor.y * TILE + TILE - drawH + 4;

  if (emphasize) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(actor.x * TILE + TILE / 2, actor.y * TILE + TILE - 6, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, drawW, drawH);
}

function drawNpcs(scene) {
  for (const npc of scene.npcs) {
    drawActorSprite(assets[npc.sprite], { x: npc.x, y: npc.y, dir: 'down', stepFrame: 1 }, 1.0);
  }
}

function drawHotspots(scene) {
  for (const hotspot of scene.hotspots) {
    ctx.fillStyle = 'rgba(255, 223, 120, 0.22)';
    ctx.fillRect(hotspot.x * TILE + 10, hotspot.y * TILE + 10, TILE - 20, TILE - 20);
  }
}

function drawVillageLabels(camera) {
  if (state.scene !== 'village') return;
  const labels = [
    ['コルパンの家', 3.8, 6.3],
    ['ルルガーの家', 13.4, 4.2],
    ['墓地方面', 27.7, 10.4]
  ];
  ctx.font = '14px sans-serif';
  for (const [text, tx, ty] of labels) {
    const x = tx * TILE;
    const y = ty * TILE;
    const width = ctx.measureText(text).width + 12;
    if (x + width < camera.x || x > camera.x + camera.w || y + 20 < camera.y || y > camera.y + camera.h) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, width, 20);
    ctx.fillStyle = '#f2eedf';
    ctx.fillText(text, x + 6, y + 14);
  }
}

function stepMovement(now) {
  if (isDialogueOpen()) return;
  if (now - state.lastMoveAt < STEP_INTERVAL_MS) return;

  if (state.move.up) movePlayer(0, -1, 'up');
  else if (state.move.down) movePlayer(0, 1, 'down');
  else if (state.move.left) movePlayer(-1, 0, 'left');
  else if (state.move.right) movePlayer(1, 0, 'right');
  else return;

  state.lastMoveAt = now;
}

function loop(now = 0) {
  stepMovement(now);
  updateInteractionTargets();
  draw();
  requestAnimationFrame(loop);
}

function bindControls() {
  document.getElementById('newGameBtn').addEventListener('click', () => startGame(false));
  document.getElementById('continueBtn').addEventListener('click', () => startGame(true));
  document.getElementById('resetBtn').addEventListener('click', () => {
    gameScreen.classList.remove('active');
    titleScreen.classList.add('active');
    dialogueBox.classList.add('hidden');
    state.dialogueQueue = [];
    state.currentDialogue = null;
    setControlsDisabled(false);
    Object.keys(state.move).forEach(key => { state.move[key] = false; });
  });
  interactBtn.addEventListener('click', interact);

  document.querySelectorAll('[data-dir]').forEach((button) => {
    const dir = button.dataset.dir;
    const press = (e) => {
      e.preventDefault();
      if (isDialogueOpen()) return;
      Object.keys(state.move).forEach(key => { state.move[key] = false; });
      state.move[dir] = true;
      state.lastMoveAt = 0;
    };
    const release = (e) => {
      e.preventDefault();
      state.move[dir] = false;
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isDialogueOpen()) advanceDialogue();
      else interact();
      return;
    }
    if (isDialogueOpen()) return;
    if (e.key === 'ArrowUp') { state.move.up = true; state.lastMoveAt = 0; }
    if (e.key === 'ArrowDown') { state.move.down = true; state.lastMoveAt = 0; }
    if (e.key === 'ArrowLeft') { state.move.left = true; state.lastMoveAt = 0; }
    if (e.key === 'ArrowRight') { state.move.right = true; state.lastMoveAt = 0; }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') state.move.up = false;
    if (e.key === 'ArrowDown') state.move.down = false;
    if (e.key === 'ArrowLeft') state.move.left = false;
    if (e.key === 'ArrowRight') state.move.right = false;
  });
}

loadAssets().then(() => {
  bindControls();
  updateObjective();
  updateInteractionTargets();
  loop();
});
