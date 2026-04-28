export class ConditionEvaluator {
  constructor({ flagManager, getRuntimeState = () => ({}) } = {}) {
    this.flagManager = flagManager;
    this.getRuntimeState = getRuntimeState;
  }

  isMet(condition) {
    if (!condition) return true;

    if (Array.isArray(condition)) {
      return condition.every((item) => this.isMet(item));
    }

    if (typeof condition === "string") {
      return this.flagManager?.hasFlag(condition) || this.flagManager?.hasReached(condition) || false;
    }

    if (condition.all) {
      return condition.all.every((item) => this.isMet(item));
    }

    if (condition.any) {
      return condition.any.some((item) => this.isMet(item));
    }

    if (condition.not) {
      return !this.isMet(condition.not);
    }

    if (condition.flag) {
      return this.flagManager?.hasFlag(condition.flag) || false;
    }

    if (condition.notFlag) {
      return !this.flagManager?.hasFlag(condition.notFlag);
    }

    if (condition.mainFlagReached) {
      return this.flagManager?.hasReached(condition.mainFlagReached) || false;
    }

    if (condition.currentMainFlag) {
      return this.flagManager?.getMainFlag() === condition.currentMainFlag;
    }

    if (condition.sceneId) {
      return this.getRuntimeState().sceneId === condition.sceneId;
    }

    // Backward compatibility: old interactables used requiredFlag directly.
    if (condition.requiredFlag) {
      return this.flagManager?.hasReached(condition.requiredFlag) || false;
    }

    return true;
  }

  firstFailedReason(definition = {}) {
    const checks = [];

    if (definition.requiredFlag) {
      checks.push({
        condition: { mainFlagReached: definition.requiredFlag },
        text: definition.blockedText || "まだできない。",
      });
    }

    if (definition.condition) {
      checks.push({
        condition: definition.condition,
        text: definition.blockedText || "まだできない。",
      });
    }

    if (definition.conditions) {
      checks.push({
        condition: definition.conditions,
        text: definition.blockedText || "まだできない。",
      });
    }

    for (const check of checks) {
      if (!this.isMet(check.condition)) {
        return check.text;
      }
    }

    return "";
  }
}
