import type { Metadata } from "next";
import { Bungee, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const bungee = Bungee({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameHub Arena",
  description: "Online gaming hub with themed experiences and polished mini-games.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${bungee.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
