/**
 * Storage Usage Component
 * Displays user's storage usage across all buckets
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getStorageUsage, formatBytes } from '@/lib/storageUtils'
import { supabase } from '@/integrations/supabase/client'
import { Database, HardDrive, Loader2 } from 'lucide-react'

const STORAGE_LIMITS = {
  free: 1 * 1024 * 1024 * 1024, // 1GB
  pro: 10 * 1024 * 1024 * 1024, // 10GB
  premium: 50 * 1024 * 1024 * 1024 // 50GB
}

export const StorageUsage = () => {
  const [usage, setUsage] = useState(0)
  const [limit, setLimit] = useState(STORAGE_LIMITS.free)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's subscription tier
      const { data: profile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      // Set limit based on tier
      if (profile?.role === 'premium') {
        setLimit(STORAGE_LIMITS.premium)
      } else if (profile?.role === 'pro') {
        setLimit(STORAGE_LIMITS.pro)
      } else {
        setLimit(STORAGE_LIMITS.free)
      }

      // Get actual usage
      const totalUsage = await getStorageUsage(user.id)
      setUsage(totalUsage)
    } catch (error) {
      console.error('Error loading storage usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const usagePercent = (usage / limit) * 100
  const remaining = limit - usage

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">{formatBytes(usage)} / {formatBytes(limit)}</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{usagePercent.toFixed(1)}% used</span>
            <span>{formatBytes(remaining)} remaining</span>
          </div>
        </div>

        {usagePercent > 80 && (
          <Badge variant="destructive" className="w-full justify-center">
            Storage almost full - Consider upgrading
          </Badge>
        )}

        {usagePercent > 100 && (
          <Badge variant="destructive" className="w-full justify-center">
            Storage limit exceeded - Please free up space
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

