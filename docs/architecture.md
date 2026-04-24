# アーキテクチャ

## 基本方針

`engine/` はゲームジャンル共通の仕組みを担当し、`game/` は作品固有データを担当する。

## engine

### Game.js
全体の統括。入力、会話、通知、シーン、描画を接続する。

### AssetLoader.js
JSONと画像の読み込みを担当する。キャッシュバスターもここに集約。

### InputController.js
キーボード、スマホ十字キー、アクションボタン、広域タップをイベント化する。

### UIManager.js
DOM操作を担当する。会話、選択肢、小通知、アクションボタン、body状態クラスを管理する。

### DialogueManager.js
会話進行、選択肢、選択位置を管理する。

### SceneManager.js
現在シーン、当たり判定、NPC・interactable・trigger取得を担当する。

### InteractionManager.js
主人公の向きと位置から、NPC・調査対象・triggerを判断する。

### Renderer.js
現在はプロトタイプ描画。将来的にはタイルマップ描画へ置き換え候補。

## game

### matsuyoi.game.json
作品固有データ。

- assets
- dialogues
- scenes
- npcs
- interactables
- triggers
- blockedTiles

を管理する。

## 状態管理

主な状態は `Game` に集約。

- player
- companion
- currentScene
- dialogueOpen
- noticeOpen
- selectedChoiceIndex

UI反映は `UIManager.syncBodyState()` に集約する。
