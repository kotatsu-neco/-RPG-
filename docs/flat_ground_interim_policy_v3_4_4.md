# v3.4.4 暫定フラットground採用方針

## 背景

v3.4.1〜v3.4.2で地面の白い格子状表示が発生した。

v3.4.3で診断用フラットgroundタイルに差し替えたところ、groundの継ぎ目は消えた。

## 結論

```text
ground継ぎ目問題は、エンジン描画ではなくgroundタイル素材設計に起因する。
```

## v3.4.4の方針

開発を止めないため、v3.4.3のフラットgroundを暫定運用タイルとして採用する。

```text
ground:
  ground16_flat_diagnostic を暫定採用

objects:
  既存素材を維持

decoration:
  既存素材を維持
```

## 目的

- 地面の破綻を抑える
- 第一章イベント実装を継続する
- 正式ground素材の再設計を待てる状態にする

## 注意

この版は美術完成版ではない。

正式ground素材が届いたら、以下を差し替える。

```text
src/game/data/tileset.ground16.flat.diagnostic.json
assets/tiles/ground16_flat_diagnostic/
```

または新しい正式tilesetを追加し、tilemapのground layerのtileset指定を変更する。
