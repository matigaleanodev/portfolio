---
title: Cómo diseño contratos cross-repo sin volverme loco
slug: como-diseno-contratos-cross-repo-sin-volverme-loco
excerpt: 'Así diseño contratos cross-repo entre frontend, backend y automatización: ownership claro, artifacts explícitos, handoffs versionados y menos acoplamiento implícito.'
date: 2026-03-13
tags:
  - architecture
  - engineering
  - monorepo
  - documentation
  - devops
coverImage: /assets/blog/como-diseno-contratos-cross-repo-sin-volverme-loco/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/como-diseno-contratos-cross-repo-sin-volverme-loco
ogImage: /assets/blog/como-diseno-contratos-cross-repo-sin-volverme-loco/og.webp
draft: false
---

Trabajar con varios repos que evolucionan juntos parece ordenado hasta que deja de serlo.

Separar frontend, backend y automatización tiene ventajas reales: despliegues independientes, límites más claros y menos ruido dentro de cada proyecto. El problema aparece cuando esa separación no viene acompañada por contratos igual de claros. Ahí el sistema sigue estando dividido en repos, pero en la práctica queda unido por supuestos, costumbres y memoria tribal.

Ese tipo de acoplamiento suele arrancar de forma inocente. Un repo espera que otro genere cierto archivo. Un deploy asume que un endpoint ya está disponible. Un proceso cloud depende de un payload que nadie formalizó demasiado porque "ya sabemos cómo viene". Mientras todo cambia poco, parece tolerable. Cuando los repos empiezan a moverse de verdad, se vuelve frágil rápido.

Eso mismo lo vi, a otra escala, en el ecosistema de mi portfolio. Hoy tengo una cadena donde [`portfolio`](https://github.com/matigaleanodev/portfolio), [`portfolio-api`](https://github.com/matigaleanodev/portfolio-api) y [`portfolio-cloud`](https://github.com/matigaleanodev/portfolio-cloud) evolucionan por separado, pero se tocan en varios puntos. Si esas fronteras no quedan bien diseñadas, la independencia de repos dura poco.

## El problema real no es tener varios repos

Tener varios repos no es el problema. El problema es no dejar explícito qué le debe cada uno al resto.

Cuando eso no está claro, empiezan a aparecer fallas bastante previsibles:

- un frontend exporta artifacts que nadie consume de la forma esperada
- una API se convierte en dueño accidental de contenido que no le corresponde
- una capa cloud termina reconstruyendo contexto que debería haber recibido ya estructurado
- un deploy funciona "porque en esta máquina estaba todo así", pero no porque el contrato sea entendible

En ese punto ya no estás integrando repos. Estás manteniendo una cadena de inferencias.

Lo más incómodo es que muchas veces no explota de inmediato. Empieza a haber drift. La documentación dice una cosa, los workflows hacen otra, los artifacts reales tienen otra forma y cada cambio cross-repo obliga a releer medio sistema para confirmar que nadie rompió un supuesto viejo.

Ese costo no suele verse en una arquitectura dibujada. Se ve en el trabajo diario.

## Qué criterio me funciona para no perder el control

Mi regla general es bastante simple: si dos repos se necesitan, la relación entre ambos tiene que poder explicarse como un contrato y no como una costumbre.

Eso implica tres cosas.

La primera es **ownership explícito**. Cada repo tiene que ser dueño de algo concreto y no de "un pedazo" ambiguo del flujo. En mi caso, [`portfolio`](https://github.com/matigaleanodev/portfolio) es dueño de la parte visual y editorial; [`portfolio-api`](https://github.com/matigaleanodev/portfolio-api) es dueño de la superficie dinámica pública; [`portfolio-cloud`](https://github.com/matigaleanodev/portfolio-cloud) es dueño de la automatización y el procesamiento serverless posterior. Si ese ownership se mezcla, enseguida aparece la duplicación de responsabilidades.

La segunda es **handoffs explícitos**. No me interesa que un repo lea directo cosas del filesystem de otro o que dependa de una estructura local que nadie formalizó. Prefiero que el intercambio pase por artifacts o interfaces concretas, con nombre, forma y propósito definidos.

La tercera es **fronteras chicas**. No conviene que un repo conozca demasiado del interior de otro. Cuanto más detalle necesita saber para integrarse, más fácil es que el cambio se vuelva costoso.

## Los contratos que más me sirven son bastante terrenales

No estoy hablando de una capa de gobierno abstracta. Estoy hablando de cosas mucho más concretas: archivos, payloads, endpoints y outputs de build.

En este ecosistema, por ejemplo, me sirvió trabajar con artifacts explícitos para el handoff entre repos. Un `release-manifest.json` deja claro qué build salió, qué metadata editorial acompaña el release y qué necesita la capa siguiente para continuar el flujo. Un `knowledge-payload.json` resuelve otro problema distinto: transportar contenido procesado con una forma estable hacia la parte cloud, sin depender de copiados ad hoc ni de acceso compartido al filesystem.

Ese tipo de artifact obliga a responder preguntas que, si no, quedan implícitas:

- quién lo genera
- en qué momento
- qué campos son parte del contrato
- quién lo consume
- qué pasa si cambia

También me sirven los endpoints fachada cuando necesito exponer una capacidad pública sin filtrar la complejidad interna. En vez de abrir más superficie de la necesaria, prefiero que la API publique contratos mínimos y que la complejidad de backoffice o integración quede atrás de esa frontera.

Lo mismo aplica a los outputs de build. Si un repo produce contenido estático, manifests o payloads para otro, ese output tiene que tratarse como parte del sistema, no como un detalle accesorio del pipeline.

## Lo que trato de evitar a propósito

Hay dos patrones que intento cortar bastante rápido.

El primero es el acoplamiento por filesystem. Cuando un proceso depende de "copiar este archivo a tal servidor" o de asumir una carpeta compartida entre repos, el contrato deja de estar en la interfaz y pasa a estar en la infraestructura local. Eso puede funcionar un tiempo, pero escala mal y cuesta mucho más auditarlo.

El segundo es el supuesto no documentado. Ese caso donde todos saben que cierto repo tiene que generar cierta cosa, o que un workflow se corre después de otro, o que tal payload viene con determinada forma, pero nada de eso quedó asentado en un lugar razonable. Ahí no hay contrato: hay memoria colectiva. Y la memoria colectiva no versiona bien.

## Cómo documento estas fronteras sin volver todo burocrático

No me interesa convertir cada integración en un documento kilométrico. Me interesa que una persona pueda entrar al workspace y entender rápido qué repo es dueño de qué, qué artifacts existen y dónde están los puntos de integración reales.

Para eso trato de documentar cuatro cosas, siempre con foco práctico:

- ownership de cada repo
- artifacts o interfaces que cruzan fronteras
- dirección del handoff
- validaciones operativas relevantes

No hace falta escribir una enciclopedia. Hace falta dejar claro, por ejemplo, que [`portfolio`](https://github.com/matigaleanodev/portfolio) exporta un manifest y un payload, que [`portfolio-cloud`](https://github.com/matigaleanodev/portfolio-cloud) consume eso para automatización posterior, y que [`portfolio-api`](https://github.com/matigaleanodev/portfolio-api) no debería reconstruir esa información por su cuenta ni convertirse en owner accidental del contenido editorial.

Cuando la documentación es concreta, además sirve para detectar drift. Si el workflow real ya no coincide con el contrato escrito, la diferencia se nota. Si no hay nada escrito, el drift tarda mucho más en hacerse visible.

## El deploy cross-repo también necesita contrato

Otra fuente clásica de caos aparece en lo operativo. No alcanza con definir bien el dominio si después los deploys y las validaciones post-release dependen de coordinación informal.

En la práctica, varios flujos cross-repo terminan necesitando una secuencia: un build genera artifacts, un deploy los publica, una automatización los procesa y otro sistema consume el resultado. Si esa cadena existe, conviene asumirlo y diseñarla como tal.

Ahí me resulta útil pensar el release como una superficie más del sistema. No como "el paso final", sino como otra interfaz que necesita entradas, salidas y validaciones claras. Si un workflow dispara procesamiento posterior, quiero saber con qué payload lo hace, qué espera recibir y qué evidencia deja después.

No porque me interese sobreprocesar el deploy, sino porque en sistemas repartidos el caos operativo suele entrar por ahí.

## El tradeoff de este enfoque

Obviamente esto tiene costo.

Definir ownership, nombrar artifacts y documentar handoffs lleva tiempo. También obliga a aceptar que algunas integraciones necesitan una pequeña capa extra de formalidad. A veces es más rápido conectar dos repos con una solución directa y seguir. El problema es que esa velocidad inicial suele reaparecer después como mantenimiento caro.

También hay un tradeoff de rigidez. Cuando un contrato está más explícito, cambiarlo requiere más cuidado. Pero, en mi experiencia, esa incomodidad es bastante más barata que vivir con integraciones difusas que nadie termina de entender del todo.

No busco eliminar toda fricción. Busco que la fricción aparezca en el lugar correcto: cuando una frontera cambia de verdad, no cada vez que alguien intenta recordar cómo funcionaba.

## Menos magia, más interfaces entendibles

Con el tiempo terminé valorando algo bastante simple: cuando varios repos se necesitan entre sí, la arquitectura no se juega solo dentro de cada código base. También se juega en los bordes.

Por eso prefiero sistemas donde esas uniones se puedan leer sin adivinar demasiado. Ownership claro. Artifacts explícitos. Handoffs versionados. Endpoints chicos cuando hacen falta. Documentación suficiente para no depender de que alguien "se acuerde".

No es una postura teórica ni una obsesión por formalizar todo. Es una forma de bajar complejidad operativa en un sistema que, aunque no sea enorme, ya tiene suficientes piezas como para que la magia empiece a salir cara.

Cuando una integración cross-repo está bien diseñada, no se siente sofisticada.  
Se siente simplemente entendible.
