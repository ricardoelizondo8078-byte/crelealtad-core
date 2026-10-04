import re
import sys
import zipfile
from copy import copy
from html import unescape
from pathlib import Path
from xml.etree import ElementTree as ET

from openpyxl.utils.cell import get_column_letter, range_boundaries

sys.path.insert(0, str(Path(__file__).parent))
from src.xlsx_integrity import validate_xlsx_tables

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ET.register_namespace("", MAIN_NS)
ET.register_namespace("r", REL_NS)


def q(name):
    return f"{{{MAIN_NS}}}{name}"


def split_ref(reference):
    match = re.fullmatch(r"([A-Z]+)([0-9]+)", reference)
    if not match:
        raise ValueError(f"Referencia de celda invalida: {reference}")
    number = 0
    for character in match.group(1):
        number = number * 26 + ord(character) - 64
    return number, int(match.group(2))


def cell_text(cell):
    inline = cell.find(q("is"))
    if inline is not None:
        return "".join(node.text or "" for node in inline.iter(q("t")))
    value = cell.find(q("v"))
    return "" if value is None else value.text or ""


def transform_sheet(xml_bytes):
    row1_match = re.search(br'<row r="1"[^>]*>.*?</row>', xml_bytes)
    if not row1_match:
        raise ValueError("No se encontro la fila fisica de encabezados.")
    headers_by_column = {}
    for match in re.finditer(br'<c r="([A-Z]+)1"[^>]*>(.*?)</c>', row1_match.group(0)):
        column, _ = split_ref(match.group(1).decode("ascii") + "1")
        text_match = re.search(br'<t(?: [^>]*)?>(.*?)</t>', match.group(2))
        text = "" if not text_match else unescape(text_match.group(1).decode("utf-8"))
        if column >= 26:
            column -= 4
        if text:
            headers_by_column[column] = text
    headers = [headers_by_column.get(column, "") for column in range(1, 58)]
    if any(not header.strip() for header in headers):
        raise ValueError(f"Encabezados fisicos vacios despues de compactar: {headers}")
    if len({header.strip().casefold() for header in headers}) != len(headers):
        raise ValueError("Encabezados fisicos duplicados despues de compactar.")

    gap_pattern = re.compile(br'<c r="[V-Y][0-9]+"[^>]*?(?:/>|>.*?</c>)')
    for cell_match in gap_pattern.finditer(xml_bytes):
        if re.search(br'<(?:v|f|t)(?: [^>]*)?>[^<]+</(?:v|f|t)>', cell_match.group(0)):
            raise ValueError("El hueco V:Y contiene una celda con datos.")
    xml_bytes = gap_pattern.sub(b"", xml_bytes)

    def shift_cell(match):
        column, row_number = split_ref(match.group(2).decode("ascii") + match.group(3).decode("ascii"))
        if 26 <= column <= 61:
            column -= 4
        return match.group(1) + get_column_letter(column).encode("ascii") + match.group(3) + match.group(4)

    xml_bytes = re.sub(br'(<c r=")([A-Z]+)([0-9]+)(")', shift_cell, xml_bytes)

    def shift_column_dimension(match):
        fragment = match.group(0)
        minimum = int(re.search(br' min="([0-9]+)"', fragment).group(1))
        maximum = int(re.search(br' max="([0-9]+)"', fragment).group(1))
        if minimum <= 25 and maximum >= 22:
            if not (22 <= minimum <= maximum <= 25):
                raise ValueError(f"Rango de formato de columnas ambiguo: {minimum}:{maximum}")
            return b""
        if 26 <= minimum and maximum <= 61:
            fragment = re.sub(br' min="[0-9]+"', f' min="{minimum - 4}"'.encode(), fragment, count=1)
            fragment = re.sub(br' max="[0-9]+"', f' max="{maximum - 4}"'.encode(), fragment, count=1)
        return fragment

    xml_bytes = re.sub(br'<col [^>]*/>', shift_column_dimension, xml_bytes)
    xml_bytes = re.sub(
        br'(<dimension ref="[A-Z]+1:)[A-Z]+([0-9]+")', br'\1BE\2', xml_bytes, count=1
    )
    xml_bytes = re.sub(
        br'(<autoFilter ref="[A-Z]+1:)[A-Z]+([0-9]+")', br'\1BE\2', xml_bytes, count=1
    )
    return xml_bytes, headers


def transform_table(xml_bytes, headers):
    root = ET.fromstring(xml_bytes)
    _, _, _, max_row = range_boundaries(root.get("ref"))
    final_ref = f"A1:BE{max_row}"
    root.set("ref", final_ref)
    auto_filter = root.find(q("autoFilter"))
    if auto_filter is None:
        auto_filter = ET.Element(q("autoFilter"), {"ref": final_ref})
        root.insert(0, auto_filter)
    else:
        auto_filter.set("ref", final_ref)
    sort_state = root.find(q("sortState"))
    if sort_state is not None:
        root.remove(sort_state)

    old_columns_node = root.find(q("tableColumns"))
    old_by_name = {
        column.get("name"): copy(column)
        for column in old_columns_node.findall(q("tableColumn"))
    }
    new_columns_node = ET.Element(q("tableColumns"), {"count": str(len(headers))})
    for identifier, header in enumerate(headers, 1):
        column = old_by_name.get(header, ET.Element(q("tableColumn")))
        column.set("id", str(identifier))
        column.set("name", header)
        new_columns_node.append(column)
    position = list(root).index(old_columns_node)
    root.remove(old_columns_node)
    root.insert(position, new_columns_node)
    return ET.tostring(root, encoding="utf-8", xml_declaration=False)


def regenerate(defective, output):
    defective = Path(defective)
    output = Path(output)
    with zipfile.ZipFile(defective, "r") as source:
        sheet_bytes, headers = transform_sheet(source.read("xl/worksheets/sheet1.xml"))
        table_bytes = transform_table(source.read("xl/tables/table1.xml"), headers)
        with zipfile.ZipFile(output, "w") as destination:
            for info in source.infolist():
                data = source.read(info.filename)
                if info.filename == "xl/worksheets/sheet1.xml":
                    data = sheet_bytes
                elif info.filename == "xl/tables/table1.xml":
                    data = table_bytes
                destination.writestr(info, data)
    validate_xlsx_tables(output, require_table=True)


if __name__ == "__main__":
    regenerate(Path(sys.argv[1]), Path(sys.argv[2]))
