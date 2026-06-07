import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "医学学术汇报工作台",
  description: "Medical Presentation Studio"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
