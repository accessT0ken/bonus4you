"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Shield, Sparkles, Coins, Menu, X, Star, Gift, Zap, ChevronDown,  Wallet, CreditCard, DollarSign, Bitcoin} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getCasinos, trackLandingPageView, trackClaimBonusClick, type Casino } from "@/lib/casino-data"
import { paymentMethods } from "@/lib/casino-data"

function CasinoCard({ casino }: { casino: Casino }) {
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Track landing page view when card is rendered
    trackLandingPageView(casino.slug)
  }, [casino.slug])

  const handleClaimBonus = (e: React.MouseEvent) => {
    e.preventDefault()
    trackClaimBonusClick(casino.slug)
    // In production, this would redirect to the casino's affiliate link
    window.open(`/go/${casino.slug}`, "_blank")
  }

  const iconMap: Record<string, JSX.Element> = {
    bitcoin: <Bitcoin className="w-4 h-4 text-primary" />,
    ethereum: <Coins className="w-4 h-4 text-primary" />,
    wallet: <Wallet className="w-4 h-4 text-primary" />,
    card: <CreditCard className="w-4 h-4 text-primary" />,
    usd: <DollarSign className="w-4 h-4 text-primary" />,
  }

  return (
    <div
      className="relative w-full max-w-[280px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden border-2 border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-xl">
        <div className="relative h-[420px] bg-white flex flex-col">
          <div className={`absolute left-5 transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
            <div
              className={`px-2 py-2 rounded-md text-xs font-bold ${
                casino.tagType === "free" ? "bg-green-100 text-green-700" : "bg-primary/20 text-primary"
              }`}
            >
              {casino.tagText}
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {/* Front of card */}
            <div
              className={`absolute inset-0 flex flex-col items-center px-6 pt-12 pb-4 transition-all duration-300 ${
                isHovered ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
              }`}
            >
              {/* Logo with gradient border */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/60 to-primary/30 rounded-xl blur-sm"></div>
                <div className="relative w-20 h-20 rounded-xl bg-white border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                  <img src={casino.logo || "/placeholder.svg"} alt={casino.name} className="w-16 h-16 object-contain" />
                </div>
              </div>

              {/* Casino name */}
              <h3 className="text-lg font-bold text-foreground mb-2">{casino.name}</h3>

              {/* Star rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < casino.rating ? "fill-primary text-primary" : "fill-gray-200 text-gray-200"}`}
                  />
                ))}
              </div>

              {/* Bonus text */}
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-3 min-h-[60px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-1">{casino.bonusText}</p>
                  <span className="inline-block px-2 py-0.5 bg-primary/20 rounded text-xs font-bold text-primary">
                    +{casino.rewardsCount} Rewards
                  </span>
                </div>
              </div>
            </div>

            {/* Back of card - hover state */}
            <div
              className={`absolute inset-0 flex flex-col px-6 pt-8 pb-4 transition-all duration-300 ${
                isHovered ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
              }`}
            >
              {/* Game modes */}
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 flex flex-col items-center gap-1.5">
                    {/* Crash icon */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <path
                        d="M1.61452 6.86515H3.17853C3.21209 6.86515 3.23894 6.85225 3.26579 6.8329L5.99777 4.00121L8.7029 6.80065L8.73646 6.8329C8.7566 6.85225 8.79016 6.86515 8.82372 6.86515H10.3877C10.4347 6.86515 10.475 6.83935 10.4884 6.8071C10.5086 6.77484 10.5018 6.73614 10.475 6.70389L6.08503 2.03386C6.04476 1.98871 5.9575 1.98871 5.91051 2.03386L1.52726 6.70389C1.50041 6.72969 1.4937 6.76194 1.50712 6.80065V6.8071C1.52726 6.83935 1.56754 6.86515 1.61452 6.86515Z"
                        fill="currentColor"
                      />
                      <path
                        d="M10.3809 10C10.4279 10 10.4681 9.97421 10.4816 9.94196C10.495 9.90971 10.495 9.871 10.4681 9.83875L6.09161 5.54284C6.03791 5.48479 5.95736 5.49124 5.91037 5.53639L1.52041 9.8452C1.50027 9.86455 1.49356 9.90325 1.50698 9.93551C1.52712 9.97421 1.5674 9.99356 1.60767 9.99356H10.3809V10Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold text-gray-600">Crash</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 flex flex-col items-center gap-1.5">
                    {/* Roulette icon */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <path
                        d="M11 5.63588C10.9557 4.99623 10.791 4.37558 10.5123 3.8056L9.47372 4.40725C9.65104 4.7999 9.76504 5.21156 9.80304 5.63588H11Z"
                        fill="currentColor"
                      />
                      <path
                        d="M3.78657 2.88727L3.18493 1.84863C2.92527 2.02596 2.67828 2.22862 2.45662 2.45661C2.25396 2.65927 2.06396 2.88093 1.8993 3.11526L2.8936 3.78024C3.1406 3.43191 3.43825 3.13426 3.78657 2.88727Z"
                        fill="currentColor"
                      />
                      <path
                        d="M5.99683 2.89362C4.28689 2.89362 2.8936 4.2869 2.8936 5.99685C2.8936 7.70679 4.28689 9.10008 5.99683 9.10008C7.70678 9.10008 9.10006 7.70679 9.10006 5.99685C9.10006 4.2869 7.71311 2.89362 5.99683 2.89362ZM5.99683 7.26347C5.30019 7.26347 4.73021 6.69349 4.73021 5.99685C4.73021 5.3002 5.30019 4.73022 5.99683 4.73022C6.69348 4.73022 7.26346 5.3002 7.26346 5.99685C7.26346 6.69982 6.69981 7.26347 5.99683 7.26347Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold text-gray-600">Roulette</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-semibold text-gray-600">+5</span>
                    <span className="text-[11px] font-semibold text-gray-600 mt-[-2px]">games</span>
                  </div>
                </div>
              </div>

              {/* Payment methods */}
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-gray-600 mb-2">Payment Methods</p>

                <div className="grid grid-cols-3 gap-1.5">
                  {(() => {
                    const ids = casino.paymentMethodIds || []
                    const methods = ids
                      .map((id) => paymentMethods.find((m) => m.id === id))
                      .filter(Boolean)

                    const total = methods.length
                    const maxToShow = 9
                    const visible = methods.slice(0, maxToShow)

                    return (
                      <>
                        {visible.map((method: any, i: number) => (
                          <div
                            key={i}
                            className="h-8 bg-gray-50 border border-gray-200 rounded flex items-center justify-center overflow-hidden"
                          >
                            {method.type === "image" ? (
                              <img
                                src={method.value}
                                className="w-full h-full object-contain p-0.5"
                                alt={method.name}
                              />
                            ) : (
                              iconMap[method.value] || <span className="text-xs">?</span>
                            )}
                          </div>
                        ))}

                        {/* 10+ Box */}
                        {total > 10 && (
                          <div className="h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                            <span className="text-[12px] font-semibold text-gray-700">{total}+</span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-4 space-y-2">
            <Button
              onClick={handleClaimBonus}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11"
            >
              Claim Bonus
            </Button>
            {casino.hasReview ? (
              <Link
                href={`/review/${casino.slug}`}
                className="block text-xs text-muted-foreground hover:text-primary transition-colors text-center leading-relaxed"
              >
                See our review about {casino.name}
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function Home() {
  const [casinoCategory, setCasinoCategory] = useState<"cs2" | "general">("cs2")
  const [selectedCountry, setSelectedCountry] = useState<"all" | "latvia" | "usa">("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [casinos, setCasinos] = useState<Casino[]>([])

  useEffect(() => {
    // Get only published casinos
    const allCasinos = getCasinos()
    setCasinos(allCasinos.filter((c) => c.status === "published"))
  }, [])

  const filteredCasinos = casinos.filter((casino) => {
    if (casinoCategory === "cs2") {
      return casino.category === "cs2"
    } else {
      if (selectedCountry === "all") {
        return casino.category === "general"
      }
      return casino.category === "general" && casino.country === selectedCountry
    }
  })

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-yellow-500/20 via-yellow-300/10 to-transparent pointer-events-none z-0"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4">
        <div className="container mx-auto px-4">
          <div className="bg-primary/10 backdrop-blur-md rounded-full border border-primary/20 shadow-lg">
            <div className="flex items-center justify-between px-6 h-16">
              <Link href="/" className="flex items-center gap-2">
                <img src="/assets/BONUS4YOU_DARK_BLURRY.png" alt="bonus4you" className="h-10 w-auto object-contain" />
              </Link>

              <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <Link
                  href="#"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  CS2 Bonuses
                </Link>
                <Link
                  href="#"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  Casino Bonuses
                </Link>
                <Link
                  href="#"
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

              {/* CTA Button */}
              <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <Link href="/login">Login</Link>
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-foreground hover:text-primary transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden px-6 pb-6 animate-in slide-in-from-top duration-200">
                <nav className="flex flex-col gap-4">
                  <Link
                    href="#"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    CS2 Bonuses
                  </Link>
                  <Link
                    href="#"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    Casino Bonuses
                  </Link>
                  <Link
                    href="#"
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
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2">
                    <Link href="/login">Login</Link>
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Comparing 100+ Casino Bonuses Daily
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance leading-tight font-display">
            Find The Best Casino Bonuses
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Compare exclusive casino bonuses, free spins, and deposit matches. We find the best deals so you don't have
            to.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 h-12"
            >
              View All Bonuses
            </Button>
            <Button size="lg" variant="outline" className="font-semibold text-lg px-8 h-12 border-2 bg-transparent">
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
              Scroll to see casinos
            </p>
            <ChevronDown className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-white to-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
              <Gift className="w-4 h-4" />
              Exclusive Benefits
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance font-display">
              Unlock Massive Bonuses & Rewards
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant access to exclusive free cases, deposit bonuses, and cashback rewards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-white to-primary/5">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Free Bonuses</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Claim up to <span className="font-bold text-primary">$50 in free cases</span> with no deposit
                  required. Start playing instantly!
                </p>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary">
                  Available Now
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-white to-primary/5">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Deposit Match</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Get up to <span className="font-bold text-primary">100% match</span> on your first deposit plus extra
                  rewards on every reload.
                </p>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary">
                  Up to $500
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-white to-primary/5">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Daily Rakeback</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Earn <span className="font-bold text-primary">5-15% rakeback</span> on all your bets. Get paid daily,
                  win or lose!
                </p>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary">
                  Every 24h
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">VIP Rewards</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Level up to unlock exclusive perks, higher rakeback, and premium customer support.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Instant Payouts</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cash out your winnings instantly to skins, crypto, or bank. No waiting, no hassle.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Verified Sites</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All platforms are thoroughly vetted for security, fairness, and reliability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4" id="casinos">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">Browse All Casinos</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Find the perfect casino with exclusive bonuses tailored for you
            </p>

            {/* Category Selector */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setCasinoCategory("cs2")}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 ${
                  casinoCategory === "cs2"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                CS2 Casinos
              </button>
              <button
                onClick={() => setCasinoCategory("general")}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105 ${
                  casinoCategory === "general"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                General Casinos
              </button>
            </div>

            {/* Country Filter - Only show for general casinos */}
            {casinoCategory === "general" && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2">Filter by country:</span>
                <button
                  onClick={() => setSelectedCountry("all")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    selectedCountry === "all"
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCountry("latvia")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    selectedCountry === "latvia"
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  🇱🇻 Latvia
                </button>
                <button
                  onClick={() => setSelectedCountry("usa")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    selectedCountry === "usa"
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  🇺🇸 USA
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCasinos.map((casino) => (
              <CasinoCard key={casino.id} casino={casino} />
            ))}
          </div>

          {filteredCasinos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No casinos found for the selected filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">Ready to Claim Your Bonus?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of players who use bonus4you to find the best casino bonuses and maximize their winnings.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-10 h-14"
          >
            Browse All Bonuses
          </Button>
        </div>
      </section>

      <footer className="py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-primary/5 backdrop-blur-sm rounded-3xl border border-primary/10 shadow-lg px-8 py-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex items-center gap-2 mb-3">
                <img src="/assets/BONUS4YOU_DARK_BLURRY.png" alt="bonus4you" className="h-12 w-auto object-contain" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Your trusted source for casino bonus comparisons and reviews since 2025
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                CS2 Bonuses
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Casino Bonuses
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Free Spins
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Guides
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Reviews
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>

            <div className="pt-6 border-t border-primary/10 text-center">
              <p className="text-sm text-muted-foreground">© 2025 bonus4you. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
