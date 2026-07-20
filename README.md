# 名画320 - ヨーロッパ名画学習

iPhone/iPadのSafariで使える、ヨーロッパの名画321点を学ぶPWA(Progressive Web App)です。
ギャラリー、学習モード(時代順ウォークスルー)、クイズモード(間隔反復学習)の3つの機能で名画を楽しく学べます。

公開URL: https://kimuhixy-ux.github.io/euro-art-masterpieces/

## iPhoneでの使い方

1. SafariでURLを開きます。
2. 共有ボタン(四角と上矢印のアイコン)を押します。
3. 「ホーム画面に追加」を選びます。
4. ホーム画面のアイコンから起動すると、フルスクリーンで使えます。

一度開いたあとは、Service Workerのキャッシュによりオフラインでも表示・学習できます
(閲覧済みの作品画像もキャッシュされます)。

## ローカル確認

MacやPCで確認する場合、このフォルダに移動してローカルサーバーを起動します。

```bash
python3 -m http.server 8000
```

その後、ブラウザで以下を開きます。

```text
http://localhost:8000
```

## 機能

- **ギャラリー**: 321点の名画を一覧表示。検索・時代/ジャンルでの絞り込み・並び替えに対応
- **詳細画面**: ピンチズーム・ダブルタップズーム対応の画像表示、成り立ち/テーマ/作者/意義/見どころのタブ、前後の作品への移動
- **学習モード**: 国際ゴシックからエコール・ド・パリまで、19の美術様式を時代順に辿るウォークスルー。様式の切り替わりで解説カードを表示
- **クイズモード**: 作品名当て・作者当て・説明文当ての3種類の問題。ライトナーシステム(間隔反復)で正答率の低い作品を優先的に復習出題。成績はブラウザに保存され次回も引き継がれる
- オフライン対応(Service Worker)、ダークモード

## 画像について

作品画像はすべて[Wikimedia Commons](https://commons.wikimedia.org/)から直接読み込んでいます(著作権保護期間が満了したパブリックドメインの作品のみ)。画像ファイルはリポジトリに含まれていません。

`verify_images.py` を実行すると、`data/paintings.json` に登録された全画像URLが実在するか検証できます。

```bash
python3 verify_images.py
```

## ファイル構成

```
index.html          画面本体(ギャラリー/詳細/学習/クイズ)
css/style.css        スタイル(ダークモード)
js/
  app.js              画面切り替え(ルーター)
  data.js             データ読み込み・並び替え
  storage.js          クイズ・学習進捗のlocalStorage管理
  gallery.js          ギャラリー画面
  detail.js           詳細画面・ピンチズーム
  timeline.js         学習モード
  quiz.js             クイズモード
data/
  paintings.json      作品データ(321点)
  movements.json      美術様式データ(19様式)
manifest.json         PWAマニフェスト
sw.js                 Service Worker(オフラインキャッシュ)
icons/                アプリアイコン
verify_images.py       画像URL検証スクリプト
```
