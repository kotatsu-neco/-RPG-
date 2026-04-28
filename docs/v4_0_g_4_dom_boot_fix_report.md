# v4.0-g.4 DOM Boot Structure Fix 実装報告

## 症状

ロード中表示から「準備ができました」になった瞬間に画面が落ちる／ブラックアウトする。  
ロード中表示もずれて見える。

## 根本原因

`index.html` の `loading-overlay` の閉じタグが欠落しており、`main#app` 全体が `loading-overlay` の中に入っていた。

そのため、BootManagerがロード完了後に以下を行った瞬間、

```js
loadingOverlay.classList.add("hidden", "complete")
```

ゲーム本体 `main#app` も一緒に不可視化されていた。

## 修正内容

```text
index.html のDOM構造を再構築
main#app と loading-overlay を兄弟要素に修正
hud-info を game-shell 内に配置
BootManager に DOM構造チェックを追加
BootManager.complete後は overlay を display:none にする
Renderer.draw全体をtry/catchで保護
描画例外時は黒画面ではなく診断fallbackを描画
CSSにDOM boot fix用の最終補正を追加
```

## 修正後の構造

```html
<body>
  <main id="app">...</main>
  <div id="loading-overlay">...</div>
  <script type="module" src="src/main.js?v=4.0-g.4"></script>
</body>
```

## 確認ポイント

```text
ロード中表示が中央寄りに表示される
「準備ができました」の後にゲーム画面が消えない
左上が v4.0-g.4 DOMFix になる
背景・コルパン・ランドが表示される
描画エラーが起きても完全な黒画面ではなく診断fallbackが出る
```
