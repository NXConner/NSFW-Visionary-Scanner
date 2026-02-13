/**
 * Lazy-loaded 3D Model Viewer
 *
 * This wrapper provides code-splitting for the heavy three.js and @react-three/* libraries.
 * The actual 3D viewer component is only loaded when this component mounts.
 */

import { lazy, Suspense, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";

// Lazy load the heavy 3D viewer component
const Model3DViewer = lazy(() =>
  import("@/components/model3dViewer/Model3DViewer").then(m => ({
    default: m.Model3DViewer,
  })),
);

type Model3DViewerProps = ComponentProps<typeof Model3DViewer>;

function Model3DViewerFallback() {
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-lg border bg-muted/50">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm">Loading 3D Viewer...</span>
      </div>
    </div>
  );
}

export function LazyModel3DViewer(props: Model3DViewerProps) {
  return (
    <Suspense fallback={<Model3DViewerFallback />}>
      <Model3DViewer {...props} />
    </Suspense>
  );
}

export default LazyModel3DViewer;
