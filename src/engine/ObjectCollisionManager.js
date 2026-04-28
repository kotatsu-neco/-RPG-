export class ObjectCollisionManager {
  constructor({ objectPlacements = {}, objectAssets = {}, debug = false } = {}) {
    this.objectPlacements = objectPlacements;
    this.objectAssets = objectAssets;
    this.debug = debug;
    this.collisionByScene = new Map();
    this.rebuildAll();
  }

  setDefinitions({ objectPlacements = this.objectPlacements, objectAssets = this.objectAssets } = {}) {
    this.objectPlacements = objectPlacements;
    this.objectAssets = objectAssets;
    this.rebuildAll();
  }

  rebuildAll() {
    this.collisionByScene.clear();

    const scenes = this.objectPlacements?.scenes || {};
    for (const sceneId of Object.keys(scenes)) {
      this.rebuildScene(sceneId);
    }
  }

  rebuildScene(sceneId) {
    const objects = this.objectPlacements?.scenes?.[sceneId]?.objects || [];
    const blocked = new Map();

    for (const object of objects) {
      if (object.visible === false) continue;

      const asset = this.objectAssets?.assets?.[String(object.asset_id)];
      const collision = this.resolveCollision(object, asset);

      if (!collision.enabled) continue;

      for (const tile of collision.tiles) {
        const key = this.key(tile.x, tile.y);
        blocked.set(key, {
          x: tile.x,
          y: tile.y,
          objectId: object.id,
          assetId: object.asset_id,
          semantic_name: object.semantic_name || asset?.semantic_name || "",
          source: "objectPlacement",
        });
      }
    }

    this.collisionByScene.set(sceneId, blocked);

    if (this.debug) {
      console.info("[ObjectCollisionManager] rebuilt", sceneId, blocked.size);
    }

    return blocked;
  }

  resolveCollision(object, asset = null) {
    const collision = object.collision || {};

    if (collision.enabled === false || collision.shape === "none") {
      return { enabled: false, tiles: [] };
    }

    if (collision.enabled === true) {
      if (collision.shape === "tiles" && Array.isArray(collision.tiles)) {
        return {
          enabled: true,
          tiles: collision.tiles.map(([x, y]) => ({ x, y })),
        };
      }

      if (collision.shape === "rect") {
        return {
          enabled: true,
          tiles: this.rectToTiles(collision),
        };
      }

      // Explicit enabled=true but no shape: use conservative footprint.
      return {
        enabled: true,
        tiles: this.defaultFootprint(object, asset),
      };
    }

    // If placement omits collision but asset says collision=true, do not guess silently.
    // Use a minimal footprint to keep gameplay safe, but validator should warn.
    if (asset?.collision === true) {
      return {
        enabled: true,
        tiles: this.defaultFootprint(object, asset),
      };
    }

    return { enabled: false, tiles: [] };
  }

  rectToTiles(rect) {
    const x = rect.x ?? 0;
    const y = rect.y ?? 0;
    const width = rect.width ?? 1;
    const height = rect.height ?? 1;
    const tiles = [];

    for (let ty = y; ty < y + height; ty += 1) {
      for (let tx = x; tx < x + width; tx += 1) {
        tiles.push({ x: tx, y: ty });
      }
    }

    return tiles;
  }

  defaultFootprint(object, asset) {
    const width = asset?.width || object.width || 16;
    const height = asset?.height || object.height || 16;
    const cols = Math.max(1, Math.ceil(width / 16));
    const rows = Math.max(1, Math.ceil(height / 16));
    const startX = Math.floor(object.x - (cols - 1) / 2);
    const startY = Math.floor(object.y - rows + 1);
    const tiles = [];

    for (let dy = 0; dy < rows; dy += 1) {
      for (let dx = 0; dx < cols; dx += 1) {
        tiles.push({ x: startX + dx, y: startY + dy });
      }
    }

    return tiles;
  }

  isBlocked(sceneId, x, y) {
    return this.collisionByScene.get(sceneId)?.has(this.key(x, y)) || false;
  }

  getCollisionAt(sceneId, x, y) {
    return this.collisionByScene.get(sceneId)?.get(this.key(x, y)) || null;
  }

  getSceneCollisionTiles(sceneId) {
    return [...(this.collisionByScene.get(sceneId)?.values() || [])];
  }

  key(x, y) {
    return `${x},${y}`;
  }
}
