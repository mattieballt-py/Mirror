import { useRef, useEffect, useState } from 'react'
import { Viewer } from '@mkkellogg/gaussian-splats-3d'

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
      const testUrl = 'https://pub-8483e6a1db1342bda70ce67e0a39a8cc.r2.dev/20260214_110839/splat_000.ply'
      console.log('Adding splat scene:', testUrl)
      
      await viewerRef.current.addSplatScene(testUrl, {
        splatAlphaRemovalThreshold: 5,
      }).catch((error) => {
        console.error('Error in addSplatScene promise - Full error:', error)
        throw error
      })
      
      console.log('Splat scene added successfully')
      loadedChunksRef.current.push('test_splat_000.ply')
      setProgress(1.0)
      setIsComplete(true)
    } catch (error) {
      console.error('Error loading test PLY - Full error:', error)
      setIsProcessing(false)
    }
  }

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current) return

    const viewer = new Viewer({
      rootElement: containerRef.current,
    })
    
    console.log('Viewer initialised')
    
    viewerRef.current = viewer

    return () => {
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
      console.log('Adding splat scene:', chunkUrl)
      
      await viewerRef.current.addSplatScene(chunkUrl, {
        splatAlphaRemovalThreshold: 5,
      }).catch((error) => {
        console.error('Error in addSplatScene promise - Full error:', error)
        throw error
      })
      
      console.log('Splat scene added successfully')
    } catch (error) {
      console.error('Error loading chunk:', chunkPath, '- Full error:', error)
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
        <div 
          ref={containerRef} 
          className="viewer-container"
          style={{ width: '100%', height: '500px', position: 'relative' }}
        />
        
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
