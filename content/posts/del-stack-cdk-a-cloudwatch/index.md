---
title: "Del stack de CDK a CloudWatch: cómo sigo una ejecución en AWS"
slug: del-stack-cdk-a-cloudwatch
excerpt: "CDK define la infraestructura, CloudFormation permite ubicarla y CloudWatch ayuda a investigar su ejecución. Un recorrido por API Gateway, SQS, Lambda, configuración y logs con un ejemplo ficticio."
date: 2026-12-22
tags:
  - aws
  - cdk
  - cloudformation
  - cloudwatch
  - observability
coverImage: /assets/blog/del-stack-cdk-a-cloudwatch/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/del-stack-cdk-a-cloudwatch
ogImage: /assets/blog/del-stack-cdk-a-cloudwatch/og.webp
draft: false
---

Una infraestructura definida como código debería ayudar también cuando toca investigar un problema.

Si una API aceptó un pedido y el resultado nunca apareció, necesito ubicar la aplicación desplegada, reconocer sus recursos y seguir el recorrido de esa ejecución. Abrir servicios al azar en la consola suele gastar tiempo sin reducir demasiado la incertidumbre.

Voy a usar el mismo ejemplo ficticio de generación de informes de los posts sobre [SQS y Lambda](/blog/procesamiento-asincrono-sqs-lambda) y [estado en PostgreSQL](/blog/estado-historial-procesos-postgresql). En este caso me interesa el recorrido operativo: desde la definición en CDK hasta la evidencia de lo que pasó en AWS.

## CDK describe recursos y relaciones

En una app CDK, los constructs permiten definir recursos y componer responsabilidades. Un stack es una unidad que CDK sintetiza para desplegar mediante CloudFormation.

Antes de publicar un cambio, revisaría el contexto de cuenta, región y ambiente. Después usaría `cdk synth` para generar el template y `cdk diff` para entender qué cambia respecto del stack desplegado. `cdk deploy` ejecuta la publicación. Estos comandos están documentados en la [referencia del CLI de CDK](https://docs.aws.amazon.com/cdk/v2/guide/cli.html).

El diff merece lectura, especialmente si muestra reemplazos, cambios de permisos o modificaciones en recursos que conservan datos. Que el código compile no significa que el cambio operativo sea inocuo.

Para el ejemplo mantendría nombres de constructs que permitan reconocer la API, el dispatcher, el worker y las colas. Los nombres físicos pueden incluir sufijos generados; la relación con el recurso lógico del stack debería seguir siendo clara.

## Un fragmento de CDK tiene que explicar sus límites

Esta sería la parte que conecta una cola FIFO con un worker ya definido dentro de un stack. Los imports corresponden a CDK v2; `worker` representa una función creada con timeout de treinta segundos y un handler que devuelve la respuesta parcial correspondiente.

```typescript
import { Duration } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

const deadLetterQueue = new sqs.Queue(this, 'ReportsDeadLetterQueue', {
  fifo: true,
  retentionPeriod: Duration.days(14),
});

const reportsQueue = new sqs.Queue(this, 'ReportsQueue', {
  fifo: true,
  visibilityTimeout: Duration.minutes(3),
  deadLetterQueue: {
    queue: deadLetterQueue,
    maxReceiveCount: 5,
  },
});

worker.addEventSource(new SqsEventSource(reportsQueue, {
  batchSize: 1,
  reportBatchItemFailures: true,
}));
```

Es un fragmento para discutir esa integración, no un stack completo listo para producción. Faltan, entre otras cosas, el productor, el acceso a datos, la configuración de seguridad y las alarmas.

El batch de uno simplifica el ejemplo. Aumentarlo requiere revisar el comportamiento del handler ante fallos, especialmente para preservar orden en FIFO. La integración está representada por [`SqsEventSource`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_event_sources.SqsEventSource.html).

También hay decisiones de negocio: cinco recepciones son una política ilustrativa, no un valor universal. La DLQ permite aislar fallos, pero sacar mensajes de una secuencia ordenada puede tener consecuencias para las operaciones posteriores.

## La consola empieza por cuenta, región y stack

Para investigar, primero confirmaría que estoy en la cuenta y la región correspondientes al ambiente afectado. Parece básico, pero dos stacks con nombres parecidos en ambientes distintos pueden llevar a conclusiones bastante convincentes sobre el sistema equivocado.

Después buscaría el stack en CloudFormation. La sección de recursos permite relacionar identificadores lógicos con los recursos físicos creados. Desde ahí ubicaría la API, las funciones y las colas.

Los eventos del stack ayudan a entender un despliegue fallido o un rollback. Los outputs pueden ofrecer referencias útiles como el endpoint público. Ninguno debería usarse para exponer secretos. AWS documenta esas secciones en su [recorrido por la consola de CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-view-stack-data-resources.html).

Si un recurso fue cambiado manualmente, también revisaría esa diferencia frente a la definición versionada. Una corrección en consola necesita quedar reconciliada con el código para que el próximo deploy no restablezca una configuración anterior.

## En API Gateway verifico qué entrada estoy siguiendo

En la API revisaría el tipo de API, el stage, la ruta, el método y su integración. Me interesa comprobar que la petición llega al recurso que creo que está ejecutándose.

Si el ejemplo utiliza una REST API con usage plans, buscaría la API key en la sección correspondiente de API Gateway y comprobaría su asociación con el plan y el stage. Para obtener su valor necesito los permisos adecuados; no lo pondría en una captura, un comando compartido ni una salida de logs.

Las API keys de usage plans identifican consumidores para control de uso. AWS indica que no deben utilizarse como mecanismo de autenticación y autorización; eso requiere controles como IAM, un authorizer o Cognito según el caso. [Usage plans y API keys](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)

También revisaría cómo se identifica el pedido. Un request ID de API Gateway y un `executionId` de negocio no son necesariamente el mismo valor. La aplicación necesita conservar la relación si queremos seguir el recorrido completo.

## Configuración y secretos tienen ciclos de vida diferentes

Para este ejemplo usaría Parameter Store para configuración como un límite de tamaño o un identificador de recurso, y Secrets Manager para credenciales. Parameter Store también admite valores cifrados; la elección necesita considerar permisos, rotación y forma de consumo.

En CDK importa cuándo se resuelve un valor: durante síntesis, durante despliegue o cuando la aplicación se ejecuta. Una lectura de contexto en síntesis puede persistir información en archivos locales de contexto; no usaría ese mecanismo para traer secretos. [Valores de Parameter Store en CDK](https://docs.aws.amazon.com/cdk/v2/guide/get-ssm-value.html)

Para un secreto, preferiría pasar al runtime una referencia y conceder lectura al rol de la función que realmente lo necesita. La aplicación lo recuperaría mediante el SDK o un mecanismo equivalente, con una política de cache compatible con su rotación.

CDK también permite usar referencias a Secrets Manager en recursos compatibles durante el despliegue. Eso es distinto de leerlo en cada ejecución y no implica que una rotación actualice automáticamente cualquier consumidor. [Secrets Manager en CDK](https://docs.aws.amazon.com/cdk/v2/guide/get-secrets-manager-value.html)

Cuando falla el acceso, revisaría el nombre o ARN, la región, los permisos del rol y los permisos sobre la clave de cifrado cuando corresponde. Un valor existente no demuestra que ese runtime pueda leerlo.

## Sigo la ejecución con identificadores, no con el payload entero

Desde la Lambda asociada al stack puedo ubicar su grupo de logs y abrirlo en CloudWatch. El grupo puede estar configurado explícitamente, por lo que no dependería solo de adivinar su nombre.

Para el ejemplo registraría campos estructurados como `executionId`, `correlationId`, `attemptId`, `messageId` y un nombre de evento. Cada uno responde una pregunta distinta y permite conectar operaciones sin imprimir datos del informe.

Una búsqueda en CloudWatch Logs Insights podría empezar así, sobre los grupos y el rango horario seleccionados:

```text
fields @timestamp, @log, @logStream, event, executionId, attemptId
| filter executionId = "7f91-example"
| sort @timestamp asc
| limit 200
```

Para que esa consulta encuentre `executionId` como campo, los eventos tienen que registrarlo de forma estructurada y detectable. Imprimir objetos arbitrarios o encerrar todo en texto no ofrece el mismo contrato de observabilidad. La [referencia de Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html) describe los comandos y el descubrimiento de campos.

El resultado tampoco es una cronología perfecta: los logs pueden llegar con retraso y los relojes no reemplazan el orden de transiciones persistido en la base. Si hay más resultados que el límite, hay que acotar la consulta o paginar la investigación.

## Cuando no hay logs del worker, reviso el tramo anterior

Si la API aceptó el pedido, buscaría primero la ejecución y el evento de outbox. Si está pendiente de publicación, miraría el dispatcher.

Si fue publicado, revisaría la cola, su antigüedad de mensajes, la DLQ y el event source mapping. También si la función está limitada por concurrencia, si el mapping está habilitado y si existen permisos suficientes para consumir.

En Lambda contrastaría errores, duración, throttling y timeouts. Los logs de la aplicación pueden faltar si la ejecución ni siquiera llegó al handler, así que las métricas y la configuración también forman parte de la evidencia.

Si hay logs de finalización pero el usuario sigue viendo `running`, investigaría la confirmación del estado y la consulta que hace la API. El mensaje que dice “terminé” no demuestra por sí solo que la transacción final haya quedado confirmada.

[![Del stack a la evidencia de una ejecución](/diagrams/aws-execution-investigation.b3c856e04613.png)](/diagrams/aws-execution-investigation.html)

[Explorar el recorrido operativo en AWS](/diagrams/aws-execution-investigation.html).

## El recorrido operativo debería poder repetirse

Me interesa que alguien pueda partir de un pedido, encontrar el stack correcto y seguir su identidad a través de la API, la publicación, el worker y el estado persistido.

CDK deja definida la infraestructura. CloudFormation ayuda a reconocer lo desplegado. CloudWatch aporta evidencia de ejecución. La base conserva el resultado que necesita el producto.

Cuando esas partes se conectan con referencias claras, investigar deja de depender de recordar nombres sueltos de recursos y empieza a ser un recorrido que el equipo puede repetir y explicar.
