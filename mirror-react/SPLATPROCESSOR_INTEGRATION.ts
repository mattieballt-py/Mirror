/**
 * INTEGRATION CHECKLIST FOR SPLATPROCESSOR
 * 
 * Before deploying, ensure:
 * 
 * 1. DEPENDENCIES INSTALLED
 *    npm install @mkkellogg/gaussian-splats-3d axios
 * 
 * 2. ENVIRONMENT VARIABLES SET (.env.local)
 *    VITE_MODAL_ENDPOINT=https://your-modal-endpoint
 *    VITE_R2_PUBLIC_URL=https://your-r2-public-url
 * 
 * 3. COMPONENT IMPORTS (App.tsx)
 *    import SplatProcessor from './components/SplatProcessor'
 * 
 * 4. COMPONENT RENDERED (App.tsx)
 *    <SplatProcessor />
 * 
 * 5. MODAL ENDPOINT READY
 *    - Accepts multipart/form-data with 'video' and 'encoders' fields
 *    - Returns JSON with 'job_id' field
 * 
 * 6. R2 BUCKET CONFIGURED
 *    - Public read access enabled
 *    - CORS headers configured for PLY file access
 *    - Status JSON available at {job_id}/status.json
 *    - PLY chunks available at paths specified in status.json
 * 
 * 7. LEROBOT SERVER (for recording mode)
 *    - Running at http://localhost:8000
 *    - /start-recording endpoint returns status
 *    - /stop-recording endpoint returns base64 video and csv
 * 
 * EXPECTED API RESPONSES
 * ========================
 * 
 * MODAL ENDPOINT POST
 * Request: multipart/form-data with video and encoders files
 * Response:
 * {
 *   "job_id": "unique-job-id-string"
 * }
 * 
 * R2 STATUS POLLING
 * URL: {VITE_R2_PUBLIC_URL}/{job_id}/status.json
 * Response:
 * {
 *   "progress": 0.45,
 *   "current_chunk": 15,
 *   "total_chunks": 50,
 *   "chunks": [
 *     "outputs/job-id/chunk-0.ply",
 *     "outputs/job-id/chunk-1.ply"
 *   ],
 *   "complete": false,
 *   "error": null
 * }
 * 
 * PLY CHUNK FILES
 * URL: {VITE_R2_PUBLIC_URL}/{chunk_path}
 * Format: Binary PLY with vertices, colors, normals
 * 
 * LEROBOT ENDPOINTS
 * POST /start-recording
 * Response: { "status": "recording_started" }
 * 
 * POST /stop-recording
 * Response: {
 *   "video_file": "base64-encoded-mp4-data or file path",
 *   "csv_file": "base64-encoded-csv-data or file path"
 * }
 */

export const INTEGRATION_CHECKLIST = () => {
  const checks = {
    dependencies: {
      name: '@mkkellogg/gaussian-splats-3d & axios',
      command: 'npm install @mkkellogg/gaussian-splats-3d axios'
    },
    envVars: {
      required: ['VITE_MODAL_ENDPOINT', 'VITE_R2_PUBLIC_URL'],
      file: '.env.local'
    },
    components: {
      imported: 'App.tsx imports SplatProcessor',
      rendered: 'App.tsx renders <SplatProcessor />'
    }
  }

  return checks
}

/**
 * TESTING WITH MOCK DATA
 * 
 * To test locally without real Modal/R2:
 * 1. Replace VITE_MODAL_ENDPOINT with mock endpoint
 * 2. Set up local JSON files to simulate status.json
 * 3. Use local PLY files for testing
 * 
 * Mock Modal Response:
 * { "job_id": "test-job-123" }
 * 
 * Mock Status JSON:
 * {
 *   "progress": 0.5,
 *   "current_chunk": 5,
 *   "total_chunks": 10,
 *   "chunks": ["test-chunk-0.ply", "test-chunk-1.ply"],
 *   "complete": false
 * }
 */

/**
 * COMMON ISSUES & FIXES
 * 
 * Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"
 * Fix: Configure R2 bucket CORS in Cloudflare dashboard
 *      Add CORS rule allowing GET on *.ply and *.json
 * 
 * Issue: "Failed to load status.json"
 * Fix: Check VITE_R2_PUBLIC_URL format
 *      Verify status.json exists at {job_id}/status.json
 *      Confirm R2 bucket has public read access
 * 
 * Issue: "PLY file not rendering in 3D viewer"
 * Fix: Validate PLY file format (use Meshlab to check)
 *      Ensure vertex data is correct
 *      Check browser WebGL support (Chrome DevTools)
 * 
 * Issue: "LeRobot connection refused"
 * Fix: Verify server running: curl http://localhost:8000
 *      Check endpoints exist and spelling matches
 *      Enable CORS if needed for cross-origin requests
 * 
 * Issue: "Files stuck in uploading state"
 * Fix: Check network tab in DevTools for hanging requests
 *      Verify Modal endpoint is responding
 *      Check Modal function timeout settings
 */
