import { directionDelta } from "./constants.js";

export class SceneManager {
  constructor({ gameData }) {
    this.gameData = gameData;
    this.currentSceneId = gameData.startScene;
  }

  get currentScene() {
    return this.gameData.scenes[this.currentSceneId];
  }

  setScene(sceneId) {
    if (!this.gameData.scenes[sceneId]) {
      throw new Error(`Unknown scene: ${sceneId}`);
    }
    this.currentSceneId = sceneId;
  }

  getStartPosition(sceneId = this.currentSceneId) {
    return this.gameData.scenes[sceneId].playerStart;
  }

  getCompanionStart(sceneId = this.currentSceneId) {
    return this.gameData.scenes[sceneId].companionStart;
  }

  getReturnPosition(sceneId = this.currentSceneId) {
    return this.gameData.scenes[sceneId].playerReturn || this.getStartPosition(sceneId);
  }

  getReturnCompanionPosition(sceneId = this.currentSceneId) {
    return this.gameData.scenes[sceneId].companionReturn || this.getCompanionStart(sceneId);
  }

  isBlocked(x, y) {
    if (x < 0 || y < 0 || x >= this.gameData.canvas.cols || y >= this.gameData.canvas.rows) {
      return true;
    }

    return this.tileListIncludes(this.currentScene.blockedTiles || [], x, y);
  }

  getFacingTile(actor) {
    const [dx, dy] = directionDelta(actor.facing);
    return { x: actor.x + dx, y: actor.y + dy };
  }

  tileListIncludes(tileList, x, y) {
    return Array.isArray(tileList) && tileList.some(([tx, ty]) => tx === x && ty === y);
  }

  getNpcs() {
    return this.currentScene.npcs || [];
  }

  getInteractables() {
    return this.currentScene.interactables || [];
  }

  getTriggers() {
    return this.currentScene.triggers || [];
  }
}
