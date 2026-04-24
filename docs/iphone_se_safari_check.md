# iPhone SE Safari 検証メモ

## 確認ポイント

画面左上に `v0.3 SE修正版` と表示されていれば、新しいファイルを開けています。

## 反映されない場合

Safariの「履歴とWebサイトデータを消去」だけではなく、iPhoneの「ファイル」アプリ上で古い展開フォルダを開いている可能性があります。

次を確認してください。

1. 古い `matsuyoi_one_screen_proto_v0_1` フォルダを開いていないか確認する
2. 今回の zip を新しく展開する
3. `matsuyoi_one_screen_proto_v0_3_se_fix/index.html` を開く
4. 画面左上の表示が `v0.3 SE修正版` になっているか確認する

## v0.3での明示的な修正

- ランド画像ファイル名を変更してキャッシュ衝突を避ける
- CSS / JS に `?v=0.3` を付与
- 会話中は操作キーを `display:none` で強制非表示
- CSSでも `#dialog-layer:not(.hidden) ~ #touch-controls` を使って保険をかける
