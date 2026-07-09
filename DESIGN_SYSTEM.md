# CRELEALTAD CORE

# DESIGN_SYSTEM.md

Versión: 1.0

Estado: Aprobado

---

# Objetivo

Definir todos los componentes visuales reutilizables de la plataforma CRELEALTAD CORE.

Ninguna pantalla podrá crear componentes propios.

Toda pantalla deberá construirse reutilizando los componentes definidos en este documento.

---

# Filosofía

El usuario nunca debe sentir que cambia de aplicación al cambiar de módulo.

Documentación.

Verificación.

Cobranza.

Desembolsos.

Todos deberán parecer parte del mismo sistema.

---

# Sistema de diseño

El diseño deberá ser:

- Limpio
- Muy legible
- Alto contraste
- Poco texto
- Mucho espacio
- Botones grandes

---

# Colores oficiales

## Azul institucional

Principal de la plataforma.

HEX

#1B3668

---

## Vino institucional

Secundario.

HEX

#7B1F3A

---

## Verde

Listo para verificar

---

## Naranja

Con observaciones

---

## Amarillo

En verificación

---

## Azul

Listo para desembolso

---

## Gris

En documentación

---

# Tipografía

Fuente

Inter

Fallback

Roboto

Peso normal

400

Peso semibold

600

Peso bold

700

---

# Header

Componente DS-001

Siempre visible.

Siempre igual.

Contiene:

- Botón regresar
- Logo
- CRELEALTAD
- Usuario
- Avatar
- Semana
- Nombre del módulo

No utilizar menú hamburguesa.

---

# Buscador

Componente DS-002

Siempre debajo del Header.

Placeholder descriptivo.

Buscar por:

- Grupo
- Tesorera
- Solicitante
- Teléfono

No utilizar botón Buscar.

La búsqueda inicia al escribir.

---

# Chips

Componente DS-003

Horizontales.

Scroll lateral.

Uso:

Filtros rápidos.

Ejemplo

Todos

Observaciones

Documentación

Listos

---

# Tarjeta Expediente

Componente DS-004

Contiene:

Franja izquierda

Grupo

Tesorera

Producto

Tipo

Ciclo

KPIs

Estado

La tarjeta completa funciona como botón.

Nunca agregar botón Abrir.

---

# Franja lateral

Siempre izquierda.

Nunca cambia de posición.

Representa exclusivamente el estado.

Nunca otra información.

---

# KPIs

Componente DS-005

Utilizar cuatro indicadores.

Solicitantes

Completas

Pendientes

Retiradas

Mostrar número grande.

Texto pequeño.

---

# Card Solicitante

Componente DS-006

Contiene:

Nombre

Estado

Pendientes

Monto solicitado

Monto sugerido

Nunca mostrar información innecesaria.

---

# Card Documento

Componente DS-007

Contiene:

Tipo documento

Estado

Última actualización

Versión

Observaciones

---

# Badge Estado

Componente DS-008

Color y texto.

Nunca únicamente color.

---

# Botón principal

Componente DS-009

Ancho completo.

Esquinas redondeadas.

Texto centrado.

Una sola acción principal por pantalla.

---

# Botón secundario

Componente DS-010

Solo cuando exista una acción alternativa importante.

---

# Campos

Componente DS-011

Label superior.

Placeholder.

Validación inmediata.

Guardado automático.

---

# Selector de fotografías

Componente DS-012

Cada documento controla sus fotografías.

No existe un álbum general.

---

# Modal

Componente DS-013

Utilizar únicamente cuando sea indispensable.

Evitar interrumpir el flujo.

---

# Lista

Componente DS-014

Scroll vertical.

Separación amplia.

No saturar información.

---

# Estados

Los estados oficiales deberán reutilizar el mismo badge en toda la plataforma.

Nunca crear variantes.

---

# Espaciado

Utilizar una cuadrícula base de 8 px.

Todos los componentes deberán respetarla.

---

# Iconografía

Material Symbols Rounded.

Evitar mezclar librerías.

---

# Navegación

Máximo tres niveles.

No crear cadenas largas de pantallas.

---

# Animaciones

Rápidas.

Discretas.

Nunca decorativas.

Solo para indicar cambios de estado.

---

# Componentes oficiales

DS-001 Header

DS-002 Buscador

DS-003 Chips

DS-004 Card Expediente

DS-005 KPIs

DS-006 Card Solicitante

DS-007 Card Documento

DS-008 Badge Estado

DS-009 Botón Principal

DS-010 Botón Secundario

DS-011 Campo

DS-012 Selector Fotografías

DS-013 Modal

DS-014 Lista

---

# Regla de Oro

Si un nuevo diseño requiere crear un componente nuevo, primero deberá justificarse.

Siempre deberá intentarse reutilizar un componente existente.

El Design System tiene prioridad sobre las pantallas.