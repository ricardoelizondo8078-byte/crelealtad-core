from collections import defaultdict

def _first(d, *keys):
    for k in keys:
        if d.get(k):
            return d[k][0]
    return ""

def from_address_validation(payload):
    result = (payload or {}).get("result", {}) or {}
    verdict = result.get("verdict", {}) or {}
    address = result.get("address", {}) or {}
    postal = address.get("postalAddress", {}) or {}
    geocode = result.get("geocode", {}) or {}
    location = geocode.get("location", {}) or {}

    comps = defaultdict(list)
    flags = {}
    for c in address.get("addressComponents", []) or []:
        typ = c.get("componentType", "")
        text = ((c.get("componentName") or {}).get("text") or "").strip()
        if typ and text:
            comps[typ].append(text)
            flags[typ] = {
                "confirmation": c.get("confirmationLevel", ""),
                "inferred": bool(c.get("inferred")),
                "spellCorrected": bool(c.get("spellCorrected")),
                "replaced": bool(c.get("replaced")),
                "unexpected": bool(c.get("unexpected")),
            }

    missing = address.get("missingComponentTypes", []) or []
    unconfirmed = address.get("unconfirmedComponentTypes", []) or []
    unresolved = address.get("unresolvedTokens", []) or []
    validation_granularity = verdict.get("validationGranularity", "")
    geocode_granularity = verdict.get("geocodeGranularity", "")
    complete = bool(verdict.get("addressComplete"))
    has_unconfirmed = bool(verdict.get("hasUnconfirmedComponents"))

    calle = _first(comps, "route")
    ext = _first(comps, "street_number")
    interior = _first(comps, "subpremise")
    colonia = _first(comps, "neighborhood", "sublocality_level_1", "sublocality", "sublocality_level_2")
    municipio = _first(comps, "locality", "administrative_area_level_2") or postal.get("locality", "")
    cp = _first(comps, "postal_code") or postal.get("postalCode", "")
    estado = _first(comps, "administrative_area_level_1") or postal.get("administrativeArea", "")
    pais = _first(comps, "country")

    corrected = [k for k,v in flags.items() if v["inferred"] or v["spellCorrected"] or v["replaced"]]

    if complete and not has_unconfirmed and not missing and not unresolved and validation_granularity in ("PREMISE","SUB_PREMISE"):
        conf = "ALTA"
    elif calle and municipio and (cp or ext):
        conf = "MEDIA"
    else:
        conf = "REVISAR"

    obs = []
    if missing: obs.append("Faltantes: " + ", ".join(missing))
    if unconfirmed: obs.append("No confirmados: " + ", ".join(unconfirmed))
    if unresolved: obs.append("Tokens no resueltos: " + ", ".join(unresolved))
    if corrected: obs.append("Google corrigió/infirió: " + ", ".join(corrected))
    if not complete: obs.append("Dirección no marcada como completa")

    return {
        "CALLE GOOGLE": calle,
        "NUMERO EXTERIOR GOOGLE": ext,
        "NUMERO INTERIOR GOOGLE": interior,
        "COLONIA GOOGLE": colonia,
        "MUNICIPIO GOOGLE": municipio,
        "CODIGO POSTAL GOOGLE": cp,
        "ESTADO GOOGLE": estado,
        "PAIS GOOGLE": pais,
        "LATITUD": location.get("latitude", ""),
        "LONGITUD": location.get("longitude", ""),
        "PLACE ID": geocode.get("placeId", ""),
        "DIRECCION ESTANDARIZADA GOOGLE": address.get("formattedAddress", ""),
        "VALIDATION GRANULARITY": validation_granularity,
        "GEOCODE GRANULARITY": geocode_granularity,
        "ADDRESS COMPLETE": complete,
        "CONFIANZA GOOGLE": conf,
        "OBSERVACIONES GOOGLE": "; ".join(obs),
        "FUENTE FINAL": "ADDRESS VALIDATION",
        "_MISSING": missing,
        "_UNCONFIRMED": unconfirmed,
        "_UNRESOLVED": unresolved,
    }

def from_geocoding(payload):
    if not payload or payload.get("status") != "OK" or not payload.get("results"):
        return {}
    r = payload["results"][0]
    d = defaultdict(list)
    for c in r.get("address_components", []) or []:
        for t in c.get("types", []) or []:
            d[t].append(c.get("long_name", ""))
    loc = ((r.get("geometry") or {}).get("location") or {})
    return {
        "CALLE GOOGLE": _first(d, "route"),
        "NUMERO EXTERIOR GOOGLE": _first(d, "street_number"),
        "COLONIA GOOGLE": _first(d, "neighborhood", "sublocality_level_1", "sublocality"),
        "MUNICIPIO GOOGLE": _first(d, "locality", "administrative_area_level_2"),
        "CODIGO POSTAL GOOGLE": _first(d, "postal_code"),
        "ESTADO GOOGLE": _first(d, "administrative_area_level_1"),
        "LATITUD": loc.get("lat", ""),
        "LONGITUD": loc.get("lng", ""),
        "PLACE ID": r.get("place_id", ""),
        "DIRECCION ESTANDARIZADA GOOGLE": r.get("formatted_address", ""),
    }

def merge_missing(primary, fallback):
    used = []
    for k, v in fallback.items():
        if not primary.get(k) and v not in ("", None):
            primary[k] = v
            used.append(k)
    if used:
        primary["FUENTE FINAL"] = "ADDRESS VALIDATION + GEOCODING"
        msg = "Geocoding completó: " + ", ".join(used)
        primary["OBSERVACIONES GOOGLE"] = "; ".join(
            x for x in [primary.get("OBSERVACIONES GOOGLE",""), msg] if x
        )
    return primary
