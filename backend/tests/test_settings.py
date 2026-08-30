"""
Tests for the settings API endpoints.
Covers: GET, site update, content update, publishing update, non-admin restriction, storage test.
"""
import pytest


def admin_token(client):
    res = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200
    return res.json()["access_token"]


def editor_token(client):
    res = client.post("/auth/login", json={"username": "editor", "password": "editor"})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_get_settings_as_admin(client):
    token = admin_token(client)
    res = client.get("/admin/settings", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "db_settings" in data
    assert "system_info" in data
    si = data["system_info"]
    # Must include real storage info sourced from config
    assert "storage_provider" in si
    assert "data_path" in si
    assert "assets_path" in si
    # Must include artwork specs from reference.json
    assert "artwork_specs" in si
    specs = si["artwork_specs"]
    assert "poster" in specs
    assert "banner" in specs
    assert "thumbnail" in specs
    for key, spec in specs.items():
        assert "aspect" in spec
        assert "target_px" in spec
        assert "max_kb" in spec


def test_get_settings_as_editor_is_allowed(client):
    """Editors can view settings read-only."""
    token = editor_token(client)
    res = client.get("/admin/settings", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "db_settings" in res.json()


def test_unauthenticated_cannot_access_settings(client):
    """Unauthenticated requests must be rejected."""
    res = client.get("/admin/settings")
    assert res.status_code == 401


def test_update_site_settings(client):
    token = admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "site_name": "PeBLo Test",
        "admin_email": "test@peblo.tv",
        "site_url": "http://localhost:5173",
        "timezone": "Asia/Kolkata",
    }
    res = client.put("/admin/settings/site", json=payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["site_name"] == "PeBLo Test"
    assert body["admin_email"] == "test@peblo.tv"
    assert body["site_url"] == "http://localhost:5173"
    assert body["timezone"] == "Asia/Kolkata"

    # Verify persistence via GET
    get_res = client.get("/admin/settings", headers=headers)
    assert get_res.json()["db_settings"]["site_name"] == "PeBLo Test"


def test_update_content_settings(client):
    token = admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "default_section": "series",
        "default_languages": ["en", "hi"],
        "default_status": "Draft",
        "season_0_handling": "Reserved for trailers",
        "content_grouping": "Group language variants",
    }
    res = client.put("/admin/settings/content", json=payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["default_section"] == "series"
    assert set(body["default_languages"]) == {"en", "hi"}


def test_update_publishing_settings(client):
    token = admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "auto_publish": False,
        "generate_backup": True,
        "catalogue_format": "JSON",
        "atomic_publish": True,
    }
    res = client.put("/admin/settings/publishing", json=payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["generate_backup"] is True
    assert body["atomic_publish"] is True
    assert body["catalogue_format"] == "JSON"


def test_non_admin_cannot_update_settings(client):
    token = editor_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "site_name": "Hacked",
        "admin_email": "hack@evil.com",
        "site_url": "http://evil.com",
        "timezone": "UTC",
    }
    res = client.put("/admin/settings/site", json=payload, headers=headers)
    assert res.status_code == 403


def test_storage_test_succeeds_and_cleans_up(client, tmp_path, monkeypatch):
    """
    The storage test must succeed and must not leave any .conn_test_ file behind.
    We monkeypatch storage to use a tmp_path so we can verify cleanup.
    """
    import os
    from app.services import storage as storage_module

    # Point both storages at the tmp directory for this test
    original_data = storage_module.storage.base_path
    original_asset = storage_module.asset_storage.base_path
    storage_module.storage.base_path = str(tmp_path)
    storage_module.asset_storage.base_path = str(tmp_path)

    try:
        token = admin_token(client)
        res = client.post("/admin/settings/storage/test", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True

        # Verify no test files remain
        leftover = [f for f in os.listdir(tmp_path) if f.startswith(".conn_test_")]
        assert leftover == [], f"Leftover test files found: {leftover}"
    finally:
        storage_module.storage.base_path = original_data
        storage_module.asset_storage.base_path = original_asset


def test_artwork_specs_match_reference_json(client):
    """
    The artwork specs returned by the API must match reference.json exactly.
    """
    import json, os
    # tests/ is inside backend/, so we go: backend/../docs/challenge/reference.json
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ref_path = os.path.join(backend_dir, "..", "docs", "challenge", "reference.json")
    ref_path = os.path.abspath(ref_path)
    with open(ref_path) as f:
        reference = json.load(f)
    expected_specs = reference.get("artwork_specs", {})

    token = admin_token(client)
    res = client.get("/admin/settings", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    returned_specs = res.json()["system_info"]["artwork_specs"]

    assert returned_specs == expected_specs, (
        f"API artwork specs do not match reference.json.\n"
        f"Expected: {expected_specs}\nGot: {returned_specs}"
    )
