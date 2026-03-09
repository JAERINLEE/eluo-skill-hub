import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";
import QueryProvider from "@/shared/infrastructure/tanstack-query/QueryProvider";
import CrossTabLogoutListener from "@/shared/ui/CrossTabLogoutListener";

const pretendard = localFont({
  src: "./font/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

const eluo = localFont({
  src: "./font/ELUOFACEVF.woff2",
  variable: "--font-eluo-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ELUO HUB",
    template: "%s | ELUO HUB",
  },
  description: "웹 에이전시의 워크플로우를 자동화하는 AI 스킬 마켓플레이스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${eluo.variable}`}>
      <body className="antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
        <CrossTabLogoutListener />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
