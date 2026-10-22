import type { Metadata, Viewport } from "next";
import { Poppins, Russo_One } from "next/font/google";
import "./globals.css";
import { FORM_META } from "@/lib/form-content";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
// Solid display face for the form's big headings.
const russo = Russo_One({ subsets: ["latin"], weight: "400", variable: "--font-russo", display: "swap" });

export const metadata: Metadata = {
  title: "Ride Along Form",
  description: FORM_META.description,
  icons: { icon: "/Favicon.ico" },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${russo.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
