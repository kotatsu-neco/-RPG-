# v4.0-d AssetLoader / AssetValidator 実装報告

## 実装目的

アセット定義の抜け・齟齬を早期検出し、ゲーム性・没入感・美観に影響する問題を実装段階で見つけられるようにする。

特に、グラフィック担当との意思確認に齟齬が生まれないよう、受け渡し仕様と検証項目を明文化した。

## 追加ファイル

```text
src/engine/AssetValidator.js
docs/asset_handoff_spec_for_graphics_team_v4_0_d.md
docs/asset_validation_static_report_v4_0_d.csv
docs/v4_0_d_asset_validator_report.md
```

## 変更ファイル

```text
src/engine/Game.js
src/engine/UIManager.js
src/game/data/matsuyoi.game.json
README.md
docs/package_summary.json
```

## AssetValidatorの検証対象

```text
gameData基本定義
tilesets
tilemaps
sprite frames
object / decoration assets
画像読み込み可否
semantic_name
collision
layer_type
width / height
anchor_x / anchor_y
edge_policy
resize_rule
ground tile rules
```

## 重要な思想

アセットは単なる画像ではない。  
以下はゲーム性・美観・没入感に直結するため、明示定義を必須に近い扱いとする。

```text
collision
layer_type
z-order
anchor
width / height
opaque / alpha_rule
edge_policy
semantic_name
interactable連動
resize_rule
```

## 実行時挙動

起動時に `AssetValidator` を実行し、結果をconsoleへ出す。  
また `window.matsuyoiAssetValidation` に結果を保持する。

## strictについて

v4.0-dでは `strict: false` としている。  
理由は、現素材にまだ過渡的な定義が含まれるため、警告で止めずに確認できるようにするため。

将来的に正式素材セットが揃った段階で `strict: true` 化を検討する。

## 今回やっていないこと

```text
画像の自動加工
白縁の自動補正
素材のリサイズ
ObjectRenderer
グラフィック差し替え
```

## 確認ポイント

```text
左上が v4.0-d Assets になる
起動時consoleにAssetValidator summaryが出る
window.matsuyoiAssetValidation に検証結果が入る
既存の開始導線が壊れていない
母のメモを読める
村へ出られる
村からコルパン家へ戻れる
```

## 次工程候補

```text
v4.0-e ObjectRenderer
```
