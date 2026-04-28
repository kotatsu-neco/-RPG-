export class EventFlagManager {
  constructor({ flagManager }) {
    this.flagManager = flagManager;
  }

  apply(effect = {}) {
    if (!effect || !effect.type) return false;

    switch (effect.type) {
      case "setFlag":
        this.flagManager?.setFlag(effect.flag);
        return true;

      case "clearFlag":
        this.flagManager?.clearFlag(effect.flag);
        return true;

      case "setMainFlag":
        this.flagManager?.setMainFlag(effect.flag);
        return true;

      default:
        return false;
    }
  }

  applyMany(effects = []) {
    return effects.map((effect) => this.apply(effect));
  }
}
