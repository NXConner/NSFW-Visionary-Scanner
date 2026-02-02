/**
 * 3D Model Viewer Component
 * Full Three.js implementation with interactive rotation, zoom, measurement overlays, and export functionality
 */
import React, { Suspense, useCallback, useMemo, useRef, useState } from "react";

import { Canvas } from "@react-three/fiber";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Eye,
  EyeOff,
  Grid3X3,
  Layers,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Ruler,
  Settings,
} from "lucide-react";
import * as THREE from "three";
import { toast } from "sonner";

import { Scene } from "@/components/model3dViewer/scene/Scene";
import type {
  MeasurementLine,
  MeasurementPoint,
  Model3DViewerProps,
} from "@/components/model3dViewer/types";

export const Model3DViewer = ({ scanData, onCapture }: Model3DViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("view");
  const [showGrid, setShowGrid] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [modelColor, setModelColor] = useState("#ffb6c1");
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [measurementLines, setMeasurementLines] = useState<MeasurementLine[]>([]);

  const defaultMeasurements = useMemo(() => {
    if (!scanData) return { points: [], lines: [] as MeasurementLine[] };

    const length = scanData.length || 5.5;
    const normalizedLength = length / 5;

    const points: MeasurementPoint[] = [
      { id: "1", position: new THREE.Vector3(0, -normalizedLength / 2, 0), label: "Base" },
      { id: "2", position: new THREE.Vector3(0, normalizedLength / 2, 0), label: "Tip" },
    ];

    const lines: MeasurementLine[] = [
      {
        id: "1",
        start: new THREE.Vector3(0, -normalizedLength / 2, 0),
        end: new THREE.Vector3(0, normalizedLength / 2, 0),
        distance: length,
        label: "Length",
      },
    ];

    return { points, lines };
  }, [scanData]);

  const handleReset = useCallback(() => {
    setResetTrigger(prev => prev + 1);
  }, []);

  const handleCapture = useCallback(() => {
    if (!canvasRef.current) {
      toast.error("Unable to capture image");
      return;
    }

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");

      if (onCapture) {
        onCapture(dataUrl);
      } else {
        const link = document.createElement("a");
        link.download = `3d-model-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }

      toast.success("Screenshot captured");
    } catch {
      toast.error("Failed to capture screenshot");
    }
  }, [onCapture]);

  const handleFullscreen = useCallback(() => {
    const container = document.getElementById("model-viewer-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      void container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleAddMeasurementPoint = useCallback(() => {
    const newPoint: MeasurementPoint = {
      id: crypto.randomUUID(),
      position: new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ),
      label: `Point ${measurementPoints.length + 1}`,
    };
    setMeasurementPoints(prev => [...prev, newPoint]);
    toast.success("Measurement point added");
  }, [measurementPoints.length]);

  const handleClearMeasurements = useCallback(() => {
    setMeasurementPoints([]);
    setMeasurementLines([]);
    toast.success("Measurements cleared");
  }, []);

  return (
    <Card id="model-viewer-container" className="glass-card border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              3D Model Viewer
            </CardTitle>
            <CardDescription>Interactive 3D visualization with measurement tools</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {scanData?.timestamp && (
              <Badge variant="outline" className="text-xs">
                Last scan: {new Date(scanData.timestamp).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="view">
                <Eye className="w-4 h-4 mr-2" />
                View
              </TabsTrigger>
              <TabsTrigger value="measure">
                <Ruler className="w-4 h-4 mr-2" />
                Measure
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="view" className="mt-0">
            <div className="relative h-[400px] bg-gradient-to-b from-gray-900 to-gray-800">
              <Canvas ref={canvasRef} gl={{ preserveDrawingBuffer: true }} dpr={[1, 2]} shadows>
                <Suspense fallback={null}>
                  <Scene
                    scanData={scanData}
                    showGrid={showGrid}
                    showWireframe={showWireframe}
                    showMeasurements={showMeasurements}
                    autoRotate={autoRotate}
                    measurementPoints={[...defaultMeasurements.points, ...measurementPoints]}
                    measurementLines={[...defaultMeasurements.lines, ...measurementLines]}
                    modelColor={modelColor}
                    resetTrigger={resetTrigger}
                  />
                </Suspense>
              </Canvas>

              <div className="absolute bottom-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAutoRotate(!autoRotate)}
                  className="bg-black/50 hover:bg-black/70"
                  aria-label={autoRotate ? "Pause rotation" : "Start rotation"}
                >
                  {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleReset}
                  className="bg-black/50 hover:bg-black/70"
                  aria-label="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowGrid(!showGrid)}
                  className="bg-black/50 hover:bg-black/70"
                  aria-label="Toggle grid"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCapture}
                  className="bg-black/50 hover:bg-black/70"
                  aria-label="Capture screenshot"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleFullscreen}
                  className="bg-black/50 hover:bg-black/70"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {scanData && (
                <div className="absolute top-4 left-4 bg-black/70 text-white text-sm p-3 rounded-lg space-y-1">
                  <div>
                    Length:{" "}
                    <span className="font-mono">{scanData.length?.toFixed(2) || "N/A"}</span> in
                  </div>
                  <div>
                    Girth: <span className="font-mono">{scanData.girth?.toFixed(2) || "N/A"}</span>{" "}
                    in
                  </div>
                  {scanData.curvature !== undefined && scanData.curvature > 0 && (
                    <div>
                      Curvature: <span className="font-mono">{scanData.curvature.toFixed(1)}°</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="measure" className="p-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={handleAddMeasurementPoint}>
                <Ruler className="w-4 h-4 mr-2" />
                Add Point
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearMeasurements}>
                Clear All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMeasurements(!showMeasurements)}
              >
                {showMeasurements ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Measurements</h4>
              {defaultMeasurements.lines.map(line => (
                <div
                  key={line.id}
                  className="flex justify-between items-center p-2 bg-muted rounded"
                >
                  <span>{line.label}</span>
                  <span className="font-mono">{line.distance.toFixed(2)} in</span>
                </div>
              ))}
              {measurementLines.map(line => (
                <div
                  key={line.id}
                  className="flex justify-between items-center p-2 bg-muted rounded"
                >
                  <span>{line.label}</span>
                  <span className="font-mono">{line.distance.toFixed(2)} in</span>
                </div>
              ))}
              {defaultMeasurements.lines.length === 0 && measurementLines.length === 0 && (
                <p className="text-muted-foreground text-sm">No measurements yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Wireframe Mode</span>
                <Button
                  size="sm"
                  variant={showWireframe ? "default" : "outline"}
                  onClick={() => setShowWireframe(!showWireframe)}
                >
                  {showWireframe ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span>Show Grid</span>
                <Button
                  size="sm"
                  variant={showGrid ? "default" : "outline"}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  {showGrid ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span>Auto Rotate</span>
                <Button
                  size="sm"
                  variant={autoRotate ? "default" : "outline"}
                  onClick={() => setAutoRotate(!autoRotate)}
                >
                  {autoRotate ? "On" : "Off"}
                </Button>
              </div>

              <div className="space-y-2">
                <span>Model Color</span>
                <div className="flex gap-2">
                  {["#ffb6c1", "#ff9999", "#ffd700", "#87ceeb", "#98fb98", "#dda0dd"].map(color => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Set model color ${color}`}
                      className={`w-8 h-8 rounded-full border-2 ${modelColor === color ? "border-white" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setModelColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Model3DViewer;
