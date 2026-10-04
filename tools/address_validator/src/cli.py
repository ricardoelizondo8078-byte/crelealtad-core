import sys
from .processor import estimate

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "estimate"
    if cmd == "estimate":
        e = estimate()
        print("="*72)
        print("PREVISUALIZACION - NO HACE CONSULTAS A GOOGLE")
        print("="*72)
        print("Archivo:", e["file"])
        print(f"Registros con direccion: {e['rows']:,}")
        print(f"Direcciones unicas:      {e['unique']:,}")
        print(f"Duplicados evitados:     {e['duplicates']:,}")
        print(f"Registros SEPOMEX cargados: {e['sepomex_loaded']:,}")
        print("="*72)

if __name__ == "__main__":
    main()
