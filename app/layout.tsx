import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../src/index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Providers } from "./providers";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CyberQuiz - Teste ta vigilance numérique",
  description: "Quiz interactif sur la cybersécurité alimenté par l'IA. Testez vos connaissances en matière de sécurité numérique à travers différents modes de jeu.",
  authors: [{ name: "CyberQuiz" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "CyberQuiz - Teste ta vigilance numérique",
    description: "Quiz interactif sur la cybersécurité alimenté par l'IA",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberQuiz - Teste ta vigilance numérique",
    description: "Quiz interactif sur la cybersécurité alimenté par l'IA",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:p-4 focus:rounded-lg">
              Passer au contenu principal
            </a>
            <Toaster />
            <Sonner />
            <main id="main-content">
              {children}
            </main>
            <AccessibilitySettings />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
