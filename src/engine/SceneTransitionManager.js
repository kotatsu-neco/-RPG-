export class SceneTransitionManager {
  constructor({ sceneManager, actors, interactionManager, gameData }) {
    this.sceneManager = sceneManager;
    this.actors = actors;
    this.interactionManager = interactionManager;
    this.gameData = gameData;
    this.lastTransitionAt = 0;
    this.cooldownMs = 250;
  }

  canTransitionNow() {
    return Date.now() - this.lastTransitionAt >= this.cooldownMs;
  }

  async transitionAsync(transitionDefinition, { preloadScene } = {}) {
    const definition = typeof transitionDefinition === "string"
      ? { targetScene: transitionDefinition }
      : transitionDefinition;
    const targetScene = definition.targetScene || definition.toScene;

    if (preloadScene && targetScene) {
      await preloadScene(targetScene);
    }

    return this.transition(definition);
  }

  transition(transitionDefinition) {
    if (!this.canTransitionNow()) {
      return { changed: false, reason: "cooldown" };
    }

    const definition = typeof transitionDefinition === "string"
      ? { targetScene: transitionDefinition }
      : transitionDefinition;

    const targetScene = definition.targetScene || definition.toScene;
    if (!targetScene) {
      throw new Error("Scene transition target is missing.");
    }

    this.sceneManager.setScene(targetScene);
    this.interactionManager?.resetTriggerMemory();

    const spawn = definition.targetPosition
      || definition.spawn
      || this.sceneManager.getStartPosition(targetScene);

    const companionSpawn = definition.companionPosition
      || definition.companionSpawn
      || this.sceneManager.getCompanionStart(targetScene);

    this.actors.player.x = spawn.x;
    this.actors.player.y = spawn.y;
    this.actors.player.facing = spawn.facing || this.actors.player.facing || "down";

    if (companionSpawn) {
      this.actors.companion.x = companionSpawn.x;
      this.actors.companion.y = companionSpawn.y;
      this.actors.companion.facing = companionSpawn.facing || this.actors.player.facing;
    } else {
      const offsetX = spawn.companionOffset?.x ?? -1;
      const offsetY = spawn.companionOffset?.y ?? 1;
      this.actors.companion.x = spawn.companionX ?? Math.max(0, spawn.x + offsetX);
      this.actors.companion.y = spawn.companionY ?? Math.max(0, spawn.y + offsetY);
      this.actors.companion.facing = this.actors.player.facing;
    }

    this.lastTransitionAt = Date.now();

    return {
      changed: true,
      targetScene,
      enterNotice: this.sceneManager.currentScene?.enterNotice || "",
    };
  }
}
