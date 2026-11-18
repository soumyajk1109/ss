import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { connection } from "next/server";
import { Providers } from "@/components/providers";
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

export const metadata: Metadata = {
  title: {
    default: "SS — Dress for the climate",
    template: "%s · SS",
  },
  description:
    "Men's, women's, and kids' clothing for Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport = {
  themeColor: "#1B4D3E",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <html lang="en-IN">
      <body className={`${display.variable} ${sans.variable} bg-paper font-sans text-charcoal antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
