import os

from app.core.config import settings

class StorageProvider:
    def write(self, filename: str, content: str):
        raise NotImplementedError

    def write_binary(self, filename: str, content: bytes):
        raise NotImplementedError

    def rename(self, old_name: str, new_name: str):
        raise NotImplementedError

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_path: str = None):
        self.base_path = base_path or settings.DATA_DIR
        os.makedirs(self.base_path, exist_ok=True)

    def write(self, filename: str, content: str):
        with open(os.path.join(self.base_path, filename), "w") as f:
            f.write(content)

    def write_binary(self, filename: str, content: bytes):
        with open(os.path.join(self.base_path, filename), "wb") as f:
            f.write(content)

    def read(self, filename: str) -> str:
        filepath = os.path.join(self.base_path, filename)
        if not os.path.exists(filepath):
            return None
        with open(filepath, "r") as f:
            return f.read()

    def rename(self, old_name: str, new_name: str):
        old_path = os.path.join(self.base_path, old_name)
        new_path = os.path.join(self.base_path, new_name)
        # atomic rename on POSIX
        os.rename(old_path, new_path)

storage = LocalStorageProvider()
asset_storage = LocalStorageProvider(base_path=settings.ASSETS_DIR)
