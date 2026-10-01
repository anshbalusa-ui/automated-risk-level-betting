import type { Metadata } from "next";
import { AgentProvider } from "@/components/AgentProvider";
import "./globals.css";


export const metadata: Metadata = {
  title: "Fieldnote — Forecast Studio",
  description: "A simulation-only forecasting agent that shows its work.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AgentProvider>{children}</AgentProvider></body>
    </html>
  );
}
