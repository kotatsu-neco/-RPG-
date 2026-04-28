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
import { UIStateController, UI_STATES } from "./UIStateController.js";
import { ActionResolver } from "./ActionResolver.js";
import { ConditionEvaluator } from "./ConditionEvaluator.js";
import { EventFlagManager } from "./EventFlagManager.js";
import { EffectRunner } from "./EffectRunner.js";
import { SceneTransitionManager } from "./SceneTransitionManager.js";
import { InteractableResolver } from "./InteractableResolver.js";
import { AssetValidator } from "./AssetValidator.js";
import { ObjectRenderer } from "./ObjectRenderer.js";
import { ObjectCollisionManager } from "./ObjectCollisionManager.js";

export class Game {
  constructor({ canvas, dataPath, version = ENGINE_VERSION }) {
    this.canvas = canvas;
    this.dataPath = dataPath;
    this.assetLoader = new AssetLoader({ version });
    this.ui = new UIManager();
    this.layoutManager = new LayoutManager();
    this.uiState = new UIStateController({ initialState: UI_STATES.LOADING, debug: true });
    this.actionResolver = new ActionResolver({ uiStateController: this.uiState });

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

  emitBootStep(step, detail = "") {
    window.dispatchEvent(new CustomEvent("matsuyoi:game-boot-step", {
      detail: { step, detail, at: Date.now() },
    }));
    console.info("[GameBoot]", step, detail);
  }

  async validateAssets() {
    this.assetValidator = new AssetValidator({
      assetLoader: this.assetLoader,
      gameData: this.gameData,
      strict: false,
    });

    const results = await this.assetValidator.validate();
    window.matsuyoiAssetValidation = results;

    const summary = this.assetValidator.getSummary();
    this.ui?.setDebugDetail?.(`assets: ${summary.errors} errors / ${summary.warnings} warnings`);

    return results;
  }

  async boot() {
    this.emitBootStep("game:boot:start", "Game.boot started");
    this.ui.setDebugVersion("v4.0-g.4 DOMFix");
    window.matsuyoiCacheDebug = () => this.assetLoader.getCacheDebugInfo();
    this.layoutManager.bind();

    this.gameData = await this.assetLoader.loadJSON(this.dataPath);
    this.flagManager = new FlagManager({ chapterProgress: this.gameData.chapterProgress });
    this.sceneManager = new SceneManager({ gameData: this.gameData });

    this.conditionEvaluator = new ConditionEvaluator({
      flagManager: this.flagManager,
      getRuntimeState: () => ({
        sceneId: this.sceneManager?.currentSceneId,
        uiState: this.uiState?.state,
      }),
    });

    this.eventFlagManager = new EventFlagManager({ flagManager: this.flagManager });
    this.interactableResolver = new InteractableResolver({
      conditionEvaluator: this.conditionEvaluator,
    });

    this.resetActorsToSceneStart(this.gameData.startScene);

    this.interactionManager = new InteractionManager({
      sceneManager: this.sceneManager,
      actors: this.actors,
      interactableResolver: this.interactableResolver,
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

    this.sceneTransitionManager = new SceneTransitionManager({
      sceneManager: this.sceneManager,
      actors: this.actors,
      interactionManager: this.interactionManager,
      gameData: this.gameData,
    });

    this.effectRunner = new EffectRunner({
      flagEffects: this.eventFlagManager,
      showNotice: (text) => this.showNotice(text),
      openDialogue: (dialogueId) => {
        this.dialogueManager.open(dialogueId);
        this.syncUI();
        this.updateActionButtonLabel();
      },
      transitionScene: (definition) => { void this.transitionScene(definition); },
      readKeyItem: (itemId) => this.readKeyItem(itemId),
      updateUI: () => {
        this.syncUI();
        this.updateActionButtonLabel();
      },
    });

    await this.loadAssets();
    this.emitBootStep("game:tileset", "Loading tilesets");
    await this.loadTileset();
    this.emitBootStep("game:tilemaps", "Loading tilemaps");
    await this.loadTilemaps();
    this.emitBootStep("game:object-assets", "Loading object asset definitions");
    await this.loadObjectAssets();
    this.emitBootStep("game:object-placements", "Loading object placements");
    await this.loadObjectPlacements();

    this.objectCollisionManager = new ObjectCollisionManager({
      objectPlacements: this.objectPlacements,
      objectAssets: this.objectAssetData,
      debug: true,
    });
    this.sceneManager.setObjectCollisionManager(this.objectCollisionManager);

    this.objectRenderer = new ObjectRenderer({
      ctx: this.canvas.getContext("2d"),
      assetLoader: this.assetLoader,
      objectAssets: this.objectAssetData,
      objectPlacements: this.objectPlacements,
      tileSize: this.gameData.canvas.tileSize,
    });

    this.emitBootStep("game:object-preload", "Preloading current scene objects");
    await this.preloadSceneObjects(this.sceneManager.currentSceneId);

    this.renderer = new Renderer({
      canvas: this.canvas,
      sceneManager: this.sceneManager,
      actors: this.actors,
      images: this.images,
      tilemaps: this.tilemaps,
      tileset: this.tileset,
      objectRenderer: this.objectRenderer,
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
      onOpen: () => this.syncUI(),
      onClose: () => this.syncUI(),
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
    this.ui?.setDebugDetail?.(`cache: ${this.assetLoader.bootCacheToken.slice(0, 8)}`);
    this.emitBootStep("game:boot:complete", "Game.boot completed");
    requestAnimationFrame(() => this.loop());
  }

  async loadObjectAssets() {
    this.objectAssetData = this.gameData.objectDecorationAssets
      ? await this.assetLoader.loadJSON(this.gameData.objectDecorationAssets)
      : { assets: {} };
  }

  async loadObjectPlacements() {
    this.objectPlacements = { scenes: {} };

    const entries = Object.entries(this.gameData.objectPlacements || {});
    for (const [sceneId, path] of entries) {
      this.objectPlacements.scenes[sceneId] = await this.assetLoader.loadJSON(path);
    }
  }

  async preloadSceneObjects(sceneId) {
    if (!this.objectRenderer) return null;
    return this.objectRenderer.preloadSceneObjects(sceneId);
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
    this.syncUI();

    if (this.actionResolver.canMoveChoice(direction)) {
      this.dialogueManager.moveChoice(direction);
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (!this.actionResolver.canMove()) return;

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
    const playerFrameCount = this.images.playerDirections?.[direction]?.length || this.images.player.length || 1;
    this.actors.player.step = (this.actors.player.step + 1) % playerFrameCount;

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

    const frames = this.images.companionDirections?.[this.actors.companion.facing] || this.images.companion || [];
    this.actors.companion.frame = (this.actors.companion.frame + 1) % (frames.length || 1);
  }

  interact() {
    this.syncUI();

    if (!this.actionResolver.canAction()) return;

    const actionKind = this.actionResolver.actionKind();

    if (actionKind === "closeMenu") {
      this.menuManager.close();
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (actionKind === "closeNotice") {
      this.closeNotice();
      return;
    }

    if (actionKind === "confirmChoice") {
      this.dialogueManager.confirmChoice();
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (actionKind === "advanceDialogue") {
      this.dialogueManager.advance();
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (actionKind !== "interact") return;

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

  applyTransitionTargetPosition(interactable) {
    const target = interactable.targetPosition;
    if (!target) return;

    this.actors.player.x = target.x;
    this.actors.player.y = target.y;

    if (target.facing) {
      this.actors.player.facing = target.facing;
    }

    if (this.companion) {
      const offsetX = target.companionOffset?.x ?? -1;
      const offsetY = target.companionOffset?.y ?? 1;
      this.actors.companion.x = target.companionX ?? Math.max(0, target.x + offsetX);
      this.actors.companion.y = target.companionY ?? Math.max(0, target.y + offsetY);
    }
  }

  checkEventConditions(definition = {}) {
    const blockedText = this.conditionEvaluator?.firstFailedReason(definition) || "";
    return {
      ok: !blockedText,
      blockedText,
    };
  }

  runEffects(effects = []) {
    return this.effectRunner?.runMany(effects) || [];
  }

  readKeyItem(itemId) {
    const keyItem = this.gameData.keyItems?.[itemId];
    if (!keyItem || !keyItem.readable) return false;

    if (itemId === "mothers_note" && !this.flagManager.hasReached("CH1_02_READ_MOTHERS_NOTE")) {
      this.flagManager.setMainFlag("CH1_02_READ_MOTHERS_NOTE");
    }

    this.runEffects(keyItem.onReadEffects || keyItem.effects || []);

    this.menuManager?.render();
    this.syncUI();
    this.updateActionButtonLabel();
    return true;
  }

  handleChoiceAction(choice, dialogueManager) {
    if (!choice) return false;

    const conditionResult = this.checkEventConditions(choice);
    if (!conditionResult.ok) {
      dialogueManager.close();
      this.showNotice(conditionResult.blockedText);
      return true;
    }

    if (choice.effects || choice.onSelectEffects) {
      dialogueManager.close();
      this.runEffects(choice.effects || choice.onSelectEffects);
      this.syncUI();
      this.updateActionButtonLabel();
      return true;
    }

    if (!choice.action) return false;

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
      void this.transitionScene(choice);
      return true;
    }

    return false;
  }

  handleInteractable(interactable) {
    const conditionResult = this.checkEventConditions(interactable);
    if (!conditionResult.ok) {
      this.showNotice(conditionResult.blockedText);
      return;
    }

    this.runEffects(interactable.beforeEffects || []);

    if (interactable.effects && !interactable.kind) {
      this.runEffects(interactable.effects);
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (interactable.kind === "notice") {
      this.showNotice(interactable.text || `${interactable.name}を調べた。`);
      this.runEffects(interactable.afterEffects || []);
      return;
    }

    if (interactable.kind === "readKeyItem") {
      this.readKeyItem(interactable.keyItemId);
      this.showNotice(interactable.afterText || `${interactable.name}を読んだ。`);
      this.runEffects(interactable.afterEffects || []);
      return;
    }

    if (interactable.kind === "dialogue") {
      this.dialogueManager.open(interactable.dialogueId);
      this.syncUI();
      this.updateActionButtonLabel();
      this.runEffects(interactable.afterEffects || []);
      return;
    }

    if (interactable.kind === "sceneTransition") {
      void this.transitionScene(interactable);
      this.runEffects(interactable.afterEffects || []);
      return;
    }

    this.showNotice(interactable.text || `${interactable.name}を調べた。`);
    this.runEffects(interactable.afterEffects || []);
  }

  handleWideTap() {
    this.syncUI();

    if (!this.actionResolver.canWideTap()) return;

    const wideTapKind = this.actionResolver.wideTapKind();

    if (wideTapKind === "closeNotice") {
      this.closeNotice();
      return;
    }

    if (wideTapKind === "advanceDialogue" && this.dialogueManager.isOpen && !this.dialogueManager.isChoiceOpen) {
      this.dialogueManager.advance();
      this.syncUI();
      this.updateActionButtonLabel();
    }
  }

  checkTriggers() {
    if (this.noticeOpen || this.dialogueManager.isOpen) return;

    const trigger = this.interactionManager.getCurrentTrigger();
    if (!trigger) return;

    const conditionResult = this.checkEventConditions(trigger);
    if (!conditionResult.ok) return;

    if (trigger.effects) {
      this.runEffects(trigger.effects);
      return;
    }

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

  async transitionScene(transitionDefinition) {
    this.closeNotice();

    this.uiState.setState(UI_STATES.TRANSITION, "scene-transition");
    this.syncUI();

    const result = await this.sceneTransitionManager.transitionAsync(transitionDefinition, {
      preloadScene: (sceneId) => this.preloadSceneObjects(sceneId),
    });

    if (!result.changed) {
      this.syncUI();
      this.updateActionButtonLabel();
      return;
    }

    if (result.enterNotice) {
      this.showNotice(result.enterNotice);
    } else {
      this.syncUI();
      this.updateActionButtonLabel();
    }
  }

  updateCollisionDebug() {
    const count = this.objectCollisionManager?.getSceneCollisionTiles(this.sceneManager.currentSceneId)?.length || 0;
    window.matsuyoiObjectCollision = {
      sceneId: this.sceneManager.currentSceneId,
      tiles: this.objectCollisionManager?.getSceneCollisionTiles(this.sceneManager.currentSceneId) || [],
    };

    return count;
  }

  updateHudInfo() {
    const scene = this.sceneManager?.getCurrentScene?.();
    const locationName = scene?.displayName || scene?.name || "";
    const objective = this.flagManager?.getObjective?.(this.gameData.objectives || {}) || scene?.objectiveHint || "";

    this.ui?.setLocationText?.(locationName);
    this.ui?.setObjectiveText?.(objective);
  }

  syncUI() {
    this.updateHudInfo?.();
    this.updateCollisionDebug?.();

    const runtimeState = {
      loading: false,
      menuOpen: this.menuManager?.isOpen || false,
      dialogueOpen: this.dialogueManager?.isOpen || false,
      choiceOpen: this.dialogueManager?.isChoiceOpen || false,
      noticeOpen: this.noticeOpen,
      transition: false,
      cutscene: false,
    };

    this.uiState.syncFromRuntime(runtimeState);

    this.ui.syncBodyState({
      dialogueOpen: runtimeState.dialogueOpen,
      choiceOpen: runtimeState.choiceOpen,
      noticeOpen: runtimeState.noticeOpen,
      menuOpen: runtimeState.menuOpen,
      uiState: this.uiState.state,
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
