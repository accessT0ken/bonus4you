"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
}

const mockBlogs: BlogPost[] = [
  {
    id: "1",
    title: "Best CS2 Casino Bonuses in 2025",
    slug: "best-cs2-casino-bonuses-2025",
    excerpt: "Discover the top CS2 casino bonuses available this year...",
    status: "published",
    createdAt: "2025-01-15",
    updatedAt: "2025-01-15",
  },
  {
    id: "2",
    title: "How to Claim Free Cases",
    slug: "how-to-claim-free-cases",
    excerpt: "A comprehensive guide to claiming free cases at CS2 casinos...",
    status: "published",
    createdAt: "2025-01-10",
    updatedAt: "2025-01-12",
  },
  {
    id: "3",
    title: "Understanding Rakeback Programs",
    slug: "understanding-rakeback-programs",
    excerpt: "Learn how rakeback works and maximize your earnings...",
    status: "draft",
    createdAt: "2025-01-20",
    updatedAt: "2025-01-20",
  },
]

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>(mockBlogs)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "published",
  })

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({ title: "", slug: "", excerpt: "", content: "", status: "draft" })
  }

  const handleEdit = (blog: BlogPost) => {
    setEditingId(blog.id)
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: "", // In real app, fetch full content
      status: blog.status,
    })
    setIsCreating(false)
  }

  const handleSave = () => {
    if (editingId) {
      // Update existing blog
      setBlogs(
        blogs.map((blog) =>
          blog.id === editingId
            ? {
                ...blog,
                ...formData,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : blog
        )
      )
      setEditingId(null)
    } else {
      // Create new blog
      const newBlog: BlogPost = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      setBlogs([newBlog, ...blogs])
      setIsCreating(false)
    }
    setFormData({ title: "", slug: "", excerpt: "", content: "", status: "draft" })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      setBlogs(blogs.filter((blog) => blog.id !== id))
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({ title: "", slug: "", excerpt: "", content: "", status: "draft" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage your blog posts</p>
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
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter blog post title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="blog-post-slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the blog post"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your blog post content here..."
                rows={10}
              />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No blog posts yet. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium">{blog.title}</TableCell>
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
                    <TableCell>{blog.createdAt}</TableCell>
                    <TableCell>{blog.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View">
                          <Eye className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  )
}

