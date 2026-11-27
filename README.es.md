# Portfolio

[![CI](https://img.shields.io/github/actions/workflow/status/matigaleanodev/portfolio/ci.yml?style=flat-square&label=CI)](https://github.com/matigaleanodev/portfolio/actions/workflows/ci.yml)
![Versión](https://img.shields.io/badge/versi%C3%B3n-1.3.0-blue?style=flat-square)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-DD2C00?style=flat-square&logo=firebase&logoColor=white)

[Read in English](./README.md)

Aplicación pública del portfolio de Matias Galeano.

Este repositorio es dueño de la experiencia visual, el contenido editorial estático, el blog prerenderizado y el deploy en Firebase dentro del ecosistema del portfolio.

---

## Rol En El Ecosistema

- `portfolio`: frontend público, contenido editorial fuente, build estático, SEO y Firebase Hosting.
- `portfolio-api`: API pública mínima para contacto, chat y suscripciones.
- `portfolio-cloud`: automatización AWS para procesamiento de releases, notificaciones, generación de OG y publicación canónica del knowledge del chat.

---

## Stack

- Angular standalone
- Angular signals
- TailwindCSS
- Vitest
- Firebase Hosting
- Pipeline de contenido estático desde `content/`

---

## Funcionalidades Principales

- Landing principal y superficie pública del portfolio
- Blog técnico bajo `/blog`
- Rutas de posts prerenderizadas
- Contenido editorial estático generado desde Markdown
- Flujos frontend de contacto, chat, suscripción y baja
- Chat con hasta seis turnos previos (1500 caracteres por turno y JSON máximo de 15 KiB), sin bienvenida ni mensajes fallback en el historial enviado. Conserva el almacenamiento local existente; analytics envía longitud de sugerencias, no su texto. Publicar después de la API compatible con `history`.
- Handoff de `release-manifest` y knowledge del chat hacia `portfolio-cloud`

---

## Contenido Y Build

El frontend sigue una arquitectura static-first:

- el contenido editorial vive en `content/posts/` y `content/projects/`
- `npm run build:content` genera artifacts JSON y archivos SEO
- `npm run build` construye la app Angular y prerenderiza rutas estáticas
- Firebase sirve la salida estática final

Detalle operativo:

- [Flujo de deploy](./Docs/deploy-workflow.es.md)
- [Ownership y fronteras](./Docs/ecosystem-ownership.es.md)
- [Arquitectura del blog](./Docs/blog-architecture.es.md)
- [Publicación programada](./Docs/scheduled-publication.es.md)

---

## Rutas Principales

- `/`
- `/blog`
- `/blog/:slug`
- `/blog/unsubscribe`

---

## Desarrollo Local

```bash
npm install
npm run start
```

Comandos útiles:

- `npm run build:content`
- `npm run build`
- `npm run lint`
- `npm test`

---

## Version

Versión actual de la aplicación: **1.3.0**

## Revisión de diseño y accesibilidad


La guía de [diagramas editoriales](./Docs/architecture-diagrams.es.md) explica las fuentes Archify, su validación y la publicación por fecha.
