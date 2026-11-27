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

La versión del paquete y las notas en ambos idiomas (`Docs/releases/vX.Y.Z.es.md` y `Docs/releases/vX.Y.Z.md`) se preparan en una rama `release/vX.Y.Z` con un PR hacia `dev`. La promoción es un pull request de `dev` a `main` (ver [integración de pull requests](#integración-de-pull-requests)).

El tag y la release de GitHub se crean después de validar producción, desde la web: **Releases** → **Draft a new release**, tag `vX.Y.Z`, título `Portfolio vX.Y.Z`, las notas de `Docs/releases/vX.Y.Z.es.md` y **Set as the latest release**. En **Target** se elige el commit validado, el que informa `gitSha` en `publication-state.json`, y no la rama `main`, que puede avanzar antes de publicar. Si la lista de la web no lo ofrece, crear la release con `gh release create vX.Y.Z --target <sha-validado>`. Antes de publicar, comprobar que `package.json` en esa revisión declare la versión `X.Y.Z` y que el tag no exista. Si la validación falla, no se crea.

`release.yml` solo actúa cuando se integra en `main` un PR cuya rama empieza con `release/v`, y publica el tag y la release en ese momento, sin esperar el deploy. Este flujo no lo usa: no abrir hacia `main` un PR desde una rama `release/`. El deploy de Firebase y la sincronización de `dev` corren de manera independiente con el push a `main`.

## Contrato y pruebas de navegador antes del deploy

El generador del conocimiento del chat resuelve los enlaces de proyectos contra el origen público del sitio. El generador del payload rechaza enlaces relativos, con protocolos distintos de HTTP(S) o con credenciales antes del paso de Firebase, evitando publicar un artifact que rechacen Cloud/API.

## Validación continua

`ci.yml` corre en pull requests y pushes hacia `dev` y `main`, sin secretos y separado del deploy. Usa Node 22, las dependencias de los lockfiles, caché de npm y cancela las ejecuciones reemplazadas de la misma rama.

| Job       | Contenido                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `quality` | formato, lint, TypeScript y tests unitarios                                                          |
| `build`   | build de producción, manifiesto y payload de conocimiento                                            |
| `browser` | sobre ese mismo build: HTML prerenderizado sin JavaScript, contrato de Hosting y Playwright Chromium |
| `verify`  | exige que los tres anteriores terminen bien                                                          |

Las reglas de `dev` y `main` exigen `verify` y el check `CodeRabbit`; se configuran en GitHub, no en el repositorio. Ver [integración de pull requests](#integración-de-pull-requests).

El build y los tests unitarios cargan `e2e/support/offline-build.cjs`, que rechaza conexiones no locales y responde la hoja de Google Fonts con `e2e/fixtures/google-fonts.css`; si cambian las fuentes hay que actualizar esa copia. Las pruebas de navegador usan el emulador de Firebase Hosting con el proyecto `demo-portfolio`, interceptan la API y no resuelven nombres externos.

`.prettierignore` enumera los archivos anteriores al control de formato; se retiran de la lista a medida que se formatean.

Reproducción local:

```bash
npm ci
npm ci --prefix tools/firebase-cli --ignore-scripts
npm run build:content
npm run format:check && npm run lint && npm run typecheck && npm test -- --watch=false
npm run build
npx playwright install --with-deps chromium
PORTFOLIO_E2E_BUILD=true npm run test:e2e
```

`npm run test:e2e` sin la variable levanta el servidor de desarrollo y omite las pruebas de HTML y Hosting.

## Integración de pull requests

Para integrar un pull request: revisarlo, comprobar que GitHub habilita **Merge pull request** y pulsarlo. No hacen falta comandos ni ejecutar workflows.

Reglas de `dev` y `main`, sin bypass para nadie:

- Solo pull requests: sin push directo, force push ni borrado.
- `verify` (GitHub Actions) y `CodeRabbit` aprobados sobre una rama actualizada respecto del destino.
- Conversaciones de revisión resueltas. No se exige aprobación de otra persona.
- Único método de integración: merge commit.

El auto-merge es el nativo de GitHub y es opcional: se activa en cada pull request con **Enable auto-merge** y GitHub integra cuando se cumplen todas las reglas. Hacia `main` solo se activa con autorización expresa del propietario; GitHub no impone esa restricción. Integra el head que exista en ese momento, incluidos commits agregados después de activarlo.

Casos que requieren una acción adicional:

- Rama atrasada: **Update branch**. El auto-merge no actualiza la rama; si el destino avanza mientras espera, hay que pulsarlo.
- Check `CodeRabbit` ausente o cancelado: comentar `@coderabbitai full review` en el pull request.

El check `CodeRabbit` indica que su revisión terminó, no que aprobó. También pasa cuando la omite, cuando la pausa o alcanza su límite de uso y, con la configuración predeterminada, cuando falla. Las observaciones abiertas como conversación bloquean hasta resolverlas; las incluidas solo en el cuerpo de la revisión no bloquean. Leerlas antes de integrar; el auto-merge no espera esa lectura, así que activarlo solo después de leer la revisión del head vigente o usar el merge manual.

Integrar en `main` despliega automáticamente: ver [pipeline actual](#pipeline-actual).

### Sincronización de `main` hacia `dev`

Después de cada push a `main`, `sync-dev.yml` abre un pull request desde `fix/sync-main-<sha>` hacia `dev` si `dev` no contiene esa revisión. No integra nada. Usa `DEV_SYNC_PAT`, que necesita escritura de contenido y de pull requests: con `GITHUB_TOKEN`, la CI del pull request quedaría esperando aprobación manual.

Ese pull request se integra con el mismo botón. Si está atrasado o tiene conflictos, **Update branch** o **Resolve conflicts** actualizan la rama de sincronización. Mientras `dev` no contenga `main`, un pull request de `dev` a `main` queda desactualizado y no se puede integrar.

## Revisión vigente, reintentos y rollback

Solo la cabeza de `main` publica. `scripts/current-revision.mjs` la consulta en la API de GitHub al decidir el deploy y otra vez justo antes de Firebase, `process-release` y `publish-chat-knowledge`. Si la revisión quedó atrás o GitHub no la confirma, el job falla sin ejecutar ese efecto ni los que dependen de él. La comprobación no es atómica con el efecto; las publicaciones están serializadas, de modo que la corrida de la revisión nueva se ejecuta después.

Para reintentar: usar **Run workflow** sobre `main`, o volver a ejecutar la corrida de la cabeza actual. Una corrida anterior falla a propósito. Si `main` avanzó durante una corrida, la siguiente completa lo pendiente.

Para volver atrás:

1. Revertir el cambio en `main` mediante un PR. El revert es una cabeza nueva y se publica por el camino normal.
2. No revertir el soporte de `#email=` en la baja (`src/index.html` y la página de baja): los avisos ya enviados usan ese enlace.
3. El rollback desde la consola de Firebase es solo una medida de emergencia para el sitio: restaura también la marca de publicación y la ejecución programada volverá a desplegar `main`. Completar el revert antes de esa ejecución o deshabilitar el workflow mientras tanto. No revierte avisos ni conocimiento del chat, y no debe elegir una versión sin soporte de `#email=`.

## Destino de producción verificado el 2026-10-09

El sitio público usa únicamente el stage `prod`. `dev` queda reservado para pruebas. AWS y los tres repositorios usan `us-east-1`; la consola del navegador puede abrir otra región y no debe tomarse como evidencia de la región desplegada. Hoy las variables del frontend en GitHub apuntan a `portfolio-api-cloud-test-process-release` y `portfolio-api-cloud-test-publish-chat-knowledge`, nombres físicos de la instalación de `portfolio-api-cloud`. Los valores por defecto del workflow siguen siendo los de `portfolio-cloud`: quitar las variables devolvería la publicación a esas funciones.
