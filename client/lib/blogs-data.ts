// blogs-data.ts

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author?: string
  category?: string
  featuredImage?: string
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
  readTime?: number
  tags?: string[]
}

// Transform API response to BlogPost format
function transformApiBlog(apiBlog: any): BlogPost {
  return {
    id: String(apiBlog.id),
    title: apiBlog.title,
    slug: apiBlog.slug,
    excerpt: apiBlog.excerpt,
    content: apiBlog.content,
    author: apiBlog.author,
    category: apiBlog.category,
    featuredImage: apiBlog.featured_image || apiBlog.featuredImage,
    status: apiBlog.status || 'draft',
    createdAt: apiBlog.created_at || apiBlog.createdAt,
    updatedAt: apiBlog.updated_at || apiBlog.updatedAt,
    readTime: apiBlog.read_time || apiBlog.readTime,
    tags: apiBlog.tags || [],
  }
}

// Cache for client-side
let cachedBlogs: BlogPost[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Clear cache
export function clearBlogCache() {
  cachedBlogs = null
  cacheTimestamp = 0
}

// Get all blogs from API
export async function getBlogs(): Promise<BlogPost[]> {
  // Return cached data if available and fresh
  if (cachedBlogs && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedBlogs
  }

  // Server-side: return empty array (will be fetched via API routes)
  if (typeof window === "undefined") {
    return []
  }

  try {
    const { blogsApi } = await import('./api-client')
    const response = await blogsApi.getAll({ status: 'published' })
    
    if (response.data && Array.isArray(response.data)) {
      cachedBlogs = response.data.map(transformApiBlog)
      cacheTimestamp = Date.now()
      return cachedBlogs
    }
    
    return []
  } catch (error) {
    console.error('Failed to fetch blogs:', error)
    // Return cached data if available, even if stale
    if (cachedBlogs) {
      return cachedBlogs
    }
    return []
  }
}

// Get blog by slug
export async function getBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  if (typeof window === "undefined") {
    return undefined
  }

  try {
    const { blogsApi } = await import('./api-client')
    const response = await blogsApi.getBySlug(slug)
    
    if (response.data) {
      return transformApiBlog(response.data)
    }
    
    return undefined
  } catch (error) {
    console.error('Failed to fetch blog:', error)
    // Fallback to cache
    if (cachedBlogs) {
      return cachedBlogs.find(b => b.slug === slug)
    }
    return undefined
  }
}

// Get published blogs only
export async function getPublishedBlogs(): Promise<BlogPost[]> {
  const blogs = await getBlogs()
  return blogs.filter((b) => b.status === "published")
}

// Save blogs (for admin - updates API)
export async function saveBlogs(blogs: BlogPost[]): Promise<void> {
  // This is mainly for admin operations
  // Individual updates should use update functions
  clearBlogCache()
}
