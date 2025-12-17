"use client"

import { Star, ChevronRight, ExternalLink, Edit2, Save, X, Settings, Lock, Menu } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { use } from "react"
import { getCasinoBySlug, trackReviewRead, trackClaimBonusClick, updateSectionContent, updateCasinoProperties, gameModes, paymentMethods, type Casino } from "@/lib/casino-data"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentUser, hasPermission } from "@/lib/user-data"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingScreen } from "@/components/loading-screen"

export default function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [activeTab, setActiveTab] = useState<"overview" | "bonuses" | "alternatives">("overview")
  const [activeSection, setActiveSection] = useState("overview")
  const [isFixed, setIsFixed] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [casino, setCasino] = useState<Casino | null>(null)
  const { isAuthenticated } = useAuth()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>("")
  const [editorMode, setEditorMode] = useState(false)
  const [casinoEditData, setCasinoEditData] = useState<Partial<Casino>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check URL for edit mode first (before user loads)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("edit") === "true") {
        setEditorMode(true)
      }
    }

    getCurrentUser().then((user) => {
      setCurrentUser(user)
      // Verify permission if editor mode is enabled
      if (editorMode && user && !hasPermission(user, "edit_reviews")) {
        setEditorMode(false)
        alert("You don't have permission to edit reviews")
      }
    })
  }, [isAuthenticated])

  const canEditReviews = hasPermission(currentUser, "edit_reviews")

  useEffect(() => {
    getCasinoBySlug(slug).then((casinoData) => {
      if (casinoData) {
        setCasino(casinoData)
        setCasinoEditData({
          rating: casinoData.rating,
          bonusText: casinoData.bonusText,
          tagText: casinoData.tagText,
          tagType: casinoData.tagType,
          promoCode: casinoData.promoCode,
          description: casinoData.description,
        })
        // Track review read only if has review and not in editor mode
        if (casinoData.hasReview && !editorMode) {
          trackReviewRead(slug)
        }
        setIsLoading(false)
      } else {
        // Redirect to home if casino doesn't exist
        window.location.href = "/"
      }
    }).catch((error) => {
      console.error('Failed to load casino:', error)
      setIsLoading(false)
    })
  }, [slug, editorMode])

  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect()
        setIsFixed(window.scrollY > 100)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClaimBonus = (e: React.MouseEvent) => {
    e.preventDefault()
    if (casino) {
      trackClaimBonusClick(casino.slug)
      window.open(`/go/${casino.slug}`, "_blank")
    }
  }

  const toggleEditorMode = () => {
    if (!canEditReviews) {
      alert("You don't have permission to edit reviews")
      return
    }
    setEditorMode(!editorMode)
    if (!editorMode) {
      // Enable editor mode - ensure review exists
      if (casino && !casino.hasReview) {
        updateCasinoProperties(slug, { hasReview: true })
        const updatedCasino = getCasinoBySlug(slug)
        if (updatedCasino) {
          setCasino(updatedCasino)
        }
      }
    }
  }

  // Default sections if not in reviewContent or if sections array is empty
  const defaultSections = [
    { id: "overview", title: "Overview & History", content: "" },
    { id: "rewards", title: "Rewards & Promotions", content: "" },
    { id: "games", title: "Games Available", content: "" },
    { id: "payment", title: "Payment Methods", content: "" },
    { id: "security", title: "Security & Trust", content: "" },
    { id: "support", title: "Customer Support", content: "" },
    { id: "verdict", title: "Final Verdict", content: "" },
  ]
  
  const reviewSections = casino?.reviewContent?.sections
  const allSections = (reviewSections && reviewSections.length > 0) 
    ? reviewSections 
    : defaultSections

  // Filter sections to only show those with content
  // In editor mode, show all sections so they can be edited
  const sections = editorMode 
    ? allSections // Show all sections in editor mode
    : allSections.filter((section) => {
        if (section.id === "overview") {
          // Always show overview if casino has review
          if (casino?.hasReview) return true
          return section.content || casino?.reviewContent?.overview || casino?.description
        }
        if (section.id === "rewards") {
          // Always show rewards section if casino has review (it will show bonus info)
          if (casino?.hasReview) return true
          return section.content && section.content.trim().length > 0
        }
        if (section.id === "games") {
          // Show if has content or if casino has games
          return section.content && section.content.trim().length > 0 || (casino?.gameModeIds && casino.gameModeIds.length > 0)
        }
        if (section.id === "payment") {
          // Show if has content or if casino has payment methods
          return section.content && section.content.trim().length > 0 || (casino?.paymentMethodIds && casino.paymentMethodIds.length > 0)
        }
        if (section.id === "verdict") {
          return section.content || casino?.reviewContent?.verdict
        }
        return section.content && section.content.trim().length > 0
      })

  // Get game names from IDs
  const casinoGameNames = casino?.gameModeIds
    ? casino.gameModeIds.map(id => gameModes.find(gm => gm.id === id)?.name).filter(Boolean) as string[]
    : []

  // Get payment method names from IDs
  const casinoPaymentMethodNames = casino?.paymentMethodIds
    ? casino.paymentMethodIds.map(id => paymentMethods.find(pm => pm.id === id)?.name).filter(Boolean) as string[]
    : []

  if (isLoading || !casino) {
    return <LoadingScreen message="Loading review..." />
  }

  // Show message if no review and not in editor mode
  if (!casino.hasReview && !editorMode) {
    return (
      <div className="min-h-screen bg-white">
        <header className="fixed top-0 left-0 right-0 z-50 pt-4">
          <div className="container mx-auto px-4">
            <div className="bg-purple-50/80 backdrop-blur-md rounded-full border border-purple-200 shadow-lg">
              <div className="flex items-center justify-between px-6 h-16">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/assets/BONUS4YOU_DARK_BLURRY.png" alt="bonus4you" className="h-10 w-auto object-contain" />
                </Link>

                <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                  <Link
                    href="/casinos/cs2"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                  >
                    CS2 Bonuses
                  </Link>
                  <Link
                    href="/casinos/general"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                  >
                    Casino Bonuses
                  </Link>
                  <Link
                    href="/guides"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                  >
                    Guides
                  </Link>
                  <Link
                    href="/reviews"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                  >
                    Reviews
                  </Link>
                </nav>

                <div className="flex items-center gap-4">
                  {canEditReviews && (
                    <Button
                      onClick={toggleEditorMode}
                      variant="default"
                      size="sm"
                      className="gap-2 hidden md:flex"
                    >
                      <Settings className="h-4 w-4" />
                      Create Review
                    </Button>
                  )}
                  <Link
                    href="/"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors hidden md:flex"
                  >
                    ← Back to Home
                  </Link>
                  <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
                    <Link href="/login">Login</Link>
                  </Button>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-foreground hover:text-primary transition-colors"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {mobileMenuOpen && (
                <div className="md:hidden px-6 pb-6 animate-in slide-in-from-top duration-200">
                  <nav className="flex flex-col gap-4">
                    <Link
                      href="/"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                    >
                      ← Back to Home
                    </Link>
                    <Link
                      href="/casinos/cs2"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                    >
                      CS2 Bonuses
                    </Link>
                    <Link
                      href="/casinos/general"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                    >
                      Casino Bonuses
                    </Link>
                    <Link
                      href="/guides"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                    >
                      Guides
                    </Link>
                    <Link
                      href="/reviews"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                    >
                      Reviews
                    </Link>
                    {canEditReviews && (
                      <Button
                        onClick={toggleEditorMode}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Create Review
                      </Button>
                    )}
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2">
                      <Link href="/login">Login</Link>
                    </Button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="pt-32 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">No Review Available</h1>
            <p className="text-muted-foreground mb-6">
              This casino doesn't have a review yet. {canEditReviews && "Click 'Create Review' to start writing one."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  const startEditing = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    const content = section?.content || ""
    setEditContent(content)
    setEditingSection(sectionId)
  }

  const cancelEditing = () => {
    setEditingSection(null)
    setEditContent("")
  }

  const saveSection = async (sectionId: string) => {
    const success = await updateSectionContent(slug, sectionId, editContent)
    if (success) {
      // Reload casino data
      const updatedCasino = await getCasinoBySlug(slug)
      if (updatedCasino) {
        setCasino(updatedCasino)
        // Update sections state to reflect changes
        setCasinoEditData({
          ...casinoEditData,
          reviewContent: updatedCasino.reviewContent,
        })
      }
      setEditingSection(null)
      setEditContent("")
    } else {
      alert("Failed to save section. Please try again.")
    }
  }

  const getSectionContent = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    return section?.content || ""
  }

  const saveCasinoProperties = async () => {
    if (casino) {
      const success = await updateCasinoProperties(slug, casinoEditData)
      if (success) {
        const updatedCasino = await getCasinoBySlug(slug)
        if (updatedCasino) {
          setCasino(updatedCasino)
          setCasinoEditData({
            rating: updatedCasino.rating,
            bonusText: updatedCasino.bonusText,
            tagText: updatedCasino.tagText,
            tagType: updatedCasino.tagType,
            promoCode: updatedCasino.promoCode,
            description: updatedCasino.description,
          })
        }
        alert("Casino properties saved!")
      } else {
        alert("Failed to save properties. Please try again.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0"></div>

      {/* Header with Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4">
        <div className="container mx-auto px-4">
          <div className="bg-purple-50/80 backdrop-blur-md rounded-full border border-purple-200 shadow-lg">
            <div className="flex items-center justify-between px-6 h-16">
              <Link href="/" className="flex items-center gap-2">
                <img src="/assets/BONUS4YOU_DARK_BLURRY.png" alt="bonus4you" className="h-10 w-auto object-contain" />
              </Link>

              <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <Link
                  href="/casinos/cs2"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  CS2 Bonuses
                </Link>
                <Link
                  href="/casinos/general"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  Casino Bonuses
                </Link>
                <Link
                  href="/guides"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  Guides
                </Link>
                <Link
                  href="/reviews"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  Reviews
                </Link>
              </nav>

              <div className="flex items-center gap-4">
                {canEditReviews && (
                  <Button
                    onClick={toggleEditorMode}
                    variant={editorMode ? "default" : "outline"}
                    size="sm"
                    className="gap-2 hidden md:flex"
                  >
                    {editorMode ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Exit Editor
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        Editor Mode
                      </>
                    )}
                  </Button>
                )}
                <Link
                  href="/"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors hidden md:flex"
                >
                  ← Back to Home
                </Link>
                <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  <Link href="/login">Login</Link>
                </Button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-foreground hover:text-primary transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden px-6 pb-6 animate-in slide-in-from-top duration-200">
                <nav className="flex flex-col gap-4">
                  <Link
                    href="/"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    ← Back to Home
                  </Link>
                  <Link
                    href="/casinos/cs2"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    CS2 Bonuses
                  </Link>
                  <Link
                    href="/casinos/general"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    Casino Bonuses
                  </Link>
                  <Link
                    href="/guides"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    Guides
                  </Link>
                  <Link
                    href="/reviews"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                  >
                    Reviews
                  </Link>
                  {canEditReviews && (
                    <Button
                      onClick={toggleEditorMode}
                      variant={editorMode ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                    >
                      {editorMode ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Exit Editor
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4" />
                          Editor Mode
                        </>
                      )}
                    </Button>
                  )}
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2">
                    <Link href="/login">Login</Link>
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="pt-32 pb-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Tabs */}
          <div className="xl:hidden mb-6">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-1 relative overflow-hidden">
              <div
                className="absolute top-1 h-[calc(100%-8px)] bg-primary rounded-xl transition-all duration-300 ease-out"
                style={{
                  width: "33.333%",
                  left: activeTab === "overview" ? "0%" : activeTab === "bonuses" ? "33.333%" : "66.666%",
                }}
              />
              <div className="grid grid-cols-3 relative z-10">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 px-4 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                    activeTab === "overview" ? "text-white" : "text-gray-600"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="text-xs font-bold">OVERVIEW</span>
                </button>
                <button
                  onClick={() => setActiveTab("bonuses")}
                  className={`py-3 px-4 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                    activeTab === "bonuses" ? "text-white" : "text-gray-600"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="text-xs font-bold">BONUSES</span>
                </button>
                <button
                  onClick={() => setActiveTab("alternatives")}
                  className={`py-3 px-4 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                    activeTab === "alternatives" ? "text-white" : "text-gray-600"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="text-xs font-bold">ALTERNATIVES</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sticky Sidebar */}
            <aside ref={sidebarRef} className={`w-60 shrink-0 hidden xl:block ${isFixed ? "fixed top-24" : ""}`}>
              {/* Casino Info Card */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-primary/20 p-6 mb-4">
                <div className="flex flex-col items-center">
                  {/* Logo */}
                  <div className="w-20 h-20 rounded-xl border-2 border-primary/30 overflow-hidden mb-3 bg-white">
                    <img
                      src={casino.logo || "/placeholder.svg"}
                      alt={casino.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Name */}
                  <h2 className="text-lg font-bold text-gray-900 mb-2">{casino.name}</h2>

                  {/* Rating */}
                  {editorMode ? (
                    <div className="w-full mb-3">
                      <Label className="text-xs mb-1 block">Rating</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={casinoEditData.rating ?? casino.rating ?? 5}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, rating: parseFloat(e.target.value) || 5 })
                          }
                          className="w-16 h-8 text-center"
                        />
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(casinoEditData.rating || casino.rating)
                                  ? "fill-primary text-primary"
                                  : i < (casinoEditData.rating || casino.rating)
                                    ? "fill-primary/50 text-primary"
                                    : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(casino.rating)
                              ? "fill-primary text-primary"
                              : i < casino.rating
                                ? "fill-primary/50 text-primary"
                                : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Bonus */}
                  {editorMode ? (
                    <div className="w-full mb-3 space-y-2">
                      <div>
                        <Label className="text-xs mb-1 block">Bonus Text</Label>
                        <Input
                          value={casinoEditData.bonusText ?? casino.bonusText ?? ""}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, bonusText: e.target.value })
                          }
                          className="h-8 text-sm"
                          placeholder="3 Free Cases"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Promo Code</Label>
                        <Input
                          value={casinoEditData.promoCode ?? casino.promoCode ?? ""}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, promoCode: e.target.value })
                          }
                          className="h-8 text-sm"
                          placeholder="LORDS"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Tag Type</Label>
                        <select
                          value={casinoEditData.tagType ?? casino.tagType ?? "free"}
                          onChange={(e) =>
                            setCasinoEditData({
                              ...casinoEditData,
                              tagType: e.target.value as "free" | "deposit",
                            })
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                        >
                          <option value="free">Free Bonus</option>
                          <option value="deposit">Deposit Bonus</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Tag Text</Label>
                        <Input
                          value={casinoEditData.tagText ?? casino.tagText ?? ""}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, tagText: e.target.value })
                          }
                          className="h-8 text-sm"
                          placeholder="Free Bonus"
                        />
                      </div>
                      <Button onClick={saveCasinoProperties} size="sm" className="w-full gap-2">
                        <Save className="h-3 w-3" />
                        Save Properties
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600 mb-1">
                        Get <span className="font-bold text-gray-900">{casino.bonusText}</span>
                      </div>
                      {casino.promoCode && (
                        <div className="text-xs text-gray-500 mb-4">
                          Redeem Code »{" "}
                          <span className="inline-block bg-gradient-to-br from-primary/20 to-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                            {casino.promoCode}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={handleClaimBonus}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 text-center shadow-lg shadow-primary/20"
                  >
                    Claim Bonus
                  </button>
                </div>
              </div>

              {/* Navigation Menu */}
              {sections.length > 0 && (
                <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden">
                  <ul>
                    {sections.map((section, index: number) => (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                            activeSection === section.id ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"
                          } ${index !== 0 ? "border-t border-gray-100" : ""}`}
                        >
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isFixed ? "xl:ml-64" : ""}`}>
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Overview Section */}
                  {sections.find(s => s.id === "overview") && (
                  <section id="overview" className="bg-white rounded-2xl border border-gray-200 p-8 relative scroll-mt-24">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">What is {casino.name}?</h2>
                      {editorMode && canEditReviews && editingSection !== "overview" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing("overview")}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {editingSection === "overview" ? (
                      <RichTextEditor
                        content={getSectionContent("overview") || casino.reviewContent?.overview || casino.description || ""}
                        onSave={(content) => {
                          setEditContent(content)
                          saveSection("overview")
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-600 leading-relaxed mb-6 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("overview") || casino.reviewContent?.overview || casino.description || "No overview available.",
                        }}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {casino.founded && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">Founded</div>
                          <div className="text-lg font-bold text-gray-900">{casino.founded}</div>
                        </div>
                      )}
                      {casino.license && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">License</div>
                          <div className="text-lg font-bold text-gray-900">{casino.license}</div>
                        </div>
                      )}
                      {casino.minDeposit && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">Min Deposit</div>
                          <div className="text-lg font-bold text-gray-900">{casino.minDeposit}</div>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Rating</div>
                        <div className="text-lg font-bold text-primary">{casino.rating}/5.0</div>
                      </div>
                    </div>
                  </section>
                  )}

                  {/* Rewards Section */}
                  {sections.find(s => s.id === "rewards") && (
                  <section id="rewards" className="bg-white rounded-2xl border border-gray-200 p-8 scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What Rewards Does {casino.name} Offer?</h2>
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Bonus</h3>
                      <p className="text-2xl font-bold text-primary mb-2">{casino.bonusText}</p>
                      {casino.promoCode && (
                        <p className="text-gray-600 mb-4">
                          Use code <span className="font-bold text-primary">{casino.promoCode}</span> to claim your bonus
                        </p>
                      )}
                      <button
                        onClick={handleClaimBonus}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        Claim Now <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </section>
                  )}

                  {/* Games Section */}
                  {sections.find(s => s.id === "games") && (editorMode || casinoGameNames.length > 0) && (
                    <section id="games" className="bg-white rounded-2xl border border-gray-200 p-8 scroll-mt-24">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Games Available</h2>
                        {editorMode && canEditReviews && editingSection !== "games" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing("games")}
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                      {editingSection === "games" ? (
                        <RichTextEditor
                          content={getSectionContent("games") || ""}
                          onSave={(content) => {
                            setEditContent(content)
                            saveSection("games")
                          }}
                          onCancel={cancelEditing}
                        />
                      ) : (
                        <>
                          {casinoGameNames.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {casinoGameNames.map((game: string) => (
                                <div key={game} className="bg-gray-50 rounded-xl p-4 text-center font-semibold text-gray-700">
                                  {game}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">No games information available. Click Edit to add content.</div>
                          )}
                          {getSectionContent("games") && (
                            <div
                              className="text-gray-600 leading-relaxed mt-4 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: getSectionContent("games") }}
                            />
                          )}
                        </>
                      )}
                    </section>
                  )}

                  {/* Payment Methods Section */}
                  {sections.find(s => s.id === "payment") && (editorMode || casinoPaymentMethodNames.length > 0) && (
                    <section id="payment" className="bg-white rounded-2xl border border-gray-200 p-8 scroll-mt-24">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
                        {editorMode && canEditReviews && editingSection !== "payment" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing("payment")}
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                      {editingSection === "payment" ? (
                        <RichTextEditor
                          content={getSectionContent("payment") || ""}
                          onSave={(content) => {
                            setEditContent(content)
                            saveSection("payment")
                          }}
                          onCancel={cancelEditing}
                        />
                      ) : (
                        <>
                          {casinoPaymentMethodNames.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-4">
                              {casinoPaymentMethodNames.map((method: string) => (
                                <div
                                  key={method}
                                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl px-4 py-3 border border-gray-200 font-semibold text-gray-700"
                                >
                                  {method}
                                </div>
                              ))}
                            </div>
                          )}
                          {getSectionContent("payment") ? (
                            <div
                              className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: getSectionContent("payment") }}
                            />
                          ) : (
                            editorMode && <div className="text-gray-500 italic">No payment methods information available. Click Edit to add content.</div>
                          )}
                        </>
                      )}
                    </section>
                  )}

                  {/* Security Section */}
                  {sections.find(s => s.id === "security") && (
                  <section id="security" className="bg-white rounded-2xl border border-gray-200 p-8 relative scroll-mt-24">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Security & Trust</h2>
                      {editorMode && canEditReviews && editingSection !== "security" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing("security")}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {editingSection === "security" ? (
                      <RichTextEditor
                        content={getSectionContent("security") || (casino.license
                          ? `${casino.name} operates under a ${casino.license} gaming license and implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`
                          : `${casino.name} implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`)}
                        onSave={(content) => {
                          setEditContent(content)
                          saveSection("security")
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("security") || (casino.license
                            ? `${casino.name} operates under a ${casino.license} gaming license and implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`
                            : `${casino.name} implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`),
                        }}
                      />
                    )}
                  </section>
                  )}

                  {/* Support Section */}
                  {sections.find(s => s.id === "support") && (
                  <section id="support" className="bg-white rounded-2xl border border-gray-200 p-8 relative scroll-mt-24">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Customer Support</h2>
                      {editorMode && canEditReviews && editingSection !== "support" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing("support")}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {editingSection === "support" ? (
                      <RichTextEditor
                        content={getSectionContent("support") || `${casino.name} offers 24/7 customer support through live chat and email. The support team is responsive and helpful, typically resolving issues within minutes.`}
                        onSave={(content) => {
                          setEditContent(content)
                          saveSection("support")
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("support") || `${casino.name} offers 24/7 customer support through live chat and email. The support team is responsive and helpful, typically resolving issues within minutes.`,
                        }}
                      />
                    )}
                  </section>
                  )}

                  {/* Final Verdict Section */}
                  {sections.find(s => s.id === "verdict") && (
                  <section
                    id="verdict"
                    className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20 p-8 relative scroll-mt-24"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Final Verdict</h2>
                      {editorMode && canEditReviews && editingSection !== "verdict" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing("verdict")}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl font-bold text-primary">{casino.rating}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-6 h-6 ${
                                i < Math.floor(casino.rating)
                                  ? "fill-primary text-primary"
                                  : i < casino.rating
                                    ? "fill-primary/50 text-primary"
                                    : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm font-semibold text-gray-600">Excellent Rating</div>
                      </div>
                    </div>
                    {editingSection === "verdict" ? (
                      <RichTextEditor
                        content={getSectionContent("verdict") || casino.reviewContent?.verdict ||
                          `${casino.name} is a top-tier CS2 gambling platform that excels in game variety, security, and user experience. With generous bonuses and reliable payouts, it's highly recommended for both beginners and experienced players.`}
                        onSave={(content) => {
                          setEditContent(content)
                          saveSection("verdict")
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-700 leading-relaxed mb-6 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("verdict") || casino.reviewContent?.verdict ||
                            `${casino.name} is a top-tier CS2 gambling platform that excels in game variety, security, and user experience. With generous bonuses and reliable payouts, it's highly recommended for both beginners and experienced players.`,
                        }}
                      />
                    )}
                    <button
                      onClick={handleClaimBonus}
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-primary/20"
                    >
                      Visit {casino.name} <ExternalLink className="w-5 h-5" />
                    </button>
                  </section>
                  )}
                </div>
              )}

              {activeTab === "bonuses" && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Bonuses</h2>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Bonus</h3>
                          <p className="text-2xl font-bold text-primary">{casino.bonusText}</p>
                        </div>
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">FREE</span>
                      </div>
                      {casino.promoCode && (
                        <p className="text-gray-600 mb-4">
                          New users get {casino.bonusText} when they sign up using promo code{" "}
                          <span className="font-bold text-primary">{casino.promoCode}</span>
                        </p>
                      )}
                      <button
                        onClick={handleClaimBonus}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all"
                      >
                        Claim Bonus <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "alternatives" && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Alternative Casinos</h2>
                  <p className="text-gray-600">
                    Check out other top-rated CS2 gambling sites similar to {casino.name}.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                    >
                      View All Casinos <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
