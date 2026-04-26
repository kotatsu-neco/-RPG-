# v3.4.2 ground16完全不透明タイル対応メモ

## 目的

v3.4.1で発生した白い格子状表示を改善するため、ground layer を完全不透明16×16タイルへ差し替える。

## 受領素材

```text
matsuyoi_ground_tiles_16_opaque_v1.zip
```

## 実装反映

```text
assets/tiles/ground16_opaque/
assets/manifests/ground_tiles_16_opaque_manifest.csv
src/game/data/tileset.ground16.opaque.v1.json
```

## 重要ルール

- groundタイルは再リサイズしない
- cropしない
- 外周補正しない
- ground layerには opaque=true のタイルだけ置く
- object / decoration は別layerにする

## tilemap更新

以下を3層化した。

```text
colpan_house
rulgar_house
village_center
```

## まだ残る可能性がある問題

- object / decoration側の旧素材に白縁が残る可能性
- 家屋や家具の縁はまだ完全不透明groundほど整理されていない
- collisionはまだ blockedTiles 主体
