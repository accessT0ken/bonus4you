"use client"

import { Star, ChevronRight, ExternalLink, Edit2, Save, X, Settings, Lock, Menu } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { use } from "react"
import { getCasinoBySlug, trackReviewRead, trackClaimBonusClick, updateSectionContent, updateCasinoProperties, type Casino } from "@/lib/casino-data"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentUser, hasPermission } from "@/lib/user-data"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingScreen } from "@/components/loading-screen"
import { SiteHeader } from "@/components/site-header"
import { COUNTRIES } from "@/lib/countries"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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
  const [isNewCasino, setIsNewCasino] = useState(false)
  const [casinoEditData, setCasinoEditData] = useState<Partial<Casino>>({
    name: "",
    slug: "",
    logo: "",
    tagType: "free",
    tagText: "",
    rating: 5,
    bonusText: "",
    rewardsCount: 0,
    category: "cs2",
    country: undefined,
    status: "draft",
    description: "",
    founded: "",
    license: "",
    minDeposit: "",
    promoCode: "",
    paymentMethodIds: [],
    tagIds: [],
    gameModeIds: [],
    isFeatured: false,
    hasReview: false,
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("edit") === "true") {
        setEditorMode(true)
      }
      if (urlParams.get("new") === "true" || slug.startsWith("new-casino-")) {
        setIsNewCasino(true)
        setEditorMode(true)
      }
    }

    getCurrentUser().then((user) => {
      setCurrentUser(user)
      if (editorMode && user && !hasPermission(user, "edit_reviews")) {
        setEditorMode(false)
        alert("You don't have permission to edit reviews")
      }
    })
  }, [isAuthenticated, slug])

  const canEditReviews = hasPermission(currentUser, "edit_reviews") || hasPermission(currentUser, "manage_casinos")

  // Helper function to ensure minimum loading time
  const setLoadingWithDelay = (startTime: number, callback: () => void) => {
    const elapsed = Date.now() - startTime
    const minDelay = 500 // Minimum 500ms
    const maxDelay = 1000 // Maximum 1000ms
    const delay = Math.max(0, minDelay - elapsed)
    const finalDelay = Math.min(delay, maxDelay - elapsed)
    
    if (finalDelay > 0) {
      setTimeout(() => {
        callback()
      }, finalDelay)
    } else {
      callback()
    }
  }

  useEffect(() => {
    const loadStartTime = Date.now()
    
    if (isNewCasino) {
      // Initialize new casino data
      setCasinoEditData({
        name: "",
        slug: slug.startsWith("new-casino-") ? "" : slug,
        logo: "",
        tagType: "free",
        tagText: "",
        rating: 5,
        bonusText: "",
        rewardsCount: 0,
        category: "cs2",
        country: undefined,
        status: "draft",
        description: "",
        founded: "",
        license: "",
        minDeposit: "",
        promoCode: "",
        paymentMethodIds: [],
        tagIds: [],
        gameModeIds: [],
        isFeatured: false,
        hasReview: false,
        reviewContent: {
          sections: [
            { id: "overview", title: "Overview & History", content: "" },
            { id: "rewards", title: "Rewards & Promotions", content: "" },
            { id: "games", title: "Games Available", content: "" },
            { id: "payment", title: "Payment Methods", content: "" },
            { id: "security", title: "Security & Trust", content: "" },
            { id: "support", title: "Customer Support", content: "" },
            { id: "verdict", title: "Final Verdict", content: "" },
          ],
          overview: "",
          verdict: "",
        },
      })
      setLoadingWithDelay(loadStartTime, () => setIsLoading(false))
      return
    }

    getCasinoBySlug(slug).then((casinoData) => {
      if (casinoData) {
        setCasino(casinoData)
        setCasinoEditData({
          name: casinoData.name,
          slug: casinoData.slug,
          logo: casinoData.logo,
          rating: casinoData.rating,
          bonusText: casinoData.bonusText,
          tagText: casinoData.tagText,
          tagType: casinoData.tagType,
          promoCode: casinoData.promoCode,
          description: casinoData.description,
          category: casinoData.category,
          country: casinoData.country,
          status: casinoData.status,
          founded: casinoData.founded,
          license: casinoData.license,
          minDeposit: casinoData.minDeposit,
          rewardsCount: casinoData.rewardsCount,
          paymentMethodIds: casinoData.paymentMethodIds || [],
          tagIds: casinoData.tagIds || [],
          gameModeIds: casinoData.gameModeIds || [],
          isFeatured: casinoData.isFeatured || false,
          hasReview: casinoData.hasReview || false,
          reviewContent: casinoData.reviewContent || {
            sections: [
              { id: "overview", title: "Overview & History", content: "" },
              { id: "rewards", title: "Rewards & Promotions", content: "" },
              { id: "games", title: "Games Available", content: "" },
              { id: "payment", title: "Payment Methods", content: "" },
              { id: "security", title: "Security & Trust", content: "" },
              { id: "support", title: "Customer Support", content: "" },
              { id: "verdict", title: "Final Verdict", content: "" },
            ],
            overview: "",
            verdict: "",
          },
        })
        if (casinoData.hasReview && !editorMode) {
          trackReviewRead(slug)
        }
        setLoadingWithDelay(loadStartTime, () => setIsLoading(false))
      } else if (!editorMode) {
        window.location.href = "/"
      } else {
        setLoadingWithDelay(loadStartTime, () => setIsLoading(false))
      }
    }).catch((error) => {
      console.error('Failed to load casino:', error)
      if (!editorMode) {
        window.location.href = "/"
      } else {
        setLoadingWithDelay(loadStartTime, () => setIsLoading(false))
      }
    })
  }, [slug, editorMode, isNewCasino])

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
    const casinoSlug = casino?.slug || casinoEditData.slug
    if (casinoSlug) {
      trackClaimBonusClick(casinoSlug)
      window.open(`/go/${casinoSlug}`, "_blank")
    }
  }

  const toggleEditorMode = async () => {
    if (!canEditReviews) {
      alert("You don't have permission to edit reviews")
      return
    }
    setEditorMode(!editorMode)
    if (!editorMode) {
      if (casino && !casino.hasReview) {
        await updateCasinoProperties(slug, { hasReview: true })
        const updatedCasino = await getCasinoBySlug(slug)
        if (updatedCasino) {
          setCasino(updatedCasino)
        }
      }
    }
  }

  const defaultSections = [
    { id: "overview", title: "Overview & History", content: "" },
    { id: "rewards", title: "Rewards & Promotions", content: "" },
    { id: "games", title: "Games Available", content: "" },
    { id: "payment", title: "Payment Methods", content: "" },
    { id: "security", title: "Security & Trust", content: "" },
    { id: "support", title: "Customer Support", content: "" },
    { id: "verdict", title: "Final Verdict", content: "" },
  ]
  
  // Get sections from casino or casinoEditData (for new casinos)
  // Compute sections with proper reactivity
  const reviewSections = casino?.reviewContent?.sections || casinoEditData.reviewContent?.sections
  const allSections = (reviewSections && reviewSections.length > 0) 
    ? [...reviewSections] // Create a new array reference
    : defaultSections

  const sections = editorMode 
    ? allSections
    : allSections.filter((section) => {
        if (section.id === "overview") {
          if (casino?.hasReview) return true
          return section.content || casino?.reviewContent?.overview || casino?.description
        }
        if (section.id === "rewards") {
          if (casino?.hasReview) return true
          return section.content && section.content.trim().length > 0
        }
        if (section.id === "games") {
          return section.content && section.content.trim().length > 0 || ((casinoEditData.gameModeIds || casino?.gameModeIds) && (casinoEditData.gameModeIds || casino?.gameModeIds || []).length > 0)
        }
        if (section.id === "payment") {
          return section.content && section.content.trim().length > 0 || ((casinoEditData.paymentMethodIds || casino?.paymentMethodIds) && (casinoEditData.paymentMethodIds || casino?.paymentMethodIds || []).length > 0)
        }
        if (section.id === "verdict") {
          return section.content || casino?.reviewContent?.verdict
        }
        return section.content && section.content.trim().length > 0
      })

  const casinoGameNames = (casinoEditData.gameModeIds || casino?.gameModeIds || [])
    .map((id: string) =>
        id
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      )

  const casinoPaymentMethodNames = (casinoEditData.paymentMethodIds || casino?.paymentMethodIds || [])
    .map((id: string) =>
        id
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      )

  if (isLoading) {
    return <LoadingScreen message={isNewCasino ? "Creating new casino..." : "Loading review..."} />
  }

  if (!isNewCasino && !casino) {
    return <LoadingScreen message="Loading review..." />
  }

  if (!isNewCasino && !casino?.hasReview && !editorMode) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
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

  const saveSection = async (sectionId: string, content?: string) => {
    // Use provided content or fall back to editContent state
    const contentToSave = content !== undefined ? content : editContent
    if (isNewCasino) {
      // For new casinos, save to local state first
      if (!casinoEditData.reviewContent) {
        casinoEditData.reviewContent = {
          sections: [],
          overview: "",
          verdict: "",
        }
      }
      if (!casinoEditData.reviewContent.sections || casinoEditData.reviewContent.sections.length === 0) {
        casinoEditData.reviewContent.sections = [
          { id: "overview", title: "Overview & History", content: "" },
          { id: "rewards", title: "Rewards & Promotions", content: "" },
          { id: "games", title: "Games Available", content: "" },
          { id: "payment", title: "Payment Methods", content: "" },
          { id: "security", title: "Security & Trust", content: "" },
          { id: "support", title: "Customer Support", content: "" },
          { id: "verdict", title: "Final Verdict", content: "" },
        ]
      }
      let section = casinoEditData.reviewContent.sections.find((s) => s.id === sectionId)
      if (!section) {
        const sectionTitles: Record<string, string> = {
          overview: "Overview & History",
          rewards: "Rewards & Promotions",
          games: "Games Available",
          payment: "Payment Methods",
          security: "Security & Trust",
          support: "Customer Support",
          verdict: "Final Verdict",
        }
        section = {
          id: sectionId,
          title: sectionTitles[sectionId] || sectionId,
          content: ""
        }
        casinoEditData.reviewContent.sections.push(section)
      }
      section.content = contentToSave
      if (sectionId === "overview") {
        casinoEditData.reviewContent.overview = contentToSave
      } else if (sectionId === "verdict") {
        casinoEditData.reviewContent.verdict = contentToSave
      }
      setCasinoEditData({ ...casinoEditData })
      setEditingSection(null)
      setEditContent("")
      toast({
        variant: "success",
        title: "Content Saved",
        description: "Content will be saved when you create the casino.",
      })
      return
    }

    // OPTIMISTIC UPDATE: Update local state immediately before API call
    if (casino) {
      const currentReviewContent = casino.reviewContent || {
        sections: [],
        overview: "",
        verdict: "",
      }
      
      // Ensure sections array exists
      let sections = currentReviewContent.sections || []
      if (!Array.isArray(sections) || sections.length === 0) {
        sections = [
          { id: "overview", title: "Overview & History", content: "" },
          { id: "rewards", title: "Rewards & Promotions", content: "" },
          { id: "games", title: "Games Available", content: "" },
          { id: "payment", title: "Payment Methods", content: "" },
          { id: "security", title: "Security & Trust", content: "" },
          { id: "support", title: "Customer Support", content: "" },
          { id: "verdict", title: "Final Verdict", content: "" },
        ]
      }
      
      // Update the section that was just saved
      const sectionIndex = sections.findIndex(s => s.id === sectionId)
      if (sectionIndex >= 0) {
        sections = sections.map((s, idx) => 
          idx === sectionIndex ? { ...s, content: contentToSave } : { ...s }
        )
      } else {
        const sectionTitles: Record<string, string> = {
          overview: "Overview & History",
          rewards: "Rewards & Promotions",
          games: "Games Available",
          payment: "Payment Methods",
          security: "Security & Trust",
          support: "Customer Support",
          verdict: "Final Verdict",
        }
        sections = [...sections, {
          id: sectionId,
          title: sectionTitles[sectionId] || sectionId,
          content: contentToSave
        }]
      }
      
      // Create new reviewContent object with updated section
      const updatedReviewContent = {
        ...currentReviewContent,
        sections: sections.map(s => ({ ...s })),
        overview: sectionId === "overview" ? contentToSave : currentReviewContent.overview || "",
        verdict: sectionId === "verdict" ? contentToSave : currentReviewContent.verdict || "",
      }
      
      // Update state immediately (optimistic update)
      setCasino({
        ...casino,
        reviewContent: updatedReviewContent,
      })
      setCasinoEditData((prev) => ({
        ...prev,
        reviewContent: updatedReviewContent,
      }))
    }
    
    // Now save to API
    const success = await updateSectionContent(slug, sectionId, contentToSave)
    if (success) {
      // Clear cache and reload from API to sync
      const { clearCasinoCache } = await import('@/lib/casino-data')
      clearCasinoCache()
      
      // Small delay to ensure API has processed the update
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Fetch updated data from API to ensure consistency
      const updatedCasino = await getCasinoBySlug(slug)
      if (updatedCasino && updatedCasino.reviewContent) {
        // Only update if API has the content (don't overwrite with empty if API is slow)
        const apiSection = updatedCasino.reviewContent.sections?.find(s => s.id === sectionId)
        if (apiSection && apiSection.content && apiSection.content.trim().length > 0) {
          // API has the content, use it
          const updatedReviewContent = {
            ...updatedCasino.reviewContent,
            sections: updatedCasino.reviewContent.sections?.map(s => ({ ...s })) || [],
          }
          
          setCasino({
            ...updatedCasino,
            reviewContent: updatedReviewContent,
          })
          setCasinoEditData((prev) => ({
            ...prev,
            reviewContent: updatedReviewContent,
          }))
        } else {
          // API doesn't have content yet or returned empty, ensure our saved content is preserved
          const currentSections = casino?.reviewContent?.sections || casinoEditData.reviewContent?.sections || []
          const currentSection = currentSections.find(s => s.id === sectionId)
          if (currentSection && currentSection.content === contentToSave) {
            // Our optimistic update is correct, keep it
            // Don't overwrite with empty API response
          }
        }
      }
      
      setEditingSection(null)
      setEditContent("")
      toast({
        variant: "success",
        title: "Content Saved",
        description: "Section content has been saved successfully.",
      })
    } else {
      // API call failed, but optimistic update is already applied
      // Optionally revert if needed, but for now keep the optimistic update
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save section. Content may not be persisted.",
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save section. Please try again.",
      })
    }
  }

  const getSectionContent = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (section?.content) return section.content
    
    // Fallback to reviewContent overview/verdict
    if (sectionId === "overview") {
      return casino?.reviewContent?.overview || casinoEditData.reviewContent?.overview || casinoEditData.description || casino?.description || ""
    }
    if (sectionId === "verdict") {
      return casino?.reviewContent?.verdict || casinoEditData.reviewContent?.verdict || ""
    }
    
    return ""
  }

  const saveCasinoProperties = async () => {
    if (!casinoEditData.name || !casinoEditData.slug) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in casino name and slug fields.",
      })
      return
    }

    setIsSaving(true)
    try {
      const { casinosApi } = await import("@/lib/api-client")
      const { clearCasinoCache } = await import("@/lib/casino-data")

      if (isNewCasino) {
        // Create new casino
        const response = await casinosApi.create({
          name: casinoEditData.name,
          slug: casinoEditData.slug,
          logo: casinoEditData.logo || "",
          tagType: casinoEditData.tagType || "free",
          tagText: casinoEditData.tagText || "",
          rating: casinoEditData.rating || 5,
          bonusText: casinoEditData.bonusText || "",
          rewardsCount: casinoEditData.rewardsCount || 0,
          category: casinoEditData.category || "cs2",
          country: casinoEditData.country,
          status: casinoEditData.status || "draft",
          description: casinoEditData.description,
          founded: casinoEditData.founded,
          license: casinoEditData.license,
          minDeposit: casinoEditData.minDeposit,
          promoCode: casinoEditData.promoCode,
          paymentMethodIds: casinoEditData.paymentMethodIds || [],
          tagIds: casinoEditData.tagIds || [],
          gameModeIds: casinoEditData.gameModeIds || [],
          isFeatured: casinoEditData.isFeatured || false,
          hasReview: casinoEditData.hasReview || false,
          reviewContent: casinoEditData.reviewContent || { sections: [], overview: "", verdict: "" },
        })
        clearCasinoCache()
        toast({
          variant: "success",
          title: "Casino Created",
          description: "New casino has been successfully created.",
        })
        // Redirect to the new casino's review page
        router.push(`/review/${casinoEditData.slug}?edit=true`)
      } else if (casino) {
        // Update existing casino
        // Preserve the logo from casinoEditData before saving
        const logoToPreserve = casinoEditData.logo
        
      const success = await updateCasinoProperties(slug, casinoEditData)
      if (success) {
        const updatedCasino = await getCasinoBySlug(slug)
        if (updatedCasino) {
          setCasino(updatedCasino)
          setCasinoEditData({
              name: updatedCasino.name,
              slug: updatedCasino.slug,
              // Preserve logo from casinoEditData if it exists, otherwise use API response
              logo: logoToPreserve || updatedCasino.logo,
            rating: updatedCasino.rating,
            bonusText: updatedCasino.bonusText,
            tagText: updatedCasino.tagText,
            tagType: updatedCasino.tagType,
            promoCode: updatedCasino.promoCode,
            description: updatedCasino.description,
              category: updatedCasino.category,
              country: updatedCasino.country,
              status: updatedCasino.status,
              founded: updatedCasino.founded,
              license: updatedCasino.license,
              minDeposit: updatedCasino.minDeposit,
              rewardsCount: updatedCasino.rewardsCount,
              paymentMethodIds: updatedCasino.paymentMethodIds || [],
              tagIds: updatedCasino.tagIds || [],
              gameModeIds: updatedCasino.gameModeIds || [],
              isFeatured: updatedCasino.isFeatured || false,
              hasReview: updatedCasino.hasReview || false,
              reviewContent: updatedCasino.reviewContent || casinoEditData.reviewContent,
            })
          }
          toast({
            variant: "success",
            title: "Casino Updated",
            description: "Casino properties have been saved.",
          })
      } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save properties. Please try again.",
          })
        }
      }
    } catch (error: any) {
      console.error('Failed to save casino:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save casino. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0"></div>

      <SiteHeader />

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
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              {/* Casino Info Card */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-primary/20 p-6 mb-4">
                <div className="flex flex-col items-center">
                  {/* Logo */}
                  {editorMode ? (
                    <div className="w-full mb-3 space-y-2">
                      <Label className="text-xs mb-1 block">Logo</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs mb-1 block text-muted-foreground">Option 1: Upload Image</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({
                                    variant: "destructive",
                                    title: "File Too Large",
                                    description: "Please select an image smaller than 5MB.",
                                  })
                                  return
                                }
                                
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  const base64String = reader.result as string
                                  if (base64String) {
                                    console.log('Image loaded, base64 length:', base64String.length)
                                    setCasinoEditData((prev) => {
                                      const updated = {
                                        ...prev,
                                        logo: base64String,
                                      }
                                      console.log('Updated casinoEditData with logo:', updated.logo ? 'Logo set' : 'No logo')
                                      return updated
                                    })
                                    // Force a small delay to ensure state update
                                    setTimeout(() => {
                                      toast({
                                        variant: "success",
                                        title: "Image Loaded",
                                        description: "Image has been loaded successfully.",
                                      })
                                    }, 100)
                                  } else {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: "Failed to read image file.",
                                    })
                                  }
                                }
                                reader.onerror = (error) => {
                                  console.error('FileReader error:', error)
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to read image file.",
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="text-xs text-center text-muted-foreground">OR</div>
                        <div>
                          <Label className="text-xs mb-1 block text-muted-foreground">Option 2: Logo URL</Label>
                          <Input
                            value={casinoEditData.logo ?? casino?.logo ?? ""}
                            onChange={(e) =>
                              setCasinoEditData({ ...casinoEditData, logo: e.target.value })
                            }
                            className="h-8 text-sm"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        {casinoEditData.logo || casino?.logo ? (
                          <div className="p-2 border rounded bg-gray-50">
                            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                            <img
                              key={`logo-${casinoEditData.logo || casino?.logo || 'none'}`}
                              src={casinoEditData.logo || casino?.logo || ""}
                              alt="Logo preview"
                              className="w-full h-20 object-contain border rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  const errorMsg = document.createElement('p')
                                  errorMsg.className = 'text-xs text-red-500'
                                  errorMsg.textContent = 'Failed to load image'
                                  parent.appendChild(errorMsg)
                                }
                                console.error('Failed to load logo image:', casinoEditData.logo || casino?.logo)
                              }}
                              onLoad={() => {
                                console.log('Logo image loaded successfully')
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No logo uploaded yet</p>
                        )}
                      </div>
                    </div>
                  ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-primary/30 overflow-hidden mb-3 bg-white">
                    <img
                        src={(casino || {}).logo || "/placeholder.svg"}
                        alt={(casino || {}).name || "Casino"}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  )}

                  {/* Name */}
                  {editorMode ? (
                    <div className="w-full mb-3">
                      <Label className="text-xs mb-1 block">Casino Name *</Label>
                      <Input
                        value={casinoEditData.name ?? (casino?.name || "")}
                        onChange={(e) =>
                          setCasinoEditData({ ...casinoEditData, name: e.target.value })
                        }
                        className="h-8 text-sm"
                        placeholder="Casino Name"
                        required
                      />
                    </div>
                  ) : (
                    <h2 className="text-lg font-bold text-gray-900 mb-2">{(casino || {}).name}</h2>
                  )}

                  {/* Slug */}
                  {editorMode && (
                    <div className="w-full mb-3">
                      <Label className="text-xs mb-1 block">Slug *</Label>
                      <Input
                        value={casinoEditData.slug ?? (casino?.slug || "")}
                        onChange={(e) =>
                          setCasinoEditData({ ...casinoEditData, slug: e.target.value })
                        }
                        className="h-8 text-sm"
                        placeholder="casino-slug"
                        required
                      />
                    </div>
                  )}

                  {/* Category & Country */}
                  {editorMode && (
                    <div className="w-full mb-3 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs mb-1 block">Category</Label>
                        <select
                          value={casinoEditData.category ?? (casino?.category || "cs2")}
                          onChange={(e) => {
                            const newCategory = e.target.value as "cs2" | "general"
                            setCasinoEditData({
                              ...casinoEditData,
                              category: newCategory,
                              country: newCategory === "cs2" ? undefined : casinoEditData.country,
                            })
                          }}
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                        >
                          <option value="cs2">CS2</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                      {casinoEditData.category === "general" && (
                        <div>
                          <Label className="text-xs mb-1 block">Country</Label>
                          <select
                            value={casinoEditData.country || ""}
                            onChange={(e) =>
                              setCasinoEditData({ ...casinoEditData, country: e.target.value || undefined })
                            }
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
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
                  )}

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
                          value={casinoEditData.rating ?? (casino?.rating ?? 5)}
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
                                i < Math.floor(casinoEditData.rating ?? (casino?.rating ?? 5))
                                  ? "fill-primary text-primary"
                                  : i < (casinoEditData.rating ?? (casino?.rating ?? 5))
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
                            i < Math.floor((casino || {}).rating || 0)
                              ? "fill-primary text-primary"
                              : i < ((casino || {}).rating || 0)
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
                          value={casinoEditData.bonusText ?? (casino?.bonusText ?? "")}
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
                          value={casinoEditData.promoCode ?? (casino?.promoCode ?? "")}
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
                          value={casinoEditData.tagType ?? (casino?.tagType ?? "free")}
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
                          value={casinoEditData.tagText ?? (casino?.tagText ?? "")}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, tagText: e.target.value })
                          }
                          className="h-8 text-sm"
                          placeholder="Free Bonus"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Description</Label>
                        <Textarea
                          value={casinoEditData.description ?? (casino?.description ?? "")}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, description: e.target.value })
                          }
                          className="h-20 text-sm"
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Founded</Label>
                          <Input
                            value={casinoEditData.founded ?? (casino?.founded ?? "")}
                            onChange={(e) =>
                              setCasinoEditData({ ...casinoEditData, founded: e.target.value })
                            }
                            className="h-8 text-sm"
                            placeholder="2016"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">License</Label>
                          <Input
                            value={casinoEditData.license ?? (casino?.license ?? "")}
                            onChange={(e) =>
                              setCasinoEditData({ ...casinoEditData, license: e.target.value })
                            }
                            className="h-8 text-sm"
                            placeholder="Curacao"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Min Deposit</Label>
                        <Input
                          value={casinoEditData.minDeposit ?? (casino?.minDeposit ?? "")}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, minDeposit: e.target.value })
                          }
                          className="h-8 text-sm"
                          placeholder="$1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Status</Label>
                        <select
                          value={casinoEditData.status ?? (casino?.status ?? "draft")}
                          onChange={(e) =>
                            setCasinoEditData({
                              ...casinoEditData,
                              status: e.target.value as "draft" | "published",
                            })
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isFeatured"
                          checked={casinoEditData.isFeatured ?? (casino?.isFeatured ?? false)}
                          onChange={(e) =>
                            setCasinoEditData({ ...casinoEditData, isFeatured: e.target.checked })
                          }
                          className="rounded"
                        />
                        <Label htmlFor="isFeatured" className="text-xs cursor-pointer">
                          Featured
                        </Label>
                      </div>
                      <Button 
                        onClick={saveCasinoProperties} 
                        size="sm" 
                        className="w-full gap-2"
                        disabled={isSaving}
                      >
                        <Save className="h-3 w-3" />
                        {isSaving ? "Saving..." : isNewCasino ? "Create Casino" : "Save Properties"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600 mb-1">
                        Get <span className="font-bold text-gray-900">{(casino || {}).bonusText}</span>
                      </div>
                      {(casino || {}).promoCode && (
                        <div className="text-xs text-gray-500 mb-4">
                          Redeem Code »{" "}
                          <span className="inline-block bg-gradient-to-br from-primary/20 to-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                            {(casino || {}).promoCode}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* CTA Button */}
                  {!editorMode && (
                  <button
                    onClick={handleClaimBonus}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 text-center shadow-lg shadow-primary/20"
                  >
                    Claim Bonus
                  </button>
                  )}
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
              </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isFixed ? "xl:ml-64" : ""}`}>
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Overview Section */}
                  {sections.find(s => s.id === "overview") && (
                  <section id="overview" className="bg-white rounded-2xl border border-gray-200 p-8 relative scroll-mt-24">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">What is {casinoEditData.name || casino?.name || "this casino"}?</h2>
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
                        content={getSectionContent("overview") || casino?.reviewContent?.overview || casinoEditData.description || casino?.description || ""}
                        onSave={(content) => {
                          saveSection("overview", content)
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-600 leading-relaxed mb-6 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("overview") || casino?.reviewContent?.overview || casinoEditData.description || casino?.description || "No overview available.",
                        }}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {(casinoEditData.founded || casino?.founded) && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">Founded</div>
                          <div className="text-lg font-bold text-gray-900">{casinoEditData.founded || casino?.founded}</div>
                        </div>
                      )}
                      {(casinoEditData.license || casino?.license) && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">License</div>
                          <div className="text-lg font-bold text-gray-900">{casinoEditData.license || casino?.license}</div>
                        </div>
                      )}
                      {(casinoEditData.minDeposit || casino?.minDeposit) && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">Min Deposit</div>
                          <div className="text-lg font-bold text-gray-900">{casinoEditData.minDeposit || casino?.minDeposit}</div>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Rating</div>
                        <div className="text-lg font-bold text-primary">{(casinoEditData.rating ?? casino?.rating ?? 5)}/5.0</div>
                      </div>
                    </div>
                  </section>
                  )}

                  {/* Rewards Section */}
                  {sections.find(s => s.id === "rewards") && (
                  <section id="rewards" className="bg-white rounded-2xl border border-gray-200 p-8 scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What Rewards Does {casinoEditData.name || casino?.name || "this casino"} Offer?</h2>
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Bonus</h3>
                      <p className="text-2xl font-bold text-primary mb-2">{casinoEditData.bonusText || casino?.bonusText || ""}</p>
                      {(casinoEditData.promoCode || casino?.promoCode) && (
                        <p className="text-gray-600 mb-4">
                          Use code <span className="font-bold text-primary">{casinoEditData.promoCode || casino?.promoCode}</span> to claim your bonus
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
                            saveSection("games", content)
                          }}
                          onCancel={cancelEditing}
                        />
                      ) : (
                        <>
                          {getSectionContent("games") ? (
                            <div
                              className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: getSectionContent("games") }}
                            />
                          ) : casinoGameNames.length > 0 ? (
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
                            saveSection("payment", content)
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
                        content={getSectionContent("security") || ((casinoEditData.license || casino?.license)
                          ? `${casinoEditData.name || casino?.name || "This casino"} operates under a ${casinoEditData.license || casino?.license} gaming license and implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`
                          : `${casinoEditData.name || casino?.name || "This casino"} implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`)}
                        onSave={(content) => {
                          saveSection("security", content)
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("security") || ((casinoEditData.license || casino?.license)
                            ? `${casinoEditData.name || casino?.name || "This casino"} operates under a ${casinoEditData.license || casino?.license} gaming license and implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`
                            : `${casinoEditData.name || casino?.name || "This casino"} implements industry-standard security measures to protect user data and funds. All games are provably fair, and the platform undergoes regular security audits.`),
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
                        content={getSectionContent("support") || `${casinoEditData.name || casino?.name || "This casino"} offers 24/7 customer support through live chat and email. The support team is responsive and helpful, typically resolving issues within minutes.`}
                        onSave={(content) => {
                          saveSection("support", content)
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("support") || `${casinoEditData.name || casino?.name || "This casino"} offers 24/7 customer support through live chat and email. The support team is responsive and helpful, typically resolving issues within minutes.`,
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
                      <div className="text-5xl font-bold text-primary">{casinoEditData.rating ?? casino?.rating ?? 5}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-6 h-6 ${
                                i < Math.floor(casinoEditData.rating ?? casino?.rating ?? 5)
                                  ? "fill-primary text-primary"
                                  : i < (casinoEditData.rating ?? casino?.rating ?? 5)
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
                        content={getSectionContent("verdict") || casino?.reviewContent?.verdict ||
                          `${casinoEditData.name || casino?.name || "This casino"} is a top-tier CS2 gambling platform that excels in game variety, security, and user experience. With generous bonuses and reliable payouts, it's highly recommended for both beginners and experienced players.`}
                        onSave={(content) => {
                          saveSection("verdict", content)
                        }}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <div
                        className="text-gray-700 leading-relaxed mb-6 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getSectionContent("verdict") || casino?.reviewContent?.verdict ||
                            `${casinoEditData.name || casino?.name || "This casino"} is a top-tier CS2 gambling platform that excels in game variety, security, and user experience. With generous bonuses and reliable payouts, it's highly recommended for both beginners and experienced players.`,
                        }}
                      />
                    )}
                    <button
                      onClick={handleClaimBonus}
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-primary/20"
                    >
                      Visit {casinoEditData.name || casino?.name || "Casino"} <ExternalLink className="w-5 h-5" />
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
                          <p className="text-2xl font-bold text-primary">{casino?.bonusText || casinoEditData.bonusText}</p>
                        </div>
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">FREE</span>
                      </div>
                      {(casino?.promoCode || casinoEditData.promoCode) && (
                        <p className="text-gray-600 mb-4">
                          New users get {casino?.bonusText || casinoEditData.bonusText} when they sign up using promo code{" "}
                          <span className="font-bold text-primary">{casino?.promoCode || casinoEditData.promoCode}</span>
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
                    Check out other top-rated CS2 gambling sites similar to {casinoEditData.name || casino?.name || "this casino"}.
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
