/**
 * DLC Status Component
 * Displays current DLC license status in settings or profile
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, Download, RefreshCw } from 'lucide-react'
import { getDLCStatus, checkDLCUpdates, downloadDLCContent } from '@/lib/dlcManager'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export const DLCStatus = () => {
  const [status, setStatus] = useState<{
    hasLicense: boolean
    isActive: boolean
    version?: string
    expirationDate?: Date
    hasUpdate: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setIsLoading(true)
    try {
      const dlcStatus = await getDLCStatus()
      setStatus(dlcStatus)
    } catch (err) {
      logger.error('Failed to load DLC status', { error: err })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckUpdates = async () => {
    setIsUpdating(true)
    try {
      const update = await checkDLCUpdates()
      if (update) {
        toast.info(`Update available: Version ${update.version}`)
        await loadStatus()
      } else {
        toast.success('You have the latest version')
        await loadStatus()
      }
    } catch (err) {
      logger.error('Failed to check updates', { error: err })
      toast.error('Failed to check for updates')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDownloadUpdate = async () => {
    if (!status?.hasUpdate) return

    setIsUpdating(true)
    try {
      const update = await checkDLCUpdates()
      if (update) {
        const result = await downloadDLCContent(update.downloadUrl)
        if (result.success) {
          toast.success('DLC content updated successfully!')
          await loadStatus()
        } else {
          toast.error(result.error || 'Failed to download update')
        }
      }
    } catch (err) {
      logger.error('Failed to download update', { error: err })
      toast.error('Failed to download update')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status?.hasLicense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NSFW Content</CardTitle>
          <CardDescription>DLC license status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not unlocked</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Purchase the NSFW DLC upgrade to unlock adult content and features
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>NSFW Content</span>
          <Badge variant={status.isActive ? 'default' : 'secondary'}>
            {status.isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>DLC license status</CardDescription>
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
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {new Date(status.expirationDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {status.hasUpdate && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-900 dark:text-blue-100">
                Update available
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleCheckUpdates}
          disabled={isUpdating}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          Check for Updates
        </Button>
      </CardContent>
    </Card>
  )
}

