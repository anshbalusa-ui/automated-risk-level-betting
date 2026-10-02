import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import "./globals.css";


export const metadata: Metadata = {
  title: "RØGUE — Forecast Studio",
  description: "A simulation-only forecasting agent that shows its work.",
  icons: { icon: `${process.env.NEXT_PUBLIC_APP_BASE_PATH ?? ""}/icon.svg` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AgentProvider>{children}</AgentProvider></body>
    </html>
  );
}
