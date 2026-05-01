# v4.0-g.8 Loading Fix / Choice Overlay Method Restore 実装報告

## 症状

ロード中と表示されたまま、画面が変わらなかった。

## 原因

v4.0-g.7で、`UIManager` constructor が以下を呼んでいた。

```js
this.choiceOverlay = this.ensureChoiceOverlay();
```

しかし実際の `UIManager.js` には `ensureChoiceOverlay()` メソッドが存在しなかった。  
そのため `new Game()` の時点で例外が出て、`BootManager.runStep(() => game.boot())` に入る前に停止していた。

結果として `BootManager.fail()` も呼ばれず、ロード画面が残り続けていた。

## 修正内容

```text
UIManager.ensureChoiceOverlay() を追加
main.jsで Game constructor を try/catch し、初期化例外も BootManager.fail へ渡す
AssetLoaderにJSON / 画像読み込みtimeoutを追加
index / main / data / debug表示を v4.0-g.8 に更新
```

## 追加安全策

```text
JSON fetch timeout: 12000ms
image load timeout: 12000ms
```

これにより、画像読み込み待ちなどで永久にロード画面が残る可能性を減らす。

## 確認ポイント

```text
左上が v4.0-g.8 LoadFix になる
ロード中からゲーム画面へ進む
初期化例外が起きた場合は赤いエラー表示になる
選択肢は独立したchoice-overlayに出る
```
