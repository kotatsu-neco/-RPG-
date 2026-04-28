export class FlagManager {
  constructor({ chapterProgress = {} } = {}) {
    this.mainFlags = chapterProgress.mainFlags || [];
    this.currentMainFlag = chapterProgress.currentMainFlag || this.mainFlags[0] || null;
    this.flags = new Set(chapterProgress.flags || []);
    if (this.currentMainFlag) {
      this.flags.add(this.currentMainFlag);
    }
  }

  getMainFlag() {
    return this.currentMainFlag;
  }

  setMainFlag(flag) {
    if (!flag) return;
    this.currentMainFlag = flag;
    this.flags.add(flag);
  }

  hasFlag(flag) {
    return this.flags.has(flag);
  }

  setFlag(flag) {
    if (!flag) return;
    this.flags.add(flag);
  }

  clearFlag(flag) {
    this.flags.delete(flag);
  }

  hasReached(flag) {
    const targetIndex = this.mainFlags.indexOf(flag);
    const currentIndex = this.mainFlags.indexOf(this.currentMainFlag);

    if (targetIndex === -1 || currentIndex === -1) {
      return this.hasFlag(flag);
    }

    return currentIndex >= targetIndex;
  }

  applyEffect(effect) {
    if (!effect || !effect.type) return false;

    if (effect.type === "setFlag") {
      this.setFlag(effect.flag);
      return true;
    }

    if (effect.type === "clearFlag") {
      this.clearFlag(effect.flag);
      return true;
    }

    if (effect.type === "setMainFlag") {
      this.setMainFlag(effect.flag);
      return true;
    }

    return false;
  }

  applyEffects(effects = []) {
    return effects.map((effect) => this.applyEffect(effect));
  }

  getObjective(objectives = {}) {
    return objectives[this.currentMainFlag] || "";
  }

  toJSON() {
    return {
      currentMainFlag: this.currentMainFlag,
      flags: Array.from(this.flags),
    };
  }
}
