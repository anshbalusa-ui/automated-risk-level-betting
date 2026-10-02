import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Archivo_Black, DM_Sans } from "next/font/google";
import "./globals.css";


const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-rogue-body",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  variable: "--font-rogue-display",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RØGUE — Forecast Studio",
  description: "A simulation-only forecasting agent that shows its work.",
  icons: { icon: `${process.env.NEXT_PUBLIC_APP_BASE_PATH ?? ""}/icon.svg` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${dmSans.variable} ${archivoBlack.variable}`}>
      <body className="min-h-full flex flex-col"><SmoothScroll/><AgentProvider>{children}</AgentProvider></body>
    </html>
  );
}
