"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CasinosPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/casinos/cs2")
  }, [router])

  return null
}
