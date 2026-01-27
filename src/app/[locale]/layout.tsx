import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

import type { Metadata } from "next";
import { Noto_Sans, Playfair_Display } from "next/font/google"; // Use Noto Sans for IKEA style + Playfair for luxury headings
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Harkat Furniture - Solusi Perabot Rumah",
  description: "Furniture minimalis dan fungsional dengan harga terjangkau",
  keywords: ["Furniture", "Minimalist", "Promo", "IKEA Style", "Indonesia"],
  authors: [{ name: "Harkat Furniture Team" }],
  openGraph: {
    title: "Harkat Furniture",
    description: "Furniture minimalis dan fungsional",
    type: "website",
  },
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
 
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
            <Providers>
            {children}
            <Toaster />
            </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
