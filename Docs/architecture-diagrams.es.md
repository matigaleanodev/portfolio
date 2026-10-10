# Diagramas editoriales

Los diagramas Archify son contenido editorial estático. Los posts muestran vistas previas PNG enlazadas a visores HTML independientes; el proyecto Portfolio también enlaza su arquitectura. Angular y CI no necesitan una dependencia de Archify en ejecución.

## Fuentes y publicación

- `content/diagrams/<slug>.<tipo>.json`: especificación editable de arquitectura, flujo o estados.
- `content/diagrams/rendered/`: HTML validado y PNG, versionados junto con la fuente.
- `content/diagrams/manifest.json`: recibos SHA-256 de especificación, HTML y PNG, validación y evidencia de navegador.
- `.archify/`: salida local y recibos detallados, ignorados por Git.
- `public/diagrams/`: salida ignorada de `build:content`, copiada al build Angular.

El build selecciona los diagramas enlazados por proyectos visibles y posts habilitados, después de aplicar el calendario argentino y el filtro de borradores. Verifica todos los hashes seleccionados antes de publicar. Elimina HTML y vistas previas generados que ya no se usan, también al atrasar una fecha. Los diagramas futuros permanecen en el código fuente hasta que se habilita el primer post que los usa.

Al 9 de octubre de 2026, hay 18 diagramas para 18 posts (nueve publicados y nueve programados) y las tres tarjetas de proyectos. Se publican diez diagramas; los otros ocho esperan sus posts futuros. Algunos artículos comparten una vista general. Los posts que no necesitan un diagrama conservan su formato de texto. El antiguo Mermaid de observabilidad fue reemplazado por la vista previa Archify enlazada al visor; no quedan diagramas Mermaid en el contenido editorial.

## Mantenimiento

Revisar el artículo y el código antes de editar el JSON. Los diagramas históricos de despliegue describen sus artículos, no una auditoría de la infraestructura actual. La evidencia de repositorio debe identificar el commit inspeccionado; los ejemplos ilustrativos deben presentarse como tales.

Con Archify instalado localmente y Chromium disponible:

```bash
npm run build:diagrams -- /ruta/absoluta/a/archify/bin/archify.mjs <slug>
```

Sin slug se regeneran todos. Para fuentes de otro repositorio, pasar su checkout como tercer argumento (`<slug> /ruta/al/repositorio`), fijado al commit de `meta.repository`. Para regeneración conjunta, `.archify/repositories.json` puede mapear cada URL de repositorio a su ruta local; este archivo se ignora por Git. Si hace falta, definir `ARCHIFY_CHROME` con el ejecutable de Chromium. El comando ejecuta todos los controles showcase de finalize, copia el HTML validado, captura el SVG sin controles del visor, actualiza el manifiesto y sincroniza las referencias PNG existentes en Markdown. Revisar la vista previa y el visor en un navegador. Para una referencia nueva, usar el nombre del manifiesto:

```markdown
[![Título del diagrama](/diagrams/ejemplo.<hash>.png)](/diagrams/ejemplo.html)
```

Ejecutar `npm run build`, `npm run lint`, `npm test -- --watch=false` y los tests Playwright relevantes. Versionar juntos fuente, artefactos, manifiesto y Markdown. CI verifica hashes y copia los archivos; no ejecuta Archify.

## Verificación

Los 18 artefactos pasaron validación showcase de Archify (9/9), entrega, comprobación estricta de procedencia y controles en Chromium real. El campo `visualReview` del manifiesto registra la captura opcional de Archify, separada de la validación automática. La revisión local inspeccionó las vistas previas PNG; los dos diagramas iniciales de portfolio y observabilidad tuvieron además revisión de capturas claras y oscuras en dos tamaños de escritorio. Los recibos anteriores no aprueban ediciones futuras.

`e2e/architecture-diagrams.spec.ts` verifica rutas y vistas previas publicadas sin JavaScript, títulos en español, desborde en escritorio y móvil y errores del navegador. Las pruebas del pipeline cubren fechas, borradores, limpieza al atrasar publicaciones y alteración de especificaciones. Los fixtures aíslan las salidas para evitar que pruebas concurrentes escriban sobre el repositorio real.

Los visores conservan la atribución MIT de Archify en `content/diagrams/LICENSE.txt`, copiada al directorio publicado.

Versión en inglés: [Editorial diagrams](./architecture-diagrams.md).

La revisión de Modo Playa y Foodly Notes está registrada con commits y fuentes en [evidencia de arquitectura de productos](./product-architecture-evidence.es.md).
