import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GaussianSplats3D } from '@mkkellogg/gaussian-splats-3d'

interface GaussianSplatViewerProps {
  plyUrls: string[]
}

export default function GaussianSplatViewer({ plyUrls }: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<GaussianSplats3D | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const loadedUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize three.js scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xfafafa)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(10, 10, 10)
    scene.add(directionalLight)

    // Initialize Gaussian Splats viewer
    const viewer = new GaussianSplats3D({
      rootElement: containerRef.current,
      renderer: renderer,
      camera: camera,
      scene: scene
    })
    viewerRef.current = viewer

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Load new PLY files incrementally
  useEffect(() => {
    const loadNewPlys = async () => {
      if (!viewerRef.current) return

      for (const url of plyUrls) {
        if (loadedUrlsRef.current.has(url)) continue

        try {
          // Add the PLY file to the viewer
          await viewerRef.current.addSplatScene(url, {
            splatAlphaRemovalThreshold: 5,
            showLoadingUI: true,
            position: [0, 0, 0],
            scale: [1, 1, 1],
            rotation: [0, 0, 0]
          })

          loadedUrlsRef.current.add(url)
        } catch (error) {
          console.error(`Failed to load PLY from ${url}:`, error)
        }
      }
    }

    loadNewPlys()
  }, [plyUrls])

  return (
    <div className="splat-viewer-wrapper">
      <div ref={containerRef} className="splat-viewer-container" />
      <div className="viewer-info">
        <p>Loaded chunks: {loadedUrlsRef.current.size}</p>
        <p className="viewer-hint">Use mouse to rotate, scroll to zoom</p>
      </div>
    </div>
  )
}
