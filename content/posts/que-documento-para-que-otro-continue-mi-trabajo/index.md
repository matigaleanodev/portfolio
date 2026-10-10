---
title: Qué documento para que otro pueda continuar mi trabajo
slug: que-documento-para-que-otro-continue-mi-trabajo
excerpt: "Decisiones, contratos, ejecución local y problemas conocidos: qué información intento dejar para que otra persona pueda retomar una feature sin reconstruir todas las conversaciones que la hicieron posible."
date: 2027-06-20
tags:
  - documentation
  - engineering
  - teamwork
  - architecture
coverImage: /assets/blog/que-documento-para-que-otro-continue-mi-trabajo/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/que-documento-para-que-otro-continue-mi-trabajo
ogImage: /assets/blog/que-documento-para-que-otro-continue-mi-trabajo/og.webp
draft: false
---

Una funcionalidad puede estar bien implementada y resultar difícil de continuar si la explicación vive únicamente en la cabeza de quien la desarrolló.

Por qué se eligió cierto contrato, qué dependencia todavía falta, cómo preparar datos de prueba o qué comportamiento aparentemente extraño responde a una restricción real. Nada de eso siempre se deduce leyendo el código.

Me interesa documentar esa información con un propósito concreto: que otra persona pueda ejecutar, entender, revisar o modificar el trabajo sin reconstruir todas las conversaciones que lo hicieron posible.

Eso también me sirve cuando vuelvo meses después. La familiaridad que tengo hoy con una feature no es una garantía de memoria para el futuro.

## Primero pienso quién necesita continuar y qué va a hacer

Una persona que revisa un cambio necesita entender el problema, el alcance y la evidencia. Quien ejecuta el proyecto por primera vez necesita preparación y comandos. Quien investiga un incidente necesita ubicar el recorrido y sus señales.

Intentar resolver esas necesidades en una única descripción interminable puede dificultar todas.

Prefiero que exista un punto de entrada y referencias hacia cada explicación. El README puede orientar sobre la ejecución, la documentación de arquitectura sobre responsabilidades y una tarjetita de Jira sobre la entrega concreta.

La ubicación tiene que ayudar a encontrar la información cuando hace falta, además de ser cómoda para quien la escribe.

## Documento el motivo que el código no puede explicar solo

El código muestra qué hace el sistema. A veces también comunica bien la intención mediante nombres y límites claros.

Lo que suele faltar es por qué descartamos otra alternativa o qué restricción externa condicionó la solución.

Por ejemplo, un proceso asíncrono puede haberse elegido por duración, volumen o dependencia de otro servicio. Esas razones ayudan a evaluar si la decisión sigue siendo válida cuando cambia el contexto.

Una nota útil puede ser corta: problema, alternativas relevantes, decisión y consecuencias. No hace falta convertir cada extracción de función en una decisión arquitectónica.

Me interesa registrar lo que una persona podría interpretar de otra manera y cambiar sin conocer su impacto.

## Los contratos necesitan una fuente clara

Si una feature depende de una API, debería existir una referencia vigente al contrato: qué recibe, qué devuelve y cómo comunica errores o estados.

Copiar el mismo payload en varios documentos facilita que queden versiones diferentes. Prefiero enlazar la fuente correspondiente y agregar alrededor el contexto que esa feature necesita.

También dejaría claro qué parte está implementada, qué está simulada y qué depende de otro equipo. Un ejemplo de respuesta sirve para desarrollar, pero no demuestra por sí solo que la integración ya haya sido verificada.

Cuando el contrato cambia, la documentación debería cambiar con él. De lo contrario, la explicación puede volverse una fuente activa de errores para el siguiente consumidor.

## Ejecutar el proyecto debería tener un recorrido comprobable

Para la preparación local, registraría versiones necesarias, instalación, configuración esperada y comandos de ejecución y validación.

Los ejemplos de configuración deberían mostrar nombres y formato, sin incluir credenciales reales. Si un valor requiere acceso, indicaría cómo se gestiona ese acceso dentro del proceso correspondiente.

También importa explicar qué resultado indica que la aplicación arrancó correctamente y qué dependencias necesita para completar un flujo.

Un comando que inicia el frontend puede funcionar aunque la API necesaria esté caída. Quien llega debería poder distinguir una app levantada de un recorrido integrado disponible.

Me sirve revisar esa documentación ejecutando sus pasos. El conocimiento previo puede hacer que omita una preparación que para otra persona no es evidente.

## La entrega necesita evidencia y límites conocidos

Al cerrar una funcionalidad, dejaría qué comportamiento se implementó, qué se probó y en qué ambiente.

Si no se pudo verificar un escenario, debería poder reconocerse. Por ejemplo, un límite de volumen pendiente en release o una dependencia que todavía usa un mock.

Esa información permite que QA o el siguiente desarrollador continúen desde un punto real. Decir “probado” sin alcance puede generar expectativas que la evidencia no sostiene.

Los problemas conocidos también necesitan contexto. Qué ocurre, bajo qué condiciones y qué alternativa existe mientras se resuelve. Una nota genérica de “a veces falla” deja casi toda la investigación pendiente.

## Los comentarios de código tienen un alcance más cercano

Un comentario puede explicar una precondición, una restricción de compatibilidad o el motivo de un orden que no conviene alterar.

No me resulta tan útil repetir en texto lo que una línea ya dice con claridad. Ese comentario agrega mantenimiento y puede quedar desactualizado cuando cambia la implementación.

Si la explicación necesita describir una decisión compartida entre varias piezas, probablemente merezca un documento o una referencia central, con comentarios puntuales donde ayuden a encontrarlo.

También revisaría si un nombre más preciso puede reemplazar una explicación extensa. A veces la mejor documentación empieza por hacer legible la responsabilidad en el propio código.

## Los diagramas ayudan cuando aclaran una frontera

Para una feature que atraviesa API, cola y worker, un diagrama pequeño puede explicar quién inicia el trabajo y dónde se guarda el resultado.

Lo mantendría al nivel que necesita el lector. Si incluye cada clase, archivo y helper, puede volverse más difícil de actualizar que la explicación que buscábamos mejorar.

El diagrama debería distinguir componentes existentes de propuestas y dependencias externas de piezas propias. También conservar coherencia con el texto y el sistema actual.

Un dibujo atractivo que describe una arquitectura anterior puede orientar peor que una lista breve y correcta de responsabilidades.

[![Informes asíncronos: aceptación, cola y ejecución](/diagrams/async-report-processing.ba40f4b0ffb6.png)](/diagrams/async-report-processing.html)

[Explorar un ejemplo de API, cola y worker](/diagrams/async-report-processing.html).

## La documentación también necesita mantenimiento acotado

Cuando una tarea modifica un contrato, un comando o una responsabilidad, revisaría la explicación relacionada dentro del mismo trabajo.

Eso ayuda a que el cambio y su contexto lleguen juntos a revisión. Dejar la actualización para un momento indefinido suele convertirla en un pendiente que nadie reconoce como parte de la entrega.

También eliminaría instrucciones que ya no aplican o las movería a un registro histórico claramente identificado. Conservar todo en el punto de entrada obliga al lector a adivinar qué sigue vigente.

La cantidad de documentos importa menos que la posibilidad de encontrar una respuesta actual y verificable.

## Qué debería poder hacer la siguiente persona

Antes de cerrar, me preguntaría si alguien puede preparar el entorno, ubicar el flujo, reconocer las decisiones importantes y saber qué quedó pendiente.

No espero eliminar todas las conversaciones. El equipo siempre va a necesitar coordinar y compartir conocimiento.

Lo que intento evitar es que cada continuación empiece desde cero. Una documentación útil conserva el contexto que más cuesta reconstruir y deja espacio para que la próxima conversación se concentre en el cambio nuevo.
