'use client'

import { useRef, useState } from 'react'
import { Upload, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VerifyDropzoneProps {
  onFileSelected: (file: File | null, text: string | null) => void
  isLoading?: boolean
}

export function VerifyDropzone({
  onFileSelected,
  isLoading = false,
}: VerifyDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [textInput, setTextInput] = useState('')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading) {
      setDragActive(e.type === 'dragenter' || e.type === 'dragover')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (isLoading) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        onFileSelected(file, null)
        setTextInput('')
      } else {
        alert('Please drop an image file (PNG, JPG, etc.)')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files[0]) {
      onFileSelected(files[0], null)
      setTextInput('')
    }
  }

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onFileSelected(null, textInput)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-12 text-center ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card/50 hover:border-primary/50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full"
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Upload Screenshot or Image
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your WhatsApp screenshot, news image, or any
                financial claim image here
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase text-muted-foreground font-medium">
          Or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-4 top-4 text-muted-foreground">
            <LinkIcon className="w-5 h-5" />
          </div>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            disabled={isLoading}
            placeholder="Paste a link to the claim, article, or financial news here..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
            rows={3}
          />
        </div>
        <Button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || isLoading}
          className="w-full"
        >
          Verify Claim
        </Button>
      </div>
    </div>
  )
}
