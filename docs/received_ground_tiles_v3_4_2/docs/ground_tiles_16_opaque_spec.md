# 『待宵物語』groundタイル 16×16完全不透明版 v1

## 目的
v3.4.1実機確認で発生した白い格子状表示を避けるため、ground layer 用タイルを再整備した。

## 正式ルール
- ground layer 用タイルは 16×16 px 固定
- 全ピクセル alpha=255
- 外周1pxにも透明・白罫線・背景色由来の縁を入れない
- 実装側では再リサイズしない
- canvas / CSS 側で拡大する場合は nearest neighbor
- object / decoration とは分離して配置する

## 同梱内容
- `ground_tiles_16/`
  - 16×16完全不透明 ground タイルPNG
- `ground_tiles_16_opaque_manifest.csv`
  - semantic name / layer_type / opaque / collision 付き manifest
- `docs/alpha_edge_verification.csv`
  - alpha と外周チェック結果
- `preview/ground_tiles_16_opaque_preview_x4.png`
  - 4倍表示プレビュー
- `preview/ground_tiles_no_grid_test_map_1x.png`
  - 敷き詰めテスト用 1倍画像
- `preview/ground_tiles_no_grid_test_map_x4.png`
  - 敷き詰めテスト用 4倍画像

## 実装側への注意
このセットに含まれるPNGは、すべて ground layer 用である。  
透明を前提にした object / decoration 用素材とは混在させないこと。

## リサイズについて
このタイルはすでに 16×16 で完成している。  
実装側で crop / resize / 外周補正を行わないこと。  
画面拡大時のみ nearest neighbor を使う。

## collision
このセットは ground layer 用なので、collision は原則 false。  
通行不可制御は object layer または collision layer で行うこと。

## 備考
transition 系タイルも ground として扱う。  
ただし、必要に応じてマップエディタ側で回転・反転運用を検討してよい。
