# 14 DESIGN SYSTEM — CRELEALTAD CORE

Versión: 1.0.0  
Estado: Vigente  
Fecha: 2026-07-31

## Propósito

Define el lenguaje visual único de CRELEALTAD CORE. La implementación técnica obligatoria se encuentra en `apps/mobile/src/theme/tokens.ts` y `apps/mobile/src/components/ui/`.

## Principios

- Continuidad entre módulos.
- Claridad operativa por encima de decoración.
- Contraste y legibilidad para uso móvil en campo.
- Áreas táctiles amplias.
- Estados reconocibles sin depender únicamente del color.
- Variantes controladas, nunca estilos arbitrarios por pantalla.

## Fuente de verdad técnica

1. Tokens publicados en `tokens.ts`.
2. Componentes exportados desde `components/ui/index.ts`.
3. `16_UI_COMPONENT_STANDARD.md`.
4. Este documento.

## Familias de tokens obligatorias

- Colores neutrales y de superficie.
- Colores semánticos: éxito, advertencia, error, información y deshabilitado.
- Colores de estados operativos.
- Temas por módulo.
- Tipografía: familia, tamaños, pesos y alturas de línea.
- Espaciado.
- Radios.
- Elevación/sombras.
- Tamaños táctiles.
- Layout y anchos máximos.
- Iconografía.

## Reglas

- Ningún archivo de pantalla debe contener colores HEX/RGB directos.
- Ningún archivo de pantalla define estilos base de botón, input, tarjeta, badge, chip o modal.
- El color de módulo identifica contexto; no reemplaza estados semánticos.
- Todo estado debe incluir texto o icono además del color.
- Las nuevas variantes se agregan al componente compartido, con nombre semántico y documentación.

## Relación con documentos existentes

Las especificaciones detalladas de encabezados, botones, tarjetas, campos, selección, modales, scroll y estados están en `16_UI_COMPONENT_STANDARD.md`. Las reglas de composición por pantalla están en `17_SCREEN_TEMPLATES.md`.
