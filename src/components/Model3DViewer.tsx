/**
 * Model3DViewer Component
 * Full 3D model viewer with Three.js for anatomy visualization
 * Supports GLTF/GLB models, camera controls, measurements, and AR preview
 */

import { useRef, useEffect, useState, useCallback, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Box,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Eye,
  Layers,
  Sun,
  Moon,
  Ruler,
  Camera,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Settings,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Smartphone,
  Grid3x3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

// Three.js imports (dynamically loaded)
let THREE: typeof import('three') | null = null
let OrbitControls: any = null
let GLTFLoader: any = null
let DRACOLoader: any = null

interface Model3DViewerProps {
  modelUrl?: string
  className?: string
  autoRotate?: boolean
  enableMeasurements?: boolean
  enableAR?: boolean
  onMeasurement?: (measurement: Measurement) => void
}

interface Measurement {
  id: string
  startPoint: { x: number; y: number; z: number }
  endPoint: { x: number; y: number; z: number }
  distance: number
  label: string
}

interface ViewPreset {
  name: string
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}

const VIEW_PRESETS: ViewPreset[] = [
  { name: 'Front', position: { x: 0, y: 0, z: 5 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Back', position: { x: 0, y: 0, z: -5 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Left', position: { x: -5, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Right', position: { x: 5, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Top', position: { x: 0, y: 5, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Bottom', position: { x: 0, y: -5, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Isometric', position: { x: 3.5, y: 3.5, z: 3.5 }, target: { x: 0, y: 0, z: 0 } }
]

export const Model3DViewer = ({ 
  modelUrl, 
  className,
  autoRotate: initialAutoRotate = false,
  enableMeasurements = true,
  enableAR = false,
  onMeasurement
}: Model3DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const controlsRef = useRef<any>(null)
  const modelRef = useRef<any>(null)
  const animationFrameRef = useRef<number>(0)
  const measurementLineRef = useRef<any>(null)
  const measurementLabelsRef = useRef<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [lightMode, setLightMode] = useState<'day' | 'night'>('day')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [measurementStart, setMeasurementStart] = useState<any>(null)
  const [zoom, setZoom] = useState(100)
  const [threeLoaded, setThreeLoaded] = useState(false)

  // Load Three.js dynamically
  useEffect(() => {
    const loadThree = async () => {
      try {
        THREE = await import('three')
        const orbitModule = await import('three/examples/jsm/controls/OrbitControls.js')
        const gltfModule = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const dracoModule = await import('three/examples/jsm/loaders/DRACOLoader.js')
        
        OrbitControls = orbitModule.OrbitControls
        GLTFLoader = gltfModule.GLTFLoader
        DRACOLoader = dracoModule.DRACOLoader
        
        setThreeLoaded(true)
      } catch (err) {
        logger.error('Failed to load Three.js', { error: err })
        setError('Failed to load 3D viewer')
        setIsLoading(false)
      }
    }

    loadThree()
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!threeLoaded || !containerRef.current || !canvasRef.current || !THREE) return

    const container = containerRef.current
    const canvas = canvasRef.current

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(lightMode === 'day' ? 0xf0f0f0 : 0x1a1a2e)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(3, 2, 5)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 2
    controls.minDistance = 1
    controls.maxDistance = 20
    controlsRef.current = controls

    // Lights
    setupLights(scene, lightMode)

    // Grid
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444)
      gridHelper.name = 'grid'
      scene.add(gridHelper)
    }

    // Axes helper (for development)
    const axesHelper = new THREE.AxesHelper(2)
    axesHelper.visible = false
    axesHelper.name = 'axes'
    scene.add(axesHelper)

    // Load default model or placeholder geometry
    if (modelUrl) {
      loadModel(modelUrl)
    } else {
      createPlaceholderGeometry(scene)
      setIsLoading(false)
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      
      const width = container.clientWidth
      const height = container.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Handle click for measurements
    const handleClick = (event: MouseEvent) => {
      if (!isMeasuring) return
      
      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(scene.children, true)
      
      if (intersects.length > 0) {
        const point = intersects[0].point.clone()
        
        if (!measurementStart) {
          setMeasurementStart(point)
          createMeasurementPoint(scene, point)
        } else {
          const distance = measurementStart.distanceTo(point)
          const measurement: Measurement = {
            id: crypto.randomUUID(),
            startPoint: { x: measurementStart.x, y: measurementStart.y, z: measurementStart.z },
            endPoint: { x: point.x, y: point.y, z: point.z },
            distance: distance,
            label: `${(distance * 10).toFixed(1)} cm` // Scale for realistic measurements
          }
          
          createMeasurementLine(scene, measurementStart, point, measurement.label)
          setMeasurements(prev => [...prev, measurement])
          onMeasurement?.(measurement)
          setMeasurementStart(null)
          setIsMeasuring(false)
          toast.success(`Measurement: ${measurement.label}`)
        }
      }
    }

    canvas.addEventListener('click', handleClick)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationFrameRef.current)
      renderer.dispose()
      scene.clear()
    }
  }, [threeLoaded, lightMode, showGrid])

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate
    }
  }, [autoRotate])

  // Update wireframe
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child: any) => {
        if (child.isMesh) {
          child.material.wireframe = wireframe
        }
      })
    }
  }, [wireframe])

  // Update scene background when light mode changes
  useEffect(() => {
    if (sceneRef.current && THREE) {
      sceneRef.current.background = new THREE.Color(lightMode === 'day' ? 0xf0f0f0 : 0x1a1a2e)
      
      // Update lights
      const oldLights = sceneRef.current.children.filter((c: any) => c.isLight)
      oldLights.forEach((light: any) => sceneRef.current.remove(light))
      setupLights(sceneRef.current, lightMode)
    }
  }, [lightMode])

  const setupLights = (scene: any, mode: 'day' | 'night') => {
    if (!THREE) return

    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      mode === 'day' ? 0xffffff : 0x404040,
      mode === 'day' ? 0.6 : 0.3
    )
    scene.add(ambientLight)

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(
      mode === 'day' ? 0xffffff : 0x8888ff,
      mode === 'day' ? 1 : 0.5
    )
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Fill light
    const fillLight = new THREE.PointLight(
      mode === 'day' ? 0xffffff : 0x4444ff,
      mode === 'day' ? 0.5 : 0.3
    )
    fillLight.position.set(-5, 3, -5)
    scene.add(fillLight)

    // Rim light
    const rimLight = new THREE.PointLight(0xffffff, 0.3)
    rimLight.position.set(0, 5, -10)
    scene.add(rimLight)
  }

  const createPlaceholderGeometry = (scene: any) => {
    if (!THREE) return

    // Create a human figure placeholder
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.5,
      metalness: 0.1
    })

    // Torso
    const torsoGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 32)
    const torso = new THREE.Mesh(torsoGeometry, material)
    torso.position.y = 1.2
    scene.add(torso)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.15, 32, 32)
    const head = new THREE.Mesh(headGeometry, material)
    head.position.y = 1.75
    scene.add(head)

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 16)
    const leftArm = new THREE.Mesh(armGeometry, material)
    leftArm.position.set(-0.4, 1.2, 0)
    leftArm.rotation.z = Math.PI / 4
    scene.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, material)
    rightArm.position.set(0.4, 1.2, 0)
    rightArm.rotation.z = -Math.PI / 4
    scene.add(rightArm)

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.7, 16)
    const leftLeg = new THREE.Mesh(legGeometry, material)
    leftLeg.position.set(-0.12, 0.4, 0)
    scene.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeometry, material)
    rightLeg.position.set(0.12, 0.4, 0)
    scene.add(rightLeg)

    // Group everything
    const group = new THREE.Group()
    group.add(torso, head, leftArm, rightArm, leftLeg, rightLeg)
    group.name = 'placeholderModel'
    modelRef.current = group
  }

  const loadModel = async (url: string) => {
    if (!THREE || !GLTFLoader || !sceneRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const loader = new GLTFLoader()
      
      // Configure Draco decoder for compressed models
      if (DRACOLoader) {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('/draco/')
        loader.setDRACOLoader(dracoLoader)
      }

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          (gltf: any) => resolve(gltf),
          (progress: any) => {
            const percent = (progress.loaded / progress.total) * 100
            logger.info('Model loading progress', { percent })
          },
          (error: any) => reject(error)
        )
      })

      // Remove existing model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current)
      }

      const model = gltf.scene
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      // Center and scale model
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim
      model.scale.setScalar(scale)
      
      model.position.sub(center.multiplyScalar(scale))
      model.position.y = 0

      sceneRef.current.add(model)
      modelRef.current = model

      setIsLoading(false)
      logger.info('Model loaded successfully', { url })
    } catch (err) {
      logger.error('Failed to load model', { url, error: err })
      setError('Failed to load 3D model')
      setIsLoading(false)
      
      // Create placeholder on error
      createPlaceholderGeometry(sceneRef.current)
    }
  }

  const createMeasurementPoint = (scene: any, point: any) => {
    if (!THREE) return

    const geometry = new THREE.SphereGeometry(0.05, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(point)
    sphere.name = 'measurementPoint'
    scene.add(sphere)
  }

  const createMeasurementLine = (scene: any, start: any, end: any, label: string) => {
    if (!THREE) return

    // Create line
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    const points = [start, end]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material)
    line.name = 'measurementLine'
    scene.add(line)

    // Create end point
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const endSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    endSphere.position.copy(end)
    scene.add(endSphere)
  }

  const clearMeasurements = () => {
    if (!sceneRef.current) return

    const toRemove: any[] = []
    sceneRef.current.traverse((child: any) => {
      if (
        child.name === 'measurementLine' ||
        child.name === 'measurementPoint'
      ) {
        toRemove.push(child)
      }
    })

    toRemove.forEach((obj: any) => sceneRef.current.remove(obj))
    setMeasurements([])
    setMeasurementStart(null)
    toast.success('Measurements cleared')
  }

  const handleViewPreset = (preset: ViewPreset) => {
    if (!cameraRef.current || !controlsRef.current) return

    cameraRef.current.position.set(preset.position.x, preset.position.y, preset.position.z)
    controlsRef.current.target.set(preset.target.x, preset.target.y, preset.target.z)
    controlsRef.current.update()
  }

  const handleZoomChange = (value: number[]) => {
    if (!cameraRef.current) return
    
    const newZoom = value[0]
    setZoom(newZoom)
    
    const distance = 5 * (200 - newZoom) / 100
    const direction = cameraRef.current.position.clone().normalize()
    cameraRef.current.position.copy(direction.multiplyScalar(distance + 1))
  }

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return

    cameraRef.current.position.set(3, 2, 5)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
    setZoom(100)
  }

  const handleScreenshot = () => {
    if (!canvasRef.current) return

    const link = document.createElement('a')
    link.download = `3d-model-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
    toast.success('Screenshot saved')
  }

  const handleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const toggleGrid = () => {
    if (!sceneRef.current) return

    const grid = sceneRef.current.getObjectByName('grid')
    if (grid) {
      grid.visible = !showGrid
    }
    setShowGrid(!showGrid)
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">3D Anatomy Viewer</CardTitle>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          
          <div className="flex items-center gap-1">
            {/* View Presets */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>View Presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {VIEW_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.name}
                    onClick={() => handleViewPreset(preset)}
                  >
                    {preset.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Display Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setWireframe(!wireframe)}>
                  <Layers className="w-4 h-4 mr-2" />
                  {wireframe ? 'Solid Mode' : 'Wireframe Mode'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleGrid}>
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  {showGrid ? 'Hide Grid' : 'Show Grid'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLightMode(lightMode === 'day' ? 'night' : 'day')}>
                  {lightMode === 'day' ? (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Night Mode
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Day Mode
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-0 relative">
        {/* 3D Canvas Container */}
        <div 
          ref={containerRef}
          className="relative aspect-video bg-gradient-to-b from-muted/30 to-muted/50"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading 3D model...</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => modelUrl && loadModel(modelUrl)}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Measurement Mode Indicator */}
          {isMeasuring && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-success/90 text-success-foreground text-xs font-medium flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {measurementStart ? 'Click end point' : 'Click start point'}
            </div>
          )}

          {/* Control Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-background/90 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setAutoRotate(!autoRotate)}
                title={autoRotate ? 'Stop rotation' : 'Auto rotate'}
              >
                {autoRotate ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleResetCamera}
                title="Reset camera"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              {enableMeasurements && (
                <Button
                  variant={isMeasuring ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMeasuring(!isMeasuring)}
                  title="Measure"
                >
                  <Ruler className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2 bg-background/90 rounded-lg px-3 py-1">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={20}
                max={200}
                step={5}
                className="w-24"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-1 bg-background/90 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleScreenshot}
                title="Screenshot"
              >
                <Camera className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Measurements Panel */}
        {enableMeasurements && measurements.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Measurements
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMeasurements}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {measurements.map((m) => (
                <Badge key={m.id} variant="secondary">
                  {m.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
