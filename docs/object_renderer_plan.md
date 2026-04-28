# ObjectRenderer 導入計画

`matsuyoi_object_decoration_clean_v1` には、16x16ではない素材が含まれる。これらはTileMapRendererの16x16グリッド描画に無理に入れず、ObjectRendererで扱う。

## 必要機能

- asset_idから画像取得
- width / heightの原寸描画
- anchor_x / anchor_y対応
- collision box
- interactableとの連動
- z-order制御
