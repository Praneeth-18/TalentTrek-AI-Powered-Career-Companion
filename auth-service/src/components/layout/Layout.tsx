import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

interface LayoutProps {
  username: string | null;
  children: ReactNode;
}

export function Layout({ username, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header username={username} />
      <main className="container mx-auto px-4 py-16">
        {children}
      </main>
    </div>
  );
} 