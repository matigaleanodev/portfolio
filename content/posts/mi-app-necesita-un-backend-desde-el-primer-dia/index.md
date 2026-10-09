---
title: ¿Mi app necesita un backend desde el primer día?
slug: mi-app-necesita-un-backend-desde-el-primer-dia
excerpt: "Una primera versión mobile puede resolver mucho con datos locales. El criterio está en entender qué necesita el usuario, qué pasa si pierde el dispositivo y cuándo cuentas, backup o sincronización justifican un backend."
date: 2026-08-20
tags:
  - mobile
  - architecture
  - product
  - backend
  - engineering
coverImage: /assets/blog/mi-app-necesita-un-backend-desde-el-primer-dia/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/mi-app-necesita-un-backend-desde-el-primer-dia
ogImage: /assets/blog/mi-app-necesita-un-backend-desde-el-primer-dia/og.webp
draft: false
---

Cuando pienso una app nueva, es bastante fácil empezar a dibujar una API antes de terminar de definir qué va a hacer la primera pantalla.

Usuarios, autenticación, base de datos, recuperación de contraseña, deploy y algún mecanismo de sincronización. Todo parece parte del paquete inicial.

Pero hay productos donde el primer uso útil ocurre completamente dentro del teléfono. En esos casos, empezar por un backend puede consumir buena parte del esfuerzo antes de validar la experiencia que realmente importa.

La decisión merece una pregunta más concreta: ¿qué necesita resolver esta primera versión que el dispositivo no pueda resolver por sí solo?

## Un caso chico permite ver mejor la decisión

Pensemos en una app para registrar caminatas. Es un ejemplo de diseño, no una implementación que ya tenga terminada.

La primera versión podría permitir iniciar una actividad, registrar el recorrido, terminarla y consultar el historial en el mismo teléfono.

Antes de pensar en cuentas, hay bastante trabajo de producto:

- explicar para qué se necesita ubicación
- manejar permisos rechazados
- guardar el progreso sin perder toda la actividad ante una interrupción
- mostrar cuándo el registro está activo o detenido
- permitir revisar y borrar recorridos

Un backend no resuelve automáticamente ninguno de esos puntos. Son parte de la experiencia local y del comportamiento de la app frente al sistema operativo.

Si la hipótesis inicial es que alguien pueda registrar y consultar sus propias caminatas, puedo evaluar esa experiencia sin obligarlo primero a crear una cuenta.

## Guardar en el teléfono también requiere diseño

Una app local necesita pensar su persistencia con seriedad.

No alcanza con que la información sobreviva mientras el proceso está abierto. Hay que decidir cómo se guarda, cómo se recupera después de un cierre y qué pasa cuando una actualización cambia el formato de los datos.

En el ejemplo del recorrido, también distinguiría una actividad en curso de una actividad finalizada. Si la app se interrumpe, debería poder reconocer un registro incompleto y ofrecer una recuperación razonable.

La tecnología de almacenamiento vendría después de entender volumen, consultas y consistencia. Guardar una preferencia y guardar miles de puntos de una actividad son necesidades diferentes.

Empezar local reduce algunas piezas operativas, pero sigue exigiendo un modelo de datos, reglas de recuperación y una experiencia clara ante fallos.

## La pregunta incómoda es qué pasa si se pierde el teléfono

Acá aparece el límite que más me interesa hacer explícito.

Si los datos viven únicamente en el dispositivo, no puedo prometer que estarán disponibles después de una reinstalación, una pérdida o un cambio de equipo. Tampoco asumiría que un backup del sistema cubre todos los casos sin verificarlo.

Ese límite puede ser aceptable para una prueba pequeña. Puede ser inaceptable para alguien que acumula meses de historial y espera conservarlo.

Por eso, la decisión de empezar local necesita ir acompañada de una promesa entendible: dónde están los datos y qué opciones tiene el usuario para conservarlos.

Una exportación manual puede ser una primera respuesta razonable, siempre que exista una forma de importar y recuperar esa información. Un archivo que solo sirve para mirar datos en otra herramienta no reemplaza una restauración de la app.

Y si esa exportación contiene recorridos, también hay que tratarla como información personal. Sacar el backend de la primera versión no elimina las decisiones sobre privacidad.

## Backup y sincronización son compromisos distintos

Estas dos necesidades suelen entrar juntas en la conversación, pero conviene separarlas.

Un backup busca recuperar información después de perderla. La sincronización busca mantener información coherente entre copias que pueden cambiar.

Si una persona usa un solo teléfono, quizás le alcance con respaldar y restaurar su historial. Si usa dos dispositivos y edita datos desde ambos, aparecen preguntas adicionales:

- qué copia prevalece ante cambios simultáneos
- cómo se propaga un borrado
- qué pasa si un dispositivo vuelve a conectarse varios días después
- cómo se evita duplicar una actividad al reintentar una subida

Agregar una API con un endpoint para guardar recorridos no responde por sí solo esas preguntas. La sincronización necesita reglas propias.

Por eso prefiero definir primero qué promesa necesito cumplir. “Recuperar mis datos” puede tener un alcance bastante menor que “usar todo desde cualquier dispositivo”.

## Hay necesidades que sí justifican un servidor desde el inicio

También hay casos donde postergar el backend sería forzar el producto.

Si la app necesita compartir datos entre personas, administrar permisos comunes, procesar información con credenciales privadas o aplicar reglas que el cliente no debe poder alterar, ya existe una responsabilidad clara del lado servidor.

Lo mismo pasa cuando la función principal depende de información centralizada y actualizada. Una app de reservas necesita una autoridad para saber qué disponibilidad sigue vigente. El teléfono de cada usuario no puede decidirlo por separado.

En esos casos, el backend forma parte de la función que se quiere entregar. Conviene incorporarlo con ese alcance concreto, en lugar de intentar sostener una independencia local que el dominio no permite.

## Dejar espacio para crecer no exige construir la sincronización

Si empiezo local, me interesa que la persistencia tenga una responsabilidad clara y que las pantallas no conozcan todos sus detalles.

Eso permite cambiar cómo guardo una actividad sin reescribir cada vista. También ayuda a pensar identificadores estables y versiones de datos desde temprano.

Hasta ahí llega una preparación razonable. No hace falta crear repositorios remotos vacíos, colas de operaciones o un motor genérico de conflictos antes de decidir si van a existir varios dispositivos.

Cuando aparezca esa necesidad, habrá que revisar el modelo. Una frontera clara ayuda a hacerlo, pero no convierte la sincronización en un cambio trivial.

## La primera versión necesita una promesa acotada

Para el ejemplo de las caminatas, evaluaría primero si la app registra bien, recupera una actividad interrumpida y permite consultar el historial sin depender de conexión.

Después decidiría cómo conservar esos datos fuera del teléfono. Si la expectativa real ya incluye recuperación automática o uso en varios equipos, ese alcance tendría que entrar antes.

El criterio también conecta con lo que planteé en [Más arquitectura no siempre es mejor](/blog/mas-arquitectura-no-siempre-es-mejor): cada pieza debería responder a una necesidad que podamos explicar.

Me interesa que la primera versión haga una promesa pequeña y la cumpla bien. Si para cumplirla hace falta backend, lo sumo. Si alcanza con el dispositivo, prefiero invertir ese esfuerzo inicial en que la app sea útil desde el primer uso.
