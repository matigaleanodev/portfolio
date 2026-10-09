---
title: Cómo decido entre Signals y RxJS en Angular
slug: como-decido-entre-signals-y-rxjs-en-angular
excerpt: "Estado de pantalla, valores derivados y búsquedas HTTP tienen necesidades distintas. Así decido dónde usar signals, dónde mantener RxJS y cómo conectar ambos sin duplicar responsabilidades."
date: 2026-07-16
tags:
  - angular
  - frontend
  - rxjs
  - engineering
coverImage: /assets/blog/como-decido-entre-signals-y-rxjs-en-angular/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/como-decido-entre-signals-y-rxjs-en-angular
ogImage: /assets/blog/como-decido-entre-signals-y-rxjs-en-angular/og.webp
draft: false
---

Una pantalla con un buscador, un filtro y una lista parece bastante simple hasta que hay que decidir quién maneja cada cosa.

El texto cambia mientras escribís. El filtro modifica los resultados. Una búsqueda tarda más que la siguiente. Hay que mostrar carga, permitir reintentos y evitar que una respuesta vieja pise lo que el usuario acaba de pedir.

Ahí la discusión sobre Signals y RxJS deja de ser una preferencia de sintaxis. Empieza a ser una decisión sobre el comportamiento de la pantalla.

En Angular prefiero partir de signals para el estado que la UI necesita leer y actualizar. Cuando aparece coordinación entre eventos y operaciones asíncronas, RxJS sigue teniendo un lugar muy concreto.

## Primero separo qué valor tengo de qué está pasando

Para pensar una feature, me sirve distinguir dos necesidades.

Una es conocer el valor actual de algo: el filtro seleccionado, la página activa, si un panel está abierto o qué elemento está seleccionado. La otra es decidir qué hacer con una secuencia de cambios: esperar mientras el usuario escribe, reemplazar una búsqueda pendiente o combinar eventos de distintas fuentes.

La primera suele encajar bien con signals. La segunda muchas veces se entiende mejor con operadores de RxJS.

No necesito que toda la feature adopte una sola herramienta. Necesito que cada responsabilidad quede en un lugar donde se pueda entender sin reconstruir media aplicación.

## El estado de pantalla empieza chico

En un listado, arrancaría identificando las decisiones que pertenecen a la UI:

- texto ingresado
- categoría seleccionada
- página actual
- selección de una fila

Son valores con un dueño bastante claro. Si solo los necesita esa pantalla, prefiero mantenerlos cerca de ella. Si varias vistas coordinan el mismo recurso, puede convenir un servicio de feature.

La decisión de moverlos a un servicio no debería depender de que sean signals. Debería depender de quién necesita ese estado y cuánto dura.

También trato de evitar que cualquier consumidor pueda modificarlo desde cualquier lado. Un filtro que cambia debería pasar por una acción clara, especialmente si ese cambio además obliga a volver a la primera página.

Si esas dos decisiones se toman en lugares separados, tarde o temprano aparece un listado consultando la página cinco de un filtro que apenas tiene dos resultados.

## Lo que puedo derivar no necesita otro dueño

Una de las mejoras más útiles de trabajar con signals es poder expresar valores derivados con `computed`. Angular documenta ese modelo en su [guía de signals](https://angular.dev/guide/signals).

Si tengo una selección de filas, la cantidad seleccionada sale de esa selección. Si tengo filtros activos, el indicador de filtros aplicados sale de esos filtros.

Guardar ambos valores por separado obliga a sincronizarlos cada vez que algo cambia. Esa sincronización suele empezar como dos líneas inofensivas y terminar distribuida entre handlers, servicios y efectos.

Por eso intento hacer una pregunta antes de agregar estado: ¿este valor se decide por sí mismo o sale de otro que ya existe?

Si sale de otro, prefiero dejar escrita esa relación. También evito usar `effect` como mecanismo automático para copiar un signal a otro. Una derivación explícita suele explicar mejor la intención.

Eso no significa filtrar siempre en memoria. Si el catálogo está paginado en el servidor, filtrar los veinte elementos descargados no equivale a buscar en todo el catálogo. El lugar donde vive la consulta también forma parte del contrato.

## Una búsqueda HTTP tiene un problema de tiempo

Supongamos que el usuario escribe “playa” y enseguida lo cambia por “playa norte”. La primera consulta puede terminar después de la segunda.

Para esa pantalla, la respuesta que interesa es la correspondiente a la búsqueda vigente. El orden de llegada no alcanza para decidir qué mostrar.

Ahí me resulta útil un flujo con responsabilidades explícitas:

1. Recibir los cambios del criterio de búsqueda.
2. Esperar una pausa breve en la escritura cuando corresponda.
3. Evitar consultas equivalentes consecutivas.
4. Reemplazar la consulta anterior cuando aparece un criterio nuevo.
5. Exponer un estado que la vista pueda representar.

RxJS permite expresar esa coordinación con operadores como `debounceTime`, `distinctUntilChanged` y `switchMap`. Con `HttpClient`, desuscribirse de una petición en curso aborta la petición del cliente, como explica la [documentación de HTTP de Angular](https://angular.dev/guide/http/making-requests).

Esa cancelación no garantiza deshacer trabajo que el servidor ya haya recibido. Por eso tampoco trasladaría automáticamente este patrón a guardar un formulario o confirmar un pago. Reemplazar una lectura pendiente y manejar una escritura son decisiones distintas.

## El resultado necesita representar más que un array

Una lista vacía puede significar varias cosas: todavía no se buscó, la búsqueda no encontró coincidencias o hubo un error y alguien reemplazó el resultado por `[]`.

Para el usuario esas situaciones son diferentes. Para el código también deberían serlo.

Prefiero que la feature distinga carga, éxito y error de forma explícita. Si además conserva resultados mientras busca, debería poder identificar a qué consulta pertenecen y mostrar que se están actualizando.

También importa dónde se recupera un error. En una búsqueda continua, manejar el fallo dentro de la consulta interna permite que el flujo siga atendiendo cambios posteriores. Si la recuperación termina todo el flujo exterior, el usuario puede seguir escribiendo en un buscador que ya no consulta nada.

Ese tipo de problema no se arregla eligiendo signals u observables por preferencia. Se arregla definiendo el ciclo de vida de la operación.

## Conecto ambos en una frontera clara

Si el criterio nace como signal y la consulta se coordina con RxJS, tiene sentido usar `toObservable`. Si el resultado del flujo lo va a consumir una vista basada en signals, `toSignal` puede cerrar esa frontera. Angular ofrece ambas herramientas en su [documentación de interoperabilidad](https://angular.dev/ecosystem/rxjs-interop).

Lo que trato de evitar es convertir varias veces el mismo estado o construir una nueva suscripción cada vez que alguien lee un valor. Prefiero crear esa conexión una vez, con un valor inicial definido y un ciclo de vida entendible.

Tampoco hay obligación de convertir un observable que ya se consume bien con `AsyncPipe`. La interoperabilidad sirve cuando simplifica una frontera concreta.

## El criterio que me queda

Para una pantalla normal, empezaría por estado local con signals y valores derivados con `computed`. Si hay búsqueda, cancelación o coordinación entre eventos, evaluaría RxJS en esa parte del flujo.

Después revisaría tres cosas: que el estado tenga un dueño, que una respuesta vieja no pueda reemplazar la búsqueda vigente y que un error no deje la pantalla sin posibilidad de recuperarse.

Eso me resulta más útil que contar cuántos observables pude eliminar. Una feature mantenible debería dejar claro qué sabe la pantalla, qué operación está ejecutando y por qué cambia lo que el usuario ve.
