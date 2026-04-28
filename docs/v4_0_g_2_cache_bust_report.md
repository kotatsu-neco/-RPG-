# v4.0-g.2 Boot Cache Bust 実装報告

## 目的

iPhone Safariなどで古いJS/CSS/画像/JSONが残り、ゲーム表示が不安定になる問題を避けるため、起動時のキャッシュ対策を強化した。

## 重要な前提

JavaScriptからSafariのHTTPキャッシュそのものを完全削除することはできない。  
そのため、起動ごとにURLへ一意のboot tokenを付与し、古いアセットを読みにくくする。

## 変更内容

```text
AssetLoaderにbootCacheTokenを追加
JSON / 画像読み込みURLへ v=<version>&boot=<bootCacheToken> を付与
fetchに cache: "reload" を指定
clearRuntimeCache() を追加
getCacheDebugInfo() を追加
window.matsuyoiCacheDebug() を追加
index.htmlにno-cache系meta hintを追加
CSS/JS参照を v4.0-g.2 に更新
```

## Debug

ブラウザconsoleで以下を実行すると、現在のcache状態を確認できる。

```js
window.matsuyoiCacheDebug()
```

## 注意

index.html自体が古くキャッシュされている場合、アプリ内JSが実行される前なので完全な対策はできない。  
ただし、index.htmlが新しく読まれた後のJSON・画像アセットについては起動ごとのcache bustが効く。
