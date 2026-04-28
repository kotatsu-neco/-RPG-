# グラフィック部門 追加対応報告
## object / decoration の白縁対策済み素材 v1

実装部門のv3.4.3診断結果を受け、ground再設計に続き、object / decoration 側の初回クリーン素材を作成しました。

## 対応方針
- object / decoration は透明あり
- ただし白縁なし
- 背景色由来の半透明ピクセルなし
- アンチエイリアスなし
- `edge_policy = transparent_clean_edge`
- `resize_rule = do_not_resize`

## 今回の対象
- 家屋
- 壁
- 屋根
- 扉
- 窓
- 井戸
- 家具
- 棚
- 机
- 椅子
- ベッド
- かまど
- 郵便束
- 母のメモ位置
- 樽
- 木箱
- 小石、草、影、苔、道端欠け

## 実装側へのお願い
- ground layer には置かないでください
- object / decoration layer に分けて配置してください
- 透明素材ですが、半透明白縁は含めていません
- crop / resize は避けてください
- 当たり判定は manifest の collision を初期値とし、必要に応じて collision layer で調整してください
