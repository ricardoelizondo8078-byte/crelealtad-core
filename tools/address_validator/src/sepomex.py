import csv
from collections import defaultdict
from rapidfuzz import fuzz, process
from .utils import norm
from .normalization import normalize_postal_code
from .config import CATALOG_DIR

IGNORE_NAMES = {"LEEME_SEPOMEX.TXT", "LEEME.TXT", "README.TXT", "README.CSV"}
_INDEXES = {}
_MATCHES = {}

def find_catalog():
    candidates = []
    for extension in ("*.txt", "*.csv", "*.TXT", "*.CSV"):
        candidates.extend(CATALOG_DIR.glob(extension))
    usable = []
    for path in candidates:
        try:
            if path.name.upper() not in IGNORE_NAMES and path.stat().st_size >= 10_000:
                usable.append(path)
        except OSError:
            pass
    return sorted(set(usable))[0] if usable else None

def _text(value):
    if value is None: return ""
    if isinstance(value, list): return " ".join(str(item) for item in value if item is not None).strip()
    return str(value).strip()

def load_catalog():
    path = find_catalog()
    if not path: return []
    for encoding in ("utf-8-sig", "latin-1", "cp1252"):
        try:
            with path.open("r", encoding=encoding, newline="") as handle:
                lines = handle.readlines()
                header_index = next(
                    (index for index, line in enumerate(lines) if line.lstrip("\ufeff").startswith("d_codigo|")),
                    None,
                )
                if header_index is not None:
                    lines = lines[header_index:]
                    delimiter = "|"
                else:
                    sample = "".join(lines[:50])
                    delimiter = "\t" if "\t" in sample else ","
                rows = [{_text(k): _text(v) for k, v in row.items() if _text(k)}
                        for row in csv.DictReader(lines, delimiter=delimiter)]
            if rows: return rows
        except (UnicodeDecodeError, csv.Error):
            continue
        except Exception:
            return []
    return []

def _get(row, *names):
    lowered = {str(key).lower(): _text(value) for key, value in row.items()}
    return next((lowered[name.lower()] for name in names if name.lower() in lowered), "")

def _indexes(catalog):
    key = id(catalog)
    if key in _INDEXES: return _INDEXES[key]
    municipalities, postal_codes = defaultdict(list), defaultdict(list)
    for row in catalog:
        municipalities[norm(_get(row, "D_mnpio", "d_mnpio", "municipio"))].append(row)
        postal_codes[normalize_postal_code(_get(row, "d_codigo", "codigo postal", "codigo_postal", "cp"))].append(row)
    _INDEXES[key] = (municipalities, postal_codes)
    return _INDEXES[key]

def best_match(catalog, colonia, municipio, postal_code=""):
    if not catalog or not colonia: return None
    cache_key = (id(catalog), norm(colonia), norm(municipio), normalize_postal_code(postal_code))
    if cache_key in _MATCHES: return _MATCHES[cache_key]
    municipalities, postal_codes = _indexes(catalog)
    normalized_municipality, normalized_cp = norm(municipio), normalize_postal_code(postal_code)
    candidates = postal_codes.get(normalized_cp, []) if normalized_cp else []
    if not candidates and normalized_municipality:
        candidates = municipalities.get(normalized_municipality, [])
        if not candidates and municipalities:
            match = process.extractOne(normalized_municipality, municipalities.keys(), scorer=fuzz.ratio, score_cutoff=75)
            candidates = municipalities.get(match[0], []) if match else []
    if not candidates: candidates = catalog
    target, best = norm(colonia), None
    for row in candidates:
        settlement = _get(row, "d_asenta", "asentamiento", "colonia")
        if not settlement: continue
        score = fuzz.token_set_ratio(target, norm(settlement))
        municipality_name = _get(row, "D_mnpio", "d_mnpio", "municipio")
        if normalized_municipality and municipality_name:
            score = round(score * 0.8 + fuzz.ratio(normalized_municipality, norm(municipality_name)) * 0.2, 2)
        if best is None or score > best["score"]:
            best = {"score": score, "cp": _get(row, "d_codigo", "codigo postal", "codigo_postal", "cp"),
                    "colonia": settlement, "municipio": municipality_name,
                    "estado": _get(row, "d_estado", "estado")}
    _MATCHES[cache_key] = best
    return best
