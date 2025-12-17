"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp, Eye, Building2 } from "lucide-react"
import { statsApi } from "@/lib/api-client"
import { getCurrentUser, hasPermission } from "@/lib/user-data"

interface DashboardStats {
  casinos: {
    total: number;
    published: number;
    withReviews: number;
    totalLandingViews: number;
    totalClaimClicks: number;
    totalReviewReads: number;
    claimConversionRate: number;
    reviewConversionRate: number;
  };
  blogs: {
    total: number;
    published: number;
  };
  users: {
    total: number;
    active: number;
  };
  totalPageViews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user)
    })

    statsApi.getStats()
      .then((response) => {
        if (response.data) {
          setStats(response.data)
        }
      })
      .catch((error) => {
        console.error('Failed to load stats:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const canViewStats = hasPermission(currentUser, "view_stats")

  const statsCards = stats ? [
    {
      title: "Total Page Views",
      value: stats.totalPageViews.toLocaleString(),
      change: `${stats.casinos.claimConversionRate.toFixed(1)}%`,
      icon: Eye,
      description: "All casino views",
    },
    {
      title: "Blog Posts",
      value: stats.blogs.published.toString(),
      change: `${stats.blogs.total} total`,
      icon: FileText,
      description: "Published articles",
    },
    {
      title: "Published Casinos",
      value: stats.casinos.published.toString(),
      change: `${stats.casinos.total} total`,
      icon: Building2,
      description: "Active casinos",
    },
    {
      title: "Claim Clicks",
      value: stats.casinos.totalClaimClicks.toLocaleString(),
      change: `${stats.casinos.claimConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Conversion rate",
    },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your site.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 font-semibold">{stat.change}</span> {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New blog post published</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Stats updated</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">User analytics refreshed</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/admin/blogs"
                className="block w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium">Write New Blog Post</p>
                <p className="text-xs text-muted-foreground">Create and publish a new article</p>
              </a>
              <a
                href="/admin/stats"
                className="block w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium">View Detailed Stats</p>
                <p className="text-xs text-muted-foreground">Check analytics and metrics</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

