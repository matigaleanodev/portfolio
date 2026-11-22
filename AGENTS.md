# portfolio

## Contexto de trabajo

Si existe un workspace con AGENTS.md en los directorios padre, leerlo explícitamente antes de editar y seguir sus referencias. Una raíz Git anidada puede impedir la herencia automática. Fuera de ese entorno, este archivo y el README deben ser suficientes para trabajar.

## Aplicación y contenido

- Angular standalone, Tailwind y prerender; frontend publicado mediante Firebase Hosting.
- Sitio y blog static-first: contenido editorial en content/posts y content/projects.
- npm run build:content valida Markdown/frontmatter y genera índices/HTML/metadata.
- Angular consume artefactos generados; no interpreta Markdown en runtime.
- Preservar SEO, URLs, canonical, RSS, sitemap y prerender de publicaciones.
- La API compatible resuelve contacto, chat y fachada de suscripciones.
- portfolio-cloud posee automatización editorial y almacenamiento de suscriptores.
- Este repo es fuente de verdad visual/editorial del ecosistema.

## Desarrollo y verificación

- npm ci instala; npm start prepara contenido e inicia Angular.
- npm run build compila contenido y aplicación; npm test ejecuta tests.
- npm run test:e2e verifica navegador cuando el cambio lo requiere.
- npm run build:diagrams regenera diagramas solo ante cambios intencionales de sus fuentes.
- Mantener specification, manifest, HTML y PNG sincronizados al regenerar diagramas.

## Restricciones

- No introducir CMS ni API runtime para posts o proyectos estáticos.
- Respetar publicación programada y exclusión de borradores/fechas futuras.
- Validar cambios de contratos dinámicos contra la API y de publicación contra portfolio-cloud.
- No escribir artefactos generados a mano ni regenerarlos para una tarea documental ajena.
- Consultar README y Docs para arquitectura, desarrollo y entrega.
