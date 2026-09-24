import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "歯科医院 在庫管理",
  description: "歯科医院向けの消耗品在庫管理システム",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b bg-background sticky top-0 z-10">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:px-8">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold hover:bg-muted"
            >
              🦷 ホーム(カテゴリー一覧)に戻る
            </Link>
            <Link
              href="/inventory/trash"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              🗑️ ゴミ箱
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
