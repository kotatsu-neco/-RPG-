import { UI_STATES } from "./UIStateController.js";

export class ActionResolver {
  constructor({ uiStateController }) {
    this.uiState = uiStateController;
  }

  get state() {
    return this.uiState?.state || UI_STATES.LOADING;
  }

  canMove() {
    return this.state === UI_STATES.EXPLORATION;
  }

  canMoveChoice(direction) {
    return this.state === UI_STATES.CHOICE && (direction === "up" || direction === "down");
  }

  canAction() {
    return [
      UI_STATES.EXPLORATION,
      UI_STATES.DIALOGUE,
      UI_STATES.CHOICE,
      UI_STATES.NOTICE,
      UI_STATES.MENU,
    ].includes(this.state);
  }

  canWideTap() {
    return [
      UI_STATES.DIALOGUE,
      UI_STATES.NOTICE,
    ].includes(this.state);
  }

  actionKind() {
    switch (this.state) {
      case UI_STATES.MENU:
        return "closeMenu";
      case UI_STATES.NOTICE:
        return "closeNotice";
      case UI_STATES.CHOICE:
        return "confirmChoice";
      case UI_STATES.DIALOGUE:
        return "advanceDialogue";
      case UI_STATES.EXPLORATION:
        return "interact";
      default:
        return "none";
    }
  }

  wideTapKind() {
    switch (this.state) {
      case UI_STATES.NOTICE:
        return "closeNotice";
      case UI_STATES.DIALOGUE:
        return "advanceDialogue";
      default:
        return "none";
    }
  }
}
