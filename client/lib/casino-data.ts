// Casino data structure and tracking
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
  // Casino details
  description?: string
  founded?: string
  license?: string
  minDeposit?: string
  paymentMethods?: string[]
  games?: string[]
  promoCode?: string
  // Blog/Review content
  hasReview: boolean
  reviewContent?: {
    sections: Array<{ id: string; title: string; content: string }>
    overview?: string
    verdict?: string
  }
  // Status
  status: "draft" | "published"
  // Stats
  stats: {
    landingPageViews: number
    claimBonusClicks: number
    reviewReads: number
  }
  createdAt: string
  updatedAt: string
}

// Default casino data
export const defaultCasinos: Casino[] = [
  {
    id: "1",
    name: "ClashGG",
    slug: "clash-gg",
    logo: "/clash-gg-logo.jpg",
    tagType: "free",
    tagText: "Free Bonus",
    rating: 5,
    bonusText: "3 Free Cases",
    rewardsCount: 2,
    category: "cs2",
    hasReview: true,
    status: "published",
    stats: {
      landingPageViews: 1245,
      claimBonusClicks: 342,
      reviewReads: 189,
    },
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "2",
    name: "CSGOEmpire",
    slug: "csgo-empire",
    logo: "/csgo-empire-logo.jpg",
    tagType: "deposit",
    tagText: "Deposit Bonus",
    rating: 5,
    bonusText: "5% Deposit Bonus",
    rewardsCount: 1,
    category: "cs2",
    hasReview: true,
    status: "published",
    stats: {
      landingPageViews: 2156,
      claimBonusClicks: 523,
      reviewReads: 312,
    },
    createdAt: "2025-01-01",
    updatedAt: "2025-01-12",
  },
  {
    id: "3",
    name: "CSGORoll",
    slug: "csgo-roll",
    logo: "/csgo-roll-logo.jpg",
    tagType: "free",
    tagText: "Free Bonus",
    rating: 5,
    bonusText: "$0.50 Free",
    rewardsCount: 3,
    category: "cs2",
    hasReview: false,
    status: "published",
    stats: {
      landingPageViews: 1892,
      claimBonusClicks: 456,
      reviewReads: 0,
    },
    createdAt: "2025-01-05",
    updatedAt: "2025-01-10",
  },
  {
    id: "4",
    name: "CSGOLuck",
    slug: "csgo-luck",
    logo: "/csgo-luck-logo.jpg",
    tagType: "deposit",
    tagText: "Deposit Bonus",
    rating: 4,
    bonusText: "10% Rakeback",
    rewardsCount: 2,
    category: "cs2",
    hasReview: false,
    status: "published",
    stats: {
      landingPageViews: 1456,
      claimBonusClicks: 289,
      reviewReads: 0,
    },
    createdAt: "2025-01-08",
    updatedAt: "2025-01-08",
  },
  {
    id: "5",
    name: "SkinClub",
    slug: "skin-club",
    logo: "/skin-club-logo.jpg",
    tagType: "free",
    tagText: "Free Bonus",
    rating: 5,
    bonusText: "2 Free Cases",
    rewardsCount: 1,
    category: "cs2",
    hasReview: false,
    status: "published",
    stats: {
      landingPageViews: 987,
      claimBonusClicks: 234,
      reviewReads: 0,
    },
    createdAt: "2025-01-10",
    updatedAt: "2025-01-10",
  },
  {
    id: "6",
    name: "RustClash",
    slug: "rust-clash",
    logo: "/rust-clash-logo.jpg",
    tagType: "deposit",
    tagText: "Deposit Bonus",
    rating: 4,
    bonusText: "15% First Deposit",
    rewardsCount: 4,
    category: "cs2",
    hasReview: false,
    status: "published",
    stats: {
      landingPageViews: 756,
      claimBonusClicks: 178,
      reviewReads: 0,
    },
    createdAt: "2025-01-12",
    updatedAt: "2025-01-12",
  },
  {
    id: "7",
    name: "Stake Casino",
    slug: "stake-casino",
    logo: "/stake-casino-logo.jpg",
    tagType: "free",
    tagText: "Free Bonus",
    rating: 5,
    bonusText: "$25 Free",
    rewardsCount: 3,
    category: "general",
    country: "usa",
    hasReview: false,
    status: "published",
    stats: {
      landingPageViews: 2341,
      claimBonusClicks: 678,
      reviewReads: 0,
    },
    createdAt: "2025-01-15",
    updatedAt: "2025-01-15",
  },
  {
    id: "8",
    name: "Bitstarz",
    slug: "bitstarz",
    logo: "/bitstarz-casino-logo.jpg",
    tagType: "deposit",
    tagText: "Deposit Bonus",
    rating: 5,
    bonusText: "100% Match",
    rewardsCount: 2,
    category: "general",
    country: "latvia",
    hasReview: false,
    status: "published",
    stats: {
      landingPageViews: 1892,
      claimBonusClicks: 512,
      reviewReads: 0,
    },
    createdAt: "2025-01-18",
    updatedAt: "2025-01-18",
  },
]

// Get casinos from localStorage or return defaults
export function getCasinos(): Casino[] {
  if (typeof window === "undefined") return defaultCasinos
  const stored = localStorage.getItem("casinos")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return defaultCasinos
    }
  }
  // Initialize with defaults
  localStorage.setItem("casinos", JSON.stringify(defaultCasinos))
  return defaultCasinos
}

// Save casinos to localStorage
export function saveCasinos(casinos: Casino[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("casinos", JSON.stringify(casinos))
}

// Get casino by slug
export function getCasinoBySlug(slug: string): Casino | undefined {
  const casinos = getCasinos()
  return casinos.find((c) => c.slug === slug)
}

// Track landing page view
export function trackLandingPageView(slug: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (casino) {
    casino.stats.landingPageViews++
    saveCasinos(casinos)
  }
}

// Track claim bonus click
export function trackClaimBonusClick(slug: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (casino) {
    casino.stats.claimBonusClicks++
    saveCasinos(casinos)
  }
}

// Track review read
export function trackReviewRead(slug: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (casino) {
    casino.stats.reviewReads++
    saveCasinos(casinos)
  }
}

// Update casino review content
export function updateCasinoReviewContent(slug: string, reviewContent: Casino["reviewContent"]) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (casino) {
    casino.reviewContent = reviewContent
    casino.hasReview = true
    casino.updatedAt = new Date().toISOString().split("T")[0]
    saveCasinos(casinos)
    return true
  }
  return false
}

// Update section content
export function updateSectionContent(slug: string, sectionId: string, content: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (casino) {
    if (!casino.reviewContent) {
      casino.reviewContent = { sections: [] }
    }
    const section = casino.reviewContent.sections.find((s) => s.id === sectionId)
    if (section) {
      section.content = content
    } else {
      // Create section if it doesn't exist
      const sectionTitle = sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/-/g, " ")
      casino.reviewContent.sections.push({ id: sectionId, title: sectionTitle, content })
    }
    casino.hasReview = true
    casino.updatedAt = new Date().toISOString().split("T")[0]
    saveCasinos(casinos)
    return true
  }
  return false
}

// Update casino properties
export function updateCasinoProperties(slug: string, updates: Partial<Casino>) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (casino) {
    Object.assign(casino, updates)
    casino.updatedAt = new Date().toISOString().split("T")[0]
    saveCasinos(casinos)
    return true
  }
  return false
}

