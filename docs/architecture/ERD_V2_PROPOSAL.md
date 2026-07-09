# ERD V2 Proposal

## 1. Conceptual ERD

```text
Persona
  ──► Solicitante
  └──► Documento

Expediente
  ├──► Solicitante
  ├──► Documento
  └──► Grupo

Grupo
  ├──► GrupoMiembro
  ├──► Ciclo
  ├──► Crédito
  └──► Documento

Ciclo
  ├──► Expediente
  └──► Crédito

Crédito
  ├──► Pago
  ├──► Desembolso
  └──► Documento

Producto
  └──► Crédito

Usuario
  └──► Rol

Parámetro
  └──► Regla
```

## 2. Cardinalities

- Persona 1 : N Solicitante
- Expediente 1 : N Solicitante
- Expediente 1 : N Documento
- Expediente 1 : 0..1 Grupo
- Grupo 1 : N GrupoMiembro
- Grupo 1 : N Ciclo
- Grupo 1 : N Crédito
- Grupo 1 : N Documento
- Ciclo 1 : N Expediente
- Ciclo 1 : N Crédito
- Crédito 1 : N Pago
- Crédito 1 : N Desembolso
- Crédito 1 : N Documento
- Producto 1 : N Crédito
- Usuario N : M Rol
- Parámetro 1 : N Regla

## 3. Relationship explanations

### Persona ↔ Solicitante
A Persona may become a Solicitante when she participates in an Expediente. This relationship is modeled as one Persona to many Solicitantes because the same individual may appear in more than one application context over time.

### Expediente ↔ Solicitante
An Expediente can include many Solicitantes, and each Solicitante belongs to one Expediente. This is a classic one-to-many relationship because the applicant set is owned by the expediente context.

### Expediente ↔ Documento
An Expediente may have many Documentos, while each Documento may be associated with one Expediente. This keeps the record of evidence attached to the process history.

### Expediente ↔ Grupo
An Expediente may lead to one Grupo, while a Grupo is associated with one Expediente at the origin of the operation. This relationship captures the transition from the processing phase to the solidarity group structure.

### Persona ↔ Grupo (through GrupoMiembro)
A Grupo is composed of multiple Personas through a membership concept, and each Persona may belong to more than one Grupo over time. This is modeled as an N:M relationship using GrupoMiembro as the conceptual join concept.

### Grupo ↔ Ciclo
A Grupo may have multiple Ciclos during its commercial life, while each Ciclo belongs to one Grupo. This relationship reflects the recurring commercial lifecycle of the group.

### Ciclo ↔ Expediente
A Ciclo may be associated with one or more Expedientes, while an Expediente may be linked to one Ciclo in the operational context being reviewed. This relationship is proposed for review because it connects the group commercial cycle with the earlier process history.

### Ciclo ↔ Crédito
A Ciclo may relate to one or more Créditos, while a Crédito may be associated with one Ciclo. This reflects the operational connection between the commercial lifecycle of the group and the credit relationship.

### Crédito ↔ Pago
A Crédito may have many Pagos, while each Pago belongs to one Crédito. This is a standard one-to-many relationship that tracks the payment lifecycle of the credit.

### Crédito ↔ Desembolso
A Crédito may have many Desembolsos, while each Desembolso belongs to one Crédito. This relationship captures the operational event of delivering the credit over time.

### Crédito ↔ Documento
A Crédito may have many Documentos, while each Documento may belong to one Crédito. This keeps the evidence associated with the credit lifecycle attached to the credit entity.

### Documento ↔ Domain Entities
A Documento can belong to different domain entities such as Persona, Solicitante, Expediente, Grupo, or Crédito. This is a conceptual polymorphic ownership pattern and should be reviewed carefully before implementation.

### Producto ↔ Crédito
A Producto may be associated with many Créditos, while each Crédito may reference one Producto. This keeps the offering context linked to the credit relationship.

### Usuario ↔ Rol
A Usuario may have many Roles and a Role may be assigned to many Usuarios. This is modeled as an N:M relationship for access and responsibility management.

### Parámetro ↔ Regla
A Parámetro may govern many Reglas, while each Regla belongs to one Parámetro. This relationship supports configurable business behavior.
