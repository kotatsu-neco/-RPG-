import { TILE_SIZE } from "./constants.js";

export class TileMapRenderer {
  constructor({ ctx, tilemaps, tileset = null }) {
    this.ctx = ctx;
    this.tilemaps = tilemaps;
    this.tileset = tileset;

    this.tiles = {
      0: { fill: "#5e7a4e" },
      1: { fill: "#3f5a36" },
      2: { fill: "#8c6b3f", detail: "path" },
      3: { fill: "#6e5232", detail: "path" },
      4: { fill: "#7a6f63", stroke: "#4f5964" },
      5: { fill: "#6e7681", stroke: "#4f5964" },
      6: { fill: "#6f5940", stroke: "rgba(34, 24, 18, 0.25)" },
      7: { fill: "#665039", stroke: "rgba(34, 24, 18, 0.25)" },
      8: { fill: "#2d3034" },
      9: { fill: "#7b4a2f" },
      10: { fill: "#5a3e2b" },
      11: { fill: "rgba(198, 163, 95, 0.26)", stroke: "rgba(198, 163, 95, 0.75)" },
      12: { fill: "#7a6f63", stroke: "#4f5964" },
    };
  }

  draw(sceneId) {
    const tilemap = this.tilemaps[sceneId];
    if (!tilemap) return false;

    this.activeTilemap = tilemap;

    for (const layer of tilemap.layers || []) {
      if (layer.type === "tile") {
        this.activeLayer = layer;
        this.drawTileLayer(layer.data);
      }
    }

    this.activeLayer = null;
    this.activeTilemap = null;
    return true;
  }

  getTilesetForCurrentDraw() {
    if (this.activeLayer?.tileset && this.tileset?.byId?.[this.activeLayer.tileset]) {
      return this.tileset.byId[this.activeLayer.tileset];
    }

    if (this.activeTilemap?.tileset && this.tileset?.byId?.[this.activeTilemap.tileset]) {
      return this.tileset.byId[this.activeTilemap.tileset];
    }

    return this.tileset;
  }

  drawTileLayer(data) {
    for (let y = 0; y < data.length; y++) {
      const row = data[y];
      for (let x = 0; x < row.length; x++) {
        const tileId = row[x];
        if (tileId === null || tileId === undefined) continue;
        this.drawTile(tileId, x, y);
      }
    }
  }

  drawTile(tileId, x, y) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    const currentTileset = this.getTilesetForCurrentDraw();
    const tileImage = currentTileset?.images?.[String(tileId)];
    if (tileImage) {
      this.ctx.drawImage(tileImage, px, py, TILE_SIZE, TILE_SIZE);
      return;
    }

    const tile = this.tiles[tileId] || this.tiles[0];

    this.ctx.fillStyle = tile.fill;
    this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    if (tile.stroke) {
      this.ctx.strokeStyle = tile.stroke;
      this.ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }

    if (tile.detail === "path") {
      this.ctx.fillStyle = "rgba(255,255,255,0.08)";
      this.ctx.fillRect(px + 2, py + 7, 10, 1);
    }
  }
}
