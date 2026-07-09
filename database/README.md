# Database Design v1

## Scope

This directory contains the first architectural draft of the PostgreSQL schema for CRELEALTAD CORE based on the approved conceptual domain model.

## Contents

- schema/erd.md: conceptual entity-relationship overview
- schema/init.sql: initial PostgreSQL DDL draft
- migrations/001_initial_schema.sql: migration file for the initial schema draft

## Notes

- The design is normalized and uses UUID primary keys.
- Audit fields are included on every table.
- No business logic, triggers, or stored procedures are included.
