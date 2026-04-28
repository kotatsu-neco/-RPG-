# object / decoration 白縁対策済みクリーン素材 v1

## 目的
v3.4.3診断結果を受け、groundとは別に object / decoration 側の白縁・背景色由来ピクセルを避けるための初回実装素材を作成した。

## 基本仕様
- layer_type: object または decoration
- 透明あり
- ただし半透明ピクセルなし
- 白背景前提のアンチエイリアスなし
- edge_policy: transparent_clean_edge
- resize_rule: do_not_resize

## 同梱カテゴリ
- 家屋関連: stone_wall, roof, door, window
- 村設備: well
- 家具: table, chair, shelf, bed, stove, cabinet
- 郵便/物語: mail_bundle, memo_spot
- 小物: barrel, crate
- decoration: grass_tuft, pebbles, shadow_soft, moss_patch, path_chip

## 実装注意
- ground layer に置かない
- object / decoration layer に配置する
- 必要に応じて collision layer で通行判定を上書きする
- 16×16を超える素材は複数タイルオブジェクトとして扱う
