# v4.0-h.2 Renderer Object Draw Fix 実装報告

## Playwright報告で発見された問題

v4.0-h.1ではゲーム起動・会話・選択肢・メニューは動作したが、consoleに以下が毎フレーム出力されていた。

```text
[Renderer] Object rendering failed: TypeError: this.drawSceneObjects is not a function
```

## 原因

`Renderer.draw()` が `this.drawSceneObjects()` を呼んでいたが、`Renderer` クラス内に `drawSceneObjects()` メソッド定義がなかった。

## 修正内容

```text
src/engine/Renderer.js に drawSceneObjects() を追加
ObjectRendererが未接続の場合は何もしない
ObjectRenderer描画エラーは初回のみconsole.errorに出す
index.html に data URI favicon を追加し、favicon 404 を抑制
index / main / data / debug表示を v4.0-h.2 に更新
```

## 404について

アプリ定義内の主要アセットパスを静的確認した結果、欠落は以下。

```text
主要アセット定義内の欠落パスなし
```

Playwright報告の404がfavicon由来である可能性があるため、`index.html` に以下を追加した。

```html
<link rel="icon" href="data:,">
```

## 確認ポイント

```text
左上が v4.0-h.2 RenderFix になる
consoleに this.drawSceneObjects is not a function が出ない
favicon 404 が出ない、または少なくともアプリ定義アセットの404がない
起動・会話・選択肢・メニューがv4.0-h.1同様に動く
```
