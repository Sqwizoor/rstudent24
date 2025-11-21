import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next";
import { Barlow } from 'next/font/google';
import "./globals.css";
import { PreloadScripts } from "@/components/PreloadScripts";

// Load Barlow font with essential weights only (400 and 700)
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // ✨ NEW: Optimized to just 3 weights (was 6)
  style: ['normal'], // ✨ NEW: Removed italic (not used widely)
  variable: '--font-barlow',
  display: 'swap', // ✨ Shows system font while loading
  preload: true, // ✨ NEW: Preload critical font
});
import "@aws-amplify/ui-react/styles.css";
import Providers from "./providers";
import { useGetAuthUserQuery } from "@/state/api";
import { useEffect, useState } from 'react';

export const metadata: Metadata = {
  title: "Student24 - Your Best Student Housing Platform",
  description: "Find perfect student accommodation close to your campus. Connect students with landlords. Search, apply, and book your ideal room today.",
  keywords: ["student housing", "accommodation", "rental", "student homes", "South Africa"],
  authors: [{ name: "Student24" }],
  viewport: "width=device-width, initial-scale=1",
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
        {/* End Meta Pixel Code */}
      </head>
      <body className={`${barlow.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          position="bottom-right"
          closeButton
          richColors
          duration={4000}
        />
        {/* Add a script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {
                  console.error('Failed to set initial theme:', e);
                }
              })();
            `
          }}
        />
      </body>
    </html>
  );
}
