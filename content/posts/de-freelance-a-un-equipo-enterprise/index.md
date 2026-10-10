---
title: "De freelance a un equipo enterprise: cómo cambió mi forma de hacerme responsable del trabajo"
slug: de-freelance-a-un-equipo-enterprise
excerpt: "Trabajar por mi cuenta, en una empresa pequeña y en un equipo enterprise cambió mi autonomía y mis responsabilidades. Qué aprendí de cada etapa y qué hábitos sigo intentando conservar."
date: 2027-01-11
tags:
  - career
  - engineering
  - teamwork
  - delivery
coverImage: /assets/blog/de-freelance-a-un-equipo-enterprise/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/de-freelance-a-un-equipo-enterprise
ogImage: /assets/blog/de-freelance-a-un-equipo-enterprise/og.webp
draft: false
---

Hay una parte de mi recorrido profesional que entiendo mejor cuando miro cuánto cambió mi responsabilidad sobre el trabajo.

Como freelance intentaba sostener el proceso completo: planificar, desarrollar, revisar detalles y desplegar. Después trabajé en una empresa pequeña, con mucha autonomía para decidir dentro de los proyectos, pero sin control sobre arquitectura o producción. Hoy formo parte de un equipo en un entorno enterprise, donde las responsabilidades están más repartidas y completar una funcionalidad requiere coordinar con otras personas y sectores.

En las tres etapas escribí código. Lo que cambió bastante fue qué podía decidir por mi cuenta, qué necesitaba acordar y hasta dónde llegaba mi control sobre el resultado.

Quiero abrir el año con ese recorrido. Sin nombres de empresas ni sistemas, porque lo que me interesa contar son los hábitos que fui construyendo y las cosas que tuve que aprender a hacer de otra manera.

## Como freelance, el orden dependía mucho de mí

Trabajar por mi cuenta me llevaba a mirar cada punto del proceso. El pedido inicial, la planificación, el desarrollo y el deploy formaban parte de una misma responsabilidad.

Eso tenía algo atractivo: podía mantener continuidad entre una decisión y su implementación. También significaba que cualquier descuido en la organización volvía a aparecer más adelante, cuando tocaba probar, publicar o retomar un trabajo.

Intentaba ser metódico, ordenar lo pendiente y trabajar los detalles. Que una pantalla funcionara era una parte; también me importaba cómo se usaba, qué pasaba ante un error y en qué condiciones iba a llegar al usuario.

Tener ese recorrido tan cerca me ayudó a pensar más allá del archivo que estaba modificando. Una decisión de desarrollo podía complicar el despliegue. Una definición incompleta podía convertirse en una corrección tardía. Una mejora pequeña de experiencia podía evitar una dificultad de uso.

El desafío era sostener esa atención sin perder el orden general. Cuando una sola persona participa en tantas partes, necesita distinguir qué es esencial para entregar y qué detalle puede seguir mejorándose después.

## En una empresa pequeña, la autonomía tenía otro alcance

Después trabajé en una empresa de menos de quince personas. Aunque mi rol fuera el de desarrollador, tenía amplio margen para tomar decisiones dentro del desarrollo de los proyectos en los que participaba.

Ese espacio me permitía resolver muchas cosas directamente. Conocía el trabajo de cerca y podía avanzar sobre necesidades concretas sin que cada decisión cotidiana necesitara recorrer varias capas de coordinación.

También tenía ownership sobre el entorno de desarrollo y el de testeo. Eso daba continuidad para implementar, probar e investigar problemas dentro de esos ambientes.

Pero el límite existía: no controlaba la arquitectura ni los despliegues a producción. Podía tener una funcionalidad lista en los ambientes que manejaba y todavía depender de otro recorrido para que llegara al entorno productivo.

Esa diferencia me parece importante. Tener mucha autonomía en el código no implica ser dueño de todas las decisiones del sistema. Ya en esa etapa aparecía la necesidad de reconocer dónde terminaba mi capacidad de actuar directamente.

## El “desorden ordenado” también era una forma de trabajar

Cuando pienso en cómo abordábamos bugs y cambios, la expresión que me sale es “desorden ordenado”. Había un conocimiento práctico del trabajo y una manera de resolver que podía resultar entendible para quienes estábamos dentro de ese contexto.

Los mensajes de commit no siempre eran especialmente semánticos y el versionado con SVN formaba parte de mi trabajo local. Esas herramientas y costumbres estaban integradas en la forma cotidiana de desarrollar.

No necesito convertir esa etapa en una lista de malas prácticas para reconocer sus límites. Una forma de trabajo puede permitir resolver necesidades y, al mismo tiempo, depender bastante del contexto que conserva cada persona.

Hoy valoro más que una decisión o un cambio deje una explicación útil para alguien que no participó de la conversación original. Me interesa poder volver a un commit y entender su intención, o reconstruir una corrección sin depender exclusivamente de la memoria de quien la hizo.

Esa es una de las cosas que me llevo de mirar el recorrido con distancia: el orden también tiene que servir cuando otro necesita continuar.

## En enterprise, la coordinación pasa a formar parte del desarrollo

En mi contexto actual trabajo dentro de un equipo de desarrollo, con metodologías ágiles y procedimientos para pedir ayuda, acceso o intervención de otros equipos y sectores.

Eso cambia el ritmo de algunas decisiones. Ya no alcanza siempre con identificar lo que haría falta y ejecutarlo directamente. Puede ser necesario explicar la necesidad, ubicar al equipo responsable y coordinar cuándo se puede avanzar.

Aprender ese recorrido también es parte de trabajar bien. Una dependencia que no se hace visible puede dejar una funcionalidad bloqueada aunque el código propio esté resuelto.

Lo mismo ocurre con los ambientes superiores. Mi responsabilidad sobre una feature no me convierte en dueño de todas las piezas que intervienen en su entrega.

Ahí tengo que cuidar otra forma de continuidad: que lo que produzco tenga contratos claros, evidencia de prueba y suficiente contexto para pasar a la siguiente parte del proceso.

## Negocio define qué necesita el producto

Otra parte importante es el trabajo con el equipo de negocio, que toma las decisiones sobre qué funcionalidades se necesitan.

Desde desarrollo puedo aportar alternativas, explicar restricciones y señalar costos o dependencias. Para hacerlo bien necesito entender el problema que se busca resolver y comunicar el impacto de las decisiones técnicas de una manera útil para esa conversación.

Eso me ayuda a distinguir dos responsabilidades que a veces se mezclan: definir la necesidad del producto y decidir cómo implementarla dentro del sistema existente.

El [refinamiento, la planning y la review](/blog/del-pedido-de-negocio-a-la-review) dan espacio para sostener esa relación. La feature necesita conservar su sentido mientras pasa de una definición a una implementación que después se puede mostrar en uso.

## Ser dueño de una feature sigue pidiendo mirar más allá del código

El alcance del ownership se volvió más acotado respecto del proyecto completo, pero dentro de la feature sigue habiendo mucho por cuidar.

Entender los criterios, reconocer dependencias, desarrollar, probar, comunicar bloqueos y dejar un recorrido claro son parte de esa responsabilidad.

Que otra persona controle un ambiente no elimina la necesidad de entregar evidencia. Que negocio decida las funcionalidades no elimina el trabajo de aclarar una definición ambigua. Que un equipo distinto mantenga una API no elimina la necesidad de acordar qué espera mi parte del contrato.

Lo que cambia es la forma de resolverlo: una parte requiere acción propia y otra necesita coordinación.

## Qué intento conservar de cada etapa

Del freelance quiero conservar la atención al recorrido completo y a los detalles que afectan a quien usa el producto.

De la empresa pequeña, la iniciativa para investigar y resolver dentro del espacio de decisión que tengo.

Del entorno enterprise, la disciplina para hacer visibles las dependencias, respetar responsabilidades y construir entregas que otras personas puedan continuar.

Todavía me interesa hacerme cargo del resultado. Hoy lo entiendo también como saber qué me corresponde resolver, qué necesito conversar y qué información tengo que dejar para que el trabajo avance con el equipo.
