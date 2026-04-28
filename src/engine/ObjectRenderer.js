import { TILE_SIZE } from "./constants.js";

export class ObjectRenderer {
  constructor({ ctx, assetLoader, objectAssets = {}, objectPlacements = {}, tileSize = TILE_SIZE }) {
    this.ctx = ctx;
    this.assetLoader = assetLoader;
    this.objectAssets = objectAssets;
    this.objectPlacements = objectPlacements;
    this.tileSize = tileSize;
  }

  setObjectAssets(objectAssets) {
    this.objectAssets = objectAssets || {};
  }

  setObjectPlacements(objectPlacements) {
    this.objectPlacements = objectPlacements || {};
  }

  getSceneObjects(sceneId) {
    return this.objectPlacements?.scenes?.[sceneId]?.objects || [];
  }

  resolveAsset(assetId) {
    const asset = this.objectAssets?.assets?.[String(assetId)];
    if (!asset) {
      console.warn("[ObjectRenderer] Missing asset:", assetId);
      return null;
    }
    return asset;
  }

  async preloadSceneObjects(sceneId) {
    const objects = this.getSceneObjects(sceneId);
    const paths = [];

    for (const object of objects) {
      if (object.visible === false) continue;
      const asset = this.resolveAsset(object.asset_id);
      if (asset?.path) {
        paths.push(asset.path);
      }
    }

    const uniquePaths = [...new Set(paths)];
    await this.assetLoader.loadImageList(uniquePaths);

    return {
      sceneId,
      requested: uniquePaths.length,
      loaded: uniquePaths.filter((path) => !!this.assetLoader.getImage(path)).length,
    };
  }

  renderSceneObjects(sceneId) {
    const objects = this.getRenderableObjects(sceneId);
    const sorted = this.sortByZOrder(objects);

    for (const entry of sorted) {
      const object = entry.object;
      const asset = entry.asset;
      if (!object || !asset) continue;

      const image = this.assetLoader.getImage(asset.path);
      if (!image) {
        console.warn("[ObjectRenderer] Object image is not preloaded:", {
          objectId: object.id,
          assetId: object.asset_id,
          path: asset.path,
        });
        continue;
      }

      const rect = this.getDrawRect(object, asset);
      this.ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    }
  }

  getRenderableObjects(sceneId) {
    return this.getSceneObjects(sceneId)
      .filter((object) => object.visible !== false)
      .map((object) => ({
        object,
        asset: this.resolveAsset(object.asset_id),
      }))
      .filter((entry) => !!entry.asset);
  }

  sortByZOrder(entries) {
    return [...entries].sort((a, b) => this.resolveZ(a) - this.resolveZ(b));
  }

  resolveZ(entry) {
    const object = entry.object;
    const asset = entry.asset;
    const z = object.z_order ?? asset.z_order ?? "y_sort";

    if (typeof z === "number") return z;

    if (z === "ground") return 0;
    if (z === "decoration_floor") return 10;
    if (z === "object_low") return 30;
    if (z === "object_high") return 80;
    if (z === "ui") return 1000;

    // Default top-down RPG rule: object's foot point determines order.
    return 50 + this.getAnchorWorldY(object);
  }

  getAnchorWorldX(object) {
    if (Number.isFinite(object.pixel_x)) return object.pixel_x;
    return object.x * this.tileSize + this.tileSize / 2;
  }

  getAnchorWorldY(object) {
    if (Number.isFinite(object.pixel_y)) return object.pixel_y;
    return object.y * this.tileSize + this.tileSize - 1;
  }

  getDrawRect(object, asset) {
    const anchorX = Number.isFinite(object.anchor_x) ? object.anchor_x : asset.anchor_x;
    const anchorY = Number.isFinite(object.anchor_y) ? object.anchor_y : asset.anchor_y;
    const width = object.width || asset.width;
    const height = object.height || asset.height;

    return {
      x: Math.round(this.getAnchorWorldX(object) - anchorX),
      y: Math.round(this.getAnchorWorldY(object) - anchorY),
      width,
      height,
    };
  }
}
