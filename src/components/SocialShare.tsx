/**
 * Social Share Component
 * Provides sharing buttons for various platforms
 */

import { Button } from '@/components/ui/button'
import {
  Share2, Twitter, Facebook, Linkedin, Mail, Link as LinkIcon,
  Copy, CheckCircle2
} from 'lucide-react'
import {
  shareToTwitter,
  shareToFacebook,
  shareToLinkedIn,
  shareViaEmail,
  copyLinkToClipboard,
  shareToNative,
  type ShareOptions
} from '@/lib/socialSharing'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SocialShareProps {
  title?: string
  text?: string
  url?: string
  image?: string
  variant?: 'button' | 'icon' | 'dropdown'
  showLabel?: boolean
}

export const SocialShare = ({
  title,
  text,
  url,
  image,
  variant = 'button',
  showLabel = true
}: SocialShareProps) => {
  const [copied, setCopied] = useState(false)

  const shareOptions: ShareOptions = {
    title,
    text,
    url,
    image
  }

  const handleCopy = async () => {
    const success = await copyLinkToClipboard(url)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    const success = await shareToNative(shareOptions)
    if (!success) {
      // Fallback to copy if native share not available
      handleCopy()
    }
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            {showLabel && 'Share'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share via...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => shareToTwitter(shareOptions)}>
            <Twitter className="w-4 h-4 mr-2" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => shareToFacebook(shareOptions)}>
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => shareToLinkedIn(shareOptions)}>
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => shareViaEmail(shareOptions)}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === 'icon') {
    return (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNativeShare}
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          title="Copy link"
        >
          {copied ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {showLabel && 'Share'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => shareToTwitter(shareOptions)}
      >
        <Twitter className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => shareToFacebook(shareOptions)}
      >
        <Facebook className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <LinkIcon className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}

