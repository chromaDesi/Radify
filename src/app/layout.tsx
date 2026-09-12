import type { Metadata } from "next";
import { Silkscreen, Pixelify_Sans, Press_Start_2P } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const pixelifySans = Pixelify_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Radify",
  description:
    "Mix your Spotify and YouTube playlists into one radio station, jukebox-in-a-sunlit-diner style.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${silkscreen.variable} ${pixelifySans.variable} ${pressStart2P.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
