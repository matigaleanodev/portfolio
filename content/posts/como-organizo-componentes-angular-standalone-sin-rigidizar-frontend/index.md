---
title: Cómo organizo componentes en Angular standalone sin rigidizar el frontend
slug: como-organizo-componentes-angular-standalone-sin-rigidizar-frontend
excerpt: "Un frontend mantenible no sale de inventar carpetas perfectas. Sale de componentizar chico, mover lógica donde corresponde y usar Angular standalone para marcar límites más claros sin volver la UI ceremoniosa."
date: 2026-05-14
tags:
  - angular
  - frontend
  - architecture
  - engineering
coverImage: /assets/blog/como-organizo-componentes-angular-standalone-sin-rigidizar-frontend/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/como-organizo-componentes-angular-standalone-sin-rigidizar-frontend
ogImage: /assets/blog/como-organizo-componentes-angular-standalone-sin-rigidizar-frontend/og.webp
draft: false
---

Hay frontends que se vuelven difíciles de mantener no porque les falten componentes, sino porque se intentó organizar demasiado.

Empieza con una buena intención: dejar todo prolijo, definir una estructura clara, pensar reutilización, separar carpetas y evitar caos. El problema aparece cuando esa organización se rigidiza antes de que el producto la necesite. Ahí el frontend deja de sentirse modular y empieza a sentirse ceremonioso.

En Angular eso pasa bastante fácil si se mezclan dos impulsos:

- querer componentizar todo desde el día uno
- querer definir una taxonomía perfecta antes de entender bien el dominio

El resultado suele ser conocido: componentes inflados, carpetas `shared` que se convierten en cajones genéricos, wrappers que agregan más vueltas que valor y pantallas donde la lógica de UI, la lógica de negocio y la coordinación de datos viven todas apiladas en el mismo archivo.

Angular standalone ayuda mucho a ordenar mejor eso. Pero no porque obligue a una metodología rígida. Ayuda porque vuelve más visibles los límites reales del frontend.

## El problema no es faltar de estructura, es pasarse

No creo demasiado en los esquemas universales para organizar componentes. Sirven como referencia, pero cuando se convierten en dogma suelen empezar a jugar en contra.

Por ejemplo, Atomic Design puede servir como marco mental para pensar granularidad. Lo que no me resulta útil es usarlo como si cada pieza del frontend tuviera que calzar sí o sí dentro de una taxonomía perfecta antes de demostrar que existe una necesidad real.

En productos reales, lo que más ordena no es una clasificación impecable. Lo que más ordena es esto:

- componentes chicos
- responsabilidades claras
- lógica desacoplada cuando conviene
- límites entendibles entre feature, UI y servicios

Eso suele rendir mucho más que una estructura elegante en papel pero incómoda de sostener.

## Componentizar chico sigue siendo la decisión que más paga

La mayoría de los problemas de mantenimiento no arrancan porque haya "demasiados componentes". Arrancan porque hay muy pocos y hacen demasiado.

Cuando un componente termina manejando:

- estado de pantalla
- llamadas HTTP
- mapeo de datos
- validaciones
- reglas de negocio
- apertura de modales
- coordinación con navegación
- render de la vista

ya no tenés un componente. Tenés una concentración de responsabilidades.

Eso vuelve más difícil casi todo:

- entender qué hace
- testearlo bien
- cambiarlo sin miedo
- reutilizar una parte sin arrastrar el resto
- reemplazarlo cuando la pantalla evoluciona

Por eso prefiero componentizar en piezas más chicas, con nombres claros y alcance concreto. No por obsesión estética. Porque baja carga mental.

Un componente chico suele ser más fácil de:

- implementar
- leer
- revisar
- probar
- reutilizar de verdad

Y cuando no sirve más, también es más fácil de tirar sin romper media aplicación.

## Angular standalone ayuda a pensar mejor los límites

Una de las cosas más sanas que trajo Angular standalone es que obliga menos a organizar el proyecto alrededor de módulos artificiales y deja más espacio para pensar el frontend desde features y dependencias concretas.

Eso me gusta porque empuja una pregunta mejor:

¿este componente de qué depende realmente y dónde tiene sentido que viva?

En vez de meter todo bajo una idea genérica de módulo compartido, standalone te deja armar piezas más explícitas:

- páginas
- componentes de feature
- componentes presentacionales
- servicios de coordinación
- utilidades bien acotadas

No resuelve la arquitectura por vos, pero sí saca bastante ceremonia innecesaria del medio.

Y cuando hay menos ceremonia, es más fácil ver dónde un componente está cargando responsabilidades que no le corresponden.

## No todo tiene que ir a `shared`

Esta carpeta casi siempre empieza con buenas intenciones y casi siempre corre riesgo de degradarse.

El problema no es tener `shared`. El problema es usar `shared` como destino automático de cualquier cosa que todavía no sabemos bien cómo clasificar.

Ahí terminan cayendo:

- componentes supuestamente genéricos
- pipes que en realidad son de una sola feature
- helpers con dependencias implícitas
- wrappers de UI que nadie termina reutilizando tanto como se imaginó

Mi criterio suele ser bastante simple: si una pieza todavía pertenece claramente a una feature, debería quedarse cerca de esa feature. Moverla a `shared` demasiado pronto no la vuelve más reusable. Solo la desacopla de su contexto antes de tiempo.

La reutilización real vale más que la reutilización imaginaria.

Si un componente ya está siendo usado en varios lugares con necesidades realmente parecidas, ahí sí tiene sentido extraerlo mejor. Si todavía no pasó, prefiero esperar un poco y no inventar una abstracción por anticipado.

## Componentes simples, servicios cuando corresponde

Otra cosa que degrada rápido un frontend es cargar al componente con toda la lógica solo porque "la pantalla arranca ahí".

Que un componente sea el punto de entrada visual no significa que tenga que ser dueño de todo.

Cuando una parte de la lógica mejora en claridad, mantenimiento o testeo al vivir fuera del componente, moverla a un servicio suele ser una decisión sana.

Eso puede incluir:

- coordinación de estado
- fetch y persistencia
- reglas repetidas entre vistas
- transformaciones de datos
- navegación semántica
- manejo de recursos de una feature

En mis proyectos Angular eso aparece bastante con servicios como `ResourceService`, `NavService` o `StorageService`, y con piezas base como `BaseList` o `BaseForm`. La idea no es meter una capa por deporte. La idea es que la UI no tenga que resolver todo a la vez.

Por ejemplo, en [`modo-playa-admin`](https://github.com/matigaleanodev/modo-playa-admin) una pantalla como `contacts-list` no necesita pensar al mismo tiempo en render, paginación, borrado, estado de carga y sincronización del recurso. Parte de eso ya vive en `ContactsResourceService` y en la base de lista. Entonces la página concreta se puede concentrar más en la feature y menos en infraestructura repetida.

Ese criterio me sigue pareciendo mejor que dejar toda la coordinación pegada al componente "porque total solo se usa acá". Muchas veces hoy se usa ahí y mañana deja de ser cierto.

## Responsabilidad única, pero sin volverlo una religión

Me sirve pensar que un componente debería tener una responsabilidad dominante clara.

No significa que tenga que ser microscópico ni que cualquier línea extra ya sea una violación arquitectónica. Significa algo más terrenal: que una persona pueda abrir el archivo y entender rápido cuál es su rol principal dentro de la pantalla.

Por ejemplo:

- un componente presenta un bloque de datos
- otro maneja una toolbar de filtros
- otro encapsula una tabla de resultados
- otro resuelve una sección del formulario

Cuando esa frontera está clara, el crecimiento suele ser más sano. Cuando no lo está, el componente empieza a volverse un nodo donde se amontona cualquier cosa que "ya estaba cerca".

Y ese tipo de crecimiento después cuesta bastante más revertirlo.

## Reutilización real contra abstracción prematura

Hay una tentación bastante común en frontends grandes: abstraer antes de validar si algo realmente se parece lo suficiente como para compartirlo.

Eso produce componentes supuestamente reutilizables que terminan llenos de:

- flags
- inputs opcionales
- ramas de comportamiento
- templates cada vez más difíciles de seguir
- condiciones para soportar casos que solo se parecen en superficie

En teoría era un solo componente reusable. En la práctica terminó siendo un componente incómodo para todos.

Prefiero repetir un poco al principio y abstraer después con evidencia. Cuando la repetición muestra un patrón real, la extracción suele salir mucho mejor:

- el contrato es más claro
- los casos de uso ya están probados
- el componente no nace sobredimensionado
- la reutilización es concreta y no imaginaria

No toda duplicación es un problema inmediato.  
Mucha abstracción prematura sí.

## Lo que sí trato de hacer en Angular standalone

Si tuviera que bajar el criterio a decisiones concretas, sería algo así:

- páginas enfocadas en componer la feature, no en concentrar toda la lógica
- componentes chicos y con una intención clara
- servicios para mover coordinación o reglas cuando eso simplifica la UI
- piezas compartidas solo cuando la reutilización ya es real
- estructuras por feature antes que carpetas genéricas infinitas
- abstracciones chicas, no sistemas internos gigantes por defecto

Nada de eso requiere una taxonomía solemne. Requiere criterio para decidir qué cosa merece independizarse y cuál todavía puede quedarse cerca de su contexto.

## Cierre práctico

Un frontend mantenible no sale de inventar la carpeta perfecta.

Sale de componentizar chico, separar responsabilidades, mover lógica donde de verdad mejora el diseño y mantener cada pieza lo bastante simple como para entenderla, probarla, escalarla y reemplazarla sin drama.

Angular standalone ayuda bastante en ese camino porque deja pensar mejor las dependencias y los límites. Pero la mejora real no viene del feature técnico por sí solo. Viene del criterio con el que se usa.

No me interesa rigidizar el frontend con una metodología total.  
Me interesa que los componentes sirvan.

Si una pieza es clara, chica, fácil de mantener y reusable cuando realmente hace falta, ya está haciendo un trabajo mucho más valioso que cualquier taxonomía impecable.
