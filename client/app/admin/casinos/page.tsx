"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react"
import { getCasinos, saveCasinos, type Casino } from "@/lib/casino-data"
import { getCurrentUser, hasPermission } from "@/lib/user-data"
import Link from "next/link"

export default function CasinosPage() {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Casino>>({
    name: "",
    slug: "",
    logo: "",
    tagType: "free",
    tagText: "",
    rating: 5,
    bonusText: "",
    rewardsCount: 0,
    category: "cs2",
    hasReview: false,
    status: "draft",
    description: "",
    founded: "",
    license: "",
    minDeposit: "",
    paymentMethods: [],
    games: [],
    promoCode: "",
    reviewContent: {
      sections: [],
      overview: "",
      verdict: "",
    },
  })

  useEffect(() => {
    setCasinos(getCasinos())
    setCurrentUser(getCurrentUser())
  }, [])

  const canManageCasinos = hasPermission(currentUser, "manage_casinos")

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: "",
      slug: "",
      logo: "",
      tagType: "free",
      tagText: "",
      rating: 5,
      bonusText: "",
      rewardsCount: 0,
      category: "cs2",
      hasReview: false,
      status: "draft",
      description: "",
      founded: "",
      license: "",
      minDeposit: "",
      paymentMethods: [],
      games: [],
      promoCode: "",
      reviewContent: {
        sections: [],
        overview: "",
        verdict: "",
      },
    })
  }

  const handleEdit = (casino: Casino) => {
    // Always redirect to review page with editor mode
    // If no review exists, it will be created when editor mode is enabled
    window.location.href = `/review/${casino.slug}?edit=true`
  }

  const handleSave = () => {
    const updatedCasinos = [...casinos]

    if (editingId) {
      // Update existing casino
      const index = updatedCasinos.findIndex((c) => c.id === editingId)
      if (index !== -1) {
        updatedCasinos[index] = {
          ...updatedCasinos[index],
          ...formData,
          id: editingId,
          stats: updatedCasinos[index].stats,
          updatedAt: new Date().toISOString().split("T")[0],
        }
      }
    } else {
      // Create new casino
      const newCasino: Casino = {
        id: Date.now().toString(),
        name: formData.name || "",
        slug: formData.slug || "",
        logo: formData.logo || "",
        tagType: formData.tagType || "free",
        tagText: formData.tagText || "",
        rating: formData.rating || 5,
        bonusText: formData.bonusText || "",
        rewardsCount: formData.rewardsCount || 0,
        category: formData.category || "cs2",
        country: formData.country,
        hasReview: formData.hasReview || false,
        status: formData.status || "draft",
        description: formData.description,
        founded: formData.founded,
        license: formData.license,
        minDeposit: formData.minDeposit,
        paymentMethods: formData.paymentMethods || [],
        games: formData.games || [],
        promoCode: formData.promoCode,
        reviewContent: formData.reviewContent,
        stats: {
          landingPageViews: 0,
          claimBonusClicks: 0,
          reviewReads: 0,
        },
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      updatedCasinos.push(newCasino)
    }

    saveCasinos(updatedCasinos)
    setCasinos(updatedCasinos)
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      name: "",
      slug: "",
      logo: "",
      tagType: "free",
      tagText: "",
      rating: 5,
      bonusText: "",
      rewardsCount: 0,
      category: "cs2",
      hasReview: false,
      status: "draft",
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this casino?")) {
      const updatedCasinos = casinos.filter((c) => c.id !== id)
      saveCasinos(updatedCasinos)
      setCasinos(updatedCasinos)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      name: "",
      slug: "",
      logo: "",
      tagType: "free",
      tagText: "",
      rating: 5,
      bonusText: "",
      rewardsCount: 0,
      category: "cs2",
      hasReview: false,
      status: "draft",
    })
  }

  const addPaymentMethod = () => {
    const method = prompt("Enter payment method:")
    if (method) {
      setFormData({
        ...formData,
        paymentMethods: [...(formData.paymentMethods || []), method],
      })
    }
  }

  const removePaymentMethod = (index: number) => {
    const methods = [...(formData.paymentMethods || [])]
    methods.splice(index, 1)
    setFormData({ ...formData, paymentMethods: methods })
  }

  const addGame = () => {
    const game = prompt("Enter game name:")
    if (game) {
      setFormData({
        ...formData,
        games: [...(formData.games || []), game],
      })
    }
  }

  const removeGame = (index: number) => {
    const games = [...(formData.games || [])]
    games.splice(index, 1)
    setFormData({ ...formData, games: games })
  }

  if (!canManageCasinos) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Casino Management</h1>
          <p className="text-muted-foreground">You don't have permission to manage casinos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Casino Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage casinos with optional reviews</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Casino
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Casino" : "Create New Casino"}</CardTitle>
            <CardDescription>Fill in the casino details. You can add a review later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Casino Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ClashGG"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="clash-gg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="/"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tagType">Tag Type</Label>
                <select
                  id="tagType"
                  value={formData.tagType}
                  onChange={(e) => setFormData({ ...formData, tagType: e.target.value as "free" | "deposit" })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="free">Free Bonus</option>
                  <option value="deposit">Deposit Bonus</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagText">Tag Text</Label>
                <Input
                  id="tagText"
                  value={formData.tagText}
                  onChange={(e) => setFormData({ ...formData, tagText: e.target.value })}
                  placeholder="Free Bonus"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonusText">Bonus Text</Label>
                <Input
                  id="bonusText"
                  value={formData.bonusText}
                  onChange={(e) => setFormData({ ...formData, bonusText: e.target.value })}
                  placeholder="3 Free Cases"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardsCount">Rewards Count</Label>
                <Input
                  id="rewardsCount"
                  type="number"
                  value={formData.rewardsCount}
                  onChange={(e) => setFormData({ ...formData, rewardsCount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as "cs2" | "general" })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="cs2">CS2</option>
                  <option value="general">General</option>
                </select>
              </div>
              {formData.category === "general" && (
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={formData.country || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value as "latvia" | "usa" | undefined })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">All</option>
                    <option value="latvia">Latvia</option>
                    <option value="usa">USA</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the casino"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founded">Founded</Label>
                <Input
                  id="founded"
                  value={formData.founded || ""}
                  onChange={(e) => setFormData({ ...formData, founded: e.target.value })}
                  placeholder="2016"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License</Label>
                <Input
                  id="license"
                  value={formData.license || ""}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  placeholder="Curacao"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minDeposit">Min Deposit</Label>
                <Input
                  id="minDeposit"
                  value={formData.minDeposit || ""}
                  onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                  placeholder="$1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Methods</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.paymentMethods || []).map((method, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-md text-sm"
                  >
                    {method}
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
                + Add Payment Method
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Games</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.games || []).map((game, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-md text-sm"
                  >
                    {game}
                    <button
                      type="button"
                      onClick={() => removeGame(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addGame}>
                + Add Game
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promoCode">Promo Code</Label>
              <Input
                id="promoCode"
                value={formData.promoCode || ""}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                placeholder="LORDS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasReview"
                checked={formData.hasReview || false}
                onChange={(e) => setFormData({ ...formData, hasReview: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="hasReview" className="cursor-pointer">
                Has Review/Blog Content
              </Label>
            </div>

            {formData.hasReview && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold">Review Content</h3>
                <div className="space-y-2">
                  <Label htmlFor="overview">Overview</Label>
                  <Textarea
                    id="overview"
                    value={formData.reviewContent?.overview || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reviewContent: {
                          ...(formData.reviewContent || { sections: [], overview: "", verdict: "" }),
                          overview: e.target.value,
                        },
                      })
                    }
                    placeholder="Overview content..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verdict">Final Verdict</Label>
                  <Textarea
                    id="verdict"
                    value={formData.reviewContent?.verdict || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reviewContent: {
                          ...(formData.reviewContent || { sections: [], overview: "", verdict: "" }),
                          verdict: e.target.value,
                        },
                      })
                    }
                    placeholder="Final verdict content..."
                    rows={4}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  You can edit the full review content on the review page after creating the casino.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Casino</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Casinos</CardTitle>
          <CardDescription>Manage your casinos and their reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Casino</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casinos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No casinos yet. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                casinos.map((casino) => (
                  <TableRow key={casino.id}>
                    <TableCell className="font-medium">{casino.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{casino.category}</span>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      {casino.hasReview ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <FileText className="h-4 w-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {casino.hasReview && (
                          <Link href={`/review/${casino.slug}`}>
                            <Button variant="ghost" size="icon" title="View Review">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(casino)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(casino.id)}
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

