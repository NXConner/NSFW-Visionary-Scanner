/**
 * Model3DViewer Component
 * 3D model viewer placeholder
 */

import { Card, CardContent } from '@/components/ui/card'

interface Model3DViewerProps {
  modelUrl?: string
  className?: string
}

export const Model3DViewer = ({ modelUrl, className }: Model3DViewerProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            3D Viewer - Coming Soon
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

