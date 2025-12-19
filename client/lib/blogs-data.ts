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

let cachedBlogs: BlogPost[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000

export function clearBlogCache() {
  cachedBlogs = null
  cacheTimestamp = 0
}

export async function getBlogs(): Promise<BlogPost[]> {
  if (cachedBlogs && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedBlogs
  }

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
    if (cachedBlogs) {
      return cachedBlogs
    }
    return []
  }
}

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
    if (cachedBlogs) {
      return cachedBlogs.find(b => b.slug === slug)
    }
    return undefined
  }
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
  const blogs = await getBlogs()
  return blogs.filter((b) => b.status === "published")
}

export async function saveBlogs(blogs: BlogPost[]): Promise<void> {
  clearBlogCache()
}
