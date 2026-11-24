import type { Metadata } from "next";
import { Bodoni_Moda, Fraunces, Outfit } from "next/font/google";
import { connection } from "next/server";
import { Providers } from "@/components/providers";
import { storefront } from "@/content/storefront";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const hero = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-hero",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: storefront.metaTitle,
    template: `%s · ${storefront.name}`,
  },
  description: storefront.metaDescription,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport = {
  themeColor: "#E10600",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <html lang="en-IN">
      <body className={`${display.variable} ${sans.variable} ${hero.variable} bg-paper font-sans text-charcoal antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
