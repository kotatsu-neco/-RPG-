export class DialogueManager {
  constructor({ uiManager, getDialogueById, onChoiceAction, onClose }) {
    this.ui = uiManager;
    this.getDialogueById = getDialogueById;
    this.onChoiceAction = onChoiceAction;
    this.onClose = onClose;

    this.activeDialogue = null;
    this.index = 0;
    this.selectedChoiceIndex = 0;
  }

  get isOpen() {
    return Boolean(this.activeDialogue);
  }

  get isChoiceOpen() {
    return this.isOpen
      && this.activeDialogue.choices
      && this.index >= this.activeDialogue.lines.length;
  }

  open(dialogueId) {
    const dialogue = this.getDialogueById(dialogueId);
    if (!dialogue) {
      throw new Error(`Dialogue not found: ${dialogueId}`);
    }

    this.activeDialogue = dialogue;
    this.index = 0;
    this.selectedChoiceIndex = 0;

    this.ui.showDialogue({
      speaker: dialogue.speaker,
      text: dialogue.lines[0] || "",
    });
  }

  advance() {
    if (!this.isOpen) return;

    if (this.isChoiceOpen) {
      this.confirmChoice();
      return;
    }

    this.index += 1;

    if (this.index < this.activeDialogue.lines.length) {
      this.ui.updateDialogueText(this.activeDialogue.lines[this.index]);
      return;
    }

    if (this.activeDialogue.choices && this.activeDialogue.choices.length) {
      this.openChoices();
      return;
    }

    this.close();
  }

  openChoices() {
    this.selectedChoiceIndex = 0;
    this.index = this.activeDialogue.lines.length;

    this.ui.showChoices(
      this.activeDialogue.choices.map((choice) => choice.label),
      this.selectedChoiceIndex,
      (index) => {
        this.selectedChoiceIndex = index;
        this.confirmChoice();
      }
    );
  }

  moveChoice(direction) {
    if (!this.isChoiceOpen) return false;

    const count = this.activeDialogue.choices.length;
    if (!count) return false;

    if (direction === "up") {
      this.selectedChoiceIndex = (this.selectedChoiceIndex - 1 + count) % count;
    } else if (direction === "down") {
      this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % count;
    } else {
      return false;
    }

    this.ui.syncChoiceSelection(this.selectedChoiceIndex);
    return true;
  }

  confirmChoice() {
    if (!this.isChoiceOpen) return false;

    const choice = this.activeDialogue.choices[this.selectedChoiceIndex];
    if (!choice) return false;

    // restart は会話管理そのものの操作なので、Game側の接続に依存させない。
    if (choice.action === "restart") {
      this.restart();
      return true;
    }

    let handled = false;
    if (choice.action && this.onChoiceAction) {
      handled = this.onChoiceAction(choice, this);
    }

    if (handled) return true;

    if (choice.close !== false) {
      this.close();
    }

    return true;
  }

  restart() {
    if (!this.activeDialogue) return;

    this.index = 0;
    this.selectedChoiceIndex = 0;
    this.ui.showDialogue({
      speaker: this.activeDialogue.speaker,
      text: this.activeDialogue.lines[0] || "",
    });
  }

  close() {
    this.activeDialogue = null;
    this.index = 0;
    this.selectedChoiceIndex = 0;
    this.ui.hideDialogue();
    this.onClose?.();
  }
}
