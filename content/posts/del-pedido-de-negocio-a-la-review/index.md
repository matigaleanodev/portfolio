---
title: "Del pedido de negocio a la review: cómo trabajamos una funcionalidad"
slug: del-pedido-de-negocio-a-la-review
excerpt: "Refinamiento con negocio, refinamiento técnico, planning, desarrollo y QA: cómo se ordena el trabajo de una funcionalidad y qué pasa cuando producción interrumpe lo planificado."
date: 2026-10-23
tags:
  - engineering
  - agile
  - scrum
  - jira
  - teamwork
coverImage: /assets/blog/del-pedido-de-negocio-a-la-review/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/del-pedido-de-negocio-a-la-review
ogImage: /assets/blog/del-pedido-de-negocio-a-la-review/og.webp
draft: false
---

Una parte importante del desarrollo profesional ocurre antes de abrir el editor.

Hay que entender qué necesita negocio, convertir esa necesidad en trabajo concreto, encontrar dependencias y acordar qué puede entregar el equipo. Después hay que desarrollar, probar y mostrar lo que se hizo. Mientras tanto, producción sigue funcionando y puede pedir atención en cualquier momento.

En mi experiencia, ese recorrido se vuelve mucho más llevadero cuando cada etapa tiene una intención clara. El tablero ayuda a verlo, pero lo que sostiene el proceso son las conversaciones y los acuerdos detrás de cada movimiento.

Quiero contar cómo trabajamos ese recorrido en un equipo de desarrollo, sin entrar en sistemas ni información interna. Para hacerlo más concreto, voy a usar una funcionalidad ficticia: agregar filtros y una exportación a un listado.

## El refinamiento con negocio empieza por entender el problema

Un pedido puede llegar como “necesitamos exportar esta pantalla”. Parece suficiente para empezar, hasta que aparecen las preguntas.

¿Se exporta la página visible o todos los resultados? ¿Se respetan los filtros? ¿Quién puede hacerlo? ¿Qué necesita resolver la persona con ese archivo? ¿Qué pasa si hay demasiados registros?

El refinamiento con negocio sirve para aclarar ese tipo de decisiones y construir criterios de aceptación. Si todavía existen dos interpretaciones distintas sobre el resultado esperado, avanzar más rápido con código solamente adelanta el momento de la discusión.

Me interesa salir de esa conversación con una necesidad entendible y un alcance que podamos explicar. También con las dudas visibles: algo que depende de otra definición no debería convertirse en una certeza solo porque quedó escrito en una tarjetita de Jira.

## El refinamiento técnico convierte ese alcance en trabajo realizable

Con la necesidad más clara, la conversación cambia. Ahora hay que pensar cómo llevarla al sistema que ya existe.

En el ejemplo, revisaría el contrato del listado, los permisos, la forma de consultar datos y el costo de generar la exportación. También qué equipos o componentes intervienen y qué puede desarrollarse de manera independiente.

El refinamiento técnico permite descubrir que un pedido aparentemente chico requiere una modificación de API, un ajuste de frontend y una definición sobre volumen máximo. O que conviene dividirlo en entregas más acotadas.

Separar ambos refinamientos ayuda a enfocar la conversación, aunque no los vuelve compartimentos cerrados. Si aparece una limitación técnica que cambia el alcance, hay que volver a hablar con negocio. Una decisión técnica que modifica la experiencia también necesita esa conversación.

Lo que intento evitar es llegar a la planning con dependencias importantes escondidas detrás de una descripción demasiado general.

## La planning necesita capacidad real

En la planning se acuerda el trabajo que entra al sprint. Para que ese acuerdo sirva, tiene que considerar la disponibilidad del equipo, las dependencias y la incertidumbre que todavía queda.

No me resulta útil pensar la capacidad como si cada día estuviera disponible para desarrollo nuevo y nada pudiera interrumpirlo. En un equipo que también atiende producción, parte de esa capacidad ya tiene otro compromiso.

Eso no obliga a adivinar cada incidente. Obliga a reconocer que existen y que pueden consumir tiempo de análisis, coordinación y resolución.

La planificación se vuelve más honesta cuando el equipo puede decir qué está preparado para iniciar, qué necesita una definición adicional y qué entrega podría verse afectada si aparece una interrupción importante.

## Las columnas representan acuerdos sobre el trabajo

En nuestro flujo, el desarrollo pasa por estas etapas:

| Columna | Qué representa |
| --- | --- |
| Listo para iniciar | La tarea está preparada para que alguien tome su desarrollo. |
| Desarrollo en progreso | El trabajo de implementación está activo. |
| Desarrollo finalizado | El código está completo, probado en desarrollo y cumple los criterios de aceptación de la tarea. |
| Inspección | El equipo de QA verifica el cambio en el entorno de release. |

Después, en la review, presentamos a negocio las funcionalidades realizadas durante el sprint mediante una o varias pruebas de uso en vivo.

La distinción entre desarrollo finalizado e inspección me parece especialmente útil. Terminar la implementación no elimina el trabajo de validación que viene después. Si ambas cosas se mezclan bajo una sola columna de “terminado”, resulta difícil ver dónde está realmente una funcionalidad.

También importa registrar qué bloquea una tarea. Que una tarjeta siga en desarrollo no explica por sí solo si alguien está programando, esperando un contrato o investigando un problema de ambiente.

[![Del refinamiento a la review](/diagrams/feature-delivery.5a1b84fd702d.png)](/diagrams/feature-delivery.html)

[Explorar el recorrido de una funcionalidad](/diagrams/feature-delivery.html).

## Scrum y Kanban ayudan a mirar aspectos distintos

En Jira, un tablero Scrum permite organizar el trabajo alrededor de sprints. Un tablero Kanban pone el foco en visualizar un flujo continuo. Atlassian describe ambas opciones en su [documentación de tableros](https://support.atlassian.com/jira-software-cloud/docs/what-is-a-jira-software-board/). Ninguno garantiza que las tareas estén bien definidas o que el equipo tenga capacidad para todo lo que aparece.

Al mirar un sprint me interesa qué objetivo estamos buscando y qué trabajo se previó. Al mirar el flujo me interesa dónde se acumulan tareas, qué está bloqueado y cuánto trabajo hay abierto al mismo tiempo.

No hace falta asumir que usamos dos tableros para la misma tarea. Son perspectivas que ayudan a hacer preguntas diferentes. Una lista larga de tarjetas en progreso puede mostrar mucha actividad y, al mismo tiempo, muy pocas entregas completas.

Además, las columnas y la separación de refinamientos que describo son acuerdos de nuestro equipo. La [Scrum Guide](https://scrumguides.org/scrum-guide.html) define el marco; no prescribe este workflow específico de Jira.

## Inspección en release permite exigirle más al cambio

El equipo de QA prueba en el entorno de release y hace verificaciones más exhaustivas que recorrer únicamente los casos de uso esperados.

También estresa flujos para evaluar volumen, tiempos de respuesta y performance. En una exportación, por ejemplo, importa que el archivo tenga los datos correctos, pero también cómo se comporta el flujo cuando aumenta la cantidad de registros.

Es una validación con un foco distinto al que tuvimos durante el desarrollo. Que una prueba haya funcionado en el ambiente de desarrollo aporta evidencia, pero todavía queda contrastar el comportamiento en el entorno de release.

Si aparece un problema, hay que resolverlo y volver a verificar. El tablero debería permitir reconocer ese recorrido, en lugar de conservar una apariencia de avance que ya no representa el estado real de la tarea.

## El buffer de interrupción reconoce que producción sigue viva

En nuestra metodología contemplamos capacidad para atender errores detectados en producción. Puede tratarse de un bug, un problema en los datos, una dificultad de experiencia de usuario o desconocimiento de una funcionalidad.

Esas situaciones requieren atención, pero no todas necesitan modificar código. A veces la resolución pasa por explicar un comportamiento, revisar datos o entender qué ocurrió. Otras veces exige una corrección y un despliegue de emergencia.

El buffer permite considerar ese trabajo dentro del sprint. No significa que cualquier cantidad de interrupciones entre sin afectar los entregables.

Si un problema consume más capacidad de la prevista, puede comprometer lo planificado. Ahí hace falta hacerlo visible y revisar prioridades. Mantener todas las fechas como si esa capacidad siguiera disponible solamente traslada el problema al cierre del sprint.

Me parece importante que esa atención quede registrada. Investigar un incidente también es trabajo, incluso cuando termina sin un cambio de código.

## La review pone el resultado frente a negocio

En la review presentamos las tareas realizadas durante el sprint y mostramos una o varias pruebas de uso en vivo.

Para el ejemplo del listado, recorreríamos los filtros, ejecutaríamos la exportación y mostraríamos el resultado. Eso permite conversar sobre algo concreto y relacionarlo con la necesidad que abrió el trabajo.

La presentación también ayuda a identificar dudas, nuevas necesidades o ajustes para el backlog. No todo comentario implica que la tarea original estuvo mal: a veces usar una funcionalidad hace visible una necesidad que antes no se había considerado.

Lo valioso es poder distinguir ese feedback de un criterio de aceptación que ya estaba acordado y todavía no se cumple.

## Lo que me sirve de este recorrido

El proceso funciona mejor cuando cada etapa reduce una incertidumbre concreta: qué necesita negocio, cómo podemos implementarlo, qué capacidad tenemos y cómo se comporta el resultado.

Jira permite dejar visibles esos acuerdos. El equipo tiene que sostenerlos y revisarlos cuando cambia la realidad.

Para mí, una buena metodología ayuda a que una funcionalidad llegue a la review con una historia entendible: qué problema buscaba resolver, qué se construyó, cómo se probó y qué aprendimos durante el camino.
