import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
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
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0f0f0f',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              fontSize: '13px',
              fontFamily: 'var(--font-geist-sans)',
              padding: '12px 18px',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: { primary: '#d4af37', secondary: '#000' },
              style: {
                border: '1px solid rgba(212,175,55,0.2)',
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#000' },
              style: {
                border: '1px solid rgba(239,68,68,0.2)',
              },
            },
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
