# 献立アプリの更新のしかた

公開 URL: https://weekly-menu-sand.vercel.app/

---

## 【コードを直したあと】毎回やること

Mac で直したあと、**毎回この 3 ステップ** です。  
（`npm` は使いません。サイトの確認は Vercel で OK）

```
① Mac で直す
② GitHub に送る
③ サイトで確認する
```

### ① Mac で直す

Cursor でコードを直して、保存する。

### ② GitHub に送る

ターミナルを開いて、**1 行ずつ** Enter：

```bash
cd ~/weekly-menu
```

```bash
git add .
```

```bash
git commit -m "変更内容を短く書く"
```

（ `" "` の中は、何を直したか短く。例: `"アイコンを直した"`）

```bash
git push origin main
```

**ログインを聞かれたら**

| 項目 | 入力 |
|------|------|
| Username | `Metalman0114` |
| Password | GitHub の **トークン**（`ghp_...`）※普通のパスワードではない |

### ③ サイトで確認する

1. **1〜3 分** 待つ
2. https://weekly-menu-sand.vercel.app/ を開く
3. 古いままなら、ページを **強く更新**（更新ボタン長押し → 再読み込み）

---

## ざっくり（3ステップ）

```
① Cursor でコードを直す
② GitHub に送る（push）
③ Vercel が自動で新しい版を公開（数分）
```

**スマホの URL は変わりません。** 同じアドレスのまま中身だけ新しくなります。

---

## スマホでアプリのように使う（ホーム画面に追加）

公開 URL を **Safari（iPhone）** または **Chrome（Android）** で開いてください。

### iPhone（Safari）

1. https://weekly-menu-sand.vercel.app/ を **Safari** で開く（Chrome だと追加できません）
2. 下の **共有** ボタン（□に↑）をタップ
3. **ホーム画面に追加** → **追加**
4. ホーム画面の **こんだて帳** アイコンから起動（ブラウザの枠なし）

### Android（Chrome）

1. 同じ URL を Chrome で開く
2. 画面下の **インストール** ボタン、またはメニュー **⋮** → **アプリをインストール** / **ホーム画面に追加**
3. ホーム画面のアイコンから起動

※ 献立データは端末ごとに保存されます。別の端末では最初から空です。

---

## ① Cursor で直す

- **Mac の Cursor** で編集（おすすめ）
- ローカルで `npm run dev` しなくても OK（Vercel で確認できる）

---

## ② GitHub に送る（Mac の Cursor）

ターミナルで `weekly-menu` フォルダに入って：

```bash
cd ~/weekly-menu
```

（フォルダが別の場所なら、そのパスに合わせて変更）

```bash
git add .
git commit -m "変更内容を短く書く"
git push origin main
```

### ログインを聞かれたら

| 項目 | 入力 |
|------|------|
| Username | `Metalman0114` |
| Password | GitHub の **トークン**（`ghp_...`）※普通のパスワードではない |

トークンは GitHub → Settings → Developer settings → Personal access tokens で作成（**repo** にチェック）。

---

## ③ Vercel が自動更新

- push すると Vercel が勝手にビルド開始
- 1〜3分待つ
- https://weekly-menu-sand.vercel.app/ を開き直す（更新）

Vercel ダッシュボード: https://vercel.com

---

## 覚えておくこと

| 保存場所 | 中身 |
|----------|------|
| **GitHub** | アプリのコード |
| **Vercel** | 公開用にビルドしたもの |
| **スマホ** | 献立データ（localStorage・端末ごと） |

コードを更新しても、**スマホに保存した献立データは消えません**（通常）。

---

## 困ったとき

| 症状 | 対処 |
|------|------|
| `not a git repository` | `cd ~/weekly-menu` でフォルダに入る |
| `weekly-menu already exists` | clone 不要。`cd ~/weekly-menu` して `git pull origin main` |
| `npm: command not found` | この方法では npm 不要。無視して OK |
| `Repository not found` | トークンで push。古いログインは消す（DEPLOY 手順参照） |
| サイトが古いまま | 数分待ってスーパーリロード（Chrome で更新ボタン長押し） |

---

## 初回セットアップ（もう終わっている）

1. GitHub に箱: `Metalman0114/weekly-menu`
2. Vercel に Deploy → `weekly-menu-sand.vercel.app`

詳細はこのファイルより、会話で一緒に進めた手順を参照。
