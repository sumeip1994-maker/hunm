import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "医学 PPT 制作助手",
  description: "Medical Presentation Studio"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
