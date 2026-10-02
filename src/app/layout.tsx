import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";


const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-rogue-body",
  display: "swap",
});

const syne = Syne({
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
    <html lang="en" className={`h-full antialiased ${spaceGrotesk.variable} ${syne.variable}`}>
      <body className="min-h-full flex flex-col"><SmoothScroll/><AgentProvider>{children}</AgentProvider></body>
    </html>
  );
}
