# groundタイル再設計 v2 仕様書

## 目的
v3.4.3フラットground診断結果を受け、白い格子状表示とガビガビ感を避けるため、ground layer用タイルを再設計した。

## 仕様
- サイズ: 16×16
- alpha: 全ピクセル255
- resize_rule: do_not_resize
- edge_policy: no_visible_border
- layer_type: ground
- opaque: true
- collision: false

## 美術方針
- groundは「小さな絵」ではなく「面」
- 外周には線も明るい縁も置かない
- タイル単体の情報量を抑える
- 質感は最小限
- 小石、草、苔、影、欠けはdecorationへ移す

## 同梱タイル
- grass
- grass_dark
- dirt_path
- stone_path
- interior_floor_wood
- interior_floor_stone

## 実装注意
- crop禁止
- resize禁止
- 外周補正禁止
- ground layer専用
- nearest neighbor以外の拡大補間は禁止
