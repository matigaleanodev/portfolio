---
title: Cómo armé un portfolio static-first con Angular, Markdown y prerender
slug: portfolio-static-first-angular-markdown-prerender
excerpt: "Cómo llevé mi portfolio a un modelo static-first real: contenido en Markdown, artifacts JSON generados en build, prerender de rutas y backend reducido solo a capacidades dinámicas."
date: 2026-03-10
tags:
  - angular
  - architecture
  - seo
  - static-site
  - frontend
coverImage: /assets/blog/portfolio-static-first-angular-markdown-prerender/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/portfolio-static-first-angular-markdown-prerender
ogImage: /assets/blog/portfolio-static-first-angular-markdown-prerender/og.webp
draft: false
---

Durante bastante tiempo mi portfolio tuvo una mezcla medio incómoda: el frontend mostraba contenido editorial, pero parte de la lógica seguía orbitando alrededor de un enfoque runtime, casi como si un blog y una sección de proyectos necesitaran comportarse igual que una aplicación transaccional.

No era un problema de tecnología. Era un problema de criterio.

Un portfolio, un blog técnico y un catálogo de proyectos no necesitan una API de contenido para existir. Necesitan una fuente de verdad simple, una build predecible y una salida estática que cargue rápido, indexe bien y no dependa de procesos de backend para renderizar texto e imágenes que ya conozco de antemano.

Ese fue el cambio de fondo: dejar de pensar el sitio como una app que pide contenido en runtime y pasar a un modelo **static-first** real.

## El problema de tratar contenido editorial como si fuera data dinámica

Cuando el contenido editorial vive demasiado cerca del runtime, empiezan a aparecer costos que al principio parecen chicos, pero después se sienten en todos lados.

El primero es conceptual: si un post del blog o una card de proyecto salen de una API, el frontend queda acoplado a un backend para resolver algo que no cambió en tiempo real ni lo necesita hacer.

El segundo es operativo: una publicación nueva deja de ser solamente contenido. Pasa a depender de contratos, disponibilidad de endpoints, fallback de carga, estados de error y una capa de infraestructura que no aporta valor real para ese caso.

El tercero es SEO. Si el contenido principal de una página llega tarde o depende de una resolución posterior, la experiencia puede seguir siendo correcta para el usuario, pero ya no es igual de limpia para indexación, prerender y distribución estática.

En otras palabras: estaba usando una solución dinámica para un problema que, en esencia, era editorial.

## La decisión arquitectónica: Markdown como fuente y artifacts como contrato

La forma de ordenar eso fue bastante directa: mover el contenido al build y dejar de resolverlo en runtime.

Hoy los posts viven en `content/posts/` y los proyectos en `content/projects/`. Cada entrada tiene su `index.md`, su frontmatter y sus assets asociados. Esa parte del sistema pasó a ser contenido versionado en Git, no payload servido por una API.

A partir de ahí, el pipeline hace el trabajo pesado antes de que Angular compile:

1. lee los Markdown
2. valida frontmatter
3. convierte el contenido a HTML
4. calcula metadata como reading time
5. genera artifacts JSON para consumo del frontend
6. produce artifacts SEO como `rss.xml` y `sitemap-blog.xml`

El punto importante no es solamente que haya Markdown. El punto importante es que **Angular no parsea Markdown en runtime**. El frontend consume JSON ya generado en build, con una forma estable y pensada para renderizar.

Ese detalle cambia bastante la arquitectura, porque el contrato real deja de ser "el backend responde contenido" y pasa a ser "la build entrega artifacts listos para producción".

## Cómo separé el ownership entre frontend y backend

Esta separación también me obligó a decidir qué cosas siguen siendo dinámicas de verdad y cuáles no.

En este portfolio, el backend ya no es una API editorial. No tiene sentido que sea dueño de posts, proyectos, índices del blog o metadata SEO. Todo eso pertenece al frontend y a su pipeline de contenido.

El backend quedó reducido a lo que realmente necesita ejecución del lado servidor:

- contacto
- chat
- suscripciones

Ese recorte me parece más sano que intentar justificar una API más grande "por las dudas". Un backend mínimo no es una limitación si el dominio dinámico también es mínimo. Al contrario: hace más explícitos los límites del sistema.

El ownership terminó quedando bastante claro:

- el frontend es dueño de la experiencia visual, el contenido editorial y los artifacts estáticos
- el backend es dueño de las capacidades dinámicas
- la build actúa como frontera entre contenido fuente y salida pública

Eso evita que el sitio dependa de una API para publicar un artículo nuevo o mostrar un proyecto que ya podría estar embebido en el build final.

## Cómo funciona el pipeline de punta a punta

A nivel implementación, el flujo quedó así:

`Markdown -> JSON -> prerender -> artifacts SEO`

Los Markdown se procesan antes del build de Angular. De ahí salen, por ejemplo:

- `src/assets/blog/posts.json`
- `src/assets/blog/posts/<slug>.json`
- `src/assets/projects.json`

Con esos artifacts, el frontend puede renderizar listado de posts, detalle de artículo y catálogo de proyectos sin salir a pedir contenido editorial en runtime.

Después entra Angular con standalone, routing y prerender. Las rutas del blog se generan de forma estática durante la build, así que cada post termina con su HTML listo para servir. Eso me da páginas reales para `/blog` y para cada `/blog/:slug`, no una shell vacía esperando hidratar contenido después.

En paralelo, el pipeline también genera `rss.xml` y `sitemap-blog.xml`, que son parte de la salida estática del sitio y no una tarea manual ni un proceso separado medio olvidado.

Lo que me interesaba no era solo "tener blog". Me interesaba que el modelo completo cerrara bien:

- contenido versionado
- artifacts reproducibles
- rutas prerenderizadas
- SEO generado desde la misma fuente
- frontend desacoplado de una API editorial

## Lo que gano con este enfoque

La mejora más obvia fue complejidad. Hay menos piezas involucradas para publicar contenido y menos dependencias cruzadas entre frontend y backend.

También mejoró el acoplamiento. El portfolio ya no depende de que una API esté viva para mostrar artículos o proyectos. Si el backend tiene un problema, el contenido estático del sitio sigue existiendo igual.

En SEO, el beneficio también es concreto: el contenido principal ya forma parte del HTML prerenderizado, junto con su metadata, canonical y artifacts complementarios. No hay que compensar con soluciones raras algo que se podía resolver de forma mucho más simple desde el build.

Y hay una ventaja menos visible, pero importante: el sistema es más fácil de explicar. Cuando la arquitectura de un portfolio necesita demasiadas aclaraciones, probablemente ya se fue de tema.

## El tradeoff real

Obviamente no todo entra bien en este modelo.

Si mañana necesitara un CMS en tiempo real, edición colaborativa, preview remota compleja o workflows editoriales multiusuario, este enfoque se quedaría corto y tendría que mover parte del problema a otro lado. Static-first no significa negar lo dinámico. Significa usarlo donde de verdad aporta.

En mi caso, el tradeoff cierra porque el contenido editorial cambia con baja frecuencia y lo publico yo. Para ese escenario, agregar una API de contenido sería sumar complejidad antes de tener una necesidad real.

Por eso elegí esta dirección: no por purismo, sino porque para un portfolio técnico el diseño más razonable no era "full backend", sino un frontend estático con pipeline editorial serio y un backend acotado a capacidades dinámicas.

Ese límite, más que una restricción, terminó siendo la parte más valiosa de la arquitectura.
