# 『待宵物語』ObjectRenderer 仕様検討書  
## v4.0-e 実装前設計：大型オブジェクト描画・遅延対策・保守性方針

**文書種別**: 実装前仕様検討書  
**対象工程**: v4.0-e ObjectRenderer  
**目的**: 16×16タイルでは扱いきれない井戸・机・ベッド・扉・棚などの大型オブジェクトを、表示遅延を抑えつつ安定して描画できるようにする。  
**最重要品質**: 安定性 / 保守性 / 柔軟性 / 拡張性 / 表示の即時性  
**前提**: Single File版は作らず、正式ファイル構成でGitHub Desktopからpushする運用を継続する。

---

# 1. 結論

`ObjectRenderer` は、単に「大きい画像を描く処理」ではなく、以下を統合的に扱う描画基盤として設計する。

```text
1. 大型オブジェクトの原寸描画
2. anchor基準配置
3. z-order / y-sort
4. collision定義との連動
5. interactable定義との連動
6. 事前読み込みによる表示遅延防止
7. アセット定義検証との連携
8. 将来の演出・差し替え・状態変化への拡張
```

特に、ユーザーが画面に入った時にオブジェクトが遅れて表示されると不安や離脱につながるため、**シーン表示前に必要なオブジェクト画像を必ずpreloadする** ことを基本方針とする。

---

# 2. ObjectRenderer が必要な理由

現在の `TileMapRenderer` は、主に16×16タイルを敷き詰めるための仕組みである。

しかし、現在の素材には以下のような16×16ではないオブジェクトが存在する。

```text
obj_well.png      32×32
obj_table.png     32×20
obj_bed.png       32×20
obj_door.png      16×24
obj_shelf.png     16×32
obj_cabinet.png   16×32
```

これらを16×16 tilemapへ無理に押し込むと、以下の問題が起きる。

```text
- 画像が潰れる
- anchorがずれる
- キャラクターとの重なり順が不自然になる
- collisionの位置と見た目が合わない
- interactableの対象位置が分かりづらくなる
- 家具や井戸の存在感が弱くなる
```

したがって、タイルとは別に、オブジェクトを原寸で描画する `ObjectRenderer` が必要である。

---

# 3. ObjectRenderer の責務

## 3.1 責務に含めるもの

`ObjectRenderer` が担当するもの。

```text
- objectPlacement定義の読み込み
- asset_idから画像取得
- width / height原寸描画
- anchor_x / anchor_yによる配置
- scene内objectの表示・非表示
- z-order / y-sortによる描画順決定
- collision box定義との接続
- interactable_idとの接続
- scene切替時の描画対象更新
- 画像preload完了後の描画保証
```

## 3.2 責務に含めないもの

`ObjectRenderer` が直接担当しないもの。

```text
- 画像ファイルの存在確認そのもの
- manifestの完全性検証
- 白縁・透明縁の品質判定
- プレイヤー移動処理
- 実際のcollision判定
- 会話・通知・イベント分岐
```

これらは以下に分離する。

```text
画像・定義検証:
  AssetValidator

collision判定:
  CollisionManager または SceneManager側のcollision layer

interactable判定:
  InteractableResolver / InteractionManager

イベント効果:
  EffectRunner

scene遷移:
  SceneTransitionManager
```

---

# 4. 描画レイヤー方針

今後の描画責務は以下のように分ける。

```text
ground layer:
  TileMapRenderer
  完全不透明な地面・床・道

decoration floor layer:
  TileMapRenderer または ObjectRenderer
  草、小石、苔、床の欠けなど

object layer:
  ObjectRenderer
  井戸、家具、扉、棚、壁上物など

sprite layer:
  SpriteRenderer または既存Renderer
  コルパン、ランド、NPC

object upper layer:
  ObjectRenderer
  キャラクターより手前に出る高い家具・屋根・柱など

ui layer:
  UIManager
  会話、通知、メニュー、操作ボタン
```

---

# 5. z-order / y-sort 方針

## 5.1 基本方針

トップダウンRPGでは、キャラクターとオブジェクトの重なり順が自然であることが重要である。

基本方針:

```text
描画順 = layer_priority + y_sort
```

具体的には、

```text
ground:
  0

decoration_floor:
  10

object_low:
  30

character:
  50 + y

object_y_sort:
  50 + anchor_world_y

object_high:
  80

ui:
  1000
```

## 5.2 y-sort対象

以下は y-sort 対象にする。

```text
井戸
棚
机
椅子
ベッド
壺
箱
NPCと重なりうる家具
```

## 5.3 y-sort対象外

以下は固定z-orderでよい。

```text
ground
床の小石
草の房
影
扉のハイライト
UI
```

## 5.4 z_order明示

最終的にはasset定義またはplacement定義に `z_order` を持たせる。

例:

```json
{
  "id": "well_village_01",
  "asset_id": "obj_well",
  "x": 8,
  "y": 12,
  "z_order": "y_sort"
}
```

または数値:

```json
{
  "z_order": 55
}
```

---

# 6. anchor 方針

## 6.1 anchorの意味

anchorは、オブジェクトをタイル座標に配置するときの基準点である。

基本は、

```text
anchor_x = 横中央
anchor_y = 下端
```

とする。

理由:

```text
トップダウンRPGでは、足元・接地点が位置基準として自然だから。
```

## 6.2 例

```text
16×16:
  anchor_x = 8
  anchor_y = 15

32×32:
  anchor_x = 16
  anchor_y = 31

16×24:
  anchor_x = 8
  anchor_y = 23

32×20:
  anchor_x = 16
  anchor_y = 19
```

## 6.3 描画座標

tile座標をpixelに変換した後、anchorを引いて描画する。

```text
world_x = tile_x * tileSize
world_y = tile_y * tileSize

draw_x = world_x - anchor_x
draw_y = world_y - anchor_y
```

ただし、タイル中央基準にする場合は以下。

```text
world_x = tile_x * tileSize + tileSize / 2
world_y = tile_y * tileSize + tileSize - 1
```

本プロジェクトでは、**足元下端基準**を推奨する。

---

# 7. object placement 定義

## 7.1 基本形式

sceneごとにobject placementを持つ。

候補ファイル:

```text
src/game/objects/colpan_house.objects.json
src/game/objects/village_center.objects.json
src/game/objects/rulgar_house.objects.json
```

または、tilemap JSON内に `objects` を持たせる。

推奨は、まず **scene別object JSON** とする。  
理由は、tilemapと大型objectの責務を分離できるため。

## 7.2 object placement例

```json
{
  "sceneId": "village_center",
  "objects": [
    {
      "id": "village_well_01",
      "asset_id": "5",
      "semantic_name": "well_body",
      "x": 8,
      "y": 13,
      "visible": true,
      "z_order": "y_sort",
      "collision": {
        "enabled": true,
        "shape": "rect",
        "tiles": [[7, 12], [8, 12], [7, 13], [8, 13]]
      },
      "interactable_id": "village_well"
    }
  ]
}
```

## 7.3 required fields

object placement の必須項目:

```text
id
asset_id
x
y
visible
z_order
```

推奨項目:

```text
semantic_name
collision
interactable_id
condition
state
notes
```

---

# 8. Asset Definition との関係

`ObjectRenderer` は `object_decoration.clean.v1.json` を参照する。

現在の定義例:

```json
{
  "asset_id": "5",
  "path": "assets/objects/clean_v1/obj_well.png",
  "semantic_name": "well_body",
  "layer_type": "object",
  "collision": true,
  "width": 32,
  "height": 32,
  "anchor_x": 16,
  "anchor_y": 31,
  "edge_policy": "transparent_clean_edge",
  "resize_rule": "do_not_resize"
}
```

`ObjectRenderer` は以下を必ず使う。

```text
path
width
height
anchor_x
anchor_y
layer_type
semantic_name
```

以下は直接描画には必須ではないが、警告・連携で使う。

```text
collision
edge_policy
resize_rule
notes
```

---

# 9. 表示遅延を避けるための方針

## 9.1 基本方針

ユーザーが画面に入った後にオブジェクトが遅れて表示されることは避ける。

したがって、

```text
scene表示前に、そのsceneで必要なobject画像をpreloadする
```

ことを必須方針とする。

## 9.2 preload段階

以下の2段階を用意する。

### boot preload

起動直後に必要な最小アセットを読み込む。

```text
開始sceneのground
開始sceneのtilemap
開始sceneのobjects
player sprites
companion sprites
基本UI
```

### scene preload

scene遷移前に次sceneのアセットを読み込む。

```text
target scene tilemap
target scene object placements
target scene object images
target scene npc sprites
```

## 9.3 preloadとscene transition

scene遷移処理は以下の順にする。

```text
1. transition開始
2. UIState = transition
3. loading mini overlay または fade
4. target scene asset preload
5. scene切替
6. actors配置
7. 描画
8. UIState = exploration
```

v4.0-eでは、まず以下まででよい。

```text
target scene object images を scene切替前に読み込める構造
```

fade演出は後回し。

## 9.4 キャッシュ

AssetLoaderの既存cacheを利用する。

必要方針:

```text
同じpathの画像は二重ロードしない
scene切替時に毎回fetchしない
loadImageはPromiseをcacheする
ObjectRendererは画像を直接fetchしない
AssetLoader経由に統一する
```

## 9.5 遅延発生時の対策

万一preloadが間に合わない場合でも、以下を避ける。

```text
何も表示されない
画面が白い
キャラクターだけ表示される
objectが後からパッと出る
```

対策候補:

```text
scene切替をpreload完了まで待つ
ロード中表示を出す
fade中に読み込む
placeholderは開発時のみ表示
```

本プロジェクトでは、**本番表示でplaceholderを出すより、preload完了までtransitionを待つ** 方がよい。

---

# 10. ObjectRenderer と AssetValidator の連携

v4.0-dで `AssetValidator` を追加済み。  
v4.0-eでは、ObjectRenderer実装に合わせて、以下を検証対象に追加する。

```text
object placement の asset_id が存在するか
placement の x / y が定義されているか
placement の z_order が定義されているか
placement の collision と asset collision に矛盾がないか
interactable_id が存在する場合、scene interactables と対応しているか
ObjectRenderer対象assetの width / height が画像実寸と一致するか
anchor が画像範囲内か
```

## 10.1 collision矛盾例

```text
asset collision = true
placement collision 未定義
```

→ warning

```text
asset collision = false
placement collision enabled = true
```

→ warning

```text
interactable_idあり
collisionなし
```

→ warning。ただし調べられる床模様などは許容。

---

# 11. ObjectRenderer と Interactable の関係

オブジェクトと調べる対象は密接に関係する。

例:

```text
井戸画像:
  asset_id = obj_well
  placement id = village_well_01
  interactable_id = village_well

interactable:
  id = village_well
  kind = notice
  text = 井戸の水は冷たい。
```

将来的には、interactableのtilesを手で書くのではなく、object placementから自動生成できるようにする。

ただし v4.0-e では、まず以下までにする。

```text
placement.interactable_id と scene interactables の対応検証
```

自動生成は次段階でよい。

---

# 12. collision との関係

## 12.1 collisionをどこで持つか

collisionは以下の2層で考える。

```text
asset collision:
  その素材が基本的に通行不可かどうか

placement collision:
  その配置で実際にどの範囲を塞ぐか
```

例:

```text
asset:
  井戸は基本collision=true

placement:
  井戸の足元2×2タイルを塞ぐ
```

## 12.2 collision_shape

将来的には以下を許容する。

```text
rect
tiles
polygon
none
```

v4.0-eでは以下で十分。

```text
tiles
rect
```

## 12.3 collision mapへの反映

v4.0-eでは、描画を優先する。  
collision mapへの完全統合は、次段階でもよい。

ただし、collision定義を無視する設計にはしない。

---

# 13. scene別object配置の初期対象

v4.0-eで最初に扱う候補。

## 13.1 village_center

```text
井戸
小石
草の房
影
木箱
樽
```

最優先:

```text
井戸
```

理由:

```text
既に「井戸を調べる」導線があるため、object / interactable / collision の連携検証に向いている。
```

## 13.2 colpan_house

```text
ベッド
机
椅子
棚
かまど
収納箱
母のメモ位置
```

最優先:

```text
母のメモ位置
棚
机
```

理由:

```text
母のメモと大事なもの導線の確認に関係するため。
```

## 13.3 rulgar_house

現時点では未解放扱い。  
ObjectRendererの検証対象にしてもよいが、プレイヤーが入れる導線とは切り離す。

---

# 14. 初期実装の安全範囲

v4.0-eでやること。

```text
ObjectRenderer.js 追加
scene別object placement JSON追加
objectPlacementLoader基礎追加
ObjectRendererにpreloadSceneObjects(sceneId)を持たせる
ObjectRendererにrenderSceneObjects(sceneId, context)を持たせる
village_centerの井戸をObjectRenderer対象にする
既存tilemapの井戸表現と重複する場合は、どちらかを非表示または整理する
AssetValidatorにobject placement検証を追加
```

v4.0-eでまだやらないこと。

```text
全家具の完全配置
全objectのcollision統合
object由来interactable自動生成
fade演出
object animation
状態差し替え
破壊可能object
```

---

# 15. ObjectRenderer API案

```js
class ObjectRenderer {
  constructor({ assetLoader, objectAssetData, tileSize }) {}

  async preloadSceneObjects(sceneId, placements) {}

  renderSceneObjects(ctx, sceneId, placements, camera = { x: 0, y: 0 }) {}

  getRenderableObjects(sceneId, placements) {}

  sortByZOrder(objects) {}

  resolveAsset(assetId) {}

  getDrawRect(object, asset) {}
}
```

## 15.1 preloadSceneObjects

```js
async preloadSceneObjects(sceneId, placements) {
  const objects = placements[sceneId] || [];
  const paths = objects.map(obj => this.resolveAsset(obj.asset_id).path);
  await this.assetLoader.loadImageList(paths);
}
```

## 15.2 renderSceneObjects

```js
renderSceneObjects(ctx, sceneId, placements) {
  const objects = this.getRenderableObjects(sceneId, placements);
  const sorted = this.sortByZOrder(objects);

  for (const object of sorted) {
    const asset = this.resolveAsset(object.asset_id);
    const image = this.assetLoader.getCachedImage(asset.path);
    const rect = this.getDrawRect(object, asset);
    ctx.drawImage(image, rect.x, rect.y, asset.width, asset.height);
  }
}
```

`getCachedImage` が今のAssetLoaderにない場合は追加する。

---

# 16. AssetLoader側に必要な追加

現在のAssetLoaderは `loadImage(path)` でPromiseを返し、cacheする。  
ObjectRendererでは、描画時に毎回awaitできないため、同期的に取得できる手段が必要。

追加候補:

```js
getCachedImage(path) {
  const entry = this.resolvedImages.get(path);
  return entry || null;
}
```

ただし、既存cacheがPromiseのみなら、次のように拡張する。

```text
imagePromiseCache
imageCache
```

方針:

```text
preload時:
  await loadImage(path)
  imageCacheにHTMLImageElementを保存

描画時:
  getImage(path)
  なければ描画しない。ただし本来preload済みなのでmissing扱い。
```

---

# 17. 描画遅延対策の受け入れ条件

v4.0-eの受け入れ条件。

```text
scene表示時にObjectRenderer対象objectが遅れて表示されない
ObjectRenderer対象画像はscene表示前にpreloadされる
描画時にawaitしない
同じ画像を二重fetchしない
missing assetはAssetValidatorで検出される
井戸などの大型objectが原寸で表示される
キャラクターとの重なり順が破綻しない
```

---

# 18. グラフィック担当との認識齟齬を防ぐための追加確認事項

v4.0-e実装前に、グラフィック担当へ以下を確認するとよい。

```text
1. z_order の推奨値を素材側で持たせるか、実装側placementで持つか
2. collision_box を素材側で持たせるか、配置側で持つか
3. anchor_x / anchor_y は現在のmanifest値で正式採用してよいか
4. objectの影は画像に含めるか、decorationとして分離するか
5. 扉などsceneTransition対象objectはcollision=trueでよいか
6. 家具の前後関係をy-sortで扱ってよいか
7. 32×20など半端な高さの家具は下端anchorでよいか
```

ただし、実装を止めないため、初期値は以下で進めてよい。

```text
z_order:
  placement側で持つ

collision_box:
  placement側で持つ

anchor:
  現manifest値を採用

影:
  既存素材に含まれる場合はそのまま
  将来はdecoration分離を検討

sceneTransition対象扉:
  collision=true
  interactable連動あり

家具:
  y-sort対象

半端サイズ:
  下端anchor
```

---

# 19. v4.0-e 実装依頼文案

次回の実装依頼には以下を使う。

```text
あなたは『待宵物語』のシステムエンジニア兼実装担当です。

添付の最新zipと、ObjectRenderer仕様検討書を読み、v4.0-e ObjectRenderer を実装してください。

重視する品質:
- 安定性
- 保守性
- 柔軟性
- 拡張性
- 表示遅延の防止
- グラフィック担当との認識齟齬防止

今回実装すること:
- ObjectRenderer.js を追加する
- scene別object placement JSONを追加する
- AssetLoaderにpreload後の画像を同期取得できる仕組みを追加する
- ObjectRendererにpreloadSceneObjectsを実装する
- ObjectRendererにrenderSceneObjectsを実装する
- scene表示前に対象sceneのobject画像をpreloadする
- village_centerの井戸をObjectRenderer対象にする
- AssetValidatorにobject placement検証を追加する
- docsにObjectRenderer実装報告を追加する

今回やらないこと:
- 全家具の完全配置
- 全object collision統合
- object由来interactable自動生成
- fade演出
- object animation
- 戦闘
- Single File版作成

必ず守ること:
- 描画時にawaitしない
- scene表示後にobjectが遅れて出る状態を避ける
- 既存の開始導線を壊さない
- 母のメモ、村への移動、コルパン家への戻りを維持する
- 画像を勝手に加工・リサイズしない
- 正式ファイル構成zipのみ出力する
```

---

# 20. 最終判断

ObjectRendererは、第一章の今後の品質に大きく影響する。

特に以下の点で重要である。

```text
家具・井戸・扉・棚などの見た目
キャラクターとの重なり
collisionとの一致
interactableとの一致
scene遷移時の表示安定性
グラフィック担当との定義共有
```

したがって、v4.0-eでは「とりあえず描く」ではなく、**preload / anchor / z-order / placement / validator連携** を含めて実装するべきである。

