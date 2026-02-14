# Quick Reference - PLY Incremental Loading

## Frontend → Backend Communication

### 1. First Frame Upload
```
POST /upload-frame
Body: FormData { file: blob }

Response: { "job_id": "abc-123" }
```

### 2. Subsequent Frames
```
POST /upload-frame
Body: FormData { 
  file: blob,
  job_id: "abc-123"
}

Response: { "status": "ok" }
```

---

## R2 Bucket Structure

```
your-bucket/
├── job_abc123/
│   ├── status.json
│   ├── chunk_001.ply
│   ├── chunk_002.ply
│   └── ...
```

---

## status.json Format

```json
{
  "progress": 0.75,
  "chunks": [
    "job_abc123/chunk_001.ply",
    "job_abc123/chunk_002.ply"
  ],
  "complete": false
}
```

- **progress**: Float 0.0 to 1.0
- **chunks**: Array of R2 keys (relative paths)
- **complete**: Boolean - stops polling when true

---

## Frontend Polling Logic

1. Receive `job_id` from Modal
2. Start polling `${R2_URL}/${job_id}/status.json` every 3 seconds
3. Compare `chunks` array to previous poll
4. Load new chunks: `viewer.addSplatScene(${R2_URL}/${chunk})`
5. Update progress bar
6. Stop polling when `complete: true`

---

## Environment Variables

### Frontend (.env):
```
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Backend (Modal Secrets):
```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
```

---

## CORS Configuration (R2 Bucket)

```json
{
  "AllowedOrigins": ["http://localhost:5173", "https://your-domain.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

---

## Testing Commands

### Test CORS:
```bash
curl -X GET \
  -H "Origin: http://localhost:5173" \
  -I https://pub-xxxxx.r2.dev/test.ply
```

### Test Backend:
```bash
# First frame
curl -X POST https://your-app.modal.run/upload-frame \
  -F "file=@frame1.jpg"

# Second frame (with job_id)
curl -X POST https://your-app.modal.run/upload-frame \
  -F "file=@frame2.jpg" \
  -F "job_id=abc-123"
```

### Test R2 Status:
```bash
curl https://pub-xxxxx.r2.dev/abc-123/status.json
```

---

## Key Files

- `src/components/SplatViewer.tsx` - R2 polling + chunk loading
- `src/components/LiveScanHero.tsx` - Frame upload + job_id handling
- `src/App.tsx` - State management
- `IMPLEMENTATION_SUMMARY.md` - Full documentation
- `MODAL_BACKEND_REQUIREMENTS.md` - Backend implementation guide
- `R2_SETUP.md` - CORS setup instructions

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS error | Configure R2 bucket CORS (see R2_SETUP.md) |
| status.json 404 | Normal - file doesn't exist yet, frontend retries |
| Chunks not loading | Check console for fetch errors, verify R2 URLs |
| No job_id received | Check Modal endpoint returns `{"job_id": "..."}` |
| Build errors | Run `npm run build` and check console |

---

## Next Steps

1. ✅ Frontend implementation complete
2. ⏳ Update Modal backend (see MODAL_BACKEND_REQUIREMENTS.md)
3. ⏳ Configure R2 CORS (see R2_SETUP.md)
4. ⏳ Create `.env` file with R2_PUBLIC_URL
5. ⏳ Test end-to-end flow
