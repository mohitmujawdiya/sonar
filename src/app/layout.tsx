import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Sonar",
  description: "Founder evaluation for venture sourcing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-w-0 min-h-screen">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
