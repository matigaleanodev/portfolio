# Flujo de deploy del portfolio

Este documento define el flujo de deploy que hoy se ejecuta desde el repositorio `portfolio`, incluyendo el handoff final hacia `portfolio-cloud` y la exportacion del artifact editorial usado por el resto del ecosistema.

## Alcance actual

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

1. `npm ci`
2. `npm run build:content`
3. `npm run build`
4. `npm run build:release-manifest`
5. `npm run build:chat-knowledge-payload`
6. deploy de `dist/portfolio/browser` a Firebase Hosting
7. invocacion de `portfolio-cloud-<stage>-process-release` con `.generated/release-manifest.json`
8. invocacion de `portfolio-cloud-<stage>-publish-chat-knowledge` con `.generated/chat/knowledge-payload.json`
9. subida del release manifest, del artifact de conocimiento editorial, del payload de invocacion y de las respuestas de Lambdas como artifacts del workflow

## Estrategia de Firebase Hosting

Firebase Hosting sirve `dist/portfolio/browser`.

Reglas principales:

- el HTML prerenderizado mantiene una política de cache sensible a cambios
- los assets XML no hasheados (`rss.xml`, `sitemap.xml`, `sitemap-blog.xml`) mantienen una política de cache sensible a cambios
- los índices JSON generados mantienen un cache corto
- el JS/CSS hasheado y las imágenes estáticas siguen siendo inmutables
- el rewrite global a `/index.html` queda solo como fallback del router cliente; los archivos prerenderizados siguen teniendo prioridad cuando existen

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
- slugs de posts del blog
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
- `PORTFOLIO_CLOUD_PROCESS_RELEASE_FUNCTION_NAME` opcional, por defecto `portfolio-cloud-dev-process-release`
- `PORTFOLIO_CLOUD_PUBLISH_CHAT_KNOWLEDGE_FUNCTION_NAME` opcional, por defecto `portfolio-cloud-dev-publish-chat-knowledge`
