import json
import os
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from .config import INPUT_DIR, OUTPUT_DIR, LOG_DIR, USE_GEOCODING_FALLBACK
from .normalization import clean
from .utils import norm
from .workbook import first_xlsx, open_source, ensure_headers, read_context, existing_google, write_row, widths
from .google_client import validate, geocode
from .extract import from_address_validation, from_geocoding, merge_missing
from .sepomex import load_catalog, best_match
from .consolidation import consolidate, needs_second_pass
from .xlsx_integrity import validate_xlsx_tables

def estimate():
    path = first_xlsx(INPUT_DIR)
    _, sheet, headers = open_source(path)
    values = [clean(sheet.cell(row, headers["DIRECCION"]).value) for row in range(2, sheet.max_row + 1)]
    values = [value for value in values if value]
    return {"file": path.name, "rows": len(values), "unique": len({norm(value) for value in values}),
            "duplicates": len(values) - len({norm(value) for value in values}), "sepomex_loaded": len(load_catalog())}

def _postal_fields(result, match):
    if not match:
        result["VALIDACION POSTAL"] = "SIN CATALOGO/COINCIDENCIA"
        return result
    result.update({"CP SEPOMEX": match["cp"], "COLONIA SEPOMEX": match["colonia"],
                   "MUNICIPIO SEPOMEX": match["municipio"], "SIMILITUD SEPOMEX": match["score"]})
    google_cp, sep_cp = str(result.get("CODIGO POSTAL GOOGLE", "")).strip(), str(match["cp"]).strip()
    if match["score"] >= 92 and google_cp == sep_cp and google_cp:
        result["VALIDACION POSTAL"] = "COINCIDE"
    elif match["score"] >= 92 and not google_cp:
        result["VALIDACION POSTAL"] = "SEPOMEX PROPONE CP"
    elif match["score"] >= 92:
        result["VALIDACION POSTAL"] = "DISCREPANCIA CP"
    else:
        result["VALIDACION POSTAL"] = "REVISAR SEPOMEX"
    return result

def _match(catalog, result, parsed):
    return best_match(catalog, result.get("COLONIA GOOGLE") or parsed.get("COLONIA", ""),
                      result.get("MUNICIPIO GOOGLE") or parsed.get("MUNICIPIO", ""),
                      result.get("CODIGO POSTAL GOOGLE") or parsed.get("CODIGO POSTAL", ""))

def _has_google(result):
    return any(result.get(key) not in (None, "") for key in ("CALLE GOOGLE", "PLACE ID", "ADDRESS COMPLETE"))

def process(progress=None, stop_flag=None):
    source = first_xlsx(INPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True); LOG_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / f"{source.stem}_VALIDADO_V5.xlsx"
    workbook, sheet, headers = open_source(source)
    positions, address_column = ensure_headers(sheet), headers["DIRECCION"]
    rows_by_key, representatives = defaultdict(list), {}
    for row in range(2, sheet.max_row + 1):
        address = clean(sheet.cell(row, address_column).value)
        if not address: continue
        context = read_context(sheet, row, headers)
        key = (norm(address), norm(context.get("MUNICIPIO")), norm(context.get("CODIGO POSTAL")))
        rows_by_key[key].append(row); representatives.setdefault(key, (address, context, row))
    catalog, counts, errors, decisions = load_catalog(), Counter(), [], []
    total = len(representatives)
    for index, (key, (address, context, representative_row)) in enumerate(representatives.items(), 1):
        if stop_flag and stop_flag(): break
        audit = {"timestamp": datetime.now(timezone.utc).isoformat(), "address": address, "rows": rows_by_key[key],
                 "query_context": context, "second_pass": False}
        try:
            result = existing_google(sheet, representative_row, headers)
            validation_cached = True
            if not _has_google(result):
                response = validate(address, context)
                if response.get("error"): raise RuntimeError(response["error"])
                validation_cached = bool(response.get("cached")); result = from_address_validation(response.get("payload"))
            match = _match(catalog, result, context); _postal_fields(result, match)
            preliminary = consolidate(result, context, match or {})
            audit.update({"validation_cached": validation_cached, "first_score": preliminary["_SCORE"],
                          "first_confidence": preliminary["CONFIANZA FINAL"]})
            if USE_GEOCODING_FALLBACK and needs_second_pass(result, preliminary["_SCORE"], preliminary["CONFIANZA FINAL"]):
                audit["second_pass"] = True
                geo_response = geocode(address, context)
                audit["geocoding_cached"] = bool(geo_response.get("cached"))
                if not geo_response.get("error"):
                    result = merge_missing(result, from_geocoding(geo_response.get("payload")))
                    match = _match(catalog, result, context); _postal_fields(result, match)
            official = consolidate(result, context, match or {})
            result.update(official)
            audit.update({"final_score": official["_SCORE"], "final_confidence": official["CONFIANZA FINAL"],
                          "origin": official["ORIGEN DECISION"], "reason": official["MOTIVO DECISION"]})
            for row in rows_by_key[key]: write_row(sheet, row, positions, result)
            counts[official["CONFIANZA FINAL"]] += len(rows_by_key[key])
        except Exception as exc:
            message = f"{index}/{total} | {address} | {exc}"; errors.append(message)
            result = {"CONFIANZA GOOGLE": "ERROR", "OBSERVACIONES GOOGLE": str(exc), "FUENTE FINAL": "ERROR",
                      "VALIDACION POSTAL": "NO PROCESADA", "CONFIANZA FINAL": "REVISAR",
                      "ORIGEN DECISION": "ERROR", "MOTIVO DECISION": str(exc)}
            for row in rows_by_key[key]: write_row(sheet, row, positions, result)
            counts["ERROR"] += len(rows_by_key[key]); audit.update({"error": str(exc), "final_confidence": "ERROR"})
        decisions.append(audit)
        if progress: progress(index, total, address, dict(counts))
    widths(sheet, positions)
    temporary_output = output.with_suffix(".tmp.xlsx")
    workbook.save(temporary_output)
    workbook.close()
    validate_xlsx_tables(temporary_output)
    os.replace(temporary_output, output)
    (LOG_DIR / "errores.log").write_text("\n".join(errors), encoding="utf-8")
    with (LOG_DIR / "decisiones_v5.jsonl").open("w", encoding="utf-8") as handle:
        for decision in decisions: handle.write(json.dumps(decision, ensure_ascii=False) + "\n")
    return output, dict(counts), errors
