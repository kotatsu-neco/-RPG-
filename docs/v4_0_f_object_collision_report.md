# v4.0-f Object Collision Integration 実装報告

## 実装目的

ObjectRendererで描画される大型オブジェクトについて、見た目と体感がずれないように、object placement側のcollision定義を通行判定へ統合した。

## 追加ファイル

```text
src/engine/ObjectCollisionManager.js
docs/object_collision_static_report_v4_0_f.csv
docs/v4_0_f_object_collision_report.md
```

## 変更ファイル

```text
src/engine/SceneManager.js
src/engine/Game.js
src/engine/AssetValidator.js
src/game/data/matsuyoi.game.json
README.md
docs/package_summary.json
```

## 基本方針

collisionは以下の2層で扱う。

```text
asset collision:
  その素材が基本的に通行不可かどうかを示す意味的ヒント

placement collision:
  実際にその配置でどのタイルを塞ぐかを示すruntime footprint
```

実際の通行判定では、placement collisionを優先する。

## ObjectCollisionManager

対応内容:

```text
scene別object placementからcollision mapを構築
collision.shape = tiles
collision.shape = rect
SceneManager.isBlockedへの統合
debug用 window.matsuyoiObjectCollision
```

## SceneManagerとの統合

`SceneManager.isBlocked(x, y)` は以下の順に判定する。

```text
1. 画面外
2. scene.blockedTiles
3. object collision
```

既存のblockedTilesを壊さず、object由来のcollisionを追加している。

## 見た目と体感のズレ対策

v4.0-fでは、objectの見た目から機械的にcollisionを推測するのではなく、placement側に明示された `collision.tiles` を優先する。

理由:

```text
井戸・机・棚・扉などは見た目の大きさと実際に塞ぐべきタイルが一致しない場合がある
プレイヤーの体感では、見た目より少し自然な余白が必要な場合がある
グラフィック担当と実装担当でcollision範囲を明文化できる
```

## AssetValidator追加検証

```text
collision.shape が tiles / rect か
tiles指定が空でないか
rect指定に x / y / width / height があるか
asset collision と placement collision の矛盾
```

## 初期対象

```text
village_well_01:
  collision tiles = 4,13 / 5,13 / 4,14 / 5,14

colpan_memo_spot_01:
  collision disabled
```

## 今回やっていないこと

```text
全object collisionの完全調整
collision debug overlay
object由来interactable自動生成
NPC pathfinding
半歩移動
polygon collision
```

## 確認ポイント

```text
左上が v4.0-f Collision になる
井戸の見た目付近で通行できない
井戸から不自然に離れた場所では通行できる
母のメモ位置は通行を妨げない
コルパン家開始・村への移動・コルパン家への戻りが維持される
window.matsuyoiObjectCollision に現在sceneのobject collisionが入る
```
