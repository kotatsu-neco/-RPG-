# v3.1 グラフィック素材統合メモ

## 受領素材

`matsuyoi_clean_asset_package.zip` を実装用に取り込んだ。

## 原版保持先

```text
assets/clean_source/
```

## 実装用正規化先

```text
assets/tiles/clean16/
assets/sprites/colpan_clean/
assets/sprites/land_clean/
assets/ui/clean/
```

## 正規化方針

- tile: 16×16
- colpan: 16×32
- land: 24×24
- ui: 原寸保持

## 現在の制約

`manifest_tiles.csv` は位置情報のみで、タイルの意味名がない。
そのため、`tileset.clean16.json` の tileId 対応は仮である。

## グラフィック部門へ追加確認したいこと

次回以降、以下のような意味名付き manifest があると実装精度が上がる。

```csv
tile_id,filename,semantic_name,category,collision
0,tile_001.png,grass,outdoor,false
1,tile_002.png,grass_dark,outdoor,false
2,tile_012.png,dirt_path,outdoor,false
...
```

最低限ほしい semantic_name:

- grass
- grass_dark
- dirt_path
- stone_path
- stone_wall
- roof
- wood
- crop_field
- well
- door_highlight
- interior_floor_wood
- interior_wall
- shelf
- table
- stove
