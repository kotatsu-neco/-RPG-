export class UIManager {
  constructor() {
    this.dialogLayer = document.getElementById("dialog-layer");
    this.nameplate = document.getElementById("nameplate");
    this.dialogText = document.getElementById("dialog-text");
    this.choiceBox = document.getElementById("choice-box");
    this.choiceOverlay = this.ensureChoiceOverlay();
    this.noticeLayer = document.getElementById("notice-layer");
    this.noticeWindow = document.getElementById("notice-window");
    this.actionButton = document.getElementById("action-button");
    this.wideTapCatcher = document.getElementById("wide-tap-catcher");
    this.touchControls = document.getElementById("touch-controls");
    this.debugVersion = document.querySelector("#debug-panel strong");
  }

  setLocationText(text) {
    const element = document.getElementById("hud-location");
    if (!element) return;
    element.textContent = text || "";
    element.hidden = !text;
  }

  setObjectiveText(text) {
    const element = document.getElementById("hud-objective");
    if (!element) return;
    element.textContent = text || "";
    element.hidden = !text;
  }

  setDebugDetail(text) {
    const panel = document.getElementById("debug-panel");
    if (!panel || !text) return;

    const existing = panel.querySelector(".debug-detail");
    if (existing) {
      existing.textContent = text;
      return;
    }

    const detail = document.createElement("span");
    detail.className = "debug-detail";
    detail.textContent = text;
    panel.appendChild(detail);
  }

  setDebugVersion(text) {
    if (this.debugVersion) {
      this.debugVersion.textContent = text;
    }
  }

  showDialogue({ speaker, text }) {
    this.nameplate.textContent = speaker;
    this.dialogText.textContent = text;
    this.choiceBox.classList.add("hidden");
    this.choiceBox.innerHTML = "";
    this.choiceOverlay.classList.add("hidden");
    this.choiceOverlay.innerHTML = "";
    this.dialogLayer.classList.remove("choices-1", "choices-2", "choices-3", "choices-many");
    this.dialogLayer.style.removeProperty("--choice-count");
    this.dialogLayer.classList.remove("hidden");
  }

  updateDialogueText(text) {
    this.dialogText.textContent = text;
  }

  showChoices(choices, selectedIndex, onSelect) {
    this.choiceBox.classList.add("hidden");
    this.choiceBox.innerHTML = "";
    this.choiceOverlay.innerHTML = "";

    const count = choices.length;
    this.dialogLayer.classList.remove("choices-1", "choices-2", "choices-3", "choices-many");
    this.dialogLayer.classList.add(count >= 4 ? "choices-many" : `choices-${count}`);
    this.dialogLayer.style.setProperty("--choice-count", String(count));

    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice choice-item ${index === selectedIndex ? "selected" : ""}`;
      button.dataset.choiceIndex = String(index);
      button.textContent = choice;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelect(index);
      });
      this.choiceOverlay.appendChild(button);
    });

    this.dialogText.textContent = "どうする？";
    this.choiceOverlay.classList.remove("hidden");
  }

  syncChoiceSelection(selectedIndex) {
    Array.from(this.choiceOverlay.querySelectorAll(".choice")).forEach((button, index) => {
      button.classList.toggle("selected", index === selectedIndex);
      if (index === selectedIndex) {
        button.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
  }

  hideDialogue() {
    this.choiceBox.classList.add("hidden");
    this.choiceBox.innerHTML = "";
    this.choiceOverlay.classList.add("hidden");
    this.choiceOverlay.innerHTML = "";
    this.dialogLayer.classList.add("hidden");
  }

  showNotice(text) {
    this.noticeWindow.textContent = text;
    this.noticeLayer.classList.remove("hidden");
  }

  hideNotice() {
    this.noticeLayer.classList.add("hidden");
  }

  setActionButton(label, className = "") {
    this.actionButton.textContent = label;
    this.actionButton.className = className;
  }

  syncBodyState({ dialogueOpen, choiceOpen, noticeOpen, menuOpen = false, uiState = "exploration" }) {
    document.body.classList.toggle("dialogue-open", dialogueOpen);
    document.body.classList.toggle("choice-open", choiceOpen);
    document.body.classList.toggle("notice-open", noticeOpen);
    document.body.classList.toggle("menu-open", menuOpen);
    document.body.dataset.uiState = uiState;

    const showWideTap = (dialogueOpen && !choiceOpen) || noticeOpen;
    this.wideTapCatcher.classList.toggle("hidden", !showWideTap);
    this.touchControls.classList.remove("hidden");
  }
}
