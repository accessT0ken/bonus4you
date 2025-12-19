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
import { useToast } from "@/hooks/use-toast"
import { COUNTRIES } from "@/lib/countries"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function CasinosPage() {
  const { toast } = useToast()
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPaymentMethod, setNewPaymentMethod] = useState("")
  const [newGame, setNewGame] = useState("")
  const [filterOptions, setFilterOptions] = useState<{
    categories: string[]
    statuses: string[]
    countries: string[]
  }>({
    categories: [],
    statuses: [],
    countries: [],
  })
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
    getCasinos({ status: 'all' }).then((casinosList) => {
      setCasinos(casinosList)
    }).catch((error) => {
      console.error('Failed to load casinos:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load casinos. Please refresh the page.",
      })
    })
    
    getCurrentUser().then((user) => {
      setCurrentUser(user)
    })

    import("@/lib/api-client").then(({ casinosApi }) => {
      casinosApi.getFilterOptions().then((response) => {
        if (response.data) {
          setFilterOptions({
            categories: response.data.categories || [],
            statuses: response.data.statuses || [],
            countries: response.data.countries || [],
          })
        }
      }).catch((error) => {
        console.error('Failed to load filter options:', error)
      })
    })
  }, [])

  const canManageCasinos = hasPermission(currentUser, "manage_casinos")

  const handleCreate = () => {
    // Generate a temporary slug for new casino
    const tempSlug = `new-casino-${Date.now()}`
    window.location.href = `/review/${tempSlug}?edit=true&new=true`
  }

  const handleEdit = (casino: Casino) => {
    window.location.href = `/review/${casino.slug}?edit=true`
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        variant: "warning",
        title: "Validation Error",
        description: "Please fill in casino name and slug fields.",
      })
      return
    }

    try {
      const { casinosApi } = await import("@/lib/api-client")
      const { clearCasinoCache } = await import("@/lib/casino-data")

      if (editingId) {
        await casinosApi.update(editingId, {
          name: formData.name,
          slug: formData.slug,
          logo: formData.logo,
          tagType: formData.tagType,
          tagText: formData.tagText,
          rating: formData.rating,
          bonusText: formData.bonusText,
          rewardsCount: formData.rewardsCount,
          category: formData.category,
          country: formData.country,
          hasReview: formData.hasReview,
          status: formData.status,
          description: formData.description,
          founded: formData.founded,
          license: formData.license,
          minDeposit: formData.minDeposit,
          promoCode: formData.promoCode,
          reviewContent: formData.reviewContent,
        })
        clearCasinoCache()
        toast({
          variant: "success",
          title: "Casino Updated",
          description: "Casino has been successfully updated.",
        })
      } else {
        await casinosApi.create({
          name: formData.name,
          slug: formData.slug,
          logo: formData.logo,
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
          promoCode: formData.promoCode,
          reviewContent: formData.reviewContent,
        })
        clearCasinoCache()
        toast({
          variant: "success",
          title: "Casino Created",
          description: "New casino has been successfully created.",
        })
      }

      const { getCasinos } = await import("@/lib/casino-data")
      const updatedCasinos = await getCasinos({ status: 'all' })
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
    } catch (error: any) {
      console.error('Failed to save casino:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save casino. Please try again.",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { casinosApi } = await import("@/lib/api-client")
      const { clearCasinoCache, getCasinos } = await import("@/lib/casino-data")
      
      await casinosApi.delete(id)
      clearCasinoCache()
      
      const updatedCasinos = await getCasinos({ status: 'all' })
      setCasinos(updatedCasinos)
      
      toast({
        variant: "success",
        title: "Casino Deleted",
        description: "Casino has been successfully deleted.",
      })
    } catch (error: any) {
      console.error('Failed to delete casino:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete casino. Please try again.",
      })
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
    const method = newPaymentMethod.trim()
    if (method) {
      setFormData({
        ...formData,
        paymentMethods: [...(formData.paymentMethods || []), method],
      })
      toast({
        variant: "success",
        title: "Payment Method Added",
        description: `${method} has been added.`,
      })
      setNewPaymentMethod("")
    } else {
      toast({
        variant: "warning",
        title: "Missing payment method",
        description: "Please enter a payment method name before adding.",
      })
    }
  }

  const removePaymentMethod = (index: number) => {
    const methods = [...(formData.paymentMethods || [])]
    methods.splice(index, 1)
    setFormData({ ...formData, paymentMethods: methods })
  }

  const addGame = () => {
    const game = newGame.trim()
    if (game) {
      setFormData({
        ...formData,
        games: [...(formData.games || []), game],
      })
      toast({
        variant: "success",
        title: "Game Added",
        description: `${game} has been added.`,
      })
      setNewGame("")
    } else {
      toast({
        variant: "warning",
        title: "Missing game name",
        description: "Please enter a game name before adding.",
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
          <p className="text-muted-foreground">
            Create, edit, and manage casinos. Start as a draft while testing, then switch to{" "}
            <span className="font-semibold">Published</span> when you&apos;re ready to show it on the site.
          </p>
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
            <CardDescription>
              Fill in the basic casino details. You can always update fields or add full review content later.
              Leave status as <span className="font-semibold">Draft</span> while you&apos;re setting things up.
            </CardDescription>
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
                <p className="text-xs text-muted-foreground">
                  This becomes the URL path, e.g. <span className="font-mono">/review/clash-gg</span>. Use only
                  lowercase letters, numbers, and dashes.
                </p>
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
                  onChange={(e) => {
                    const newCategory = e.target.value as "cs2" | "general"
                    setFormData({ 
                      ...formData, 
                      category: newCategory,
                      // Clear country when switching to CS2
                      country: newCategory === "cs2" ? undefined : formData.country
                    })
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {filterOptions.categories.length > 0 ? (
                    filterOptions.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="cs2">CS2</option>
                      <option value="general">General</option>
                    </>
                  )}
                </select>
              </div>
              {formData.category === "general" && (
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={formData.country || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value || undefined })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
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
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="e.g. Visa, PayPal, Crypto"
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
                  + Add Payment Method
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Add how players can pay (cards, wallets, crypto, etc.).
              </p>
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
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                  placeholder="e.g. Slots, Crash, Roulette"
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={addGame}>
                  + Add Game
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Add main game types users will find on this casino.
              </p>
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
                {filterOptions.statuses.length > 0 ? (
                  filterOptions.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </>
                )}
              </select>
              <p className="text-xs text-muted-foreground">
                Draft casinos are only visible in the admin panel. Published casinos appear on the public site.
              </p>
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
                          asChild
                          title="Delete"
                        >
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete casino?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove{" "}
                                  <span className="font-semibold">{casino.name}</span> and its data from the admin
                                  panel. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(casino.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

