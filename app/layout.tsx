import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Cormorant_Garamond,
  IBM_Plex_Mono,
} from "next/font/google";

import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const APP_NAME = "Local PDF Toolkit";

const bodyFont = Bricolage_Grotesque({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Alat PDF yang berjalan 100% di browser — buka password, kompres, dan ubah PDF tanpa mengunggah file ke mana pun.",
  appleWebApp: {
    capable: true,
    title: "PDF Toolkit",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#bf5b3d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}
    >
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
