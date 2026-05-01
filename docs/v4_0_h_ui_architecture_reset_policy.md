# v4.0-h UI Architecture Reset 正本

## 目的

v4.0-g系で発生した会話UI・選択肢UI・操作UIの手戻りを受け、UI構造を再構築する。

以後、UI修正はこの構造を正本とする。

## 原則

```text
同じUI領域に対して、同じセレクタを何度も上書きしない。
問題が起きた場合は、責務分離を確認してから修正する。
```

## UIレイヤー

```text
#dialog-layer:
  会話本文専用。
  選択肢を表示しない。

#choice-overlay:
  選択肢専用。
  UIManagerが#game-shell直下に生成する。
  #dialog-windowのoverflow制約を受けない。

#touch-controls:
  D-padとアクションボタン専用。

#notice-layer:
  小通知専用。

#menu-layer:
  メニュー専用。

#loading-overlay:
  ロード・起動エラー専用。
```

## choice-boxについて

`#choice-box` は過去互換のDOMとして残すが、v4.0-h以降の通常運用では使わない。

```text
#choice-box {
  display: none !important;
}
```

選択肢は必ず `#choice-overlay` に表示する。

## CSS運用ルール

```text
1. style.cssはセクション単位で管理する
2. body.choice-open #dialog-layer のような状態指定は1か所に集約する
3. 追加CSSで末尾から強引に上書きしない
4. UI不具合が出たら、まずDOM構造と責務分離を確認する
5. iPhone SE Safariでの確認を必須にする
```

## 再発防止

今後、UI不具合を修正する場合は以下の順で確認する。

```text
1. DOM構造
2. UIManagerの出力先
3. body state class
4. CSSセクション
5. z-index
6. safe-area / viewport
7. 入力制御
```
