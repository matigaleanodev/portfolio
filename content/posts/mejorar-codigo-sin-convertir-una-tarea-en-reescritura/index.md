---
title: Cómo mejoro código existente sin convertir una tarea en una reescritura
slug: mejorar-codigo-sin-convertir-una-tarea-en-reescritura
excerpt: "Una funcionalidad nueva suele dejar a la vista código que podríamos mejorar. Cómo decido qué refactor entra en la tarea, qué conviene separar y qué evidencia necesito para cambiar con confianza."
date: 2027-03-12
tags:
  - engineering
  - refactoring
  - architecture
  - development
coverImage: /assets/blog/mejorar-codigo-sin-convertir-una-tarea-en-reescritura/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/mejorar-codigo-sin-convertir-una-tarea-en-reescritura
ogImage: /assets/blog/mejorar-codigo-sin-convertir-una-tarea-en-reescritura/og.webp
draft: false
---

Hay tareas que llegan con un alcance chico y dejan a la vista un montón de cosas que cambiaríamos.

Un componente demasiado largo, una transformación repetida, un nombre que confunde o una capa que hace más trabajo del que debería. Todo está cerca de lo que necesitamos tocar y parece una buena oportunidad para ordenarlo.

La dificultad aparece cuando el cambio deja de tener un límite claro. Lo que empezó como agregar un campo termina incluyendo una reorganización de carpetas, una nueva abstracción y modificaciones en pantallas que no tenían relación directa con el pedido.

Me interesa mejorar el código que mantengo, pero también poder explicar por qué cada cambio forma parte de la tarea.

## Primero entiendo qué comportamiento estoy protegiendo

Antes de modificar la estructura, necesito reconocer qué hace esa parte del sistema y qué resultado esperan sus consumidores.

Una función repetitiva puede contener diferencias que todavía no vi. Un parámetro con mal nombre puede formar parte de un contrato externo. Un orden de operaciones incómodo puede responder a una dependencia temporal.

Por eso empezaría por el flujo que voy a tocar, sus llamadas y sus pruebas. Si algo no tiene una explicación evidente, lo trataría como una pregunta antes de eliminarlo.

Ese reconocimiento también ayuda a separar un refactor, que busca conservar comportamiento, de un cambio funcional. Ambos pueden ser necesarios, pero conviene que el diff y la revisión permitan distinguirlos.

## El pedido me da un primer límite

Supongamos que una pantalla necesita agregar una fecha opcional a un formulario. El ejemplo es ficticio, pero el dilema es bastante cotidiano.

Puede hacer falta ajustar el modelo, el control, la validación y el contrato de guardado. Si el componente mezcla todo y dificulta incorporar el campo con seguridad, una extracción pequeña podría ser parte de la solución.

En cambio, reemplazar todos los formularios de la aplicación por un sistema genérico nuevo parece otro trabajo. Que la necesidad se haya descubierto en esta tarea no significa que todo deba resolverse dentro de ella.

Me sirve escribir qué tengo que cambiar para completar el criterio de aceptación. Lo demás necesita justificar su relación con ese objetivo.

## Una mejora entra cuando reduce un problema del cambio actual

Hay refactors que ayudan de forma inmediata: extraer una transformación para probarla, aclarar un nombre que inducía a usar mal un valor o separar una responsabilidad que estaba bloqueando la implementación.

La pregunta que me hago es qué dificultad concreta desaparece y cómo puedo verificar que no cambié el resto del comportamiento.

Si la respuesta depende únicamente de que “quedaría más moderno”, todavía me falta un motivo suficiente para ampliarlo dentro de esta entrega.

También considero el tamaño de la modificación. Una mejora localizada puede facilitar la revisión. Una reorganización amplia puede ocultar el cambio funcional detrás de movimientos de archivos y diferencias de formato.

## Las convenciones existentes también tienen valor

En un sistema compartido, la consistencia ayuda a que otras personas puedan encontrar y entender las piezas.

Una solución aislada puede gustarme más y, aun así, agregar un segundo patrón donde el equipo ya tenía uno que funciona. Si quiero cambiar esa convención, merece una conversación sobre alcance y continuidad.

Eso no obliga a perpetuar una práctica problemática. Obliga a distinguir una excepción justificada de una preferencia personal aplicada sin contexto.

Si la convención dificulta el cambio o genera fallos repetidos, dejaría evidencia y una alternativa concreta. Es mucho más fácil evaluar una mejora cuando podemos relacionarla con un problema que el equipo reconoce.

## Prefiero pasos que se puedan revisar por separado

Cuando un refactor es necesario, intentaría que tenga una secuencia entendible: reconocer el comportamiento, reorganizar una parte conservándolo y después incorporar la funcionalidad.

Según el tamaño del trabajo, eso puede expresarse en commits separados o en cambios pequeños dentro de la misma revisión. Lo que importa es que el razonamiento sea visible.

También evitaría mezclar correcciones automáticas de formato en archivos que no necesitaban tocarse. Cada diferencia adicional consume atención del reviewer y puede complicar entender qué tiene riesgo funcional.

El mensaje del commit debería explicar el cambio resultante. Tener pasos pequeños sirve más cuando sus nombres permiten reconocer qué aporta cada uno.

## Las pruebas deberían cubrir el riesgo que estoy moviendo

Si extraigo un cálculo con reglas de negocio, probaría sus casos relevantes y contrastaría que el consumidor conserve el mismo resultado. Si reorganizo la coordinación de una consulta, miraría sus estados y el comportamiento ante fallos.

No buscaría únicamente que las pruebas existentes sigan verdes. También revisaría si cubren justo el compromiso que mi refactor puede haber alterado.

En el formulario del ejemplo, una fecha opcional puede cambiar cómo se envían valores vacíos y cómo se recuperan datos guardados. Esa frontera merece una comprobación específica aunque la UI se vea idéntica.

El esfuerzo de validación debería acompañar el riesgo real del cambio, no el entusiasmo que genera la nueva estructura.

## Lo que queda afuera necesita una descripción útil

Cuando detecto una mejora que no entra, me sirve registrarla con el problema observado, su impacto y una idea acotada de resolución.

“Refactorizar formularios” deja mucho por interpretar. “Tres pantallas duplican esta conversión de fecha y producen formatos diferentes” ofrece algo verificable para priorizar.

Ese registro permite discutir la mejora sin perderla y sin convertir la tarea actual en una promesa imposible de cerrar.

También deja espacio para descubrir que la duplicación todavía es aceptable o que la solución necesita más contexto. Registrar una incomodidad no obliga a crear una abstracción inmediatamente.

## La entrega debería seguir siendo explicable

Antes de cerrar, revisaría si puedo describir el cambio en pocas frases: qué pidió la funcionalidad, qué mejora interna fue necesaria y qué se verificó.

Si esa explicación se volvió demasiado larga, puede ser señal de que hay trabajos distintos mezclados.

Me interesa que el código quede mejor preparado para el siguiente cambio, pero también que este pueda llegar a su destino. Un refactor útil reduce una dificultad concreta y conserva un alcance que el equipo puede revisar, probar y sostener.
