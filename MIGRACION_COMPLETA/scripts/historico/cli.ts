import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { extraerHistoricoExcel } from './excel-historico';
import { cargarBase, prevalidarBase } from './carga-db';

function argumento(nombre: string): string | undefined {
  const indice = process.argv.indexOf(nombre);
  return indice >= 0 ? process.argv[indice + 1] : undefined;
}

function ayuda(): never {
  console.error('Uso:\n  validar --excel <archivo.xlsm> [--salida <directorio>]\n  prevalidar-bd --artefactos <directorio> [--base <nombre>] [--crear-grupos] [--env <archivo>]\n  cargar --artefactos <directorio> --base <nombre> --aplicar [--crear-grupos] [--activar] [--env <archivo>]');
  process.exit(2);
}

function escribirJSON(ruta: string, valor: unknown): void {
  fs.writeFileSync(ruta, `${JSON.stringify(valor, null, 2)}\n`, 'utf8');
}

const hashJSON = (valor: unknown): string => crypto.createHash('sha256').update(JSON.stringify(valor)).digest('hex');

async function ejecutar(): Promise<void> {
  const comando = process.argv[2];
  const artefactos = argumento('--artefactos');
  const envPath = path.resolve(argumento('--env') || path.join(__dirname, '../../../apps/api/.env'));
  if (comando === 'prevalidar-bd') {
    if (!artefactos) ayuda();
    const resultado = await prevalidarBase(path.resolve(artefactos), envPath, argumento('--base'), process.argv.includes('--crear-grupos'));
    console.log(JSON.stringify(resultado, null, 2));
    if (resultado.errores.length) process.exitCode = 1;
    return;
  }
  if (comando === 'cargar') {
    const base = argumento('--base');
    if (!artefactos || !base || !process.argv.includes('--aplicar')) ayuda();
    const resultado = await cargarBase(path.resolve(artefactos), envPath, base, process.argv.includes('--activar'), process.argv.includes('--crear-grupos'));
    console.log(JSON.stringify(resultado, null, 2));
    return;
  }
  if (comando !== 'validar') ayuda();
  const excel = argumento('--excel');
  if (!excel) ayuda();
  const resultado = extraerHistoricoExcel(excel);
  const idCorte = resultado.archivo_sha256.slice(0, 12);
  const salida = path.resolve(argumento('--salida') || path.join(__dirname, '../../../runtime-data/migracion-historica', idCorte));
  fs.mkdirSync(salida, { recursive: true });
  const errores = resultado.incidencias.filter((item) => item.nivel === 'ERROR');
  const advertencias = resultado.incidencias.filter((item) => item.nivel === 'ADVERTENCIA');
  const manifest = {
    version_contrato: '1.0.0', generado_en: new Date().toISOString(), archivo_nombre: path.basename(resultado.archivo),
    archivo_sha256: resultado.archivo_sha256, hoja: resultado.hoja, fila_encabezado: resultado.fila_encabezado,
    estado: errores.length ? 'RECHAZADO' : 'VALIDADO',
    conteos: {
      filas_semanales: resultado.semanas.length, ciclos: resultado.ciclos.length,
      ciclos_vigentes: resultado.ciclos.filter((ciclo) => ciclo.vigente_en_corte).length,
      resumen_vigentes: resultado.resumen_vigentes.size,
      asesoras_origen: new Set(resultado.ciclos.map((ciclo) => ciclo.asesora_origen)).size,
      errores: errores.length, advertencias: advertencias.length,
    },
    reglas: {
      llave_ciclo: '# GPO + CICLO',
      vigente: 'Solo GRUPO VIGENTE = 1; no se infiere LIQUIDADO para los demás.',
      datos_personales_omitidos: ['NOMBRE CONTACTO', 'TEL. CONTACTO'],
    },
    artefactos_sha256: {
      ciclos: hashJSON(resultado.ciclos),
      semanas: hashJSON(resultado.semanas),
      incidencias: hashJSON(resultado.incidencias),
    },
  };
  escribirJSON(path.join(salida, 'manifest.json'), manifest);
  escribirJSON(path.join(salida, 'ciclos.json'), resultado.ciclos);
  escribirJSON(path.join(salida, 'semanas.json'), resultado.semanas);
  escribirJSON(path.join(salida, 'incidencias.json'), resultado.incidencias);
  console.log(JSON.stringify({ salida, ...manifest }, null, 2));
  if (errores.length) process.exitCode = 1;
}

ejecutar().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
