"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, X, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { blogsApi } from "@/lib/api-client"
import { getCurrentUser, hasPermission } from "@/lib/user-data"
import { RichTextEditor } from "@/components/rich-text-editor"
import Link from "next/link"
import { clearBlogCache } from "@/lib/blogs-data"

interface BlogPost {
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

export default function BlogsPage() {
  const { toast } = useToast()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tagInput, setTagInput] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "published",
    author: "",
    category: "",
    featuredImage: "",
    readTime: "",
    tags: [] as string[],
  })

  useEffect(() => {
    loadBlogs()
    getCurrentUser().then((user) => {
      setCurrentUser(user)
    })
  }, [])

  const loadBlogs = async () => {
    try {
      setIsLoading(true)
      const response = await blogsApi.getAll({ limit: 1000 })
      if (response.data && Array.isArray(response.data)) {
        const transformedBlogs = response.data.map((blog: any) => ({
          id: String(blog.id),
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          author: blog.author,
          category: blog.category,
          featuredImage: blog.featured_image || blog.featuredImage,
          status: blog.status || "draft",
          createdAt: blog.created_at || blog.createdAt,
          updatedAt: blog.updated_at || blog.updatedAt,
          readTime: blog.read_time || blog.readTime,
          tags: blog.tags || [],
        }))
        setBlogs(transformedBlogs)
      }
    } catch (error) {
      console.error('Failed to load blogs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load blogs. Please refresh the page.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canManageBlogs = hasPermission(currentUser, "publish_content")

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      author: "",
      category: "",
      featuredImage: "",
      readTime: "",
      tags: [],
    })
    setTagInput("")
  }

  const handleEdit = (blog: BlogPost) => {
    setEditingId(blog.id)
    setIsCreating(false)
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      status: blog.status,
      author: blog.author || "",
      category: blog.category || "",
      featuredImage: blog.featuredImage || "",
      readTime: blog.readTime?.toString() || "",
      tags: blog.tags || [],
    })
    setTagInput("")
  }

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.excerpt || !formData.content) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in title, slug, excerpt, and content fields.",
      })
      return
    }

    try {
      const blogData: any = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        status: formData.status,
        tags: formData.tags,
      }

      if (formData.author) blogData.author = formData.author
      if (formData.category) blogData.category = formData.category
      if (formData.featuredImage) blogData.featuredImage = formData.featuredImage
      if (formData.readTime) blogData.readTime = parseInt(formData.readTime) || null

      if (editingId) {
        await blogsApi.update(editingId, blogData)
        toast({
          variant: "success",
          title: "Blog Post Updated",
          description: "Blog post has been successfully updated.",
        })
      } else {
        await blogsApi.create(blogData)
        toast({
          variant: "success",
          title: "Blog Post Created",
          description: "New blog post has been successfully created.",
        })
      }

      clearBlogCache()
      await loadBlogs()
      setIsCreating(false)
      setEditingId(null)
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        status: "draft",
        author: "",
        category: "",
        featuredImage: "",
        readTime: "",
        tags: [],
      })
      setTagInput("")
    } catch (error: any) {
      console.error('Failed to save blog:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save blog. Please try again.",
      })
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this blog post?")
    if (!confirmed) return

    try {
      await blogsApi.delete(id)
      clearBlogCache()
      await loadBlogs()
      toast({
        variant: "success",
        title: "Blog Post Deleted",
        description: "Blog post has been successfully deleted.",
      })
    } catch (error: any) {
      console.error('Failed to delete blog:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete blog. Please try again.",
      })
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      author: "",
      category: "",
      featuredImage: "",
      readTime: "",
      tags: [],
    })
    setTagInput("")
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!canManageBlogs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs & Guides Management</h1>
          <p className="text-muted-foreground">You don't have permission to manage blogs and guides.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs & Guides Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage your blog posts and guides</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Blog Post" : "Create New Blog Post"}</CardTitle>
            <CardDescription>Fill in the details for your blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog post title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="blog-post-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the blog post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                content={formData.content}
                onSave={(content) => {
                  setFormData({ ...formData, content })
                }}
                onCancel={() => {}}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Category"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "draft" | "published" })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>Manage your published and draft blog posts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading blogs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No blog posts yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.title}</TableCell>
                      <TableCell>{blog.category || "-"}</TableCell>
                      <TableCell>
                        {blog.tags && blog.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {blog.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {blog.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{blog.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            blog.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {blog.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(blog.createdAt)}</TableCell>
                      <TableCell>{formatDate(blog.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="View" asChild>
                            <Link href={`/guide/${blog.slug}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(blog)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(blog.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
