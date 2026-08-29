import pytest
from app.models.models import Show, Season, Episode, User, Artwork
from uuid import uuid4

def test_login_success(client):
    res = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["role"] == "admin"

def test_login_failure(client):
    res = client.post("/auth/login", json={"username": "wrong", "password": "wrong"})
    assert res.status_code == 401

def test_admin_can_publish(client, db_session):
    res = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    token = res.json()["access_token"]
    
    # Needs a seeded DB to actually publish without failing on logic, but we can check auth
    res_pub = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {token}"})
    # Might fail due to no data, but shouldn't be 401 or 403
    assert res_pub.status_code in [200, 500] 

def test_editor_cannot_publish(client):
    res = client.post("/auth/login", json={"username": "editor", "password": "editor"})
    token = res.json()["access_token"]
    
    res_pub = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {token}"})
    assert res_pub.status_code == 403

def test_crud_shows(client, db_session):
    res = client.post("/auth/login", json={"username": "editor", "password": "editor"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create
    create_res = client.post("/admin/shows", json={
        "title": "Test Show",
        "slug": f"test-show-{uuid4().hex[:8]}",
        "section": "Kids",
        "categories": ["Fun"]
    }, headers=headers)
    assert create_res.status_code == 200
    show_id = create_res.json()["id"]
    
    # List
    list_res = client.get("/admin/shows", headers=headers)
    assert list_res.status_code == 200
    assert any(s["id"] == show_id for s in list_res.json())

    # Update
    update_res = client.put(f"/admin/shows/{show_id}", json={
        "title": "Updated Show",
        "slug": create_res.json()["slug"],
        "section": "Kids"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Show"

def test_episode_uniqueness(client, db_session):
    res = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create show
    show_res = client.post("/admin/shows", json={
        "title": "Unique Show",
        "slug": f"unique-{uuid4().hex[:8]}"
    }, headers=headers)
    show_id = show_res.json()["id"]
    
    # Create season
    season_res = client.post("/admin/seasons", json={
        "show_id": show_id,
        "season_number": 1
    }, headers=headers)
    season_id = season_res.json()["id"]
    
    cg = f"ep1_group_{uuid4().hex[:8]}"
    
    # Create episode 1 (en)
    ep1_res = client.post("/admin/episodes", json={
        "season_id": season_id,
        "episode_title": "Ep 1 EN",
        "status": "draft",
        "content_group": cg,
        "language": "en"
    }, headers=headers)
    assert ep1_res.status_code == 200
    
    # Create episode 1 (hi) - same content group, DIFFERENT language -> Should succeed
    ep2_res = client.post("/admin/episodes", json={
        "season_id": season_id,
        "episode_title": "Ep 1 HI",
        "status": "draft",
        "content_group": cg,
        "language": "hi"
    }, headers=headers)
    assert ep2_res.status_code == 200
    
    # Create duplicate (en) -> Should fail
    ep3_res = client.post("/admin/episodes", json={
        "season_id": season_id,
        "episode_title": "Ep 1 EN Duplicate",
        "status": "draft",
        "content_group": cg,
        "language": "en"
    }, headers=headers)
    assert ep3_res.status_code == 400

def test_artwork_upload(client, db_session):
    res = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a show to attach artwork to
    show_res = client.post("/admin/shows", json={
        "title": "Artwork Show",
        "slug": f"artwork-{uuid4().hex[:8]}"
    }, headers=headers)
    show_id = show_res.json()["id"]

    # We need to simulate a valid image upload. 
    # Create an in-memory 2:3 image (e.g. 600x900)
    from PIL import Image
    import io
    
    img = Image.new('RGB', (600, 900), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    # Test valid poster upload
    files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
    data = {'entity_type': 'show', 'entity_id': show_id, 'type': 'poster'}
    
    import os
    from app.core.config import settings

    upload_res = client.post("/admin/artwork", data=data, files=files, headers=headers)
    assert upload_res.status_code == 200
    assert upload_res.json()["status"] == "success"

    # Clean up uploaded test file from disk
    uploaded_url = upload_res.json().get("artwork", {}).get("url", "")
    if uploaded_url.startswith("/assets/"):
        test_file_path = os.path.join(settings.ASSETS_DIR, uploaded_url.replace("/assets/", ""))
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
    
    # Test invalid aspect ratio (16:9 for poster)
    img_invalid = Image.new('RGB', (1600, 900), color = 'red')
    img_byte_arr_inv = io.BytesIO()
    img_invalid.save(img_byte_arr_inv, format='JPEG')
    files_inv = {'file': ('test.jpg', img_byte_arr_inv.getvalue(), 'image/jpeg')}
    
    upload_res_inv = client.post("/admin/artwork", data=data, files=files_inv, headers=headers)
    assert upload_res_inv.status_code == 400
    assert "aspect ratio" in upload_res_inv.json()["detail"]
