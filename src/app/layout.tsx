import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const montserrat = Montserrat({ variable: "--font-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "FertiSmart - AI-Powered Fertilizer & Farming Assistant",
  description:
    "Multimodal AI platform for fertilizer planning, crop recommendation, disease diagnosis, and multilingual farming assistance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${montserrat.variable} antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
