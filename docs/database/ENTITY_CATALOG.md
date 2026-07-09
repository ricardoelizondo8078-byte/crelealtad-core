# ENTITY CATALOG

## Purpose

This document provides the official conceptual catalog of entities for CRELEALTAD CORE. It is intended to support future schema design and implementation planning without introducing fields, tables, relationships, APIs, or SQL.

## Entities

### Persona
- Category: Master
- Short description: Master identity of an individual in the platform.
- Owner module: Administración

### Solicitante
- Category: Transactional
- Short description: Applicant role assumed by a Persona within an Expediente.
- Owner module: Documentación

### Expediente
- Category: Transactional
- Short description: Main operational record of the credit process before disbursement and its historical record afterwards.
- Owner module: Documentación

### Grupo
- Category: Transactional
- Short description: Solidarity group responsible for the credit relationship.
- Owner module: Documentación

### Crédito
- Category: Transactional
- Short description: Credit obligation with its own lifecycle.
- Owner module: Desembolsos

### Ciclo
- Category: Transactional
- Short description: Commercial lifecycle associated with a Grupo.
- Owner module: Cobranza

### Desembolso
- Category: Transactional
- Short description: Operational event that marks the delivery of a Crédito.
- Owner module: Desembolsos

### Pago
- Category: Transactional
- Short description: Payment event within the credit lifecycle.
- Owner module: Cobranza

### Documento
- Category: Support
- Short description: Evidence or supporting file associated with different domain entities.
- Owner module: Documentación

### Producto
- Category: Catalog
- Short description: Financial product or offer available in the system.
- Owner module: Parámetros

### Usuario
- Category: Master
- Short description: Operational user of the platform.
- Owner module: Administración

### Rol
- Category: Catalog
- Short description: Functional role assigned to a user.
- Owner module: Administración

### Parámetro
- Category: Catalog
- Short description: Configurable business and operational setting of the platform.
- Owner module: Parámetros

### Regla
- Category: Support
- Short description: Business rule that governs process behavior and automation.
- Owner module: Parámetros
