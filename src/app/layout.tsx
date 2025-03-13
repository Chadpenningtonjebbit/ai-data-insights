import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CSVProvider } from "@/contexts/csv-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Insights Platform",
  description: "Upload your CSV data and get AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CSVProvider>
          {children}
          <Toaster />
        </CSVProvider>
      </body>
    </html>
  );
}
