import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_creates_user():
    resp = client.post("/auth/register", json={"email": "test@test.com", "password": "password123"})
    assert resp.status_code == 201
    assert resp.json()["email"] == "test@test.com"

def test_register_duplicate_email_fails():
    client.post("/auth/register", json={"email": "dup@test.com", "password": "password123"})
    resp = client.post("/auth/register", json={"email": "dup@test.com", "password": "password123"})
    assert resp.status_code == 400

def test_login_returns_token():
    client.post("/auth/register", json={"email": "login@test.com", "password": "password123"})
    resp = client.post("/auth/login", data={"username": "login@test.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_wrong_password_fails():
    client.post("/auth/register", json={"email": "wrong@test.com", "password": "password123"})
    resp = client.post("/auth/login", data={"username": "wrong@test.com", "password": "badpass"})
    assert resp.status_code == 401
