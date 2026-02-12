# Mirror - 3D Gaussian Splatting Pipeline Architecture

## System Overview
This system captures video + robot arm encoder data, processes it with Gaussian Splatting on Modal GPUs, and streams the resulting 3D scene back to the React frontend.

## Architecture Flow

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  React Frontend │─────▶│ Cloudflare R2│─────▶│  Modal GPU   │─────▶│  React 3D    │
│  (Video Upload) │      │   (Storage)  │      │  (Gaussian   │      │   Viewer     │
└─────────────────┘      └──────────────┘      │   Splatting) │      └──────────────┘
         │                                      └─────────────┘
         │                                             ▲
         │               ┌──────────────┐             │
         └──────────────▶│ SO101 Robot  │─────────────┘
                         │   Encoders   │
                         └──────────────┘
```

---

## Component 1: Video Upload to Cloudflare R2

### Frontend Implementation (App.tsx)

```typescript
import { useState } from 'react'

// Add to your App.tsx
const [uploadProgress, setUploadProgress] = useState(0)
const [r2VideoUrl, setR2VideoUrl] = useState<string | null>(null)

const uploadVideoToR2 = async (videoBlob: Blob) => {
  // Step 1: Get presigned URL from your backend
  const presignResponse = await fetch('/api/get-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: `video-${Date.now()}.webm`,
      contentType: videoBlob.type
    })
  })
  
  const { uploadUrl, videoKey } = await presignResponse.json()
  
  // Step 2: Upload directly to R2 using presigned URL
  const xhr = new XMLHttpRequest()
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      setUploadProgress((e.loaded / e.total) * 100)
    }
  })
  
  xhr.open('PUT', uploadUrl)
  xhr.setRequestHeader('Content-Type', videoBlob.type)
  
  xhr.onload = async () => {
    if (xhr.status === 200) {
      setR2VideoUrl(videoKey)
      // Trigger Modal processing
      await triggerGaussianSplatting(videoKey)
    }
  }
  
  xhr.send(videoBlob)
}

// Update your existing handlers
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file && file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file)
    setUploadedVideo(url)
    // Upload to R2
    await uploadVideoToR2(file)
  }
}

const stopRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop()
    setIsRecording(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }
}

// Modify mediaRecorder.onstop to upload to R2
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' })
  const url = URL.createObjectURL(blob)
  setUploadedVideo(url)
  stream.getTracks().forEach(track => track.stop())
  // Upload to R2
  uploadVideoToR2(blob)
}
```

---

## Component 2: Backend API for R2 (Next.js API Route or Express)

### Setup Cloudflare R2 SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### API Route: `/api/get-upload-url.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { filename, contentType } = req.body
  const videoKey = `videos/${Date.now()}-${filename}`

  try {
    // Generate presigned URL for upload (valid for 30 minutes)
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: videoKey,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 1800 })

    res.status(200).json({ uploadUrl, videoKey })
  } catch (error) {
    console.error('R2 presign error:', error)
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
}
```

### Environment Variables (.env)
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=mirror-videos
```

---

## Component 3: SO101 Robot Arm Encoder Data Collection

### Python Script (runs on robot controller)

```python
import asyncio
import websockets
import json
from datetime import datetime
import serial  # For reading encoders

class SO101EncoderReader:
    def __init__(self, serial_port='/dev/ttyUSB0'):
        self.serial = serial.Serial(serial_port, baudrate=115200)
        self.recording = False
        self.encoder_data = []
        
    def read_encoders(self):
        """Read motor positions from SO101 encoders"""
        # Adjust this based on your SO101 protocol
        self.serial.write(b'GET_POSITIONS\n')
        response = self.serial.readline().decode().strip()
        
        # Parse encoder values (example format)
        positions = [float(x) for x in response.split(',')]
        
        return {
            'timestamp': datetime.now().isoformat(),
            'motor_positions': positions,  # [motor1_pos, motor2_pos, ..., motor6_pos]
            'frame_number': len(self.encoder_data)
        }
    
    async def stream_to_backend(self, websocket_url, video_key):
        """Stream encoder data to backend while recording"""
        async with websockets.connect(websocket_url) as websocket:
            # Send video key to associate with this recording
            await websocket.send(json.dumps({
                'type': 'init',
                'video_key': video_key
            }))
            
            while self.recording:
                encoder_data = self.read_encoders()
                self.encoder_data.append(encoder_data)
                
                # Send to backend
                await websocket.send(json.dumps({
                    'type': 'encoder_data',
                    'data': encoder_data
                }))
                
                await asyncio.sleep(1/30)  # 30 Hz sampling rate
    
    def start_recording(self, video_key, websocket_url):
        self.recording = True
        self.encoder_data = []
        asyncio.run(self.stream_to_backend(websocket_url, video_key))
    
    def stop_recording(self):
        self.recording = False
        return self.encoder_data

# Usage
encoder_reader = SO101EncoderReader()
encoder_reader.start_recording(
    video_key='videos/123456-recording.webm',
    websocket_url='ws://your-backend.com/ws/encoders'
)
```

---

## Component 4: Backend WebSocket Handler for Encoders

### WebSocket Server (Node.js + ws library)

```typescript
import { WebSocketServer } from 'ws'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const wss = new WebSocketServer({ port: 8080 })
const encoderDataCache = new Map()

wss.on('connection', (ws) => {
  let currentVideoKey: string | null = null
  let encoderBuffer: any[] = []
  
  ws.on('message', async (message) => {
    const data = JSON.parse(message.toString())
    
    if (data.type === 'init') {
      currentVideoKey = data.video_key
      encoderDataCache.set(currentVideoKey, [])
    }
    
    if (data.type === 'encoder_data' && currentVideoKey) {
      encoderBuffer.push(data.data)
      encoderDataCache.get(currentVideoKey)?.push(data.data)
      
      // Upload encoder data to R2 every second (30 frames)
      if (encoderBuffer.length >= 30) {
        const encoderKey = currentVideoKey.replace('videos/', 'encoders/').replace('.webm', '.json')
        
        await uploadEncoderData(encoderKey, encoderBuffer)
        encoderBuffer = []
      }
    }
  })
})

async function uploadEncoderData(key: string, data: any[]) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json'
  })
  
  await r2.send(command)
}
```

---

## Component 5: Trigger Modal GPU Processing

### API Route: `/api/trigger-gaussian-splatting.ts`

```typescript
export default async function handler(req, res) {
  const { videoKey } = req.body
  
  // Get public URL for R2 video
  const videoUrl = `https://pub-xxxxx.r2.dev/${videoKey}`
  const encoderKey = videoKey.replace('videos/', 'encoders/').replace('.webm', '.json')
  const encoderUrl = `https://pub-xxxxx.r2.dev/${encoderKey}`
  
  // Call Modal function
  const response = await fetch('https://your-modal-app.modal.run/process-gaussian-splatting', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MODAL_API_KEY}`
    },
    body: JSON.stringify({
      video_url: videoUrl,
      encoder_url: encoderUrl,
      output_key: videoKey.replace('videos/', 'outputs/').replace('.webm', '.ply'),
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/gaussian-splatting-progress`
    })
  })
  
  const result = await response.json()
  res.status(200).json(result)
}
```

---

## Component 6: Modal GPU Processing (Separate Repo)

### Modal App (Python)

```python
import modal
import cv2
import numpy as np
import requests
from pathlib import Path

stub = modal.Stub("gaussian-splatting")

# GPU image with CUDA and your dependencies
image = (
    modal.Image.debian_slim()
    .pip_install([
        "torch",
        "torchvision",
        "opencv-python",
        "plyfile",
        "tqdm"
    ])
    .apt_install(["ffmpeg"])
)

@stub.function(
    image=image,
    gpu="A100",
    timeout=3600,
    secret=modal.Secret.from_name("r2-credentials")
)
def process_gaussian_splatting(
    video_url: str,
    encoder_url: str,
    output_key: str,
    webhook_url: str
):
    """
    Process video with Gaussian Splatting using robot arm encoder data
    """
    import os
    from your_gaussian_splatting_lib import GaussianSplatter
    
    # Download video from R2
    video_path = "/tmp/input_video.webm"
    encoder_path = "/tmp/encoder_data.json"
    
    response = requests.get(video_url)
    with open(video_path, 'wb') as f:
        f.write(response.content)
    
    # Download encoder data
    encoder_response = requests.get(encoder_url)
    encoder_data = encoder_response.json()
    
    # Extract frames from video
    frames = extract_frames(video_path)
    
    # Initialize Gaussian Splatter
    splatter = GaussianSplatter(
        frames=frames,
        camera_poses=compute_camera_poses(encoder_data),
        output_path="/tmp/output.ply"
    )
    
    # Process with progress callbacks
    for iteration, ply_data in splatter.train_incremental(max_iterations=30000):
        # Send incremental PLY to frontend
        send_incremental_update(
            webhook_url=webhook_url,
            iteration=iteration,
            ply_data=ply_data,
            progress=iteration / 30000
        )
    
    # Upload final PLY to R2
    upload_to_r2(output_key, "/tmp/output.ply")
    
    return {"status": "complete", "output_key": output_key}

def extract_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()
    return frames

def compute_camera_poses(encoder_data):
    """Convert robot arm encoder positions to camera poses"""
    poses = []
    for frame_data in encoder_data:
        motor_positions = frame_data['motor_positions']
        # Forward kinematics to get camera pose
        pose = robot_forward_kinematics(motor_positions)
        poses.append(pose)
    return poses

def send_incremental_update(webhook_url, iteration, ply_data, progress):
    """Send progress update with partial PLY data"""
    requests.post(webhook_url, json={
        'iteration': iteration,
        'progress': progress,
        'ply_url': f"https://temp-storage.com/{iteration}.ply"  # Upload incrementally
    })

@stub.local_entrypoint()
def main():
    process_gaussian_splatting.remote(
        video_url="https://...",
        encoder_url="https://...",
        output_key="outputs/result.ply",
        webhook_url="https://..."
    )
```

---

## Component 7: Receive Incremental Updates in Frontend

### WebSocket Connection for Real-time Updates

```typescript
// Add to App.tsx
import { useEffect, useState } from 'react'

const [processingProgress, setProcessingProgress] = useState(0)
const [currentPlyUrl, setCurrentPlyUrl] = useState<string | null>(null)

useEffect(() => {
  // Connect to backend WebSocket for progress updates
  const ws = new WebSocket('ws://your-backend.com/ws/processing')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'progress') {
      setProcessingProgress(data.progress * 100)
      setCurrentPlyUrl(data.ply_url)
    }
    
    if (data.type === 'complete') {
      setCurrentPlyUrl(data.final_ply_url)
    }
  }
  
  return () => ws.close()
}, [])
```

### Backend Progress Webhook Handler

```typescript
// /api/gaussian-splatting-progress.ts
export default async function handler(req, res) {
  const { iteration, progress, ply_url } = req.body
  
  // Broadcast to connected WebSocket clients
  broadcastToClients({
    type: 'progress',
    progress,
    ply_url,
    iteration
  })
  
  res.status(200).json({ received: true })
}
```

---

## Component 8: Render 3D PLY in React

### Install Three.js + React Three Fiber

```bash
npm install three @react-three/fiber @react-three/drei
```

### 3D Viewer Component

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { useEffect, useState } from 'react'

function GaussianSplattingViewer({ plyUrl }: { plyUrl: string }) {
  const geometry = useLoader(PLYLoader, plyUrl)
  
  return (
    <mesh geometry={geometry}>
      <pointsMaterial
        size={0.01}
        vertexColors
        sizeAttenuation
      />
    </mesh>
  )
}

// Add to your App.tsx
{currentPlyUrl && (
  <section className="viewer-section">
    <h2>3D Gaussian Splatting Result</h2>
    <div className="progress-bar">
      <div 
        className="progress" 
        style={{ width: `${processingProgress}%` }}
      />
    </div>
    <Canvas style={{ height: '600px' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <GaussianSplattingViewer plyUrl={currentPlyUrl} />
      <OrbitControls />
    </Canvas>
  </section>
)}
```

---

## Summary of Data Flow

1. **User uploads video** → Frontend sends to R2 via presigned URL
2. **SO101 robot arm records** → Python script reads encoders → WebSocket streams to backend
3. **Backend receives encoder data** → Stores in R2 as JSON
4. **Frontend triggers Modal** → API route calls Modal function
5. **Modal GPU processes** → Downloads video + encoder data from R2 → Runs Gaussian Splatting
6. **Incremental updates** → Modal sends progress webhooks → Backend broadcasts via WebSocket
7. **Frontend receives updates** → Loads incremental PLY files → Renders in Three.js canvas

## Key Technologies
- **Storage**: Cloudflare R2 (S3-compatible)
- **Compute**: Modal (GPU processing)
- **Frontend**: React + Three.js + React Three Fiber
- **Backend**: Next.js API routes + WebSocket server
- **Robot Interface**: Python + PySerial

This architecture allows real-time streaming of 3D reconstruction progress while the Gaussian Splatting algorithm processes the video frames with accurate camera poses from the robot arm encoders.
