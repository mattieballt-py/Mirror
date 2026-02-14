# Cloudflare R2 CORS Setup Instructions

## Prerequisites
- Cloudflare account with R2 enabled
- R2 bucket created for storing .ply chunks

## CORS Configuration

To allow the React frontend to fetch .ply chunks from your R2 bucket, you need to configure CORS rules.

### Steps:

1. **Go to Cloudflare Dashboard**
   - Navigate to R2 → Select your bucket

2. **Configure CORS Rules**
   - Go to Settings → CORS Policy
   - Add the following CORS rule:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Type",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

3. **Update Environment Variables**
   - Copy `.env.example` to `.env`
   - Set `VITE_R2_PUBLIC_URL` to your R2 bucket's public URL
   - Example: `VITE_R2_PUBLIC_URL=https://pub-abc123xyz.r2.dev`

4. **Enable Public Access** (if using public bucket)
   - In your R2 bucket settings, enable "Public Access"
   - Or use custom domain mapping for production

## File Structure Expected in R2

The Modal backend should upload files with this structure:

```
your-bucket/
├── {job_id}/
│   ├── status.json          # Contains: { progress: 0.5, chunks: [...], complete: false }
│   ├── chunk_001.ply
│   ├── chunk_002.ply
│   └── ...
```

### status.json Format

```json
{
  "progress": 0.75,
  "chunks": [
    "job_abc123/chunk_001.ply",
    "job_abc123/chunk_002.ply",
    "job_abc123/chunk_003.ply"
  ],
  "complete": false
}
```

## Testing CORS

After setup, test CORS is working:

```bash
curl -X GET \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -I https://your-bucket.r2.dev/test.ply
```

You should see `Access-Control-Allow-Origin` in the response headers.

## Troubleshooting

### CORS Error in Browser
- **Symptom**: Console shows "CORS policy blocked" error
- **Fix**: Verify CORS rules include your frontend origin

### 404 on status.json
- **Symptom**: Polling fails with 404
- **Fix**: This is normal - the file doesn't exist until Modal creates it. The frontend silently retries every 3 seconds.

### Chunks Not Loading
- **Symptom**: Progress bar moves but no 3D model appears
- **Fix**: Check browser console for chunk fetch errors. Verify chunk URLs are correct and public.
