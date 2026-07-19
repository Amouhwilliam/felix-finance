from fastapi import FastAPI

# Felix is a frontend-only prototype. This backend exists solely so the
# supervisor-managed process doesn't error out; there is no real API.

app = FastAPI(title="Felix stub")


@app.get("/api/health")
async def health():
    return {"status": "ok", "note": "Felix is a frontend-only prototype"}
