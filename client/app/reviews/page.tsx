"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import Link from "next/link"
import { getCasinos, type Casino } from "@/lib/casino-data"

export default function ReviewsPage() {
  const [casinos, setCasinos] = useState<Casino[]>([])

  useEffect(() => {
    const allCasinos = getCasinos()
    // Only show casinos with reviews that are published
    setCasinos(allCasinos.filter((c) => c.hasReview && c.status === "published"))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4">
        <div className="container mx-auto px-4">
          <div className="bg-primary/10 backdrop-blur-md rounded-full border border-primary/20 shadow-lg">
            <div className="flex items-center justify-between px-6 h-16">
              <Link href="/" className="flex items-center gap-2">
                <img src="https://i.imgur.com/3Uc2Rke.png" alt="bonus4you" className="h-10 w-auto object-contain" />
              </Link>
              <Link
                href="/"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Casino Reviews</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Read our in-depth reviews of the best CS2 and casino platforms. We test every site so you don't have to.
            </p>
          </div>

          {casinos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No reviews available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {casinos.map((casino) => (
                <Link key={casino.id} href={`/review/${casino.slug}`}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 hover:border-primary cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center mb-4">
                        <div className="w-20 h-20 rounded-xl border-2 border-primary/20 overflow-hidden mb-4 bg-white flex items-center justify-center">
                          <img
                            src={casino.logo || "/placeholder.svg"}
                            alt={casino.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{casino.name}</h3>
                        <div className="flex gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < casino.rating ? "fill-primary text-primary" : "fill-gray-200 text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          <span className="font-semibold text-primary">{casino.bonusText}</span>
                        </div>
                      </div>
                      {casino.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{casino.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-xs text-muted-foreground">
                          {casino.stats.reviewReads} reads
                        </span>
                        <span className="text-sm font-semibold text-primary">Read Review →</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

