import localFont from "next/font/local";

// Self-hosted Latin subsets pulled from the live palmo.co.in build.
export const inter = localFont({
  src: "../public/fonts/Inter-100-900.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const khand = localFont({
  src: [
    { path: "../public/fonts/Khand-300.woff2", weight: "300" },
    { path: "../public/fonts/Khand-400.woff2", weight: "400" },
    { path: "../public/fonts/Khand-500.woff2", weight: "500" },
    { path: "../public/fonts/Khand-600.woff2", weight: "600" },
    { path: "../public/fonts/Khand-700.woff2", weight: "700" },
  ],
  variable: "--font-khand",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const patrickHand = localFont({
  src: "../public/fonts/Patrick-Hand-400.woff2",
  weight: "400",
  variable: "--font-patrick-hand",
  display: "swap",
  adjustFontFallback: "Arial",
});
