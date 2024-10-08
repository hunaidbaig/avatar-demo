import "@/styles/globals.css";
import clsx from "clsx";
import { Metadata, Viewport } from "next";

import { Providers } from "./providers";

import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";
import NavBar from "@/components/NavBar";
import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import dynamic from "next/dynamic";
// import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";
const MicrophoneContextProvider = dynamic(() => import('./context/MicrophoneContextProvider').then(mod => mod.MicrophoneContextProvider), { ssr: false });

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Quantex AI",
    template: `%s - Quantex AI`,
  },
  icons: {
    icon: "/heygen-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} font-sans`}
    >
      <head />
      <body className={clsx("min-h-screen bg-background antialiased")}>
      <MicrophoneContextProvider>
          <DeepgramContextProvider>
            <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
              <main className="relative flex flex-col h-screen w-screen overflow-hidden">
                {/* <NavBar /> */}
                {children}
              </main>
            </Providers>
          </DeepgramContextProvider>
        </MicrophoneContextProvider>
      </body>
    </html>
  );
}
