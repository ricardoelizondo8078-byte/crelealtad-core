import { buildHistoricalIndividualContract, HistoricalCycleInput } from './contract';

function cycle(overrides: Partial<HistoricalCycleInput> = {}): HistoricalCycleInput {
  return {
    id: 'ciclo-1', grupo_id: 'grupo-1', numero_ciclo: 3,
    numero_integrantes: 2, prestamo: '30000.00', key_count: 1, ...overrides,
  };
}

const groups = { 'GRUPO UNO': 'grupo-1' };
const people = { CURP1: 'persona-1', CURP2: 'persona-2' };
const validRows = [
  { GRUPO: ' Grupo Uno ', 'CICLO ': 3, CURP: 'curp1', ' MONTO  ': 10000 },
  { GRUPO: 'GRUPO UNO', 'CICLO ': 3, CURP: 'CURP2', ' MONTO  ': '$20,000.00' },
];

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const valid = buildHistoricalIndividualContract(validRows, groups, people, [cycle()]);
assert(valid.elegibles.length === 1, 'debe aceptar cobertura y suma exactas');
assert(valid.elegibles[0].integrantes[1].monto_autorizado === 20000, 'debe interpretar MONTO como autorizado');

const unresolved = buildHistoricalIndividualContract(validRows, groups, { CURP1: 'persona-1' }, [cycle()]);
assert(unresolved.rechazados[0].motivo === 'PERSONA_O_MONTO_NO_RESUELTO', 'debe rechazar personas no resueltas');

const duplicate = buildHistoricalIndividualContract([...validRows, validRows[0]], groups, people, [cycle({ numero_integrantes: 3, prestamo: 40000 })]);
assert(duplicate.rechazados[0].motivo === 'INTEGRANTE_DUPLICADA', 'debe rechazar integrantes duplicadas');

const mismatch = buildHistoricalIndividualContract(validRows, groups, people, [cycle({ prestamo: 31000 })]);
assert(mismatch.rechazados[0].motivo === 'SUMA_DIFERENTE', 'debe rechazar una suma distinta al préstamo');

const ambiguous = buildHistoricalIndividualContract(validRows, groups, people, [cycle({ key_count: 2 })]);
assert(ambiguous.rechazados[0].motivo === 'CICLO_AMBIGUO', 'debe rechazar claves de ciclo ambiguas');

console.log('Contrato histórico individual: 5 casos aprobados');
