# Sistema de diseño: Índigo de taller

[English](DESIGN.md)

Revisión 1. Este repositorio es la fuente de las decisiones visuales del ecosistema; los demás repositorios adaptan una revisión numerada y no la redefinen. Todo cambio de token o de regla obligatoria incrementa la revisión. Los tokens en formato legible por herramientas están en el encabezado de [DESIGN.md](DESIGN.md).

Las reglas **DEBE** son criterios de aceptación. Las reglas **CONVIENE** son recomendaciones que admiten desvíos con motivo registrado. Los valores _derivados_ completan la paleta base y la identidad; ver Origen de los valores.

## Principios e identidad

Un portfolio profesional, técnico, sobrio y personal: el trabajo aparece temprano y el fondo pesa poco.

- DEBE conservar el monograma M, IBM Plex Sans e IBM Plex Mono, y la identidad índigo. Sin reemplazo azul ni segundo color de identidad.
- DEBE priorizar la evidencia (caso, figura, artículo); la decoración no compite con ella.
- DEBE tratar claro y oscuro como dos temas completos. El oscuro tiene lienzo, superficie y acento propios; nunca invertir ni filtrar colores.
- DEBE usar el acento para acciones, enlaces y el filete de identidad. No como adorno.
- NO DEBE usar superficies de vidrio, degradados decorativos, brillos ni sombras en reposo.
- CONVIENE escribir rótulos en minúscula con inicial mayúscula. IBM Plex Mono es para fechas, metadatos, identificadores y código, no para subtítulos.

## Color

| Token            | Claro   | Oscuro  | Origen   | Uso                                                |
| ---------------- | ------- | ------- | -------- | -------------------------------------------------- |
| `canvas`         | #F3F4F7 | #141A24 | aprobado | Fondo de página                                    |
| `surface`        | #FCFCFE | #1F2937 | aprobado | Tarjetas, paneles, campos                          |
| `text`           | #1F2937 | #EAECF2 | aprobado | Texto principal                                    |
| `text-muted`     | #4B5563 | #AEB7C9 | aprobado | Texto secundario, metadatos, placeholders          |
| `accent`         | #5B5F8F | #B7B8EE | aprobado | Enlaces, acción principal, filete de identidad     |
| `divider`        | #C8CCD7 | #394355 | aprobado | Separadores decorativos, bordes de tarjeta         |
| `on-accent`      | #FCFCFE | #141A24 | aprobado | Contenido sobre relleno de acento                  |
| `surface-sunken` | #E8EAF0 | #273244 | derivado | Código en línea, encabezado de tabla, hover neutro |
| `accent-hover`   | #4A4E7A | #CBCCF4 | derivado | Hover de rellenos y enlaces de acento              |
| `accent-active`  | #3C4065 | #A2A3E0 | derivado | Relleno de acento presionado                       |
| `accent-subtle`  | #E4E5F1 | #2E3152 | derivado | Fondo seleccionado y hover teñido                  |
| `control-border` | #6B7280 | #7F899E | derivado | Bordes que identifican un control                  |
| `focus`          | #5B5F8F | #B7B8EE | derivado | Anillo de foco                                     |
| `disabled-bg`    | #E3E5EB | #263041 | derivado | Fondo deshabilitado                                |
| `disabled-text`  | #596070 | #98A2B6 | derivado | Contenido deshabilitado                            |
| `danger`         | #9F1239 | #FDA4AF | derivado | Texto, borde e icono de error                      |
| `danger-subtle`  | #FBEAEE | #3A1F2A | derivado | Fondo de error                                     |
| `success`        | #166534 | #86EFAC | derivado | Texto, borde e icono de éxito                      |
| `success-subtle` | #E6F2EA | #17301F | derivado | Fondo de éxito                                     |
| `warning`        | #854D0E | #FCD34D | derivado | Texto, borde e icono de aviso                      |
| `warning-subtle` | #F8F0DC | #332A14 | derivado | Fondo de aviso                                     |
| `code-bg`        | #161C26 | #161C26 | derivado | Bloques de código en ambos temas                   |
| `code-text`      | #EAECF2 | #EAECF2 | derivado | Texto de código                                    |
| `code-muted`     | #AAB5C8 | #AAB5C8 | derivado | Comentarios y barra de código                      |
| `code-keyword`   | #C4B5FD | #C4B5FD | derivado | Sintaxis: palabra clave                            |
| `code-string`    | #A7F3D0 | #A7F3D0 | derivado | Sintaxis: cadena                                   |
| `code-number`    | #FCD34D | #FCD34D | derivado | Sintaxis: número, título                           |
| `code-border`    | #7F899E | #7F899E | derivado | Bordes de controles de código                      |
| `code-hover`     | #273244 | #273244 | derivado | Hover de control de código                         |
| `code-focus`     | #B7B8EE | #B7B8EE | derivado | Foco sobre fondo de código                         |

### Motivo de los valores derivados

- `surface-sunken`: Un escalón tonal sin sombra.
- `accent-hover`: Mismo tono; aumenta contraste.
- `accent-active`: Mismo tono; distinto de hover.
- `accent-subtle`: Tinte del índigo.
- `control-border`: El divisor aprobado no llega a 3:1.
- `focus`: Alias del acento.
- `disabled-bg`: Neutro sin acento.
- `disabled-text`: Se mantiene legible aunque AA lo exima.
- `danger`: Semántico; no es color de identidad.
- `danger-subtle`: Fondo del rol de error.
- `success`: Semántico.
- `success-subtle`: Fondo del rol de éxito.
- `warning`: Semántico.
- `warning-subtle`: Fondo del rol de aviso.
- `code-bg`: Superficie oscura de código en ambos temas.
- `code-text`: Texto oscuro aprobado.
- `code-muted`: Legibilidad sobre code-bg.
- `code-keyword`: Legibilidad sobre code-bg.
- `code-string`: Legibilidad sobre code-bg.
- `code-number`: Legibilidad sobre code-bg.
- `code-border`: Control sobre fondo de código.
- `code-hover`: Escalón tonal.
- `code-focus`: Acento oscuro aprobado.

- DEBE consumir tokens semánticos (`--color-<token>`); sin hex sueltos en estilos de componentes.
- DEBE cambiar de tema con `prefers-color-scheme`, declarar `color-scheme`, definir `theme-color` por tema y resolver el tema antes del primer pintado. Un selector manual de tema no forma parte de esta revisión.
- `divider` es decorativo (menos de 3:1). Un borde que identifica un campo, botón o casilla DEBE usar `control-border`.
- `scrim` para superposiciones modales: `rgb(15 20 28 / 0.56)` en ambos temas (derivado).

### Contraste verificado

Relaciones WCAG 2.x de los pares permitidos. Un par ausente en esta tabla DEBE medirse antes de usarse. El texto exige 4,5:1; bordes de control y foco, 3:1.

| Par                                 | Mínimo | Claro | Oscuro |
| ----------------------------------- | ------ | ----- | ------ |
| `text` / `canvas`                   | 4.5:1  | 13.35 | 14.78  |
| `text-muted` / `canvas`             | 4.5:1  | 6.87  | 8.66   |
| `accent` / `canvas`                 | 4.5:1  | 5.49  | 9.23   |
| `accent-hover` / `canvas`           | 4.5:1  | 7.17  | 11.21  |
| `control-border` / `canvas`         | 3:1    | 4.40  | 4.97   |
| `focus` / `canvas`                  | 3:1    | 5.49  | 9.23   |
| `text` / `surface`                  | 4.5:1  | 14.33 | 12.43  |
| `text-muted` / `surface`            | 4.5:1  | 7.38  | 7.28   |
| `accent` / `surface`                | 4.5:1  | 5.89  | 7.76   |
| `accent-hover` / `surface`          | 4.5:1  | 7.70  | 9.42   |
| `control-border` / `surface`        | 3:1    | 4.72  | 4.18   |
| `focus` / `surface`                 | 3:1    | 5.89  | 7.76   |
| `text` / `surface-sunken`           | 4.5:1  | 12.20 | 10.93  |
| `text-muted` / `surface-sunken`     | 4.5:1  | 6.28  | 6.41   |
| `accent` / `surface-sunken`         | 4.5:1  | 5.02  | 6.83   |
| `accent-hover` / `surface-sunken`   | 4.5:1  | 6.56  | 8.29   |
| `control-border` / `surface-sunken` | 3:1    | 4.02  | 3.67   |
| `focus` / `surface-sunken`          | 3:1    | 5.02  | 6.83   |
| `text` / `accent-subtle`            | 4.5:1  | 11.73 | 10.60  |
| `text-muted` / `accent-subtle`      | 4.5:1  | 6.04  | 6.21   |
| `accent` / `accent-subtle`          | 4.5:1  | 4.82  | 6.62   |
| `control-border` / `accent-subtle`  | 3:1    | 3.86  | 3.56   |
| `focus` / `accent-subtle`           | 3:1    | 4.82  | 6.62   |
| `on-accent` / `accent`              | 4.5:1  | 5.89  | 9.23   |
| `on-accent` / `accent-hover`        | 4.5:1  | 7.70  | 11.21  |
| `on-accent` / `accent-active`       | 4.5:1  | 9.70  | 7.36   |
| `danger` / `danger-subtle`          | 4.5:1  | 6.91  | 7.88   |
| `danger` / `canvas`                 | 4.5:1  | 7.29  | 9.23   |
| `danger` / `surface`                | 4.5:1  | 7.82  | 7.76   |
| `text` / `danger-subtle`            | 4.5:1  | 12.66 | 12.62  |
| `focus` / `danger-subtle`           | 3:1    | 5.21  | 7.88   |
| `success` / `success-subtle`        | 4.5:1  | 6.20  | 10.11  |
| `success` / `canvas`                | 4.5:1  | 6.48  | 12.43  |
| `success` / `surface`               | 4.5:1  | 6.96  | 10.45  |
| `text` / `success-subtle`           | 4.5:1  | 12.76 | 12.02  |
| `focus` / `success-subtle`          | 3:1    | 5.25  | 7.51   |
| `warning` / `warning-subtle`        | 4.5:1  | 6.03  | 9.83   |
| `warning` / `canvas`                | 4.5:1  | 6.23  | 12.11  |
| `warning` / `surface`               | 4.5:1  | 6.69  | 10.18  |
| `text` / `warning-subtle`           | 4.5:1  | 12.92 | 12.00  |
| `focus` / `warning-subtle`          | 3:1    | 5.32  | 7.49   |
| `code-text` / `code-bg`             | 4.5:1  | 14.48 | 14.48  |
| `code-text` / `code-hover`          | 4.5:1  | 10.93 | 10.93  |
| `code-muted` / `code-bg`            | 4.5:1  | 8.27  | 8.27   |
| `code-muted` / `code-hover`         | 4.5:1  | 6.24  | 6.24   |
| `code-keyword` / `code-bg`          | 4.5:1  | 9.26  | 9.26   |
| `code-keyword` / `code-hover`       | 4.5:1  | 7.00  | 7.00   |
| `code-string` / `code-bg`           | 4.5:1  | 13.33 | 13.33  |
| `code-string` / `code-hover`        | 4.5:1  | 10.07 | 10.07  |
| `code-number` / `code-bg`           | 4.5:1  | 11.86 | 11.86  |
| `code-number` / `code-hover`        | 4.5:1  | 8.96  | 8.96   |
| `code-border` / `code-bg`           | 3:1    | 4.86  | 4.86   |
| `code-focus` / `code-bg`            | 3:1    | 9.04  | 9.04   |
| `code-focus` / `code-hover`         | 3:1    | 6.83  | 6.83   |
| `accent-hover` / `accent-subtle`    | 4.5:1  | 6.30  | 8.04   |
| `accent` / `danger-subtle`          | 4.5:1  | 5.21  | 7.88   |
| `accent-hover` / `danger-subtle`    | 4.5:1  | 6.80  | 9.57   |
| `text-muted` / `danger-subtle`      | 4.5:1  | 6.52  | 7.39   |
| `danger` / `surface-sunken`         | 3:1    | 6.66  | 6.83   |

Informativos, sin exigencia AA (contenido deshabilitado y divisores decorativos):

| Par                             | Claro | Oscuro |
| ------------------------------- | ----- | ------ |
| `disabled-text` / `disabled-bg` | 5.00  | 5.17   |
| `disabled-text` / `canvas`      | 5.73  | 6.80   |
| `disabled-text` / `surface`     | 6.15  | 5.72   |
| `divider` / `canvas`            | 1.46  | 1.75   |
| `divider` / `surface`           | 1.57  | 1.47   |

## Tipografía

IBM Plex Sans (400, 500, 600) con respaldo `Segoe UI`, Arial; IBM Plex Mono (400, 500) con respaldo Consolas. Ambas usan la SIL Open Font License 1.1; los archivos de fuente redistribuidos DEBEN incluir el texto de la licencia.

| Rol           | Tamaño                 | Peso / interlineado / tracking |
| ------------- | ---------------------- | ------------------------------ |
| display       | 36–60px, fluid         | 600 / 1.05 / -0.03em           |
| page-title    | 32–48px                | 600 / 1.12 / -0.025em          |
| section-title | 28–36px                | 600 / 1.2 / -0.025em           |
| article-h2    | 24–32px                | 600 / 1.2 / -0.02em            |
| article-h3    | 20–24px                | 600 / 1.25 / -0.01em           |
| card-title    | 24–26px                | 600 / 1.2 / -0.02em            |
| article-h4    | 19px                   | 600 / 1.3 / 0                  |
| lead          | 18px                   | 400 / 1.65 / 0                 |
| reading       | 18px (17px bajo 640px) | 400 / 1.7 / 0                  |
| button-label  | 16px                   | 600 / 1.4 / 0                  |
| body          | 16px                   | 400 / 1.6 / 0                  |
| label         | 14px                   | 600 / 1.4 / 0                  |
| small         | 14px                   | 400 / 1.5 / 0                  |
| meta (Mono)   | 13px                   | 400 / 1.5 / 0                  |
| code (Mono)   | 14px                   | 400 / 1.6 / 0                  |

- Columna de texto del artículo: `max-width: 38rem`; 18px, 17px bajo 640px. Código, tablas y figuras PUEDEN ocupar hasta `46rem` sobre el mismo eje.
- DEBE verificarse la longitud efectiva de línea (65–75 caracteres como referencia, desde 640px) al implementar el artículo; cambiar columna o tamaño requiere aprobación.
- DEBE usar tamaños en rem, texto de 12px o más y soportar zoom 200 % y espaciado de texto del usuario sin recortes.
- DEBE mostrar títulos completos: sin truncado ni line clamp en la web. `overflow-wrap: anywhere` en títulos, URLs e identificadores.
- CONVIENE `text-wrap: balance` en encabezados.

## Espaciado, grillas y responsive

- Escala de espaciado: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80px. DEBE usar valores de la escala en separaciones y rellenos.
- Contenedores (`box-sizing: border-box`, centrados): página `72rem`, formulario `48rem`, texto de artículo `38rem`, artículo ancho `46rem`. Relleno lateral 24px; 16px en artículos bajo 640px. Los máximos incluyen el relleno, salvo en las columnas de artículo.
- Cortes: 640px y 960px (768px sólo para el panel de chat). Mobile first.
- Ritmo de secciones: 48px bajo 768px, 80px desde 768px. Dentro de un bloque: 8–16px; entre bloques: 24–32px.
- DEBE reacomodarse a 320px sin desplazamiento horizontal de página; sólo código, tablas y diagramas se desplazan, dentro de una región enfocable.
- El orden del DOM DEBE coincidir con el visual.
- Las vistas a pantalla completa CONVIENE que usen `dvh` y safe areas.

## Elevación

- Plano por defecto: la profundidad sale de `canvas` → `surface` → `surface-sunken` y bordes de 1px.
- Nivel 0: sin sombra (todo lo que está en el flujo, también en hover).
- Nivel 1 (sólo capas transitorias abiertas sobre el contenido: panel de chat y toast; el lanzador en reposo no lleva sombra): `0 12px 32px -12px rgb(15 20 28 / 0.35)` en claro, `0 12px 32px -12px rgb(0 0 0 / 0.6)` en oscuro, más borde `divider` de 1px (derivado).
- Apilado: contenido 0, lanzador 40, scrim 50, chat 60, toast 70, enlace de salto 1000.

## Bordes, radios, iconos e imágenes

- Radios: botones y campos 5px; bloques de código y figuras 12px; tarjetas 16px; etiquetas en píldora; las sugerencias y el lanzador del chat van en píldora, únicas excepciones aprobadas al radio de 5px en botones; filetes editoriales y panel destacado 0.
- Bordes: 1px. Filete de identidad: 3px sólido `accent`, sobre la presentación de la portada y en el borde inicial del panel del proyecto destacado; las citas del artículo también llevan borde inicial `accent` de 3px. No agregarlo en otros lugares.
- Iconos: Lucide, 16px en línea y 20px en botones de icono, trazo 2, `currentColor`; SVG de marca vigentes para perfiles externos. Iconos decorativos con `aria-hidden`; controles sólo con icono llevan nombre accesible. Sin emoji como icono.
- Monograma: el vector M vigente, un color (`text`), 40px de alto en el encabezado, junto al nombre. Sin recuadro, degradado, sombra ni recoloreo; área libre mínima de 8px.
- Imágenes: sólo material auténtico. La leyenda DEBE indicar si es una ilustración del producto o una captura de su interfaz; nunca fabricar pantallas. Logos y sellos con `object-fit: contain`; sin velos ni filtros. El alt describe el contenido; las decorativas usan alt vacío.
- Declarar `width` y `height` (o `aspect-ratio`) en cada imagen; carga diferida sólo debajo del primer encuadre.

## Componentes

### Botones: contrato obligatorio de siete estados

Toda variante de botón DEBE definir Default, Hover, Focus-visible, Active, Disabled, Loading y Selected. Un estado que no corresponde se marca **n/a** con su motivo. Una variante nueva o un cambio de aplicabilidad exige agregar su matriz completa en una nueva revisión. La cobertura completa es criterio de aceptación de todo cambio que toque botones y de la auditoría final de entrega.

#### Precedencia y combinaciones

El estado se resuelve por capas:

1. **Disponibilidad** (gana una): Disabled > Loading > Active > Hover > Default.
2. **Selección** (persistente, sólo conmutables): se combina con la capa de disponibilidad ganadora.
3. **Focus-visible**: se suma sobre ambas capas siempre que el control tenga foco de teclado; ningún estado puede ocultar ni reemplazar el anillo.

| Combinación               | Regla                                                                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disabled + Loading        | Par inválido. El control dueño de una petición en curso usa Loading (`aria-disabled`), nunca `disabled` nativo; los demás controles que esa petición inhabilita usan Disabled. Si la acción deja de estar disponible por otro motivo, se quita Loading y se muestra Disabled. |
| Disabled + Hover / Active | Sin cambios; no activa.                                                                                                                                                                                                                                                       |
| Disabled + Focus-visible  | `disabled` nativo no es enfocable. Si el control debe poder descubrirse, usar `aria-disabled="true"` con motivo descrito; muestra Disabled más el anillo.                                                                                                                     |
| Loading + Hover / Active  | Sin cambios; se ignoran activaciones repetidas.                                                                                                                                                                                                                               |
| Loading + Focus-visible   | Loading más anillo; el estado en sí no mueve el foco (una regla de flujo, como la del chat, puede hacerlo).                                                                                                                                                                   |
| Selected + Hover          | Fondo `accent-subtle`, borde `text` y rótulo subrayado; el check permanece en `accent`.                                                                                                                                                                                       |
| Selected + Active         | Colores de Selected más translateY(1px).                                                                                                                                                                                                                                      |
| Selected + Disabled       | Colores de Disabled; check y borde interior de 2px permanecen en `disabled-text`; se conserva `aria-pressed` o `checked`.                                                                                                                                                     |
| Selected + Loading        | n/a: la única variante seleccionable no tiene Loading.                                                                                                                                                                                                                        |
| Selected + Focus-visible  | Selected más anillo exterior; el anillo queda fuera del borde interior de 2px.                                                                                                                                                                                                |

#### Reglas comunes

- Semántica: las acciones son `<button type>`; navegar es `<a>` y no es una variante de botón aunque lo parezca (sigue las reglas de enlaces; un enlace con aspecto principal o secundario toma los colores de Default, Hover, Focus-visible y Active y no tiene Disabled, Loading ni Selected). Las elecciones excluyentes son radios nativos en un `fieldset`; los conmutadores independientes usan `aria-pressed`. `aria-expanded` es despliegue, no selección.
- Teclado de conmutables: un botón `aria-pressed` se activa con Enter o Espacio; un grupo de radios es una sola parada de Tab, las flechas mueven y seleccionan, Espacio selecciona. El grupo lleva `legend`; si el input se oculta visualmente, el anillo va sobre su segmento (`input:focus-visible + label`).
- Dimensiones estables: borde de 1px en toda variante y estado (transparente si no se ve); la selección usa sombra interior; spinner y check ocupan un espacio reservado de 16px. Sin cambios de peso ni tamaño entre estados.
- Loading: el spinner reemplaza al icono inicial en su espacio; el rótulo puede cambiar al texto de progreso (por ejemplo, “Enviando…”) con el ancho del rótulo más largo reservado, y el nombre accesible coincide con el rótulo visible. Progreso y resultado se escriben como texto (por ejemplo, “Enviando…”) en una región de estado `polite` fuera del botón, que existe antes de actualizarse y, en un modal, vive dentro del diálogo. Con movimiento reducido el spinner queda quieto y ese texto DEBE ser visible.
- Señales además del color: subrayado, o borde interior de 1px en variantes sólo con icono (hover), anillo (foco), desplazamiento de 1px (active), borde discontinuo (disabled), spinner y texto (loading), check y borde interior (selected). Con movimiento reducido, el desplazamiento de active se reemplaza por un borde interior de 3px en `currentColor` (4px en `accent` si además está seleccionado).
- Foco: anillo sólido de 3px, separación 4px (2px en barras de código), token `focus` (`code-focus` sobre código). Nunca `outline: none` sin este anillo.
- Transiciones: fondo, color y borde 150ms `cubic-bezier(0.2, 0, 0, 1)`; transform 100ms; el anillo aparece al instante.
- Tamaños: alto mínimo 48px en principal y secundario, 44px en el resto, 56px el lanzador; relleno horizontal 16–24px; separación 8px; rótulo con estilo `button-label`. Excepción, sólo icono: icono de 20×20px, borde de 1px y relleno de 11px por lado, para un total de 44×44px.
- Colores forzados: apoyarse en los colores del sistema. Las sombras desaparecen, así que los indicadores interiores de botones (hover, active, selected) DEBEN redibujarse con el borde de un pseudo-elemento interior en `ButtonText` o `Highlight`, sin cambiar dimensiones ni competir con el contorno de foco; disabled usa `GrayText`. Los campos no admiten pseudo-elementos: ver Campos.

#### Principal

Acción principal; como máximo una por grupo. Tamaño: 48px. Anillo de foco: `focus`. Transiciones: comunes.

| Estado        | Fondo           | Texto           | Borde           | Icono           | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                             |
| ------------- | --------------- | --------------- | --------------- | --------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Default       | `accent`        | `on-accent`     | `accent`        | `on-accent`     | #5B5F8F / #FCFCFE / #5B5F8F / #FCFCFE | #B7B8EE / #141A24 / #B7B8EE / #141A24 | Ejecuta su acción una vez. Anillo: se suma con foco.                                              |
| Hover         | `accent-hover`  | `on-accent`     | `accent-hover`  | `on-accent`     | #4A4E7A / #FCFCFE / #4A4E7A / #FCFCFE | #CBCCF4 / #141A24 / #CBCCF4 / #141A24 | Solo puntero; rótulo subrayado. Anillo: se suma con foco.                                         |
| Focus-visible | `accent`        | `on-accent`     | `accent`        | `on-accent`     | #5B5F8F / #FCFCFE / #5B5F8F / #FCFCFE | #B7B8EE / #141A24 / #B7B8EE / #141A24 | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                                |
| Active        | `accent-active` | `on-accent`     | `accent-active` | `on-accent`     | #3C4065 / #FCFCFE / #3C4065 / #FCFCFE | #A2A3E0 / #141A24 / #A2A3E0 / #141A24 | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco.        |
| Disabled      | `disabled-bg`   | `disabled-text` | `disabled-text` | `disabled-text` | #E3E5EB / #596070 / #596070 / #596070 | #263041 / #98A2B6 / #98A2B6 / #98A2B6 | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.          |
| Loading       | `accent`        | `on-accent`     | `accent`        | `on-accent`     | #5B5F8F / #FCFCFE / #5B5F8F / #FCFCFE | #B7B8EE / #141A24 / #B7B8EE / #141A24 | aria-disabled + aria-busy; conserva foco; ignora repeticiones; spinner. Anillo: se suma con foco. |
| Selected      | n/a             | n/a             | n/a             | n/a             | n/a                                   | n/a                                   | Acción momentánea; no conserva un valor persistente.                                              |

#### Secundario

Acción alternativa con menor peso. Tamaño: 48px. Anillo de foco: `focus`. Transiciones: comunes.

| Estado        | Fondo            | Texto           | Borde            | Icono           | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                             |
| ------------- | ---------------- | --------------- | ---------------- | --------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Default       | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Ejecuta su acción una vez. Anillo: se suma con foco.                                              |
| Hover         | `surface-sunken` | `text`          | `text`           | `text`          | #E8EAF0 / #1F2937 / #1F2937 / #1F2937 | #273244 / #EAECF2 / #EAECF2 / #EAECF2 | Solo puntero; rótulo subrayado. Anillo: se suma con foco.                                         |
| Focus-visible | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                                |
| Active        | `accent-subtle`  | `text`          | `accent`         | `text`          | #E4E5F1 / #1F2937 / #5B5F8F / #1F2937 | #2E3152 / #EAECF2 / #B7B8EE / #EAECF2 | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco.        |
| Disabled      | `disabled-bg`    | `disabled-text` | `disabled-text`  | `disabled-text` | #E3E5EB / #596070 / #596070 / #596070 | #263041 / #98A2B6 / #98A2B6 / #98A2B6 | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.          |
| Loading       | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | aria-disabled + aria-busy; conserva foco; ignora repeticiones; spinner. Anillo: se suma con foco. |
| Selected      | n/a              | n/a             | n/a              | n/a             | n/a                                   | n/a                                   | Acción momentánea; no conserva un valor persistente.                                              |

#### Texto

Acción de bajo énfasis con aspecto de texto (reintentar, volver arriba). Navegar es un enlace. Tamaño: 44px. Anillo de foco: `focus`. Transiciones: comunes. Subrayado en reposo; hover engrosa el subrayado a 2px.

| Estado        | Fondo            | Texto           | Borde           | Icono           | Claro fondo / texto / borde / icono | Oscuro fondo / texto / borde / icono | Comportamiento y foco                                                                             |
| ------------- | ---------------- | --------------- | --------------- | --------------- | ----------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Default       | —                | `accent`        | —               | `accent`        | — / #5B5F8F / — / #5B5F8F           | — / #B7B8EE / — / #B7B8EE            | Ejecuta su acción una vez. Anillo: se suma con foco.                                              |
| Hover         | `accent-subtle`  | `accent-hover`  | —               | `accent-hover`  | #E4E5F1 / #4A4E7A / — / #4A4E7A     | #2E3152 / #CBCCF4 / — / #CBCCF4      | Solo puntero; subrayado de 2px. Anillo: se suma con foco.                                         |
| Focus-visible | —                | `accent`        | —               | `accent`        | — / #5B5F8F / — / #5B5F8F           | — / #B7B8EE / — / #B7B8EE            | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                                |
| Active        | `surface-sunken` | `accent`        | —               | `accent`        | #E8EAF0 / #5B5F8F / — / #5B5F8F     | #273244 / #B7B8EE / — / #B7B8EE      | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco.        |
| Disabled      | —                | `disabled-text` | `disabled-text` | `disabled-text` | — / #596070 / #596070 / #596070     | — / #98A2B6 / #98A2B6 / #98A2B6      | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.          |
| Loading       | —                | `accent`        | —               | `accent`        | — / #5B5F8F / — / #5B5F8F           | — / #B7B8EE / — / #B7B8EE            | aria-disabled + aria-busy; conserva foco; ignora repeticiones; spinner. Anillo: se suma con foco. |
| Selected      | n/a              | n/a             | n/a             | n/a             | n/a                                 | n/a                                  | Acción momentánea; no conserva un valor persistente.                                              |

#### Solo icono

Acción compacta como cerrar el chat; exige nombre accesible. Tamaño: 44×44px. Anillo de foco: `focus`. Transiciones: comunes.

| Estado        | Fondo            | Texto           | Borde            | Icono           | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                      |
| ------------- | ---------------- | --------------- | ---------------- | --------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Default       | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Ejecuta su acción una vez. Anillo: se suma con foco.                                       |
| Hover         | `surface-sunken` | `text`          | `text`           | `text`          | #E8EAF0 / #1F2937 / #1F2937 / #1F2937 | #273244 / #EAECF2 / #EAECF2 / #EAECF2 | Solo puntero; borde interior de 1px en el color del icono. Anillo: se suma con foco.       |
| Focus-visible | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                         |
| Active        | `accent-subtle`  | `text`          | `accent`         | `text`          | #E4E5F1 / #1F2937 / #5B5F8F / #1F2937 | #2E3152 / #EAECF2 / #B7B8EE / #EAECF2 | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco. |
| Disabled      | `disabled-bg`    | `disabled-text` | `disabled-text`  | `disabled-text` | #E3E5EB / #596070 / #596070 / #596070 | #263041 / #98A2B6 / #98A2B6 / #98A2B6 | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.   |
| Loading       | n/a              | n/a             | n/a              | n/a             | n/a                                   | n/a                                   | Sus acciones se resuelven de forma síncrona (cerrar, abrir).                               |
| Selected      | n/a              | n/a             | n/a              | n/a             | n/a                                   | n/a                                   | Acción momentánea; no conserva un valor persistente.                                       |

#### Lanzador del chat

Botón flotante relleno que abre el chat. Tamaño: 56×56px. Anillo de foco: `focus`. Transiciones: comunes.

| Estado        | Fondo           | Texto       | Borde           | Icono       | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                      |
| ------------- | --------------- | ----------- | --------------- | ----------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Default       | `accent`        | `on-accent` | `accent`        | `on-accent` | #5B5F8F / #FCFCFE / #5B5F8F / #FCFCFE | #B7B8EE / #141A24 / #B7B8EE / #141A24 | Ejecuta su acción una vez. Anillo: se suma con foco.                                       |
| Hover         | `accent-hover`  | `on-accent` | `accent-hover`  | `on-accent` | #4A4E7A / #FCFCFE / #4A4E7A / #FCFCFE | #CBCCF4 / #141A24 / #CBCCF4 / #141A24 | Solo puntero; borde interior de 1px en el color del icono. Anillo: se suma con foco.       |
| Focus-visible | `accent`        | `on-accent` | `accent`        | `on-accent` | #5B5F8F / #FCFCFE / #5B5F8F / #FCFCFE | #B7B8EE / #141A24 / #B7B8EE / #141A24 | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                         |
| Active        | `accent-active` | `on-accent` | `accent-active` | `on-accent` | #3C4065 / #FCFCFE / #3C4065 / #FCFCFE | #A2A3E0 / #141A24 / #A2A3E0 / #141A24 | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco. |
| Disabled      | n/a             | n/a         | n/a             | n/a         | n/a                                   | n/a                                   | Siempre disponible; se oculta mientras el panel está abierto.                              |
| Loading       | n/a             | n/a         | n/a             | n/a         | n/a                                   | n/a                                   | El panel abre al instante; la carga ocurre dentro.                                         |
| Selected      | n/a             | n/a         | n/a             | n/a         | n/a                                   | n/a                                   | Acción momentánea; no conserva un valor persistente.                                       |

#### Sugerencia

Envía una pregunta sugerida del chat. Tamaño: 44px. Anillo de foco: `focus`. Transiciones: comunes.

| Estado        | Fondo            | Texto           | Borde            | Icono           | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                                                                                                                          |
| ------------- | ---------------- | --------------- | ---------------- | --------------- | ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Ejecuta su acción una vez. Anillo: se suma con foco.                                                                                                                                           |
| Hover         | `accent-subtle`  | `text`          | `accent`         | `text`          | #E4E5F1 / #1F2937 / #5B5F8F / #1F2937 | #2E3152 / #EAECF2 / #B7B8EE / #EAECF2 | Solo puntero; rótulo subrayado. Anillo: se suma con foco.                                                                                                                                      |
| Focus-visible | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                                                                                                                             |
| Active        | `surface-sunken` | `text`          | `accent`         | `text`          | #E8EAF0 / #1F2937 / #5B5F8F / #1F2937 | #273244 / #EAECF2 / #B7B8EE / #EAECF2 | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco.                                                                                                     |
| Disabled      | `disabled-bg`    | `disabled-text` | `disabled-text`  | `disabled-text` | #E3E5EB / #596070 / #596070 / #596070 | #263041 / #98A2B6 / #98A2B6 / #98A2B6 | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.                                                                                                       |
| Loading       | n/a              | n/a             | n/a              | n/a             | n/a                                   | n/a                                   | La activación entrega la petición al chat: el foco pasa al campo de mensaje, las sugerencias quedan en Disabled mientras la respuesta está pendiente y el progreso lo muestra la conversación. |
| Selected      | n/a              | n/a             | n/a              | n/a             | n/a                                   | n/a                                   | Acción momentánea; no conserva un valor persistente.                                                                                                                                           |

#### Opción conmutable / segmentada

Elección persistente: botón con aria-pressed o radio nativo en grupos excluyentes. Tamaño: 44px. Anillo de foco: `focus`. Transiciones: comunes.

| Estado        | Fondo            | Texto           | Borde            | Icono           | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                                                        |
| ------------- | ---------------- | --------------- | ---------------- | --------------- | ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Default       | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | No seleccionada; al activar selecciona (o conmuta). Anillo: se suma con foco.                                                |
| Hover         | `surface-sunken` | `text`          | `text`           | `text`          | #E8EAF0 / #1F2937 / #1F2937 / #1F2937 | #273244 / #EAECF2 / #EAECF2 / #EAECF2 | Solo puntero; rótulo subrayado. Anillo: se suma con foco.                                                                    |
| Focus-visible | `surface`        | `text`          | `control-border` | `text`          | #FCFCFE / #1F2937 / #6B7280 / #1F2937 | #1F2937 / #EAECF2 / #7F899E / #EAECF2 | Agrega el anillo al estado subyacente; no activa. Anillo: `focus`.                                                           |
| Active        | `accent-subtle`  | `text`          | `accent`         | `text`          | #E4E5F1 / #1F2937 / #5B5F8F / #1F2937 | #2E3152 / #EAECF2 / #B7B8EE / #EAECF2 | Presionado; translateY(1px). Teclas según la regla de teclado de conmutables. Anillo: se suma con foco.                      |
| Disabled      | `disabled-bg`    | `disabled-text` | `disabled-text`  | `disabled-text` | #E3E5EB / #596070 / #596070 / #596070 | #263041 / #98A2B6 / #98A2B6 / #98A2B6 | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.                                     |
| Loading       | n/a              | n/a             | n/a              | n/a             | n/a                                   | n/a                                   | La selección se aplica de forma síncrona en el cliente. Un conmutador asíncrono requiere aprobar antes esta fila.            |
| Selected      | `accent-subtle`  | `text`          | `accent`         | `accent`        | #E4E5F1 / #1F2937 / #5B5F8F / #5B5F8F | #2E3152 / #EAECF2 / #B7B8EE / #B7B8EE | Icono check en espacio reservado + borde interior de 2px en accent; aria-pressed="true" o checked. Anillo: se suma con foco. |

#### Acción de código

Botón Copiar en la barra oscura de código. Tamaño: 44px. Anillo de foco: `code-focus`. Transiciones: comunes.

| Estado        | Fondo        | Texto          | Borde          | Icono          | Claro fondo / texto / borde / icono   | Oscuro fondo / texto / borde / icono  | Comportamiento y foco                                                                      |
| ------------- | ------------ | -------------- | -------------- | -------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Default       | `code-bg`    | `code-text`    | `code-border`  | `code-text`    | #161C26 / #EAECF2 / #7F899E / #EAECF2 | #161C26 / #EAECF2 / #7F899E / #EAECF2 | Copia el bloque y anuncia el resultado. Anillo: se suma con foco.                          |
| Hover         | `code-hover` | `code-text`    | `code-text`    | `code-text`    | #273244 / #EAECF2 / #EAECF2 / #EAECF2 | #273244 / #EAECF2 / #EAECF2 / #EAECF2 | Solo puntero; rótulo subrayado. Anillo: se suma con foco.                                  |
| Focus-visible | `code-bg`    | `code-text`    | `code-border`  | `code-text`    | #161C26 / #EAECF2 / #7F899E / #EAECF2 | #161C26 / #EAECF2 / #7F899E / #EAECF2 | Agrega el anillo al estado subyacente; no activa. Anillo: `code-focus`.                    |
| Active        | `code-hover` | `code-keyword` | `code-keyword` | `code-keyword` | #273244 / #C4B5FD / #C4B5FD / #C4B5FD | #273244 / #C4B5FD / #C4B5FD / #C4B5FD | Presionado; translateY(1px). Activa al soltar / Enter / Espacio. Anillo: se suma con foco. |
| Disabled      | `code-bg`    | `code-muted`   | `code-border`  | `code-muted`   | #161C26 / #AAB5C8 / #7F899E / #AAB5C8 | #161C26 / #AAB5C8 / #7F899E / #AAB5C8 | disabled nativo; no activa; cursor not-allowed; borde discontinuo. Anillo: no enfocable.   |
| Loading       | n/a          | n/a            | n/a            | n/a            | n/a                                   | n/a                                   | Escribir en el portapapeles se resuelve de inmediato; se informa el resultado.             |
| Selected      | n/a          | n/a            | n/a            | n/a            | n/a                                   | n/a                                   | Acción momentánea; no conserva un valor persistente.                                       |

### Enlaces y navegación

- Enlaces: `accent`, subrayados en prosa y listas (separación 0,2em); hover `accent-hover` con subrayado de 2px; mismo anillo de foco; visitados sin cambio. Los enlaces externos que abren otra pestaña lo dicen en su nombre accesible.
- Encabezado: monograma y nombre a la izquierda, destinos vigentes a la derecha, sobre `canvas` con filete inferior `accent` de 1px. Página actual: `aria-current="page"`, mismo peso, subrayado de 2px. Enlaces de 44px de alto como mínimo.
- Enlace de salto primero en el orden de tabulación; los destinos reciben foco y tienen margen de scroll de 24px.
- Pie, apertura del listado y página de baja DEBEN seguir los tokens semánticos de cada tema, sin bandas invertidas ni degradados: pie sobre `surface` con borde superior `divider` de 1px; apertura del listado sobre `canvas`; contenido de baja en una tarjeta `surface` sobre `canvas`. Mismas reglas de foco y objetivos.

### Campos

| Estado                        | Tratamiento                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default                       | `surface`, borde `control-border` de 1px, `text`; rótulo visible arriba; alto mínimo 48px; texto de 16px o más.                                    |
| Hover                         | Borde `text-muted`.                                                                                                                                |
| Focus-visible                 | Borde `accent` más el anillo común.                                                                                                                |
| Disabled                      | Tokens de deshabilitado, borde discontinuo, `disabled` nativo.                                                                                     |
| Sólo lectura / enviando       | `surface-sunken`, `readonly`; conserva foco y valor.                                                                                               |
| Enviando: `select` y checkbox | `surface-sunken` en el campo o la fila, `aria-disabled="true"`; conservan foco y valor enviado.                                                    |
| Inválido                      | Borde `danger` más 1px interior, icono y mensaje debajo, `aria-invalid`, `aria-describedby`. Sólo para errores del campo, nunca de red o servidor. |

Precedencia en campos:

- Fondo: Disabled > Sólo lectura (`surface-sunken`) > Default (`surface`).
- Borde: Disabled > Inválido (`danger`) > Focus-visible (`accent`) > Sólo lectura o Default (`control-border`), con Hover (`text-muted`) sólo en campos editables.
- El anillo de foco se suma en todo estado enfocable, incluidos sólo lectura e inválido. Un campo de sólo lectura es enfocable, seleccionable y no tiene hover; PUEDE además ser inválido y conserva `aria-invalid` y su mensaje. Un campo deshabilitado no muestra estado inválido.
- `select` y checkbox no admiten `readonly`. Al enviar, primero DEBEN capturarse los valores y recién entonces bloquear. NO DEBEN usar `disabled` nativo (tampoco por `fieldset`) para este bloqueo, porque quita el foco.
- Bloqueados, siguen enfocables, con `aria-disabled="true"`, aspecto de Sólo lectura (borde sólido `control-border`, sin hover) y su valor o marca visibles; no reciben el tratamiento Disabled. En el checkbox se cancela `click` (incluye Space y clic en el rótulo). En el `select` se cancelan la apertura y las teclas que cambian la opción, sin interceptar Tab, Shift+Tab ni Escape; como algunos selectores nativos no pueden cancelarse, todo `input` o `change` DEBE restaurar el valor enviado antes de que llegue al estado del formulario. Lo visible DEBE coincidir siempre con lo enviado.
- El bloqueo no mueve el foco. Al responder se retira `aria-disabled`: ante un error de petición, el foco queda donde está y los valores se conservan; ante errores de campo, pasa al primer campo inválido; ante éxito, si el control enfocado deja de mostrarse, pasa a la confirmación en contexto (`tabindex="-1"`).
- Colores forzados: `input`, `textarea` y `select` no admiten pseudo-elementos y pierden la sombra interior. Un campo inválido DEBE usar un borde real sólido de 2px en `CanvasText` con el relleno reducido en 1px, para no cambiar dimensiones, más su icono y mensaje; el contorno de foco queda separado; disabled usa `GrayText`.

Los placeholders son ejemplos en `text-muted`, nunca el rótulo. Los contadores usan `meta`. Los botones de envío CONVIENE que permanezcan habilitados y validen al enviar.

### Tarjetas y etiquetas

- Tarjeta: `surface`, borde `divider` de 1px, radio 16px, relleno 24px, sin sombra.
- Una tarjeta totalmente clickeable tiene un solo enlace, que envuelve el título y se extiende a la tarjeta con un pseudo-elemento; “Leer post” es texto sin enlace. Hover cambia el borde a `accent` y subraya el título; el anillo rodea la tarjeta (`:has(a:focus-visible)`); sin elevación ni escala. Las tarjetas con enlaces secundarios, como las de proyectos, no son totalmente clickeables.
- Las etiquetas no son interactivas: píldora, borde `divider` de 1px, tamaño `meta` de 12–13px, `text-muted`.

### Chat

Esta revisión no fija la distribución del panel con poca altura ni la posición del lanzador: ambas DEBEN validarse con capturas y aprobarse antes de cambiar. Las reglas de foco siguientes rigen igual.

- Panel: `surface`, nivel 1, 400×575px desde 768px y pantalla completa debajo; encabezado con título y botón de icono para cerrar.
- Mensajes del asistente sobre `canvas` con borde `divider`; mensajes del usuario sobre `accent-subtle`; cada uno muestra su autor en texto. Sin sombras en las burbujas.
- Las sugerencias usan la variante de sugerencia; enviar usa la principal.
- Modal bajo 768px (`aria-modal`, foco contenido, fondo inerte); diálogo no modal arriba. Escape cierra y devuelve el foco al lanzador; el lanzador sale del orden de tabulación mientras está abierto.
- El panel es un `role="dialog"` nombrado con `aria-labelledby`. Al abrir, el foco va al campo de mensaje. Tras enviar desde el campo, el botón de envío o una sugerencia, el foco pasa al campo de mensaje; las sugerencias quedan en Disabled mientras la respuesta está pendiente y luego pueden reemplazarse. La lista de mensajes es un `role="log"` con nombre: cada mensaje que se agrega, del usuario o del asistente, se anuncia de forma `polite` sin releer el historial. El indicador de escritura se oculta a la tecnología de asistencia y el progreso se anuncia en una región `role="status"` aparte. Escape cierra el panel no modal sólo con el foco dentro. Cruzar 768px abierto actualiza `aria-modal` e `inert`.
- Si el foco pasa debajo del panel no modal, cerrar el panel o desplazar el elemento enfocado a la vista.
- El foco NUNCA DEBE quedar oculto por el panel o el lanzador. Con cualquier altura de pantalla, también con zoom 200 %, todos los controles DEBEN seguir alcanzables y operables por teclado y táctil, con el enfocado visible.
- Las sugerencias en carga usan marcadores de tamaño fijo; los errores ofrecen reintentar; las respuestas de respaldo conservan su etiqueta.

### Feedback, vacíos, errores y confirmaciones

| Caso                          | Regla                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Progreso                      | Texto en una región de estado `polite`; con espacio reservado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Éxito                         | Icono y texto `success` sobre `success-subtle`, en el lugar; decir qué pasó. Una acción repetida (ya suscripto o dado de baja) es éxito con mensaje propio.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Error de petición             | `danger` sobre `danger-subtle`, mensaje en español con causa y próximo paso; conservar valores; ofrecer reintento. Va en contexto, nunca como toast, y se anuncia a la tecnología de asistencia. Nunca texto técnico crudo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Vacío                         | Título, una oración y una salida (por ejemplo, limpiar la búsqueda).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Error de página / inexistente | Un H1 y un enlace visible de regreso.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Toast                         | Sólo confirmaciones de éxito; un error nunca es un toast. Visible 5s como mínimo, en pausa con hover o foco, con botón de icono con nombre para cerrar. Colores semánticos opacos, icono y texto, nivel 1; anunciado en un contenedor `role="status"` persistente (dentro del diálogo si hay un modal) sin mover el foco. Nunca cubre contenido enfocado. Una confirmación importante (resultado de un envío, suscripción, baja o contacto, o algo que la persona pueda necesitar revisar o continuar) DEBE además quedar disponible en contexto, como estado de Éxito, hasta que salga de la vista o inicie una acción nueva; el toast nunca es su único registro y el resultado se anuncia una sola vez. |

### Páginas: portada y proyectos

Orden: presentación y proyecto destacado, resto de los proyectos, contacto.

- El primer bloque va sobre `canvas` (sin banda invertida a sangre): filete de identidad, nombre (`display`, único H1), rol, presentación profesional y luego “Ver proyectos” (enlace principal) y “Contactarme” (enlace de texto).
- DEBE mostrar en la portada este texto, con Banco Comafi primero y Boreal IT como vínculo contractual: «Actualmente trabajo como desarrollador full stack en Banco Comafi, a través de Boreal IT, desarrollando soluciones para Fondos Comunes de Inversión.»
- Proyecto destacado: composición editorial de texto, imagen y leyenda. Panel `surface` con el borde de identidad; texto (rótulo, título, aporte propio, enlace) en una columna `1fr` y un `figure` con `figcaption` en una columna `0.58fr` desde 640px; debajo se apilan, texto primero. Desde 960px, presentación y panel forman dos columnas `1.1fr 0.88fr` con 40px de separación. Nombre, rol y comienzo del caso CONVIENE que se vean juntos a 390×844.
- El proyecto destacado NO DEBE repetirse en la lista. Se conservan todos los casos publicados y sus enlaces.
- Cada proyecto muestra, en este orden: tipo de producto, título, resumen, decisión principal, cómo se usa, aporte propio, enlace principal, enlaces secundarios, y arquitectura y tecnologías en un `details` nativo. Un caso sin imagen es válido.

### Páginas: listado del blog

- DEBE conservar las tarjetas de artículos. Sin índice editorial, listado cronológico ni composición con destacado.
- Orden de la tarjeta: fecha y tiempo de lectura, título (H2), resumen, etiquetas, “Leer post”. Mismo peso en todas; títulos y resúmenes completos.
- Una columna bajo 960px, dos desde 960px, separación de 24px; las tarjetas de una fila se estiran y alinean la última línea.
- Búsqueda y orden preceden a los resultados, con recuento anunciado de forma `polite`; cero, uno y varios resultados son estados diseñados. La suscripción va después del listado.

### Páginas: artículo

- Columna continua sobre `canvas`: enlace de regreso, fecha y tiempo de lectura (`meta`), título (H1), bajada (`lead`), etiquetas, divisor, índice y cuerpo. Sin banda de apertura invertida ni filete sobre el título.
- Índice: `details` nativo, sólo cuando el contenido lo justifica; sus enlaces llevan el foco al encabezado.
- Encabezados H2–H4 en orden; 32px arriba y 16px abajo; bloques separados por 16px, código y figuras por 24px.
- Código: `code-bg` en ambos temas, barra con lenguaje y Copiar, desplazamiento horizontal en región enfocable nombrada con `role="region"` y `aria-label`. El feedback de copia es icono y texto en `code-string` (éxito) o `code-text` (fallo), nunca los colores semánticos del tema claro. `code-focus` sólo se usa si el anillo se pinta dentro de `code-bg` (barra, o la región con separación negativa); un anillo pintado afuera usa `focus`.
- Código en línea sobre `surface-sunken`; tablas desplazables dentro de una región enfocable nombrada, con encabezado `surface-sunken` y celdas `control-border`; citas con borde `accent` de 3px.
- Diagramas y figuras llevan leyenda; DEBEN leerse en cada tema (se permite una placa clara para diagramas sin fuente oscura).

### Movimiento

- El movimiento responde a una acción: cambios de estado 150ms, entrada de panel y toast 200ms con opacidad y hasta 8px de desplazamiento. Curva `cubic-bezier(0.2, 0, 0, 1)`.
- NO DEBE animar en la carga inicial ni al hacer scroll, iniciar contenido con opacidad 0, ni usar blur, escala en hover o decoración en bucle. Sólo los indicadores de progreso se repiten.
- La transición de ruta vigente se mantiene en las navegaciones posteriores a la primera y nunca corre en la carga inicial.
- `prefers-reduced-motion: reduce`: sin transición de ruta, desplazamientos, scroll suave ni animaciones en bucle; los cambios son instantáneos y el progreso se comunica con texto.

### Accesibilidad

- DEBE cumplir WCAG 2.2 AA en ambos temas.
- Operación completa por teclado en orden lógico; un H1 por vista; landmarks; foco nunca tapado; foco gestionado tras diálogos, errores y confirmaciones.
- Objetivos: al menos 24×24px o una excepción WCAG válida (DEBE); 44×44px en controles táctiles (CONVIENE; las variantes de botón ya lo exigen).
- La información nunca depende sólo del color, del hover o del movimiento.
- Las comprobaciones automáticas no reemplazan la validación con lector de pantalla, zoom, navegadores y dispositivos.

### Prerender y estabilidad

- Contenido, títulos, enlaces y metadatos DEBEN estar en el HTML prerenderizado y leerse sin JavaScript; URLs y slugs no cambian.
- La hidratación DEBE conservar el DOM prerenderizado: sin estado de carga que lo reemplace y con el estado transferido.
- El CLS de laboratorio DEBE ser 0,10 o menos en la carga inicial. Los cambios de tema son sólo CSS y no mueven nada.
- Reservar espacio para imágenes, regiones asíncronas, sugerencias, feedback y barras de código. Lo agregado después de la carga no empuja lo que se está leyendo.
- Fuentes web con `font-display: swap`; CONVIENE usar respaldos con métricas ajustadas para reducir el salto tipográfico.

### Metadatos de vista previa social

- La imagen usa un único tema claro fijo.
- Este repositorio es dueño de los metadatos: `og:image` absoluta, `og:image:width` 1200, `og:image:height` 630, `og:image:alt` con el título del artículo y `twitter:card` `summary_large_image`, todo en el HTML prerenderizado.
- Las rutas sin imagen propia usan la imagen predeterminada vigente del sitio, con sus dimensiones y alt reales.

## Origen de los valores

| Grupo                                                                       | Origen y motivo                                                                                                                                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colores                                                                     | Por token en Color.                                                                                                                                                                                                           |
| Tipografías y monograma                                                     | Identidad aprobada.                                                                                                                                                                                                           |
| Tamaños, pesos, interlineados y tracking                                    | Derivados: una jerarquía fluida limitada a tres pesos. La columna de lectura (38rem) y sus tamaños (18px, 17px en móvil) están aprobados.                                                                                     |
| Espaciado, contenedores y cortes                                            | Derivados de la escala y los contenedores vigentes.                                                                                                                                                                           |
| Radios                                                                      | Aprobado: 5px en botones y campos, con sugerencias y lanzador del chat en píldora como excepciones explícitas. Derivado: tarjetas 16px y código 12px, por continuidad.                                                        |
| Composición de portada                                                      | Aprobado: dos columnas, filete, contacto como enlace, destacado con texto, imagen y leyenda, sin repetirlo en la lista.                                                                                                       |
| Superficies por tema y feedback                                             | Aprobado: pie, apertura del listado y baja con tokens del tema; toast sólo de éxito de 5s o más; confirmaciones importantes también en contexto; errores en contexto; sin sombras en reposo ni animaciones de carga o scroll. |
| Elevación, movimiento, estados de componentes, medidas de encabezado y chat | Derivados: accesibilidad, dimensiones estables y jerarquía plana.                                                                                                                                                             |

## Qué hacer y qué evitar

- **Hacer:** revisar cada cambio en ambos temas a 320, 390 y 1440px.
- **Hacer:** una acción principal por grupo y material real en las figuras.
- **Evitar:** reemplazar el índigo por azul, sumar colores de identidad o cambiar tipografías.
- **Evitar:** rearmar el listado del blog con algo que no sean tarjetas.
- **Evitar:** introducir un CMS, una API runtime de contenido o una dependencia nueva para aplicar este sistema.
