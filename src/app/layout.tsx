import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import { Outfit, Sora } from "next/font/google";
import "./globals.css";


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-rogue-body",
  display: "swap",
});

const sora = Sora({
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
    <html lang="en" className={`h-full antialiased ${outfit.variable} ${sora.variable}`}>
      <body className="min-h-full flex flex-col"><AgentProvider>{children}</AgentProvider></body>
    </html>
  );
}
