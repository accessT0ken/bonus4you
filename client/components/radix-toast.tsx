"use client"

import * as Toast from "@radix-ui/react-toast"
import { X } from "lucide-react"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"

type ToastMessage = {
  id: number
  title: string
  description?: string
}

const ToastContext = createContext({
  showToast: (_msg: Omit<ToastMessage, "id">) => {},
})

export function useRadixToast() {
  return useContext(ToastContext)
}

export function RadixToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const DURATION = 2500 // 4s auto dismiss

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640
  const MAX_TOASTS = isMobile ? 3 : 10
  

  const showToast = useCallback((msg: Omit<ToastMessage, "id">) => {
    setToasts((prev) => {
      const newToast = { id: Date.now(), ...msg }

      // Limit max toasts
      if (prev.length >= MAX_TOASTS) {
        prev = prev.slice(1) // remove oldest
      }

      return [...prev, newToast]
    })
  }, [])

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right" duration={DURATION}>
        {children}

        {/* Render each toast */}
        {toasts.map((toast) => (
          <RadixToastItem
            key={toast.id}
            toast={toast}
            duration={DURATION}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        <Toast.Viewport
            className="
                fixed z-[9999] outline-none flex flex-col gap-3
                /* Desktop */
                sm:bottom-6 sm:right-6
                /* Mobile */
                bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm
            "
        />
        </Toast.Provider>
    </ToastContext.Provider>
  )
}

function RadixToastItem({
    toast,
    duration,
    onClose,
  }: {
    toast: ToastMessage
    duration: number
    onClose: () => void
  }) {
    const [open, setOpen] = useState(true)
    const [progress, setProgress] = useState(100)
  
    // Progress bar animation
    useEffect(() => {
      const interval = 20
      const steps = duration / interval
      let current = 100
  
      const timer = setInterval(() => {
        current -= 100 / steps
        setProgress(current)
  
        if (current <= 0) {
          clearInterval(timer)
          setOpen(false)
          setTimeout(onClose, 200)
        }
      }, interval)
  
      return () => clearInterval(timer)
    }, [duration, onClose])
  
    return (
      <Toast.Root
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose()
          setOpen(v)
        }}
        className="
          bg-white
          border border-yellow-400/60
          shadow-xl 
          p-4 relative
          rounded-t-xl
          rounded-b-none
          text-black
  
          /* Animations */
          data-[state=open]:animate-slideIn
          data-[state=closed]:animate-slideOut
  
          /* Responsive width */
          w-full
          max-w-sm
          md:max-w-md
          lg:max-w-lg
  
          /* Mobile-friendly padding */
          sm:p-4 p-3
        "
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <Toast.Title className="font-bold text-lg text-yellow-700 truncate sm:whitespace-normal">
              {toast.title}
            </Toast.Title>
  
            {toast.description && (
              <Toast.Description className="text-sm text-black/70 mt-1 break-words">
                {toast.description}
              </Toast.Description>
            )}
          </div>
  
          {/* Larger, easier to tap on mobile */}
          <button
            onClick={() => setOpen(false)}
            className="text-yellow-600 hover:text-yellow-800 transition shrink-0 p-1"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
  
        {/* Progress Bar */}
        <div className="absolute left-0 bottom-0 w-full h-[4px] bg-yellow-200">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-yellow-500 transition-all"
          />
        </div>
      </Toast.Root>
    )
  }
  