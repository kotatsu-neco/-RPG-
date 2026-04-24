export class InteractionManager {
  constructor({ sceneManager, actors }) {
    this.sceneManager = sceneManager;
    this.actors = actors;
    this.lastTriggerId = null;
  }

  getAdjacentNpc() {
    const target = this.sceneManager.getFacingTile(this.actors.player);
    return this.sceneManager.getNpcs().find((npc) => npc.x === target.x && npc.y === target.y) || null;
  }

  getFacingInteractable() {
    const target = this.sceneManager.getFacingTile(this.actors.player);

    return this.sceneManager.getInteractables().find((item) => {
      return this.sceneManager.tileListIncludes(item.tiles, target.x, target.y)
        || this.sceneManager.tileListIncludes(item.tiles, this.actors.player.x, this.actors.player.y);
    }) || null;
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
