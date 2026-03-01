import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import CustomCursor from "@/components/CustomCursor";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Mindflare AI | Neural Infrastructure & Intelligent Systems",
  description: "Enterprise-grade AI SaaS platform for building, deploying, and scaling intelligent neural networks and applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <CustomCursor />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#536175',
                color: '#EAEAEA',
                border: '3px solid #3A4657',
                borderRadius: '0px',
                fontSize: '13px',
                fontFamily: "'VT323', monospace",
                padding: '12px 18px',
                boxShadow: '4px 4px 0px #2F3947',
              },
              success: {
                iconTheme: { primary: '#F2AEC0', secondary: '#2F3947' },
                style: {
                  border: '3px solid #F2AEC0',
                },
              },
              error: {
                iconTheme: { primary: '#D88A8A', secondary: '#2F3947' },
                style: {
                  border: '3px solid #D88A8A',
                },
              },
              duration: 3000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
