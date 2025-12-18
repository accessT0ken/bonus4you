"use client"

import { useEffect, useState } from "react"
import { supportApi } from "@/lib/api-client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, User, Mail, Globe, RefreshCw, Power } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

type Conversation = {
  id: number
  guest_id: string
  name: string | null
  email: string | null
  ip_address: string | null
  last_page: string | null
  status: "open" | "closed"
  last_activity_at: string
  created_at: string
}

type ConversationWithMessages = {
  conversation: Conversation
  messages: {
    id: number
    sender_type: "guest" | "admin"
    sender_id: number | null
    message: string
    page_url: string | null
    created_at: string
  }[]
}

export default function SupportAdminPage() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<ConversationWithMessages | null>(null)
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">("open")
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [reply, setReply] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [supportEnabled, setSupportEnabled] = useState(true)
  const [isTogglingSupport, setIsTogglingSupport] = useState(false)

  const loadConfig = async () => {
    try {
      const res = await supportApi.getConfig()
      if (res.data) {
        setSupportEnabled(!!res.data.supportEnabled)
      }
    } catch (e) {
      console.error("Failed to load support config", e)
    }
  }

  const loadConversations = async () => {
    setIsLoadingList(true)
    try {
      const params = statusFilter === "all" ? undefined : { status: statusFilter }
      const res = await supportApi.getConversations(params as any)
      if (res.data && Array.isArray(res.data)) {
        setConversations(res.data as any)
      }
    } catch (e) {
      console.error("Failed to load support conversations", e)
    } finally {
      setIsLoadingList(false)
    }
  }

  const loadConversation = async (id: number) => {
    setIsLoadingConversation(true)
    try {
      const res = await supportApi.getConversationMessages(id)
      if (res.data) {
        setSelected(res.data as any)
      }
    } catch (e) {
      console.error("Failed to load conversation", e)
    } finally {
      setIsLoadingConversation(false)
    }
  }

  useEffect(() => {
    loadConfig()
    loadConversations()
  }, [statusFilter])

  useEffect(() => {
    if (selectedId != null) {
      loadConversation(selectedId)
    } else {
      setSelected(null)
    }
  }, [selectedId])

  const handleReply = async () => {
    if (!selected || !reply.trim()) return
    setIsSending(true)
    try {
      await supportApi.replyToConversation(selected.conversation.id, reply.trim())
      setReply("")
      await loadConversation(selected.conversation.id)
      await loadConversations()
    } catch (e: any) {
      console.error("Failed to send reply", e)
      toast({
        variant: "destructive",
        title: "Failed to send reply",
        description: e?.message || "Failed to send reply. Please try again.",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleStatusChange = async (status: "open" | "closed") => {
    if (!selected) return
    try {
      await supportApi.updateConversationStatus(selected.conversation.id, status)
      await loadConversations()
      await loadConversation(selected.conversation.id)
    } catch (e: any) {
      console.error("Failed to update status", e)
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: e?.message || "Failed to update status. Please try again.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Inbox</h1>
          <p className="text-muted-foreground">
            View and reply to live support messages sent from the site widget.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 bg-background">
            <Power className={`w-3.5 h-3.5 ${supportEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
            <span className="text-xs font-medium text-muted-foreground">
              Support {supportEnabled ? "online" : "offline"}
            </span>
            <Switch
              checked={supportEnabled}
              onCheckedChange={async (checked) => {
                setIsTogglingSupport(true)
                try {
                  await supportApi.updateConfig(checked)
                  setSupportEnabled(checked)
                  toast({
                    variant: "success",
                    title: "Support updated",
                    description: `Live support is now ${checked ? "enabled" : "disabled"}.`,
                  })
                } catch (e: any) {
                  console.error("Failed to update support config", e)
                  toast({
                    variant: "destructive",
                    title: "Failed to update support status",
                    description: e?.message || "Please try again.",
                  })
                } finally {
                  setIsTogglingSupport(false)
                }
              }}
              disabled={isTogglingSupport}
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadConversations}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <CardDescription>Latest visitor chats</CardDescription>
            </div>
            {isLoadingList && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="inline-flex items-center gap-1 mb-2 rounded-full bg-muted/40 p-1">
              {["open", "closed", "all"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 rounded-full px-3 text-[11px] ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-transparent text-muted-foreground hover:bg-background"
                  }`}
                  onClick={() => setStatusFilter(s as any)}
                >
                  {s === "open" && "Open"}
                  {s === "closed" && "Closed"}
                  {s === "all" && "All"}
                </Button>
              ))}
            </div>

            <div className="max-h-[420px] overflow-y-auto space-y-2 text-sm">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  No conversations yet.
                </p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 hover:bg-accent transition-colors ${
                    selectedId === c.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {c.name || "Guest"}
                    </span>
                    <Badge
                      variant={c.status === "open" ? "default" : "outline"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {c.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                      <Mail className="w-3 h-3" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.last_page && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate mt-0.5">
                      <Globe className="w-3 h-3" />
                      <span>{c.last_page}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Last activity: {new Date(c.last_activity_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-medium">Conversation</CardTitle>
              <CardDescription>
                {selected
                  ? `Guest ${selected.conversation.name || "Anonymous"} • IP: ${
                      selected.conversation.ip_address || "Unknown"
                    }`
                  : "Select a conversation from the left."}
              </CardDescription>
            </div>
            {selected && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={selected.conversation.status === "open" ? "default" : "outline"}
                  className="text-[10px] px-2 py-0"
                >
                  {selected.conversation.status === "open" ? "Open" : "Closed"}
                </Badge>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    handleStatusChange(
                      selected.conversation.status === "open" ? "closed" : "open"
                    )
                  }
                >
                  {selected.conversation.status === "open" ? "Close" : "Reopen"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col h-[480px]">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <MessageSquare className="w-6 h-6 mb-2" />
                <p>Select a conversation to see the messages.</p>
              </div>
            ) : isLoadingConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading conversation...
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto mb-3 space-y-2 text-xs">
                  {selected.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.sender_type === "guest" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-snug ${
                          m.sender_type === "guest"
                            ? "bg-slate-100 text-slate-800 rounded-bl-sm"
                            : "bg-primary text-primary-foreground rounded-br-sm"
                        }`}
                      >
                        <p>{m.message}</p>
                        <p className="mt-1 text-[9px] opacity-70">
                          {new Date(m.created_at).toLocaleString()}
                          {m.page_url && m.sender_type === "guest" && (
                            <>
                              {" "}
                              · <span className="underline">{m.page_url}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  {selected.messages.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center mt-4">
                      No messages yet in this conversation.
                    </p>
                  )}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply to the visitor..."
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Replies are sent instantly to the visitor if they keep the widget open.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={isSending || !reply.trim()}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reply"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


