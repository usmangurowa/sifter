import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/app/styles.css";

import { Providers } from "@/components/providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemeProvider } from "@turbo/ui/theme";
import { ThemeScript } from "@turbo/ui/theme-script";
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
    "Stop wasting money on clothes that fade, shrink, or look cheap. Sifter turns what you want into material-aware search terms.",
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
      "Stop wasting money on clothes that fade, shrink, or look cheap. Get material-aware search terms for Temu and SHEIN.",
    url: "https://usesifter.xyz",
    siteName: "Sifter",
    images: [
      {
        url: "/social-card.png",
        width: 1200,
        height: 630,
        alt: "Sifter landing page with AI shopping assistant prompt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sifter - Shop Smarter on Temu and SHEIN",
    description:
      "Stop wasting money on clothes that fade, shrink, or look cheap. Get material-aware search terms for Temu and SHEIN.",
    images: ["/social-card.png"],
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
        <ThemeScript />
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
