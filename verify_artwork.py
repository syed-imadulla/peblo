import requests
import io
from PIL import Image

def create_image(width, height, color="red"):
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_upload(name, entity_type, entity_id, type_, width, height, expected_status):
    img_bytes = create_image(width, height)
    files = {"file": (f"{name}.jpg", img_bytes, "image/jpeg")}
    data = {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "type": type_
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post("http://localhost:8000/admin/artwork", data=data, files=files, headers=headers)
    
    if resp.status_code == expected_status:
        print(f"PASS: {name} (Expected {expected_status}, got {resp.status_code})")
    else:
        print(f"FAIL: {name} (Expected {expected_status}, got {resp.status_code}) - {resp.text}")


# Need a valid entity ID for the test. We will get one from the catalog.
import time
time.sleep(2) # Give the server time to start

resp = requests.get("http://localhost:8000/catalog")
if resp.status_code != 200:
    print("Failed to get catalog to find an entity ID")
    exit(1)

catalog = resp.json()
first_show = list(catalog.values())[0][0]
show_id = first_show["show_id"]

# Login to get token
resp = requests.post("http://localhost:8000/auth/login", json={"username": "admin", "password": "admin"})
token = resp.json()["access_token"]

# Valid Poster (600x900)
test_upload("valid_poster", "show", show_id, "poster", 600, 900, 200)
# Invalid Poster (e.g. 500x750, correct aspect but wrong dimensions)
test_upload("invalid_poster_dim", "show", show_id, "poster", 500, 750, 400)
# Invalid Poster (wrong aspect)
test_upload("invalid_poster_aspect", "show", show_id, "poster", 600, 600, 400)

# Valid Banner (1280x720)
test_upload("valid_banner", "show", show_id, "banner", 1280, 720, 200)
# Invalid Banner (wrong dimension)
test_upload("invalid_banner_dim", "show", show_id, "banner", 640, 360, 400)

# Valid Thumbnail (640x360)
test_upload("valid_thumb", "show", show_id, "thumbnail", 640, 360, 200)

# File > 200 KB
img = Image.new("RGB", (600, 900), color="blue")
buf = io.BytesIO()
img.save(buf, format="JPEG", quality=100, subsampling=0)
large_img_bytes = buf.getvalue()
# Make it artificially larger if needed
if len(large_img_bytes) < 200 * 1024:
    large_img_bytes += b'0' * (205 * 1024 - len(large_img_bytes))

files = {"file": ("large.jpg", large_img_bytes, "image/jpeg")}
data = {"entity_type": "show", "entity_id": show_id, "type": "poster"}
resp = requests.post("http://localhost:8000/admin/artwork", data=data, files=files, headers={"Authorization": f"Bearer {token}"})
if resp.status_code == 400 and "too large" in resp.text:
    print(f"PASS: large_file (Expected 400, got 400)")
else:
    print(f"FAIL: large_file (Expected 400, got {resp.status_code}) - {resp.text}")
