"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, ArrowRight, Clock, BookOpen } from "lucide-react"
import Link from "next/link"
import { getPublishedBlogs, type BlogPost } from "@/lib/blogs-data"
import { LoadingScreen } from "@/components/loading-screen"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function GuidesPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getPublishedBlogs().then((blogsList) => {
      setBlogs(blogsList)
      setIsLoading(false)
    }).catch((error) => {
      console.error('Failed to load blogs:', error)
      setIsLoading(false)
    })
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

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
            <BookOpen className="w-4 h-4" />
            <span>Expert Guides & Tips</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-4 text-balance leading-tight font-display">
            Casino <span className="text-purple-600">Guides & Tips</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Learn everything you need to know about casino bonuses, CS2 gambling, and maximizing your rewards.
          </p>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {blogs.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg font-medium">No guides available yet.</p>
              <p className="text-muted-foreground text-sm mt-2">Check back soon for new guides!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/guide/${blog.slug}`}>
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:border-purple-300 cursor-pointer group bg-white border-purple-100 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      {/* Category Badge */}
                      {blog.category && (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-4">
                          {blog.category}
                        </div>
                      )}

                      {/* Icon and Meta Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors shadow-md">
                          <FileText className="w-7 h-7 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(blog.createdAt)}</span>
                            </div>
                            {blog.readTime && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{blog.readTime} min read</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {blog.excerpt}
                      </p>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:text-purple-700 transition-colors pt-4 border-t border-purple-100">
                        <span>Read Guide</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

