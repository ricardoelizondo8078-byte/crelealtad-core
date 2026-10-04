import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { extraerHistoricoExcel } from './excel-historico';

const encabezado = ['#', 'SEM', '# GPO', 'CICLO', 'NOMBRE GRUPO', 'ASESOR', 'FECHA DE DESEMBOLSO', 'GRUPO VIGENTE', 'TOTAL DEL CREDITO', 'CREDITO PAGADO ACUM', 'SALDO X LIQUIDAR'];
const separador = [null, null];
const fila = (id: string, sem: number, vigente: number) => [id, sem, 10, 2, 'GRUPO DEMO', 'ANA_VAZ', new Date('2026-01-02T12:00:00Z'), vigente, 120000, 60000, 60000];
const directorio = fs.mkdtempSync(path.join(os.tmpdir(), 'crelealtad-historico-'));
const archivo = path.join(directorio, 'corte-prueba.xlsm');
const datos: unknown[][] = Array.from({ length: 10 }, () => []);
datos.push([...encabezado, ...separador, ...encabezado]);
datos.push([...fila('001', 1, 1), ...separador, ...fila('002', 2, 1)]);
datos.push([...fila('002', 2, 1)]);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(datos), 'BASE DE DATOS');
XLSX.writeFile(workbook, archivo);

const resultado = extraerHistoricoExcel(archivo);
assert.equal(resultado.semanas.length, 2);
assert.equal(resultado.ciclos.length, 1);
assert.equal(resultado.resumen_vigentes.size, 1);
assert.equal(resultado.ciclos[0].asesora_normalizada, 'ANA_VAZQUEZ');
assert.equal(resultado.ciclos[0].vigente_en_corte, true);
assert.equal(resultado.incidencias.filter((i) => i.nivel === 'ERROR').length, 0);
fs.rmSync(directorio, { recursive: true, force: true });
console.log('historico.spec.ts: OK');
