// casino-data.ts

// Global Payment Methods List
export interface PaymentMethod {
  id: string
  name: string
  type: "image" | "icon"
  value: string
}

export const paymentMethods: PaymentMethod[] = [
  { id: "visa", name: "Visa", type: "image", value: "/assets//payments/visa.svg" },
  { id: "mastercard", name: "Mastercard", type: "image", value: "/assets/payments/mastercard.svg" },
  { id: "paypal", name: "PayPal", type: "image", value: "/assets/payments/paypal.svg" },
  { id: "bitcoin", name: "Bitcoin", type: "icon", value: "bitcoin" },
  { id: "ethereum", name: "Ethereum", type: "icon", value: "ethereum" },
]

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

  // NEW: Reference payment methods by ID
  paymentMethodIds?: string[]

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

// Default casino data
export const defaultCasinos: Casino[] = [
  {
    id: "1",
    name: "ClashGG",
    slug: "clash-gg",
    logo: "/assets/casinos/clash.svg",
    tagType: "free",
    tagText: "Free Bonus",
    rating: 5,
    bonusText: "3 Free Cases",
    rewardsCount: 2,
    category: "cs2",

    paymentMethodIds: ["visa", "mastercard", "bitcoin"],

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
    name: "Stake",
    slug: "Stake",
    logo: "/assets/casinos/stake.svg",
    tagType: "deposit",
    tagText: "Deposit Bonus",
    rating: 5,
    bonusText: "100% Match",
    rewardsCount: 2,
    category: "general",
    country: "usa",

    paymentMethodIds: ["visa", "mastercard", "paypal", "bitcoin"],

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

let cachedCasinos: Casino[] | null = null

export function getCasinos(): Casino[] {
  if (cachedCasinos) return cachedCasinos

  if (typeof window === "undefined") {
    cachedCasinos = defaultCasinos
    return cachedCasinos
  }

  const stored = localStorage.getItem("casinos")

  if (!stored) {
    localStorage.setItem("casinos", JSON.stringify(defaultCasinos))
    cachedCasinos = defaultCasinos
    return cachedCasinos
  }

  try {
    cachedCasinos = JSON.parse(stored)
    return cachedCasinos
  } catch {
    localStorage.setItem("casinos", JSON.stringify(defaultCasinos))
    cachedCasinos = defaultCasinos
    return cachedCasinos
  }
}

export function saveCasinos(casinos: Casino[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("casinos", JSON.stringify(casinos))
}

export function getCasinoBySlug(slug: string) {
  return getCasinos().find((c) => c.slug === slug)
}

// Tracking
export function trackLandingPageView(slug: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (!casino) return
  casino.stats.landingPageViews++
  saveCasinos(casinos)
}

export function trackClaimBonusClick(slug: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (!casino) return
  casino.stats.claimBonusClicks++
  saveCasinos(casinos)
}

export function trackReviewRead(slug: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (!casino) return
  casino.stats.reviewReads++
  saveCasinos(casinos)
}


export function updateSectionContent(slug: string, sectionId: string, newContent: string) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (!casino || !casino.reviewContent) return

  const section = casino.reviewContent.sections.find((s) => s.id === sectionId)
  if (!section) return

  section.content = newContent
  casino.updatedAt = new Date().toISOString()

  saveCasinos(casinos)
}


export function updateCasinoProperties(slug: string, updates: Partial<Casino>) {
  const casinos = getCasinos()
  const casino = casinos.find((c) => c.slug === slug)
  if (!casino) return

  Object.assign(casino, updates)
  casino.updatedAt = new Date().toISOString()

  saveCasinos(casinos)
}
