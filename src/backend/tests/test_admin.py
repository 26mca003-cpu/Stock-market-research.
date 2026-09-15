from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_endpoints_unauthorized():
    endpoints = [
        "/api/admin/overview",
        "/api/admin/jobs",
        "/api/admin/scrapers",
        "/api/admin/llm",
        "/api/admin/algorithm/test",
        "/api/admin/data-quality",
        "/api/admin/users",
        "/api/admin/reports",
    ]
    for ep in endpoints:
        resp = client.get(ep)
        assert resp.status_code in [401, 403], f"Endpoint {ep} should be protected"

def test_admin_post_unauthorized():
    resp = client.post("/api/admin/cache/invalidate", json={"ticker": "RELIANCE.NS"})
    assert resp.status_code in [401, 403]
    
    resp = client.post("/api/admin/reports/RELIANCE.NS/reanalyze")
    assert resp.status_code in [401, 403]
