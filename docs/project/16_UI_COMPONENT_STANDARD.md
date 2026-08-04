# 16 UI COMPONENT STANDARD — CRELEALTAD CORE

Versión: 1.0.0  
Estado: VIGENTE — BASE OBLIGATORIA  
Ámbito: Aplicación móvil React Native / Expo  
Autoridad documental relacionada: `01_PROJECT_CONSTITUTION.md`, `13_DEVELOPMENT_STANDARDS.md`, `15_UI_UX_STANDARDS.md`

---

## 1. Propósito

Este documento define la base visual y técnica obligatoria para todas las pantallas y módulos de CRELEALTAD CORE.

Su objetivo es impedir que cada módulo construya su propia interfaz y garantizar que Documentación, Verificación, Autorización, Desembolso, Cobranza, Recolección y cualquier módulo futuro se perciban como partes continuas de una sola aplicación.

Ningún prompt de programación que modifique una pantalla podrá ejecutarse sin leer primero este documento y revisar los componentes existentes en:

- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/components/ui/`
- La pantalla de referencia indicada para el tipo de flujo que se vaya a construir.

---

## 2. Problema detectado en el código actual

La aplicación ya cuenta con componentes compartidos para encabezado, barra de título, botones, tarjetas, campos y selectores. Sin embargo, las pantallas todavía definen localmente una parte importante de su apariencia.

Se detectaron los siguientes riesgos:

1. Colores HEX escritos directamente dentro de pantallas y componentes.
2. Tamaños de letra, bordes, radios y espaciados definidos fuera de los tokens.
3. Tarjetas operativas creadas con estilos particulares en cada pantalla.
4. Badges de estado duplicados y con reglas visuales locales.
5. Varios patrones de scroll sin una clasificación oficial.
6. Botones y áreas presionables construidos directamente con `Pressable` o `TouchableOpacity`.
7. La selección múltiple todavía no cuenta con un componente oficial.
8. Las pantallas largas mezclan estructura, estilos, reglas de negocio y componentes locales.
9. El sistema de diseño escrito no define contratos técnicos suficientemente precisos.
10. No existe una plantilla obligatoria por tipo de pantalla.

Conclusión: el diseño actual tiene una buena base, pero todavía depende demasiado de que cada programador interprete las reglas. La continuidad visual debe quedar garantizada por componentes y contratos, no por memoria.

---

## 3. Jerarquía de autoridad visual

Ante cualquier contradicción se aplicará el siguiente orden:

1. Este documento.
2. `apps/mobile/src/theme/tokens.ts`.
3. Componentes publicados desde `apps/mobile/src/components/ui/index.ts`.
4. `docs/project/15_UI_UX_STANDARDS.md`.
5. `14_DESIGN_SYSTEM.md` y `15_UI_UX_STANDARDS.md`.
6. Pantallas existentes.
7. Bocetos, capturas o instrucciones anteriores.

Una pantalla existente no se considera norma si contradice este documento.

---

## 4. Regla principal

### Está prohibido crear una apariencia nueva dentro de una pantalla.

Las pantallas podrán definir únicamente estilos de composición estrictamente necesarios, por ejemplo:

- distribución `row` o `column`;
- crecimiento `flex`;
- alineación;
- separación entre bloques cuando el componente no la incluya;
- posición de elementos propios del contenido.

Las pantallas no podrán definir directamente:

- colores HEX, RGB o nombres de color;
- tamaños tipográficos;
- pesos tipográficos;
- radios de borde;
- sombras;
- alturas mínimas táctiles;
- estilos de botones;
- estilos de inputs;
- estilos de chips;
- estilos de badges;
- estilos de modal;
- estilos de tarjeta base;
- estilos del encabezado o barra de título.

Cuando una necesidad visual no exista en la biblioteca UI, primero deberá crearse o ampliarse un componente compartido. Nunca deberá resolverse únicamente dentro del módulo.

---

## 5. Tokens obligatorios

Todos los valores visuales deberán provenir de `apps/mobile/src/theme/tokens.ts`.

### 5.1 Familias mínimas de tokens

El archivo deberá contener, como mínimo:

- `colors`
- `moduleThemes`
- `statusColors`
- `typography`
- `spacing`
- `radius`
- `shadows`
- `touchTargets`
- `layout`
- `iconSizes`
- `zIndex`

### 5.2 Colores

Los colores se dividirán en tres categorías:

#### A. Colores neutrales

Uso: fondo, superficie, texto, bordes, estados deshabilitados.

#### B. Color del módulo

Uso exclusivo en:

- encabezado;
- barra de título;
- botón primario;
- acentos de navegación del módulo;
- encabezados pegajosos relacionados con el módulo.

El color de módulo no debe utilizarse para representar estados de negocio.

#### C. Colores de estado operativo

Uso exclusivo para estados. Deben definirse una sola vez en `statusColors`.

Estados iniciales:

- `documentation`: gris;
- `readyForVerification`: verde;
- `inVerification`: amarillo;
- `verificationObservations`: naranja;
- `readyForDisbursement`: azul;
- `withdrawn`: rojo o gris de cancelación, según decisión funcional aprobada;
- `completed`: verde de éxito, cuando no se confunda con “listo para verificar”.

La franja lateral y el badge de una misma entidad deben consumir exactamente el mismo token de estado.

### 5.3 Tipografía

No se escribirán tamaños numéricos en las pantallas.

Jerarquía mínima:

- `display`: números KPI destacados;
- `screenTitle`: título de pantalla;
- `cardTitle`: nombre principal de tarjeta;
- `sectionTitle`: título de sección;
- `body`: texto normal;
- `bodyStrong`: dato destacado;
- `label`: etiqueta de campo;
- `caption`: información secundaria;
- `button`: texto de acción;
- `badge`: estado o clasificación breve.

Para el usuario principal se priorizará legibilidad. El texto operativo nunca deberá depender de tamaños inferiores al token `caption`.

### 5.4 Espaciado

Toda separación deberá usar la escala oficial. No se permitirán valores arbitrarios salvo excepción documentada.

Escala recomendada:

- `xs = 4`
- `sm = 8`
- `md = 12`
- `lg = 16`
- `xl = 20`
- `xxl = 24`
- `xxxl = 32`

### 5.5 Área táctil

Todo control interactivo deberá tener un área mínima de 44 x 44 puntos. Para acciones principales se recomienda una altura mínima de 48 puntos.

---

## 6. Estructura obligatoria de pantalla

Toda pantalla de módulo deberá respetar esta secuencia vertical:

1. `ScreenContainer`
2. `AppHeader`
3. `ScreenTitleBar`
4. Contexto opcional fijo o sticky
5. Área de contenido
6. Acción principal fija o al final del contenido, según tipo de pantalla

Ejemplo conceptual:

```tsx
<ScreenContainer moduleTheme="documentation">
  <AppHeader
    moduleTheme="documentation"
    showBackButton
    onBackPress={onBack}
  />

  <ScreenTitleBar
    title="Título operativo"
    moduleTheme="documentation"
  />

  <ScreenBody scroll="form">
    {/* contenido con componentes UI oficiales */}
  </ScreenBody>
</ScreenContainer>
```

No se deberá reconstruir esta estructura manualmente.

---

## 7. Tipos oficiales de scroll

Cada pantalla deberá declarar explícitamente uno de los siguientes tipos.

### SCROLL-00 — Sin scroll

Uso:

- estados de carga;
- error de conexión;
- confirmación breve;
- pantallas con contenido que cabe completamente.

Regla: no usar `ScrollView`.

### SCROLL-01 — Scroll de formulario

Uso:

- captura de solicitante;
- captura de solicitud;
- edición de datos;
- formularios extensos.

Contrato:

- `keyboardShouldPersistTaps="handled"`;
- indicador vertical oculto salvo necesidad operativa;
- padding inferior suficiente para que el último campo y botón no queden tapados;
- navegación a errores permitida;
- encabezado principal fuera del scroll;
- encabezado de sección sticky permitido;
- no anidar otro scroll vertical.

### SCROLL-02 — Lista operativa

Uso:

- expedientes;
- grupos;
- solicitantes;
- resultados de búsqueda.

Contrato:

- preferir `FlatList` o `SectionList` sobre `ScrollView` cuando el listado pueda crecer;
- usar `keyExtractor` estable;
- estados de carga, vacío y error oficiales;
- filtros horizontales fuera de la lista o en `ListHeaderComponent`;
- actualización controlada mediante `refreshing` / `onRefresh` cuando aplique.

### SCROLL-03 — Secciones agrupadas

Uso:

- pendientes, completas y retiradas;
- documentos por categoría;
- tareas por estado.

Contrato:

- usar `SectionList` cuando las secciones sean dinámicas;
- mostrar primero pendientes;
- completas y retiradas colapsadas por defecto cuando así lo establezca UX;
- encabezados de sección uniformes.

### SCROLL-04 — Horizontal corto

Uso:

- chips de filtro;
- tabs operativas;
- rangos breves.

Contrato:

- sin rebote vertical;
- indicador horizontal oculto;
- no utilizar como sustituto de una lista de contenido;
- selección visible y accesible.

### SCROLL-05 — Visor de documento

Uso:

- imagen o documento ampliable;
- zoom, desplazamiento y revisión.

Debe vivir dentro de un componente oficial de visor, no dentro de cada pantalla documental.

---

## 8. Encabezados

### 8.1 `AppHeader`

Siempre visible y uniforme.

Contenido:

- botón regresar, cuando exista pantalla anterior;
- logo;
- marca CRELEALTAD;
- semana;
- avatar;
- nombre del usuario;
- rol.

Reglas:

- no usar menú hamburguesa;
- no colocar acciones de negocio dentro del encabezado;
- no cambiar altura, padding o tipografía por pantalla;
- el botón regresar debe usar icono oficial, no texto improvisado;
- los datos de usuario deben recibirse desde el contexto de sesión, no por valores predeterminados permanentes.

### 8.2 `ScreenTitleBar`

Muestra exclusivamente el nombre operativo de la pantalla.

Ejemplos:

- Mis expedientes
- Detalle de expediente
- Agregar solicitante
- Capturar solicitud
- Documentos

Reglas:

- una sola línea preferente;
- no incluir subtítulos largos;
- no incluir botones;
- capitalización consistente tipo oración, salvo nombre institucional aprobado.

### 8.3 Encabezado contextual

Para mostrar grupo, solicitante, ciclo o sección actual se utilizará un componente separado, por ejemplo `ContextHeader` o `StickySectionHeader`.

No se deberá modificar `ScreenTitleBar` para cada caso.

---

## 9. Botones y acciones

### 9.1 Tipos oficiales

- `PrimaryButton`: acción principal de avance o guardado.
- `SecondaryButton`: acción alternativa no destructiva.
- `DangerButton`: retirar, eliminar o cancelar de forma destructiva.
- `TextButton`: acción discreta y breve.
- `IconButton`: acción reconocible con icono y etiqueta accesible.
- `FloatingActionButton`: sólo cuando exista una decisión UX explícita.

### 9.2 Reglas

1. Máximo una acción primaria visible por región de pantalla.
2. El texto comienza con verbo operativo: “Agregar solicitante”, “Guardar cambios”, “Enviar a verificación”.
3. No usar `Pressable` o `TouchableOpacity` directamente para crear botones visuales.
4. Toda acción debe tener estado `disabled` y, cuando implique red, estado `loading`.
5. Un botón en carga no cambia de ancho ni de posición.
6. Acciones destructivas requieren confirmación cuando su efecto no sea reversible.
7. La tarjeta completa puede ser presionable; no agregar botón “Abrir”.
8. No usar color para distinguir acciones si el componente ya define su jerarquía.

### 9.3 Posición

- Formularios cortos: botón al final del contenido.
- Formularios largos: barra de acción inferior oficial cuando sea necesario.
- Listas: acción de alta en encabezado de contenido o componente oficial.
- Nunca colocar un botón flotando de forma local sin componente compartido.

---

## 10. Tarjetas

### 10.1 `Card` base

`Card` controla:

- fondo;
- radio;
- borde;
- sombra;
- padding base.

Las pantallas no deberán redefinir esas propiedades.

### 10.2 Variantes necesarias

La biblioteca deberá ofrecer variantes tipadas:

- `default`
- `compact`
- `outlined`
- `status`
- `interactive`
- `warning`
- `error`
- `success`

### 10.3 Tarjeta operativa

Toda tarjeta de expediente, solicitante, grupo o documento deberá construirse mediante un componente de dominio reutilizable, no directamente con `Card` más estilos locales.

Ejemplos propuestos:

- `ExpedienteCard`
- `SolicitanteCard`
- `DocumentoCard`
- `GroupCard`

Una tarjeta interactiva deberá incluir:

- rol accesible de botón;
- estado presionado;
- área táctil completa;
- jerarquía tipográfica oficial;
- indicador de estado oficial;
- contenido mínimo para decidir si debe abrirse.

---

## 11. Estados, badges y franjas laterales

Se crearán componentes oficiales:

- `StatusBadge`
- `StatusStripe`
- `StatusCard`

Todos recibirán una clave de estado, nunca un color directo.

Ejemplo:

```tsx
<StatusBadge status="readyForVerification" />
```

Prohibido:

```tsx
<View style={{ backgroundColor: '#10B981' }} />
```

Reglas:

- mismo estado = mismo color, texto y significado en toda la aplicación;
- la franja lateral siempre se ubica a la izquierda;
- un color de módulo no sustituye un estado;
- el color nunca será la única señal: deberá acompañarse de texto o icono.

---

## 12. Campos de formulario

### 12.1 Componentes mínimos

- `TextField`
- `PhoneField`
- `CurrencyField`
- `DateField`
- `SelectorField`
- `MultiSelectField`
- `YesNoField`
- `SearchField`
- `DocumentField`
- `ReadOnlyField`

Todos deberán integrar `FormField` internamente.

### 12.2 Contrato de campo

Cada campo deberá soportar:

- `label`;
- `value`;
- `required`;
- `helperText`;
- `errorText`;
- `disabled`;
- `readOnly`, cuando aplique;
- `onChange` o equivalente;
- identificador de accesibilidad;
- normalización y teclado apropiados.

### 12.3 Validación

- mostrar error debajo del campo;
- explicar qué falta y cómo corregirlo;
- no borrar el valor capturado;
- no utilizar alertas para validaciones ordinarias;
- al intentar continuar, enfocar o desplazar al primer error;
- distinguir entre error local, error de negocio y error de red.

---

## 13. Selección simple

`SelectorField` mantendrá dos presentaciones:

### Opciones cortas

Hasta siete opciones: chips o botones segmentados, siempre que todas sean legibles.

### Opciones largas

Más de siete opciones: modal o bottom sheet con lista.

Reglas:

- no cambiar automáticamente de comportamiento sin que el contrato quede documentado;
- la opción seleccionada debe ser evidente;
- debe existir estado vacío;
- cuando la lista sea extensa deberá admitir búsqueda;
- no cerrar un selector largo si la interacción requiere selección múltiple.

---

## 14. Selección múltiple

Se creará `MultiSelectField` como componente oficial.

### 14.1 Presentación

- 2 a 7 opciones breves: chips seleccionables con selección múltiple.
- Más de 7 opciones: bottom sheet con lista, checkbox, buscador opcional y botones “Cancelar” / “Aplicar”.

### 14.2 Contrato

```ts
interface MultiSelectFieldProps<T extends string> {
  label: string;
  values: readonly T[];
  options: readonly { value: T; label: string; disabled?: boolean }[];
  required?: boolean;
  helperText?: string;
  errorText?: string;
  minSelections?: number;
  maxSelections?: number;
  searchable?: boolean;
  onChange: (values: T[]) => void;
}
```

### 14.3 Reglas UX

- mostrar cantidad seleccionada;
- permitir desmarcar sin abandonar la pantalla;
- no aplicar cambios hasta presionar “Aplicar” en listas largas;
- explicar límites mínimos o máximos;
- no utilizar color como única señal de selección;
- conservar el orden definido por catálogo, no el orden de selección, salvo requisito funcional.

---

## 15. Búsqueda y filtros

### 15.1 Buscador

Componente oficial: `SearchField`.

Reglas:

- debajo del encabezado o dentro del encabezado de lista;
- búsqueda al escribir;
- debounce centralizado;
- botón para limpiar;
- placeholder operativo;
- sin botón adicional “Buscar”.

### 15.2 Chips de filtro

Componente oficial: `FilterChips`.

Reglas:

- scroll horizontal;
- la opción activa debe ser evidente;
- “Todos” será opción inicial cuando tenga sentido;
- los filtros no deben alterar los colores de estado;
- selección única o múltiple debe declararse en props.

---

## 16. Modales y bottom sheets

No se crearán modales visuales directamente dentro de las pantallas.

Componentes previstos:

- `AppModal`
- `ConfirmDialog`
- `BottomSheetSelector`
- `DocumentViewer`

Todo modal deberá incluir:

- título;
- mecanismo visible para cerrar;
- `onRequestClose`;
- foco y accesibilidad;
- acción primaria y secundaria claramente diferenciadas;
- altura máxima y scroll interno controlado;
- cierre por fondo sólo cuando no exista riesgo de pérdida de información.

---

## 17. Estados de pantalla

Toda pantalla que consulte información deberá implementar los cuatro estados oficiales:

1. `LoadingState`
2. `EmptyState`
3. `ErrorState`
4. `ContentState`

Opcional:

5. `OfflineState`
6. `SavingState`
7. `SuccessState`

No se deberán construir mensajes distintos en cada módulo.

Los mensajes deberán indicar:

- qué ocurrió;
- qué puede hacer el usuario;
- acción de reintento cuando aplique.

---

## 18. Formularios largos y autoguardado

Los formularios largos deberán:

- dividirse en secciones operativas;
- conservar el orden del formato físico aprobado;
- mostrar la sección actual mediante componente sticky;
- autoguardar sin interrumpir;
- mostrar un indicador unificado: “Guardando”, “Guardado” o “No se pudo guardar”;
- impedir solicitudes simultáneas descontroladas mediante debounce o cola;
- confirmar antes de salir cuando existan cambios no persistidos;
- desplazar al primer error cuando el usuario intenta finalizar.

El estado de autoguardado deberá extraerse a un componente `AutoSaveIndicator` y a un hook reutilizable.

---

## 19. Plantillas oficiales de pantalla

### TEMPLATE-A — Lista operativa

Usar para expedientes, grupos, tareas o solicitantes.

Incluye:

- AppHeader;
- ScreenTitleBar;
- SearchField opcional;
- FilterChips opcional;
- FlatList o SectionList;
- tarjeta de dominio;
- Loading / Empty / Error;
- acción de alta cuando aplique.

### TEMPLATE-B — Detalle de entidad

Incluye:

- AppHeader;
- ScreenTitleBar;
- ContextHeader;
- resumen de KPIs o estado;
- secciones de información;
- lista relacionada;
- acción principal;
- acciones secundarias.

### TEMPLATE-C — Formulario corto

Incluye:

- AppHeader;
- ScreenTitleBar;
- Scroll de formulario si es necesario;
- una Card de formulario;
- campos oficiales;
- botón primario;
- validación en línea.

### TEMPLATE-D — Formulario largo seccionado

Incluye:

- AppHeader;
- ScreenTitleBar;
- contexto de persona o expediente;
- AutoSaveIndicator;
- StickySectionHeader;
- ScrollView único;
- cards de sección;
- navegación opcional entre secciones;
- acción final.

### TEMPLATE-E — Gestión documental

Incluye:

- AppHeader;
- ScreenTitleBar;
- ContextHeader de solicitante;
- progreso documental;
- SectionList de documentos;
- DocumentoCard;
- DocumentViewer oficial;
- acciones capturar, reemplazar, ver y eliminar según permisos.

### TEMPLATE-F — Selección masiva

Incluye:

- AppHeader;
- ScreenTitleBar;
- instrucciones breves;
- buscador o filtros;
- lista con selección múltiple;
- contador seleccionado;
- acción fija “Continuar” o “Aplicar”.

---

## 20. Componentes prioritarios que faltan

Antes de seguir agregando módulos se recomienda implementar, en este orden:

1. `ScreenBody` o variantes de `ScreenContainer` para formalizar scroll.
2. `TextField` y campos especializados.
3. `StatusBadge`, `StatusStripe` y catálogo `statusColors`.
4. `InteractiveCard` y tarjetas de dominio.
5. `LoadingState`, `EmptyState`, `ErrorState`.
6. `SearchField` y `FilterChips`.
7. `MultiSelectField`.
8. `ContextHeader`.
9. `AutoSaveIndicator`.
10. `AppModal`, `ConfirmDialog` y `DocumentViewer`.
11. `BottomActionBar` para formularios largos o selección masiva.

---

## 21. Reglas de programación

Todo cambio UI deberá cumplir:

- importar tokens, nunca valores visuales directos;
- importar componentes desde `components/ui`;
- no duplicar componentes ya existentes;
- no definir un componente reutilizable dentro de una pantalla de feature;
- mantener negocio y presentación separados;
- extraer bloques de más de una responsabilidad;
- usar tipos estrictos para estados y variantes;
- no usar `any` en contratos de UI nuevos;
- no cambiar un componente compartido para resolver un caso particular sin evaluar regresiones;
- documentar cualquier nueva variante.

---

## 22. Criterios de aceptación visual

Una pantalla no estará terminada hasta comprobar:

### Estructura

- [ ] Usa `ScreenContainer`.
- [ ] Usa `AppHeader` y `ScreenTitleBar` oficiales.
- [ ] Declara un tipo de scroll oficial.
- [ ] No tiene scroll vertical anidado.

### Tokens

- [ ] No contiene colores directos.
- [ ] No contiene tamaños tipográficos directos.
- [ ] No contiene radios o sombras directos.
- [ ] No contiene alturas táctiles arbitrarias.

### Componentes

- [ ] No crea botones visuales con `Pressable` o `TouchableOpacity`.
- [ ] No crea inputs base directamente si existe componente UI.
- [ ] No crea badges o franjas de estado locales.
- [ ] No crea modales visuales locales.

### UX

- [ ] Tiene un objetivo principal.
- [ ] Muestra primero lo pendiente.
- [ ] Usa lenguaje operativo.
- [ ] Indica qué hacer cuando hay error.
- [ ] Es usable con una mano y en pantalla pequeña.

### Datos y estados

- [ ] Maneja carga.
- [ ] Maneja vacío.
- [ ] Maneja error.
- [ ] Maneja disabled/loading en acciones de red.
- [ ] Evita doble envío.

### Calidad

- [ ] TypeScript compila con `npx tsc --noEmit`.
- [ ] No introduce errores visibles en las pantallas de referencia.
- [ ] Toda nueva variante quedó documentada.

---

## 23. Instrucción obligatoria para prompts de programación

Todo prompt que modifique la aplicación móvil deberá comenzar con una instrucción equivalente a la siguiente:

> Antes de modificar código, lee `docs/project/16_UI_COMPONENT_STANDARD.md`, `apps/mobile/src/theme/tokens.ts` y los componentes exportados por `apps/mobile/src/components/ui/index.ts`. Identifica la plantilla oficial de pantalla correspondiente. Reutiliza los componentes existentes y no introduzcas colores, tipografías, radios, sombras, botones, inputs, badges, modales ni patrones de scroll locales. Si falta una capacidad reutilizable, impleméntala primero en la biblioteca UI, documenta su contrato y después úsala en la pantalla. Al finalizar ejecuta `npx tsc --noEmit` en `apps/mobile` y reporta los archivos modificados y la lista de verificación UI.

---

## 24. Formato de reporte que deberá devolver el programador

Cada intervención deberá terminar con:

1. Plantilla de pantalla utilizada.
2. Componentes reutilizados.
3. Componentes nuevos o ampliados.
4. Tokens nuevos o modificados.
5. Excepciones justificadas.
6. Validación TypeScript.
7. Checklist del apartado 22.
8. Riesgos o deuda pendiente.

---

## 25. Plan de adopción recomendado

### Fase 1 — Congelar desviaciones

- Aprobar este documento.
- Prohibir nuevos estilos visuales locales.
- Agregar la instrucción obligatoria a `19_CODEX_MASTER_PROMPT.md` y `18_CODEX_WORKFLOW.md`.

### Fase 2 — Completar la biblioteca UI

- implementar tokens faltantes;
- crear componentes prioritarios;
- agregar variantes tipadas;
- documentar ejemplos.

### Fase 3 — Migrar pantallas actuales

Orden sugerido:

1. `ExpedientesListScreen`
2. `ExpedienteDetailScreen`
3. `CreateGroupScreen`
4. `SolicitanteFormScreen`
5. `DocumentosScreen`
6. `SolicitudFormScreen`

### Fase 4 — Pruebas visuales

- capturas de referencia por plantilla;
- revisión en iPhone y Android de pantalla pequeña;
- prueba de texto largo;
- prueba de teclado;
- prueba de estados vacío, error y carga;
- prueba de accesibilidad táctil.

---

## 26. Decisión arquitectónica

La continuidad visual de CRELEALTAD CORE deberá residir en código reutilizable y contratos tipados.

Los documentos explican la norma. Los tokens y componentes la hacen obligatoria.

A partir de la aprobación de este estándar, ninguna pantalla nueva deberá copiar estilos de otra pantalla. Deberá construirse exclusivamente con la biblioteca UI y la plantilla oficial correspondiente.
