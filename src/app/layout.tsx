import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { League_Spartan } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const leagueSpartan = League_Spartan({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-league-spartan",
});

export const metadata: Metadata = {
  title: "3AM Collective Movement",
  description: "Join the collective movement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${leagueSpartan.variable}`}>
      <body>{children}</body>
    </html>
  );
}