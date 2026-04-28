# v4.0-c Event Foundation / SceneTransition / Interactable 実装報告

## 実装目的

第一章内で将来的に発生する複雑なイベントフラグ、条件分岐、演出効果、場所遷移、調査対象の増加に耐えられるように、イベント基盤を整備した。

## 追加ファイル

```text
src/engine/ConditionEvaluator.js
src/engine/EventFlagManager.js
src/engine/EffectRunner.js
src/engine/SceneTransitionManager.js
src/engine/InteractableResolver.js
```

## 変更ファイル

```text
src/engine/Game.js
src/engine/FlagManager.js
src/engine/InteractionManager.js
src/game/data/matsuyoi.game.json
README.md
docs/package_summary.json
```

## ConditionEvaluator

以下の条件形式を扱う。

```json
{ "flag": "FLAG_ID" }
{ "notFlag": "FLAG_ID" }
{ "mainFlagReached": "CH1_02_READ_MOTHERS_NOTE" }
{ "currentMainFlag": "CH1_01_START" }
{ "sceneId": "village_center" }
{ "all": [ ... ] }
{ "any": [ ... ] }
{ "not": { ... } }
```

既存の `requiredFlag` / `blockedText` も後方互換として扱う。

## EffectRunner

以下の効果を扱う。

```json
{ "type": "setFlag", "flag": "FLAG_ID" }
{ "type": "clearFlag", "flag": "FLAG_ID" }
{ "type": "setMainFlag", "flag": "CH1_02_READ_MOTHERS_NOTE" }
{ "type": "notice", "text": "..." }
{ "type": "dialogue", "dialogueId": "..." }
{ "type": "transition", "targetScene": "...", "targetPosition": { "x": 0, "y": 0 } }
{ "type": "readKeyItem", "keyItemId": "..." }
{ "type": "updateUI" }
```

将来の演出効果として、以下は予約済みのno-opとして認識する。

```text
fade
wait
playSound
cameraShake
grantItem
removeItem
addPartyMember
removePartyMember
battle
```

## SceneTransitionManager

scene遷移を専用クラスへ分離した。

対応内容:

```text
targetScene / toScene
targetPosition / spawn
companionPosition / companionSpawn
transition cooldown
enterNotice
```

## InteractableResolver

interactable候補の優先順位を整理した。

```text
npc: 100
sceneTransition: 80
readKeyItem: 70
notice: 50
inspect: 40
```

## 今回の重点

個別ストーリー進行ではなく、以下を優先した。

```text
複雑なイベントフラグ
条件分岐
効果チェーン
将来の演出効果
未解放イベントの安全管理
```

## 確認ポイント

```text
左上が v4.0-c Event になる
母のメモを読める
母のメモ読了後に外へ出られる
村からコルパン家へ戻れる
未解放地点はblockedTextまたはnoticeになる
小通知・会話・選択肢・メニューの既存挙動が壊れていない
```

## 次工程候補

```text
v4.0-d AssetLoader / AssetValidator
```
