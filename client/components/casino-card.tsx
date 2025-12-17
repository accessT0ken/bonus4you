"use client"

import type { JSX } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sparkles,
  ChevronDown,
  Wallet,
  CreditCard,
  DollarSign,
  Bitcoin,
  Coins,
  Shield,
  Crown,
  Zap,
} from "lucide-react"
import Link from "next/link"
import {
  trackLandingPageView,
  trackClaimBonusClick,
  type Casino,
  paymentMethods,
  casinoTags,
  type CasinoTag,
  type PaymentMethod,
} from "@/lib/casino-data"

export function CasinoCard({ casino }: { casino: Casino }) {
  const [paymentIndex, setPaymentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("right")
  
  useEffect(() => {
    trackLandingPageView(casino.slug)
  }, [casino.slug])

  const handleClaimBonus = (e: React.MouseEvent) => {
    e.preventDefault()
    trackClaimBonusClick(casino.slug)
    window.open(`/go/${casino.slug}`, "_blank")
  }

  const iconMap: Record<string, JSX.Element> = {
    bitcoin: <Bitcoin className="w-4 h-4 text-primary" />,
    ethereum: <Coins className="w-4 h-4 text-primary" />,
    wallet: <Wallet className="w-4 h-4 text-primary" />,
    card: <CreditCard className="w-4 h-4 text-primary" />,
    usd: <DollarSign className="w-4 h-4 text-primary" />,
  }

  const tags: CasinoTag[] = (casino.tagIds || [])
    .map((id: string) => casinoTags.find((t) => t.id === id))
    .filter((t): t is CasinoTag => Boolean(t))

  const methods = (casino.paymentMethodIds || [])
    .map((id: string) => paymentMethods.find((m: PaymentMethod) => m.id === id))
    .filter((m): m is PaymentMethod => Boolean(m))

  const maxPaymentIndex = Math.max(0, methods.length - 3)

  const handlePrevPayments = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (paymentIndex > 0 && !isTransitioning) {
      setDirection("left")
      setIsTransitioning(true)
      setTimeout(() => {
        setPaymentIndex((prev) => Math.max(0, prev - 1))
        setTimeout(() => setIsTransitioning(false), 50)
      }, 150)
    }
  }

  const handleNextPayments = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (paymentIndex < maxPaymentIndex && !isTransitioning) {
      setDirection("right")
      setIsTransitioning(true)
      setTimeout(() => {
        setPaymentIndex((prev) => Math.min(maxPaymentIndex, prev + 1))
        setTimeout(() => setIsTransitioning(false), 50)
      }, 150)
    }
  }

  const visibleMethods = methods.slice(paymentIndex, paymentIndex + 3)

  const viewsText = `${casino.stats.landingPageViews.toLocaleString("en-US")} views`
  const clicksText = `Bonus clicks: ${casino.stats.claimBonusClicks.toLocaleString("en-US")}`

  return (
    <div className="relative">
      <Card
        className={`relative w-full overflow-hidden border border-purple-100 shadow-md hover:shadow-xl hover:border-purple-300 transition-all duration-300 rounded-2xl bg-transparent p-0 gap-0 hover:scale-[1.02] hover-scale ${
          casino.isFeatured ? "ring-2 ring-purple-400 shadow-purple-500/40 scale-[1.01]" : ""
        }`}
      >
      {/* Featured - Enhanced eye-catching effects */}
      {casino.isFeatured && (
        <>
          {/* Animated gradient border */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 via-fuchsia-500 to-purple-600 opacity-75 animate-gradient-x blur-sm"></div>
          
          {/* Pulsing glow effect */}
          <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-fuchsia-500/50 blur-xl animate-pulse-slow"></div>
          
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-2xl"></div>
          
          {/* Enhanced badge with crown */}
          <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-500 text-white px-3.5 py-1.5 text-[10px] font-bold shadow-lg shadow-purple-500/50 animate-bounce-subtle border-2 border-white/30">
            <Crown className="w-3.5 h-3.5 animate-pulse" fill="currentColor" />
            <span className="relative">
              <span className="absolute inset-0 blur-sm opacity-75">Most popular</span>
              <span className="relative">Most popular</span>
            </span>
            <Sparkles className="w-3 h-3 animate-spin-slow" />
          </div>
          
          {/* Floating sparkles */}
          <div className="absolute top-6 right-6 z-20 pointer-events-none">
            <div className="relative w-8 h-8">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-ping absolute" />
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse absolute top-1 left-1" />
            </div>
          </div>
          
          {/* Animated corner accent */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/30 to-transparent rounded-bl-full pointer-events-none">
            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        </>
      )}

      <div className="relative flex flex-col md:flex-row bg-[#F9F5FF] backdrop-blur-sm text-[#000025] min-h-full z-10">
        {/* Logo column - full white background */}
        <div className="w-full md:w-1/4 md:min-w-[190px] flex items-center justify-center p-4 bg-white self-stretch">
          <div className="w-full max-w-[190px] rounded-2xl bg-white px-4 py-3 flex items-center justify-center">
            <img
              alt={casino.name}
              src={casino.logo || "/placeholder.svg"}
              className="object-contain w-full h-16 md:h-20"
            />
          </div>
        </div>

        {/* Main + right content */}
        <div className="flex md:flex-row flex-1 min-h-full">
          {/* Main content */}
          <div className="flex-1 p-4 md:pr-0 md:min-w-0 flex flex-col self-stretch">
          {/* Top row: name + small tag */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide truncate">{casino.name}</h2>
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border mr-5 ${
                casino.tagType === "free"
                  ? "bg-emerald-100/70 text-emerald-900 border-emerald-200"
                  : "bg-purple-100/70 text-purple-900 border-purple-200"
              }`}
            >
              {casino.tagText}
            </div>
          </div>

          {/* Highlight badges */}
          {tags.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-2 mt-1">
              {tags.map((tag: CasinoTag) => (
                <div
                  key={tag.id}
                  className="inline-flex items-center bg-purple-100/70 px-2 py-1 rounded-full text-[10px] text-purple-900 border border-purple-200"
                >
                  <span>{tag.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rating + stats + bottom info row */}
          <div className="mt-4 pt-3 border-t border-[#000025]/10">
            {/* First row: Rating, Min deposit, License */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-[11px] mb-2">
              {/* Rating semicircle chart */}
              <div className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center max-w-[70px] md:mr-2">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16" viewBox="0 0 36 36">
                      <path
                        d="M 18,18 m -15,0 a 15,15 0 0,1 30,0"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      />
                      <path
                        d="M 18,18 m -15,0 a 15,15 0 0,1 30,0"
                        fill="none"
                        stroke="rgb(147, 51, 234)"
                        strokeWidth="3"
                        strokeDasharray={`${(casino.rating / 5) * 47.12} 47.12`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-[#000025] leading-none">
                        {casino.rating.toFixed(1)} ⭐
                      </span>
                      <span className="text-[8px] text-[#000025]/60 font-medium leading-none mt-0.5">Rating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Min deposit + license (desktop layout) */}
              <div className="hidden md:flex md:items-center md:h-12 md:flex-shrink-0">
              {casino.minDeposit && (
                <>
                  <div className="h-8 border-r border-[#000025]/20 ml-1 mr-2" />
                  <div className="flex items-center px-2">
                    <Wallet className="w-4 h-4 mr-1.5 text-purple-600" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">
                        {casino.minDeposit.replace(/[€£]/, "$")}
                      </span>
                      <span className="text-[11px] text-[#000025]/70 font-medium">Min. deposit</span>
                    </div>
                  </div>
                </>
              )}

                {casino.license && (
                  <>
                    <div className="h-8 border-r border-[#000025]/20 mx-2" />
                    <div className="flex items-center px-2">
                      <Shield className="w-4 h-4 mr-1.5 text-purple-600" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{casino.license}</span>
                        <span className="text-[11px] text-[#000025]/70 font-medium">License</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Second row: Views/clicks and Payments */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-[11px]">
              {/* Views / clicks pills */}
              <div className="flex items-center gap-2 text-[#000025]/70 flex-shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-white/60 border border-white text-[10px] font-semibold whitespace-nowrap">
                  {viewsText}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/60 border border-white text-[10px] font-semibold whitespace-nowrap">
                  {clicksText}
                </span>
              </div>

              {/* Payments slider-style */}
              {methods.length > 0 && (
                <div className="flex items-center ml-auto md:ml-0 space-x-1 md:space-x-2 md:mt-0 w-auto md:flex-shrink-0">
                <button
                  type="button"
                  onClick={handlePrevPayments}
                  className="w-5 h-5 flex items-center justify-center hover:bg-[#000025]/10 rounded-full transition-all duration-200 text-[#000025] border border-[#000025]/20 disabled:opacity-40 disabled:cursor-default hover:scale-110 active:scale-95"
                  aria-label="Previous payment method"
                  disabled={paymentIndex === 0 || isTransitioning}
                >
                  <ChevronDown className="w-3 h-3 rotate-90" />
                </button>
                <div className="relative flex items-center space-x-1 overflow-hidden max-w-[120px] md:max-w-[150px] h-10 md:h-10">
                  <div 
                    className={`flex items-center space-x-1 transition-all duration-300 ease-in-out ${
                      isTransitioning 
                        ? direction === "right" 
                          ? "translate-x-[-100%] opacity-0 scale-95" 
                          : "translate-x-[100%] opacity-0 scale-95"
                        : "translate-x-0 opacity-100 scale-100"
                    }`}
                  >
                    {visibleMethods.map((method: PaymentMethod, idx: number) => (
                      <div
                        key={`${method.id}-${paymentIndex}-${idx}`}
                        className={`w-8 h-8 md:w-10 md:h-10 backdrop-blur-sm rounded-md flex items-center justify-center border border-[#000025]/20 shadow-sm overflow-hidden bg-white/80 flex-shrink-0 transition-all duration-300 ${
                          isTransitioning ? "blur-sm" : "blur-0"
                        }`}
                      >
                        {method.type === "image" ? (
                          <img
                            src={method.value}
                            className="w-full h-full object-contain p-1"
                            alt={method.name}
                          />
                        ) : (
                          iconMap[method.value] || <span className="text-[10px]">?</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNextPayments}
                  className="w-5 h-5 flex items-center justify-center hover:bg-[#000025]/10 rounded-full transition-all duration-200 text-[#000025] border border-[#000025]/20 disabled:opacity-40 disabled:cursor-default hover:scale-110 active:scale-95"
                  aria-label="Next payment method"
                  disabled={paymentIndex >= maxPaymentIndex || isTransitioning}
                >
                  <ChevronDown className="w-3 h-3 -rotate-90" />
                </button>
              </div>
            )}
            </div>
          </div>
          </div>

          {/* Right column: bonus + CTA */}
          <div className="w-full md:w-56 md:border-l border-purple-200 bg-white p-4 flex flex-col justify-between gap-3 self-stretch">
            <div>
              <p className="text-[11px] font-semibold text-[#000025]/70 mb-1">For new players</p>
              <p className="text-base sm:text-lg font-extrabold text-[#000025] leading-snug">
                {casino.bonusText}
              </p>
              <p className="text-[11px] text-[#000025]/70 mt-1">
                + {casino.rewardsCount} extra rewards
              </p>
            </div>

            <div className="space-y-1">
              <Button
                onClick={handleClaimBonus}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 text-sm shadow-md shadow-purple-500/30 hover:scale-105 transition-all duration-300"
              >
                Claim Bonus
              </Button>
              {casino.hasReview && (
                <Link
                  href={`/review/${casino.slug}`}
                  className="block text-[11px] text-[#000025]/70 hover:text-purple-700 transition-colors text-center"
                >
                  See our review of {casino.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
    </div>
  )
}

