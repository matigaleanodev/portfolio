# Ownership del ecosistema Portfolio

Este documento registra el ownership operativo final entre `portfolio`, `portfolio-api` y `portfolio-cloud`.

## Resumen de ownership

- `portfolio` es dueño de la superficie visual, el contenido editorial fuente, el pipeline de build estático, los artefactos SEO y el deploy en Firebase.
- `portfolio-api` es dueño de la API pública dinámica mínima consumida por el frontend: contacto, chat y endpoints fachada de suscripciones.
- `portfolio-cloud` es dueño de la capa cloud de automatización: procesamiento de releases, publicación canónica del knowledge del chat, workflows de suscriptores, notificaciones y automatización post-publicación.

## Responsabilidades por repositorio

### `portfolio`

`portfolio` es la fuente de verdad para:

- rutas, páginas, UI y UX frontend en Angular
- contenido Markdown editorial bajo `content/`
- artefactos estáticos generados como JSON del blog, JSON de proyectos, RSS, sitemap y HTML prerenderizado
- artefactos de handoff de release generados durante CI/CD

`portfolio` no debe ser dueño de:

- persistencia de suscriptores
- envío con SES
- orquestación de Lambdas
- APIs editoriales runtime

### `portfolio-api`

`portfolio-api` es la fuente de verdad del contrato público dinámico usado por el frontend.

Alcance público actual:

- `POST /contact`
- `GET /chat/starters`
- `POST /chat`
- `POST /subscriptions`
- `DELETE /subscriptions`

`portfolio-api` debe mantenerse como una fachada acotada. Puede consumir conocimiento o servicios respaldados por cloud, pero no debería absorber la entrega de contenido editorial estático ni el ownership de workflows serverless.

### `portfolio-cloud`

`portfolio-cloud` es la fuente de verdad para:

- la orquestación AWS Lambda disparada después del deploy
- el procesamiento de releases desde `.generated/release-manifest.json`
- la publicación canónica del knowledge del chat generado por `portfolio`
- el almacenamiento y la distribución cloud de artefactos post-publicación
- la automatización orientada a suscriptores, notificaciones y workflows derivados

`portfolio-cloud` no debe convertirse en la capa pública de presentación ni duplicar el ownership editorial del frontend.

## Contratos de handoff

### Handoff de release

- productor: `portfolio`
- artefacto: `.generated/release-manifest.json`
- disparador: deploy exitoso a Firebase desde `main`
- consumidor: `portfolio-cloud` vía `process-release`

### Handoff del knowledge del chat

- productor: `portfolio`
- artefacto fuente: `.generated/chat/knowledge.json`
- payload de invocación: `.generated/chat/knowledge-payload.json`
- consumidor: `portfolio-cloud` vía `publish-chat-knowledge`
- lector runtime: `portfolio-api`

### Flujo de suscripciones

- owner de UI: `portfolio`
- owner de API pública: `portfolio-api`
- owner de persistencia y automatización: `portfolio-cloud`

## Reglas de frontera

- El contenido editorial estático entra solo por `portfolio`.
- Las llamadas públicas dinámicas del frontend entran solo por `portfolio-api`.
- La automatización cloud y la ejecución post-publicación permanecen dentro de `portfolio-cloud`.
- Las integraciones cross-repo deben documentarse como artefactos y contratos, no como acoplamientos implícitos de filesystem.
