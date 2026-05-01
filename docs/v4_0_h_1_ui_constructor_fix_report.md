# v4.0-h.1 UIManager Constructor Fix 実装報告

## Playwright確認結果から判明した問題

v4.0-h は、Playwright確認で以下のエラーにより起動不能だった。

```text
this.ensureChoiceOverlay is not a function
```

## 原因

`UIManager` constructor で以下を呼んでいた。

```js
this.choiceOverlay = this.ensureChoiceOverlay();
```

しかし `ensureChoiceOverlay()` のメソッド定義が `UIManager.js` に存在していなかった。

## なぜ静的検査で見逃したか

検査条件が不適切だった。

```text
誤:
  "ensureChoiceOverlay()" in UIManager.js

問題:
  this.ensureChoiceOverlay(); の呼び出しにも一致してしまう
```

今後は、メソッド定義確認には以下のような正規表現を使う。

```text
^  ensureChoiceOverlay\(\) \{
```

## 修正内容

```text
UIManager.ensureChoiceOverlay() を追加
index / main / data / debug表示を v4.0-h.1 へ更新
docsに修正報告を追加
```

## 確認ポイント

```text
左上が v4.0-h.1 UIInitFix になる
ロード中で止まらない
BootManagerのゲーム初期化エラーが出ない
#choice-overlay が生成される
次にPlaywright再確認を行う
```
