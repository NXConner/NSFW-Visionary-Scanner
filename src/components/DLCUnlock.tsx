/**
 * DLC Unlock Component
 * Allows users to activate NSFW content via DLC license key
 */

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Key, CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react'
import { activateDLCLicense, getDLCStatus, checkDLCUpdates } from '@/lib/dlcManager'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export const DLCUnlock = () => {
  const [licenseKey, setLicenseKey] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [status, setStatus] = useState<{
    hasLicense: boolean
    isActive: boolean
    version?: string
    expirationDate?: Date
    hasUpdate: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load status on mount
  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setIsChecking(true)
    try {
      const dlcStatus = await getDLCStatus()
      setStatus(dlcStatus)
      setError(null)
    } catch (err) {
      logger.error('Failed to load DLC status', { error: err })
      setError('Failed to load DLC status')
    } finally {
      setIsChecking(false)
    }
  }

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key')
      return
    }

    // Validate license key format (XXXX-XXXX-XXXX-XXXX)
    const licensePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    if (!licensePattern.test(licenseKey.toUpperCase())) {
      setError('Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX')
      return
    }

    setIsActivating(true)
    setError(null)

    try {
      const result = await activateDLCLicense(licenseKey.toUpperCase())
      
      if (result.success) {
        toast.success('DLC license activated successfully!')
        setLicenseKey('')
        await loadStatus()
      } else {
        setError(result.error || 'Failed to activate license')
        toast.error(result.error || 'Failed to activate license')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Failed to activate license')
      logger.error('License activation error', { error: err })
    } finally {
      setIsActivating(false)
    }
  }

  const handleCheckUpdates = async () => {
    setIsChecking(true)
    try {
      const update = await checkDLCUpdates()
      if (update) {
        toast.info(`Update available: Version ${update.version}`)
        setStatus(prev => prev ? { ...prev, hasUpdate: true } : null)
      } else {
        toast.success('You have the latest version')
        setStatus(prev => prev ? { ...prev, hasUpdate: false } : null)
      }
    } catch (err) {
      logger.error('Failed to check updates', { error: err })
      toast.error('Failed to check for updates')
    } finally {
      setIsChecking(false)
    }
  }

  const handleDownloadUpdate = async () => {
    if (!status?.hasUpdate) return

    setIsDownloading(true)
    setDownloadProgress(0)
    try {
      const update = await checkDLCUpdates()
      if (update) {
        // Use the content package download system with progress tracking
        const { downloadAndInstallDLC } = await import('@/lib/contentPackage')
        const result = await downloadAndInstallDLC(
          update.downloadUrl,
          update.checksum,
          (progress) => {
            setDownloadProgress(progress)
          }
        )
        
        if (result.success) {
          toast.success('DLC content updated successfully!')
          await loadStatus()
          setDownloadProgress(0)
        } else {
          toast.error(result.error || 'Failed to download update')
        }
      }
    } catch (err) {
      logger.error('Failed to download update', { error: err })
      toast.error('Failed to download update')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  if (status?.hasLicense && status.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            NSFW Content Unlocked
          </CardTitle>
          <CardDescription>
            Your DLC license is active and NSFW content is available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Content Version:</span>
              <span className="font-medium">{status.version || '1.0.0'}</span>
            </div>
            {status.expirationDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expires:</span>
                <span className="font-medium">
                  {new Date(status.expirationDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {status.hasUpdate && (
            <Alert>
              <AlertDescription>
                <div className="space-y-3">
                  <p>Update available for your DLC content</p>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      onClick={handleDownloadUpdate}
                      disabled={isDownloading}
                      className="w-full"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Downloading... {Math.round(downloadProgress)}%
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download Update
                        </>
                      )}
                    </Button>
                    {isDownloading && downloadProgress > 0 && (
                      <Progress value={downloadProgress} className="h-2" />
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCheckUpdates}
              disabled={isChecking}
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for Updates
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Unlock NSFW Content
        </CardTitle>
        <CardDescription>
          Enter your DLC license key to unlock NSFW content and features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="license-key">License Key</Label>
          <Input
            id="license-key"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChange={(e) => {
              setLicenseKey(e.target.value.toUpperCase())
              setError(null)
            }}
            disabled={isActivating}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Enter the license key you received after purchasing the NSFW DLC upgrade
          </p>
        </div>

        <Button
          onClick={handleActivate}
          disabled={isActivating || !licenseKey.trim()}
          className="w-full"
        >
          {isActivating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <Key className="w-4 h-4 mr-2" />
              Activate License
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• License keys are purchased from our official website</p>
          <p>• One license key per account</p>
          <p>• NSFW content unlocks immediately after activation</p>
        </div>
      </CardContent>
    </Card>
  )
}

