import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReFramed",
  description: "Duel mobile 1v1 pour recréer des poses iconiques.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ReFramed",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      {/* Inline script: apply theme + locale BEFORE first paint to prevent flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t=localStorage.getItem('reframed_theme')||'dark';
            var l=localStorage.getItem('reframed_locale')||'fr';
            document.documentElement.setAttribute('data-theme',t);
            document.documentElement.lang=l;
          })();
        `}} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
