import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rentledger.online"),
  title: {
    default: "RentLedger — Rent Management & Ledger for Landlords",
    template: "%s | RentLedger",
  },
  description:
    "RentLedger is your digital rent notebook — track rent payments, electricity bills, water charges, and tenants online. Free rent ledger for landlords. Replaces your physical rent register and khata book. Manage carry forward, receipts and multiple properties.",
  keywords: [
    "rent management app",
    "landlord app india",
    "rent ledger",
    "rent notebook",
    "ledger for rent",
    "khata",
    "kiraya khata",
    "rent khata book",
    "online rent khata",
    "digital kiraya khata",
    "tenant management",
    "rent tracker",
    "rent receipt generator india",
    "property management india",
    "rent billing software",
    "monthly rent tracker",
    "rent payment record",
  ],
  openGraph: {
    title: "RentLedger — Rent Management for Landlords",
    description:
      "Track rent, bills, electricity and tenants in one place. Free rent ledger for landlords.",
    url: "https://www.rentledger.online",
    siteName: "RentLedger",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RentLedger — Rent Management for Landlords",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RentLedger — Rent Management for Landlords",
    description:
      "Track rent, bills, and tenants in one place. Free for landlords.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Analytics />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#333",
                color: "#fff",
                padding: "16px",
                borderRadius: "8px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
