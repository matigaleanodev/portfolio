# Arquitectura del blog

Estado: aprobado e implementado hasta prerender + SEO.

## Objetivo

Mover el frontend del portfolio a un modelo static-first donde el contenido editorial se genera en build y el backend conserva solo responsabilidades que requieren ejecucion del lado servidor.

## Alcance

Este documento define el contrato local para:

- carpetas fuente de contenido
- frontmatter de posts y proyectos
- artifacts JSON generados que consume Angular
- dependencias actuales entre frontend y backend
- criterio de retiro de `GET /projects`

## Baseline actual

Actualizado el 2026-03-07 despues del cierre de la fase 4:

- La app Angular sigue siendo una landing SPA compuesta directamente en `src/app/app.ts`.
- `src/app/app.routes.ts` sigue vacio.
- La seccion de proyectos ahora lee `/assets/projects.json` mediante un servicio de contenido estatico.
- `content/projects/` ya existe con el catalogo inicial migrado desde el payload de la API.
- `content/posts/` ya existe y esta listo para recibir las primeras entradas del blog.
- `POST /contact`, `GET /chat/starters` y `POST /chat` siguen siendo responsabilidades validas del backend.
- `build:content` ya existe y genera artifacts JSON de proyectos y blog antes del build de Angular.
- `src/assets/blog/posts.json` se genera incluso cuando todavia no hay posts publicados.
- Angular ahora builda en `outputMode: static`.
- `/`, `/blog` y `/blog/:slug` se prerenderizan durante `ng build`.
- `rss.xml` y `sitemap-blog.xml` se generan desde `build:content` dentro de `public/`.
- La metadata SEO por ruta se configura desde Angular y queda presente en el HTML prerenderizado.
- Los artifacts JSON de blog y proyectos se leen directo desde archivo durante SSR/prerender, mientras que en browser se mantiene el consumo por `/assets/...`.

## Stack del pipeline de contenido

El pipeline actual de contenido se implementa con:

- `gray-matter` para parsear frontmatter
- `marked` para convertir Markdown a HTML
- `sanitize-html` para sanitizar el HTML antes de que Angular lo consuma

El punto de entrada del script es:

- `scripts/build-content.mjs`

## Limites del sistema

### Responsabilidades del frontend

El frontend es responsable de:

- contenido de la landing
- contenido del blog
- contenido del catalogo de proyectos
- metadata SEO generada desde contenido editorial
- rutas prerenderizadas del blog
- artifacts SEO estaticos (`rss.xml`, `sitemap-blog.xml`)

### Responsabilidades del backend

El backend en `D:\Documentos\Workspace\Projects\portfolio-api` conserva solo:

- `POST /contact`
- `GET /chat/starters`
- `POST /chat`

El backend no debe seguir siendo la fuente de verdad para posts del blog, proyectos ni otro contenido editorial estatico.

## Estructura fuente de contenido

Todo el contenido editorial vive fuera de `src/`.

```text
content/
  posts/
    <slug>/
      index.md
      cover.*
  projects/
    <slug>/
      index.md
      cover.*
```

Reglas:

- Una carpeta por post o proyecto.
- `index.md` es el archivo fuente canonico.
- Los nombres de assets pueden variar, pero el frontmatter debe referenciar la ruta publica que usara el artifact generado.
- El nombre de la carpeta y el `slug` del frontmatter deben coincidir.

## Contrato de frontmatter para posts

Campos obligatorios:

```yaml
---
title: Angular Signals in Practice
slug: angular-signals-in-practice
excerpt: Short summary used in cards and SEO descriptions.
date: 2026-03-07
tags:
  - angular
  - architecture
coverImage: /assets/blog/angular-signals/cover.webp
---
```

Campos opcionales:

```yaml
---
updatedAt: 2026-03-08
canonicalUrl: https://matiasgaleano.dev/blog/angular-signals-in-practice
ogImage: /assets/blog/angular-signals/og.webp
draft: false
---
```

Reglas de validacion:

- `title`, `slug`, `excerpt`, `date`, `tags` y `coverImage` son obligatorios.
- `slug` debe ser URL-safe y unico.
- `date` y `updatedAt` usan `YYYY-MM-DD`.
- `tags` debe tener al menos un valor.
- `draft: true` excluye el post de los manifests publicos generados.

## Contrato de frontmatter para proyectos

Campos obligatorios:

```yaml
---
title: Foodly Notes
slug: foodly-notes
excerpt: Notes and recipes platform with focus on clean UX.
date: 2025-11-15
coverImage: /assets/projects/foodly-notes/cover.webp
stack:
  - Angular
  - Firebase
links:
  - label: Live
    url: https://example.com
    icon: play
  - label: GitHub
    url: https://github.com/example/repo
    icon: code
featured: true
order: 1
---
```

Campos opcionales:

```yaml
---
status: completed
repository: https://github.com/example/repo
demo: https://example.com
---
```

Reglas de validacion:

- `title`, `slug`, `excerpt`, `date`, `coverImage`, `stack`, `links`, `featured` y `order` son obligatorios.
- `links` debe tener al menos una entrada.
- Cada link necesita `label` y `url`.
- `icon` es opcional y puede usarse para conservar las affordances visuales de la landing.
- `order` debe ser numerico y unico en el catalogo visible.
- `featured` es obligatorio para que la landing renderice destacados de forma determinista.

## Contratos de artifacts generados

### `src/assets/blog/posts.json`

Proposito: indice consumido por el listado del blog y por el descubrimiento de rutas a prerenderizar.

```json
[
  {
    "slug": "angular-signals-in-practice",
    "title": "Angular Signals in Practice",
    "excerpt": "Short summary used in cards and SEO descriptions.",
    "date": "2026-03-07",
    "updatedAt": "2026-03-08",
    "tags": ["angular", "architecture"],
    "coverImage": "/assets/blog/angular-signals/cover.webp",
    "readingTimeMinutes": 6
  }
]
```

Reglas:

- No incluye HTML.
- Se ordena por `date` descendente.
- Excluye drafts.

### `src/assets/blog/posts/<slug>.json`

Proposito: payload de detalle consumido por `/blog/:slug`.

```json
{
  "slug": "angular-signals-in-practice",
  "title": "Angular Signals in Practice",
  "excerpt": "Short summary used in cards and SEO descriptions.",
  "date": "2026-03-07",
  "updatedAt": "2026-03-08",
  "tags": ["angular", "architecture"],
  "coverImage": "/assets/blog/angular-signals/cover.webp",
  "readingTimeMinutes": 6,
  "contentHtml": "<h1>...</h1>",
  "seo": {
    "title": "Angular Signals in Practice | Matias Galeano",
    "description": "Short summary used in cards and SEO descriptions.",
    "canonicalUrl": "https://matiasgaleano.dev/blog/angular-signals-in-practice",
    "ogImage": "/assets/blog/angular-signals/og.webp"
  }
}
```

Reglas:

- `contentHtml` se genera durante el build de contenido.
- El HTML ya debe llegar sanitizado antes de que Angular lo consuma.
- Los defaults SEO pueden derivarse del frontmatter cuando falten valores opcionales.

### `src/assets/projects.json`

Proposito: catalogo estatico consumido por la seccion de proyectos de la landing.

```json
[
  {
    "slug": "foodly-notes",
    "title": "Foodly Notes",
    "excerpt": "Notes and recipes platform with focus on clean UX.",
    "date": "2025-11-15",
    "coverImage": "/assets/projects/foodly-notes/cover.webp",
    "stack": ["Angular", "Firebase"],
    "links": [
      { "label": "Live", "url": "https://example.com", "icon": "play" },
      { "label": "GitHub", "url": "https://github.com/example/repo", "icon": "code" }
    ],
    "featured": true,
    "order": 1
  }
]
```

Reglas:

- Este archivo contiene solo metadata estructurada.
- Angular no parsea Markdown en runtime.
- No se genera HTML de detalle de proyectos hasta que exista una ruta real `/projects/:slug`.

### `public/rss.xml`

Proposito: feed del blog generado durante `build:content` y copiado al output estatico.

Reglas:

- Incluye solo posts publicados.
- Usa las URLs canonicas del blog.
- Usa `date` como `pubDate`.

### `public/sitemap-blog.xml`

Proposito: sitemap del blog generado durante `build:content`.

Reglas:

- Incluye `/blog` y cada ruta publicada `/blog/<slug>`.
- Usa `updatedAt` cuando existe y, si no, `date`.

## Mapa actual de dependencias frontend a backend

| Concern | Endpoint | Se mantiene en backend | Notas |
| --- | --- | --- | --- |
| Contact form | `POST /contact` | Si | Responsabilidad valida del lado servidor. |
| Chat starters | `GET /chat/starters` | Si | Usado por el chatbot del portfolio. |
| Chat reply | `POST /chat` | Si | Usado por el chatbot del portfolio. |
| Projects catalog | `GET /projects` | No | Debe migrarse a JSON estatico generado. |

## Criterio de retiro de `GET /projects`

`GET /projects` puede retirarse del contrato del frontend cuando se cumplan todas estas condiciones:

1. Existe `content/projects/` con el catalogo visible completo.
2. El pipeline de contenido genera `src/assets/projects.json` sin errores.
3. La seccion de proyectos en Angular lee solo el JSON generado.
4. El orden, el comportamiento de destacados, los links y las imagenes igualan la experiencia publica actual.
5. Ningun componente, servicio o test del frontend referencia `projectsResource` ni `/projects`.

El endpoint del backend puede quedar temporalmente durante la transicion, pero deja de ser parte del contrato del frontend apenas se cumplan esas cinco condiciones.

## Secuencia de implementacion despues de la fase 0

1. Crear `content/projects/` y migrar el catalogo actual.
2. Reemplazar `GET /projects` por `src/assets/projects.json` generado.
3. Agregar `build:content` y la generacion de artifacts del blog.
4. Introducir rutas Angular para `/`, `/blog` y `/blog/:slug`.
5. Habilitar prerender y artifacts SEO.
6. Ajustar reglas de deploy en Firebase para el output prerenderizado.
