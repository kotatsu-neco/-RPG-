import { Game } from "./engine/Game.js";

const canvas = document.getElementById("game-canvas");

const game = new Game({
  canvas,
  dataPath: "src/game/data/matsuyoi.game.json",
  version: "2.2",
});

game.boot().catch((error) => {
  console.error("Game boot failed:", error);
});
