# 『待宵物語』v4.0 エンジン安定化 実装指示書  
## 第一章実装前の汎用RPGエンジン整備計画

**文書種別**: 実装担当AIへの正式指示書  
**対象プロジェクト**: 待宵物語 / Matsuyoi Monogatari  
**対象バージョン**: v4.0 Engine Stabilization  
**推奨インテリジェンスレベル**: high  
**目的**: 第一章のストーリー実装を安定して進めるため、スマホ向けRPGエンジンの基盤を整理・強化する。  
**重要方針**: 新規ストーリー追加より先に、入力・UI状態・シーン遷移・アセット管理・描画責務を安定化する。

---

# 0. この指示書の使い方

この文書は、実装担当AIに渡すための指示書である。  
以後、待宵物語の第一章実装を進める前に、まずこの文書を読ませ、ここに記載された方針に従ってエンジン基盤を再整理する。

実装担当AIは、以下の順で作業すること。

```text
1. この文書を最初に読む
2. 現在の最新zipまたはリポジトリ構成を確認する
3. 既存仕様・既存進行を壊さず、v4.0安定化計画に沿って作業範囲を決める
4. 実装前に変更対象・非対象を明示する
5. 小さな単位で実装する
6. 実装後は確認ポイントと残課題を報告する
```

---

# 1. 現在の到達点

## 1.1 プロジェクト概要

『待宵物語』は、スマホ縦画面で遊ぶレトロRPG風ブラウザゲームである。

現在の基本仕様は以下。

```text
- スマホ向け縦画面
- ブラウザ実行
- GitHub Pages公開想定
- 16×16 tile
- キャラクターは基本 16×32
- ランドは大型犬としてやや大きめを許容
- トップダウン移動
- 会話UI
- 小通知
- メニュー
- 大事なもの
- tilemap JSON
- gameData JSON
- engine / game 分離方針
```

## 1.2 最新運用方針

現在は GitHub Desktop からリポジトリへ直接pushできるため、今後は原則として **Single File版は作らない**。

正式出力は以下のファイル構成zipとする。

```text
index.html
src/
assets/
docs/
README.md
```

Single File版は、相対パス事故やGitHub Pages側のファイル配置問題を切り分ける必要がある場合のみ例外的に作成する。

---

# 2. v3系で発生した主な問題と教訓

## 2.1 入力・UI系

過去に以下の問題が発生した。

```text
- 会話送りが反応しない
- 会話ウィンドウ内をタップしないと会話が進まない
- 小通知が操作パネル側タップで閉じない
- 選択肢表示中に「選ぶ」ボタンが効かない
- 選択肢表示中に上下キーが会話ウィンドウと重なる
- メニュータブ変更時にウィンドウ上端が変動する
- ダブルタップで画面が拡大する
- 長押しでOSのテキスト選択が出る
```

教訓:

```text
入力制御とUI状態管理が曖昧なまま機能追加すると、状態ごとの操作が衝突する。
```

## 2.2 レイアウト・画面サイズ系

過去に以下の問題が発生した。

```text
- 画面が上下方向に潰れる
- 操作キーの表示が崩れる
- バージョン情報が表示されない
- 画面固定解除後、横画面→縦画面でマップ位置が復旧する
- iPhone Safariのアドレスバー・viewport変動に影響を受ける
```

教訓:

```text
スマホSafariでは、canvas / viewport / safe-area / orientation / browser chromeの影響を前提に設計する必要がある。
```

## 2.3 ロード・アセット系

過去に以下の問題が発生した。

```text
- 背景色とバージョン情報だけ表示される
- Boot Errorが出る
- キャラクター画像が崩れる
- Single File化で画像参照を拾い損ねる
- JSONや画像の読み込み失敗が分かりづらい
- ロード中表示が出ず不安になる
```

教訓:

```text
起動ライフサイクル、アセット読み込み、エラー表示、アセット検証を分離して管理すべき。
```

## 2.4 シーン遷移・interactable系

過去に以下の問題が発生した。

```text
- コルパンの家に再入場できない
- ルルガー家へ早すぎる段階で入れてしまう
- 入口の判定範囲が分かりづらい
- sceneTransitionとnoticeの判定が重なる可能性がある
- targetPositionがないと遷移後位置が不安定
```

教訓:

```text
場所解放・sceneTransition・interactable判定・進行フラグを正式化しないと、第一章進行で破綻する。
```

## 2.5 グラフィック・描画系

過去に以下の問題が発生した。

```text
- groundタイルに白い格子が出る
- groundタイルを再リサイズして劣化する
- object / decoration に白縁が残る
- 16×16以外のオブジェクトをtilemapへ押し込めない
- 井戸、机、ベッド、棚、扉などが自然に扱えない
```

教訓:

```text
TileMapRendererだけでは限界がある。TileMapRenderer / ObjectRenderer / SpriteRenderer を分離する必要がある。
```

---

# 3. v4.0で解決すべき根本課題

v4.0では、以下のエンジン基盤を安定化する。

```text
1. Boot / Loading / Error
2. BrowserGestureGuard
3. InputController
4. UIStateController
5. ActionResolver
6. SceneTransition
7. InteractableResolver
8. AssetLoader / AssetValidator
9. TileMapRenderer / ObjectRenderer / SpriteRenderer
10. LayoutManager
11. DebugPanel / Dev Diagnostics
```

v4.0では、ストーリーイベントの追加は主目的にしない。  
目的は、第一章を安全に追加できる土台を作ることである。

---

# 4. v4.0でやらないこと

v4.0では、以下を原則として実装しない。

```text
- ルルガー初回会話の本実装
- タート来訪イベント
- ミガム宛の手紙配達イベント
- 墓地イベント
- 野雉戦
- 戦闘システム
- 装備システム
- セーブ/ロード本格実装
- 章全体の大規模マップ拡張
```

ただし、これらを将来実装しやすいように、設計上の受け皿は作る。

---

# 5. 第一章で今後問題になりうる事象の網羅

## 5.1 母のメモ関連

想定リスク:

```text
- メモを読まずに外へ出られる
- メモを複数回読んだ時にフラグが壊れる
- メモを読むUIと会話UIが衝突する
- 大事なものメニューから読む場合と現地で読む場合の挙動が不一致
- 読了後の目的表示が更新されない
```

必要対策:

```text
- keyItem readイベントを冪等にする
- フラグ設定を一元化する
- objective更新をUIStateControllerまたはFlagManager経由にする
- 現地interactableと大事なものメニューの読み処理を共通化する
```

## 5.2 家の出入り

想定リスク:

```text
- 家から出た位置が不自然
- 家に戻れない
- 家の入口判定が狭すぎる
- 出口・入口・noticeが重なる
- 遷移直後に即再遷移する
- ランドの位置が壁にめり込む
```

必要対策:

```text
- sceneTransitionにspawn / companionSpawn / cooldownを持たせる
- entryPoint / exitPointを定義する
- 遷移後の短時間はtransition再発火を防ぐ
- interactable優先順位を定義する
```

## 5.3 村マップ

想定リスク:

```text
- 未実装エリアへ行けてしまう
- 行けない場所の説明がない
- 入口がどこか分からない
- 井戸や畑などのnotice判定が重なる
- ルルガー家へ早く入れてしまう
```

必要対策:

```text
- lockedLocationを正式化する
- requiredFlag / blockedText を sceneTransitionに持たせる
- noticeとtransitionの優先順位を明確化する
- interactableの矩形判定を安定化する
```

## 5.4 ルルガー初回会話

想定リスク:

```text
- ルルガーと話す前に次イベントへ進める
- 初回会話と通常会話の切替が壊れる
- 会話終了時のフラグ付与が不安定
- 選択肢でループしない
- 会話中に移動・メニューが押せる
```

必要対策:

```text
- DialogueManagerにonComplete / setFlag / nextDialogueを正式定義
- 会話状態中はUIStateをdialogueに固定
- 選択肢状態中はUIStateをchoiceに固定
- 初回会話フラグと通常会話IDを分ける
```

## 5.5 タート来訪・手紙イベント

想定リスク:

```text
- タート出現タイミングが不明確
- 手紙を受け取る前に配達できる
- 大事なものへ追加されない
- 手紙の内容を読んでも読まなくても進行が混乱する
- 複数の手紙を区別できない
```

必要対策:

```text
- eventFlagとinventory/keyItemを分離する
- keyItem取得処理を正式化する
- 手紙ごとのIDを固定する
- read状態を持つ
- deliveryTargetを持つ
```

## 5.6 モガモ家・ミガム宛の手紙

想定リスク:

```text
- 誤配イベント前にモガモ家へ入れる
- モガモ会話が通常会話と誤配会話で混ざる
- 手紙を持っていないのに反応する
- 手紙を渡した後も同じイベントが繰り返される
```

必要対策:

```text
- requiredKeyItem
- consumed / retainedの扱い
- eventOnce
- dialogue branch by flag
```

## 5.7 墓地イベント

想定リスク:

```text
- 墓地へ早く行ける
- 特殊墓石を調べる順序が崩れる
- メル・モガモ同行状態が未実装で破綻する
- 回想イベント中に操作できる
```

必要対策:

```text
- party state
- event cutscene mode
- controllable flag
- scene lock
- requiredPartyMembers
```

## 5.8 野雉戦

想定リスク:

```text
- 戦闘発生位置の判定が曖昧
- 戦闘後に同じ戦闘が繰り返される
- 戦闘画面から戻る位置が不自然
- HPや敗北処理が未整備
```

必要対策:

```text
- battleTrigger
- battleId
- battleResolvedFlag
- returnScene / returnPosition
- BattleManagerの設計だけ先に用意
```

## 5.9 メニュー・大事なもの・将来ステータス

想定リスク:

```text
- メニュー中に移動できる
- メニュー中に通知が出る
- 大事なものを読んだ後、戻る導線が壊れる
- ステータス画面追加時にタブ高さが変わる
- 装備・アイテム追加時にUIが破綻する
```

必要対策:

```text
- MenuManagerをUIStateControllerに接続
- タブ切替時の上端固定
- content areaの高さ固定
- menu tab schema化
- 将来ステータス/装備/アイテムタブを想定
```

---

# 6. v4.0 エンジン安定化フェーズ計画

## v4.0-a Boot / Loading / Error

### 目的

起動処理を安定化し、ロード中表示・エラー表示・アセット検証の入口を作る。

### 実装すること

```text
BootManager追加
LoadingOverlay制御の一元化
Game.boot()の責務整理
起動段階のログ出力
起動失敗時の画面表示
最低ロード表示時間の正式化
```

### 受け入れ条件

```text
起動時に必ずロード表示が出る
ロード完了後に必ず消える
JSON読み込み失敗時にエラー表示が出る
画像読み込み失敗時に原因が分かる
```

---

## v4.0-b BrowserGestureGuard / Input / UIState

### 目的

スマホ入力、ブラウザジェスチャー、UI状態ごとの入力許可を整理する。

### 実装すること

```text
BrowserGestureGuard追加
UIStateController追加
InputController整理
ActionResolver追加
状態ごとの入力許可表を実装
```

### UI状態

```text
loading
exploration
dialogue
choice
notice
menu
transition
cutscene
```

### 状態ごとの入力方針

| 状態 | 移動 | アクション | タップ | メニュー |
|---|---:|---:|---:|---:|
| loading | 不可 | 不可 | 不可 | 不可 |
| exploration | 可 | 可 | 可 | 可 |
| dialogue | 不可 | 送る | 送る | 不可 |
| choice | 上下のみ | 選ぶ | 選択 | 不可 |
| notice | 不可 | 閉じる | 閉じる | 不可 |
| menu | 不可 | 不可 | メニュー内 | 可 |
| transition | 不可 | 不可 | 不可 | 不可 |
| cutscene | 不可 | 条件次第 | 条件次第 | 不可 |

### 受け入れ条件

```text
会話中に移動できない
選択肢中に上下・選ぶが効く
小通知は下部操作パネル側タップでも閉じる
メニュー中に移動できない
ダブルタップで画面拡大しない
```

---

## v4.0-c SceneTransition / Interactable

### 目的

家の出入り、場所解放、未解放場所、NPC会話、notice判定を安定化する。

### 実装すること

```text
SceneTransitionManager追加
InteractableResolver追加
requiredFlag / blockedText正式化
targetPosition / companionPosition正式化
transition cooldown
interactable priority
矩形判定
正面判定
足元判定
```

### interactable優先順位

```text
1. UI overlay
2. NPC conversation
3. sceneTransition
4. keyItem / readable
5. notice
6. none
```

### 受け入れ条件

```text
コルパン家から出られる
村からコルパン家へ戻れる
未解放のルルガー家へは入れない
未解放場所はnoticeを返す
入口判定が極端に狭くない
遷移直後に即再遷移しない
```

---

## v4.0-d AssetLoader / AssetValidator

### 目的

画像・JSON・tilemap・spriteの読み込み漏れを起動時に検出する。

### 実装すること

```text
AssetValidator追加
missing asset一覧
undefined tile id検出
missing sprite frame検出
missing tileset検出
tilemap layer検証
manifest検証
debug panel表示
```

### 受け入れ条件

```text
存在しない画像パスがあれば起動時に検出される
未定義tile idがあれば検出される
sprite frame不足が分かる
開発用debug summaryが見られる
```

---

## v4.0-e ObjectRenderer

### 目的

16×16ではない家具・井戸・扉・棚・ベッドなどを自然に描画できるようにする。

### 実装すること

```text
ObjectRenderer追加
object placement JSON追加
asset_id参照
width / height原寸描画
anchor_x / anchor_y
z-order
collision box
interactable連携
```

### 対象素材

```text
obj_well.png
obj_table.png
obj_bed.png
obj_door.png
obj_shelf.png
obj_cabinet.png
obj_mail_bundle.png
```

### 受け入れ条件

```text
井戸が32×32原寸で表示される
ベッドや机が潰れない
扉が16×24で表示される
大型objectのcollisionが機能する
objectとキャラクターの重なり順が自然
```

---

## v4.0-f LayoutManager / Accessibility Settings Foundation

### 目的

画面倍率や文字サイズ変更の将来対応に備え、レイアウトを固定値依存から少しずつ分離する。

### 実装すること

```text
screenScale設定の受け皿
dialogueFontSize設定の受け皿
menuFontSize設定の受け皿
buttonSize設定の受け皿
safe-area再確認
orientationchange / resize処理整理
```

### 受け入れ条件

```text
iPhone SE 2nd gen Safariで画面が潰れない
誤操作で画面倍率が変わらない
将来設定値を入れる場所がある
```

---

# 7. v4.0 実装順序

最も安全な順序は以下。

```text
v4.0-a Boot / Loading / Error
v4.0-b BrowserGestureGuard / Input / UIState
v4.0-c SceneTransition / Interactable
v4.0-d AssetLoader / AssetValidator
v4.0-e ObjectRenderer
v4.0-f LayoutManager / Accessibility Settings Foundation
```

一度に全部やらないこと。  
各段階ごとにzipを出力し、実機確認する。

---

# 8. v4.0 実装時に守るべきこと

## 8.1 既存の成果を壊さない

以下は維持する。

```text
コルパンの家から開始
母のメモ
大事なもの
村へ出る
村からコルパン家へ戻る
ルルガー家はまだ未解放
ground redesign v2
object / decoration clean v1
```

## 8.2 ストーリーを先に進めない

v4.0中は、以下を解放しない。

```text
ルルガー家への入場
ルルガー初回会話
タート来訪
配達イベント
墓地
戦闘
```

## 8.3 Single File版は作らない

正式フォルダ構成zipのみ出力する。

## 8.4 iPhone SE 2nd gen Safariを基準に確認する

特に以下を重視。

```text
縦画面
ダブルタップ拡大なし
長押し選択なし
下部操作パネル
会話UI
メニュー
ロード表示
safe-area
```

---

# 9. 実装担当AIへの依頼文テンプレート

以下をそのまま実装担当AIに渡してよい。

```text
あなたは『待宵物語』の実装担当プログラマーです。

添付の最新zipを確認し、この指示書を最初に読んでください。
今回はストーリー追加ではなく、v4.0 Engine Stabilization の一部として、エンジン基盤を安定化してください。

推奨インテリジェンスレベル: high

今回の作業範囲:
[ここに v4.0-a / v4.0-b などを指定]

変更してよいもの:
- src/engine/
- src/game/data/
- src/game/maps/
- index.html
- src/style.css
- src/main.js
- docs/
- README.md

変更してはいけないもの:
- 第一章のストーリー進行を勝手に先へ進めること
- ルルガー家への入場解放
- タート来訪
- 配達イベント
- 墓地イベント
- 戦闘
- 既存素材の破壊的加工
- Single File版の作成

必ず守ること:
- 正式ファイル構成zipのみ出力する
- 既存の開始導線を壊さない
- コルパン家、母のメモ、村への移動、コルパン家への戻りを維持する
- 実装後に変更点、確認ポイント、未対応事項を報告する
```

---

# 10. v4.0-a用 個別依頼文案

最初に進めるなら、以下を使う。

```text
今回は v4.0-a Boot / Loading / Error を実装してください。

目的:
起動処理、ロード中表示、エラー表示、起動ログを安定化する。

実装すること:
- BootManagerを追加する
- LoadingOverlay制御を一元化する
- Game.boot()の責務を整理する
- 起動段階ごとのログを出す
- 起動失敗時に画面上へ原因を表示する
- 最低ロード表示時間を正式化する
- 既存のv3.4.9相当の機能は維持する

今回やらないこと:
- ストーリー追加
- ルルガー家解放
- ObjectRenderer
- 戦闘
- セーブ/ロード
- Single File版作成

出力:
正式ファイル構成zipのみ。
```

---

# 11. v4.0-b用 個別依頼文案

```text
今回は v4.0-b BrowserGestureGuard / Input / UIState を実装してください。

目的:
スマホ入力、ブラウザジェスチャー抑止、UI状態ごとの入力許可を安定化する。

実装すること:
- BrowserGestureGuardを追加する
- UIStateControllerを追加する
- InputControllerを整理する
- ActionResolverの基礎を追加する
- loading / exploration / dialogue / choice / notice / menu / transition / cutscene の状態を扱えるようにする
- 状態ごとに許可される入力を切り替える

確認すること:
- 会話中に移動できない
- 選択肢中に上下と選ぶが効く
- 小通知が下部操作パネル側タップでも閉じる
- メニュー中に移動できない
- ダブルタップで画面拡大しない
```

---

# 12. v4.0-c用 個別依頼文案

```text
今回は v4.0-c SceneTransition / Interactable を実装してください。

目的:
家の出入り、未解放場所、notice、NPC会話、調べる対象の判定を安定化する。

実装すること:
- SceneTransitionManagerを追加する
- InteractableResolverを追加する
- requiredFlag / blockedText を正式化する
- targetPosition / companionPosition を正式化する
- transition cooldown を追加する
- interactable priority を実装する
- 正面判定、足元判定、矩形判定を整理する

確認すること:
- コルパン家から出られる
- 村からコルパン家へ戻れる
- ルルガー家へはまだ入れない
- ルルガー家方面はnoticeを返す
- 入口判定が狭すぎない
- 遷移直後に即再遷移しない
```

---

# 13. v4.0-d用 個別依頼文案

```text
今回は v4.0-d AssetLoader / AssetValidator を実装してください。

目的:
画像、JSON、tilemap、sprite frame、tilesetの読み込み漏れや定義ミスを起動時に検出する。

実装すること:
- AssetValidatorを追加する
- missing asset一覧を出す
- undefined tile idを検出する
- missing sprite frameを検出する
- missing tilesetを検出する
- tilemap layerを検証する
- 開発用debug summaryを表示する

確認すること:
- 存在しない画像パスがあれば検出される
- 未定義tile idがあれば検出される
- sprite frame不足が分かる
- debug summaryが見られる
```

---

# 14. v4.0-e用 個別依頼文案

```text
今回は v4.0-e ObjectRenderer を実装してください。

目的:
16×16ではない家具・井戸・扉・棚・ベッドなどを自然なサイズで描画できるようにする。

実装すること:
- ObjectRendererを追加する
- object placement JSONを追加する
- object_decoration.clean.v1.json のasset_idを参照する
- width / height原寸描画に対応する
- anchor_x / anchor_yに対応する
- z-orderを扱う
- collision boxの基礎を作る
- interactableとの連動方針を作る

確認すること:
- 井戸が32×32原寸で表示される
- ベッドや机が潰れない
- 扉が16×24で表示される
- キャラクターとの重なり順が不自然でない
```

---

# 15. v4.0-f用 個別依頼文案

```text
今回は v4.0-f LayoutManager / Accessibility Settings Foundation を実装してください。

目的:
画面倍率や文字サイズ変更の将来対応に備え、レイアウト管理を整理する。

実装すること:
- screenScale設定の受け皿を作る
- dialogueFontSize設定の受け皿を作る
- menuFontSize設定の受け皿を作る
- buttonSize設定の受け皿を作る
- safe-area対応を再確認する
- orientationchange / resize処理を整理する

確認すること:
- iPhone SE 2nd gen Safariで画面が潰れない
- 誤操作で画面倍率が変わらない
- 将来設定値を入れる場所がある
```

---

# 16. v4.0完了条件

v4.0全体の完了条件は以下。

```text
起動時に必ずロード表示が出る
読み込み失敗時に原因が表示される
ダブルタップで画面が拡大しない
長押しで文字選択されない
コルパン家から出られる
村からコルパン家へ戻れる
未解放のルルガー家には入れない
小通知が必ず閉じられる
会話送りが安定する
選択肢操作が安定する
メニュー中に移動できない
現在地と目的が正しく表示される
アセット不足が検出できる
大型objectを扱う基礎がある
```

---

# 17. v4.0完了後に進めるべきこと

v4.0完了後に、第一章ストーリーを進める。

推奨順序:

```text
v4.1 CH1_03_MET_RULUGAR
v4.2 ルルガー家入口解放と初回会話
v4.3 タート来訪準備
v4.4 手紙受け取り・大事なもの追加
v4.5 村内配達
v4.6 モガモ誤配イベント
v4.7 墓地イベント準備
v4.8 眠らない墓石イベント
v4.9 野雉戦準備
```

---

# 18. 最終判断

現時点では、ストーリー追加よりもエンジン安定化が優先である。

理由:

```text
入力制御、UI状態、シーン遷移、ロード、アセット検証が未成熟なままイベントを増やすと、バグ調査が難しくなる。
```

したがって、次に進むべきは以下。

```text
v4.0-a Boot / Loading / Error
```

まずここから始める。
