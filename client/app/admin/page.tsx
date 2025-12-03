"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp, Eye } from "lucide-react"

const stats = [
  {
    title: "Total Visitors",
    value: "12,543",
    change: "+12.5%",
    icon: Users,
    description: "Last 30 days",
  },
  {
    title: "Blog Posts",
    value: "24",
    change: "+3",
    icon: FileText,
    description: "Published articles",
  },
  {
    title: "Page Views",
    value: "45,231",
    change: "+8.2%",
    icon: Eye,
    description: "Last 30 days",
  },
  {
    title: "Growth Rate",
    value: "18.3%",
    change: "+2.1%",
    icon: TrendingUp,
    description: "Month over month",
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your site.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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

