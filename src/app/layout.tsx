import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eThekwini Property Research - Real Estate Zoning & Development Analysis",
  description: "Multi-agent AI system for comprehensive property research including zoning, cadastral data, SG diagrams, development rights, and feasibility analysis for Durban/eThekwini properties.",
  keywords: ["zoning", "real estate", "Durban", "South Africa", "town planning", "eThekwini", "property research", "AI agents", "cadastral", "SG diagram", "development rights", "feasibility"],
  authors: [{ name: "eThekwini Property Research Team" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "eThekwini Property Research Agent Swarm",
    description: "Comprehensive property analysis with real-time agent swarm - Zoning, Cadastral, SG Diagrams, Development Rights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "eThekwini Property Research",
    description: "Real-time property analysis for Durban properties",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
