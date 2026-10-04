from rapidfuzz import fuzz
from .normalization import clean, normalize, normalize_number, normalize_postal_code

GRANULARITY_POINTS = {
    "SUB_PREMISE": 18, "PREMISE": 17, "PREMISE_PROXIMITY": 14,
    "BLOCK": 10, "ROUTE": 7, "OTHER": 2,
}

def _granularity_key(value):
    return clean(value).upper().replace("-", "_").replace(" ", "_")

OFFICIAL_COLUMNS = [
    "CALLE OFICIAL", "NUMERO EXTERIOR OFICIAL", "NUMERO INTERIOR OFICIAL",
    "COLONIA OFICIAL", "MUNICIPIO OFICIAL", "CODIGO POSTAL OFICIAL",
    "ESTADO OFICIAL", "LATITUD OFICIAL", "LONGITUD OFICIAL",
    "PLACE ID OFICIAL", "CONFIANZA FINAL", "ORIGEN DECISION", "MOTIVO DECISION",
]

def _truth(value):
    return value if isinstance(value, bool) else normalize(value, False) in {"TRUE", "VERDADERO", "SI", "1"}

def _similar(a, b):
    return fuzz.ratio(normalize(a), normalize(b)) if clean(a) and clean(b) else 0

def score_result(google, parsed, sepomex):
    score, reasons = 0, []
    if _truth(google.get("ADDRESS COMPLETE")):
        score += 18; reasons.append("dirección completa +18")
    else:
        score -= 12; reasons.append("dirección incompleta -12")
    validation = GRANULARITY_POINTS.get(_granularity_key(google.get("VALIDATION GRANULARITY")), 0)
    geocode = GRANULARITY_POINTS.get(_granularity_key(google.get("GEOCODE GRANULARITY")), 0)
    score += validation + geocode
    reasons.append(f"granularidad validación +{validation}; geocódigo +{geocode}")
    if google.get("PLACE ID"):
        score += 10; reasons.append("Place ID +10")
    if google.get("LATITUD") not in (None, "") and google.get("LONGITUD") not in (None, ""):
        score += 10; reasons.append("coordenadas +10")
    missing = google.get("_MISSING", []) or []
    unconfirmed = google.get("_UNCONFIRMED", []) or []
    missing_penalty, unconfirmed_penalty = min(24, 6 * len(missing)), min(16, 4 * len(unconfirmed))
    score -= missing_penalty + unconfirmed_penalty
    if missing: reasons.append(f"{len(missing)} componentes faltantes -{missing_penalty}")
    if unconfirmed: reasons.append(f"{len(unconfirmed)} no confirmados -{unconfirmed_penalty}")
    sep_score = float(sepomex.get("score") or 0)
    if sep_score >= 92:
        score += 12; reasons.append("colonia SEPOMEX ≥92 +12")
    elif sep_score >= 80:
        score += 6; reasons.append("colonia SEPOMEX ≥80 +6")
    google_cp = normalize_postal_code(google.get("CODIGO POSTAL GOOGLE"))
    sep_cp = normalize_postal_code(sepomex.get("cp"))
    if google_cp and sep_cp:
        if google_cp == sep_cp:
            score += 10; reasons.append("CP coincide con SEPOMEX +10")
        else:
            score -= 18; reasons.append("contradicción de CP -18")
    municipality_similarity = _similar(google.get("MUNICIPIO GOOGLE"), sepomex.get("municipio"))
    if municipality_similarity >= 90:
        score += 8; reasons.append("municipio consistente +8")
    elif google.get("MUNICIPIO GOOGLE") and sepomex.get("municipio"):
        score -= 12; reasons.append("municipio contradictorio -12")
    critical_missing = sum(not clean(v) for v in [google.get("CALLE GOOGLE"), google.get("MUNICIPIO GOOGLE"), google_cp])
    score -= critical_missing * 10
    if critical_missing: reasons.append(f"{critical_missing} componentes críticos faltantes -{critical_missing*10}")
    agreements = sum(_similar(google.get(g), parsed.get(p)) >= 88 for g, p in [
        ("CALLE GOOGLE", "CALLE"), ("COLONIA GOOGLE", "COLONIA"),
        ("MUNICIPIO GOOGLE", "MUNICIPIO"), ("CODIGO POSTAL GOOGLE", "CODIGO POSTAL")])
    score += agreements * 3
    if agreements: reasons.append(f"{agreements} coincidencias con parseo +{agreements*3}")
    score = max(0, min(100, round(score)))
    cp_conflict = bool(google_cp and sep_cp and google_cp != sep_cp)
    critical_complete = all(clean(v) for v in [google.get("CALLE GOOGLE"), google.get("MUNICIPIO GOOGLE"), google_cp])
    high = score >= 70 or (score >= 65 and critical_complete and not cp_conflict)
    return score, "ALTA" if high else "MEDIA" if score >= 55 else "REVISAR", reasons

def needs_second_pass(google, score, confidence):
    missing = set(google.get("_MISSING", []) or [])
    critical = {"route", "street_number", "locality", "administrative_area_level_2", "postal_code"}
    validation_key = _granularity_key(google.get("VALIDATION GRANULARITY"))
    geocode_key = _granularity_key(google.get("GEOCODE GRANULARITY"))
    legacy_selection_score = score
    if "_" in validation_key:
        legacy_selection_score -= GRANULARITY_POINTS.get(validation_key, 0)
    if "_" in geocode_key:
        legacy_selection_score -= GRANULARITY_POINTS.get(geocode_key, 0)
    sep_score = float(google.get("SIMILITUD SEPOMEX") or 0)
    if sep_score >= 92:
        legacy_selection_score -= 12
    elif sep_score >= 80:
        legacy_selection_score -= 6
    google_cp = normalize_postal_code(google.get("CODIGO POSTAL GOOGLE"))
    sep_cp = normalize_postal_code(google.get("CP SEPOMEX"))
    if google_cp and sep_cp:
        legacy_selection_score += 18 if google_cp != sep_cp else -10
    municipality_similarity = _similar(google.get("MUNICIPIO GOOGLE"), google.get("MUNICIPIO SEPOMEX"))
    if municipality_similarity >= 90:
        legacy_selection_score -= 8
    elif google.get("MUNICIPIO GOOGLE") and google.get("MUNICIPIO SEPOMEX"):
        legacy_selection_score += 12
    return any((confidence in {"MEDIA", "REVISAR"}, not _truth(google.get("ADDRESS COMPLETE")),
                bool(missing & critical), not google.get("CALLE GOOGLE"),
                not google.get("MUNICIPIO GOOGLE"), not google.get("CODIGO POSTAL GOOGLE"),
                "DISCREPANCIA" in str(google.get("VALIDACION POSTAL", "")).upper(), legacy_selection_score < 70))

def _choose(google_value, parsed_value, sep_value="", sep_score=0, kind="text"):
    g, p, s = clean(google_value), clean(parsed_value), clean(sep_value)
    if kind == "cp": g, p, s = map(normalize_postal_code, (g, p, s))
    elif kind == "number": g, p, s = map(normalize_number, (g, p, s))
    if s and sep_score >= 92:
        if g and (normalize(g) == normalize(s) or kind == "cp" and g == s):
            return g, "GOOGLE + SEPOMEX", "Google coincide con catálogo oficial"
        if not g or kind in {"cp", "text"}:
            return s, "SEPOMEX", "Catálogo oficial con alta similitud"
    if g:
        if p and _similar(g, p) >= 88:
            return g, "GOOGLE + PARSEO", "Fuentes coincidentes"
        return g, "GOOGLE", "Componente confirmado por Google"
    if p: return p, "PARSEO", "Google no devolvió componente; se conserva parseo"
    return "", "SIN DATO", "Ninguna fuente proporcionó el componente"

def consolidate(google, parsed, sepomex):
    score, confidence, score_reasons = score_result(google, parsed, sepomex)
    ss = float(sepomex.get("score") or 0)
    mapping = {
        "CALLE OFICIAL": ("CALLE GOOGLE", "CALLE", "", "text"),
        "NUMERO EXTERIOR OFICIAL": ("NUMERO EXTERIOR GOOGLE", "NUMERO EXTERIOR", "", "number"),
        "NUMERO INTERIOR OFICIAL": ("NUMERO INTERIOR GOOGLE", "NUMERO INTERIOR", "", "number"),
        "COLONIA OFICIAL": ("COLONIA GOOGLE", "COLONIA", sepomex.get("colonia", ""), "text"),
        "MUNICIPIO OFICIAL": ("MUNICIPIO GOOGLE", "MUNICIPIO", sepomex.get("municipio", ""), "text"),
        "CODIGO POSTAL OFICIAL": ("CODIGO POSTAL GOOGLE", "CODIGO POSTAL", sepomex.get("cp", ""), "cp"),
        "ESTADO OFICIAL": ("ESTADO GOOGLE", "ESTADO", sepomex.get("estado", ""), "text"),
    }
    out, origins, motives = {}, [], []
    for official, (gk, pk, sv, kind) in mapping.items():
        value, origin, motive = _choose(google.get(gk), parsed.get(pk), sv, ss, kind)
        out[official] = value; origins.append(f"{official}: {origin}"); motives.append(f"{official}: {motive}")
    out.update({"LATITUD OFICIAL": google.get("LATITUD", ""), "LONGITUD OFICIAL": google.get("LONGITUD", ""),
                "PLACE ID OFICIAL": google.get("PLACE ID", ""), "CONFIANZA FINAL": confidence,
                "ORIGEN DECISION": " | ".join(origins + ["GEOLOCALIZACIÓN: GOOGLE"]),
                "MOTIVO DECISION": f"Puntuación {score}/100. " + "; ".join(score_reasons + motives), "_SCORE": score})
    return out
