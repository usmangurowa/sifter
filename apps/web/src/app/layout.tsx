import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/app/styles.css";

import { Providers } from "@/components/providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemeProvider } from "@turbo/ui/theme";
import { Toaster } from "@turbo/ui/toast";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://usesifter.xyz"),
  title: "Sifter - Shop Smarter on Temu and SHEIN",
  description:
    "Tell Sifter what you want to buy and get material-aware Temu and SHEIN search terms, quality tips, and discount codes.",
  openGraph: {
    title: "Sifter - Shop Smarter on Temu and SHEIN",
    description:
      "Get quality-focused search terms for clothing and accessories on Temu and SHEIN.",
    url: "https://usesifter.xyz",
    siteName: "Sifter",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#11100e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakartaSans.className} ${jakartaSans.variable} antialiased`}
      >
        <ThemeProvider>
          <NuqsAdapter>
            <Providers>
              {children}
              <SpeedInsights />
              <Analytics />
            </Providers>
          </NuqsAdapter>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
