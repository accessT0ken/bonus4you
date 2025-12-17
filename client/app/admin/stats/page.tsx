"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Eye, MousePointerClick, FileText } from "lucide-react"
import { getCasinos, type Casino } from "@/lib/casino-data"
import { getCurrentUser, hasPermission } from "@/lib/user-data"

export default function StatsPage() {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch all casinos (not just published) for admin stats
    import("@/lib/api-client").then(({ casinosApi }) => {
      casinosApi.getAll({ limit: 1000 }).then((response) => {
        if (response.data && Array.isArray(response.data)) {
          const transformedCasinos = response.data.map((casino: any) => ({
            id: String(casino.id),
            name: casino.name,
            slug: casino.slug,
            logo: casino.logo,
            tagType: casino.tag_type || casino.tagType,
            tagText: casino.tag_text || casino.tagText,
            rating: casino.rating,
            bonusText: casino.bonus_text || casino.bonusText,
            rewardsCount: casino.rewards_count || casino.rewardsCount,
            category: casino.category,
            country: casino.country,
            status: casino.status,
            hasReview: casino.has_review === 1 || casino.hasReview,
            stats: {
              landingPageViews: casino.landing_page_views || casino.stats?.landingPageViews || 0,
              claimBonusClicks: casino.claim_bonus_clicks || casino.stats?.claimBonusClicks || 0,
              reviewReads: casino.review_reads || casino.stats?.reviewReads || 0,
            },
          }))
          setCasinos(transformedCasinos)
        }
      }).catch((error) => {
        console.error('Failed to load casinos:', error)
      }).finally(() => {
        setIsLoading(false)
      })
    })
    
    getCurrentUser().then((user) => {
      setCurrentUser(user)
    })
  }, [])

  const canViewStats = hasPermission(currentUser, "view_stats")

  if (!canViewStats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics & Analytics</h1>
          <p className="text-muted-foreground">You don't have permission to view statistics.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Casino Statistics</h1>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalLandingViews = casinos.reduce((sum, c) => sum + c.stats.landingPageViews, 0)
  const totalClaimClicks = casinos.reduce((sum, c) => sum + c.stats.claimBonusClicks, 0)
  const totalReviewReads = casinos.reduce((sum, c) => sum + c.stats.reviewReads, 0)
  const totalCasinos = casinos.length
  const publishedCasinos = casinos.filter((c) => c.status === "published").length
  const casinosWithReviews = casinos.filter((c) => c.hasReview).length

  // Calculate conversion rates
  const claimConversionRate =
    totalLandingViews > 0 ? ((totalClaimClicks / totalLandingViews) * 100).toFixed(2) : "0.00"
  const reviewConversionRate =
    totalLandingViews > 0 ? ((totalReviewReads / totalLandingViews) * 100).toFixed(2) : "0.00"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Casino Statistics</h1>
        <p className="text-muted-foreground">Track performance metrics for all casinos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Landing Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLandingViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All casino card views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claim Bonus Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaimClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conversion: <span className="font-semibold text-primary">{claimConversionRate}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Reads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviewReads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conversion: <span className="font-semibold text-primary">{reviewConversionRate}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Casinos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCasinos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {casinosWithReviews} with reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Casino Performance</CardTitle>
          <CardDescription>Detailed stats for each casino</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Casino</TableHead>
                <TableHead className="text-right">Landing Views</TableHead>
                <TableHead className="text-right">Claim Clicks</TableHead>
                <TableHead className="text-right">Review Reads</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casinos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No casinos found
                  </TableCell>
                </TableRow>
              ) : (
                casinos
                  .sort((a, b) => b.stats.landingPageViews - a.stats.landingPageViews)
                  .map((casino) => {
                    const clickRate =
                      casino.stats.landingPageViews > 0
                        ? ((casino.stats.claimBonusClicks / casino.stats.landingPageViews) * 100).toFixed(1)
                        : "0.0"
                    return (
                      <TableRow key={casino.id}>
                        <TableCell className="font-medium">{casino.name}</TableCell>
                        <TableCell className="text-right">{casino.stats.landingPageViews.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{casino.stats.claimBonusClicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {casino.hasReview ? (
                            casino.stats.reviewReads.toLocaleString()
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(clickRate) > 20 ? "text-green-600 font-semibold" : ""}>
                            {clickRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              casino.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {casino.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
