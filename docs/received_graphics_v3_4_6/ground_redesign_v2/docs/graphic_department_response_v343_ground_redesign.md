# 『待宵物語』グラフィック部門からの正式回答
## v3.4.3フラットground診断結果を受けた背景タイル再設計について

**宛先**: 実装部門  
**日付**: 2026-04-24  
**担当**: グラフィック部門

---

## 1. 診断結果への回答

v3.4.1〜v3.4.3の実機確認結果を確認しました。  
グラフィック部門として、実装部門の以下の判断を正式に受け入れます。

> 白い格子状表示・地面のガビガビ感については、エンジン本体ではなく、groundタイル素材の視覚設計に起因する可能性が高い。

特に、v3.4.3でフラットgroundへ差し替えた結果、groundの継ぎ目が消えたことは重要です。  
これは、groundタイルが「1枚の小さな絵」として主張しすぎていたこと、またはタイル外周・質感・明度差が敷き詰め時に境界として見えていたことを示しています。

---

## 2. 今後の正式方針

groundタイルは、今後以下の方針で再設計します。

- 外周に線を入れない
- 外周1pxに明るい縁を入れない
- 隣接タイルと自然につながる
- 1枚単体で目立たせない
- 高コントラストな模様を避ける
- 質感はかなり弱くする
- 地面の情報量は decoration へ逃がす
- ground は「面」を作る素材として扱う

この方針は、今後のグラフィック部門の正式ルールとします。

---

## 3. 優先度A対応

今回、優先度Aとして以下のgroundタイルを再設計しました。

- grass
- grass_dark
- dirt_path
- stone_path
- interior_floor_wood
- interior_floor_stone

すべて以下の仕様に統一しています。

```text
サイズ: 16×16
alpha: 全ピクセル255
resize_rule: do_not_resize
edge_policy: no_visible_border
layer_type: ground
opaque: true
collision: false
```

---

## 4. 実装側への運用指示

今回のv2 groundタイルについては、以下の運用でお願いします。

- cropしない
- resizeしない
- 外周補正しない
- ground layerにのみ配置する
- object / decorationと混在させない
- 拡大表示が必要な場合のみ nearest neighbor を使う

道の縁取り、草の細かい表情、小石、苔、影、欠けなどは、今後 decoration layer 用素材として追加する方針です。

---

## 5. object / decoration の白縁対策

v3.4.3でgroundの継ぎ目が消えた一方、object / decoration 側には白縁や背景色由来の残りが見える可能性があります。  
グラフィック部門として、次段階では以下を確認・再整備対象とします。

- 家屋
- 壁
- 屋根
- 井戸
- 家具
- 棚
- 机
- 椅子
- 手紙の束
- 小物

object / decoration は透明ありで問題ありませんが、以下を禁止します。

- 白背景前提のアンチエイリアス
- シート背景由来の白・灰色の縁
- 不要な透明余白
- 配置基準の不統一

---

## 6. manifest列について

今後のmanifestには、実装部門の要望通り以下の列を維持します。

```csv
tile_id,filename,semantic_name,category,layer_type,opaque,collision,width,height,alpha_rule,resize_rule,edge_policy,notes
```

`edge_policy` は以下を基本にします。

- no_visible_border
- transparent_clean_edge
- debug_only
- not_for_ground

---

## 7. 今後の制作順

グラフィック部門としては、次の順で進めます。

1. 優先度A groundタイル再設計
2. 実機確認結果の受領
3. 必要に応じて ground v2.1 修正
4. object / decoration の白縁除去
5. decoration 素材追加
6. 建物・家具・小物の切り出し精度向上

---

## 8. 結論

実装部門の v3.4.3 診断結果は妥当です。  
エンジン再設計は不要で、groundタイルの美術方針を再設計する方向で進めます。  

今回、優先度Aの正式groundタイル v2 を同梱しました。  
まずはこのv2 groundタイルで実機確認をお願いします。

以上です。
