import { AssetLoader } from "./AssetLoader.js";
import { InputController } from "./InputController.js";
import { UIManager } from "./UIManager.js";
import { SceneManager } from "./SceneManager.js";
import { InteractionManager } from "./InteractionManager.js";
import { DialogueManager } from "./DialogueManager.js";
import { Renderer } from "./Renderer.js";
import { directionDelta, ENGINE_VERSION } from "./constants.js";
import { LayoutManager } from "./LayoutManager.js";
import { MenuManager } from "./MenuManager.js";
import { FlagManager } from "./FlagManager.js";

export class Game {
  constructor({ canvas, dataPath, version = ENGINE_VERSION }) {
    this.canvas = canvas;
    this.dataPath = dataPath;
    this.assetLoader = new AssetLoader({ version });
    this.ui = new UIManager();
    this.layoutManager = new LayoutManager();

    this.actors = {
      player: { x: 0, y: 0, facing: "down", step: 0 },
      companion: { x: 0, y: 0, facing: "down", frame: 0 },
    };

    this.images = {
      player: [],
      companion: [],
    };

    this.noticeOpen = false;
  }

  async boot() {
    this.ui.setDebugVersion("v3.4 Houses");
    this.layoutManager.bind();

    this.gameData = await this.assetLoader.loadJSON(this.dataPath);
    this.flagManager = new FlagManager({ chapterProgress: this.gameData.chapterProgress });
    this.sceneManager = new SceneManager({ gameData: this.gameData });

    this.resetActorsToSceneStart(this.gameData.startScene);

    this.interactionManager = new InteractionManager({
      sceneManager: this.sceneManager,
      actors: this.actors,
    });

    this.dialogueManager = new DialogueManager({
      uiManager: this.ui,
      getDialogueById: (id) => this.gameData.dialogues[id],
      onChoiceAction: (choice, dialogueManager) => this.handleChoiceAction(choice, dialogueManager),
      onClose: () => {
        this.syncUI();
        this.updateActionButtonLabel();
      },
    });

    await this.loadAssets();
    await this.loadTileset();
    await this.loadTilemaps();

    this.renderer = new Renderer({
      canvas: this.canvas,
      sceneManager: this.sceneManager,
      actors: this.actors,
      images: this.images,
      tilemaps: this.tilemaps,
      tileset: this.tileset,
    });

    this.menuManager = new MenuManager({
      uiManager: this.ui,
      gameData: this.gameData,
      flagManager: this.flagManager,
      onReadKeyItem: (itemId) => this.readKeyItem(itemId),
      getState: () => ({
        sceneId: this.sceneManager.currentSceneId,
        sceneName: this.sceneManager.currentScene?.name || this.sceneManager.currentSceneId,
      }),
    });
    this.menuManager.bind();

    this.input = new InputController({
      onDirection: (direction) => this.handleDirection(direction),
      onAction: () => this.interact(),
      onWideTap: () => this.handleWideTap(),
    });
    this.input.bind();

    this.syncUI();
    this.updateActionButtonLabel();
    requestAnimationFrame(() => this.loop());
  }

  async loadTileset() {
    this.tileset = null;

    const loadOneTileset = async (path) => {
      const tileset = await this.assetLoader.loadJSON(path);
      const images = {};

      for (const [tileId, imagePath] of Object.entries(tileset.tiles || {})) {
        images[tileId] = await this.assetLoader.loadImage(imagePath);
      }

      return {
        ...tileset,
        images,
      };
    };

    let primary = null;
    const byId = {};

    if (this.gameData.tileset) {
      primary = await loadOneTileset(this.gameData.tileset);
      byId[primary.id] = primary;
    }

    for (const path of Object.values(this.gameData.tilesets || {})) {
      const loaded = await loadOneTileset(path);
      byId[loaded.id] = loaded;
    }

    this.tileset = {
      ...(primary || {}),
      byId,
    };
  }

  async loadTilemaps() {
    this.tilemaps = {};

    const entries = Object.entries(this.gameData.tilemaps || {});
    for (const [sceneId, path] of entries) {
      this.tilemaps[sceneId] = await this.assetLoader.loadJSON(path);
    }
  }

  async loadAssets() {
    this.images.player = await this.assetLoader.loadImageList(this.gameData.assets.player);
    this.images.companion = await this.assetLoader.loadImageList(this.gameData.assets.companion);

    this.images.playerDirections = {};
    for (const [direction, paths] of Object.entries(this.gameData.assets.playerDirectionFrames || {})) {
      this.images.playerDirections[direction] = await this.assetLoader.loadImageList(paths);
    }

    this.images.companionDirections = {};
    for (const [direction, paths] of Object.entries(this.gameData.assets.companionDirectionFrames || {})) {
      this.images.companionDirections[direction] = await this.assetLoader.loadImageList(paths);
    }

    for (const [key, path] of Object.entries(this.gameData.assets.npcs || {})) {
      this.images[key] = await this.assetLoader.loadImage(path);
    }
  }

  resetActorsToSceneStart(sceneId) {
    const scene = this.gameData.scenes[sceneId];
    this.sceneManager?.setScene(sceneId);

    const playerStart = scene.playerStart;
    const companionStart = scene.companionStart;

    this.actors.player.x = playerStart.x;
    this.actors.player.y = playerStart.y;
    this.actors.player.facing = playerStart.facing || "down";

    this.actors.companion.x = companionStart.x;
    this.actors.companion.y = companionStart.y;
  }

  handleDirection(direction) {
    if (this.menuManager?.isOpen) return;

    if (this.dialogueManager?.isChoiceOpen) {
      this.dialogueManager.moveChoice(direction);
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    this.movePlayer(direction);
  }

  movePlayer(direction) {
    if (this.dialogueManager.isOpen || this.noticeOpen) return;

    this.actors.player.facing = direction;

    const [dx, dy] = directionDelta(direction);
    const nextX = this.actors.player.x + dx;
    const nextY = this.actors.player.y + dy;

    if (this.sceneManager.isBlocked(nextX, nextY)) {
      this.updateActionButtonLabel();
      return;
    }

    const oldX = this.actors.player.x;
    const oldY = this.actors.player.y;

    this.actors.player.x = nextX;
    this.actors.player.y = nextY;
    this.actors.player.step = (this.actors.player.step + 1) % this.images.player.length;

    this.updateCompanionPosition(oldX, oldY);
    this.checkTriggers();
    this.updateActionButtonLabel();
  }

  updateCompanionPosition(oldPlayerX, oldPlayerY) {
    this.actors.companion.x = oldPlayerX;
    this.actors.companion.y = oldPlayerY + 1 <= this.gameData.canvas.rows - 2 && !this.sceneManager.isBlocked(oldPlayerX, oldPlayerY + 1)
      ? oldPlayerY + 1
      : oldPlayerY;
    this.actors.companion.facing = this.actors.player.facing;

    const frames = this.images.companionDirections?.[this.actors.companion.facing] || this.images.companion;
    this.actors.companion.frame = (this.actors.companion.frame + 1) % frames.length;
  }

  interact() {
    if (this.menuManager?.isOpen) {
      this.menuManager.close();
      return;
    }

    if (this.noticeOpen) {
      this.closeNotice();
      return;
    }

    if (this.dialogueManager?.isChoiceOpen) {
      this.dialogueManager.confirmChoice();
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (this.dialogueManager?.isOpen) {
      this.dialogueManager.advance();
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    const npc = this.interactionManager.getAdjacentNpc();
    if (npc) {
      this.dialogueManager.open(npc.dialogueId);
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    const interactable = this.interactionManager.getFacingInteractable();
    if (interactable) {
      this.handleInteractable(interactable);
    }
  }

  readKeyItem(itemId) {
    const keyItem = this.gameData.keyItems?.[itemId];
    if (!keyItem || !keyItem.readable) return false;

    if (itemId === "mothers_note" && !this.flagManager.hasReached("CH1_02_READ_MOTHERS_NOTE")) {
      this.flagManager.setMainFlag("CH1_02_READ_MOTHERS_NOTE");
    }

    this.menuManager?.render();
    this.syncUI();
    this.updateActionButtonLabel();
    return true;
  }

  handleChoiceAction(choice, dialogueManager) {
    if (!choice || !choice.action) return false;

    if (choice.action === "restart") {
      dialogueManager.restart();
      this.syncUI();
      this.updateActionButtonLabel();
      return true;
    }

    if (choice.action === "notice") {
      dialogueManager.close();
      this.showNotice(choice.text || "");
      return true;
    }

    if (choice.action === "transition") {
      dialogueManager.close();
      this.transitionScene(choice.targetScene);
      return true;
    }

    return false;
  }

  handleInteractable(interactable) {
    if (interactable.requiredFlag && !this.flagManager.hasReached(interactable.requiredFlag)) {
      this.showNotice(interactable.blockedText || "まだできない。");
      return;
    }

    if (interactable.kind === "notice") {
      this.showNotice(interactable.text || `${interactable.name}を調べた。`);
      return;
    }

    if (interactable.kind === "readKeyItem") {
      this.readKeyItem(interactable.keyItemId);
      this.showNotice(interactable.afterText || `${interactable.name}を読んだ。`);
      return;
    }

    if (interactable.kind === "sceneTransition") {
      this.transitionScene(interactable.targetScene);
      return;
    }

    this.showNotice(interactable.text || `${interactable.name}を調べた。`);
  }

  handleWideTap() {
    if (this.noticeOpen) {
      this.closeNotice();
      return;
    }

    if (this.dialogueManager.isOpen && !this.dialogueManager.isChoiceOpen) {
      this.dialogueManager.advance();
      this.syncUI();
      this.updateActionButtonLabel();
    }
  }

  checkTriggers() {
    if (this.noticeOpen || this.dialogueManager.isOpen) return;

    const trigger = this.interactionManager.getCurrentTrigger();
    if (!trigger) return;

    if (trigger.type === "notice") {
      this.showNotice(trigger.text);
    }
  }

  showNotice(text) {
    this.noticeOpen = true;
    this.ui.showNotice(text);
    this.syncUI();
    this.updateActionButtonLabel();
  }

  closeNotice() {
    if (!this.noticeOpen) return;
    this.noticeOpen = false;
    this.ui.hideNotice();
    this.syncUI();
    this.updateActionButtonLabel();
  }

  transitionScene(targetScene) {
    this.closeNotice();
    this.sceneManager.setScene(targetScene);
    this.interactionManager.resetTriggerMemory();

    const playerStart = this.sceneManager.getStartPosition(targetScene);
    const companionStart = this.sceneManager.getCompanionStart(targetScene);

    this.actors.player.x = playerStart.x;
    this.actors.player.y = playerStart.y;
    this.actors.player.facing = playerStart.facing || "down";

    this.actors.companion.x = companionStart.x;
    this.actors.companion.y = companionStart.y;

    const message = this.sceneManager.currentScene.enterNotice;
    if (message) {
      this.showNotice(message);
    } else {
      this.syncUI();
      this.updateActionButtonLabel();
    }
  }

  syncUI() {
    this.ui.syncBodyState({
      dialogueOpen: this.dialogueManager?.isOpen || false,
      choiceOpen: this.dialogueManager?.isChoiceOpen || false,
      noticeOpen: this.noticeOpen,
    });
  }

  updateActionButtonLabel() {
    if (this.dialogueManager?.isChoiceOpen) {
      this.ui.setActionButton("選ぶ", "action-talk");
      return;
    }

    if (this.dialogueManager?.isOpen) {
      this.ui.setActionButton("送る");
      return;
    }

    if (this.noticeOpen) {
      this.ui.setActionButton("閉じる");
      return;
    }

    const npc = this.interactionManager?.getAdjacentNpc();
    if (npc) {
      this.ui.setActionButton("話す", "action-talk");
      return;
    }

    const interactable = this.interactionManager?.getFacingInteractable();
    if (interactable) {
      const label = interactable.actionLabel || "調べる";
      this.ui.setActionButton(label, label === "出る" ? "action-exit" : "action-enter");
      return;
    }

    this.ui.setActionButton("…", "action-idle");
  }

  loop() {
    this.renderer.draw();
    requestAnimationFrame(() => this.loop());
  }
}
