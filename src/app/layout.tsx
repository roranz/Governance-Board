import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Governance Board",
  description: "Tasks · Projects · Applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-fg">
        <div className="mx-auto w-full max-w-[960px] px-4 pb-10">
          <Header />
          <Nav />
          <main className="pb-5">{children}</main>
          <footer className="mt-2 border-t border-edge py-6 text-center text-[15px] font-medium text-fg-dim">
            Created by Paolo Mazio & Michele Bettin
          </footer>
        </div>
      </body>
    </html>
  );
}
