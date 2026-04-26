# v3.4.3 フラットgroundタイル診断版

## 目的

v3.4.2でも白い格子状表示が残ったため、問題がエンジン由来かgroundタイル素材由来かを切り分ける。

## 方針

ground layer を、外周線を持たない診断用フラットタイルへ差し替える。

```text
ground: ground16_flat_diagnostic
objects: 既存素材を維持
decoration: 既存素材を維持
```

## 診断結果の見方

### groundの格子が消える場合

原因は groundタイル素材の美術設計・外周・質感・境界感にある。

次にやるべきこと:

- groundタイルを「面」として再設計
- 外周に線を入れない
- 質感を弱める
- 情報量はdecorationへ逃がす

### groundの格子が残る場合

原因は素材ではなく、描画スケーリング・canvas配置・CSS・tile描画座標にある可能性が高い。

次にやるべきこと:

- canvasのCSS scaling確認
- drawImageの座標整数化
- image-rendering確認
- Safariでのサブピクセル表示確認

## 注意

この版は診断用であり、美術完成版ではない。
