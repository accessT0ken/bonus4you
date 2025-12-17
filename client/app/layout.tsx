import type React from "react"
import type { Metadata } from "next"
import { Oswald, Poppins } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"
import { RadixToastProvider } from "@/components/radix-toast"
import { Toaster } from "@/components/ui/toaster"
import { ApiLoadingScreen } from "@/components/api-loading-screen"

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

const drukWide = localFont({
  src: "../fonts/DrukWideLCGWebMediumRegular.ttf",
  variable: "--font-druk-wide",
  display: "swap",
  weight: "500",
})

export const metadata: Metadata = {
  title: "Bonus4You - Best CS2 Skin Gambling & Trading Platforms",
  description:
    "Discover the best CS2 skin casinos, marketplaces, and trading platforms. Compare bonuses, features, and find your perfect match.",
  icons: {
    icon: [
      {
        url: "/assets/BONUS4YOU_DARK_BLURRY.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/assets/BONUS4YOU_BLURRY.png",
        media: "(prefers-color-scheme: dark)",
      }
    ],
    apple: "/assets/BONUS4YOU_DARK_BLURRY.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${poppins.variable} ${drukWide.variable} font-sans antialiased`}>
        <ApiLoadingScreen>
          <AuthProvider>
            <RadixToastProvider>
              {children}
            </RadixToastProvider>
            <Toaster />
          </AuthProvider>
        </ApiLoadingScreen>
        
        <Analytics />
      </body>
    </html>
  )
}
