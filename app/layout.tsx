import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "백합 Survey", description: "청주여고 학생들의 탐구와 의견 조사를 위한 설문 공유 공간", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body className="antialiased">{children}</body></html>; }
