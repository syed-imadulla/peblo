import json
from app.services.publish import PublishService
from app.models.models import Episode
from app.services.storage import storage

def test_publish_determinism(db_session, client):
    # 1. Trigger publish API
    response1 = client.post("/admin/catalog/publish")
    assert response1.status_code == 200
    data1 = response1.json()
    assert data1["status"] == "success"
    assert data1["published_records"] == 82
    assert data1["blocked_records"] == 3
    
    # Read the output JSON
    cat1_json = storage.read("catalogue.json")
    assert cat1_json is not None
    cat1 = json.loads(cat1_json)
    
    # 2. Trigger publish API again to test determinism
    response2 = client.post("/admin/catalog/publish")
    assert response2.status_code == 200
    
    cat2_json = storage.read("catalogue.json")
    
    # EXACT string match to ensure keys and orders are completely deterministic
    assert cat1_json == cat2_json
    
    # 3. Verify Trailer Routing (Season 0)
    # Motis Many Lives (featured) has a Season 0. Let's find it.
    found_trailer = False
    for show in cat1.get("featured", []):
        if show["slug"] == "motis-many-lives":
            assert len(show["trailers"]) == 1 # According to verify_pipeline, we had 2 trailers total across all shows. This one has 1.
            found_trailer = True
            
            # Ensure Season 0 doesn't appear in regular seasons
            for s in show["seasons"]:
                assert s["season_number"] != 0
                
    assert found_trailer

def test_validation_report_api(client):
    response = client.get("/admin/validation-report")
    assert response.status_code == 200
    data = response.json()
    assert data["blocked_records_count"] == 3
    assert len(data["issues"]) > 0

def test_catalog_api(client):
    response = client.get("/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "featured" in data

def test_search_api(client):
    response = client.get("/catalog/search?q=moti")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["slug"] == "motis-many-lives"
