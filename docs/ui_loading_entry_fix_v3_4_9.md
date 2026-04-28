# v3.4.9 UI安定化・再入場修正メモ

## 修正対象

v3.4.8で以下の問題が残った。

```text
ロード中表示が出ない
ダブルタップで画面が拡大してしまう
コルパンの家に再入場できない
```

## 対応

### ロード中表示

- overlayをbody直下へ再挿入
- 最低表示時間700msを追加
- 起動完了後にhidden化

### ダブルタップ拡大

- gesture系イベントをwindow captureで抑止
- touchstart / touchmove の複数指操作をcaptureで抑止
- touchendの短時間連続をcaptureで抑止
- html/bodyをfixed化
- scroll時に原点へ戻す

### コルパンの家再入場

- village_to_colpan_house の判定tilesを拡張
- 他noticeとの重なりを避ける
- targetPositionは維持
