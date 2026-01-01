import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPI Kiosk",
  description: "Raspberry Pi Kiosk Display",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-black text-white">{children}</body>
    </html>
  );
}
