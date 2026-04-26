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


## v2.1 LayoutManager

`LayoutManager.js` を追加。

目的は、iPhone Safariで発生する viewport 高さの再計算ズレに対処すること。

CSSの `100svh` だけに依存せず、JS側で `--app-height` を更新し、`#app`, `#game-shell`, `#game-canvas` の基準高さとして使う。

## v2.1 アクションボタン仕様

アクション対象がない時は `…` を表示し、`action-idle` クラスで薄くする。

これは「その場所でできるアクション名を表示する」という方針に合わせた仕様で、何もできない場所では動詞を表示しない。


## v2.2 Choice Action

`DialogueManager` に選択肢アクションの処理口を追加。

- `DialogueManager` は選択肢の選択を検知する
- 実際の分岐処理は `Game.handleChoiceAction()` に委譲する

これにより、会話管理クラスがゲーム固有の処理を持ちすぎないようにした。

現在の対応 action:

- `restart`
- `notice`
- `transition`

## v2.2 Interactable追加例

井戸を `interactables` として追加。

これは今後、看板・本棚・手紙・宝箱などの「調べる」「読む」「拾う」「開ける」に拡張できる。


## v2.3 MenuManager

`MenuManager.js` を追加。

通常探索UIとメニューUIを分離する。

- 右下アクションボタン: その場でできること
- 右上メニューボタン: アイテム・装備・ステータス・記録・設定

メニュー表示中は、移動・会話・通知などの探索操作を一時停止する。


## v2.4 修正

### DialogueManager

選択肢決定の経路を再整理。

- UI上の選択肢タップ
- 十字キー上下 + 選ぶ
- action付き選択肢

のいずれでも `confirmChoice()` を通る。

### Menu Layout

`#menu-layer` を grid中央配置から flex-start配置へ変更。
メニュー内容の高さが変わっても、上端が動かない。


## v2.5 修正

### Choice Confirm

選択肢表示中は `Game.interact()` が `DialogueManager.confirmChoice()` を明示的に呼ぶ。

これにより、`advance()` の内部状態に依存せず、右下ボタン「選ぶ」で確実に選択できる。

### Choice Layout

`body.choice-open #dialog-layer` を上方向へ移動し、操作キーと会話ウィンドウの重なりを避ける。


## v2.7 Choice Restart 修正

`restart` は会話管理そのものの操作であるため、`DialogueManager` 側で直接処理する仕様に変更。

`notice` や `transition` など、ゲーム世界側の処理が必要な action は引き続き `Game.handleChoiceAction()` に委譲する。


## v3.0 TileMapRenderer

`Renderer.js` の直書き背景を置き換える第一歩として、`TileMapRenderer.js` を追加。

現時点では色面ベースのプロトタイプタイルだが、構造としては以下に対応する。

- sceneIdごとのtilemap取得
- 複数layer描画
- tileIdベース描画
- tilemapがない場合のfallback

次段階では、tileIdを画像tilesetに対応させる。
