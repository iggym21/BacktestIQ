import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def _auth_headers(email="strategist@test.com"):
    client.post("/auth/register", json={"email": email, "password": "password123"})
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _sample_config(period=20):
    return {
        "mode": "visual",
        "rules": {
            "entry": [{"indicator": "SMA", "params": {"period": period}, "operator": "crosses_above",
                       "target": {"value": 0}}],
            "exit": [],
            "logic": "AND",
        },
        "position_sizing": {"type": "percent", "value": 100},
    }


def test_save_and_list_strategy():
    headers = _auth_headers()
    resp = client.post("/strategies/", json={"name": "Golden Cross", "mode": "visual", "config": _sample_config()}, headers=headers)
    assert resp.status_code == 201, resp.text

    resp = client.get("/strategies/", headers=headers)
    assert resp.status_code == 200
    names = [s["name"] for s in resp.json()]
    assert "Golden Cross" in names


def test_save_rejects_after_ten_strategies():
    headers = _auth_headers("maxedout@test.com")
    for i in range(10):
        resp = client.post("/strategies/", json={"name": f"Strat {i}", "mode": "visual", "config": _sample_config()}, headers=headers)
        assert resp.status_code == 201
    resp = client.post("/strategies/", json={"name": "One too many", "mode": "visual", "config": _sample_config()}, headers=headers)
    assert resp.status_code == 400


def test_get_strategy_not_found():
    headers = _auth_headers()
    resp = client.get("/strategies/nonexistent-id", headers=headers)
    assert resp.status_code == 404


def test_get_strategy_owned_by_another_user_is_not_found():
    headers_a = _auth_headers("ownera@test.com")
    headers_b = _auth_headers("ownerb@test.com")
    created = client.post("/strategies/", json={"name": "A's strategy", "mode": "visual", "config": _sample_config()}, headers=headers_a)
    strategy_id = created.json()["id"]

    resp = client.get(f"/strategies/{strategy_id}", headers=headers_b)
    assert resp.status_code == 404


def test_update_strategy_changes_fields_and_creates_version_snapshot():
    headers = _auth_headers("editor@test.com")
    created = client.post("/strategies/", json={"name": "v1", "mode": "visual", "config": _sample_config(period=20)}, headers=headers)
    strategy_id = created.json()["id"]

    resp = client.put(
        f"/strategies/{strategy_id}",
        json={"name": "v2", "mode": "visual", "config": _sample_config(period=50)},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    updated = resp.json()
    assert updated["name"] == "v2"
    assert updated["config"]["rules"]["entry"][0]["params"]["period"] == 50

    versions = client.get(f"/strategies/{strategy_id}/versions", headers=headers).json()
    assert len(versions) == 1
    assert versions[0]["name"] == "v1"
    assert versions[0]["config"]["rules"]["entry"][0]["params"]["period"] == 20


def test_update_strategy_twice_creates_two_versions_in_reverse_chronological_order():
    headers = _auth_headers("editor2@test.com")
    created = client.post("/strategies/", json={"name": "v1", "mode": "visual", "config": _sample_config(10)}, headers=headers)
    strategy_id = created.json()["id"]

    client.put(f"/strategies/{strategy_id}", json={"name": "v2", "mode": "visual", "config": _sample_config(20)}, headers=headers)
    client.put(f"/strategies/{strategy_id}", json={"name": "v3", "mode": "visual", "config": _sample_config(30)}, headers=headers)

    versions = client.get(f"/strategies/{strategy_id}/versions", headers=headers).json()
    assert [v["name"] for v in versions] == ["v2", "v1"]


def test_update_strategy_not_found():
    headers = _auth_headers()
    resp = client.put("/strategies/nonexistent-id", json={"name": "x", "mode": "visual", "config": _sample_config()}, headers=headers)
    assert resp.status_code == 404


def test_update_strategy_owned_by_another_user_is_rejected():
    headers_a = _auth_headers("victim@test.com")
    headers_b = _auth_headers("attacker@test.com")
    created = client.post("/strategies/", json={"name": "victim's strategy", "mode": "visual", "config": _sample_config()}, headers=headers_a)
    strategy_id = created.json()["id"]

    resp = client.put(f"/strategies/{strategy_id}", json={"name": "hacked", "mode": "visual", "config": _sample_config()}, headers=headers_b)
    assert resp.status_code == 404

    # Confirm the original strategy is untouched.
    original = client.get(f"/strategies/{strategy_id}", headers=headers_a).json()
    assert original["name"] == "victim's strategy"


def test_list_versions_for_strategy_with_no_updates_is_empty():
    headers = _auth_headers("neveredited@test.com")
    created = client.post("/strategies/", json={"name": "untouched", "mode": "visual", "config": _sample_config()}, headers=headers)
    strategy_id = created.json()["id"]

    versions = client.get(f"/strategies/{strategy_id}/versions", headers=headers)
    assert versions.status_code == 200
    assert versions.json() == []


def test_delete_strategy_also_deletes_its_versions():
    headers = _auth_headers("deleter@test.com")
    created = client.post("/strategies/", json={"name": "v1", "mode": "visual", "config": _sample_config()}, headers=headers)
    strategy_id = created.json()["id"]
    client.put(f"/strategies/{strategy_id}", json={"name": "v2", "mode": "visual", "config": _sample_config(40)}, headers=headers)

    resp = client.delete(f"/strategies/{strategy_id}", headers=headers)
    assert resp.status_code == 204

    assert client.get(f"/strategies/{strategy_id}", headers=headers).status_code == 404
    assert client.get(f"/strategies/{strategy_id}/versions", headers=headers).status_code == 404


def test_all_strategy_endpoints_require_auth():
    assert client.get("/strategies/").status_code == 401
    assert client.post("/strategies/", json={"name": "x", "mode": "visual", "config": {}}).status_code == 401
    assert client.get("/strategies/some-id").status_code == 401
    assert client.put("/strategies/some-id", json={"name": "x", "mode": "visual", "config": {}}).status_code == 401
    assert client.get("/strategies/some-id/versions").status_code == 401
    assert client.delete("/strategies/some-id").status_code == 401
