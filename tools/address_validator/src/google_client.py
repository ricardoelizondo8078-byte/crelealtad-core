import time
import requests
from .config import API_KEY, REGION_CODE, STATE_HINT, REQUEST_DELAY_SECONDS
from .utils import key_for, legacy_key_for, enriched_address
from . import cache

S = requests.Session()
TIMEOUT = 30

def _ensure_key():
    if not API_KEY: raise RuntimeError("API key no configurada. Ejecuta 01_CONFIGURAR.bat.")

def _query(raw, context=None):
    context = context or {}
    return enriched_address(raw, context.get("MUNICIPIO", ""), context.get("ESTADO", "") or STATE_HINT,
                            context.get("CODIGO POSTAL", ""))

def validate(raw, context=None):
    _ensure_key()
    address = _query(raw, context)
    old = cache.get("address_validation", key_for(address))
    if not old and context:
        legacy = enriched_address(raw, "", STATE_HINT, "")
        old = cache.get("address_validation", legacy_key_for(legacy))
    if old: return old
    url = "https://addressvalidation.googleapis.com/v1:validateAddress"
    body = {"address": {"regionCode": REGION_CODE, "addressLines": [address]}}
    try:
        response = S.post(url, params={"key": API_KEY}, json=body, timeout=TIMEOUT)
        payload = response.json()
        error = None if response.ok else str(payload)
        cache.put("address_validation", key_for(address), address, response.status_code, payload, error)
        time.sleep(REQUEST_DELAY_SECONDS)
        return {"status": response.status_code, "payload": payload, "error": error, "cached": False}
    except Exception as exc:
        raise RuntimeError(f"Error de red en Address Validation: {exc}") from exc

def geocode(raw, context=None):
    _ensure_key()
    address = _query(raw, context)
    old = cache.get("geocoding", key_for(address))
    if not old and context:
        legacy = enriched_address(raw, "", STATE_HINT, "")
        old = cache.get("geocoding", legacy_key_for(legacy))
    if old: return old
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    try:
        response = S.get(url, params={"address": address, "key": API_KEY, "region": "mx", "language": "es"}, timeout=TIMEOUT)
        payload = response.json()
        ok = response.ok and payload.get("status") in ("OK", "ZERO_RESULTS")
        error = None if ok else str(payload)
        cache.put("geocoding", key_for(address), address, response.status_code, payload, error)
        time.sleep(REQUEST_DELAY_SECONDS)
        return {"status": response.status_code, "payload": payload, "error": error, "cached": False}
    except Exception as exc:
        raise RuntimeError(f"Error de red en Geocoding: {exc}") from exc

def test_api():
    return validate("Av. Constitución 999", {"MUNICIPIO": "Monterrey", "ESTADO": "Nuevo León", "CODIGO POSTAL": "64000"})
