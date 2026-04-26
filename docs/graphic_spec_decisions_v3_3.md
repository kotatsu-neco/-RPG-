# v3.3 グラフィック仕様決定メモ

## semantic manifest

完全版は以下の列構成を採用する。

```csv
tile_id,filename,semantic_name,category,collision,notes
```

## semantic_name

英字スネークケース。材質 + 用途を優先する。

例:

```text
wood_floor
stone_wall
grave_mossy
door_highlight
```

## collision

案Cを採用。

```text
基本は tile collision
例外は collision layer で上書き
```

## コルパン家最低構成

- 木床
- 内壁
- 扉
- ベッド
- 机
- 椅子
- 棚

v3.3では仮タイルで構成する。
