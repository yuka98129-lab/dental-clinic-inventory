# 歯科医院 在庫管理システム

歯科医院向けの、消耗品在庫管理システムです。カテゴリー・品目・個別商品の3階層で在庫を整理し、閾値を下回った商品をアラート表示します。

## 概要

多くの歯科医院では、日々の忙しさから消耗品の在庫切れに気づけないという課題があります。本プロジェクトは、その課題を解決する軽量な在庫管理機能のMVP(最小限の実用製品)です。

- 「カテゴリー(大分類)→ 品目 → 個別商品」の3階層で消耗品を管理
- 品目名・商品名・カテゴリー名から横断的に検索
- 在庫数が閾値を下回った商品を一覧・詳細どちらの画面でもアラート表示
- ホーム画面から各商品の在庫数をその場で直接編集可能

予約管理・患者管理・スタッフログインなどの機能は今回のスコープ外です(将来的な拡張として`requirements.md`に記載)。

## 技術スタック

- [Next.js](https://nextjs.org/)(App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)(Postgres, Row Level Security)
- [Vercel](https://vercel.com/)(想定ホスティング先)

## 主な機能

- **在庫一覧・検索**(`/inventory`): カテゴリーごとに商品を一覧表示。品目名・商品名・カテゴリー名での検索に対応。
- **在庫数のインライン編集**: 一覧画面上で直接、在庫数を更新可能(詳細画面への遷移不要)。
- **閾値アラート**: 在庫数が閾値以下になった商品を、一覧・詳細の両画面でハイライト表示。
- **品目・商品の登録**(`/inventory/[itemTypeId]`): 品目ごとの商品一覧と、メーカー・保管場所・備考を含む商品登録フォーム。

## セットアップ

```bash
npm install
```

`.env.local` に Supabase の接続情報を設定してください(このファイルはコミットされません):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

DBスキーマは Supabase の SQL Editor 上で `item_types` / `products` テーブルを作成して用意します(詳細は `CLAUDE.md` を参照)。

```bash
npm run dev
```

## その他のコマンド

- `npm run build` — 本番ビルド
- `npm run lint` — ESLint
- `npx tsc --noEmit` — 型チェック

## ドキュメント

- `requirements.md` — 要件定義書(日本語)
- `CLAUDE.md` — 現在のアーキテクチャ・データモデル・既知の制約(セキュリティ上の暫定対応など)
