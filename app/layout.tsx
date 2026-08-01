import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PwaRegister } from "@/components/pwa-register";

const playfairDisplayHeading = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WatDongOS",
  description: "ระบบบริหารจัดการภายในวัด",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WatDongOS"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", notoSansThai.variable, playfairDisplayHeading.variable)}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d97706" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isProd = ${process.env.NODE_ENV === 'production'};
                var basePath = isProd ? '/WatdongOS' : '';
                if (basePath) {
                  // Intercept Fetch calls
                  var originalFetch = window.fetch;
                  window.fetch = function(input, init) {
                    if (typeof input === 'string' && input.startsWith('/api/')) {
                      return originalFetch(basePath + input, init);
                    }
                    return originalFetch(input, init);
                  };

                  // Intercept Image element source sets
                  var originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
                  if (originalSrcDescriptor) {
                    Object.defineProperty(HTMLImageElement.prototype, 'src', {
                      set: function(val) {
                        if (typeof val === 'string' && val.startsWith('/api/')) {
                          originalSrcDescriptor.set.call(this, basePath + val);
                        } else {
                          originalSrcDescriptor.set.call(this, val);
                        }
                      },
                      get: function() {
                        return originalSrcDescriptor.get.call(this);
                      }
                    });
                  }
                }
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
