"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Save,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface RichTextEditorProps {
  content: string
  onSave: (content: string) => void
  onCancel: () => void
}

export function RichTextEditor({ content, onSave, onCancel }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")

  // Focus editor and restore selection
  const focusEditor = () => {
    editorRef.current?.focus()
  }

  // Execute formatting commands safely
  const format = (command: string) => {
    document.execCommand(command, false)
    focusEditor()
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file.",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image must be smaller than 5MB.",
      })
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImage(reader.result as string)
      setIsUploading(false)
    }
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not read the image.",
      })
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Insert image at current selection
  const insertImage = () => {
    const src = uploadedImage || imageUrl
    if (!src) return

    focusEditor()

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)

    const img = document.createElement("img")
    img.src = src
    img.alt = "Inserted image"
    img.contentEditable = "false"

    Object.assign(img.style, {
      maxWidth: "100%",
      height: "auto",
      margin: "1rem 0",
      borderRadius: "0.5rem",
      display: "block",
      border: "2px dashed transparent",
      transition: "border-color 0.2s",
      minWidth: "100px",
      minHeight: "100px",
      objectFit: "contain",
      resize: "both",
      overflow: "hidden",
      cursor: "move",
    })

    // Clear selection and insert
    range.deleteContents()
    range.insertNode(img)

    // Add a zero-width space + <br> to ensure cursor can go after image
    const space = document.createTextNode("\u200B")
    const br = document.createElement("br")
    range.setStartAfter(img)
    range.insertNode(space)
    range.insertNode(br)
    range.setStartAfter(br)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    setupImageHandlers(img)

    // Cleanup
    setImageUrl("")
    setUploadedImage("")
    setShowImageDialog(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Setup resize + drag for an image
  const setupImageHandlers = (img: HTMLImageElement) => {
    // Hover effect
    img.addEventListener("mouseenter", () => img.style.borderColor = "#3b82f6")
    img.addEventListener("mouseleave", () => img.style.borderColor = "transparent")

    // ResizeObserver to prevent overflow
    const resizeObserver = new ResizeObserver(() => {
      if (!editorRef.current) return
      const editorRect = editorRef.current.getBoundingClientRect()
      const imgRect = img.getBoundingClientRect()

      if (imgRect.width > editorRect.width - 32) {
        img.style.width = `${editorRect.width - 32}px`
        img.style.height = "auto"
      }
    })
    resizeObserver.observe(img)

    // Dragging
    let isDragging = false
    let offsetX = 0
    let offsetY = 0

    const startDrag = (e: MouseEvent) => {
      // Ignore if clicking resize handle (bottom-right corner)
      const rect = img.getBoundingClientRect()
      if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return

      isDragging = true
      offsetX = e.clientX - rect.left
      offsetY = e.clientY - rect.top

      img.style.position = "absolute"
      img.style.zIndex = "10"
      img.style.pointerEvents = "none" // Allow mouse events to pass through during drag
      document.body.style.cursor = "grabbing"

      e.preventDefault()
    }

    const drag = (e: MouseEvent) => {
      if (!isDragging || !editorRef.current) return

      const editorRect = editorRef.current.getBoundingClientRect()
      const newLeft = e.clientX - editorRect.left - offsetX
      const newTop = e.clientY - editorRect.top - offsetY

      const maxLeft = editorRect.width - img.offsetWidth
      const maxTop = editorRect.height - img.offsetHeight

      img.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`
      img.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`
    }

    const endDrag = () => {
      if (isDragging) {
        isDragging = false
        img.style.pointerEvents = "auto"
        document.body.style.cursor = "default"
      }
    }

    img.addEventListener("mousedown", startDrag)
    document.addEventListener("mousemove", drag)
    document.addEventListener("mouseup", endDrag)

    // Cleanup on removal
    const mutationObserver = new MutationObserver(() => {
      if (!editorRef.current?.contains(img)) {
        resizeObserver.disconnect()
        img.removeEventListener("mousedown", startDrag)
        document.removeEventListener("mousemove", drag)
        document.removeEventListener("mouseup", endDrag)
        mutationObserver.disconnect()
      }
    })
    mutationObserver.observe(editorRef.current!, { childList: true, subtree: true })
  }

  // Insert link
  const insertLink = () => {
    if (!linkUrl || !linkText) return

    focusEditor()
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      document.execCommand("insertHTML", false, `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`)
    } else {
      document.execCommand("createLink", false, linkUrl)
    }

    setLinkUrl("")
    setLinkText("")
    setShowLinkDialog(false)
  }

  // Save content
  const handleSave = () => {
    const htmlContent = editorRef.current?.innerHTML || ""
    onSave(htmlContent)
  }

  // Load initial content and setup existing images
  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content

      // Setup handlers for any pre-existing images
      editorRef.current.querySelectorAll("img").forEach((img) => {
        setupImageHandlers(img as HTMLImageElement)
      })
    }
  }, [content])

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => format("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => format("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => format("underline")} title="Underline">
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button variant="ghost" size="sm" onClick={() => format("insertUnorderedList")} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => format("insertOrderedList")} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button variant="ghost" size="sm" onClick={() => setShowLinkDialog(true)} title="Insert Link">
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowImageDialog(true)} title="Insert Image">
          <Image className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-6 focus:outline-none prose prose-sm max-w-none"
        style={{ whiteSpace: "pre-wrap" }}
        onPaste={(e) => {
          e.preventDefault()
          const text = e.clipboardData.getData("text/plain")
          document.execCommand("insertText", false, text)
        }}
      />

      {/* Global image styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        [contenteditable="true"] img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 1rem 0 !important;
          border-radius: 0.5rem !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s !important;
          resize: both !important;
          overflow: hidden !important;
          min-width: 100px !important;
          min-height: 100px !important;
          object-fit: contain !important;
        }
        [contenteditable="true"] img:hover {
          border-color: #3b82f6 !important;
        }
      ` }} />

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImageDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Upload Image</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                {isUploading && <p className="text-sm text-muted-foreground mt-1">Processing...</p>}
                {uploadedImage && (
                  <img src={uploadedImage} alt="Preview" className="mt-3 max-w-full h-auto max-h-48 rounded border" />
                )}
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">or</span></div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    setUploadedImage("")
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={insertImage} disabled={!uploadedImage && !imageUrl} className="flex-1">
                  Insert
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowImageDialog(false)
                  setImageUrl("")
                  setUploadedImage("")
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <Label>Text to display</Label>
                <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Click here" />
              </div>
              <div>
                <Label>URL</Label>
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
              </div>
              <div className="flex gap-3">
                <Button onClick={insertLink} className="flex-1" disabled={!linkUrl || !linkText}>Insert</Button>
                <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}