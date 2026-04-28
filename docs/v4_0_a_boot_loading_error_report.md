# v4.0-a Boot / Loading / Error 実装報告

## 実装範囲

添付の `matsuyoi_v4_engine_stabilization_instruction.md` に従い、v4.0-a Boot / Loading / Error を実装した。

## 変更内容

```text
src/engine/BootManager.js を追加
src/main.js の起動処理を BootManager 経由へ整理
src/engine/Game.js に boot step のログ通知を追加
index.html のロードオーバーレイを v4.0-a 用に整理
src/style.css のロードオーバーレイ表示を強化
docs/ に指示書と実装報告を保存
README.md を更新
```

## BootManagerの責務

```text
ロード開始
ロード文言更新
起動ステップ記録
最低表示時間制御
正常完了時の非表示
失敗時の画面表示
エラー詳細の保持
```

## 今回やっていないこと

```text
ストーリー追加
ルルガー家解放
タート来訪
配達イベント
墓地イベント
戦闘
ObjectRenderer
Single File版作成
```

## 確認ポイント

```text
起動時にロード表示が出る
最低700msはロード表示が維持される
起動成功後にロード表示が消える
起動失敗時にロード画面上へ原因が表示される
左上バージョンが v4.0-a Boot になる
コルパン家開始・母のメモ・村への移動・コルパン家への戻りは維持される
```

## 次工程

```text
v4.0-b BrowserGestureGuard / Input / UIState
```
