import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

// 优化字体加载 - 使用 Inter 并启用字体优化
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // 使用 font-display: swap 优化加载
  variable: "--font-inter",
  preload: true,
});

export const metadata: Metadata = {
  title: "个人记账应用",
  description: "简单易用的个人财务管理工具",
  keywords: "记账,财务管理,预算管理,个人理财",
  authors: [{ name: "Finance App" }],
  openGraph: {
    title: "个人记账应用",
    description: "简单易用的个人财务管理工具",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        {/* 预连接到外部资源 */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
