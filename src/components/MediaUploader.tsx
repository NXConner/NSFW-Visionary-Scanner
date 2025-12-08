/**
 * Media Uploader Component
 * Reusable component for uploading images, videos, audio, and other files
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image, Video, File, Loader2, CheckCircle2 } from 'lucide-react'
import { uploadFile, uploadFiles, uploadVideo, type UploadResult, type UploadOptions } from '@/lib/mediaUpload'
import { toast } from 'sonner'

interface MediaUploaderProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  allowedTypes?: string[]
  bucket?: string
  folder?: string
  onUploadComplete?: (result: UploadResult | UploadResult[]) => void
  onUploadError?: (error: Error) => void
  compressImages?: boolean
  showPreview?: boolean
  label?: string
  variant?: 'default' | 'compact' | 'dropzone'
}

export const MediaUploader = ({
  accept = '*/*',
  multiple = false,
  maxSize = 100 * 1024 * 1024, // 100MB
  allowedTypes = [],
  bucket,
  folder,
  onUploadComplete,
  onUploadError,
  compressImages = true,
  showPreview = true,
  label = 'Upload Files',
  variant = 'default'
}: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([])
  const [previewFiles, setPreviewFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    setPreviewFiles(fileArray)
    setUploading(true)
    setProgress(0)

    try {
      const options: UploadOptions = {
        bucket,
        folder,
        maxSize,
        allowedTypes: allowedTypes.length > 0 ? allowedTypes : undefined,
        compress: compressImages,
        onProgress: setProgress
      }

      let results: UploadResult[]

      if (multiple) {
        results = await uploadFiles(fileArray, options)
      } else {
        const result = await uploadFile(fileArray[0], options)
        results = result ? [result] : []
      }

      if (results.length > 0) {
        setUploadedFiles(results)
        onUploadComplete?.(multiple ? results : results[0])
        setPreviewFiles([])
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed')
      onUploadError?.(err)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8" />
    if (file.type.startsWith('video/')) return <Video className="w-8 h-8" />
    return <File className="w-8 h-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (variant === 'dropzone') {
    return (
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground">
          Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
        </p>
        {uploading && (
          <div className="mt-4">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {label}
            </>
          )}
        </Button>
        {uploading && <Progress value={progress} className="w-24" />}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          {showPreview && previewFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              <div className="space-y-2">
                {previewFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 border rounded bg-muted/50"
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">Uploaded Successfully:</p>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 border rounded bg-green-50 dark:bg-green-950"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.path.split('/').pop()}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

