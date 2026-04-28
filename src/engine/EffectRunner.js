export class EffectRunner {
  constructor({
    flagEffects,
    showNotice,
    openDialogue,
    transitionScene,
    readKeyItem,
    updateUI,
  }) {
    this.flagEffects = flagEffects;
    this.showNotice = showNotice;
    this.openDialogue = openDialogue;
    this.transitionScene = transitionScene;
    this.readKeyItem = readKeyItem;
    this.updateUI = updateUI;
  }

  run(effect) {
    if (!effect) return false;

    if (typeof effect === "string") {
      return this.flagEffects?.apply({ type: "setFlag", flag: effect }) ?? false;
    }

    switch (effect.type) {
      case "setFlag":
      case "clearFlag":
      case "setMainFlag":
        return this.flagEffects?.apply(effect) ?? false;

      case "notice":
        this.showNotice?.(effect.text || "");
        return true;

      case "dialogue":
        this.openDialogue?.(effect.dialogueId);
        return true;

      case "transition":
      case "sceneTransition":
        this.transitionScene?.(effect);
        return true;

      case "readKeyItem":
        return this.readKeyItem?.(effect.keyItemId) ?? false;

      case "updateUI":
        this.updateUI?.();
        return true;

      // Reserved for later phases. No-op now, but recognized for schema stability.
      case "fade":
      case "wait":
      case "playSound":
      case "cameraShake":
      case "grantItem":
      case "removeItem":
      case "addPartyMember":
      case "removePartyMember":
      case "battle":
        console.info("[EffectRunner] Reserved effect skipped:", effect);
        return false;

      default:
        console.warn("[EffectRunner] Unknown effect:", effect);
        return false;
    }
  }

  runMany(effects = []) {
    if (!Array.isArray(effects)) return [];
    return effects.map((effect) => this.run(effect));
  }
}
