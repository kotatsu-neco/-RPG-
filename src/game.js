const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const TILE = 16;
const COLS = 20;
const ROWS = 30;

const palette = {
  grass: "#5e7a4e",
  grassDark: "#3f5a36",
  dirt: "#8c6b3f",
  dirtDark: "#6e5232",
  stone: "#6e7681",
  stoneDark: "#4f5964",
  wall: "#7a6f63",
  roof: "#7b4a2f",
  wood: "#5a3e2b",
  outline: "#2a2f36",
};

const state = {
  map: null,
  player: { x: 9, y: 18, facing: "down", step: 0 },
  land: { x: 8, y: 19, frame: 0 },
  dialogueOpen: false,
  dialogueIndex: 0,
  activeNpc: null,
  noticeTimer: null,
  lastNoticeId: null,
  keys: new Set(),
  images: {},
};

const dialogLayer = document.getElementById("dialog-layer");
const nameplate = document.getElementById("nameplate");
const dialogText = document.getElementById("dialog-text");
const dialogWindow = document.getElementById("dialog-window");
const dialogTapCatcher = document.getElementById("dialog-tap-catcher");
const noticeLayer = document.getElementById("notice-layer");
const noticeWindow = document.getElementById("notice-window");
const choiceBox = document.getElementById("choice-box");
const actionButton = document.getElementById("action-button");
const touchControls = document.getElementById("touch-controls");

function asset(path) {
  return path;
}

function loadImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = asset(path);
  });
}

async function boot() {
  state.map = await fetch("assets/maps/prototype/one_screen_map.json").then((res) => res.json());
  state.player.x = state.map.playerStart.x;
  state.player.y = state.map.playerStart.y;
  state.land.x = state.map.landStart.x;
  state.land.y = state.map.landStart.y;

  const colpan = [
    "assets/sprites/colpan/spr_colpan_proto_seq01_frame01.png",
    "assets/sprites/colpan/spr_colpan_proto_seq01_frame02.png",
    "assets/sprites/colpan/spr_colpan_proto_seq01_frame03.png",
    "assets/sprites/colpan/spr_colpan_proto_seq01_frame04.png",
  ];
  const land = [
    "assets/sprites/land/spr_land_large_dog_right_01.png?v=0.3",
    "assets/sprites/land/spr_land_large_dog_right_02.png?v=0.3",
    "assets/sprites/land/spr_land_large_dog_right_03.png?v=0.3",
    "assets/sprites/land/spr_land_large_dog_right_04.png?v=0.3",
  ];

  state.images.colpan = await Promise.all(colpan.map(loadImage));
  state.images.land = await Promise.all(land.map(loadImage));

  for (const npc of state.map.npcs) {
    state.images[npc.id] = await loadImage(npc.sprite);
  }

  bindInput();
  syncOverlayState();
  updateActionButtonLabel();
  requestAnimationFrame(loop);
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "Enter", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "Enter" || event.key === " ") {
      interact();
      return;
    }

    const dir = keyToDirection(event.key);
    if (dir) movePlayer(dir);
  });

  for (const button of document.querySelectorAll(".dpad button")) {
    button.addEventListener("pointerdown", () => movePlayer(button.dataset.dir));
  }

  actionButton.addEventListener("click", interact);

  dialogWindow.addEventListener("click", (event) => {
    if (!state.dialogueOpen) return;
    if (event.target.closest(".choice")) return;
    event.preventDefault();
    advanceDialogue();
  });

  dialogWindow.addEventListener("touchend", (event) => {
    if (!state.dialogueOpen) return;
    if (event.target.closest(".choice")) return;
    event.preventDefault();
    advanceDialogue();
  }, { passive: false });

  dialogTapCatcher.addEventListener("click", (event) => {
    if (!state.dialogueOpen) return;
    event.preventDefault();
    advanceDialogue();
  });

  dialogTapCatcher.addEventListener("touchend", (event) => {
    if (!state.dialogueOpen) return;
    event.preventDefault();
    advanceDialogue();
  }, { passive: false });
}

function keyToDirection(key) {
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  return map[key] || null;
}

function movePlayer(dir) {
  if (state.dialogueOpen) return;

  state.player.facing = dir;
  const delta = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  }[dir];

  const nextX = state.player.x + delta[0];
  const nextY = state.player.y + delta[1];

  if (isBlocked(nextX, nextY)) {
    updateActionButtonLabel();
    return;
  }

  const oldX = state.player.x;
  const oldY = state.player.y;

  state.player.x = nextX;
  state.player.y = nextY;
  state.player.step = (state.player.step + 1) % 4;

  // ランドの仮追従。1歩遅れてプレイヤーの旧位置へ。
  state.land.x = oldX;
  state.land.y = oldY + 1 <= ROWS - 2 && !isBlocked(oldX, oldY + 1) ? oldY + 1 : oldY;
  state.land.frame = (state.land.frame + 1) % 4;

  checkTileTriggers();
  updateActionButtonLabel();
}

function isBlocked(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  return state.map.blockedTiles.some(([bx, by]) => bx === x && by === y);
}



function checkTileTriggers() {
  if (!state.map.triggers || state.dialogueOpen) return;

  const trigger = state.map.triggers.find((item) => {
    if (Array.isArray(item.tiles)) {
      return item.tiles.some(([tx, ty]) => tx === state.player.x && ty === state.player.y);
    }
    return item.x === state.player.x && item.y === state.player.y;
  });

  if (!trigger) {
    state.lastNoticeId = null;
    return;
  }

  if (trigger.id === state.lastNoticeId && state.noticeTimer) return;
  state.lastNoticeId = trigger.id;

  if (trigger.type === "notice") {
    showNotice(trigger.text);
  }
}



function showNotice(text) {
  if (state.noticeTimer) {
    clearTimeout(state.noticeTimer);
  }

  noticeWindow.textContent = text;
  noticeLayer.classList.remove("hidden");
  document.body.classList.add("event-locked");
  updateActionButtonLabel();

  state.noticeTimer = setTimeout(() => {
    noticeLayer.classList.add("hidden");
    document.body.classList.remove("event-locked");
    state.noticeTimer = null;
    updateActionButtonLabel();
  }, 2200);
}



function getAdjacentNpc() {
  const target = getFacingTile();
  return state.map.npcs.find((n) => n.x === target.x && n.y === target.y) || null;
}

function tileMatches(tileList, x, y) {
  return Array.isArray(tileList) && tileList.some(([tx, ty]) => tx === x && ty === y);
}

function getFacingInteractable() {
  if (!state.map.interactables) return null;
  const target = getFacingTile();
  return state.map.interactables.find((item) => {
    return tileMatches(item.tiles, target.x, target.y) || tileMatches(item.tiles, state.player.x, state.player.y);
  }) || null;
}

function updateActionButtonLabel() {
  if (state.dialogueOpen) {
    actionButton.textContent = "送る";
    actionButton.className = "";
    return;
  }

  const npc = getAdjacentNpc();
  if (npc) {
    actionButton.textContent = "話す";
    actionButton.className = "action-talk";
    return;
  }

  const interactable = getFacingInteractable();
  if (interactable) {
    actionButton.textContent = interactable.actionLabel || "調べる";
    actionButton.className = "action-enter";
    return;
  }

  actionButton.textContent = "決定";
  actionButton.className = "";
}

function interact() {
  if (state.noticeTimer) {
    clearTimeout(state.noticeTimer);
    noticeLayer.classList.add("hidden");
    document.body.classList.remove("event-locked");
    state.noticeTimer = null;
    updateActionButtonLabel();
    return;
  }

  if (state.dialogueOpen) {
    advanceDialogue();
    return;
  }

  const npc = getAdjacentNpc();
  if (npc) {
    openDialogue(npc);
    return;
  }

  const interactable = getFacingInteractable();
  if (interactable) {
    showNotice(interactable.text || `${interactable.name}を調べた。`);
    return;
  }
}

function getFacingTile() {
  const d = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  }[state.player.facing];

  return {
    x: state.player.x + d[0],
    y: state.player.y + d[1],
  };
}


function syncOverlayState() {
  document.body.classList.toggle("dialogue-open", state.dialogueOpen);
  if (state.dialogueOpen) {
    touchControls.classList.add("hidden");
    dialogTapCatcher.classList.remove("hidden");
  } else {
    touchControls.classList.remove("hidden");
    dialogTapCatcher.classList.add("hidden");
  }
}

function openDialogue(npc) {
  state.dialogueOpen = true;
  state.dialogueIndex = 0;
  state.activeNpc = npc;
  nameplate.textContent = npc.name;
  dialogText.textContent = npc.dialogue[0];
  choiceBox.classList.add("hidden");
  dialogLayer.classList.remove("hidden");
  syncOverlayState();
  updateActionButtonLabel();
}

function advanceDialogue() {
  const npc = state.activeNpc;
  state.dialogueIndex += 1;

  if (state.dialogueIndex < npc.dialogue.length) {
    dialogText.textContent = npc.dialogue[state.dialogueIndex];
    return;
  }

  if (npc.choices && npc.choices.length && choiceBox.classList.contains("hidden")) {
    choiceBox.innerHTML = "";
    npc.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice ${index === 0 ? "selected" : ""}`;
      button.textContent = choice;
      button.addEventListener("click", (event) => {
      event.stopPropagation();
      closeDialogue();
    });
      choiceBox.appendChild(button);
    });
    choiceBox.classList.remove("hidden");
    dialogText.textContent = "どうする？";
    actionButton.textContent = "選ぶ";
    return;
  }

  closeDialogue();
}

function closeDialogue() {
  state.dialogueOpen = false;
  state.dialogueIndex = 0;
  state.activeNpc = null;
  dialogLayer.classList.add("hidden");
  syncOverlayState();
  updateActionButtonLabel();
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

function draw() {
  drawBaseMap();
  drawObjects();
  drawCharacters();
}

function drawBaseMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE;
      const py = y * TILE;

      if (y < 6) {
        ctx.fillStyle = palette.wall;
      } else if (x >= 7 && x <= 12) {
        ctx.fillStyle = y % 2 === 0 ? palette.dirt : palette.dirtDark;
      } else if ((x + y) % 7 === 0) {
        ctx.fillStyle = palette.grassDark;
      } else {
        ctx.fillStyle = palette.grass;
      }

      ctx.fillRect(px, py, TILE, TILE);

      if (x >= 7 && x <= 12 && y >= 6 && y <= 27) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(px + 2, py + 7, 10, 1);
      }
    }
  }

  // 石畳っぽい家前導線
  for (let y = 8; y <= 12; y++) {
    for (let x = 8; x <= 11; x++) {
      ctx.fillStyle = palette.stone;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeStyle = palette.stoneDark;
      ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
    }
  }
}

function drawObjects() {
  // ルルガー家 外観仮描画
  drawHouse(4, 1, 12, 6);

  // 畑
  for (let y = 10; y <= 15; y++) {
    for (let x = 13; x <= 16; x++) {
      ctx.fillStyle = "#6e5232";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.moveTo(x * TILE + 2, y * TILE + 4);
      ctx.lineTo(x * TILE + 14, y * TILE + 12);
      ctx.stroke();
    }
  }

  // 井戸
  ctx.fillStyle = palette.stoneDark;
  ctx.fillRect(4 * TILE, 13 * TILE, TILE * 2, TILE * 2);
  ctx.fillStyle = "#303945";
  ctx.fillRect(4 * TILE + 7, 13 * TILE + 6, TILE, TILE);
  ctx.strokeStyle = "#1f2429";
  ctx.strokeRect(4 * TILE, 13 * TILE, TILE * 2, TILE * 2);

  // 樽・箱
  ctx.fillStyle = palette.wood;
  ctx.fillRect(14 * TILE, 8 * TILE, TILE, TILE);
  ctx.fillRect(15 * TILE, 8 * TILE, TILE, TILE);
  ctx.fillStyle = "#7b4a2f";
  ctx.fillRect(3 * TILE, 17 * TILE, TILE, TILE);

  // ルルガー家入口の目印
  ctx.fillStyle = "#d8d5cf";
  ctx.fillRect(9 * TILE, 6 * TILE, TILE * 2, 2);

  // v0.6 entrance guide: 次工程確認用の入口判定エリア
  ctx.fillStyle = "rgba(198, 163, 95, 0.22)";
  ctx.fillRect(9 * TILE, 7 * TILE, TILE * 2, TILE);
  ctx.strokeStyle = "rgba(198, 163, 95, 0.75)";
  ctx.strokeRect(9 * TILE + 1, 7 * TILE + 1, TILE * 2 - 2, TILE - 2);
}

function drawHouse(x, y, w, h) {
  const px = x * TILE;
  const py = y * TILE;

  ctx.fillStyle = palette.roof;
  ctx.fillRect(px - TILE, py, (w + 2) * TILE, TILE * 2);
  ctx.fillStyle = "#5a3e2b";
  ctx.fillRect(px - TILE, py + TILE, (w + 2) * TILE, 4);

  ctx.fillStyle = palette.wall;
  ctx.fillRect(px, py + TILE * 2, w * TILE, h * TILE);

  ctx.strokeStyle = palette.stoneDark;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      ctx.strokeRect(px + col * TILE, py + TILE * 2 + row * TILE, TILE, TILE);
    }
  }

  // 扉
  ctx.fillStyle = palette.wood;
  ctx.fillRect(px + 5 * TILE, py + 4 * TILE, TILE * 2, TILE * 3);

  // 窓
  ctx.fillStyle = "#6b7c8c";
  ctx.fillRect(px + 2 * TILE, py + 3 * TILE, TILE * 2, TILE * 2);
  ctx.fillRect(px + 8 * TILE, py + 3 * TILE, TILE * 2, TILE * 2);
}

function drawCharacters() {
  const drawable = [
    { type: "land", x: state.land.x, y: state.land.y, image: state.images.land[state.land.frame] },
    ...state.map.npcs.map((npc) => ({ type: "npc", x: npc.x, y: npc.y, image: state.images[npc.id] })),
    { type: "player", x: state.player.x, y: state.player.y, image: state.images.colpan[state.player.step] },
  ];

  drawable.sort((a, b) => a.y - b.y);

  for (const item of drawable) {
    if (item.image) {
      const isHuman = item.type === "player" || item.type === "npc";
      const w = isHuman ? 16 : 32;
      const h = isHuman ? 32 : 28;
      const dx = item.x * TILE + (TILE - w) / 2;
      const dy = item.y * TILE + TILE - h;
      ctx.drawImage(item.image, dx, dy, w, h);
    } else {
      drawFallbackCharacter(item);
    }
  }
}

function drawFallbackCharacter(item) {
  const px = item.x * TILE;
  const py = item.y * TILE;
  if (item.type === "land") {
    ctx.fillStyle = "#a7834f";
    ctx.fillRect(px - 4, py, 24, 16);
    ctx.fillStyle = "#4f8a5b";
    ctx.fillRect(px + 6, py + 4, 8, 3);
    return;
  }

  ctx.fillStyle = item.type === "npc" ? "#6b7c8c" : "#4f8a5b";
  ctx.fillRect(px + 2, py - 16, 12, 32);
  ctx.fillStyle = "#7b4a2f";
  ctx.fillRect(px + 3, py - 18, 10, 8);
}

boot();
