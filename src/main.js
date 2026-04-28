import { Game } from "./engine/Game.js";


function setupBrowserGestureGuards() {
  let lastTouchEnd = 0;

  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gestureend", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("dblclick", (event) => event.preventDefault(), { passive: false });

  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener("selectstart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("contextmenu", (event) => event.preventDefault(), { passive: false });
}

function setLoadingState(state, message) {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;

  const text = overlay.querySelector(".loading-text");
  if (text && message) {
    text.textContent = message;
  }

  overlay.classList.toggle("hidden", state === "hidden");
  overlay.classList.toggle("error", state === "error");
}


setupBrowserGestureGuards();
setLoadingState("loading", "ロード中…");

const canvas = document.getElementById("game-canvas");

const game = new Game({
  canvas,
  dataPath: "src/game/data/matsuyoi.game.json",
  version: "2.2",
});

game.boot()
  .then(() => {
    setLoadingState("hidden");
  })
  .catch((error) => {
  console.error("Game boot failed:", error);
    setLoadingState("error", "読み込みに失敗しました。");
});
