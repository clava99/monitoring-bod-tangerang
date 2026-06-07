import os
import pytest

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SESSION_SECRET", "test-secret-key-for-testing-only")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"username": "nonexistent", "password": "wrong"},
    )
    assert response.status_code in (401, 422)


def test_protected_route_without_token():
    response = client.get("/api/dashboard/summary")
    assert response.status_code in (401, 403, 422)
