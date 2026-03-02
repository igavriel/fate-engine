import type { Metadata } from "next";
import { Uncial_Antiqua, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const uncial = Uncial_Antiqua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fate Engine",
  description: "Web RPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${uncial.variable} ${plex.variable} antialiased font-ui`}>{children}</body>
    </html>
  );
}
