import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SuppressHydrationWarnings from "@/components/utils/SuppressHydrationWarnings";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ 
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "TalentTrek",
  description: "Track and manage your job applications",
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    other: [
      {
        rel: 'icon',
        url: '/favicon.ico',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="msapplication-TileColor" content="#6366F1" />
      </head>
      <body className={`${inter.className} h-full`}>
        <SuppressHydrationWarnings />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
