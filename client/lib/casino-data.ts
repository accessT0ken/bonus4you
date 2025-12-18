// casino-data.ts

// (Global filter metadata like payment methods / tags / game modes used to live here)
// All filter options are now derived directly from API casino data instead.

// Casino structure
export interface Casino {
  id: string
  name: string
  slug: string
  logo: string
  tagType: "free" | "deposit"
  tagText: string
  rating: number
  bonusText: string
  rewardsCount: number
  category: "cs2" | "general"
  country?: "latvia" | "usa"
  minDeposit?: string
  license?: string
  promoCode?: string
  description?: string
  founded?: string

  // NEW: Reference payment methods by ID
  paymentMethodIds?: string[]

  // Optional tags (chips) referenced by ID from casinoTags
  tagIds?: string[]

  // Game modes available at this casino
  gameModeIds?: string[]

  // Used to highlight especially popular casinos in the UI
  isFeatured?: boolean

  hasReview: boolean
  reviewContent?: {
    sections: Array<{ id: string; title: string; content: string }>
    overview?: string
    verdict?: string
  }

  status: "draft" | "published"

  stats: {
    landingPageViews: number
    claimBonusClicks: number
    reviewReads: number
  }

  createdAt: string
  updatedAt: string
}

// Transform API response to Casino format
function transformApiCasino(apiCasino: any): Casino {
  return {
    id: String(apiCasino.id),
    name: apiCasino.name,
    slug: apiCasino.slug,
    logo: apiCasino.logo || '',
    tagType: apiCasino.tag_type || 'free',
    tagText: apiCasino.tag_text || '',
    rating: parseFloat(apiCasino.rating) || 0,
    bonusText: apiCasino.bonus_text || '',
    rewardsCount: apiCasino.rewards_count || 0,
    category: apiCasino.category || 'cs2',
    country: apiCasino.country,
    minDeposit: apiCasino.min_deposit,
    license: apiCasino.license,
    promoCode: apiCasino.promo_code,
    description: apiCasino.description,
    founded: apiCasino.founded,
    paymentMethodIds: apiCasino.paymentMethodIds || [],
    tagIds: apiCasino.tagIds || [],
    gameModeIds: apiCasino.gameModeIds || [],
    isFeatured: apiCasino.is_featured === 1 || apiCasino.isFeatured === true,
    hasReview: apiCasino.has_review === 1 || apiCasino.hasReview === true,
    reviewContent: apiCasino.reviewContent || apiCasino.review_content,
    status: apiCasino.status || 'draft',
    stats: apiCasino.stats || {
      landingPageViews: apiCasino.landing_page_views || 0,
      claimBonusClicks: apiCasino.claim_bonus_clicks || 0,
      reviewReads: apiCasino.review_reads || 0,
    },
    createdAt: apiCasino.created_at || apiCasino.createdAt,
    updatedAt: apiCasino.updated_at || apiCasino.updatedAt,
  }
}

// Cache for client-side
let cachedCasinos: Casino[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Clear cache
export function clearCasinoCache() {
  cachedCasinos = null
  cacheTimestamp = 0
}

// Get all casinos from API
export async function getCasinos(options?: { status?: 'all' | 'published' }): Promise<Casino[]> {
  // For admin pages, we want to fetch fresh data (no cache) and all statuses
  const shouldUseCache = options?.status !== 'all'
  
  // Return cached data if available and fresh (only for published casinos)
  if (shouldUseCache && cachedCasinos && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedCasinos
  }

  // Server-side: return empty array (will be fetched via API routes)
  if (typeof window === "undefined") {
    return []
  }

  try {
    const { casinosApi } = await import('./api-client')
    const response = await casinosApi.getAll({ 
      status: options?.status === 'all' ? undefined : 'published' 
    })
    
    if (response.data && Array.isArray(response.data)) {
      const casinos = response.data.map(transformApiCasino)
      // Only cache published casinos
      if (shouldUseCache) {
        cachedCasinos = casinos
        cacheTimestamp = Date.now()
      }
      return casinos
    }
    
    return []
  } catch (error) {
    console.error('Failed to fetch casinos:', error)
    // Return cached data if available, even if stale (only for published)
    if (shouldUseCache && cachedCasinos) {
      return cachedCasinos
    }
    return []
  }
}

// Get casino by slug
export async function getCasinoBySlug(slug: string): Promise<Casino | undefined> {
  if (typeof window === "undefined") {
    return undefined
  }

  try {
    const { casinosApi } = await import('./api-client')
    const response = await casinosApi.getBySlug(slug)
    
    if (response.data) {
      return transformApiCasino(response.data)
    }
    
    return undefined
  } catch (error) {
    console.error('Failed to fetch casino:', error)
    // Fallback to cache
    if (cachedCasinos) {
      return cachedCasinos.find(c => c.slug === slug)
    }
    return undefined
  }
}

// Save casinos (for admin - updates API)
export async function saveCasinos(casinos: Casino[]): Promise<void> {
  // This is mainly for admin operations
  // Individual updates should use updateCasinoProperties
  clearCasinoCache()
}

// Tracking functions
export async function trackLandingPageView(slug: string): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const casino = await getCasinoBySlug(slug)
    if (!casino) return

    const { casinosApi } = await import('./api-client')
    await casinosApi.trackLandingPageView(casino.id)
    clearCasinoCache()
  } catch (error) {
    console.error('Failed to track landing page view:', error)
  }
}

export async function trackClaimBonusClick(slug: string): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const casino = await getCasinoBySlug(slug)
    if (!casino) return

    const { casinosApi } = await import('./api-client')
    await casinosApi.trackClaimBonusClick(casino.id)
    clearCasinoCache()
  } catch (error) {
    console.error('Failed to track claim bonus click:', error)
  }
}

export async function trackReviewRead(slug: string): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const casino = await getCasinoBySlug(slug)
    if (!casino) return

    const { casinosApi } = await import('./api-client')
    await casinosApi.trackReviewRead(casino.id)
    clearCasinoCache()
  } catch (error) {
    console.error('Failed to track review read:', error)
  }
}

// Update section content
export async function updateSectionContent(
  slug: string,
  sectionId: string,
  newContent: string
): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const casino = await getCasinoBySlug(slug)
    if (!casino) return false

    // Initialize reviewContent if it doesn't exist
    if (!casino.reviewContent) {
      casino.reviewContent = {
        sections: [],
        overview: "",
        verdict: ""
      }
    }

    // Initialize sections array if it doesn't exist or is empty
    if (!casino.reviewContent.sections || casino.reviewContent.sections.length === 0) {
      casino.reviewContent.sections = [
        { id: "overview", title: "Overview & History", content: "" },
        { id: "rewards", title: "Rewards & Promotions", content: "" },
        { id: "games", title: "Games Available", content: "" },
        { id: "payment", title: "Payment Methods", content: "" },
        { id: "security", title: "Security & Trust", content: "" },
        { id: "support", title: "Customer Support", content: "" },
        { id: "verdict", title: "Final Verdict", content: "" },
      ]
    }

    // Find or create the section
    let section = casino.reviewContent.sections.find((s) => s.id === sectionId)
    if (!section) {
      // Create new section if it doesn't exist
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
      casino.reviewContent.sections.push(section)
    }

    // Update section content
    section.content = newContent

    // Also update overview/verdict if it's one of those special sections
    if (sectionId === "overview") {
      casino.reviewContent.overview = newContent
    } else if (sectionId === "verdict") {
      casino.reviewContent.verdict = newContent
    }

    // Ensure hasReview is true when saving content
    const { casinosApi } = await import('./api-client')
    await casinosApi.update(casino.id, {
      reviewContent: casino.reviewContent,
      hasReview: true,
    })

    clearCasinoCache()
    return true
  } catch (error) {
    console.error('Failed to update section content:', error)
    return false
  }
}

// Update casino properties
export async function updateCasinoProperties(
  slug: string,
  updates: Partial<Casino>
): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const casino = await getCasinoBySlug(slug)
    if (!casino) return false

    // Transform updates to API format
    const apiUpdates: any = {}
    if (updates.rating !== undefined) apiUpdates.rating = updates.rating
    if (updates.bonusText !== undefined) apiUpdates.bonusText = updates.bonusText
    if (updates.tagText !== undefined) apiUpdates.tagText = updates.tagText
    if (updates.tagType !== undefined) apiUpdates.tagType = updates.tagType
    if (updates.promoCode !== undefined) apiUpdates.promoCode = updates.promoCode
    if (updates.description !== undefined) apiUpdates.description = updates.description
    if (updates.hasReview !== undefined) apiUpdates.hasReview = updates.hasReview
    if (updates.reviewContent !== undefined) apiUpdates.reviewContent = updates.reviewContent

    const { casinosApi } = await import('./api-client')
    await casinosApi.update(casino.id, apiUpdates)

    clearCasinoCache()
    return true
  } catch (error) {
    console.error('Failed to update casino properties:', error)
    return false
  }
}
