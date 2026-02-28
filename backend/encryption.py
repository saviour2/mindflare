import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_key = os.getenv("ENCRYPTION_KEY")
if not _key:
    _key = Fernet.generate_key().decode()
    with open(".env", "a") as f:
        f.write(f"\nENCRYPTION_KEY={_key}\n")

cipher_suite = Fernet(_key.encode())

def encrypt_symmetric(data: str) -> str:
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_symmetric(encrypted_data: str) -> str:
    return cipher_suite.decrypt(encrypted_data.encode()).decode()
