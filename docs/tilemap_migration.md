# v3.0 タイルマップJSON化メモ

## 目的

`Renderer.js` に直書きされていた背景描画を、タイルマップJSON方式へ移行する。

## 追加ファイル

```text
src/engine/TileMapRenderer.js
src/game/maps/village_center.tilemap.json
src/game/maps/rulgar_house.tilemap.json
```

## 現在の構造

`matsuyoi.game.json` に以下を追加。

```json
"tilemaps": {
  "village_center": "src/game/maps/village_center.tilemap.json",
  "rulgar_house": "src/game/maps/rulgar_house.tilemap.json"
}
```

`Game.js` が起動時に tilemap JSON を読み込み、`Renderer.js` へ渡す。

`Renderer.js` は現在シーンIDの tilemap がある場合、`TileMapRenderer` を使って描画する。

## まだ残る専用性

- タイルIDと色の対応は `TileMapRenderer.js` 内に仮定義
- 正式な画像タイルセットではなく、色面ベース
- object layerもまだ簡易
- collisionは既存の `blockedTiles` を継続使用

## 次にやるべきこと

1. グラフィック部門から正式タイル仕様を受け取る
2. tileId命名表を確定する
3. タイル画像読み込み方式へ変更する
4. collision layerをtilemap側へ統合する
5. object layerとinteractablesの位置を一本化する
