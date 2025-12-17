"use client"

import { useState, useEffect } from "react"
import { checkApiHealth, waitForApi } from "@/lib/api-health"

interface ApiLoadingScreenProps {
  children: React.ReactNode
}

export function ApiLoadingScreen({ children }: ApiLoadingScreenProps) {
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true
    let retryInterval: NodeJS.Timeout | null = null

    const checkApi = async () => {
      setIsChecking(true)
      const healthy = await waitForApi(30, 2000) // 30 retries, 2 second intervals = 60 seconds max
      
      if (isMounted) {
        setIsApiHealthy(healthy)
        setIsChecking(false)
        
        if (!healthy) {
          // If API is not healthy, keep retrying every 5 seconds
          retryInterval = setInterval(async () => {
            if (isMounted) {
              setRetryCount(prev => prev + 1)
              const healthy = await checkApiHealth()
              if (healthy) {
                setIsApiHealthy(true)
                setIsChecking(false)
                if (retryInterval) {
                  clearInterval(retryInterval)
                  retryInterval = null
                }
              }
            }
          }, 5000)
        }
      }
    }

    checkApi()

    return () => {
      isMounted = false
      if (retryInterval) {
        clearInterval(retryInterval)
      }
    }
  }, [])

  // Show loading screen while checking or retrying
  if (isChecking || isApiHealthy === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        {/* Background blur effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Spinning playing card */}
          <div className="relative w-16 h-24 flex items-center justify-center">
            <div className="w-14 h-20 bg-white rounded-md border-2 border-purple-400 shadow-2xl shadow-purple-500/50 animate-spin relative">
              <div className="absolute top-1 left-1.5 text-[11px] font-bold text-purple-600 leading-none">A</div>
              <div className="absolute top-3 left-1.5 text-[9px] text-purple-600 leading-none">♠</div>
              <div className="absolute bottom-1 right-1.5 text-[11px] font-bold text-purple-600 leading-none transform rotate-180">A</div>
              <div className="absolute bottom-3 right-1.5 text-[9px] text-purple-600 leading-none transform rotate-180">♠</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {isChecking 
              ? "Connecting to API..." 
              : `Trying to connect to API... (${retryCount})`}
          </p>
        </div>
      </div>
    )
  }

  // API is healthy, render children
  return <>{children}</>
}

