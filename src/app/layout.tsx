import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InaZine",
  description: "That's a great idea! Why don't you put it in a zine?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script src="/scripts/jquery.js" strategy="beforeInteractive" />
        <Script src="/scripts/turn.js" strategy="beforeInteractive" />
        <Script id="turn-init" strategy="afterInteractive">
          {`
            $(document).ready(function() {
              if ($(".flipbook").length) {
                $(".flipbook").turn();
                $(".flipbook").css("visibility", "visible").css("opacity", 1);
              }
            });
          `}
        </Script>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
