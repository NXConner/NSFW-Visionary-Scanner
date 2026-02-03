/**
 * Social Login Buttons Component
 * Google and Apple sign-in buttons with proper OAuth handling
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialLoginButtonsProps {
  mode?: 'signin' | 'signup' | 'link'
  className?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

// Google icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// Apple icon SVG
const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
)

export const SocialLoginButtons = ({
  mode = 'signin',
  className,
  onSuccess,
  onError
}: SocialLoginButtonsProps) => {
  const { signInWithGoogle, signInWithApple, linkSocialAccount } = useAuth()
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null)

  const handleGoogleLogin = async () => {
    setLoadingProvider('google')
    try {
      let result
      if (mode === 'link') {
        result = await linkSocialAccount('google')
      } else {
        result = await signInWithGoogle()
      }

      if (result.error) {
        throw result.error
      }

      logger.userAction('social_login_initiated', undefined, { provider: 'google', mode })
      onSuccess?.()
    } catch (error) {
      logger.error('Google login failed', { error, mode })
      const err = error instanceof Error ? error : new Error('Google sign-in failed')
      toast.error(err.message)
      onError?.(err)
    } finally {
      setLoadingProvider(null)
    }
  }

  const handleAppleLogin = async () => {
    setLoadingProvider('apple')
    try {
      let result
      if (mode === 'link') {
        result = await linkSocialAccount('apple')
      } else {
        result = await signInWithApple()
      }

      if (result.error) {
        throw result.error
      }

      logger.userAction('social_login_initiated', undefined, { provider: 'apple', mode })
      onSuccess?.()
    } catch (error) {
      logger.error('Apple login failed', { error, mode })
      const err = error instanceof Error ? error : new Error('Apple sign-in failed')
      toast.error(err.message)
      onError?.(err)
    } finally {
      setLoadingProvider(null)
    }
  }

  const getButtonText = (provider: 'google' | 'apple') => {
    const providerName = provider === 'google' ? 'Google' : 'Apple'
    switch (mode) {
      case 'signup':
        return `Sign up with ${providerName}`
      case 'link':
        return `Link ${providerName} Account`
      default:
        return `Continue with ${providerName}`
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 relative"
        onClick={handleGoogleLogin}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <GoogleIcon />
            <span className="ml-3">{getButtonText('google')}</span>
          </>
        )}
      </Button>

      {/* Apple Sign In */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 relative bg-black text-white hover:bg-black/90 hover:text-white"
        onClick={handleAppleLogin}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'apple' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <AppleIcon />
            <span className="ml-3">{getButtonText('apple')}</span>
          </>
        )}
      </Button>

      {mode !== 'link' && (
        <>
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Export as standalone component for settings page
export const LinkedAccountsManager = () => {
  const { user, linkSocialAccount } = useAuth()
  const [linking, setLinking] = useState<'google' | 'apple' | null>(null)
  const isAuthenticated = Boolean(user?.id)

  const providerList = new Set<string>()
  if (Array.isArray(user?.app_metadata?.providers)) {
    user?.app_metadata?.providers.forEach((provider: string) => providerList.add(provider))
  }
  if (Array.isArray(user?.identities)) {
    user.identities.forEach(identity => {
      if (identity?.provider) providerList.add(identity.provider)
    })
  }

  const hasGoogle = providerList.has('google')
  const hasApple = providerList.has('apple')

  const handleLink = async (provider: 'google' | 'apple') => {
    setLinking(provider)
    try {
      const result = await linkSocialAccount(provider)
      if (result.error) throw result.error
      toast.success(`${provider === 'google' ? 'Google' : 'Apple'} account linked`)
    } catch (error) {
      logger.error('Social account link failed', { error, provider })
      toast.error(
        error instanceof Error ? error.message : 'Failed to link social account'
      )
    } finally {
      setLinking(null)
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Linked Accounts</h4>
      <p className="text-sm text-muted-foreground">
        Connect your social accounts for easier sign-in.
      </p>
      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground">
          Sign in to link your Google or Apple account.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <GoogleIcon />
            <div>
              <p className="font-medium">Google</p>
              <p className="text-xs text-muted-foreground">
                {hasGoogle ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <Button
            variant={hasGoogle ? 'secondary' : 'outline'}
            size="sm"
            disabled={!isAuthenticated || hasGoogle || linking !== null}
            onClick={() => handleLink('google')}
          >
            {linking === 'google' ? 'Linking...' : hasGoogle ? 'Connected' : 'Connect'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <AppleIcon />
            <div>
              <p className="font-medium">Apple</p>
              <p className="text-xs text-muted-foreground">
                {hasApple ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <Button
            variant={hasApple ? 'secondary' : 'outline'}
            size="sm"
            disabled={!isAuthenticated || hasApple || linking !== null}
            onClick={() => handleLink('apple')}
          >
            {linking === 'apple' ? 'Linking...' : hasApple ? 'Connected' : 'Connect'}
          </Button>
        </div>
      </div>
    </div>
  )
}
