# フォルダ構成

```text
matsuyoi_one_screen_proto_v0_1/
  index.html
  README.md

  src/
    style.css
    game.js

  assets/
    maps/
      prototype/
        one_screen_map.json

    sprites/
      colpan/
      land/
      npcs/

    tiles/
      village_minimum/

    ui/
      dialog/
      choice/
      notice/

  docs/
    implementation_notes.md
    next_tasks.md
```

## 方針

- `index.html` は起点
- `src/game.js` にゲームロジック
- `src/style.css` にスマホ縦画面UI
- `assets/maps/prototype/one_screen_map.json` に初期位置、NPC、通行不可タイルを定義
- `assets/sprites/` は仮採用キャラ素材
- `assets/ui/` は今後9スライス化する候補素材
- `assets/tiles/` は今後タイルマップ化する候補素材
```
