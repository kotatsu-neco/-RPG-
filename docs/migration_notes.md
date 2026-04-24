# v1.1 から v2.0 への移行メモ

## 変更点

v1.1では `game.js` にほぼ全処理が入っていた。
v2.0では以下へ分割。

- 入力: InputController
- UI: UIManager
- 会話: DialogueManager
- シーン: SceneManager
- 相互作用: InteractionManager
- 描画: Renderer
- 統括: Game

## 維持した挙動

- iPhone SE基準の表示
- 通常時の操作キー表示
- 会話本文中の操作キー非表示
- 選択肢中の操作キー表示
- 小通知中の操作キー非表示
- 小通知の下部タップ閉じ
- 状況別アクションボタン
- ルルガー家入退室

## 変えた点

- `map JSON` ではなく、`matsuyoi.game.json` へゲームデータを集約
- scene単位で `npcs`, `interactables`, `triggers`, `blockedTiles` を持つ形式に変更
- 作品固有データとエンジン処理を分離
