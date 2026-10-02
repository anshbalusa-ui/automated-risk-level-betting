import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-rogue-body",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-rogue-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RØGUE — Forecast Studio",
  description: "A simulation-only forecasting agent that shows its work.",
  icons: { icon: `${process.env.NEXT_PUBLIC_APP_BASE_PATH ?? ""}/icon.svg` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${interTight.variable}`}>
      <body className="min-h-full flex flex-col"><SmoothScroll/><AgentProvider>{children}</AgentProvider></body>
    </html>
  );
}
