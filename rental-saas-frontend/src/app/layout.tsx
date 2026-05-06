import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zyprent",
  description: "Real Estate Investment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}

        {/* 🔥 ADD THIS */}
        <Script
          src="https://checkout.flutterwave.com/v3.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}