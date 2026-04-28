# v3.4.8 UI安定化・ロード表示メモ

## 背景

実機確認で以下が指摘された。

```text
ダブルタップなど予期せぬ動作で画面サイズが変動する
画面表示完了まで何も表示されず不安になる
```

## 実装内容

```text
ダブルタップズーム抑止
gesturestart / gesturechange / gestureend 抑止
dblclick 抑止
touchend短時間連続時のpreventDefault
selectstart 抑止
contextmenu 抑止
user-select / -webkit-user-select / -webkit-touch-callout 抑止
ロード中オーバーレイ追加
起動完了時にロード表示を消す
起動失敗時にエラー表示
```

## 方針

誤操作によるズーム・画面変動は止める。  
ただし、意図的な画面倍率・文字サイズ変更は将来の設定項目として実装する。

## 将来設定候補

```text
画面倍率
UIボタンサイズ
会話文字サイズ
メニュー文字サイズ
```

## 注意

アクセシビリティ観点では、完全固定のまま完成版にしない。  
正式版ではゲーム内設定として拡大・文字サイズ変更を提供する。
