export class InteractionManager {
  constructor({ sceneManager, actors, interactableResolver = null }) {
    this.sceneManager = sceneManager;
    this.actors = actors;
    this.interactableResolver = interactableResolver;
    this.lastTriggerId = null;
  }

  getAdjacentNpc() {
    const target = this.sceneManager.getFacingTile(this.actors.player);
    return this.sceneManager.getNpcs().find((npc) => npc.x === target.x && npc.y === target.y) || null;
  }

  getFacingInteractable() {
    const target = this.sceneManager.getFacingTile(this.actors.player);

    const candidates = this.sceneManager.getInteractables().filter((item) => {
      return this.sceneManager.tileListIncludes(item.tiles, target.x, target.y)
        || this.sceneManager.tileListIncludes(item.tiles, this.actors.player.x, this.actors.player.y);
    });

    if (this.interactableResolver) {
      return this.interactableResolver.firstAvailable(candidates);
    }

    return candidates[0] || null;
  }

  getCurrentTrigger() {
    const trigger = this.sceneManager.getTriggers().find((item) => {
      return this.sceneManager.tileListIncludes(item.tiles, this.actors.player.x, this.actors.player.y);
    });

    if (!trigger) {
      this.lastTriggerId = null;
      return null;
    }

    if (trigger.id === this.lastTriggerId) {
      return null;
    }

    this.lastTriggerId = trigger.id;
    return trigger;
  }

  resetTriggerMemory() {
    this.lastTriggerId = null;
  }
}
