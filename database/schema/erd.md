# ERD (Conceptual)

## Core entities

- personas
- solicitantes
- expedientes
- grupos
- creditos
- ciclos
- desembolsos
- pagos
- documentos
- productos
- usuarios
- roles
- parametros
- reglas

## Relationships

- personas 1---0..1 usuarios
- personas 1---0..* solicitantes
- expedientes 1---0..* solicitantes
- expedientes 1---0..* documentos
- expedientes 1---0..1 grupos
- grupos 1---0..* creditos
- grupos 1---0..* ciclos
- creditos 1---0..* pagos
- creditos 1---0..* desembolsos
- creditos 1---0..* documentos
- grupos 1---0..* documentos
- solicitantes 1---0..* documentos
- personas 1---0..* documentos
- productos 1---0..* creditos
- parametros 1---0..* reglas
- usuarios 1---0..* roles
