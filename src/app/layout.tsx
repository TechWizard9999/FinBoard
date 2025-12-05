import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinBoard - Finance Dashboard",
  description: "Build your custom real-time finance monitoring dashboard by connecting to various financial APIs",
  keywords: ["finance", "dashboard", "stocks", "crypto", "real-time", "widgets"],
  authors: [{ name: "FinBoard" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-900 text-slate-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
