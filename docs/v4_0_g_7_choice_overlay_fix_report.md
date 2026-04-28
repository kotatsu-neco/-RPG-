# v4.0-g.7 Detached Choice Overlay Fix 実装報告

## 問題

v4.0-g.6でも選択肢が1件しか見えなかった。

## 判断

会話ウィンドウ内の `#choice-box` を広げる方式では、親要素の高さ制約、overflow、iPhone Safariの実描画に負けている。  
そのため、選択肢を会話ウィンドウ内に置く設計をやめる。

## 新方式

```text
会話本文:
  #dialog-window

選択肢:
  #choice-overlay
  game-shell直下に動的生成
```

## 修正内容

```text
UIManagerにensureChoiceOverlay()を追加
showChoices()で#choice-overlayへ選択肢buttonを生成
inline #choice-box はchoice modeでは非表示
syncChoiceSelection()は#choice-overlay内の選択肢を同期
選択中choiceはscrollIntoViewで可視化
CSSで.choice-overlayを操作UI上部に独立配置
```

## 利点

```text
dialog-windowのoverflow制約を受けない
選択肢表示領域を独立管理できる
直接タップで選択できる
上下キー・選ぶボタンの既存ロジックを維持できる
```

## 確認ポイント

```text
左上が v4.0-g.7 ChoiceOverlay になる
「わかりました」と「もう一度聞く」が独立した選択肢パネルに表示される
上下キーで選択が移動する
選ぶボタンで選択できる
選択肢を直接タップできる
```
