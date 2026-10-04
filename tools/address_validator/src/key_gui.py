
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env"

class KeyWindow(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Configurar API Key - CRELEALTAD")
        self.geometry("650x260")
        self.resizable(False, False)

        frm = ttk.Frame(self, padding=20)
        frm.pack(fill="both", expand=True)

        ttk.Label(
            frm,
            text="CONFIGURAR GOOGLE MAPS API KEY",
            font=("Segoe UI", 15, "bold")
        ).pack(anchor="w")

        ttk.Label(
            frm,
            text="Pega aquí la API Key NUEVA/REGENERADA. Se guardará únicamente en esta computadora."
        ).pack(anchor="w", pady=(6, 12))

        row = ttk.Frame(frm)
        row.pack(fill="x")

        self.var = tk.StringVar()
        self.entry = ttk.Entry(row, textvariable=self.var, show="•", width=72)
        self.entry.pack(side="left", fill="x", expand=True)
        self.entry.focus_set()

        self.show = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            frm, text="Mostrar clave", variable=self.show, command=self.toggle
        ).pack(anchor="w", pady=(8, 0))

        btns = ttk.Frame(frm)
        btns.pack(fill="x", pady=(18,0))
        ttk.Button(btns, text="Guardar API Key", command=self.save).pack(side="left")
        ttk.Button(btns, text="Cancelar", command=self.destroy).pack(side="left", padx=8)

        ttk.Label(
            frm,
            text="Puedes pegar con Ctrl+V. No compartas la clave en el chat.",
            foreground="#555555"
        ).pack(anchor="w", pady=(16,0))

    def toggle(self):
        self.entry.configure(show="" if self.show.get() else "•")

    def save(self):
        key = self.var.get().strip()
        if not key:
            messagebox.showwarning("Falta clave", "Pega primero la API Key.")
            return
        if len(key) < 20:
            messagebox.showwarning("Clave inválida", "La clave parece demasiado corta.")
            return

        content = (
            f"GOOGLE_MAPS_API_KEY={key}\n"
            "REGION_CODE=MX\n"
            "STATE_HINT=Nuevo León\n"
            "CHECKPOINT_EVERY=50\n"
            "REQUEST_DELAY_SECONDS=0.05\n"
            "USE_GEOCODING_FALLBACK=true\n"
        )
        ENV.write_text(content, encoding="utf-8")
        messagebox.showinfo(
            "Guardado",
            "API Key guardada correctamente.\n\nAhora ejecuta 02_ABRIR_APLICACION.bat."
        )
        self.destroy()

def main():
    KeyWindow().mainloop()

if __name__ == "__main__":
    main()
