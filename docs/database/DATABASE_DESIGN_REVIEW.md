# Database Design Review v1

## 1. Complete ERD

```text
personas
  ├── usuarios
  └── documentos

expedientes
  ├── solicitantes
  ├── grupos
  └── documentos

solicitantes
  └── documentos

grupos
  ├── ciclos
  ├── creditos
  └── documentos

creditos
  ├── desembolsos
  ├── pagos
  ├── documentos
  └── productos

productos
  └── creditos

usuarios
  └── roles (through usuarios_roles)

parametros
  └── reglas
```

## 2. List of all tables

- personas
- usuarios
- roles
- usuarios_roles
- productos
- parametros
- reglas
- expedientes
- solicitantes
- grupos
- ciclos
- creditos
- desembolsos
- pagos
- documentos

## 3. Primary keys

| Table | Primary key |
|---|---|
| personas | id |
| usuarios | id |
| roles | id |
| usuarios_roles | (usuario_id, role_id) |
| productos | id |
| parametros | id |
| reglas | id |
| expedientes | id |
| solicitantes | id |
| grupos | id |
| ciclos | id |
| creditos | id |
| desembolsos | id |
| pagos | id |
| documentos | id |

## 4. Foreign keys

| Table | Foreign key | References |
|---|---|---|
| usuarios | persona_id | personas(id) |
| usuarios_roles | usuario_id | usuarios(id) |
| usuarios_roles | role_id | roles(id) |
| reglas | parametro_id | parametros(id) |
| solicitantes | persona_id | personas(id) |
| solicitantes | expediente_id | expedientes(id) |
| grupos | expediente_id | expedientes(id) |
| ciclos | grupo_id | grupos(id) |
| creditos | grupo_id | grupos(id) |
| creditos | producto_id | productos(id) |
| desembolsos | credito_id | creditos(id) |
| pagos | credito_id | creditos(id) |
| documentos | persona_id | personas(id) |
| documentos | solicitante_id | solicitantes(id) |
| documentos | expediente_id | expedientes(id) |
| documentos | grupo_id | grupos(id) |
| documentos | credito_id | creditos(id) |

## 5. Many-to-many relationships

| Relationship | Implementation |
|---|---|
| usuarios ↔ roles | usuarios_roles |

## 6. Naming conventions used

- Tables are lowercase, singular, and descriptive.
- Primary keys use the column name `id`.
- Foreign keys use the referenced table name plus `_id`.
- Associative tables use both participating entity names joined by an underscore.
- Audit columns use the convention `created_at`, `updated_at`, `created_by`, `updated_by`, and `deleted_at`.

## 7. Why each table exists

### personas
Represents the master identity of an individual.

### usuarios
Represents the operational user accounts that interact with the system.

### roles
Represents the functional roles that can be assigned to users.

### usuarios_roles
Represents the many-to-many association between users and roles.

### productos
Represents the catalog of financial products.

### parametros
Represents configurable platform parameters.

### reglas
Represents rules that depend on parameters and govern process behavior.

### expedientes
Represents the core record of the credit process before disbursement and its historical continuation.

### solicitantes
Represents the applicant role assumed by a persona within an expediente.

### grupos
Represents the solidarity group responsible for the credit relationship.

### ciclos
Represents the commercial lifecycle associated with a group.

### creditos
Represents the credit obligation with its own lifecycle.

### desembolsos
Represents the operational event of delivering a credit.

### pagos
Represents payment events within the credit lifecycle.

### documentos
Represents supporting evidence and documentation attached to different domain entities.

## 8. Explanation of associative tables

### usuarios_roles
This table exists to model the many-to-many relationship between users and roles. It allows a user to have multiple roles and a role to be assigned to multiple users without duplicating data in either parent table.

## 9. Assumptions made

- The schema is intentionally conceptual and implementation-ready, not business-logic-driven.
- UUIDs are used for identity and portability across services.
- Audit columns are present on every table to support basic traceability and soft-delete behavior.
- Document ownership is modeled through nullable foreign keys in the documentos table so the same document can be associated with different domain entities.
- The design assumes that a user may optionally be linked to a persona and that roles are assigned independently of the person identity.
- The schema is designed to be normalized at the first pass and can evolve as the domain model becomes more detailed.
