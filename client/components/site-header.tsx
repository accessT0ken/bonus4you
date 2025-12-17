"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4">
      <div className="container mx-auto px-4">
        <div className="bg-purple-50/80 backdrop-blur-md rounded-full border border-purple-200 shadow-lg">
          <div className="flex items-center justify-between px-6 h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/BONUS4YOU_DARK_BLURRY.png" alt="bonus4you" className="h-10 w-auto object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <Link
                href="/"
                className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
              >
                Home
              </Link>
              <Link
                href="/casinos/cs2"
                className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
              >
                CS2 Bonuses
              </Link>
              <Link
                href="/casinos/general"
                className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
              >
                Casino Bonuses
              </Link>
              <Link
                href="/guides"
                className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
              >
                Guides
              </Link>
              <Link
                href="/reviews"
                className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
              >
                Reviews
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  <Link href="/admin">Dashboard</Link>
                </Button>
              ) : (
                <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  <Link href="/login">Login</Link>
                </Button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-foreground hover:text-primary transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden px-6 pb-6 animate-in slide-in-from-top duration-200">
              <nav className="flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                >
                  Home
                </Link>
                <Link
                  href="/casinos/cs2"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                >
                  CS2 Bonuses
                </Link>
                <Link
                  href="/casinos/general"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                >
                  Casino Bonuses
                </Link>
                <Link
                  href="/guides"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                >
                  Guides
                </Link>
                <Link
                  href="/reviews"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                >
                  Reviews
                </Link>
                {isAuthenticated ? (
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2">
                    <Link href="/admin">Dashboard</Link>
                  </Button>
                ) : (
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2">
                    <Link href="/login">Login</Link>
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

