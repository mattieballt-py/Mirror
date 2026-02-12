declare module '@mkkellogg/gaussian-splats-3d' {
  import { Scene, Renderer, Camera, Object3D } from 'three'

  interface ViewerConfig {
    rootElement?: HTMLElement
    renderer?: Renderer
    camera?: Camera
    scene?: Scene
    splatAlphaRemovalThreshold?: number
    showLoadingUI?: boolean
    position?: [number, number, number]
    scale?: [number, number, number]
    rotation?: [number, number, number]
  }

  interface SceneConfig {
    splatAlphaRemovalThreshold?: number
    showLoadingUI?: boolean
    position?: [number, number, number]
    scale?: [number, number, number]
    rotation?: [number, number, number]
  }

  export class Viewer extends Object3D {
    constructor(config: ViewerConfig)
    addSplatScene(
      url: string,
      config?: SceneConfig
    ): Promise<void>
    removeSplatScene(index: number): void
    getSplatScene(index: number): Object3D
    getSceneCount(): number
    dispose(): Promise<void>
  }

  export class SplatLoader {}
  export class PlyLoader {}
  export class PlyParser {}
  export class Utils {}
  export class AbortablePromise {}
  export class DropInViewer {}
  export class KSplatLoader {}
  export class LogLevel {}
  export class OrbitControls {}
  export class PlayCanvasCompressedPlyParser {}
  export class RenderMode {}
  export class SceneFormat {}
  export class SceneRevealMode {}
  export class SplatBuffer {}
  export class SplatBufferGenerator {}
  export class SplatParser {}
  export class SplatPartitioner {}
  export class SplatRenderMode {}
  export class SpzLoader {}
  export class WebXRMode {}
}

