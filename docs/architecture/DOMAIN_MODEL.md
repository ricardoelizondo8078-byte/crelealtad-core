# DOMAIN MODEL

## Purpose

This document defines the conceptual domain model for CRELEALTAD CORE using the entities already present in the project documentation and the architectural decisions approved for the platform. It serves as a foundation for future implementation without introducing database design, API contracts, or business logic.

## Entity Overview

### Persona
- Purpose: Represent the master identity of an individual.
- Description: Persona is the foundational identity of a person and is not defined by the credit process itself.
- Relationships: A Persona may become a Solicitante when she participates in an Expediente. A Persona may also be related to documents and to operational users in different contexts.

### Solicitante
- Purpose: Represent the applicant role assumed by a Persona within an Expediente.
- Description: A Solicitante is a Persona participating in the documentation and evaluation flow of a credit request.
- Relationships: A Solicitante belongs to an Expediente and may be associated with one or more Documentos.

### Expediente
- Purpose: Represent the formal record of the credit process before disbursement and its historical record afterwards.
- Description: The Expediente documents the process leading to the credit operation and remains as historical record after disbursement. It is not the Credit itself.
- Relationships: An Expediente contains one or more Solicitantes, may have associated Documentos, and may lead to the creation of a Grupo and a Crédito.

### Grupo
- Purpose: Represent the solidarity group responsible for the Credit.
- Description: Grupo is the collective structure that represents the group behind the credit relationship.
- Relationships: A Grupo is associated with one or more Créditos and may have related Documentos and Ciclos.

### Crédito
- Purpose: Represent the credit obligation with its own lifecycle.
- Description: Crédito is the financial relationship that exists independently from the Expediente lifecycle.
- Relationships: A Crédito is associated with a Grupo and may have related Documentos, Pagos, and Desembolsos.

### Ciclo
- Purpose: Represent the commercial lifecycle of a Grupo.
- Description: Ciclo is the recurring commercial cycle associated with the operational life of a Grupo.
- Relationships: A Ciclo belongs to a Grupo and contributes to the operational context of the credit relationship.

### Desembolso
- Purpose: Represent the operational event where a Crédito is delivered.
- Description: Desembolso is the business event that marks the delivery of the Crédito.
- Relationships: A Desembolso is associated with a Crédito and is part of the lifecycle of the credit operation.

### Pago
- Purpose: Represent the payment events within the credit lifecycle.
- Description: Payments are part of the ongoing operational progress and repayment process.
- Relationships: A Pago is associated with a Crédito and contributes to the evolution of the credit status.

### Documento
- Purpose: Represent the supporting files and evidence associated with the domain.
- Description: Documento is a conceptual record of evidence or supporting material that may belong to different domain entities over time.
- Relationships: A Documento may belong to a Persona, Solicitante, Expediente, Grupo, or Crédito.

### Producto
- Purpose: Represent the financial product or offer available in the system.
- Description: Producto defines the offering context that influences the process and the operational rules applied to the credit lifecycle.
- Relationships: A Producto may be associated with Créditos, Expedientes, and configurable parameters.

### Usuario
- Purpose: Represent the operational user of the platform.
- Description: Usuario is the person who interacts with the system to manage or supervise the credit process.
- Relationships: A Usuario may be linked to roles, documents, and operational actions within the system.

### Rol
- Purpose: Represent the functional role assigned to a user.
- Description: Rol defines the operational responsibility and access context of a user within the platform.
- Relationships: A Rol is assigned to one or more Usuarios.

### Parámetro
- Purpose: Represent the configurable business and operational settings of the platform.
- Description: Parámetro allows the platform to adapt to operational rules without hardcoding them in the application.
- Relationships: A Parámetro influences products, documents, rules, and workflow behavior.

### Regla
- Purpose: Represent the business rules that govern process behavior.
- Description: Regla defines how the system evaluates, determines states, and supports automation across the platform.
- Relationships: A Regla is influenced by parameters and applies to the progression of expedientes, solicitantes, and documents.

## Conceptual Relationships Summary

- A Persona is the master identity of an individual.
- A Persona becomes a Solicitante when she participates in an Expediente.
- An Expediente documents the process before disbursement and remains as historical record after disbursement.
- A Grupo represents the solidarity group responsible for a Crédito.
- A Crédito has its own lifecycle independent from the Expediente.
- A Documento may belong to a Persona, Solicitante, Expediente, Grupo, or Crédito.
- A Ciclo represents the commercial lifecycle of a Grupo.
- A Desembolso represents the operational event where a Crédito is delivered.
- A Pago belongs to a Crédito.
- A Producto is related to the operational context of the credit process.
- A Usuario acts through one or more roles.
- Parameters influence rules, products, and process behavior.
