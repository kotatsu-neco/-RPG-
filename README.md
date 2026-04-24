# 待宵物語 RPG Engine v2.0

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
