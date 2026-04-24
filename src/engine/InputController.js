import { DIRECTIONS } from "./constants.js";

export class InputController {
  constructor({ onDirection, onAction, onWideTap }) {
    this.onDirection = onDirection;
    this.onAction = onAction;
    this.onWideTap = onWideTap;
  }

  bind() {
    window.addEventListener("keydown", (event) => this.handleKeydown(event));

    document.querySelectorAll(".dpad button").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onDirection(button.dataset.dir);
      });
    });

    const actionButton = document.getElementById("action-button");
    const handleActionButton = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onAction();
    };
    actionButton.addEventListener("click", handleActionButton);
    actionButton.addEventListener("pointerdown", handleActionButton);

    const wideTap = document.getElementById("wide-tap-catcher");
    wideTap.addEventListener("click", (event) => {
      event.preventDefault();
      this.onWideTap();
    });
    wideTap.addEventListener("touchend", (event) => {
      event.preventDefault();
      this.onWideTap();
    }, { passive: false });

    const noticeLayer = document.getElementById("notice-layer");
    noticeLayer.addEventListener("click", (event) => {
      event.preventDefault();
      this.onWideTap();
    });
    noticeLayer.addEventListener("touchend", (event) => {
      event.preventDefault();
      this.onWideTap();
    }, { passive: false });

    const dialogWindow = document.getElementById("dialog-window");
    dialogWindow.addEventListener("click", (event) => {
      if (event.target.closest(".choice")) return;
      event.preventDefault();
      this.onWideTap();
    });
    dialogWindow.addEventListener("touchend", (event) => {
      if (event.target.closest(".choice")) return;
      event.preventDefault();
      this.onWideTap();
    }, { passive: false });
  }

  handleKeydown(event) {
    const handledKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "Enter", " "];
    if (handledKeys.includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "Enter" || event.key === " ") {
      this.onAction();
      return;
    }

    const direction = this.keyToDirection(event.key);
    if (direction) {
      this.onDirection(direction);
    }
  }

  keyToDirection(key) {
    return {
      ArrowUp: DIRECTIONS.UP,
      ArrowDown: DIRECTIONS.DOWN,
      ArrowLeft: DIRECTIONS.LEFT,
      ArrowRight: DIRECTIONS.RIGHT,
      w: DIRECTIONS.UP,
      s: DIRECTIONS.DOWN,
      a: DIRECTIONS.LEFT,
      d: DIRECTIONS.RIGHT,
    }[key] || null;
  }
}
