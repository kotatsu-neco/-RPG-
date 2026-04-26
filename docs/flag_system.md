# FlagManager 仕様

## 目的

第一章の進行状態を管理する。

## 主なAPI

```js
getMainFlag()
setMainFlag(flag)
hasFlag(flag)
setFlag(flag)
clearFlag(flag)
hasReached(flag)
getObjective(objectives)
toJSON()
```

## 方針

- mainFlags はストーリー進行順を持つ
- hasReached は mainFlags 上の順序で到達済み判定する
- 補助フラグは Set で持つ
- v3.3ではlocalStorage保存はまだ行わない
