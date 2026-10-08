import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, khand, patrickHand } from "./fonts";
import { CartProvider } from "@/lib/cart";
import { AnimationProvider } from "@/components/providers/AnimationContext";
import SmoothScroll from "@/components/providers/SmoothScroll";
import PageTransition from "@/components/providers/PageTransition";
import Loader from "@/components/chrome/Loader";
import Header from "@/components/chrome/Header";
import CartDrawer from "@/components/chrome/CartDrawer";
import Cursor from "@/components/chrome/Cursor";
import CookieBanner from "@/components/chrome/CookieBanner";
import TitleTicker from "@/components/chrome/TitleTicker";

export const metadata: Metadata = {
  title: "Palmo | Cold-pressed coconut water",
  description: "One green coconut, opened and pressed within a day of harvest. 100% raw coconut water in six flavours, straight from the shell.",
  applicationName: "Palmo",
  authors: [{ name: "Palmo Coconut Co." }],
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f8f8f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${khand.variable} ${patrickHand.variable} min-h-full`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:font-patrick-hand focus:text-beige focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold"
        >
          Skip to main content
        </a>
        <AnimationProvider>
          <CartProvider>
            <SmoothScroll>
              <PageTransition>
                <Loader />
                <Header />
                {children}
                <CartDrawer />
                <CookieBanner />
                <Cursor />
                <TitleTicker />
              </PageTransition>
            </SmoothScroll>
          </CartProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}
