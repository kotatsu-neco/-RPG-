# v4.0-g Layout / UI Collision Stability 実装報告

## 実装目的

操作系UIと会話ウィンドウの衝突によって、タップのたびに会話ウィンドウ表示位置が変動する問題をできる限り回避する。

特に iPhone SE 2nd gen Safari を想定し、下部操作パネル、会話ウィンドウ、選択肢表示、広域タップ領域の干渉を減らす。

## 変更内容

```text
src/engine/LayoutManager.js
src/style.css
src/engine/Game.js
src/game/data/matsuyoi.game.json
index.html
README.md
docs/package_summary.json
```

## 主要方針

### 1. control zoneをCSS変数化

```text
--control-zone-height
--dialog-gap
--dialog-bottom
--dialog-choice-bottom
```

会話ウィンドウは、操作パネルの高さを基準に配置する。

### 2. 会話ウィンドウ基準位置の固定

通常会話中は `--dialog-bottom`、選択肢中は `--dialog-choice-bottom` を使う。

旧来の複数箇所に散った `bottom` 指定を、最終overrideで統一した。

### 3. visualViewportの小さな揺れを無視

iOS Safariのアドレスバーやタップ時挙動による小さなheight変化で、毎回 `--app-height` を更新しない。

```text
幅変化がほぼなく、高さ変化が72px以内なら無視
orientationchangeや初期化時はforce更新
```

### 4. 選択肢中の干渉軽減

選択肢中は操作キーを残しつつ、会話ウィンドウを固定量上へ逃がす。  
左右キーは見た目上抑制し、上下・選ぶを優先する。

### 5. 広域タップ領域の整理

会話・通知中は広域タップで進行・閉じる操作を受ける。  
選択肢中は広域タップを無効化し、誤選択やUI干渉を防ぐ。

## 今回やっていないこと

```text
本格的な設定画面
ユーザー保存設定
画面倍率変更UI
文字サイズ変更UI
戦闘UI
装備画面
ステータス画面の本実装
```

## 確認ポイント

```text
左上が v4.0-g Layout になる
通常会話でタップのたびに会話ウィンドウ位置が上下に揺れない
選択肢表示時に操作キーと会話ウィンドウが重なりにくい
小通知と操作パネルが干渉しにくい
村への移動、コルパン家への戻り、母のメモが維持される
iPhone SE 2nd gen Safariで画面が潰れにくい
```
