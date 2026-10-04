import hashlib
import re
import unicodedata
from .normalization import clean, normalize

def norm(value):
    return normalize(value)

def key_for(value):
    return hashlib.sha256(norm(value).encode("utf-8")).hexdigest()

def legacy_norm(value):
    value = clean(value).upper()
    value = unicodedata.normalize("NFD", value)
    value = "".join(character for character in value if unicodedata.category(character) != "Mn")
    value = re.sub(r"[^A-Z0-9#,/ .-]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()

def legacy_key_for(value):
    return hashlib.sha256(legacy_norm(value).encode("utf-8")).hexdigest()

def enriched_address(raw, municipality="", state_hint="Nuevo León", postal_code=""):
    raw = clean(raw)
    if not raw: return ""
    parts = [raw]
    for value in (municipality, state_hint, postal_code, "México"):
        value = clean(value)
        if value and normalize(value) not in normalize(", ".join(parts)):
            parts.append(value)
    return ", ".join(parts)
