export class InteractableResolver {
  constructor({ conditionEvaluator }) {
    this.conditionEvaluator = conditionEvaluator;
    this.priority = {
      npc: 100,
      sceneTransition: 80,
      readKeyItem: 70,
      notice: 50,
      inspect: 40,
    };
  }

  canUse(definition = {}) {
    return !this.conditionEvaluator.firstFailedReason(definition);
  }

  blockedText(definition = {}) {
    return this.conditionEvaluator.firstFailedReason(definition);
  }

  sortInteractables(items = []) {
    return [...items].sort((a, b) => {
      const pa = this.priority[a.kind] ?? 0;
      const pb = this.priority[b.kind] ?? 0;
      return pb - pa;
    });
  }

  firstAvailable(items = []) {
    return this.sortInteractables(items)[0] || null;
  }
}
