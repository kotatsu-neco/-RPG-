# v4.0-c イベントスキーマ草案

## 条件

```json
{
  "condition": {
    "all": [
      { "mainFlagReached": "CH1_02_READ_MOTHERS_NOTE" },
      { "notFlag": "MET_RULGAR" }
    ]
  },
  "blockedText": "まだ行く必要はなさそうだ。"
}
```

## 効果

```json
{
  "effects": [
    { "type": "setFlag", "flag": "SAW_WELL" },
    { "type": "notice", "text": "井戸の水は冷たい。" }
  ]
}
```

## sceneTransition

```json
{
  "kind": "sceneTransition",
  "targetScene": "colpan_house",
  "targetPosition": { "x": 9, "y": 23, "facing": "up" },
  "condition": { "mainFlagReached": "CH1_02_READ_MOTHERS_NOTE" },
  "blockedText": "まず母のメモを読もう。"
}
```

## dialogue choice

```json
{
  "label": "手紙を受け取る",
  "condition": { "notFlag": "HAS_MIGAM_LETTER" },
  "effects": [
    { "type": "setFlag", "flag": "HAS_MIGAM_LETTER" },
    { "type": "notice", "text": "ミガム宛の手紙を受け取った。" }
  ]
}
```

## 予約済み演出効果

以下はv4.0-c時点ではno-opだが、EffectRunnerで予約済み。

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
