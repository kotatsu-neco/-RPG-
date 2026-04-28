# v4.0-g.6 Choice Visibility / Companion Spawn Fix 実装報告

## 修正対象

```text
選択肢が2件あるはずなのに1件しか見えない
コルパンの家を出た際、ランドが離れた位置にいて、1歩歩くと背後へワープする
```

## 原因

### 選択肢

v4.0-g.5ではCSSを追加したが、実際の選択肢buttonは `.choice` classで生成されていた。  
また、選択肢数に応じた高さ制御がなく、既存のdialog制約に負けていた。

### ランド位置

sceneTransition時に `companionPosition` が明示されておらず、scene既定値またはfallback配置になっていた。  
移動開始時の追従処理により、その後コルパン背後へ補正されていた。

## 修正内容

```text
UIManager.showChoicesでchoice count classをdialogLayerへ追加
--choice-count CSS変数を追加
choice buttonに choice choice-item class と data-choice-index を付与
CSSで .choice を直接対象にし、選択肢数に応じてdialog / choice-box高さを確保
コルパン家入口・出口のsceneTransitionに companionPosition を明示
```

## 確認ポイント

```text
左上が v4.0-g.6 ChoiceDog になる
「わかりました」と「もう一度聞く」の2件が見える
上下キーで2件を選べる
「選ぶ」で選択できる
コルパンの家を出た直後、ランドがコルパンの近くにいる
1歩歩いたときにランドが遠方からワープしない
```
