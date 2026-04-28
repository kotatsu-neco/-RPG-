# グラフィック担当向け アセット受け渡し仕様  
## v4.0-d Asset Definition Handoff Spec

## 目的

グラフィック担当と実装担当の認識齟齬を防ぎ、ゲーム性・美観・没入感に影響する定義漏れを避ける。

アセットは単なるPNGではなく、ゲーム内での振る舞いを持つ定義体として扱う。

---

## 1. 共通必須項目

すべてのアセットについて、以下をmanifestまたはJSONで明示する。

```text
asset_id
filename
semantic_name
category
layer_type
collision
width
height
anchor_x
anchor_y
edge_policy
resize_rule
notes
```

可能なら以下も追加する。

```text
z_order
interactable_id
collision_shape
collision_box
placement_rule
alpha_rule
opaque
```

---

## 2. layer_type

指定可能値:

```text
ground
object
decoration
sprite
ui
```

### ground

```text
完全不透明
16×16
do_not_resize
no_visible_border
collision原則false
```

### object

```text
透明可
白縁不可
collisionを必ず明示
anchor必須
z_order推奨
```

### decoration

```text
透明可
白縁不可
collision原則false
ただし障害物になる場合はtrue
```

### sprite

```text
方向
フレーム番号
原点
当たり判定
表示基準
```

### ui

```text
9-slice可否
stretch可否
safe-area考慮
```

---

## 3. collision

collisionはゲーム性に直結するため必ず明示する。

```text
true:
  プレイヤーが通れない、または接触判定を持つ

false:
  通過可能、または見た目だけ
```

曖昧な場合は `notes` に理由を書く。

例:

```text
井戸: true
机: true
椅子: true
小石: false
草の房: false
扉: true。ただしsceneTransitionの対象
```

---

## 4. anchor

anchorは描画位置とz-orderに影響するため必須。

基本:

```text
anchor_x: 横中央
anchor_y: 下端
```

例:

```text
16×16: anchor_x=8, anchor_y=15
32×32: anchor_x=16, anchor_y=31
16×24: anchor_x=8, anchor_y=23
```

---

## 5. edge_policy

指定可能値例:

```text
no_visible_border
transparent_clean_edge
debug_only
not_for_ground
needs_cleanup
```

### ground

必ず:

```text
no_visible_border
```

### object / decoration

原則:

```text
transparent_clean_edge
```

白背景由来の半透明縁は禁止。

---

## 6. resize_rule

原則:

```text
do_not_resize
```

実装側で勝手にcrop / resize / border補正しない。  
必要な場合はグラフィック担当側で再出力する。

---

## 7. z_order

今後のObjectRendererではz_orderを扱う予定。

推奨例:

```text
ground: 0
decoration_floor: 10
object_low: 30
character: 50
object_high: 70
ui: 1000
```

---

## 8. interactable連動

調べられる・入れる・話せる対象は、アセット側にも関連IDを持たせることを推奨する。

例:

```text
asset_id: obj_well
interactable_id: village_well
semantic_name: well_body
collision: true
```

---

## 9. 納品時チェック

納品前に確認してほしいこと。

```text
画像サイズとmanifestのwidth/heightが一致している
collisionが空欄ではない
layer_typeが空欄ではない
semantic_nameが空欄ではない
anchor_x / anchor_yが空欄ではない
白縁がない
groundは完全不透明
groundに透明ピクセルがない
resize_ruleがdo_not_resize
edge_policyが明記されている
```

---

## 10. 実装側検証

実装側では `AssetValidator` で以下を確認する。

```text
ファイル存在
JSON読み込み
tile id未定義
sprite frame不足
object定義不足
collision不足
layer_type不足
semantic_name不足
anchor不足
edge_policy不足
resize_rule不足
```

以上。
