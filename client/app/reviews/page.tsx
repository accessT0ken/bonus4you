"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, FileText, Eye } from "lucide-react"
import Link from "next/link"
import { getCasinos, type Casino } from "@/lib/casino-data"
import { LoadingScreen } from "@/components/loading-screen"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ReviewsPage() {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCasinos().then((allCasinos) => {
      // Only show casinos with reviews that are published
      setCasinos(allCasinos.filter((c) => c.hasReview && c.status === "published"))
      setIsLoading(false)
    }).catch((error) => {
      console.error('Failed to load casinos:', error)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Gradient background */}
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0"></div>

      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold mb-4 shadow-md shadow-purple-500/40">
            <FileText className="w-4 h-4" />
            <span>Expert Casino Reviews</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-4 text-balance leading-tight font-display">
            In-Depth <span className="text-purple-600">Casino Reviews</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Read our comprehensive reviews of the best CS2 and casino platforms. We test every site so you don't have to.
          </p>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {casinos.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg font-medium">No reviews available yet.</p>
              <p className="text-muted-foreground text-sm mt-2">Check back soon for new casino reviews!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {casinos.map((casino) => (
                <Link key={casino.id} href={`/review/${casino.slug}`}>
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:border-purple-300 cursor-pointer group bg-white border-purple-100 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      {/* Logo and Rating */}
                      <div className="flex flex-col items-center text-center mb-4">
                        <div className="w-24 h-24 rounded-2xl border-2 border-purple-200 overflow-hidden mb-4 bg-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <img
                            src={casino.logo || "/placeholder.svg"}
                            alt={casino.name}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-600 transition-colors">{casino.name}</h3>
                        <div className="flex gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 transition-all ${
                                i < Math.floor(casino.rating)
                                  ? "fill-purple-600 text-purple-600"
                                  : i < casino.rating
                                  ? "fill-purple-300 text-purple-300"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-foreground">{casino.rating.toFixed(1)}</span>
                        </div>
                        {casino.bonusText && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
                            <span>{casino.bonusText}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {casino.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 text-left">{casino.description}</p>
                      )}

                      {/* Stats and CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-purple-100">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          <span>{casino.stats.reviewReads.toLocaleString()} reads</span>
                        </div>
                        <span className="text-sm font-semibold text-purple-600 group-hover:text-purple-700 transition-colors">
                          Read Review →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

