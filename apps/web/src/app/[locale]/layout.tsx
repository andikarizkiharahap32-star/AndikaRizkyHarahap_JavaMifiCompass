import React from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import '../globals.css';

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
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="flex flex-col min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar currentLocale={locale} />
          <main className="flex-1">{children}</main>
          <Footer currentLocale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
