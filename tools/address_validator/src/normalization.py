import re
import unicodedata

ABBREVIATIONS = {
    r"\bAV\.?\b": "AVENIDA", r"\bAVE\.?\b": "AVENIDA",
    r"\bBLVD\.?\b": "BOULEVARD", r"\bBOUL\.?\b": "BOULEVARD",
    r"\bCALZ\.?\b": "CALZADA", r"\bCARR\.?\b": "CARRETERA",
    r"\bCOL\.?\b": "COLONIA", r"\bFRACC\.?\b": "FRACCIONAMIENTO",
    r"\bPRIV\.?\b": "PRIVADA", r"\bPROL\.?\b": "PROLONGACION",
    r"\bNTE\.?\b": "NORTE", r"\bOTE\.?\b": "ORIENTE",
    r"\bPTE\.?\b": "PONIENTE", r"\bNO\.?\s*EXT\.?\b": "NUMERO EXTERIOR",
    r"\bNO\.?\s*INT\.?\b": "NUMERO INTERIOR", r"\bN[ÚU]M\.?\b": "NUMERO",
    r"#\s*": "NUMERO ",
}

SYNONYMS = {
    "N L": "NUEVO LEON", "NL": "NUEVO LEON",
    "CD DE MEXICO": "CIUDAD DE MEXICO", "MEXICO DF": "CIUDAD DE MEXICO",
    "GRAL": "GENERAL", "LIC": "LICENCIADO", "ING": "INGENIERO",
}

def clean(value):
    if value is None:
        return ""
    value = re.sub(r"\s+", " ", str(value).strip())
    value = re.sub(r"\s*,\s*", ", ", value)
    return value.strip(" ,")

def ascii_upper(value):
    value = unicodedata.normalize("NFD", clean(value).upper())
    return "".join(c for c in value if unicodedata.category(c) != "Mn")

def normalize(value, expand=True):
    value = ascii_upper(value)
    if expand:
        for pattern, replacement in ABBREVIATIONS.items():
            value = re.sub(pattern, replacement, value)
    value = value.replace(".", " ")
    value = re.sub(r"[^A-Z0-9,/ .-]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" ,.-")
    return SYNONYMS.get(value, value)

def normalize_postal_code(value):
    digits = re.sub(r"\D", "", clean(value))
    return digits.zfill(5) if digits and len(digits) <= 5 else digits[:5]

def normalize_number(value):
    value = normalize(value, expand=False)
    value = re.sub(r"^(NUMERO|NO)\s+", "", value)
    return value.replace(" ", "")
