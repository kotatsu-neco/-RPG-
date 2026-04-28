# v4.0-g.3 Blackout Fix / ObjectRenderer Safety 実装報告

## 症状

ゲーム起動後、データ読み込み後に画面がブラックアウトした。

## 原因

`Renderer.draw()` が `this.drawSceneObjects()` を呼んでいるが、`Renderer.js` に `drawSceneObjects()` メソッドが存在していなかった。

```js
draw() {
  this.drawBaseMap();
  this.drawObjects();
  this.drawSceneObjects(); // TypeError
  this.drawCharacters();
}
```

このTypeErrorにより初回描画ループが停止し、ロード後に黒背景だけが残ったと考えられる。

また、`ObjectRenderer.renderSceneObjects()` でも、`getRenderableObjects()` が返す `{ object, asset }` 形式のentryを正しく取り出していなかった。

## 修正内容

```text
Renderer.js に drawSceneObjects() を復元
Renderer.draw() 内の object rendering を try/catch で保護
ObjectRenderer.renderSceneObjects() の entry 処理を修正
index / main / data / debug表示を v4.0-g.3 に更新
```

## 方針

ObjectRendererで例外が出ても、base map と characters の描画まで止めない。  
大型object描画は重要だが、それが失敗してゲーム全体が黒画面になる状態は避ける。

## 確認ポイント

```text
左上が v4.0-g.3 BlackoutFix になる
ロード後に黒画面で止まらない
背景マップが表示される
コルパン・ランドが表示される
ObjectRenderer対象objectが表示される、または失敗してもゲーム全体は止まらない
```
