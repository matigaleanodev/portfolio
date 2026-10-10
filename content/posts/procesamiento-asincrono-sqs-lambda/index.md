---
title: "Procesamiento asíncrono con SQS y Lambda: orden, reintentos y fallos"
slug: procesamiento-asincrono-sqs-lambda
excerpt: "Aceptar un pedido no significa completarlo. Un recorrido técnico por SQS, FIFO y Lambda: identidad del proceso, idempotencia, fallos parciales, DLQ y consulta de estado desde el cliente."
date: 2026-11-12
tags:
  - aws
  - sqs
  - lambda
  - backend
  - architecture
coverImage: /assets/blog/procesamiento-asincrono-sqs-lambda/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/procesamiento-asincrono-sqs-lambda
ogImage: /assets/blog/procesamiento-asincrono-sqs-lambda/og.webp
draft: false
---

Mover una operación a una cola cambia el contrato completo de la funcionalidad.

El cliente deja de recibir el resultado en la misma respuesta. El trabajo puede esperar, fallar, ejecutarse de nuevo o completarse después de que el usuario cierre la pantalla. El sistema necesita poder explicar qué pasó sin depender de que alguien busque a mano un mensaje en CloudWatch.

Para bajar esas decisiones a algo concreto, voy a usar un ejemplo ficticio: una API que recibe pedidos de generación de informes, un worker Lambda que los procesa desde SQS y una base PostgreSQL donde se registra cada ejecución. El ejemplo sirve para discutir diseño; no reproduce una arquitectura interna ni presenta una implementación de producción propia.

## Primero defino qué significa aceptar el pedido

La API podría exponer este contrato:

```http
POST /report-executions
Idempotency-Key: 6c4122a8-example

HTTP/1.1 202 Accepted
Location: /report-executions/7f91-example

{
  "executionId": "7f91-example",
  "status": "pending"
}
```

El `202` comunica que el pedido fue aceptado para procesamiento. La respuesta todavía no promete que el informe esté generado.

El `executionId` identifica el trabajo para el usuario y para el sistema. Es distinto del `messageId` de SQS, que identifica un mensaje de transporte. Si necesito volver a publicar el trabajo, la ejecución sigue siendo la misma aunque cambie el mensaje.

La clave de idempotencia de la API también tiene otro propósito: reconocer un reintento del pedido HTTP. La asociaría al solicitante y a una representación del pedido. Si llega la misma clave con un contenido diferente, corresponde rechazar la ambigüedad, no devolver silenciosamente el resultado de otra solicitud.

## Persistir y publicar son dos operaciones que pueden separarse por un fallo

Guardar la ejecución y después enviar un mensaje parece suficiente hasta que la API se cae entre ambas operaciones.

Queda una ejecución pendiente que nadie va a procesar. Si invierto el orden, puedo publicar un mensaje y fallar antes de guardar la ejecución que el worker necesita leer.

Para este ejemplo usaría una outbox: dentro de una transacción guardaría la ejecución y el evento pendiente de publicación. Un dispatcher enviaría los eventos confirmados a SQS y registraría el envío.

El dispatcher puede caerse después de enviar y antes de marcar el evento. Por eso la outbox permite recuperar publicaciones pendientes, pero no elimina los duplicados. El consumidor sigue necesitando idempotencia. Es el problema que describe el [patrón transactional outbox de AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

La confirmación HTTP debería ocurrir después de persistir ese compromiso. Así, `pending` significa que existe trabajo recuperable, aunque todavía no haya llegado a la cola.

## El flujo es asíncrono, pero SQS no usa la invocación asíncrona directa

Con SQS, un event source mapping de Lambda consulta la cola e invoca la función de forma síncrona con un lote. La funcionalidad completa sigue siendo asíncrona respecto del pedido HTTP del usuario.

Importa distinguirlo porque la recuperación depende de la integración con SQS. No configuraría los reintentos como si hubiera invocado Lambda directamente con `InvocationType: Event`.

Además, el procesamiento puede repetirse. La [documentación de Lambda con SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html) especifica semántica de al menos una vez. Que el código haya terminado un trabajo no garantiza que nunca vuelva a recibirlo.

[![Informes asíncronos: aceptación, cola y ejecución](/diagrams/async-report-processing.ba40f4b0ffb6.png)](/diagrams/async-report-processing.html)

[Explorar el flujo de generación de informes](/diagrams/async-report-processing.html).

## FIFO necesita una razón de negocio para el orden

Si cada informe es independiente, una cola estándar puede ser suficiente. FIFO tiene sentido cuando existe una relación de orden que necesito preservar.

En FIFO, `MessageGroupId` define el grupo dentro del cual se mantiene ese orden. Distintos grupos permiten procesamiento concurrente. Usar el mismo grupo para todo puede serializar trabajo que no lo necesita. [Grupos de mensajes en SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagegroupid-property.html)

Para el ejemplo, agruparía por una entidad solo si sus operaciones realmente deben ejecutarse en secuencia. El identificador del cliente o de la cuenta no debería convertirse en grupo por costumbre.

`MessageDeduplicationId` ayuda a evitar envíos duplicados dentro de la ventana de deduplicación de FIFO, que es de cinco minutos. No es una garantía ilimitada de unicidad de ejecución. [Deduplicación de FIFO](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html)

Un mensaje ilustrativo podría tener este cuerpo:

```json
{
  "schemaVersion": 1,
  "executionId": "7f91-example",
  "correlationId": "request-example"
}
```

Los parámetros del informe vivirían en la ejecución persistida. Eso evita transportar credenciales o copiar un payload grande en cada reintento.

## La idempotencia tiene que cubrir el efecto del trabajo

Antes de procesar, el worker necesita reclamar la ejecución de forma atómica. Si ya está completada, debería reconocer ese resultado. Si otro worker mantiene una ejecución activa, necesita una política de concurrencia y recuperación.

Un estado `running` permanente tampoco alcanza: si el worker muere, queda trabajo bloqueado. Para ese caso hacen falta vencimientos de posesión, recuperación de ejecuciones abandonadas y protección frente a un worker anterior que retoma tarde.

También importa qué hace el trabajo. En el ejemplo, generar un archivo con una clave asociada a la ejecución permite reconocer el resultado, pero hay que controlar quién puede publicar la versión final y qué ocurre si quedan archivos incompletos.

Si el efecto fuera llamar a otro servicio, necesitaría que ese servicio aceptara una identidad de operación o un mecanismo equivalente de reconciliación. Una marca en mi base no vuelve atómica una operación externa.

## Timeout y visibility timeout tienen que ser compatibles

El timeout de Lambda limita cuánto puede durar una invocación. El visibility timeout de SQS determina cuánto permanece oculto un mensaje recibido antes de poder reaparecer si no se elimina.

Si el mensaje reaparece mientras el primer intento sigue activo, puedo generar procesamiento concurrente del mismo trabajo. AWS recomienda un visibility timeout de al menos seis veces el timeout de la función, más la ventana de batching cuando se utiliza. [Configuración de la integración](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html)

Para un worker con timeout de treinta segundos y sin ventana de batching, tres minutos serían el punto de partida de esa recomendación. Después revisaría duración real, presión de reintentos y dependencias.

Si el trabajo no cabe razonablemente en una invocación, habría que dividirlo o elegir otro mecanismo de ejecución. Subir tiempos sin revisar el diseño solo posterga el límite.

## Un lote necesita comunicar qué mensajes fallaron

Por defecto, un fallo puede provocar que se vuelvan a intentar mensajes del lote que ya habían tenido éxito. `ReportBatchItemFailures` permite devolver los identificadores de los mensajes que necesitan reintento.

En FIFO, el handler debe detener el procesamiento después del primer fallo y devolver tanto ese mensaje como los posteriores no procesados. Seguir ejecutando operaciones posteriores puede romper el orden esperado. Si el handler arroja una excepción sin devolver la respuesta parcial, el lote completo se considera fallido. [Manejo de errores de Lambda con SQS](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html)

También distinguiría un fallo transitorio de uno definitivo. Un timeout de una dependencia puede merecer otro intento. Un pedido que ya sabemos inválido debería registrar su resultado final y dejar de circular, siempre que esa actualización se haya persistido correctamente.

## La DLQ necesita un recorrido de resolución

Después de agotar la política de recepciones, un mensaje puede terminar en una dead-letter queue. Eso necesita monitoreo, diagnóstico y una decisión de recuperación.

La DLQ de SQS no actualiza sola el estado de la ejecución en PostgreSQL. Hace falta reconciliar ese caso para que el usuario no vea `running` indefinidamente.

En FIFO, además, sacar un mensaje fallido hacia una DLQ permite avanzar a los posteriores. Si negocio exige una secuencia estricta aun ante fallos, hay que decidir cómo bloquear o recuperar ese grupo. AWS también señala este límite en su [documentación de dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

## El cliente consulta el proceso, no los logs

`GET /report-executions/{executionId}` debería devolver un estado de negocio y, cuando corresponda, una referencia al resultado o un error seguro para mostrar. La consulta necesita verificar que el solicitante pueda acceder a esa ejecución.

Para empezar usaría polling con espera acotada entre consultas y una política de reducir frecuencia. La vista puede dejar de consultar cuando llega a un estado terminal, cuando el usuario sale o cuando vence su espera local. Vencer esa espera no debería marcar el proceso como fallido en el servidor.

WebSockets, eventos enviados por el servidor o callbacks pueden ser alternativas según el consumidor. Cambian la entrega de novedades; la fuente de verdad del estado sigue siendo necesaria para reconectar y recuperar la situación actual.

## Qué probaría antes de darlo por terminado

| Fallo provocado | Comportamiento que esperaría |
| --- | --- |
| El cliente repite el POST | Se reconoce la misma solicitud sin crear otra ejecución. |
| El dispatcher reenvía un evento | El worker no duplica el efecto de negocio. |
| El worker se corta a mitad de camino | La ejecución puede recuperarse y conserva evidencia del intento. |
| Falla un mensaje de un lote | Se reintenta lo necesario respetando el orden definido. |
| El mensaje termina en DLQ | Hay una señal operativa y una resolución para el estado persistido. |
| El usuario vuelve más tarde | Puede consultar qué pasó sin mantener abierta la pantalla original. |

Una cola permite desacoplar tiempos y absorber trabajo pendiente. La confiabilidad aparece cuando el contrato contempla lo que pasa entre aceptar, ejecutar, fallar y recuperar.

Para mí, esa es la parte central de diseñar un proceso asíncrono: que cada interrupción tenga una salida explicable y que el resultado no dependa de haber tenido suerte con el primer intento.
