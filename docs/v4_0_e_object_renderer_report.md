# v4.0-e ObjectRenderer 実装報告

## 実装目的

16×16 tilemapでは扱いづらい大型オブジェクトを、原寸・anchor基準・z-order/y-sort付きで描画できるようにした。  
特に、scene表示後にオブジェクトが遅れて表示されることを避けるため、scene表示前preloadを基本方針として実装した。

## 追加ファイル

```text
src/engine/ObjectRenderer.js
src/game/objects/village_center.objects.json
src/game/objects/colpan_house.objects.json
src/game/objects/rulgar_house.objects.json
docs/matsuyoi_object_renderer_spec_v4_0_e.md
docs/v4_0_e_object_renderer_report.md
```

## 変更ファイル

```text
src/engine/AssetLoader.js
src/engine/Renderer.js
src/engine/Game.js
src/engine/SceneTransitionManager.js
src/engine/AssetValidator.js
src/game/data/matsuyoi.game.json
README.md
docs/package_summary.json
```

## ObjectRenderer

対応内容:

```text
scene別object placement
asset_id参照
preloadSceneObjects(sceneId)
renderSceneObjects(sceneId)
原寸描画
anchor_x / anchor_y
z_order / y_sort
描画時await禁止
```

## AssetLoader拡張

```text
imageCache追加
getImage(path)
hasImage(path)
```

preload時にImageをcacheし、描画時は同期的に取得する。

## 初期配置

```text
village_center:
  village_well_01

colpan_house:
  colpan_memo_spot_01

rulgar_house:
  空定義
```

## 表示遅延対策

```text
起動時に現在sceneのobject画像をpreload
scene遷移前にtarget sceneのobject画像をpreload
ObjectRenderer描画中はawaitしない
未preloadの場合はconsole warning
```

## AssetValidator連携

以下を検証対象に追加した。

```text
object placement JSON存在
placement.asset_id存在
placement.x / y
placement.z_order
placement collisionとasset collisionの矛盾
interactable_idとscene interactablesの対応
anchor範囲
```

## 今回やっていないこと

```text
全家具の完全配置
全object collision統合
object由来interactable自動生成
fade演出
object animation
戦闘
Single File版作成
```

## 確認ポイント

```text
左上が v4.0-e Object になる
起動時にロードが完了してからゲーム画面が表示される
村の井戸がObjectRenderer経由で原寸描画される
scene表示後に井戸が遅れて出ない
母のメモを読める
村へ出られる
村からコルパン家へ戻れる
AssetValidatorがobject placementを検証する
```
