# 待宵物語 RPG Engine v4.0-h.2

## この版の目的

この版は、これまでの一画面プロトタイプを、他のスマホ向けレトロRPGにも使い回しやすいように再構築したものです。

従来の `game.js` 一枚構成から、以下の2層構成に分離しました。

```text
src/
  engine/  汎用処理
  game/    待宵物語固有データ
```

## 起動方法

通常は `index.html` を開いて確認できます。

ローカルで `fetch()` が止まる場合は、フォルダ内で以下を実行してください。

```bash
python3 -m http.server 8000
```

その後、以下を開きます。

```text
http://localhost:8000
```

## 操作

| 状態 | 操作 |
|---|---|
| 通常時 | 十字キーで移動 |
| NPC前 | 右下ボタンが「話す」 |
| 会話本文中 | 下部タップまたは「送る」 |
| 選択肢中 | 十字キー上下で選択、「選ぶ」で決定 |
| 小通知中 | 下部タップまたは「閉じる」 |
| 入口前 | 「入る」 |
| 出口前 | 「出る」 |

## 汎用化した部分

- 入力制御
- スマホ向け十字キー
- 状況別アクションボタン
- 会話管理
- 選択肢管理
- 小通知
- シーン遷移
- 当たり判定
- NPC隣接判定
- interactables
- triggers
- 描画ループ

## まだ作品固有の部分

現時点でも、以下はまだプロトタイプ色が強いです。

- `Renderer.js` の村・屋内描画
- コルパン、ランド、ルルガーの仮素材
- ルルガー家内観
- 背景タイルマップ化

次の段階では `Renderer.js` をタイルマップ描画へ置き換えると、さらに汎用性が上がります。

## フォルダ構成

```text
matsuyoi_rpg_engine_v2_0/
  index.html
  README.md

  src/
    main.js
    style.css

    engine/
      AssetLoader.js
      DialogueManager.js
      Game.js
      InputController.js
      InteractionManager.js
      Renderer.js
      SceneManager.js
      UIManager.js
      constants.js

    game/
      data/
        matsuyoi.game.json

  assets/
    sprites/
    tiles/
    ui/

  docs/
    architecture.md
    migration_notes.md
    reuse_guide.md
```

## 別ゲームに流用する場合

基本的には以下を差し替えます。

```text
src/game/data/matsuyoi.game.json
assets/
```

必要に応じて、`Renderer.js` の描画方式をタイルマップ方式へ差し替えます。


## v3.4 変更点

### 1. 画面向き変更・Safari viewport再計算対策

`src/engine/LayoutManager.js` を追加しました。

- `resize`
- `orientationchange`
- `visualViewport.resize`
- `visualViewport.scroll`

を監視し、CSS変数 `--app-height` を更新します。

これにより、iPhone Safariでまれに発生する「縦横切り替え後に画面がずれる」問題を軽減します。

### 2. 何もない時のアクションボタン表示を変更

通常時の右下ボタンを、

```text
決定
```

から、

```text
…
```

に変更しました。

何もできない場所では、ボタンを薄く表示し、押しても何も起きません。

### 3. 汎用エンジン上の仕様として整理

今後はアクション対象がある時だけ、以下のように具体的な動詞を出します。

| 状態 | 表示 |
|---|---|
| 何もない | … |
| NPC前 | 話す |
| 入口前 | 入る |
| 出口前 | 出る |
| 会話中 | 送る |
| 選択肢中 | 選ぶ |
| 通知中 | 閉じる |


## v3.4 変更点

### 1. 選択肢アクションを追加

これまでの `DialogueManager` は、選択肢を選ぶと基本的に会話を閉じるだけでした。

v3.4では、選択肢に `action` を定義できるようにしました。

```json
{
  "label": "もう一度聞く",
  "action": "restart",
  "close": false
}
```

これにより、ルルガーとの会話で `もう一度聞く` を選ぶと、会話が最初から再開します。

### 2. `Game.handleChoiceAction()` を追加

選択肢固有の動作は、`Game` 側で処理します。

現在対応している action は以下です。

| action | 内容 |
|---|---|
| restart | 同じ会話を最初から再開 |
| notice | 会話を閉じて小通知を表示 |
| transition | 会話を閉じて別シーンへ遷移 |

### 3. 井戸の「調べる」を追加

次ステップ要素として、村の井戸に `調べる` アクションを追加しました。

井戸の前で右下ボタンが `調べる` になり、押すと小通知が表示されます。


## v3.4 変更点

### 1. メインメニューUIを追加

右上に `☰` ボタンを追加しました。

通常探索UIとメニューUIを分離するため、右下アクションボタンは引き続き「その場でできること」専用です。

### 2. MenuManagerを追加

```text
src/engine/MenuManager.js
```

を追加しました。

担当範囲は以下です。

- メニュー開閉
- タブ切り替え
- アイテム表示
- 装備表示
- ステータス表示
- 記録画面の仮表示
- 設定画面の仮表示

### 3. メニュー項目

現在のメニュー項目は以下です。

| タブ | 状態 |
|---|---|
| アイテム | 仮データ表示 |
| 装備 | 仮データ表示 |
| ステータス | 仮データ表示 |
| 記録 | 枠のみ |
| 設定 | 枠のみ |

### 4. game data側にプレイヤーデータを追加

`matsuyoi.game.json` に以下を追加しました。

- player
- status
- inventory
- equipment
- equipmentSlots
- items

これにより、今後のアイテム・装備・ステータス実装の土台を作っています。


## v3.4 修正点

### 1. 会話選択肢が反応しない問題を修正

`DialogueManager` を再整理し、選択肢決定時に必ず `confirmChoice()` が動くようにしました。

また、`Game` 側に `handleChoiceAction()` が確実に接続されるよう修正しました。

これにより、

- `わかりました` → 会話終了
- `もう一度聞く` → 同じ会話を最初から再開

が動作します。

### 2. メニューウィンドウの上端を固定

メニューは中央基準ではなく、上端基準で表示するようにしました。

タブを切り替えて内容の高さが変わっても、ウィンドウの上端が動かないようにしています。


## v3.4 修正点

### 1. 「選ぶ」ボタンが効かない問題を修正

選択肢表示中は `Game.interact()` が必ず `DialogueManager.confirmChoice()` を直接呼ぶようにしました。

また、iPhone Safariでの取りこぼしを避けるため、右下アクションボタンに `click` だけでなく `pointerdown` も設定しました。

### 2. 選択肢表示中の上下キー重なりを修正

選択肢表示中だけ、会話ウィンドウを上方向へ移動します。

これにより、十字キー上・下が会話ウィンドウに重なりにくくなります。


## v3.4 修正点

- `Game.handleChoiceAction()` を追加
- `DialogueManager.confirmChoice()` を安全化
- 右下アクションボタンの `pointerdown` / `click` 二重発火を廃止
- iPhone Safari向けに `touchend` + `click` 抑制方式へ変更

| 選択肢 | 挙動 |
|---|---|
| わかりました | 会話が閉じる |
| もう一度聞く | 会話が最初から再開する |


## v3.4 修正点

### 1. `もう一度聞く` がリピートしない問題を修正

v2.6再生成版でも、`Game.handleChoiceAction()` の実装漏れが残っていました。

v3.4では以下の二重対策を入れています。

1. `Game.handleChoiceAction()` を確実に追加
2. `restart` だけは `DialogueManager.confirmChoice()` 側で直接処理

これにより、`Game` 側の接続に依存せず、`もう一度聞く` は必ず同じ会話を最初から再開します。

### 2. 期待挙動

| 選択肢 | 挙動 |
|---|---|
| わかりました | 会話が閉じる |
| もう一度聞く | 会話が最初から再開する |


## v3.4 変更点

### 1. タイルマップJSON基盤を追加

以下を追加しました。

```text
src/engine/TileMapRenderer.js
src/game/maps/village_center.tilemap.json
src/game/maps/rulgar_house.tilemap.json
```

これまで `Renderer.js` に直書きしていた村・屋内背景を、段階的にタイルマップJSONへ移行します。

### 2. Renderer.jsはタイルマップ優先

`Renderer.js` は、現在シーンIDに対応する tilemap が存在する場合、`TileMapRenderer` を優先して描画します。

tilemap がないシーンでは、従来の仮描画へフォールバックします。

### 3. 今回は完全な正式タイルではなく移行基盤

今回の目的は、見た目の完成ではなく、背景をデータ駆動に移行するための足場作りです。

今後、グラフィック部門から正式タイルが届いたら、`TileMapRenderer` の tileset と JSON を差し替えます。


## v3.4 変更点：初回グラフィック素材の統合

### 1. clean asset package を取り込み

以下に原版を保持しました。

```text
assets/clean_source/
```

### 2. 実装用に正規化した素材を追加

```text
assets/tiles/clean16/
assets/sprites/colpan_clean/
assets/sprites/land_clean/
assets/ui/clean/
```

変換方針:

| 種別 | 実装サイズ |
|---|---|
| tiles | 16×16 |
| colpan | 16×32 |
| land | 24×24 |
| ui | 原寸保持 |

### 3. 画像タイルセットに対応

`TileMapRenderer` が、色面タイルだけでなく、画像タイルも描画できるようになりました。

追加:

```text
src/game/data/tileset.clean16.json
```

### 4. コルパン・ランドの4方向スプライト定義を追加

`matsuyoi.game.json` に以下を追加しました。

```text
playerDirectionFrames
companionDirectionFrames
```

これにより、主人公とランドは向きに応じたスプライトを表示できます。

### 注意

今回のタイル対応は、manifestに意味名がまだないため、tile_001などを仮対応させています。
正式な semantic tile name が届いたら、`tileset.clean16.json` のマッピングを更新します。


## v3.4 変更点：semantic manifest 対応

### 1. semantic manifest を正式採用

以下を取り込みました。

```text
assets/manifests/manifest_tiles_semantic_minimum.csv
```

これにより、`tile_001.png` のような連番タイルを、意味名ベースで扱えるようになりました。

### 2. 仮 tileset から semantic tileset へ切り替え

追加:

```text
src/game/data/tileset.clean16.semantic.json
docs/tileset_semantic_resolution_report.json
```

`tileset.clean16.semantic.json` は semantic manifest を元に生成しています。

### 3. collision は今回は保持のみ

semantic manifest に含まれる collision は、今回は将来の当たり判定統合に向けた保持です。
現時点の当たり判定は既存の blockedTiles を継続使用します。

## 今後

グラフィック部門から完全版 semantic manifest が来たら、さらに多くのタイルを意味名ベースで統合できます。


## v3.4 変更点：第一章導入・大事なもの

### 1. FlagManagerを追加

```text
src/engine/FlagManager.js
```

第一章進行フラグを管理します。

### 2. 第一章進行フラグを追加

`matsuyoi.game.json` に `chapterProgress` と `objectives` を追加しました。

v3.4時点で実際に使う主なフラグ:

```text
CH1_01_START
CH1_02_READ_MOTHERS_NOTE
CH1_03_MET_RULUGAR
```

### 3. 「大事なもの」を追加

メニューに `大事なもの` タブを追加しました。

### 4. 母のメモを正式本文で実装

ストーリー部門回答に基づく正式本文を `keyItems.mothers_note` に実装しました。

### 5. コルパンの家から開始

開始シーンを `colpan_house` に変更しました。

母のメモを読む前は外へ出られず、出口を調べると以下が表示されます。

```text
まず母のメモを読もう。
```

母のメモを読むと `CH1_02_READ_MOTHERS_NOTE` へ進行し、外へ出られるようになります。


## v3.4 変更点：コルパン家・ルルガー家の家別manifest反映

### 1. 家別tilesetを追加

以下を追加しました。

```text
src/game/data/tileset.colpan_house.minimum.json
src/game/data/tileset.rulgar_house.minimum.json
```

### 2. 家別tilemapを更新

以下を、グラフィック部門から受領した家別manifestに合わせて更新しました。

```text
src/game/maps/colpan_house.tilemap.json
src/game/maps/rulgar_house.tilemap.json
```

### 3. TileMapRendererを複数tileset対応に拡張

tilemap側の `tileset` 指定に応じて、シーン別tilesetを切り替えて描画できるようにしました。

### 4. ルルガー家に手紙の束を配置

ルルガー家内に `mail_bundle` を配置しました。

現時点では調べると小通知が出るだけです。  
今後、タート来訪・手紙受け取り・配達イベントへ接続します。

### 5. collisionはまだ段階移行

今回の家別manifestにはcollisionがありますが、実装側ではまだ `blockedTiles` を正として維持しています。


## v3.4.2 変更点：ground16完全不透明タイル対応

### 1. ground専用タイルセットを追加

```text
assets/tiles/ground16_opaque/
src/game/data/tileset.ground16.opaque.v1.json
assets/manifests/ground_tiles_16_opaque_manifest.csv
```

グラフィック部門から受領した 16×16 完全不透明 ground タイルを、再リサイズせずそのまま取り込みました。

### 2. ground / objects / decoration を分離

以下のtilemapを3層構造へ整理しました。

```text
src/game/maps/colpan_house.tilemap.json
src/game/maps/rulgar_house.tilemap.json
src/game/maps/village_center.tilemap.json
```

構成:

```text
ground: ground16_opaque_v1
objects: 家別tilesetまたはclean16_semantic_minimum
decoration: 透明あり装飾
```

### 3. TileMapRendererをlayer別tileset対応に拡張

tilemap全体だけでなく、layerごとに `tileset` を指定できるようにしました。

### 4. 白い格子状表示の軽減

ground layer から透明あり・外周縁あり素材を排除することで、白い格子状表示の主要因を取り除く構造にしました。

ただし、object / decoration 側の旧素材には、まだ縁が残る可能性があります。


## v3.4.3 変更点：フラットgroundタイル診断版

v3.4.2でも地面の格子感が残ったため、診断用にground layerをフラットタイルへ差し替えました。

目的は美麗化ではなく、以下の切り分けです。

```text
エンジン・描画スケーリングの問題か
groundタイル素材設計の問題か
```

ground layer:

```text
ground16_flat_diagnostic
```

objects / decoration は既存素材を維持しています。


## v3.4.4 変更点：暫定フラットground採用版

v3.4.3の診断により、groundの格子状表示はエンジンではなくground素材設計に起因する可能性が高いと確認した。

そのため、v3.4.4では `ground16_flat_diagnostic` を暫定groundとして採用する。

目的:

```text
ストーリー・イベント実装を止めない
地面の破綻を抑える
正式ground再設計までの安定版にする
```

追加ドキュメント:

```text
docs/flat_ground_interim_policy_v3_4_4.md
docs/graphic_department_ground_redesign_request_v3_4_4.md
```


## v3.4.6 変更点：正式ファイル構成運用版

GitHub Desktopによる直接push運用へ切り替えるため、Single File版ではなく正式ファイル構成を前提にしました。

### 主な修正

```text
Single File由来のキャラクター画像崩れを回避
colpan_house / rulgar_house の遷移整理
targetPositionによる遷移後座標指定
ground redesign v2 維持
object / decoration clean v1 維持
```

### 運用

このzipを展開し、リポジトリルートへ上書きコピーしてからGitHub Desktopでcommit / pushしてください。


## v3.4.7 変更点：導線制限・導入部補強

### 修正

```text
村からルルガー家へ直接入れる導線を削除
コルパン家への戻り導線だけ維持
ルルガー家方面は小通知のみ
```

### 追加

```text
現在地表示の基礎
現在の目的表示の基礎
村の道・畑・ルルガー家方面の小通知
```

### 方針

ストーリー進行フラグが未実装の場所へは、先に遷移させない。


## v3.4.8 変更点：UI安定化・ロード表示

### 追加・修正

```text
ダブルタップズーム抑止
長押し選択・テキスト選択抑止
Safariジェスチャー抑止
ロード中オーバーレイ追加
起動完了後にロード表示を非表示
起動失敗時にエラー表示
```

### 将来方針

誤操作による画面変動は抑止しつつ、将来的には以下をゲーム内設定として追加する。

```text
画面倍率
UIボタンサイズ
会話文字サイズ
メニュー文字サイズ
```


## v3.4.9 変更点：UI安定化・再入場修正

### 修正

```text
ロード中表示が見えない問題を修正
ロード表示の最低表示時間を700msに設定
ダブルタップ拡大抑止をcapture段階に強化
html/bodyをfixed化してSafariの画面変動を抑制
コルパンの家への再入場判定を拡張
```


## v4.0-a 変更点：Boot / Loading / Error

### 目的

第一章ストーリー追加前に、起動処理・ロード表示・エラー表示を安定化する。

### 追加・変更

```text
src/engine/BootManager.js
src/main.js の起動処理整理
Game.boot() の起動ステップログ
ロード表示の一元管理
起動失敗時の画面表示
```

### 注意

この版ではストーリー進行は追加していません。  
ルルガー家解放、タート来訪、配達、墓地、戦闘は未実装のまま維持しています。


## v4.0-b 変更点：BrowserGestureGuard / Input / UIState

### 目的

第一章ストーリー追加前に、スマホ操作・入力制御・UI状態管理を安定化する。

### 追加

```text
src/engine/BrowserGestureGuard.js
src/engine/UIStateController.js
src/engine/ActionResolver.js
```

### 変更

```text
main.js内のブラウザジェスチャー抑止処理をBrowserGestureGuardへ分離
Game.jsでUIStateController / ActionResolverを利用
MenuManagerにonOpen / onClose callbackを追加
UIManagerがbodyのdata-ui-stateを更新
```

### 注意

この版ではストーリー進行は追加していません。  
ルルガー家解放、タート来訪、配達、墓地、戦闘は未実装のまま維持しています。


## v4.0-c 変更点：Event Foundation / SceneTransition / Interactable

### 目的

複雑なイベントフラグ、条件分岐、演出効果に耐えられるように、イベント基盤を整備しました。

### 追加

```text
src/engine/ConditionEvaluator.js
src/engine/EventFlagManager.js
src/engine/EffectRunner.js
src/engine/SceneTransitionManager.js
src/engine/InteractableResolver.js
```

### 主な対応

```text
condition / conditions の評価
requiredFlag / blockedText の後方互換
effects / beforeEffects / afterEffects の実行基盤
sceneTransitionの専用管理
targetPosition / companionPosition対応
interactable優先順位の整理
将来演出効果の予約
```

### 重点

個別のストーリー追加ではなく、第一章全体の複雑なフラグ・演出に耐える保守性を優先しています。


## v4.0-d 変更点：AssetLoader / AssetValidator

### 目的

アセット定義の抜けやグラフィック担当との認識齟齬を早期検出するため、AssetValidatorを追加しました。

### 追加

```text
src/engine/AssetValidator.js
docs/asset_handoff_spec_for_graphics_team_v4_0_d.md
docs/asset_validation_static_report_v4_0_d.csv
docs/v4_0_d_asset_validator_report.md
```

### 検証対象

```text
画像ファイル存在
tileset定義
tilemap定義
sprite frame
object / decoration asset
semantic_name
collision
layer_type
width / height
anchor_x / anchor_y
edge_policy
resize_rule
ground運用ルール
```

### 方針

アセットは単なる画像ではなく、ゲーム性・美観・没入感に影響する定義体として扱います。


## v4.0-e 変更点：ObjectRenderer

### 目的

16×16タイルでは扱いにくい大型オブジェクトを、原寸・anchor基準・z-order/y-sort付きで描画できるようにしました。

### 追加

```text
src/engine/ObjectRenderer.js
src/game/objects/village_center.objects.json
src/game/objects/colpan_house.objects.json
src/game/objects/rulgar_house.objects.json
```

### 主な対応

```text
object placement定義
scene表示前object preload
描画時await禁止
AssetLoaderの同期画像取得cache
ObjectRendererの原寸描画
anchor_x / anchor_y対応
z_order / y_sort対応
AssetValidatorのobject placement検証
```

### 表示遅延対策

scene表示前に対象sceneのobject画像をpreloadし、描画時はcache済み画像を同期取得します。


## v4.0-f 変更点：Object Collision Integration

### 目的

ObjectRendererで描画される大型オブジェクトについて、見た目と体感がずれないようにcollisionを通行判定へ統合しました。

### 追加

```text
src/engine/ObjectCollisionManager.js
docs/object_collision_static_report_v4_0_f.csv
docs/v4_0_f_object_collision_report.md
```

### 主な対応

```text
object placement の collision tiles / rect をruntime collision map化
SceneManager.isBlocked へ object collision を統合
asset collision と placement collision の役割を分離
AssetValidatorにcollision shape検証を追加
window.matsuyoiObjectCollision にdebug情報を保持
```

### 方針

asset collisionは意味的ヒント、placement collisionは実際の通行判定として扱います。  
見た目と体感のズレを避けるため、実際の判定はplacement側の明示定義を優先します。


## v4.0-g 変更点：Layout / UI Collision Stability

### 目的

操作系UIと会話ウィンドウの衝突により、タップのたびに会話ウィンドウ位置が変わる問題をできる限り回避します。

### 主な対応

```text
control zoneのCSS変数化
会話ウィンドウの基準位置固定
選択肢中のdialog位置を固定量だけ上へ移動
visualViewportの小さなheight揺れを無視
広域タップ領域の整理
iPhone SE 2nd gen Safari向けの下部UI安定化
```

### 方針

会話ウィンドウと操作パネルは、場当たり的に重ならないよう逃がすのではなく、操作パネル領域を基準にして安定配置します。


## v4.0-g.1 変更点：Character Display / Cache Bust Fix

### 修正

```text
index.html のCSS/JS参照クエリが v3.0 のまま残っていた問題を修正
Rendererのsprite選択を堅牢化
方向別spriteが取れない場合のfallbackを追加
Game.jsのframe更新で0除算しないよう補強
CSSの contain:size を外してmobile Safariでの予期しないサイズ挙動を回避
```

### 確認

```text
左上が v4.0-g.1 Character になる
コルパン・ランド・NPCが表示される
```


## v4.0-g.2 変更点：Boot Cache Bust

### 目的

スマホSafariなどで古いアセットが残る問題を避けるため、起動ごとのcache bustを追加しました。

### 主な対応

```text
AssetLoaderにbootCacheTokenを追加
JSON / 画像URLへ v=<version>&boot=<token> を付与
fetch cache: "reload"
clearRuntimeCache()
getCacheDebugInfo()
window.matsuyoiCacheDebug()
index.htmlのCSS/JS参照をv4.0-g.2へ更新
no-cache系meta hint追加
```

### 注意

ブラウザのHTTPキャッシュそのものをJSから完全削除することはできません。  
その代わり、起動ごとに異なるURLとして読み込ませることで、古いアセット参照を避けます。


## v4.0-g.3 変更点：Blackout Fix / ObjectRenderer Safety

### 修正

```text
Renderer.draw() が呼んでいた drawSceneObjects() メソッド欠落を修正
ObjectRenderer.renderSceneObjects() のentry処理を修正
ObjectRenderer描画失敗時もゲーム全体が止まらないようtry/catchで保護
```

### 確認

```text
左上が v4.0-g.3 BlackoutFix になる
ロード後に黒画面で止まらない
背景・キャラクターが表示される
```


## v4.0-g.4 変更点：DOM Boot Structure Fix

### 根本修正

```text
loading-overlay の閉じタグ欠落により main#app が overlay 内に入っていた問題を修正
main#app と loading-overlay を兄弟要素に再構築
BootManagerにDOM構造チェックを追加
Renderer.draw全体をtry/catchで保護
```

### 重要

前版のブラックアウトは、描画だけでなくDOM構造が原因でした。  
ロード完了時にoverlayを非表示にすると、ゲーム本体も一緒に非表示になっていました。


## v4.0-g.5 変更点：Choice Layout Fix

### 修正

```text
選択肢表示領域が狭く、1件しか見えない問題を修正
choice-open時専用の会話ウィンドウ高さを設定
choice-boxをscrollable領域化
choice itemのmin-heightを明示
iPhone SE相当の低height向けmedia queryを追加
```

### 確認

```text
左上が v4.0-g.5 ChoiceFix になる
選択肢が複数件見える
選択肢が多い場合はスクロールできる
```


## v4.0-g.6 変更点：Choice Visibility / Companion Spawn Fix

### 修正

```text
選択肢数に応じてdialog高さを確保
.choice buttonを直接CSS対象化
UIManagerでchoices-1 / choices-2 / choices-3 / choices-many classを付与
コルパン家の出入り時にランドのcompanionPositionを明示
```

### 確認

```text
選択肢2件が見える
コルパン家を出た直後にランドが自然な位置にいる
```


## v4.0-g.7 変更点：Detached Choice Overlay Fix

### 方針変更

選択肢を会話ウィンドウ内に表示する方式をやめ、`#game-shell` 直下の独立した `#choice-overlay` に表示します。

### 修正

```text
UIManager.ensureChoiceOverlay()
showChoices() は #choice-overlay にbutton生成
syncChoiceSelection() は #choice-overlay を同期
inline #choice-box はchoice modeで非表示
.choice-overlay CSS追加
```

### 確認

```text
選択肢2件が独立パネルに表示される
上下キー・選ぶ・直接タップが使える
```


## v4.0-g.8 変更点：Loading Fix

### 修正

```text
UIManager.ensureChoiceOverlay() 欠落を修正
Game constructor の例外も BootManager.fail に渡す
AssetLoaderにJSON / 画像読み込みtimeoutを追加
```

### 原因

v4.0-g.7では、Game constructor中にUIManagerで例外が発生し、boot処理に入る前に止まっていました。


## v4.0-h 変更点：UI Architecture Reset

### 方針

v4.0-g系で重なったUI修正を整理し、UI構造を再構築しました。

### 主な変更

```text
style.cssを整理版へ置き換え
dialog-layerを会話本文専用化
choice-overlayを選択肢専用化
choice-boxは後方互換DOMとして残すが非使用
touch-controls / notice / menu / loadingの責務分離
UI構造の正本docsを追加
```

### 重要

以後、選択肢は会話ウィンドウ内ではなく `#choice-overlay` に表示します。


## v4.0-h.1 変更点：UIManager Constructor Fix

### 修正

```text
UIManager constructor から呼ばれていた ensureChoiceOverlay() のメソッド定義欠落を修正
```

### 原因

v4.0-hでは `this.ensureChoiceOverlay()` の呼び出しだけが存在し、メソッド定義が存在していませんでした。  
静的検査時に、呼び出しをメソッド定義と誤判定していました。


## v4.0-h.2 変更点：Renderer Object Draw Fix

### 修正

```text
Renderer.draw() が呼んでいた drawSceneObjects() メソッド欠落を修正
ObjectRenderer未接続時は無害に通過
ObjectRenderer描画エラーのconsole floodを抑制
favicon 404抑制用に data URI favicon を追加
```

### 確認

```text
左上が v4.0-h.2 RenderFix になる
consoleに this.drawSceneObjects is not a function が出ない
```
