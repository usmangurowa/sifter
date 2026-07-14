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
  applicationName: "Sifter",
  title: "Sifter - Shop Smarter on Temu and SHEIN",
  description:
    "Tell Sifter what you want to buy and get material-aware Temu and SHEIN search terms, quality tips, and discount codes.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Sifter",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Sifter - Shop Smarter on Temu and SHEIN",
    description:
      "Get quality-focused search terms for clothing and accessories on Temu and SHEIN.",
    url: "https://usesifter.xyz",
    siteName: "Sifter",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Sifter logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/android-chrome-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2557f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
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
