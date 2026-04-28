import { TILE_SIZE } from "./constants.js";
import { TileMapRenderer } from "./TileMapRenderer.js";

export class Renderer {
  constructor({ canvas, sceneManager, actors, images, tilemaps = {}, tileset = null, objectRenderer = null }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.sceneManager = sceneManager;
    this.actors = actors;
    this.images = images;
    this.tileMapRenderer = new TileMapRenderer({ ctx: this.ctx, tilemaps, tileset });
    this.objectRenderer = objectRenderer;

    this.palette = {
      grass: "#5e7a4e",
      grassDark: "#3f5a36",
      dirt: "#8c6b3f",
      dirtDark: "#6e5232",
      stone: "#6e7681",
      stoneDark: "#4f5964",
      wall: "#7a6f63",
      roof: "#7b4a2f",
      wood: "#5a3e2b",
    };
  }

  draw() {
    this.drawBaseMap();
    this.drawObjects();

    try {
      this.drawSceneObjects();
    } catch (error) {
      console.error("[Renderer] Object rendering failed:", error);
    }

    this.drawCharacters();
  }

  drawBaseMap() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scene = this.sceneManager.currentScene;
    const drawn = this.tileMapRenderer.draw(scene.id);
    if (drawn) return;

    // Fallback for scenes that do not yet have tilemap data.
    if (scene.renderer === "interior") {
      this.drawInteriorMap();
    } else {
      this.drawVillageMap();
    }
  }

  drawVillageMap() {
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 20; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (y < 6) {
          this.ctx.fillStyle = this.palette.wall;
        } else if (x >= 7 && x <= 12) {
          this.ctx.fillStyle = y % 2 === 0 ? this.palette.dirt : this.palette.dirtDark;
        } else if ((x + y) % 7 === 0) {
          this.ctx.fillStyle = this.palette.grassDark;
        } else {
          this.ctx.fillStyle = this.palette.grass;
        }

        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        if (x >= 7 && x <= 12 && y >= 6 && y <= 27) {
          this.ctx.fillStyle = "rgba(255,255,255,0.08)";
          this.ctx.fillRect(px + 2, py + 7, 10, 1);
        }
      }
    }

    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 11; x++) {
        this.ctx.fillStyle = this.palette.stone;
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.strokeStyle = this.palette.stoneDark;
        this.ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }
  }

  drawInteriorMap() {
    this.ctx.fillStyle = "#2d3034";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 5; y <= 26; y++) {
      for (let x = 3; x <= 16; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        this.ctx.fillStyle = (x + y) % 2 === 0 ? "#6f5940" : "#665039";
        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        this.ctx.strokeStyle = "rgba(34, 24, 18, 0.25)";
        this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }

    this.rect(3, 5, 14, 3, this.palette.wall);
    this.rect(8, 17, 4, 1, this.palette.wood);
    this.rect(5, 9, 3, 2, "#5a3e2b");
    this.rect(12, 9, 3, 2, "#5a3e2b");
    this.rect(4, 15, 3, 1, this.palette.stone);
    this.rect(13, 15, 3, 1, "#4a4a4a");

    this.ctx.fillStyle = "rgba(198, 163, 95, 0.26)";
    this.ctx.fillRect(9 * TILE_SIZE, 25 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
    this.ctx.strokeStyle = "rgba(198, 163, 95, 0.75)";
    this.ctx.strokeRect(9 * TILE_SIZE + 1, 25 * TILE_SIZE + 1, TILE_SIZE * 2 - 2, TILE_SIZE * 2 - 2);
  }

  drawObjects() {
    const scene = this.sceneManager.currentScene;

    // Tilemap scenes already include prototype object layers.
    if (this.tileMapRenderer.tilemaps[scene.id]) return;

    if (scene.renderer !== "village") return;

    this.drawHouse(4, 1, 12, 6);

    for (let y = 10; y <= 15; y++) {
      for (let x = 13; x <= 16; x++) {
        this.ctx.fillStyle = this.palette.dirtDark;
        this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.strokeStyle = "rgba(0,0,0,0.2)";
        this.ctx.beginPath();
        this.ctx.moveTo(x * TILE_SIZE + 2, y * TILE_SIZE + 4);
        this.ctx.lineTo(x * TILE_SIZE + 14, y * TILE_SIZE + 12);
        this.ctx.stroke();
      }
    }

    this.drawWell(4, 13);
    this.rect(14, 8, 1, 1, this.palette.wood);
    this.rect(15, 8, 1, 1, this.palette.wood);
    this.rect(3, 17, 1, 1, this.palette.roof);

    this.ctx.fillStyle = "#d8d5cf";
    this.ctx.fillRect(9 * TILE_SIZE, 6 * TILE_SIZE, TILE_SIZE * 2, 2);

    this.ctx.fillStyle = "rgba(198, 163, 95, 0.18)";
    this.ctx.fillRect(8 * TILE_SIZE, 8 * TILE_SIZE, TILE_SIZE * 4, TILE_SIZE * 2);
    this.ctx.strokeStyle = "rgba(198, 163, 95, 0.65)";
    this.ctx.strokeRect(8 * TILE_SIZE + 1, 8 * TILE_SIZE + 1, TILE_SIZE * 4 - 2, TILE_SIZE * 2 - 2);
  }

  pickSpriteFrame(frameSets, baseFrames, facing, index = 0) {
    const directionalFrames = frameSets?.[facing] || [];
    const candidates = directionalFrames.length > 0 ? directionalFrames : (baseFrames || []);

    if (!candidates || candidates.length === 0) return null;

    const image = candidates[index % candidates.length];
    if (image && image.complete !== false && image.naturalWidth !== 0) {
      return image;
    }

    return candidates.find((candidate) => candidate && candidate.complete !== false && candidate.naturalWidth !== 0) || null;
  }

  drawCharacters() {
    const npcs = this.sceneManager.getNpcs().map((npc) => ({
      type: "npc",
      x: npc.x,
      y: npc.y,
      image: this.images[npc.spriteKey],
    }));

    const drawable = [
      {
        type: "companion",
        x: this.actors.companion.x,
        y: this.actors.companion.y,
        image: this.pickSpriteFrame(this.images.companionDirections, this.images.companion, this.actors.companion.facing, this.actors.companion.frame),
      },
      ...npcs,
      {
        type: "player",
        x: this.actors.player.x,
        y: this.actors.player.y,
        image: this.pickSpriteFrame(this.images.playerDirections, this.images.player, this.actors.player.facing, this.actors.player.step),
      },
    ];

    drawable.sort((a, b) => a.y - b.y);
    drawable.forEach((item) => this.drawCharacter(item));
  }

  drawCharacter(item) {
    if (item.image) {
      const isHuman = item.type === "player" || item.type === "npc";
      const w = isHuman ? 16 : 24;
      const h = isHuman ? 32 : 24;
      const dx = item.x * TILE_SIZE + (TILE_SIZE - w) / 2;
      const dy = item.y * TILE_SIZE + TILE_SIZE - h;
      this.ctx.drawImage(item.image, dx, dy, w, h);
      return;
    }

    this.drawFallbackCharacter(item);
  }

  drawFallbackCharacter(item) {
    const px = item.x * TILE_SIZE;
    const py = item.y * TILE_SIZE;

    if (item.type === "companion") {
      this.ctx.fillStyle = "#a7834f";
      this.ctx.fillRect(px - 4, py, 24, 16);
      this.ctx.fillStyle = "#4f8a5b";
      this.ctx.fillRect(px + 6, py + 4, 8, 3);
      return;
    }

    this.ctx.fillStyle = item.type === "npc" ? "#6b7c8c" : "#4f8a5b";
    this.ctx.fillRect(px + 2, py - 16, 12, 32);
    this.ctx.fillStyle = "#7b4a2f";
    this.ctx.fillRect(px + 3, py - 18, 10, 8);
  }

  drawHouse(x, y, w, h) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    this.ctx.fillStyle = this.palette.roof;
    this.ctx.fillRect(px - TILE_SIZE, py, (w + 2) * TILE_SIZE, TILE_SIZE * 2);

    this.ctx.fillStyle = this.palette.wood;
    this.ctx.fillRect(px - TILE_SIZE, py + TILE_SIZE, (w + 2) * TILE_SIZE, 4);

    this.ctx.fillStyle = this.palette.wall;
    this.ctx.fillRect(px, py + TILE_SIZE * 2, w * TILE_SIZE, h * TILE_SIZE);

    this.ctx.strokeStyle = this.palette.stoneDark;
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        this.ctx.strokeRect(px + col * TILE_SIZE, py + TILE_SIZE * 2 + row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    this.rect(x + 5, y + 4, 2, 3, this.palette.wood);
    this.rect(x + 2, y + 3, 2, 2, "#6b7c8c");
    this.rect(x + 8, y + 3, 2, 2, "#6b7c8c");
  }

  drawWell(x, y) {
    this.ctx.fillStyle = this.palette.stoneDark;
    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
    this.ctx.fillStyle = "#303945";
    this.ctx.fillRect(x * TILE_SIZE + 7, y * TILE_SIZE + 6, TILE_SIZE, TILE_SIZE);
    this.ctx.strokeStyle = "#1f2429";
    this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, w * TILE_SIZE, h * TILE_SIZE);
  }
}
