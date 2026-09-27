import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "./_components/toaster";
import { AppI18nProvider } from "@/i18n/provider";
import {
  DEFAULT_LOCALE,
  getMetadata,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
} from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const localizedMetadata = getMetadata(locale);

  return {
    title: localizedMetadata.title,
    description: localizedMetadata.description,
    icons: {
      icon: "/arco.svg",
      shortcut: "/arco.svg",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const initialLocale = cookieLocale ?? DEFAULT_LOCALE;

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppI18nProvider
          hasLocaleCookie={cookieLocale !== null}
          initialLocale={initialLocale}
        >
          {children}
          <AppToaster />
        </AppI18nProvider>
      </body>
    </html>
  );
}

async function getRequestLocale() {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value) ?? DEFAULT_LOCALE;
}
