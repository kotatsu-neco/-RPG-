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

export class Game {
  constructor({ canvas, dataPath, version = ENGINE_VERSION }) {
    this.canvas = canvas;
    this.dataPath = dataPath;
    this.assetLoader = new AssetLoader({ version });
    this.ui = new UIManager();
    this.layoutManager = new LayoutManager();

    this.actors = {
      player: { x: 0, y: 0, facing: "down", step: 0 },
      companion: { x: 0, y: 0, frame: 0 },
    };

    this.images = {
      player: [],
      companion: [],
    };

    this.noticeOpen = false;
  }

  async boot() {
    this.ui.setDebugVersion("v2.5 Engine");
    this.layoutManager.bind();

    this.gameData = await this.assetLoader.loadJSON(this.dataPath);
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

    this.renderer = new Renderer({
      canvas: this.canvas,
      sceneManager: this.sceneManager,
      actors: this.actors,
      images: this.images,
    });

    this.menuManager = new MenuManager({
      uiManager: this.ui,
      gameData: this.gameData,
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

  async loadAssets() {
    this.images.player = await this.assetLoader.loadImageList(this.gameData.assets.player);
    this.images.companion = await this.assetLoader.loadImageList(this.gameData.assets.companion);

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

    this.actors.companion.frame = (this.actors.companion.frame + 1) % this.images.companion.length;
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
      const confirmed = this.dialogueManager.confirmChoice();
      this.syncUI();
      this.updateActionButtonLabel();
      return confirmed;
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

  handleInteractable(interactable) {
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
