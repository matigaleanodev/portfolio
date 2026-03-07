# Arquitectura del blog

Estado: baseline aprobado para la migracion static-first.

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

Confirmado el 2026-03-07:

- La app Angular sigue siendo una landing SPA compuesta directamente en `src/app/app.ts`.
- `src/app/app.routes.ts` esta vacio.
- `ApiService` sigue llamando a `GET /projects` desde `https://api.matiasgaleano.dev/api`.
- `POST /contact`, `GET /chat/starters` y `POST /chat` siguen siendo responsabilidades validas del backend.
- Todavia no existe `content/` ni el script `build:content`.
- `angular.json` todavia no tiene configuracion de prerender.

## Limites del sistema

### Responsabilidades del frontend

El frontend es responsable de:

- contenido de la landing
- contenido del blog
- contenido del catalogo de proyectos
- metadata SEO generada desde contenido editorial
- rutas prerenderizadas del blog

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
  - label: GitHub
    url: https://github.com/example/repo
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
      { "label": "Live", "url": "https://example.com" },
      { "label": "GitHub", "url": "https://github.com/example/repo" }
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
