# v4.0-b BrowserGestureGuard / Input / UIState 実装報告

## 実装範囲

v4.0-bとして、スマホ操作・入力制御・UI状態管理の基礎を整理した。

## 追加ファイル

```text
src/engine/BrowserGestureGuard.js
src/engine/UIStateController.js
src/engine/ActionResolver.js
```

## 変更ファイル

```text
src/main.js
src/engine/Game.js
src/engine/MenuManager.js
src/engine/UIManager.js
src/style.css
src/game/data/matsuyoi.game.json
README.md
docs/package_summary.json
```

## BrowserGestureGuard

main.js内にあったSafariジェスチャー抑止処理を、engine側の専用クラスへ分離した。

目的:

```text
ダブルタップ拡大抑止
ピンチズーム抑止
長押し選択抑止
contextmenu抑止
スクロール原点固定
```

## UIStateController

以下の状態を明示的に扱う。

```text
loading
exploration
dialogue
choice
notice
menu
transition
cutscene
```

## ActionResolver

現在のUI状態から、以下を判定する。

```text
移動できるか
選択肢を上下できるか
アクションボタンが何をするか
広域タップが何をするか
```

## 今回やっていないこと

```text
ストーリー追加
ルルガー家解放
SceneTransitionManager
InteractableResolver
AssetValidator
ObjectRenderer
Single File版作成
```

## 確認ポイント

```text
通常時に移動できる
会話中に移動できない
選択肢中は上下と選ぶが効く
小通知はアクションまたは広域タップで閉じる
メニュー中に移動できない
ダブルタップで画面拡大しない
左上バージョンが v4.0-b Input になる
```

## 次工程

```text
v4.0-c SceneTransition / Interactable
```
