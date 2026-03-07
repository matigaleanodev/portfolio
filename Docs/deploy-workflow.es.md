# Flujo de deploy del portfolio

Este documento define el flujo de deploy que ya puede ejecutarse dentro del repositorio `portfolio`, sin depender todavía de `portfolio-cloud`.

## Alcance actual

Este repositorio se encarga de:

- generar contenido editorial estático desde `content/`
- construir la aplicación Angular con rutas de blog prerenderizadas
- desplegar la salida estática en Firebase Hosting
- exportar un manifiesto de release consumible por una automatización futura

Este repositorio todavía no se encarga de:

- reglas de EventBridge
- ejecución de Lambdas
- notificaciones con SES
- jobs serverless post-publicación

Esas piezas quedarán para `portfolio-cloud`.

## Pipeline actual

El flujo actual de GitHub Actions es:

1. `npm ci`
2. `npm run build:content`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. `npm run build:release-manifest`
7. deploy de `dist/portfolio/browser` a Firebase Hosting

## Estrategia de Firebase Hosting

Firebase Hosting sirve `dist/portfolio/browser`.

Reglas principales:

- el HTML prerenderizado mantiene una política de cache sensible a cambios
- los assets XML no hasheados (`rss.xml`, `sitemap.xml`, `sitemap-blog.xml`) mantienen una política de cache sensible a cambios
- los índices JSON generados mantienen un cache corto
- el JS/CSS hasheado y las imágenes estáticas siguen siendo inmutables
- el rewrite global a `/index.html` queda solo como fallback del router cliente; los archivos prerenderizados siguen teniendo prioridad cuando existen

Esto permite desplegar páginas estáticas del blog sin reintroducir fetch dinámico de contenido contra el backend.

## Manifiesto de release

El pipeline ahora genera `.generated/release-manifest.json`.

Su objetivo es dejar un artefacto de handoff estable para una automatización futura con:

- SHA y ref de git
- metadatos del target de deploy
- slugs de posts del blog
- slugs de proyectos
- paths de archivos SEO

Hasta que exista `portfolio-cloud`, este manifiesto se sube solo como artifact del workflow.

## Handoff futuro hacia `portfolio-cloud`

Cuando la automatización serverless exista, el contrato esperado es:

- artefacto fuente: `.generated/release-manifest.json`
- punto de disparo: deploy exitoso sobre `main`
- responsabilidad del consumidor: decidir si hay posts nuevos y ejecutar automatizaciones post-publicación

De esta manera, el repositorio `portfolio` sigue enfocado en build y deploy estático, mientras `portfolio-cloud` concentra la ejecución orientada a eventos.
