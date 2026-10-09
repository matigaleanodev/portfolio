# Renovación de diseño y accesibilidad

[English version](./design-accessibility-review.md)

Verificación local del 9 de octubre de 2026. Rama `feat/portfolio-design-accessibility`, desde `dev` (`6a69130`). Remoto confirmado: `https://github.com/matigaleanodev/portfolio.git`.

## Implementado

- Navegación: enlace de salto con URL de la ruta actual y foco real; accesos iniciales a proyectos/contacto; destinos con margen de scroll y navegación inmediata compatible con reduced motion.
- Accesibilidad: listas editoriales con marcadores y niveles; foco visible en campos, controles y superficies oscuras; fechas en español; errores de contacto más contrastados.
- Blog: cabecera compacta, suscripción después del listado, títulos completos con todo el ancho interior, dos columnas desde 960 px, búsqueda sin sensibilidad a acentos/mayúsculas/espacios y radios nativos para el orden exclusivo. El número de resultados usa una región de estado.
- Corrección funcional comprobada: el formulario de suscripción usaba `ngSubmit` sin `NgForm` ni `FormGroupDirective`. Ahora el submit nativo ejecuta la validación existente y evita navegación. Payload y endpoint conservados.
- Artículos: título de hasta 48 px, texto de 17 px/1,7, ancho real de párrafo de hasta 736 px, jerarquía H2–H4, código inline que puede partirse, tablas con scroll interno, figuras/captions y citas.
- Código: resaltado con `highlight.js` durante el build; lenguaje y control Copiar en el navegador, feedback accesible y alternativa cuando falla el portapapeles. Se mantiene el código como texto seleccionable y disponible sin JavaScript.
- Índice: desplegable para artículos de al menos 8 minutos y 4 encabezados H2/H3, con listas anidadas y destinos estables también en prerender. La directiva editorial aplica `DomSanitizer` y agrega únicamente IDs validados; no utiliza `bypassSecurityTrustHtml`.
- Proyectos: producto primero, publicación/estado y aporte propio, logos contenidos de 144 px en desktop y 112 px en mobile. Arquitectura y stack permanecen dentro de un `details` nativo disponible en el HTML. No se borró contenido ni se fijaron alturas de tarjeta.
- Sistema visual: escala compartida acotada de espacios y radios, títulos de sección consistentes y controles de footer más cómodos. Se conservaron la M, IBM Plex Sans, superficies claras/oscuras y acento violeta.
- Chat: diálogo no modal, launcher fuera del tab order mientras está oculto, foco inicial y de retorno, Escape, log de conversación, respuestas con mayor ancho en mobile, controles táctiles y scroll después del render final. Sin cambios de contratos, respuestas, fuentes IA/FAQ, endpoints ni lógica del backend.

## Medidas comparables

Chromium 156 en Ubuntu 26.04/WSL, DPR 1, zoom 100 %, mismos textos y viewport CSS. Baseline: servidor Angular local; resultado final: build de producción servido estáticamente. Los tamaños están redondeados a CSS px y no son asserts de píxeles.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Cabecera blog, 1366 × 768 | 705 | 478 |
| Inicio de primera tarjeta blog, 1366 × 768 | y = 858 | y = 608 |
| Altura primera tarjeta blog, 1366 × 768 | 437 | 331 |
| H1 listado, desktop | 60 | 44 |
| Primera tarjeta de proyecto, desktop | 613 | 506 |
| Logo de proyecto, desktop | 260 | 144 |
| Cabecera blog, 390 × 844 | 1118 | 549 |
| Inicio primera tarjeta blog, 390 × 844 | y = 1255 | y = 663 |
| Altura primera tarjeta blog, 390 × 844 | 493 | 470 |
| Primera tarjeta de proyecto, 390 × 844 | 1247 | 922 |
| Logo de proyecto, 390 × 844 | 308 | 112 |
| Párrafo Modo Playa, desktop | ancho 745; 16,8/31,92 px | ancho 736; 17/28,9 px |
| Párrafo Modo Playa, mobile | ancho 302; 16/30,4 px | ancho 358; 16/27,2 px |

La primera fila desktop entra en el rango orientativo de 300–360 px sin alturas impuestas. En mobile se conservan títulos, resúmenes y etiquetas completos, aunque algunas tarjetas siguen siendo largas. El nombre de la home conserva sus 60 px en desktop.

## Capturas revisadas

| Vista | Antes | Después |
| --- | --- | --- |
| Listado, 1366 × 768 | [Captura](./design-review/before-1366-blog-top.png) | [Captura](./design-review/after-1366-blog-top.png) |
| Listado, 390 × 844 | [Captura](./design-review/before-390-blog-top.png) | [Captura](./design-review/after-390-blog-top.png) |
| Tutorial con código, 390 × 844, scroll intermedio | [Captura](./design-review/before-390-desplegar-apis-docker-ec2-middle.png) | [Captura](./design-review/after-390-desplegar-apis-docker-ec2-middle.png) |

Las capturas intermedias usan la mitad del scroll del documento: al reducirse su altura, la posición exacta del texto en pantalla cambia. La comparación de ancho, tipografía y código mantiene el mismo viewport y contenido.

El conjunto local completo está en `.generated/design-review/`: 90 capturas antes y 90 después, JSON de medidas, hojas de contacto y estados simulados de contacto/chat/búsqueda. Las seis resoluciones se revisaron al inicio, a mitad de scroll y al final, en home, listado y tres artículos. Se inspeccionaron las hojas de contacto y capturas de tamaño completo de los casos relevantes. El recolector espera fuentes, imágenes y pintura después del scroll; permite reanudar una captura interrumpida por red.

## Matriz verificada

| Viewport CSS | Home | Listado | Modo Playa | Tutorial Docker | Artículo largo | Overflow global |
| --- | --- | --- | --- | --- | --- | --- |
| 2560 × 1440 | OK | OK | OK | OK | OK | No |
| 1920 × 1080 | OK | OK | OK | OK | OK | No |
| 1366 × 768 | OK | OK | OK | OK | OK | No |
| 768 × 1024 | OK | OK | OK | OK | OK | No |
| 390 × 844 | OK | OK | OK | OK | OK | No |
| 360 × 800 | OK | OK | OK | OK | OK | No |

También se verificó zoom real de Chromium mediante `chrome.tabs.setZoom`: ventana de 1366 px, layout de 683 px/DPR 2 al 200 % y de 341 px/DPR 4 al 400 %, en home/listado/tutorial, sin overflow global. No es una simulación de zoom con CSS. Evidencia local: `.generated/design-review/zoom/`.

## Checks y tests

Baseline: 83 tests/23 archivos, lint y build aprobados. Final: 87 tests/24 archivos, lint sin advertencias, typecheck y build aprobados; 14 rutas prerenderizadas. Persisten las advertencias CommonJS de dependencias de Mermaid observadas en el baseline.

```sh
npm ci
npm test -- --watch=false
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
PORTFOLIO_BASE_URL=http://127.0.0.1:4201 npm run test:e2e
PORTFOLIO_BASE_URL=http://127.0.0.1:4201 npm run review:design -- after
npm run review:zoom
```

Para las pruebas de producción se sirvió `dist/portfolio/browser` con `python3 -m http.server 4201 --bind 127.0.0.1 --directory dist/portfolio/browser`. Playwright/axe y highlight.js son dependencias de desarrollo; no se agrega un resaltador al bundle del cliente. Para Chromium en Linux: `npx playwright install --with-deps chromium` (la instalación de bibliotecas del sistema requiere permisos administrativos).

Los 13 escenarios E2E cubren las seis resoluciones, skip link conservando ruta y foco, recargas directas, navegación entre listado/artículos, orden/búsqueda/estado vacío, contacto/suscripción con mocks, chat con teclado y estados simulados, copiado y fallo del portapapeles, índice, contenido sin JavaScript, un diagrama real Mermaid, separación de texto y fixtures editoriales anchos/anidados. Los tests nuevos de Vitest cubren búsqueda normalizada, submit real del formulario, generación segura de estructura editorial y sanitización/IDs.

Axe no encontró violaciones aplicables en home, listado, Modo Playa, tutorial y panel de chat abierto bajo las etiquetas WCAG A/AA revisadas. Se verificó foco visible, reduced motion, hover de acciones principales, labels, errores asociados, marcadores y scroll interno. Esto no declara conformidad global WCAG. Los 11 HTML de artículos contienen el contenido y los IDs del índice sin depender de JavaScript.

Los requests de formularios y chat se interceptaron localmente: no se enviaron mails, suscripciones ni mensajes a producción. Los fixtures de tablas, listas anidadas, URLs largas, H4 con código inline, imagen/caption y código largo solo viven en los tests; no se publicó contenido artificial.

## Limitaciones y pendientes

- No hubo prueba real con lector de pantalla, Safari/iOS, dispositivos físicos ni teclado virtual móvil. Viewports de Chromium y axe no reemplazan esas verificaciones.
- Los envíos externos están simulados; la entrega real de correo y los servicios backend quedan fuera de esta revisión visual.
- No se modificaron `portfolio-api` ni `portfolio-cloud`; no se inventó coordinación con otro chat.
- El índice y el contenido funcionan sin JavaScript; Copiar requiere JavaScript y permiso del portapapeles. El texto permanece seleccionable si no están disponibles.
- No se agregaron datos de experiencia profesional ni capturas de apps que no estuvieran disponibles.

## Propuestas adicionales, sin implementar

| Propuesta | Problema y evidencia | Beneficio | Esfuerzo | Riesgo | Repo |
| --- | --- | --- | --- | --- | --- |
| Capturas auténticas para casos de proyecto | Los assets actuales muestran logos/diagrama, no pantallas reales de los productos | Permitir evaluar rápidamente la experiencia de uso | Medio: obtener/seleccionar capturas y adaptar el tratamiento de imagen | Revisar datos personales y vigencia; no fabricar pantallas | portfolio |
| Experiencia profesional breve | `home.page.html` presenta hero, proyectos y contacto, sin trayectoria laboral | Dar contexto de responsabilidades y continuidad al reclutador | Bajo, una vez confirmados fechas/roles/empresas | Precisión editorial: requiere datos del usuario | portfolio |

## Git

Los cambios están en commits pequeños por responsabilidad. No se hizo push, deploy ni merge a `dev`. La integración a una rama principal debe hacerse por squash para conservar un único commit de renovación en ese historial. El roadmap local se actualizó y permanece ignorado.
