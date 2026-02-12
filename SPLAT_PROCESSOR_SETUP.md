# SplatProcessor Setup Guide

## Overview
The `SplatProcessor` component enables:
1. **File Upload Mode**: Upload .mp4 video + .csv encoder data
2. **Recording Mode**: Record directly from LeRobot server endpoints
3. **Processing**: Send files to Modal GPU for Gaussian Splatting
4. **Incremental Rendering**: Stream 3D PLY results in real-time using @mkkellogg/gaussian-splats-3d

---

## Installation

### 1. Install Dependencies

```bash
cd mirror-react
npm install @mkkellogg/gaussian-splats-3d axios
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your details:

```bash
cp .env.example .env.local
```

**Required variables:**

```env
VITE_MODAL_ENDPOINT=https://your-modal-app.modal.run/process-gaussian-splatting
VITE_R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

---

## Component Architecture

### Files Created

```
src/components/
├── SplatProcessor.tsx          # Main component with upload/record logic
├── SplatProcessor.css          # Luxury styling matching the site
├── GaussianSplatViewer.tsx    # 3D renderer with incremental PLY support
```

---

## Mode 1: File Upload

### User Flow
1. Click "Upload Files" mode
2. Select .mp4 video file
3. Select .csv encoder data
4. Click "Generate 3D Scene"
5. Files POST to Modal endpoint as multipart/form-data
6. Receive job_id
7. Start polling for status updates

### Expected Response from Modal

```json
{
  "job_id": "unique-job-id-12345"
}
```

---

## Mode 2: LeRobot Recording

### Prerequisites
- LeRobot server running at `localhost:8000`
- Server must expose:
  - `POST /start-recording` - Start capturing video + encoder data
  - `POST /stop-recording` - Stop recording and return files

### LeRobot Endpoint Responses

**POST /start-recording**
```json
{
  "status": "recording_started"
}
```

**POST /stop-recording**
```json
{
  "video_file": "<base64-encoded-mp4>",
  "csv_file": "<base64-encoded-csv>"
}
```

Or if returning file paths:
```json
{
  "video_file": "/tmp/recording.mp4",
  "csv_file": "/tmp/encoders.csv"
}
```

### User Flow
1. Click "Record" mode
2. Click "▶ Start Recording"
3. Robot arm captures video + motor encoders
4. Click "⏹ Stop Recording"
5. Component converts response to File objects
6. Auto-populates as if uploaded
7. Click "Generate 3D Scene" to submit

---

## Processing Pipeline

### Step 1: File Submission
```typescript
POST to VITE_MODAL_ENDPOINT
Content-Type: multipart/form-data

FormData:
- video: File (mp4)
- encoders: File (csv)
```

### Step 2: Polling Status

The component polls `${VITE_R2_PUBLIC_URL}/{job_id}/status.json` every 4 seconds.

**Expected status.json format:**
```json
{
  "progress": 0.45,
  "current_chunk": 15,
  "total_chunks": 50,
  "chunks": [
    "outputs/job-id/chunk-0.ply",
    "outputs/job-id/chunk-1.ply",
    "outputs/job-id/chunk-2.ply",
    ...
  ],
  "complete": false,
  "error": null
}
```

### Step 3: Incremental PLY Loading
- When new chunk filenames appear in `chunks` array
- Component fetches each PLY file from R2
- Adds geometry to existing 3D viewer
- Progress bar updates from `progress` field

### Step 4: Completion
- When `complete: true`, polling stops
- Final 3D scene fully loaded
- "Process Another Scene" button appears

---

## PLY File Format

Each chunk should be a valid PLY file. Example structure:

```
ply
format binary_little_endian 1.0
element vertex 1000000
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
property float nx
property float ny
property float nz
end_header
[binary data]
```

---

## Styling Guide

The component maintains the sites's luxury aesthetic:

**Color Palette:**
- Primary: `#2c3e50` (dark slate)
- Background: `#ffffff` (white)
- Accent: `#f5f7fa` (light gray)
- Text: `#1a1a1a` (dark gray)
- Success: `#4caf50` (green)
- Error: `#f44336` (red)

**Typography:**
- Headers: Uppercase, 0.08em letter-spacing, 300 weight
- Buttons: Uppercase, 0.2em letter-spacing, 500 weight
- Body: 0.05em letter-spacing, 300-400 weight

**Spacing:**
- 8rem top/bottom padding for sections
- 2rem gaps between components
- Generous whitespace for premium feel

---

## Environment Variables Reference

```env
# Modal GPU Processing
VITE_MODAL_ENDPOINT=https://your-modal-app.modal.run/process-gaussian-splatting

# Cloudflare R2 Configuration
VITE_R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# Optional: R2 Direct Upload (advanced)
VITE_R2_ACCOUNT_ID=your_account_id
VITE_R2_ACCESS_KEY=your_access_key
VITE_R2_SECRET_KEY=your_secret_key
VITE_R2_BUCKET=mirror-videos
```

---

## Modal Endpoint Implementation Example

### Python (Modal)
```python
import modal
from fastapi import FastAPI, File, UploadFile

app = FastAPI()
stub = modal.Stub("gaussian-splatting")

@app.post("/process-gaussian-splatting")
async def process_video(
    video: UploadFile = File(...),
    encoders: UploadFile = File(...)
):
    # Generate unique job ID
    job_id = f"job-{uuid.uuid4()}"
    
    # Save files to R2
    # Start background processing
    # Return job_id
    
    return {"job_id": job_id}
```

---

## Key Features

### 1. File Upload with Validation
- Accept .mp4 and .csv only
- Visual feedback on selected files
- Error messages for invalid files

### 2. Live Recording from LeRobot
- Start/stop buttons
- Timer display (MM:SS format)
- Recording indicator with pulse animation

### 3. Progress Tracking
- Real-time progress bar
- Chunk counter (X/Y chunks loaded)
- Percentage display
- Status message updates

### 4. Incremental 3D Rendering
- Add PLY files progressively to scene
- No scene replacement on chunk arrival
- Smooth camera controls (rotate, zoom)
- Responsive viewport sizing

### 5. Error Handling
- Network error messages
- File validation feedback
- Server connectivity checks
- Graceful polling failure handling

---

## Troubleshooting

### LeRobot Connection Errors
- ✓ Verify server running: `curl http://localhost:8000/health`
- ✓ Check CORS headers if cross-origin
- ✓ Ensure `/start-recording` and `/stop-recording` paths exist

### PLY Files Not Loading
- ✓ Verify R2 URL accessibility
- ✓ Check CORS enabled on R2 bucket
- ✓ Confirm PLY format validity
- ✓ Check browser console for details

### Status Polling Issues
- ✓ Verify status.json path format: `{job_id}/status.json`
- ✓ Confirm R2 bucket has proper permissions
- ✓ Check VITE_R2_PUBLIC_URL environment variable

### 3D Viewer Not Rendering
- ✓ Check browser WebGL support
- ✓ Verify PLY file format
- ✓ Check browser console for parsing errors
- ✓ Try with smaller PLY files first

---

## Performance Tips

1. **Chunk Size**: Aim for 5-10MB per PLY chunk for smooth incremental loading
2. **Polling Interval**: 4 seconds (current) is optimal for most connections
3. **Viewport**: Use CSS aspect-ratio for responsive 3D viewer
4. **Memory**: Browser may use 500MB+ for large scenes; consider memory warnings

---

## Advanced Customization

### Add Custom Progress Display
Edit `SplatProcessor.tsx`:
```typescript
<div className="custom-progress">
  {processingStatus?.current_chunk} / {processingStatus?.total_chunks} chunks
</div>
```

### Modify Polling Interval
In `SplatProcessor.tsx`, change 4000ms to desired interval:
```typescript
setInterval(() => pollStatus(job_id), 4000) // Change this value
```

### Customize 3D Viewer
Edit `GaussianSplatViewer.tsx`:
```typescript
const viewer = new GaussianSplats3D({
  splatAlphaRemovalThreshold: 5,  // Adjust based on quality needs
  showLoadingUI: true,
  position: [0, 0, 0],
  scale: [1, 1, 1],
  rotation: [0, 0, 0]
})
```

---

## Browser Compatibility

- ✓ Chrome/Edge 90+
- ✓ Firefox 88+
- ✓ Safari 15+ (requires WebGL2)
- ✗ Internet Explorer (not supported)

**WebGL Requirements:**
- WebGL 2.0 context
- Floating point texture support
- Multiple render targets

---

## Integration with Existing Site

The component fits seamlessly into your existing luxury design:
1. Placed before footer for prominence
2. Matches color palette and typography
3. Maintains responsive design patterns
4. Consistent animation approach
5. Premium feel with subtle gradients and shadows
