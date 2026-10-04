from pathlib import Path
import getpass

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env"

def main():
    print("="*72)
    print("CRELEALTAD ADDRESS VALIDATOR V5 - CONFIGURACION")
    print("="*72)
    print()
    print("Usa la API key NUEVA/REGENERADA.")
    print("No compartas esa clave por chat.")
    print("Se guardara solamente en el archivo local .env.")
    print()
    key = getpass.getpass("Pega la API key de Google: ").strip()
    if not key:
        raise SystemExit("No se capturo una clave.")
    ENV.write_text(
        "GOOGLE_MAPS_API_KEY=" + key + "\n"
        "REGION_CODE=MX\n"
        "STATE_HINT=Nuevo León\n"
        "CHECKPOINT_EVERY=50\n"
        "REQUEST_DELAY_SECONDS=0.05\n"
        "USE_GEOCODING_FALLBACK=true\n",
        encoding="utf-8"
    )
    print()
    print("Configuracion guardada.")
    print("Ahora abre 02_ABRIR_APLICACION.bat")

if __name__ == "__main__":
    main()
