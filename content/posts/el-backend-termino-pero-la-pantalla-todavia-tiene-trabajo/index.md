---
title: El backend terminó, pero la pantalla todavía tiene trabajo
slug: el-backend-termino-pero-la-pantalla-todavia-tiene-trabajo
excerpt: "Aceptar un proceso, esperar su resultado y recuperarse de un fallo también son parte de la experiencia. Cómo diseño pantallas para trabajo asíncrono sin reducir todo a un spinner."
date: 2027-02-20
tags:
  - frontend
  - angular
  - product
  - ux
  - async
coverImage: /assets/blog/el-backend-termino-pero-la-pantalla-todavia-tiene-trabajo/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/el-backend-termino-pero-la-pantalla-todavia-tiene-trabajo
ogImage: /assets/blog/el-backend-termino-pero-la-pantalla-todavia-tiene-trabajo/og.webp
draft: false
---

Una API puede aceptar un trabajo, ejecutarlo correctamente y dejar al usuario sin entender qué pasó.

El botón quedó deshabilitado. El spinner sigue girando. La persona cerró la pantalla y volvió más tarde. O la consulta de estado falló justo cuando el proceso terminó.

Ese recorrido también pertenece a la funcionalidad. Cuando el resultado llega después de la respuesta inicial, el frontend necesita representar una espera que tiene vida propia.

Voy a continuar con el ejemplo ficticio de generación de informes que usé al hablar de [SQS y Lambda](/blog/procesamiento-asincrono-sqs-lambda). El backend registra una ejecución y permite consultar su estado. La pregunta ahora es qué necesita la pantalla para acompañar ese trabajo.

## La respuesta inicial necesita una interpretación correcta

Si el pedido devuelve `202 Accepted`, puedo comunicar que fue recibido para procesamiento. Todavía no corresponde mostrar “informe generado”. Esa diferencia está expresada en la [semántica de HTTP](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3).

La pantalla debería conservar la identidad de la ejecución y ofrecer una forma de consultar su evolución. Un mensaje como “Estamos preparando tu informe” describe mejor el estado que una confirmación de éxito final.

También decidiría qué puede hacer la persona mientras espera: seguir usando la app, abrir otra ejecución o volver al listado. La espera no debería bloquear más acciones de las que el producto necesita.

## El proceso y la consulta tienen estados distintos

El servidor puede decir que una ejecución está pendiente, en curso, completada o fallida. Por otro lado, mi pantalla puede estar consultando, haber perdido conexión o estar mostrando información obtenida hace varios segundos.

Me interesa mantener esa diferencia en el modelo:

```typescript
type ExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed';
type RefreshStatus = 'idle' | 'loading' | 'unavailable';

interface ExecutionViewState {
  readonly executionId: string;
  readonly status: ExecutionStatus;
  readonly refreshStatus: RefreshStatus;
  readonly lastConfirmedAt: string;
}
```

Es un fragmento ilustrativo del estado de vista. Si falla la consulta, `refreshStatus` puede pasar a `unavailable` sin inventar que el proceso de negocio terminó en `failed`.

Para el usuario eso permite un mensaje más preciso: “No pudimos actualizar el estado. La última información indica que sigue en proceso”.

[![Consultar el proceso sin inventar su resultado](/diagrams/async-screen-refresh.c8b8df06eea9.png)](/diagrams/async-screen-refresh.html)

[Explorar el ciclo de consulta de la pantalla](/diagrams/async-screen-refresh.html).

## Un spinner no explica toda la espera

Si no conozco el porcentaje real de avance, prefiero una indicación de actividad antes que una barra que parece precisa y avanza de forma inventada.

Si el backend expone etapas reales, puedo mostrarlas con nombres entendibles: preparando datos, generando archivo, resultado disponible. La UI debería representar información que el sistema puede sostener.

También importa el paso del tiempo. Una espera habitual y una ejecución que lleva mucho más de lo esperado merecen mensajes diferentes, aunque ambas sigan técnicamente en curso.

Eso requiere acordar qué significa una demora para el producto. Un temporizador del navegador puede decidir cuándo ofrecer ayuda, pero no debería cambiar el estado persistido del proceso por su cuenta.

## Consultar periódicamente necesita un ciclo de vida

Para empezar, el polling puede ser suficiente. Definiría una frecuencia inicial, una reducción gradual cuando la espera se extiende y un límite de consultas concurrentes.

Si una petición tarda, no tiene sentido acumular otra cada pocos segundos sin control. También evitaría que una respuesta anterior reemplace una actualización más reciente.

La consulta puede detenerse cuando llega un estado terminal, cuando la vista se destruye o cuando el usuario decide dejar de seguirla. Ninguna de esas acciones cancela automáticamente el trabajo del servidor.

Si el producto ofrece cancelación, necesita una operación propia y un contrato claro: cuándo todavía es posible y cómo se confirma. Cerrar el modal solamente cambia la UI.

## Volver a la pantalla debería recuperar la situación actual

Un proceso que dura más que una visita necesita una forma de reencontrarlo.

Un listado de ejecuciones o una ruta con su identificador permite consultar de nuevo el estado autorizado para ese usuario. Guardar una referencia local puede facilitar la navegación, pero el navegador no debería convertirse en la única fuente que sabe que ese trabajo existe.

Si la ejecución ya terminó, la pantalla debería mostrar el resultado. Si el archivo venció, hay que distinguirlo de un proceso que falló al generarse. Si la persona perdió acceso, corresponde explicar esa situación sin exponer datos que ya no puede consultar.

Ese recorrido de regreso merece tanta atención como el clic inicial.

## Reintentar puede significar dos cosas diferentes

Ante un error de conexión al consultar, reintentar significa volver a pedir el estado de la misma ejecución.

Ante un proceso que terminó fallido, puede significar solicitar una nueva ejecución o pedir al backend una recuperación de la existente. Esa decisión necesita estar en el contrato.

Usar el mismo botón “Reintentar” para ambos casos puede crear trabajos duplicados o dejar una expectativa equivocada sobre lo que está ocurriendo.

También cuidaría el envío inicial. Deshabilitar el botón durante la petición ayuda a prevenir interacciones repetidas en esa vista, pero la API necesita su propia estrategia para reconocer solicitudes repetidas.

## La finalización tiene que ser usable

Cuando el informe esté disponible, mostraría una acción clara para acceder al resultado y conservaría el contexto del pedido.

Si la actualización ocurre sin una nueva interacción, también revisaría cómo se comunica con tecnologías de asistencia. El cambio de estado debería poder percibirse sin obligar a mirar continuamente una animación.

Evitaría mover el foco de forma sorpresiva o reemplazar la pantalla completa cuando la persona está haciendo otra cosa. La novedad tiene que ser visible y entendible, con una acción disponible cuando quiera usarla.

## Qué probaría desde la experiencia completa

Probaría una ejecución rápida, una lenta, un fallo del proceso y un fallo únicamente de la consulta. También salir, volver, abrir dos pestañas y recibir una respuesta tarde.

Me interesa que la pantalla pueda responder tres preguntas en todo momento: qué sabe del trabajo, qué está intentando actualizar y qué puede hacer el usuario ahora.

El backend sostiene la ejecución. El frontend sostiene la relación de la persona con esa ejecución. Cuando ambos contratos están cuidados, esperar deja de ser mirar un spinner y pasa a ser una parte entendible del producto.
