import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";

export const metadata: Metadata = {
  title: "AI 스킬 허브",
  description:
    "웹 에이전시의 워크플로우를 자동화하는 AI 스킬 마켓플레이스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
