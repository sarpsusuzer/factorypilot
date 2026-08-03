import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { IdentityGate } from "@/components/identity";
import { SiteNav } from "@/components/site-nav";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FactoryPilot",
  description: "Küçük üretim işletmeleri için sipariş takibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          <IdentityGate>{children}</IdentityGate>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
