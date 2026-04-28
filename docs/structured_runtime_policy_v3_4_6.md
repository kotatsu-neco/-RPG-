# v3.4.6 正式ファイル構成運用メモ

## 背景

GitHub Desktopからリポジトリへ直接pushできるようになったため、Single File版の運用を終了し、正式なファイル構成を前提にする。

## 方針

今後は原則として以下を出力する。

```text
index.html
src/
assets/
docs/
README.md
```

Single File版は、GitHub Pagesのファイル制限や相対パス問題の切り分けが必要な場合のみ作成する。

## v3.4.6での修正

- Single File由来のキャラクター画像埋め込み漏れを回避
- 正式フォルダ構成でplayer / companion spritesを読み込む
- colpan_house / rulgar_house のscene transitionを整理
- targetPositionによる遷移後座標指定に対応
- ground redesign v2とobject / decoration clean v1は維持

## 確認項目

- コルパンとランドが通常スプライトで表示される
- 開始時はコルパンの家
- 外へ出ると村へ遷移する
- 村からコルパンの家へ戻れる
- 村からルルガー家へ入れる
- ルルガー家から村へ戻れる
