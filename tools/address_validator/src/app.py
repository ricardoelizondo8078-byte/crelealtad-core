
import tkinter as tk
from tkinter import ttk, messagebox
import threading, os, traceback
from .config import API_KEY, OUTPUT_DIR, CATALOG_DIR
from .processor import estimate, process
from .google_client import test_api

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("CRELEALTAD Address Validator V5")
        self.geometry("860x650")
        self.minsize(790, 590)
        self.stop_requested = False
        self._build()
        # Do not auto-run preview. User controls it explicitly.

    def _build(self):
        frm = ttk.Frame(self, padding=18)
        frm.pack(fill="both", expand=True)

        ttk.Label(frm, text="CRELEALTAD ADDRESS VALIDATOR", font=("Segoe UI", 18, "bold")).pack(anchor="w")
        ttk.Label(frm, text="Consolidación oficial: Google Address Validation + Geocoding + SEPOMEX", font=("Segoe UI", 10)).pack(anchor="w", pady=(0,16))

        self.status = ttk.Label(frm, text="Listo. Presiona 1. Previsualizar.", font=("Segoe UI", 10, "bold"))
        self.status.pack(anchor="w")

        info = ttk.LabelFrame(frm, text="Previsualización", padding=12)
        info.pack(fill="x", pady=12)
        self.info = ttk.Label(info, text="Aún no ejecutada.")
        self.info.pack(anchor="w")

        btns = ttk.Frame(frm)
        btns.pack(fill="x", pady=8)
        self.preview_btn = ttk.Button(btns, text="1. Previsualizar", command=self.preview)
        self.preview_btn.pack(side="left", padx=(0,8))
        ttk.Button(btns, text="2. Probar API (1 consulta)", command=self.api_test).pack(side="left", padx=8)
        self.run_btn = ttk.Button(btns, text="3. Procesar máxima precisión", command=self.start_process)
        self.run_btn.pack(side="left", padx=8)
        ttk.Button(btns, text="Abrir resultados", command=self.open_output).pack(side="left", padx=8)

        sep = ttk.LabelFrame(frm, text="SEPOMEX", padding=12)
        sep.pack(fill="x", pady=8)
        ttk.Label(sep, text="Opcional: coloca el catálogo oficial TXT/CSV en la carpeta 'catalogos'.").pack(anchor="w")
        ttk.Button(sep, text="Abrir carpeta catalogos", command=lambda: os.startfile(CATALOG_DIR)).pack(anchor="w", pady=(8,0))

        prog = ttk.LabelFrame(frm, text="Progreso", padding=12)
        prog.pack(fill="x", pady=8)
        self.bar = ttk.Progressbar(prog, mode="determinate", maximum=100)
        self.bar.pack(fill="x")
        self.progress_label = ttk.Label(prog, text="Sin iniciar")
        self.progress_label.pack(anchor="w", pady=(6,0))

        logf = ttk.LabelFrame(frm, text="Actividad / diagnóstico", padding=8)
        logf.pack(fill="both", expand=True, pady=8)
        self.log = tk.Text(logf, height=14, wrap="word", font=("Consolas", 9))
        self.log.pack(fill="both", expand=True)

    def append(self, s):
        self.log.insert("end", s + "\n")
        self.log.see("end")

    def preview(self):
        self.preview_btn.config(state="disabled")
        self.status.config(text="Leyendo Excel y contando direcciones…")
        self.info.config(text="Procesando…")
        self.append("PREVISUALIZAR: iniciando lectura del Excel.")
        self.update_idletasks()
        threading.Thread(target=self._preview_worker, daemon=True).start()

    def _preview_worker(self):
        try:
            e = estimate()
            self.after(0, lambda e=e: self._preview_done(e))
        except Exception as ex:
            tb = traceback.format_exc()
            self.after(0, lambda ex=ex, tb=tb: self._preview_failed(ex, tb))

    def _preview_done(self, e):
        self.preview_btn.config(state="normal")
        self.info.config(text=(
            f"Archivo: {e['file']}\n"
            f"Registros con dirección: {e['rows']:,}\n"
            f"Direcciones únicas: {e['unique']:,}\n"
            f"Duplicados evitados: {e['duplicates']:,}\n"
            f"Registros SEPOMEX cargados: {e['sepomex_loaded']:,}"
        ))
        self.status.config(text="Previsualización terminada. NO se consultó Google.")
        self.append(
            f"OK: {e['rows']:,} registros con dirección | "
            f"{e['unique']:,} únicas | {e['duplicates']:,} duplicados evitados."
        )

    def _preview_failed(self, ex, tb):
        self.preview_btn.config(state="normal")
        self.status.config(text="ERROR en previsualización. Revisa Actividad / diagnóstico.")
        self.info.config(text="No se pudo completar la previsualización.")
        self.append("ERROR PREVISUALIZACIÓN:")
        self.append(str(ex))
        self.append(tb)
        messagebox.showerror("Error de previsualización", str(ex))

    def api_test(self):
        if not API_KEY:
            messagebox.showwarning("Falta API Key", "Configura primero la API Key y vuelve a abrir la aplicación.")
            return
        self.status.config(text="Probando Address Validation API…")
        self.append("PRUEBA API: iniciando.")
        self.update_idletasks()
        threading.Thread(target=self._api_worker, daemon=True).start()

    def _api_worker(self):
        try:
            r = test_api()
            self.after(0, lambda r=r: self._api_done(r))
        except Exception as e:
            tb = traceback.format_exc()
            self.after(0, lambda e=e, tb=tb: self._api_failed(e, tb))

    def _api_done(self, r):
        if r.get("error"):
            self.append("API ERROR: " + str(r["error"])[:2000])
            messagebox.showerror("API", str(r["error"])[:1200])
            self.status.config(text="La API respondió con error.")
        else:
            source = "caché" if r.get("cached") else "Google"
            self.append(f"API OK ({source}).")
            messagebox.showinfo("API correcta", f"Address Validation respondió correctamente ({source}).")
            self.status.config(text="Prueba de API correcta.")

    def _api_failed(self, e, tb):
        self.append("ERROR PRUEBA API:")
        self.append(str(e))
        self.append(tb)
        self.status.config(text="Falló la prueba de API.")
        messagebox.showerror("API", str(e))

    def start_process(self):
        if not API_KEY:
            messagebox.showwarning("Falta API Key", "Configura primero la API Key y vuelve a abrir la aplicación.")
            return
        try:
            e = estimate()
        except Exception as ex:
            messagebox.showerror("Error", "No se pudo leer el Excel:\n\n" + str(ex))
            return
        ok = messagebox.askyesno(
            "Confirmar procesamiento",
            f"Se procesarán {e['unique']:,} direcciones únicas.\n\n"
            "Google Address Validation se consulta una vez por dirección única.\n"
            "Geocoding se usa sólo como respaldo cuando falta información.\n"
            "La caché evita repetir consultas ya realizadas.\n\n¿Comenzar?"
        )
        if not ok:
            return
        self.run_btn.config(state="disabled")
        self.stop_requested = False
        self.log.delete("1.0","end")
        threading.Thread(target=self._worker, daemon=True).start()

    def _worker(self):
        def cb(i,total,address,counts):
            pct = (i/total)*100 if total else 0
            self.after(0, lambda: self._update_progress(i,total,address,counts,pct))
        try:
            out, counts, errors = process(progress=cb, stop_flag=lambda: self.stop_requested)
            self.after(0, lambda: self._done(out, counts, errors))
        except Exception as e:
            tb = traceback.format_exc()
            self.after(0, lambda: self._failed(e, tb))

    def _update_progress(self,i,total,address,counts,pct):
        self.bar["value"] = pct
        self.progress_label.config(text=f"{i:,}/{total:,} únicas · {pct:0.1f}% · {address[:70]}")
        if i == 1 or i % 25 == 0 or i == total:
            self.append(f"{i:,}/{total:,} | ALTA {counts.get('ALTA',0):,} | MEDIA {counts.get('MEDIA',0):,} | REVISAR {counts.get('REVISAR',0):,} | ERROR {counts.get('ERROR',0):,}")

    def _done(self,out,counts,errors):
        self.run_btn.config(state="normal")
        self.bar["value"] = 100
        self.status.config(text="Proceso terminado.")
        self.append("")
        self.append("TERMINADO: " + str(out))
        messagebox.showinfo(
            "Terminado",
            f"Archivo creado:\n{out}\n\n"
            f"ALTA: {counts.get('ALTA',0):,}\n"
            f"MEDIA: {counts.get('MEDIA',0):,}\n"
            f"REVISAR: {counts.get('REVISAR',0):,}\n"
            f"ERROR: {counts.get('ERROR',0):,}"
        )

    def _failed(self,e,tb):
        self.run_btn.config(state="normal")
        self.status.config(text="Proceso detenido por error.")
        self.append("ERROR:")
        self.append(str(e))
        self.append(tb)
        messagebox.showerror("Error", str(e))

    def open_output(self):
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        os.startfile(OUTPUT_DIR)

def main():
    App().mainloop()

if __name__ == "__main__":
    main()
