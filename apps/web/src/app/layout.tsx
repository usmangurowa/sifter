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
  metadataBase: new URL("https://kodohq.app"),
  title: "Kodo - Every Session Tells a Story",
  description:
    "Track your coding journey with meaningful context—not just hours. Smart session tracking that understands your work. Privacy-first.",
  openGraph: {
    title: "Kodo - Every Session Tells a Story",
    description:
      "Track your coding journey with meaningful context—not just hours. Smart session tracking that understands your work. Privacy-first.",
    url: "https://kodohq.app",
    siteName: "Kodo",
  },
  twitter: {
    card: "summary_large_image",
    site: "@kodoapp",
    creator: "@kodoapp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
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
