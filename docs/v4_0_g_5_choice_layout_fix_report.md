# v4.0-g.5 Choice Layout Fix 実装報告

## 症状

選択肢表示中に、選択肢が1件しか見えず、残りが隠れていた。  
スクリーンショットでは「わかりました」だけが表示され、下端の▼のみが見えていた。

## 原因

v4.0-gで会話ウィンドウと操作系UIの衝突を避けるため、dialog / choice 周辺の `max-height` を抑えすぎていた。  
その結果、選択肢表示領域が十分に確保されなかった。

## 修正内容

```text
choice-open時専用のdialog layoutを追加
choice-open時はdialog windowを縦方向に拡張
choice-boxをmin-height付きのscrollable領域へ変更
choice itemのmin-heightを明示
操作パネルとの距離を維持しつつ、選択肢領域を優先
iPhone SE相当の低height向けmedia queryを追加
```

## 方針

通常会話と選択肢表示は必要なUI要件が異なるため、選択肢表示中だけ専用レイアウトへ切り替える。

## 確認ポイント

```text
左上が v4.0-g.5 ChoiceFix になる
選択肢が複数件見える
選択肢が多い場合はchoice-box内でスクロールできる
上下キーと「選ぶ」が会話ウィンドウと重なりにくい
通常会話の位置安定性が維持される
```
