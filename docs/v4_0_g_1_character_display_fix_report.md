# v4.0-g.1 Character Display / Cache Bust Fix 実装報告

## 修正目的

v4.0-gで「キャラクターが表示されないかもしれない」という指摘を受け、プログラムを確認した。

## 確認結果

`index.html` に古い参照が残っていた。

```html
<link rel="stylesheet" href="src/style.css?v=3.0">
<script type="module" src="src/main.js?v=3.0"></script>
```

iPhone Safariではキャッシュの影響が強いため、古いJS/CSSが読まれる可能性がある。

## 修正内容

```text
index.html の title / aria-label / CSS query / JS query を v4.0-g.1 へ更新
debug表示を v4.0-g.1 Character へ更新
Rendererのキャラクター画像選択を堅牢化
方向別spriteが取れない場合は基本spriteへfallback
画像が空の場合はfallback character描画へ落とす
Game.jsのframe moduloを0除算しないよう補強
CSSの contain:size を外し、mobile Safariでの予期しないサイズ挙動を避ける
```

## 確認ポイント

```text
左上が v4.0-g.1 Character になる
iPhone Safariで古いv3.0参照が残らない
コルパンが表示される
ランドが表示される
NPCが表示される
画像読み込みに失敗しても最低限fallback形状が表示される
```
