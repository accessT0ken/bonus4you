"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Trophy,
  Shield,
  Sparkles,
  Coins,
  Star,
  Gift,
  Zap,
  ChevronDown,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getCasinos,
  type Casino,
} from "@/lib/casino-data"
import { LoadingScreen } from "@/components/loading-screen"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CasinoCard } from "@/components/casino-card"
import { SupportChatWidget } from "@/components/support-chat-widget"

export default function Home() {
  const [casinoCategory, setCasinoCategory] = useState<"cs2" | "general">("cs2")
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get only published casinos from API
    getCasinos().then((allCasinos) => {
      setCasinos(allCasinos.filter((c: Casino) => c.status === "published"))
      setIsLoading(false)
    }).catch((error) => {
      console.error('Failed to load casinos:', error)
      setIsLoading(false)
    })
  }, [])

  const filteredCasinos = casinos.filter((casino) => {
    const c = casino as Casino
    return c.category === casinoCategory
  })

  // Sort: featured first, then by rating
  const sortedCasinos = [...filteredCasinos].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return b.rating - a.rating
  })

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0"></div>

      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold mb-4 shadow-md shadow-purple-500/40">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            Claim the best casino bonuses in one place
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-4 text-balance leading-tight font-display">
            Find Your Next <span className="text-purple-600">Free Bonus</span> Today
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Compare exclusive free spins, no-deposit offers, and big welcome bonuses. See what you can get before you
            sign up.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/casinos">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 h-12 shadow-lg shadow-purple-500/40 hover:scale-105 transition-all duration-300"
              >
                See All Bonuses
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="font-semibold text-lg px-8 h-12 border-2 bg-transparent hover:scale-105 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({
                  behavior: "smooth",
                })
              }}
            >
              How It Works
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div
            onClick={() => {
              document.getElementById("casinos")?.scrollIntoView({
                behavior: "smooth",
              })
            }}
            className="mt-16 flex flex-col items-center animate-bounce cursor-pointer"
          >
            <p className="text-sm text-muted-foreground mb-2 font-medium">
              Scroll to see bonuses
            </p>
            <ChevronDown className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
        </div>
      </section>

      <section className="py-20 px-4" id="casinos">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-display">
              Top Casinos
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Discover the best CS2 and traditional casinos with the most generous welcome offers and free bonuses.
            </p>

            {/* Category Selector */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <div className={`flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-purple-100 shadow-sm relative sliding-bg ${casinoCategory === "general" ? "active-right" : ""}`} style={{ width: '160px' }}>
                <button
                  onClick={() => setCasinoCategory("cs2")}
                  className={`px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative z-10 outline-none focus:outline-none min-w-0 ${
                    casinoCategory === "cs2"
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  CS2
                </button>
                <button
                  onClick={() => setCasinoCategory("general")}
                  className={`px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative z-10 outline-none focus:outline-none min-w-0 ${
                    casinoCategory === "general"
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  General
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sortedCasinos.slice(0, 5).map((casino: Casino, index: number) => (
              <div key={casino.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <CasinoCard casino={casino} />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href={`/casinos/${casinoCategory}`}>
              <div className="inline-flex items-center gap-2 group cursor-pointer">
                <span className="text-purple-600 font-semibold text-base group-hover:text-purple-700 transition-colors duration-300">
                  See All Casinos
                </span>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-sm group-hover:bg-purple-600/30 transition-all duration-300"></div>
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <svg 
                      className="w-4 h-4 text-white transform group-hover:translate-x-0.5 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {sortedCasinos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No casinos found for the selected category.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
              <Zap className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance font-display">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Getting your casino bonus is quick and easy. Follow these simple steps to start winning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Browse Bonuses</h3>
              <p className="text-muted-foreground">
                Explore our curated list of the best casino bonuses. Compare offers, read reviews, and find the perfect match for you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Claim Your Bonus</h3>
              <p className="text-muted-foreground">
                Click the "Claim Bonus" button on any casino you like. You'll be redirected to the casino's website to create your account.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Start Playing</h3>
              <p className="text-muted-foreground">
                Once registered, your bonus will be automatically credited to your account. Start playing and enjoy your rewards!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-white to-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
              <Gift className="w-4 h-4" />
              Why use bonus4you?
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance font-display">
              Unlock Massive Bonuses & Rewards
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant access to exclusive free spins, deposit bonuses, and cashback rewards – all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-white to-primary/5 hover:scale-105 hover-scale">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg hover:scale-110 transition-transform duration-300">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Free Bonuses</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Find no-deposit deals and free spins so you can try casinos without risking your own money.
                </p>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary">
                  Start for free
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-white to-primary/5 hover:scale-105 hover-scale">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Big Welcome Offers</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Compare 100%+ welcome bonuses side by side and see exactly what you get on your first deposit.
                </p>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary">
                  Up to €500+
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-white to-primary/5 hover:scale-105 hover-scale">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg hover:scale-110 transition-transform duration-300">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Daily Value</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Rakeback, reloads, and loyalty rewards – we highlight casinos that keep giving after the first bonus.
                </p>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary">
                  Every day
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105 hover-scale">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Top Picks Only</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We focus on a curated list of casinos instead of listing everything – less noise, more value.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105 hover-scale">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Safe & Trusted</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every casino is checked for licenses, security, and payout reputation before we list it.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105 hover-scale">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Transparent Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We highlight wagering and key rules in simple language so you know exactly what you’re getting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600/10 via-fuchsia-500/10 to-purple-900/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">Ready to Claim Your Bonus?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of players who use bonus4you to find the best casino bonuses and maximize their winnings.
          </p>
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-10 h-14 shadow-lg shadow-purple-500/40 hover:scale-105 transition-all duration-300"
          >
            Browse All Bonuses
          </Button>
        </div>
      </section>

      <SiteFooter />
      <SupportChatWidget />
    </div>
  )
}
