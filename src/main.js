import { Game } from "./engine/Game.js";



import { BootManager } from "./engine/BootManager.js";
import { BrowserGestureGuard } from "./engine/BrowserGestureGuard.js";
const browserGestureGuard = new BrowserGestureGuard({ debug: true });
browserGestureGuard.bind();
window.matsuyoiGestureGuard = browserGestureGuard;

const canvas = document.getElementById("game-canvas");
const bootManager = new BootManager({
  minimumVisibleMs: 700,
  debug: true,
});

bootManager.start("ロード中…");

let game = null;

window.matsuyoiBoot = bootManager;

try {
  game = new Game({
    canvas,
    dataPath: "src/game/data/matsuyoi.game.json",
    version: "4.0-h.2",
  });

  window.matsuyoiGame = game;

  bootManager.runStep("ゲームデータを読み込んでいます…", () => game.boot())
    .then(() => bootManager.complete("準備ができました。"))
    .catch((error) => {
      bootManager.fail(error, "ゲーム起動");
    });
} catch (error) {
  bootManager.fail(error, "ゲーム初期化");
}
