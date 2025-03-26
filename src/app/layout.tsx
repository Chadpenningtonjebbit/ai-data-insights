import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DataSourceProvider } from "@/contexts/data-source-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jebbie Platform",
  description: "AI-powered data analysis platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DataSourceProvider>
          {children}
        </DataSourceProvider>
      </body>
    </html>
  );
}
