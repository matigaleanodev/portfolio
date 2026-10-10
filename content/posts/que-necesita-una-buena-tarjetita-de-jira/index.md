---
title: Qué necesita una buena tarjetita de Jira para poder empezar a desarrollarla
slug: que-necesita-una-buena-tarjetita-de-jira
excerpt: "Contexto, alcance, criterios de aceptación y dependencias ayudan a transformar un pedido en trabajo realizable. Un ejemplo de cómo mejora una tarjetita de Jira después del refinamiento."
date: 2027-05-31
tags:
  - jira
  - engineering
  - agile
  - teamwork
coverImage: /assets/blog/que-necesita-una-buena-tarjetita-de-jira/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/que-necesita-una-buena-tarjetita-de-jira
ogImage: /assets/blog/que-necesita-una-buena-tarjetita-de-jira/og.webp
draft: false
---

Una tarjetita de Jira puede tener mucho texto y seguir dejando sin responder la pregunta que necesitamos para desarrollar.

También puede ser corta y contener lo esencial: qué problema se busca resolver, qué resultado se espera y qué decisiones ya se tomaron.

Me interesa que sirva para empezar el trabajo, mantener una conversación concreta y verificar después si entregamos lo acordado. La estructura ayuda cuando reduce interpretaciones distintas sobre la misma necesidad.

Voy a usar un pedido ficticio para comparar una descripción inicial con una versión refinada. No es una plantilla obligatoria ni una reproducción de una tarjetita real.

## Un pedido breve puede esconder muchas decisiones

La primera versión podría decir:

> Agregar exportación al listado de solicitudes.

Es suficiente para abrir una conversación. Todavía deja varias cosas por definir.

¿Qué necesita hacer el usuario con el archivo? ¿Se exportan las filas visibles o todo el resultado filtrado? ¿Qué columnas lleva? ¿Quién puede usarlo? ¿Cómo se comporta con muchos registros?

Si cada integrante responde esas preguntas por su cuenta, el desacuerdo aparece después de implementar.

La tarjetita debería conservar las decisiones que hacen que esas interpretaciones converjan. El refinamiento es el espacio para construirlas, como conté en [el recorrido desde negocio hasta la review](/blog/del-pedido-de-negocio-a-la-review).

## El contexto permite entender para qué existe el cambio

Una descripción más útil podría empezar por la necesidad:

> El equipo que revisa solicitudes necesita analizar fuera de la aplicación el conjunto obtenido con los filtros activos. Hoy copia manualmente la información de cada página.

Ese contexto explica por qué exportar solo la página visible podría resultar insuficiente. También permite evaluar alternativas si la implementación inicialmente imaginada tiene un costo inesperado.

No necesito una historia extensa sobre el producto. Necesito la información que conecta el pedido con una dificultad concreta de uso.

Cuando esa relación está clara, desarrollo puede hacer preguntas mejores y negocio puede evaluar si la solución sigue cumpliendo el objetivo.

## El alcance debería distinguir lo que entra ahora

Para el ejemplo, después de refinar podríamos acordar exportar todos los resultados que cumplen los filtros activos, con un conjunto definido de columnas y un límite de volumen.

También podríamos dejar fuera el envío por correo o la posibilidad de elegir columnas. Esas decisiones evitan que una expectativa futura aparezca como parte implícita de la entrega actual.

El límite de volumen y el formato necesitan valores concretos en una tarea real. En este ejemplo, lo importante es reconocer que son decisiones del alcance y que no conviene descubrirlas por accidente durante desarrollo.

Si una definición sigue pendiente, debería quedar identificada con quien puede resolverla y con su efecto sobre el trabajo.

## Los criterios de aceptación describen comportamientos verificables

Una versión refinada podría incluir criterios como estos:

- La exportación respeta los filtros aplicados al momento de solicitarla.
- El archivo contiene el conjunto de columnas acordado y conserva un orden definido.
- Si no hay resultados, se informa esa situación sin iniciar una generación innecesaria.
- Solo los usuarios con el permiso correspondiente pueden solicitar la operación.
- Si el pedido supera el límite acordado, la aplicación explica cómo reducirlo.
- La pantalla comunica el resultado del pedido y ofrece una recuperación ante fallos.

Cada criterio debería permitir una prueba concreta. “Que funcione bien” todavía requiere decidir qué significa funcionar y en qué condiciones.

También cuidaría que los criterios sean compatibles entre sí. Pedir todo el resultado y exigir una respuesta inmediata para cualquier volumen puede necesitar otra conversación sobre el recorrido.

## El refinamiento técnico agrega dependencias y decisiones de implementación

Una vez definido el comportamiento, revisaría qué partes intervienen: frontend, API, permisos, generación del archivo y eventualmente procesamiento asíncrono.

Si otro equipo tiene que ampliar un contrato, dejaría la dependencia y la referencia al trabajo relacionado. Si hay una decisión técnica que modifica la experiencia, vuelve a negocio para acordarse.

La tarjetita puede enlazar el contrato y el diseño relevante sin copiar documentos completos. Eso mantiene un punto de entrada útil y evita versiones diferentes de la misma definición.

Me interesa que alguien pueda reconocer qué está preparado y qué todavía impide empezar una parte del desarrollo.

## Los datos de prueba también ayudan a preparar el trabajo

Para la exportación, necesitaría ejemplos con resultados, sin resultados y cercanos al límite de volumen. También una cuenta con acceso y otra sin el permiso.

Si esos datos no existen en el ambiente disponible, conviene saberlo antes de que la tarea parezca terminada. Puede requerir preparación o coordinación con otra persona.

Usaría referencias seguras o datos ficticios, sin pegar información sensible en una descripción accesible para más gente de la necesaria.

La evidencia de prueba que se agregue después debería corresponder a esos comportamientos acordados y al ambiente donde se verificaron.

## La tarjetita puede evolucionar sin perder la historia

Durante desarrollo pueden aparecer restricciones o aclaraciones. Si cambian el alcance, dejaría visible la decisión y su relación con lo acordado previamente.

No me sirve conservar una descripción que ya no representa el trabajo. Tampoco reemplazarla de una forma que haga imposible entender por qué se cambió.

Un comentario breve con la decisión, su motivo y la actualización correspondiente puede sostener esa continuidad. La forma concreta depende de cómo trabaja el equipo.

Lo que quiero preservar es la posibilidad de revisar la feature usando el acuerdo vigente, con sus cambios conocidos.

## Estar lista para iniciar es un acuerdo del equipo

Una buena tarjetita no necesita eliminar toda incertidumbre antes de empezar. Necesita que la incertidumbre restante sea reconocible y compatible con el trabajo que vamos a asumir.

Si falta una definición central, puede ser necesario investigar antes de comprometer la implementación. Si el contrato está claro y queda un detalle menor, quizás puede resolverse durante el desarrollo.

La diferencia se conversa y se hace visible. Una checklist puede recordar preguntas útiles, pero no reemplaza ese criterio.

Para mí, una tarjetita está ayudando cuando permite que negocio, desarrollo y QA hablen sobre la misma funcionalidad. Su valor aparece al reducir el tiempo que gastamos interpretando de nuevo algo que ya creíamos acordado.
