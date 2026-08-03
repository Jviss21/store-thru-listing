import type { Metadata } from "next";
import { Syne, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { OrgProvider } from "@/components/OrgProvider";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Test Goodwill — Store thru Listing",
    template: "%s · Test Goodwill",
  },
  description:
    "Test Goodwill inventory demo — store thru listing with Infinity AI Auto-List, powered by hammoq.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/hammoq-logo.png" }],
    apple: "/hammoq-logo.png",
  },
  openGraph: {
    title: "Test Goodwill — Store thru Listing",
    description: "Customer pilot demo powered by hammoq / Infinity AI.",
    siteName: "Test Goodwill",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
        <AuthProvider>
          <OrgProvider>
            <AppShell>{children}</AppShell>
          </OrgProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
