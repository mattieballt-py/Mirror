import { useRef, useEffect, useState } from 'react'
import { Viewer } from '@mkkellogg/gaussian-splats-3d'
import * as THREE from 'three'

interface SplatViewerProps {
  jobId: string | null
}

interface StatusResponse {
  progress: number
  chunks: string[]
  complete: boolean
}

export default function SplatViewer({ jobId }: SplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const loadedChunksRef = useRef<string[]>([])
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [testMode, setTestMode] = useState(false)

  const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || ''

  // Test function to load the existing PLY directly
  const loadTestPLY = async () => {
    if (!viewerRef.current) return
    
    setTestMode(true)
    setIsProcessing(true)
    
    try {
      const testUrl = 'https://pub-8483e6a1db1342bda70ce67e0a39a8cc.r2.dev/20260214_103553/splat_000.ply'
      console.log('Loading test PLY:', testUrl)
      
      await viewerRef.current.addSplatScene(testUrl)
      
      loadedChunksRef.current.push('test_splat_000.ply')
      setProgress(1.0)
      setIsComplete(true)
      console.log('Test PLY loaded successfully!')
    } catch (error) {
      console.error('Error loading test PLY:', error)
      setIsProcessing(false)
    }
  }

  // Initialize Three.js scene and viewer
  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const viewer = new Viewer({
      rootElement: containerRef.current,
      renderer: renderer,
      camera: camera,
      scene: scene,
    })
    viewerRef.current = viewer

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      if (viewerRef.current) {
        viewerRef.current.dispose()
      }
    }
  }, [])

  // Poll R2 for status.json when jobId is available
  useEffect(() => {
    if (!jobId || !R2_PUBLIC_URL) return

    setIsProcessing(true)
    loadedChunksRef.current = []

    const pollStatus = async () => {
      try {
        const statusUrl = `${R2_PUBLIC_URL}/${jobId}/status.json`
        const response = await fetch(statusUrl)
        
        if (!response.ok) {
          // File not ready yet, silently wait for next poll
          return
        }

        const status: StatusResponse = await response.json()
        
        setProgress(status.progress)
        setIsComplete(status.complete)

        // Check for new chunks
        const newChunks = status.chunks.filter(
          chunk => !loadedChunksRef.current.includes(chunk)
        )

        // Load each new chunk
        for (const chunk of newChunks) {
          await loadChunk(chunk)
          loadedChunksRef.current.push(chunk)
        }

        // Stop polling when complete
        if (status.complete && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          console.log('Rendering complete!')
        }
      } catch (error) {
        // Silently retry on next interval
        console.debug('Status poll error (will retry):', error)
      }
    }

    // Start polling every 3 seconds
    pollStatus() // Initial poll
    pollingIntervalRef.current = setInterval(pollStatus, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [jobId, R2_PUBLIC_URL])

  const loadChunk = async (chunkPath: string) => {
    if (!viewerRef.current) return

    try {
      const chunkUrl = `${R2_PUBLIC_URL}/${chunkPath}`
      console.log('Loading chunk:', chunkUrl)
      
      // Load PLY file - the library auto-detects format from file extension
      await viewerRef.current.addSplatScene(chunkUrl)
      
      console.log('Chunk loaded successfully:', chunkPath)
    } catch (error) {
      console.error('Error loading chunk:', chunkPath, error)
    }
  }

  const showPlaceholder = !isProcessing && loadedChunksRef.current.length === 0

  return (
    <section className="viewer-section" id="viewer">
      <div className="viewer-header">
        <h2>3D Scene Reconstruction</h2>
        <p>Real-time PLY streaming from Cloudflare R2</p>
      </div>

      <div className="viewer-wrapper">
        <div ref={containerRef} className="viewer-container" />
        
        {showPlaceholder && (
          <div className="viewer-placeholder">
            <img src="/splat.png" alt="3D preview placeholder" className="placeholder-img" />
          </div>
        )}

        {isProcessing && (
          <div className="viewer-status-overlay">
            <div className="status-content">
              <p className="status-message">
                {isComplete ? 'Render complete!' : `Processing... ${Math.round(progress * 100)}% complete`}
              </p>
              {!isComplete && (
                <div className="progress-bar-viewer">
                  <div 
                    className="progress-fill-viewer" 
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="viewer-stats">
        <span>Chunks loaded: {loadedChunksRef.current.length}</span>
        {isProcessing && <span> • Progress: {Math.round(progress * 100)}%</span>}
        {!jobId && !testMode && (
          <button onClick={loadTestPLY} className="test-ply-btn">
            Load Test PLY
          </button>
        )}
      </div>
    </section>
  )
}
