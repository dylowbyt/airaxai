import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIRAX AI - Platform AI Generasi Terbaru",
  description: "Ciptakan Influencer AI yang Tak Terbedakan dari Manusia Nyata bersama AIRAX AI.",
  keywords: ["AI", "influencer", "konten digital", "kecerdasan buatan", "AIRAX AI", "Andi Pebrianto"],
  openGraph: {
    title: "AIRAX AI - Platform AI Generasi Terbaru",
    description: "Ciptakan Influencer AI yang Tak Terbedakan dari Manusia Nyata bersama AIRAX AI.",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "AIRAX AI Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
