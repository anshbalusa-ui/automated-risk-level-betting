import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./bitload.css";



export const metadata: Metadata = {
  title: "RØGUE | Forecast Studio",
  description: "A simulation-only forecasting workspace with transparent decisions.",
  icons: { icon: `${process.env.NEXT_PUBLIC_APP_BASE_PATH ?? ""}/icon.svg` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <AgentProvider>
          <div className="site-content">{children}</div>
        </AgentProvider>
      </body>
    </html>
  );
}
