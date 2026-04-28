export const UI_STATES = Object.freeze({
  LOADING: "loading",
  EXPLORATION: "exploration",
  DIALOGUE: "dialogue",
  CHOICE: "choice",
  NOTICE: "notice",
  MENU: "menu",
  TRANSITION: "transition",
  CUTSCENE: "cutscene",
});

export class UIStateController {
  constructor({ initialState = UI_STATES.LOADING, debug = false } = {}) {
    this.state = initialState;
    this.previousState = null;
    this.debug = debug;
    this.listeners = new Set();
  }

  setState(nextState, reason = "") {
    if (!nextState || nextState === this.state) return this.state;

    const oldState = this.state;
    this.previousState = oldState;
    this.state = nextState;

    document.body.dataset.uiState = nextState;

    for (const listener of this.listeners) {
      listener({ state: nextState, previousState: oldState, reason });
    }

    if (this.debug) {
      console.info("[UIState]", oldState, "->", nextState, reason);
    }

    window.dispatchEvent(new CustomEvent("matsuyoi:ui-state", {
      detail: { state: nextState, previousState: oldState, reason },
    }));

    return this.state;
  }

  deriveState({ loading = false, menuOpen = false, noticeOpen = false, dialogueOpen = false, choiceOpen = false, transition = false, cutscene = false } = {}) {
    if (loading) return UI_STATES.LOADING;
    if (transition) return UI_STATES.TRANSITION;
    if (cutscene) return UI_STATES.CUTSCENE;
    if (menuOpen) return UI_STATES.MENU;
    if (noticeOpen) return UI_STATES.NOTICE;
    if (choiceOpen) return UI_STATES.CHOICE;
    if (dialogueOpen) return UI_STATES.DIALOGUE;
    return UI_STATES.EXPLORATION;
  }

  syncFromRuntime(runtimeState, reason = "runtime-sync") {
    return this.setState(this.deriveState(runtimeState), reason);
  }

  is(...states) {
    return states.includes(this.state);
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
