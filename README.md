# CRELEALTAD CORE

## Proyecto

Sistema Integral para la Administración del Ciclo de Crédito de CRELEALTAD.

---

# Objetivo

Desarrollar una plataforma integral que administre el ciclo completo del crédito, desde la documentación inicial hasta la liquidación del crédito, respetando exactamente la operación real de CRELEALTAD.

El sistema NO debe obligar a CRELEALTAD a cambiar su forma de trabajar.

El sistema debe adaptarse a la operación existente.

---

# Filosofía del Proyecto

Este proyecto NO es un software genérico de microfinanzas.

Es una plataforma diseñada específicamente para CRELEALTAD.

Todas las decisiones técnicas deberán respetar la operación del negocio antes que cualquier decisión tecnológica.

---

# Principios

## 1.

La operación manda.

Nunca modificar la operación para facilitar la programación.

---

## 2.

El sistema determina automáticamente:

- Estado del expediente
- Estado de la solicitante
- Tipo de clienta
- Monto sugerido
- Requisitos pendientes

El usuario nunca seleccionará información que el sistema pueda deducir.

---

## 3.

Toda captura deberá guardarse automáticamente.

No existirán botones "Guardar".

---

## 4.

Toda política será configurable.

Nunca deberá quedar programada directamente.

Ejemplos:

- Integrantes mínimas
- Integrantes máximas
- Documentos obligatorios
- Referencias
- Fotografías
- Refinanciamiento
- Igualación
- Productos
- Montos

---

## 5.

Todo componente visual deberá reutilizarse.

No se crearán pantallas independientes.

Se construirá un Design System.

---

# Arquitectura propuesta

Frontend

- React Native
- Expo
- TypeScript

Backend

- NestJS
- TypeScript

Base de datos

- PostgreSQL

Almacenamiento documental

- Compatible con S3

Control de versiones

- Git
- GitHub

---

# Módulos

01 Login

02 Documentación

03 Verificación

04 Análisis

05 Desembolsos

06 Cobranza

07 Recolección

08 Mora

09 Convenios

10 Reportes

11 Parámetros

12 Administración

---

# Entidades principales

Persona

Solicitante

Expediente

Grupo

Crédito

Pago

Documento

Producto

Usuario

Rol

Parámetro

Regla

---

# Filosofía del Expediente

El expediente existe antes del desembolso.

Después del desembolso nacen:

- Grupo
- Crédito

El expediente permanece como historial.

Nunca se elimina.

---

# Filosofía de Documentación

Las asesoras NO documentan personas.

Administran expedientes.

Las integrantes entregan información en distintos días.

El sistema recuerda automáticamente qué falta.

---

# Filosofía de la Solicitante

Una solicitante nunca se marca como completa manualmente.

El sistema determina automáticamente cuándo cumple todos los requisitos.

---

# Motor Documental

Los documentos pertenecen a categorías.

Identidad

- INE

Domicilio

- Comprobante

Crédito

- Solicitud física
- Comprobante de línea externa

Evidencias

- Fotografía domicilio
- Fotografía negocio
- Fotografía integrante

Todos configurables mediante Parámetros.

Nunca programados directamente.

---

# Motor de Estados

Los usuarios NO cambian estados.

Los estados cambian mediante reglas automáticas.

Ejemplo

Pendientes = 0

↓

Listo para Verificación

---

# UX

La aplicación estará diseñada para:

- Uso con una sola mano
- Texto grande
- Alto contraste
- Pocas decisiones por pantalla
- Botones grandes
- Personas con poca experiencia tecnológica

---

# Design System

Todos los módulos reutilizarán los mismos componentes.

Ejemplos

Header

Buscador

Card Expediente

Card Solicitante

Card Documento

Badge Estado

Botones

Modales

Campos

KPIs

---

# Estado actual

Sprint 001

Módulo

Documentación

Pantallas diseñadas

UX-001 Inicio

UX-002 Mis Expedientes

UX-003 Expediente

UX-004 Lista de Solicitantes

UX-005 Ficha Solicitante

UX-006 Documentos

---

# Forma de trabajo

ChatGPT actuará como:

- Arquitecto del Sistema
- Arquitecto UX
- Arquitecto Funcional

Codex actuará como:

- Lead Software Engineer

Toda decisión funcional será tomada antes de programar.

Codex nunca deberá inventar reglas de negocio.

Cuando exista duda, deberá solicitar aclaración antes de implementar.

---

# Objetivo del código

El código deberá cumplir los siguientes principios:

- Modular
- Escalable
- Reutilizable
- Tipado
- Documentado
- Fácil de probar
- Fácil de mantener

No se aceptará código duplicado.

No se aceptarán reglas de negocio embebidas dentro de componentes visuales.

Toda regla deberá implementarse mediante servicios o motores configurables.

---

# Visión

CRELEALTAD CORE será una plataforma capaz de administrar todo el ciclo operativo del crédito mediante módulos independientes conectados por un único núcleo de negocio.

La plataforma deberá poder evolucionar durante muchos años sin necesidad de reescribir el sistema.
