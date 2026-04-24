# 他ゲームへの流用ガイド

## 最小差し替え

別ゲームに使う場合、まず以下を差し替える。

```text
src/game/data/matsuyoi.game.json
assets/sprites/
assets/tiles/
assets/ui/
```

## game JSONで定義するもの

### assets

主人公、相棒、NPC画像を定義する。

### dialogues

会話IDごとに話者、本文、選択肢を定義する。

### scenes

シーンごとに以下を定義する。

- renderer
- playerStart
- companionStart
- blockedTiles
- npcs
- interactables
- triggers

## actionLabelの例

| 対象 | actionLabel |
|---|---|
| NPC | 話す |
| 扉 | 入る |
| 出口 | 出る |
| 井戸 | 調べる |
| 手紙 | 拾う |
| 本棚 | 読む |
| 宝箱 | 開ける |

## 今後の汎用化候補

- Rendererをタイルマップ方式へ変更
- フラグ管理
- アイテム管理
- セーブ/ロード
- 複数NPCイベント
- 条件分岐会話
