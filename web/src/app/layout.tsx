import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketChatter",
  description:
    "Live prediction market signals from curated X sources across AI, geopolitics, crypto, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050509] text-zinc-100`}
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1a2e_0,_#050509_55%,_#000_100%)] text-zinc-100">
          {children}
        </div>
      </body>
    </html>
  );
}

