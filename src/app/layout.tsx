import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Skills Hub",
  description: "内部 AI 技能与数字员工市场",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
