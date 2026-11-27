# Flujo de deploy del portfolio

Este documento define el flujo de deploy que hoy se ejecuta desde el repositorio `portfolio`, incluyendo el handoff final hacia `portfolio-cloud` y la exportacion del artifact editorial usado por el resto del ecosistema.

El ownership final entre repositorios esta documentado en [Docs/ecosystem-ownership.es.md](./ecosystem-ownership.es.md).

## Alcance actual

El workflow también corre diariamente a las 09:17 Argentina y manualmente sobre `main`, con ejecuciones serializadas y posts futuros excluidos durante el build. La ejecución diaria omite Angular/Firebase si la marca pública coincide con el commit y los posts habilitados; los pasos de recuperación cloud siguen corriendo. Los pushes/ejecuciones manuales fuerzan el deploy. Ver [publicación programada](./scheduled-publication.es.md) para reglas editoriales, activación y recuperación.

Este repositorio se encarga de:

- generar contenido editorial estático desde `content/`
- construir la aplicación Angular con rutas de blog prerenderizadas
- desplegar la salida estática en Firebase Hosting
- exportar un manifiesto de release para `portfolio-cloud`
- exportar `.generated/chat/knowledge.json` como artifact editorial de handoff
- invocar `process-release` despues de un deploy exitoso en Firebase
- invocar `publish-chat-knowledge` despues de `process-release`

Este repositorio todavía no se encarga de:

- notificaciones con SES
- la orquestacion interna de `process-release`
- la persistencia de suscriptores o el envio de mails del blog

Esas piezas siguen siendo responsabilidad de `portfolio-cloud` y `portfolio-api`.

## Pipeline actual

El flujo actual de GitHub Actions es:

1. `npm ci` y `npm run build:content`
2. confirmar que la revisión es la cabeza de `main` y decidir si Firebase necesita un deploy
3. `npm run build:app` (build de Angular y `404.html`) y marca de publicación
4. `npm run build:release-manifest` y `npm run build:chat-knowledge-payload`
5. instalar la CLI de Firebase fijada en `tools/firebase-cli` y desplegar `dist/portfolio/browser`
6. invocación de `portfolio-cloud-<stage>-process-release` con `.generated/release-manifest.json`
7. invocación de `portfolio-cloud-<stage>-publish-chat-knowledge` con `.generated/chat/knowledge-payload.json`
8. subida del release manifest, del artifact de conocimiento editorial, del payload de invocación y de las respuestas de Lambdas como artifacts del workflow

La versión de `firebase-tools` es exacta y se resuelve con el lockfile de `tools/firebase-cli`, separado del de la aplicación. Para actualizarla se cambian la versión y el lockfile en un PR; el CI la usa como emulador de Hosting.

## Estrategia de Firebase Hosting

Firebase Hosting sirve `dist/portfolio/browser`.

Reglas principales:

- el HTML prerenderizado mantiene una política de cache sensible a cambios
- los assets XML no hasheados (`rss.xml`, `sitemap.xml`, `sitemap-blog.xml`) mantienen una política de cache sensible a cambios
- los índices JSON generados mantienen un cache corto
- el JS/CSS hasheado y las imágenes estáticas siguen siendo inmutables
- no hay rewrite global: cada ruta publicable tiene su HTML prerenderizado y el resto responde HTTP 404 con `404.html` (`noindex`, sin canónica). Una ruta nueva debe agregarse a `app.routes.server.ts` o Hosting la responderá como inexistente
- `404.html` sale de la ruta `404`, prerenderizada y movida por `scripts/build-not-found.mjs`
- el único rewrite sirve la confirmación de baja para el enlace con parámetro de matriz (`/blog/unsubscribe;email=`)
- `index.html` declara el feed RSS con `rel="alternate"` y `robots.txt` declara `sitemap.xml` y `sitemap-blog.xml`

Esto permite desplegar páginas estáticas del blog sin reintroducir fetch dinámico de contenido contra el backend.

## Handoff del conocimiento editorial

`build:content` tambien genera `.generated/chat/knowledge.json`.

Ese archivo sigue siendo un artifact versionado del build frontend, pero la integracion objetivo deja de ser una copia directa al filesystem del EC2.

La direccion acordada a partir de ahora es:

- `portfolio` exporta el artifact
- `portfolio-cloud` administrara la copia canonica en R2 mediante Lambdas dedicadas
- `portfolio-api` resolvera ese conocimiento de forma dinamica desde esa fuente cloud, con fallback o cache local cuando haga falta

El pipeline de deploy ahora tambien construye `.generated/chat/knowledge-payload.json` con:

- `artifact`: el artifact editorial crudo generado por `portfolio`
- `release`: `generatedAt` y `siteUrl` copiados desde `.generated/release-manifest.json`
- `source`: metadata de repositorio y path del artifact para el envelope cloud

`portfolio` sigue sin construir el envelope cloud final. Esa responsabilidad queda en `publish-chat-knowledge` dentro de `portfolio-cloud`.

## Manifiesto de release

El pipeline ahora genera `.generated/release-manifest.json`.

Su objetivo es dejar un artefacto de handoff estable para `portfolio-cloud` con:

- SHA y ref de git
- metadatos del target de deploy
- slug, título, fecha, ruta canónica y extracto (opcional para el consumidor) de cada post
- slugs de proyectos
- paths de archivos SEO

El workflow de deploy ahora invoca `process-release` directamente despues de un deploy exitoso en Firebase Hosting.

Contrato actual:

- artefacto fuente: `.generated/release-manifest.json`
- punto de disparo: deploy exitoso sobre `main`
- modo de invocacion: `aws lambda invoke` privado
- funcion objetivo: `portfolio-cloud-<stage>-process-release`
- responsabilidad del consumidor: decidir si hay posts nuevos y ejecutar automatizaciones post-publicación

De esta manera, el repositorio `portfolio` sigue enfocado en build y deploy estático, mientras `portfolio-cloud` concentra la ejecución orientada a eventos.

## Configuracion requerida en GitHub

El workflow de deploy ahora espera estos secrets o variables en `portfolio`:

- `FIREBASE_TOKEN`
- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `PORTFOLIO_CLOUD_PROCESS_RELEASE_FUNCTION_NAME` opcional, por defecto `portfolio-cloud-prod-process-release`
- `PORTFOLIO_CLOUD_PUBLISH_CHAT_KNOWLEDGE_FUNCTION_NAME` opcional, por defecto `portfolio-cloud-prod-publish-chat-knowledge`

## Releases versionadas

Una rama `release/vX.Y.Z` contiene la versión correspondiente del paquete y las notas en ambos idiomas en `Docs/releases/`. Su PR a `main` se integra mediante squash. Después del merge, `release.yml` valida la correspondencia entre rama y versión, crea un tag anotado `vX.Y.Z` sobre el commit integrado y publica la release de GitHub con las notas en español. Si existe un borrador, se publica automáticamente. Solo se aceptan tags existentes cuando ya apuntan a ese mismo commit. El deploy de Firebase y la sincronización de `dev` corren de manera independiente con el push a `main`.

## Contrato y pruebas de navegador antes del deploy

El generador del conocimiento del chat resuelve los enlaces de proyectos contra el origen público del sitio. El generador del payload rechaza enlaces relativos, con protocolos distintos de HTTP(S) o con credenciales antes del paso de Firebase, evitando publicar un artifact que rechacen Cloud/API.

## Revisión vigente, reintentos y rollback

Solo la cabeza de `main` publica. `scripts/current-revision.mjs` la consulta en la API de GitHub al decidir el deploy y otra vez justo antes de Firebase, `process-release` y `publish-chat-knowledge`. Si la revisión quedó atrás o GitHub no la confirma, el job falla sin ejecutar ese efecto ni los que dependen de él. La comprobación no es atómica con el efecto; las publicaciones están serializadas, de modo que la corrida de la revisión nueva se ejecuta después.

Para reintentar: usar **Run workflow** sobre `main`, o volver a ejecutar la corrida de la cabeza actual. Una corrida anterior falla a propósito. Si `main` avanzó durante una corrida, la siguiente completa lo pendiente.

Para volver atrás:

1. Revertir el cambio en `main` mediante un PR. El revert es una cabeza nueva y se publica por el camino normal.
2. No revertir el soporte de `#email=` en la baja (`src/index.html` y la página de baja): los avisos ya enviados usan ese enlace.
3. El rollback desde la consola de Firebase es solo una medida de emergencia para el sitio: restaura también la marca de publicación y la ejecución programada volverá a desplegar `main`. Completar el revert antes de esa ejecución o deshabilitar el workflow mientras tanto. No revierte avisos ni conocimiento del chat, y no debe elegir una versión sin soporte de `#email=`.

## Destino de producción verificado el 2026-10-09

El sitio público usa únicamente el stage `prod`. `dev` queda reservado para pruebas. AWS y los tres repositorios usan `us-east-1`; la consola del navegador puede abrir otra región y no debe tomarse como evidencia de la región desplegada. Hoy las variables del frontend en GitHub apuntan a `portfolio-api-cloud-test-process-release` y `portfolio-api-cloud-test-publish-chat-knowledge`, nombres físicos de la instalación de `portfolio-api-cloud`. Los valores por defecto del workflow siguen siendo los de `portfolio-cloud`: quitar las variables devolvería la publicación a esas funciones.
