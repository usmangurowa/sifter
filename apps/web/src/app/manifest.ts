import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sifter",
    short_name: "Sifter",
    description:
      "AI-powered Temu and SHEIN shopping assistant for better search terms.",
    start_url: "/",
    display: "standalone",
    background_color: "#11100e",
    theme_color: "#d87327",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
