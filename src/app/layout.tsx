import { Toaster } from "@/components/ui/sonner"
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Barlow } from "next/font/google";
import { PreloadScripts } from "@/components/PreloadScripts";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Providers from "./providers";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Student24 - Your Best Student Housing Platform",
  description: "Find perfect student accommodation close to your campus. Connect students with landlords. Search, apply, and book your ideal room today.",
  keywords: ["student housing", "accommodation", "rental", "student homes", "South Africa"],
  authors: [{ name: "Student24" }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://student24.co",
    siteName: "Student24",
    title: "Student24 - Your Best Student Housing Platform",
    description: "Find perfect student accommodation close to your campus. Connect students with landlords.",
    images: [
      {
        url: "https://student24.co/og-image.png",
        width: 1200,
        height: 630,
        alt: "Student24 - Student Housing Platform",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Student24 - Your Best Student Housing Platform",
    description: "Find perfect student accommodation close to your campus.",
    images: ["https://student24.co/og-image.png"],
  },
  metadataBase: new URL('https://student24.co'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PreloadScripts />
      </head>
      <body className={`${barlow.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || 'G-3W05VRQPJF'} />
        <Toaster 
          position="bottom-right"
          closeButton
          richColors
          duration={4000}
        />
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '24977904821878954');
              fbq('track', 'PageView');
            `
          }}
        />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=24977904821878954&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
