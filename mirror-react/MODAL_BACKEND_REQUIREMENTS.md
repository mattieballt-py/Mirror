# Modal Backend Requirements

## Overview
The Modal backend needs to be updated to support the incremental PLY workflow with job_id tracking and R2 status updates.

---

## 1. Endpoint Response Changes

### Current Behavior (assumed):
```python
@app.post("/upload-frame")
async def upload_frame(file: UploadFile):
    # Process frame
    # Upload PLY to R2
    return {"status": "ok"}
```

### Required Behavior:

```python
import uuid
from typing import Optional

# In-memory job tracking (or use Redis/DB for production)
active_jobs = {}

@app.post("/upload-frame")
async def upload_frame(
    file: UploadFile,
    job_id: Optional[str] = Form(None)
):
    # If no job_id, this is the first frame - create new job
    if job_id is None:
        job_id = str(uuid.uuid4())
        active_jobs[job_id] = {
            "frames": [],
            "chunks_processed": 0,
            "total_chunks": 0,
            "status": "processing"
        }
        print(f"Created new job: {job_id}")
        
        # Return job_id to frontend
        return {"job_id": job_id}
    
    # Subsequent frames - add to existing job
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    active_jobs[job_id]["frames"].append(file.filename)
    
    # Process frame (save, queue for reconstruction, etc.)
    await process_frame(file, job_id)
    
    return {"status": "ok", "frames_received": len(active_jobs[job_id]["frames"])}
```

---

## 2. R2 Upload Structure

### Required Folder Structure:
```
your-r2-bucket/
├── job_abc123/
│   ├── status.json          # Updated after each chunk upload
│   ├── chunk_001.ply
│   ├── chunk_002.ply
│   └── chunk_003.ply
```

### status.json Schema:
```json
{
  "progress": 0.75,        // Float 0.0 to 1.0
  "chunks": [              // Array of relative paths
    "job_abc123/chunk_001.ply",
    "job_abc123/chunk_002.ply",
    "job_abc123/chunk_003.ply"
  ],
  "complete": false        // Boolean - true when all chunks uploaded
}
```

---

## 3. R2 Client Setup (Python)

### Install Boto3:
```bash
pip install boto3
```

### Configure R2 Client:
```python
import boto3
import os
import json

# R2 credentials (set in Modal secrets)
R2_ACCOUNT_ID = os.environ["R2_ACCOUNT_ID"]
R2_ACCESS_KEY = os.environ["R2_ACCESS_KEY"]
R2_SECRET_KEY = os.environ["R2_SECRET_KEY"]
R2_BUCKET_NAME = os.environ["R2_BUCKET_NAME"]

# Create S3-compatible client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name='auto'
)

def upload_to_r2(file_path: str, r2_key: str):
    """Upload file to R2"""
    with open(file_path, 'rb') as f:
        s3_client.upload_fileobj(
            f, 
            R2_BUCKET_NAME, 
            r2_key,
            ExtraArgs={'ContentType': 'application/octet-stream'}
        )
    print(f"Uploaded {r2_key} to R2")

def update_status_json(job_id: str, progress: float, chunks: list, complete: bool):
    """Update status.json in R2"""
    status = {
        "progress": progress,
        "chunks": chunks,
        "complete": complete
    }
    
    status_key = f"{job_id}/status.json"
    s3_client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=status_key,
        Body=json.dumps(status),
        ContentType='application/json'
    )
    print(f"Updated status.json for job {job_id}: {progress*100}% complete")
```

---

## 4. Processing Workflow

### Example Implementation:

```python
async def process_job(job_id: str):
    """
    Background task that processes frames and uploads chunks to R2
    """
    job = active_jobs[job_id]
    frames = job["frames"]
    total_frames = len(frames)
    
    # Initialize status.json
    update_status_json(job_id, 0.0, [], False)
    
    chunks_uploaded = []
    
    # Process frames in batches (example: every 10 frames = 1 chunk)
    batch_size = 10
    for i in range(0, total_frames, batch_size):
        batch = frames[i:i+batch_size]
        
        # Run your Gaussian splatting algorithm on this batch
        ply_data = run_gaussian_splatting(batch)
        
        # Save PLY to temp file
        chunk_num = (i // batch_size) + 1
        temp_ply = f"/tmp/{job_id}_chunk_{chunk_num:03d}.ply"
        with open(temp_ply, 'wb') as f:
            f.write(ply_data)
        
        # Upload to R2
        r2_key = f"{job_id}/chunk_{chunk_num:03d}.ply"
        upload_to_r2(temp_ply, r2_key)
        chunks_uploaded.append(r2_key)
        
        # Update progress
        progress = (i + batch_size) / total_frames
        update_status_json(job_id, min(progress, 1.0), chunks_uploaded, False)
        
        # Cleanup temp file
        os.remove(temp_ply)
    
    # Mark complete
    update_status_json(job_id, 1.0, chunks_uploaded, True)
    job["status"] = "complete"
```

---

## 5. Modal Secrets Configuration

Add these secrets in Modal dashboard:

```bash
modal secret create r2-credentials \
  R2_ACCOUNT_ID=your_account_id \
  R2_ACCESS_KEY=your_access_key \
  R2_SECRET_KEY=your_secret_key \
  R2_BUCKET_NAME=your_bucket_name
```

Reference in Modal app:
```python
@app.function(
    secrets=[modal.Secret.from_name("r2-credentials")]
)
def my_function():
    # Secrets available as environment variables
    pass
```

---

## 6. Full Example Modal App

```python
import modal
import boto3
import json
import uuid
from fastapi import UploadFile, Form, HTTPException
from typing import Optional

app = modal.App("gaussian-splat-processor")

# Mount R2 credentials
@app.function(
    secrets=[modal.Secret.from_name("r2-credentials")],
    timeout=3600
)
@modal.web_endpoint(method="POST")
async def upload_frame(
    file: UploadFile,
    job_id: Optional[str] = Form(None)
):
    import os
    
    # Initialize R2 client
    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{os.environ["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com',
        aws_access_key_id=os.environ["R2_ACCESS_KEY"],
        aws_secret_access_key=os.environ["R2_SECRET_KEY"]
    )
    bucket = os.environ["R2_BUCKET_NAME"]
    
    # First frame - create job
    if job_id is None:
        job_id = str(uuid.uuid4())
        
        # Initialize status.json
        status = {"progress": 0.0, "chunks": [], "complete": False}
        s3.put_object(
            Bucket=bucket,
            Key=f"{job_id}/status.json",
            Body=json.dumps(status),
            ContentType='application/json'
        )
        
        # Spawn background task to process frames
        process_job.spawn(job_id)
        
        return {"job_id": job_id}
    
    # Subsequent frames - save to job folder
    frame_data = await file.read()
    s3.put_object(
        Bucket=bucket,
        Key=f"{job_id}/frames/{file.filename}",
        Body=frame_data,
        ContentType='image/jpeg'
    )
    
    return {"status": "ok"}


@app.function(
    secrets=[modal.Secret.from_name("r2-credentials")],
    gpu="T4",  # Use GPU for Gaussian splatting
    timeout=3600
)
async def process_job(job_id: str):
    """Background task to process frames and generate PLY chunks"""
    import os
    
    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{os.environ["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com',
        aws_access_key_id=os.environ["R2_ACCESS_KEY"],
        aws_secret_access_key=os.environ["R2_SECRET_KEY"]
    )
    bucket = os.environ["R2_BUCKET_NAME"]
    
    # Your processing logic here
    # 1. Download frames from R2
    # 2. Run Gaussian splatting
    # 3. Generate PLY chunks
    # 4. Upload chunks and update status.json
    
    # Example: Upload dummy chunk
    chunk_key = f"{job_id}/chunk_001.ply"
    s3.put_object(
        Bucket=bucket,
        Key=chunk_key,
        Body=b"PLY data here",
        ContentType='application/octet-stream'
    )
    
    # Update status
    status = {
        "progress": 1.0,
        "chunks": [chunk_key],
        "complete": True
    }
    s3.put_object(
        Bucket=bucket,
        Key=f"{job_id}/status.json",
        Body=json.dumps(status),
        ContentType='application/json'
    )
```

---

## 7. Testing the Backend

### Test First Frame Upload:
```bash
curl -X POST \
  https://your-modal-app.modal.run/upload-frame \
  -F "file=@test_frame.jpg"

# Expected response:
# {"job_id": "abc-123-def-456"}
```

### Test Subsequent Frame:
```bash
curl -X POST \
  https://your-modal-app.modal.run/upload-frame \
  -F "file=@test_frame2.jpg" \
  -F "job_id=abc-123-def-456"

# Expected response:
# {"status": "ok"}
```

### Check R2 Status:
```bash
curl https://pub-xxxxx.r2.dev/abc-123-def-456/status.json

# Expected response:
# {"progress": 0.5, "chunks": ["abc-123-def-456/chunk_001.ply"], "complete": false}
```

---

## 8. Deployment Checklist

- [ ] Add R2 credentials to Modal secrets
- [ ] Update endpoint to return `job_id` on first frame
- [ ] Implement `update_status_json()` function
- [ ] Upload chunks with naming pattern: `{job_id}/chunk_{N:03d}.ply`
- [ ] Update `status.json` after each chunk upload
- [ ] Set `complete: true` when all chunks uploaded
- [ ] Test with curl commands above
- [ ] Verify status.json accessible via R2 public URL
- [ ] Configure R2 bucket CORS (see R2_SETUP.md in frontend repo)

---

## 9. Production Considerations

### Job Cleanup:
- Implement job expiration (delete R2 files after 24 hours)
- Use Redis/DB instead of in-memory `active_jobs` dict
- Add job status endpoint: `GET /job/{job_id}/status`

### Error Handling:
- Handle frame upload failures gracefully
- Add retry logic for R2 uploads
- Set max frame limit per job (prevent abuse)

### Performance:
- Use Modal parallelism for batch processing
- Implement chunk compression (.ply.gz)
- Add chunk size limits (split large PLYs)

---

## Questions?

Check the frontend implementation:
- `IMPLEMENTATION_SUMMARY.md` - Full frontend documentation
- `R2_SETUP.md` - CORS configuration guide
- `src/components/SplatViewer.tsx` - How frontend polls and loads chunks
