"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Share2, BookOpen } from "lucide-react"
import { getBlogBySlug, getPublishedBlogs, type BlogPost } from "@/lib/blogs-data"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LoadingScreen } from "@/components/loading-screen"
import { Card, CardContent } from "@/components/ui/card"

export default function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getBlogBySlug(slug),
      getPublishedBlogs()
    ]).then(([blogData, allBlogs]) => {
      if (blogData) {
        setBlog(blogData)
        
        const related = allBlogs
          .filter(b => b.id !== blogData.id && b.status === "published")
          .slice(0, 3)
        setRelatedBlogs(related)
        
        setIsLoading(false)
      } else {
        window.location.href = "/guides"
      }
    }).catch((error) => {
      console.error('Failed to load blog:', error)
      setIsLoading(false)
    })
  }, [slug])

  if (isLoading || !blog) {
    return <LoadingScreen message="Loading guide..." />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0"></div>

      <SiteHeader />

      {/* Article Header */}
      <article className="pt-32 pb-12 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back Buttons */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back to Home</span>
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back to Guides</span>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-8">
            {blog.category && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-4">
                {blog.category}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 font-display leading-tight">
              {blog.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {blog.author && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">By {blog.author}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
              {blog.readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{blog.readTime} min read</span>
                </div>
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: blog.title,
                      text: blog.excerpt,
                      url: window.location.href,
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert("Link copied to clipboard!")
                  }
                }}
                className="flex items-center gap-2 hover:text-purple-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </header>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg prose-purple max-w-none mb-12">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
              style={{
                lineHeight: "1.8",
              }}
            />
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-12 pt-8 border-t border-purple-200">
              <h3 className="text-sm font-semibold text-foreground mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedBlogs.length > 0 && (
            <section className="mt-16 pt-12 border-t border-purple-200">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h2 className="text-2xl font-bold text-foreground">Related Guides</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Link key={relatedBlog.id} href={`/guide/${relatedBlog.slug}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 hover:border-primary cursor-pointer">
                      <CardContent className="p-6">
                        {relatedBlog.category && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-3">
                            {relatedBlog.category}
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                          {relatedBlog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {relatedBlog.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(relatedBlog.createdAt)}</span>
                          {relatedBlog.readTime && (
                            <>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{relatedBlog.readTime} min</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}

