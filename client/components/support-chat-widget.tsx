"use client"

import { useEffect, useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { supportApi } from "@/lib/api-client"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

type ChatMessage = {
  id: string
  senderType: "guest" | "admin"
  message: string
  createdAt: string
}

type ChatErrors = {
  name?: string
  email?: string
  message?: string
  form?: string
}

const GUEST_COOKIE_KEY = "b4y_support_guest"
const NAME_COOKIE_KEY = "b4y_support_name"
const EMAIL_COOKIE_KEY = "b4y_support_email"

function getOrCreateGuestId() {
  if (typeof document === "undefined") return ""
  const existing = document.cookie.split("; ").find((row) => row.startsWith(`${GUEST_COOKIE_KEY}=`))
  if (existing) {
    return existing.split("=")[1]
  }
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${GUEST_COOKIE_KEY}=${id}; path=/; expires=${expires.toUTCString()}`
  return id
}

function getCookie(name: string) {
  if (typeof document === "undefined") return ""
  const existing = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
  return existing ? decodeURIComponent(existing.split("=")[1]) : ""
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}`
}

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [guestId, setGuestId] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [errors, setErrors] = useState<ChatErrors>({})
  const [supportEnabled, setSupportEnabled] = useState(true)
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    supportApi
      .getConfig()
      .then((res) => {
        if (res.data) {
          setSupportEnabled(!!res.data.supportEnabled)
        }
      })
      .catch((err) => {
        console.error("Failed to load support config", err)
      })
      .finally(() => {
        setConfigLoaded(true)
      })

    const id = getOrCreateGuestId()
    setGuestId(id)
    setName(getCookie(NAME_COOKIE_KEY))
    setEmail(getCookie(EMAIL_COOKIE_KEY))
  }, [])

  const handleSend = async () => {
    if (!guestId) return

    const newErrors: ChatErrors = {}

    if (name && name.length > 100) {
      newErrors.name = "Name must be 100 characters or less."
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address."
      }
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      newErrors.message = "Please enter a message."
    } else if (trimmedMessage.length < 3) {
      newErrors.message = "Message is too short."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    if (name.trim()) setCookie(NAME_COOKIE_KEY, name.trim())
    if (email.trim()) setCookie(EMAIL_COOKIE_KEY, email.trim())

    const pageUrl = typeof window !== "undefined" ? window.location.href : undefined

    const tempId = `local-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderType: "guest",
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setMessage("")
    setIsSending(true)

    try {
      await supportApi.sendMessage({
        guestId,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: optimisticMessage.message,
        pageUrl,
      })
    } catch (error: any) {
      console.error("Failed to send support message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setErrors((prev) => ({
        ...prev,
        form: error?.message || "Failed to send message. Please try again.",
      }))
    } finally {
      setIsSending(false)
    }
  }

  if (typeof window === "undefined") return null
  if (!configLoaded || !supportEnabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen && (
        <div className="mb-3 w-80 max-w-[90vw] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white">
            <div>
              <p className="text-sm font-semibold">Live Support</p>
              <p className="text-[11px] text-white/80">Ask anything about bonuses or the site.</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 pt-3 pb-2 border-b border-slate-200 bg-slate-50/80 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Name</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="Optional"
                  className="h-8 text-xs"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder="Optional"
                  className="h-8 text-xs"
                />
                {errors.email && (
                  <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 max-h-64 overflow-y-auto px-3 py-2 space-y-2 text-xs bg-white">
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center mt-4">
                Start a conversation and our team will reply as soon as possible.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === "guest" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-snug ${
                    msg.senderType === "guest"
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-slate-50">
            <div className="border-t border-slate-200 px-3 py-2 bg-slate-50">
              {errors.form && (
                <p className="text-[11px] text-red-500 mb-1">{errors.form}</p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!isSending) handleSend()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
                  }}
                  placeholder="Type your message..."
                  className="h-9 text-xs"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSending || !message.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white shadow-xl shadow-purple-500/40 flex items-center justify-center hover:scale-105 transition-all"
          aria-label="Open support chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}


