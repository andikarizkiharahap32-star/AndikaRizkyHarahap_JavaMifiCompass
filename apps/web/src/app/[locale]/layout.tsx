import React from 'react';
import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import '../globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return [{ locale: 'id' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="flex flex-col min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar currentLocale={locale} />
          <main id="main-content" tabIndex={-1} role="main" className="flex-1 focus:outline-none scroll-mt-28">
            {children}
          </main>
          <Footer currentLocale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
