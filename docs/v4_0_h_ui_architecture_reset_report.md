# v4.0-h UI Architecture Reset 実装報告

## 実装理由

v4.0-g系で、会話ウィンドウ・選択肢・操作UIの不具合修正を重ねた結果、CSSの重複と責務混在が発生した。

これは、安定性・保守性・柔軟性・拡張性を損なうため、構造ごと整理した。

## 実装内容

```text
style.cssを整理版へ置き換え
UIレイヤーを明確化
dialog-layerを会話本文専用化
choice-overlayを選択肢専用化
choice-boxを後方互換DOMとして残しつつ非使用化
touch-controls / notice / menu / loadingの責務を整理
UIManagerのchoice overlay lifecycleを正規化
docsにUI構造の正本を追加
```

## 重要な変更

選択肢は会話ウィンドウ内には表示しない。

```text
旧:
  dialog-window内のchoice-box

新:
  game-shell直下のchoice-overlay
```

## 確認ポイント

```text
左上が v4.0-h UIReset になる
ロード後にゲーム画面が表示される
ルルガー会話で選択肢がchoice-overlayに2件表示される
上下キーで選択が動く
選ぶボタンで選択できる
選択肢を直接タップできる
通常会話で会話ウィンドウ位置が安定する
小通知がタップで閉じる
メニューが開閉する
```
