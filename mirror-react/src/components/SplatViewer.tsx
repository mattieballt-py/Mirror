import { useRef, useEffect } from 'react'
import { Viewer } from '@mkkellogg/gaussian-splats-3d'
import * as THREE from 'three'

export default function SplatViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const loadedChunksRef = useRef(0)

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
    }
  }, [])

  return (
    <section className="viewer-section" id="viewer">
      <div className="viewer-header">
        <h2>3D Scene Reconstruction</h2>
        <p>Real-time PLY streaming from backend</p>
      </div>

      <div className="viewer-wrapper">
        <div ref={containerRef} className="viewer-container" />
        {loadedChunksRef.current === 0 && (
          <div className="viewer-placeholder">
            <img src="/splat.png" alt="3D preview placeholder" className="placeholder-img" />
            <div className="placeholder-text">
              <p>3D reconstruction will appear here</p>
              <small>Waiting for streaming PLY data...</small>
            </div>
          </div>
        )}
      </div>

      <div className="viewer-stats">
        <span>Chunks loaded: {loadedChunksRef.current}</span>
      </div>
    </section>
  )
}
