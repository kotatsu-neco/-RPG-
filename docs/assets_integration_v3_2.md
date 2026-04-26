# v3.2 semantic manifest 統合メモ

## 受領物

- matsuyoi_clean_asset_package_v2.zip
- manifest_tiles_semantic_minimum.csv

## 対応内容

- clean asset package v2 を原版保持
- 実装用に 16x16 / 16x32 / 24x24 へ正規化
- semantic minimum manifest を読み込み
- tileId -> semantic_name -> filename の順で tileset を自動生成

## collision の扱い

今回受領した collision はプロトタイプ用暫定値として保持のみ。
既存の `blockedTiles` をまだ正とする。

## 追加で望ましい次回情報

- タイル全件の semantic_name
- タイルごとの collision 完全版
- autotile / edge / corner の区別
- interior / exterior の用途分類
