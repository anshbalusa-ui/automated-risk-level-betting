import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LiquidBackground } from "@/components/LiquidBackground";
import { Outfit } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-rogue-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RØGUE | Forecast Studio",
  description: "A simulation-only forecasting agent that shows its work.",
  icons: { icon: `${process.env.NEXT_PUBLIC_APP_BASE_PATH ?? ""}/icon.svg` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${outfit.variable}`}>
      <body className="min-h-full flex flex-col">
        <LiquidBackground />
        <SmoothScroll />
        <AgentProvider>
          <div className="site-content">{children}</div>
        </AgentProvider>
      </body>
    </html>
  );
}
