import { Inter } from "next/font/google";
import "../globals.css";
import SuppressHydrationWarnings from "@/components/utils/SuppressHydrationWarnings";

const inter = Inter({ 
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4`}>
      <SuppressHydrationWarnings />
      {children}
    </div>
  );
} 