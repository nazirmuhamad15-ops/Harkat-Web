'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onRemove: (url: string) => void
  disabled?: boolean
  endpoint?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  endpoint = '/api/upload/banners',
  className
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        onChange(data.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Hidden Input */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleUpload}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className={cn("relative w-full h-[200px] rounded-md overflow-hidden border border-gray-200 group", className)}>
          <Image 
            src={value} 
            alt="Upload" 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
                type="button"
                variant="destructive" 
                size="icon" 
                onClick={() => onRemove(value)}
                disabled={disabled}
            >
                <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(`
                border-2 border-dashed border-gray-300 rounded-md
                h-[200px] flex flex-col items-center justify-center gap-2
                cursor-pointer hover:bg-gray-50 transition-colors
                ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `, className)}
        >
            {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
                <ImagePlus className="h-8 w-8 text-gray-400" />
            )}
            <div className="text-sm text-gray-500 font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload image'}
            </div>
            <div className="text-xs text-gray-400">
                Max 10MB (JPG, PNG, WEBP)
            </div>
        </div>
      )}
    </div>
  )
}
