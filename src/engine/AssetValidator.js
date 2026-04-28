export class AssetValidator {
  constructor({ assetLoader, gameData, rootPath = "", strict = false } = {}) {
    this.assetLoader = assetLoader;
    this.gameData = gameData;
    this.rootPath = rootPath;
    this.strict = strict;
    this.results = {
      errors: [],
      warnings: [],
      info: [],
    };
  }

  error(code, message, context = {}) {
    this.results.errors.push({ code, message, context });
  }

  warn(code, message, context = {}) {
    this.results.warnings.push({ code, message, context });
  }

  info(code, message, context = {}) {
    this.results.info.push({ code, message, context });
  }

  async validate() {
    this.results = { errors: [], warnings: [], info: [] };

    await this.validateCoreGameData();
    await this.validateTilesets();
    await this.validateTilemaps();
    await this.validateSpriteFrames();
    await this.validateObjectDecorationAssets();
    await this.validateObjectPlacements();

    this.printSummary();

    if (this.strict && this.results.errors.length > 0) {
      throw new Error(`Asset validation failed: ${this.results.errors.length} errors`);
    }

    return this.results;
  }

  async validateCoreGameData() {
    if (!this.gameData) {
      this.error("GAME_DATA_MISSING", "gameData is missing.");
      return;
    }

    if (!this.gameData.canvas?.tileSize) {
      this.error("CANVAS_TILE_SIZE_MISSING", "canvas.tileSize is missing.");
    }

    if (!this.gameData.startScene) {
      this.error("START_SCENE_MISSING", "startScene is missing.");
    }

    if (this.gameData.startScene && !this.gameData.scenes?.[this.gameData.startScene]) {
      this.error("START_SCENE_UNDEFINED", "startScene does not exist in scenes.", {
        startScene: this.gameData.startScene,
      });
    }
  }

  async validateTilesets() {
    const tilesets = this.gameData.tilesets || {};

    for (const [tilesetId, tilesetPath] of Object.entries(tilesets)) {
      const tileset = await this.safeLoadJSON(tilesetPath, {
        type: "tileset",
        tilesetId,
      });

      if (!tileset) continue;

      if (!tileset.tiles || typeof tileset.tiles !== "object") {
        this.error("TILESET_TILES_MISSING", "tileset.tiles is missing.", { tilesetId, tilesetPath });
        continue;
      }

      for (const [tileId, imagePath] of Object.entries(tileset.tiles)) {
        await this.validateImageExists(imagePath, {
          type: "tile",
          tilesetId,
          tileId,
        });

        const semantic = tileset.semantic?.[tileId];
        if (!semantic) {
          this.warn("TILE_SEMANTIC_NAME_MISSING", "Tile semantic_name is missing.", {
            tilesetId,
            tileId,
            imagePath,
          });
        }

        if (!tileset.collision || typeof tileset.collision[tileId] !== "boolean") {
          this.warn("TILE_COLLISION_MISSING", "Tile collision definition is missing.", {
            tilesetId,
            tileId,
            imagePath,
          });
        }

        if (tileset.rule?.layer_type === "ground") {
          if (tileset.opaque && tileset.opaque[tileId] !== true) {
            this.warn("GROUND_OPAQUE_FALSE", "Ground tile should be opaque=true.", {
              tilesetId,
              tileId,
              imagePath,
            });
          }

          if (tileset.rule?.resize !== "do_not_resize") {
            this.warn("GROUND_RESIZE_RULE_WEAK", "Ground tiles should use do_not_resize.", {
              tilesetId,
              tileId,
              resize: tileset.rule?.resize,
            });
          }

          if (tileset.rule?.edge_policy !== "no_visible_border") {
            this.warn("GROUND_EDGE_POLICY_WEAK", "Ground tiles should use no_visible_border.", {
              tilesetId,
              tileId,
              edge_policy: tileset.rule?.edge_policy,
            });
          }
        }
      }

      this.info("TILESET_VALIDATED", "Tileset validation completed.", {
        tilesetId,
        tileCount: Object.keys(tileset.tiles).length,
      });
    }
  }

  async validateTilemaps() {
    const mapEntries = Object.entries(this.gameData.maps || {});

    for (const [mapId, mapPath] of mapEntries) {
      const tilemap = await this.safeLoadJSON(mapPath, {
        type: "tilemap",
        mapId,
      });

      if (!tilemap) continue;

      const width = tilemap.width;
      const height = tilemap.height;

      if (!width || !height) {
        this.error("TILEMAP_SIZE_MISSING", "Tilemap width/height is missing.", { mapId, mapPath });
      }

      for (const layer of tilemap.layers || []) {
        if (!layer.name) {
          this.warn("TILEMAP_LAYER_NAME_MISSING", "Tilemap layer name is missing.", { mapId });
        }

        if (!layer.tileset) {
          this.warn("TILEMAP_LAYER_TILESET_MISSING", "Tilemap layer tileset is missing.", {
            mapId,
            layer: layer.name,
          });
          continue;
        }

        const tilesetPath = this.gameData.tilesets?.[layer.tileset];
        if (!tilesetPath) {
          this.error("TILEMAP_LAYER_TILESET_UNDEFINED", "Tilemap layer references undefined tileset.", {
            mapId,
            layer: layer.name,
            tileset: layer.tileset,
          });
          continue;
        }

        const tileset = await this.safeLoadJSON(tilesetPath, {
          type: "tileset",
          tileset: layer.tileset,
        });

        if (!tileset) continue;

        if (Array.isArray(layer.data)) {
          for (let y = 0; y < layer.data.length; y += 1) {
            const row = layer.data[y];
            if (!Array.isArray(row)) {
              this.error("TILEMAP_ROW_INVALID", "Tilemap row is not an array.", { mapId, layer: layer.name, y });
              continue;
            }

            for (let x = 0; x < row.length; x += 1) {
              const tileId = row[x];
              if (tileId === null || tileId === -1) continue;

              const key = String(tileId);
              if (!tileset.tiles?.[key]) {
                this.error("TILEMAP_TILE_ID_UNDEFINED", "Tilemap uses undefined tile id.", {
                  mapId,
                  layer: layer.name,
                  x,
                  y,
                  tileId,
                  tileset: layer.tileset,
                });
              }
            }
          }
        }
      }

      this.info("TILEMAP_VALIDATED", "Tilemap validation completed.", { mapId, mapPath });
    }
  }

  async validateSpriteFrames() {
    const assets = this.gameData.assets || {};
    const requiredDirections = ["down", "up", "left", "right"];

    await this.validateSpriteDirectionSet("playerDirectionFrames", assets.playerDirectionFrames, requiredDirections);
    await this.validateSpriteDirectionSet("companionDirectionFrames", assets.companionDirectionFrames, requiredDirections);

    for (const [npcId, path] of Object.entries(assets.npcs || {})) {
      await this.validateImageExists(path, { type: "npc", npcId });
    }
  }

  async validateSpriteDirectionSet(name, framesByDirection, requiredDirections) {
    if (!framesByDirection) {
      this.error("SPRITE_DIRECTION_SET_MISSING", `${name} is missing.`);
      return;
    }

    for (const direction of requiredDirections) {
      const frames = framesByDirection[direction];
      if (!Array.isArray(frames) || frames.length === 0) {
        this.error("SPRITE_DIRECTION_FRAMES_MISSING", `${name}.${direction} is missing.`, {
          set: name,
          direction,
        });
        continue;
      }

      for (const [index, path] of frames.entries()) {
        await this.validateImageExists(path, {
          type: "sprite",
          set: name,
          direction,
          index,
        });
      }
    }
  }

  async validateObjectDecorationAssets() {
    const objectAssetPath = this.gameData.objectDecorationAssets;
    if (!objectAssetPath) {
      this.warn("OBJECT_DECORATION_ASSETS_MISSING", "objectDecorationAssets is not defined.");
      return;
    }

    const objectData = await this.safeLoadJSON(objectAssetPath, {
      type: "objectDecorationAssets",
    });

    if (!objectData?.assets) {
      this.error("OBJECT_ASSET_DEFINITION_MISSING", "objectDecoration assets definition is missing assets.", {
        objectAssetPath,
      });
      return;
    }

    const allowedLayers = new Set(["object", "decoration"]);
    const requiredFields = [
      "path",
      "semantic_name",
      "layer_type",
      "collision",
      "width",
      "height",
      "anchor_x",
      "anchor_y",
      "edge_policy",
      "resize_rule",
    ];

    for (const [assetId, asset] of Object.entries(objectData.assets)) {
      for (const field of requiredFields) {
        if (asset[field] === undefined || asset[field] === null || asset[field] === "") {
          this.warn("OBJECT_ASSET_FIELD_MISSING", "Object/decor asset required field is missing.", {
            assetId,
            field,
            asset,
          });
        }
      }

      if (!allowedLayers.has(asset.layer_type)) {
        this.warn("OBJECT_ASSET_LAYER_INVALID", "Object/decor asset layer_type is invalid.", {
          assetId,
          layer_type: asset.layer_type,
        });
      }

      if (typeof asset.collision !== "boolean") {
        this.warn("OBJECT_ASSET_COLLISION_INVALID", "Object/decor asset collision must be boolean.", {
          assetId,
          collision: asset.collision,
        });
      }

      if (!Number.isFinite(asset.width) || !Number.isFinite(asset.height)) {
        this.warn("OBJECT_ASSET_SIZE_INVALID", "Object/decor asset width/height must be numbers.", {
          assetId,
          width: asset.width,
          height: asset.height,
        });
      }

      if (!Number.isFinite(asset.anchor_x) || !Number.isFinite(asset.anchor_y)) {
        this.warn("OBJECT_ASSET_ANCHOR_INVALID", "Object/decor asset anchor_x/anchor_y must be numbers.", {
          assetId,
          anchor_x: asset.anchor_x,
          anchor_y: asset.anchor_y,
        });
      }

      if (asset.layer_type === "object" && !asset.edge_policy) {
        this.warn("OBJECT_EDGE_POLICY_MISSING", "Object asset edge_policy should be explicit.", { assetId });
      }

      if (asset.path) {
        await this.validateImageExists(asset.path, {
          type: "objectDecoration",
          assetId,
          semantic_name: asset.semantic_name,
        });
      }
    }

    this.info("OBJECT_ASSETS_VALIDATED", "Object/decor asset validation completed.", {
      assetCount: Object.keys(objectData.assets).length,
    });
  }

  async validateObjectPlacements() {
    const placementEntries = Object.entries(this.gameData.objectPlacements || {});
    if (placementEntries.length === 0) {
      this.warn("OBJECT_PLACEMENTS_MISSING", "objectPlacements is not defined.");
      return;
    }

    const objectAssetPath = this.gameData.objectDecorationAssets;
    const objectData = objectAssetPath
      ? await this.safeLoadJSON(objectAssetPath, { type: "objectDecorationAssets" })
      : { assets: {} };

    for (const [sceneId, placementPath] of placementEntries) {
      const placement = await this.safeLoadJSON(placementPath, {
        type: "objectPlacement",
        sceneId,
      });

      if (!placement) continue;

      if (placement.sceneId && placement.sceneId !== sceneId) {
        this.warn("OBJECT_PLACEMENT_SCENE_ID_MISMATCH", "Object placement sceneId differs from gameData key.", {
          sceneId,
          placementSceneId: placement.sceneId,
          placementPath,
        });
      }

      for (const object of placement.objects || []) {
        if (!object.id) {
          this.warn("OBJECT_PLACEMENT_ID_MISSING", "Object placement id is missing.", { sceneId, object });
        }

        if (object.asset_id === undefined || object.asset_id === null || object.asset_id === "") {
          this.error("OBJECT_PLACEMENT_ASSET_ID_MISSING", "Object placement asset_id is missing.", { sceneId, object });
          continue;
        }

        const asset = objectData.assets?.[String(object.asset_id)];
        if (!asset) {
          this.error("OBJECT_PLACEMENT_ASSET_UNDEFINED", "Object placement references undefined asset_id.", {
            sceneId,
            objectId: object.id,
            asset_id: object.asset_id,
          });
          continue;
        }

        if (!Number.isFinite(object.x) || !Number.isFinite(object.y)) {
          this.error("OBJECT_PLACEMENT_POSITION_INVALID", "Object placement x/y must be numbers.", {
            sceneId,
            objectId: object.id,
            x: object.x,
            y: object.y,
          });
        }

        if (object.z_order === undefined || object.z_order === null || object.z_order === "") {
          this.warn("OBJECT_PLACEMENT_Z_ORDER_MISSING", "Object placement z_order is missing.", {
            sceneId,
            objectId: object.id,
          });
        }

        if (object.collision?.enabled === undefined && asset.collision === true) {
          this.warn("OBJECT_PLACEMENT_COLLISION_MISSING", "Asset collision=true but placement collision is not explicit.", {
            sceneId,
            objectId: object.id,
            asset_id: object.asset_id,
          });
        }

        if (object.collision?.enabled === true && asset.collision === false) {
          this.warn("OBJECT_PLACEMENT_COLLISION_CONFLICT", "Placement collision=true but asset collision=false.", {
            sceneId,
            objectId: object.id,
            asset_id: object.asset_id,
          });
        }

        if (object.collision?.enabled === true) {
          const allowedShapes = new Set(["tiles", "rect"]);
          if (!allowedShapes.has(object.collision.shape)) {
            this.warn("OBJECT_PLACEMENT_COLLISION_SHAPE_INVALID", "Collision shape should be tiles or rect.", {
              sceneId,
              objectId: object.id,
              shape: object.collision.shape,
            });
          }

          if (object.collision.shape === "tiles") {
            if (!Array.isArray(object.collision.tiles) || object.collision.tiles.length === 0) {
              this.warn("OBJECT_PLACEMENT_COLLISION_TILES_MISSING", "Collision shape=tiles requires non-empty tiles.", {
                sceneId,
                objectId: object.id,
              });
            }
          }

          if (object.collision.shape === "rect") {
            const requiredRectFields = ["x", "y", "width", "height"];
            for (const field of requiredRectFields) {
              if (!Number.isFinite(object.collision[field])) {
                this.warn("OBJECT_PLACEMENT_COLLISION_RECT_FIELD_MISSING", "Collision shape=rect requires x/y/width/height.", {
                  sceneId,
                  objectId: object.id,
                  field,
                });
              }
            }
          }
        }

        if (object.interactable_id) {
          const scene = this.gameData.scenes?.[sceneId];
          const exists = (scene?.interactables || []).some((item) => item.id === object.interactable_id);
          if (!exists) {
            this.warn("OBJECT_PLACEMENT_INTERACTABLE_MISSING", "Object placement interactable_id does not exist in scene interactables.", {
              sceneId,
              objectId: object.id,
              interactable_id: object.interactable_id,
            });
          }
        }

        if (Number.isFinite(asset.anchor_x) && (asset.anchor_x < 0 || asset.anchor_x > asset.width)) {
          this.warn("OBJECT_ASSET_ANCHOR_X_OUT_OF_RANGE", "Object asset anchor_x is outside image width.", {
            sceneId,
            objectId: object.id,
            asset_id: object.asset_id,
            anchor_x: asset.anchor_x,
            width: asset.width,
          });
        }

        if (Number.isFinite(asset.anchor_y) && (asset.anchor_y < 0 || asset.anchor_y > asset.height)) {
          this.warn("OBJECT_ASSET_ANCHOR_Y_OUT_OF_RANGE", "Object asset anchor_y is outside image height.", {
            sceneId,
            objectId: object.id,
            asset_id: object.asset_id,
            anchor_y: asset.anchor_y,
            height: asset.height,
          });
        }
      }

      this.info("OBJECT_PLACEMENT_VALIDATED", "Object placement validation completed.", {
        sceneId,
        objectCount: (placement.objects || []).length,
      });
    }
  }

  async validateImageExists(path, context = {}) {
    if (!path) {
      this.error("ASSET_PATH_MISSING", "Asset path is missing.", context);
      return null;
    }

    const image = await this.assetLoader.loadImage(path);

    if (!image) {
      this.error("IMAGE_LOAD_FAILED", "Image failed to load.", { path, ...context });
      return null;
    }

    return image;
  }

  async safeLoadJSON(path, context = {}) {
    try {
      return await this.assetLoader.loadJSON(path);
    } catch (error) {
      this.error("JSON_LOAD_FAILED", "JSON failed to load.", {
        path,
        message: error.message,
        ...context,
      });
      return null;
    }
  }

  printSummary() {
    const summary = this.getSummary();
    console.info("[AssetValidator]", summary);

    if (summary.errors > 0) {
      console.error("[AssetValidator] errors", this.results.errors);
    }

    if (summary.warnings > 0) {
      console.warn("[AssetValidator] warnings", this.results.warnings);
    }
  }

  getSummary() {
    return {
      errors: this.results.errors.length,
      warnings: this.results.warnings.length,
      info: this.results.info.length,
    };
  }
}
