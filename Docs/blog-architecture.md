# Blog Architecture

Status: approved baseline for the static-first migration.

## Goal

Move the portfolio frontend to a static-first model where editorial content is generated at build time and the backend keeps only server-side responsibilities.

## Scope

This document defines the local contract for:

- content source folders
- frontmatter for posts and projects
- generated JSON artifacts consumed by Angular
- current frontend to backend dependencies
- retirement criteria for `GET /projects`

## Current baseline

Updated on 2026-03-07 after phase 1:

- The Angular app is still a landing SPA composed directly in `src/app/app.ts`.
- `src/app/app.routes.ts` is still empty.
- The projects section now reads `/assets/projects.json` through a static content service.
- `content/projects/` already exists with the initial catalog migrated from the API payload.
- `POST /contact`, `GET /chat/starters`, and `POST /chat` remain valid backend responsibilities.
- `build:content` does not exist yet, so the generated JSON is still maintained manually during the transition.
- `angular.json` has no prerender configuration yet.

## System boundaries

### Frontend responsibilities

The frontend owns:

- landing content
- blog content
- project catalog content
- SEO metadata generated from editorial content
- prerendered blog routes

### Backend responsibilities

The backend in `D:\Documentos\Workspace\Projects\portfolio-api` keeps only:

- `POST /contact`
- `GET /chat/starters`
- `POST /chat`

The backend must not remain the source of truth for blog posts, projects, or any static editorial content.

## Content source structure

All editorial content lives outside `src/`.

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

Rules:

- One folder per post or project.
- `index.md` is the canonical source file.
- Asset names may vary, but the frontmatter must reference the public asset path used by the generated artifact.
- Folder name and frontmatter `slug` must match.

## Post frontmatter contract

Required fields:

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

Optional fields:

```yaml
---
updatedAt: 2026-03-08
canonicalUrl: https://matiasgaleano.dev/blog/angular-signals-in-practice
ogImage: /assets/blog/angular-signals/og.webp
draft: false
---
```

Validation rules:

- `title`, `slug`, `excerpt`, `date`, `tags`, and `coverImage` are mandatory.
- `slug` must be URL-safe and unique.
- `date` and `updatedAt` use `YYYY-MM-DD`.
- `tags` must contain at least one value.
- `draft: true` excludes the post from generated public manifests.

## Project frontmatter contract

Required fields:

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

Optional fields:

```yaml
---
status: completed
repository: https://github.com/example/repo
demo: https://example.com
---
```

Validation rules:

- `title`, `slug`, `excerpt`, `date`, `coverImage`, `stack`, `links`, `featured`, and `order` are mandatory.
- `links` must contain at least one entry.
- Every link needs `label` and `url`.
- `icon` is optional and can be used by the landing UI to preserve link affordances.
- `order` must be numeric and unique in the visible catalog.
- `featured` is required so the landing can render deterministic highlights.

## Generated artifact contracts

### `src/assets/blog/posts.json`

Purpose: index consumed by the blog listing and prerender discovery.

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

Rules:

- No HTML body in this file.
- Sorted descending by `date`.
- Excludes drafts.

### `src/assets/blog/posts/<slug>.json`

Purpose: detail payload consumed by `/blog/:slug`.

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

Rules:

- `contentHtml` is generated during the content build.
- HTML must already be sanitized before Angular consumes it.
- SEO defaults can be derived from frontmatter when optional values are missing.

### `src/assets/projects.json`

Purpose: static catalog consumed by the landing projects section.

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

Rules:

- This file contains structured metadata only.
- No Markdown parsing happens at runtime.
- No project detail HTML is generated until a real `/projects/:slug` route exists.

## Current frontend to backend dependency map

| Concern | Endpoint | Keep in backend | Notes |
| --- | --- | --- | --- |
| Contact form | `POST /contact` | Yes | Valid server-side responsibility. |
| Chat starters | `GET /chat/starters` | Yes | Used by the portfolio chatbot. |
| Chat reply | `POST /chat` | Yes | Used by the portfolio chatbot. |
| Projects catalog | `GET /projects` | No | Must move to static generated JSON. |

## Retirement criteria for `GET /projects`

`GET /projects` can be retired from the frontend when all of the following are true:

1. `content/projects/` exists with the full visible catalog.
2. The content pipeline generates `src/assets/projects.json` successfully.
3. The Angular projects section reads only the generated JSON.
4. Project order, highlight behavior, links, and images match the current public experience.
5. No component, service, or test in the frontend references `projectsResource` or `/projects`.

The backend endpoint may remain temporarily during transition, but it stops being part of the frontend contract as soon as those five conditions are met.

## Implementation sequence after phase 0

1. Create `content/projects/` and migrate the current catalog.
2. Replace `GET /projects` with generated `src/assets/projects.json`.
3. Add `build:content` and blog artifact generation.
4. Introduce Angular routes for `/`, `/blog`, and `/blog/:slug`.
5. Enable prerender and SEO artifacts.
