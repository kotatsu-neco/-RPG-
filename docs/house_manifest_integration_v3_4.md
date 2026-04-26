# v3.4 家別manifest反映メモ

## 目的

グラフィック部門から受領した、コルパン家・ルルガー家の最小manifestを実装へ反映する。

## 受領物

```text
matsuyoi_colpan_house_minimum_interior_spec.md
matsuyoi_colpan_house_minimum_interior_manifest.csv
matsuyoi_colpan_house_handoff.zip

matsuyoi_lulgar_house_minimum_spec.md
matsuyoi_lulgar_house_minimum_manifest.csv
matsuyoi_lulgar_house_handoff.zip
```

受領物は以下に保存。

```text
docs/received_house_specs_v3_4/
assets/manifests/
```

## 追加したtileset

```text
src/game/data/tileset.colpan_house.minimum.json
src/game/data/tileset.rulgar_house.minimum.json
```

## 更新したtilemap

```text
src/game/maps/colpan_house.tilemap.json
src/game/maps/rulgar_house.tilemap.json
```

## 重要な追加

ルルガー家に `mail_bundle` を配置。

今後の接続候補:

```text
CH1_06_TART_ARRIVED
CH1_07_RECEIVED_LETTERS
CH1_09_COMPLETED_VILLAGE_DELIVERY
```

## collision

家別manifestのcollisionは保持しているが、v3.4ではまだ `blockedTiles` を正として使う。
