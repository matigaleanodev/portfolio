---
title: Cómo modelo el estado y el historial de un proceso asíncrono en PostgreSQL
slug: estado-historial-procesos-postgresql
excerpt: "Tipo de proceso, ejecución, estado actual e historial cumplen responsabilidades distintas. Un modelo en PostgreSQL para seguir trabajo asíncrono, controlar transiciones y conservar evidencia de sus intentos."
date: 2026-12-02
tags:
  - postgresql
  - backend
  - architecture
  - async
coverImage: /assets/blog/estado-historial-procesos-postgresql/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/estado-historial-procesos-postgresql
ogImage: /assets/blog/estado-historial-procesos-postgresql/og.webp
draft: false
---

Un proceso asíncrono puede seguir trabajando cuando la petición HTTP ya terminó y el usuario cerró la pantalla.

Para explicar qué ocurrió, necesito una representación persistida del trabajo. Un mensaje en una cola describe algo que debe procesarse. Un log describe algo que una parte del sistema observó. Ninguno reemplaza por sí solo el estado que el producto necesita consultar.

Voy a continuar con el ejemplo ficticio de [generación de informes con SQS y Lambda](/blog/procesamiento-asincrono-sqs-lambda). El objetivo es diseñar un modelo pequeño en PostgreSQL que permita responder qué se pidió, dónde está cada ejecución y cómo llegó a su situación actual.

## Tipo de proceso y ejecución son entidades diferentes

`report-generation` puede ser un tipo de proceso. Cada pedido concreto para generar un informe es una ejecución de ese tipo.

Esa separación evita que una misma fila intente representar tanto la definición de una capacidad como todas las veces que se usó.

En un sistema que habla de features, antes de crear tablas como `feature_status` revisaría qué significa `feature`: una funcionalidad disponible, una configuración o un trabajo concreto en curso. El nombre tiene que ayudar a distinguir esas responsabilidades.

Para este ejemplo usaría `process_type`, `process_execution`, `process_status` y `process_status_log`. El vocabulario describe el caso ficticio; no reproduce un esquema laboral.

## El estado actual responde la consulta habitual

Para mostrar un listado, quiero saber cuáles están pendientes, cuáles están ejecutándose y cuáles terminaron. No debería tener que reconstruir todo el historial cada vez que alguien abre una pantalla.

Guardaría el estado actual en la ejecución. Como vocabulario inicial elegiría:

| Estado | Significado |
| --- | --- |
| `pending` | El trabajo está persistido y espera procesamiento, incluida una eventual publicación pendiente en la outbox. |
| `running` | Un worker reclamó la ejecución y mantiene una posesión temporal. |
| `succeeded` | El resultado quedó disponible de forma confirmada. |
| `failed` | La ejecución terminó sin poder completar el trabajo. |

Un intento que falla de forma transitoria no necesita convertir inmediatamente la ejecución en `failed`. Todavía puede existir una recuperación pendiente. El intento y el resultado final tienen vidas distintas.

## Un esquema inicial puede ser explícito sin volverse enorme

Este fragmento define las relaciones principales. Es un esquema ilustrativo, no una migración completa de un producto:

```sql
CREATE TABLE process_type (
  code text PRIMARY KEY
);

CREATE TABLE process_status (
  code text PRIMARY KEY
);

INSERT INTO process_type (code) VALUES ('report-generation');
INSERT INTO process_status (code)
VALUES ('pending'), ('running'), ('succeeded'), ('failed');

CREATE TABLE process_execution (
  id uuid PRIMARY KEY,
  type_code text NOT NULL REFERENCES process_type (code),
  owner_id uuid NOT NULL,
  status_code text NOT NULL REFERENCES process_status (code),
  request_key text NOT NULL,
  request_fingerprint text NOT NULL,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  lease_token uuid,
  lease_until timestamptz,
  result_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, type_code, request_key),
  CHECK ((lease_token IS NULL) = (lease_until IS NULL)),
  CHECK ((status_code = 'running') = (lease_token IS NOT NULL)),
  CHECK (status_code <> 'succeeded' OR result_key IS NOT NULL)
);

CREATE TABLE process_status_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  execution_id uuid NOT NULL REFERENCES process_execution (id),
  from_status_code text REFERENCES process_status (code),
  to_status_code text NOT NULL REFERENCES process_status (code),
  execution_version bigint NOT NULL CHECK (execution_version >= 0),
  reason_code text NOT NULL,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (execution_id, execution_version)
);
```

La unicidad de la solicitud queda acotada por dueño y tipo. El fingerprint permite que la aplicación compare el contenido cuando se repite una clave. La restricción impide duplicar la identidad; todavía hace falta implementar la respuesta ante el conflicto.

Las claves foráneas y los `CHECK` protegen relaciones e invariantes de una fila, como documenta [PostgreSQL sobre restricciones](https://www.postgresql.org/docs/current/ddl-constraints.html). No describen por sí solos toda la máquina de estados.

Un catálogo de estados sirve si necesito referencias o metadata compartida. Para un caso más pequeño, un `CHECK` sobre códigos también puede alcanzar. No elegiría una tabla adicional únicamente porque el nombre parece más arquitectónico.

## Estado e historial deberían confirmarse juntos

Si actualizo la ejecución y después inserto el historial fuera de una transacción, puedo terminar con un estado sin explicación. Si hago lo contrario, puedo registrar una transición que nunca se aplicó.

Para una transición puntual, un CTE permite actualizar y registrar dentro de una misma sentencia:

```sql
WITH changed AS (
  UPDATE process_execution
  SET status_code = 'running',
      version = version + 1,
      lease_token = $2::uuid,
      lease_until = now() + interval '2 minutes',
      updated_at = now()
  WHERE id = $1::uuid
    AND status_code = 'pending'
  RETURNING id, version
)
INSERT INTO process_status_log (
  execution_id, from_status_code, to_status_code,
  execution_version, reason_code, actor
)
SELECT id, 'pending', 'running', version, 'worker-claimed', $3
FROM changed
RETURNING execution_id, execution_version;
```

`$1` identifica la ejecución; `$2` es un token nuevo para ese intento; `$3` identifica al worker de forma operativa. El plazo de dos minutos es ilustrativo: debe ser compatible con la duración del trabajo y su política de renovación.

Si no devuelve filas, el worker no ganó esa transición. No debería continuar como si hubiera adquirido el trabajo.

La actualización condicional se apoya en el comportamiento de concurrencia de PostgreSQL. Bajo el aislamiento habitual `READ COMMITTED`, una actualización concurrente espera y vuelve a evaluar la condición sobre la fila actualizada. En aislamientos más estrictos también hay que contemplar errores de serialización. [Aislamiento de transacciones](https://www.postgresql.org/docs/current/transaction-iso.html)

## Recuperar una ejecución requiere distinguir al dueño vigente

Si un worker muere, su lease permite reconocer que la posesión venció. Otro intento puede reclamar el trabajo mediante una actualización condicional y un token nuevo, dejando registrada la recuperación.

El worker anterior podría volver tarde. Para completar la ejecución, tendría que demostrar que conserva el token vigente y una lease válida. Si ya perdió la posesión, su actualización final debería afectar cero filas.

Eso protege el estado de esta base. Para proteger efectos externos, necesito controles equivalentes: idempotencia en el servicio llamado, resultados asociados al intento o un mecanismo de publicación que rechace resultados de un dueño anterior.

También definiría qué estados permiten recuperación. Un proceso completado no debería volver a `pending` por una actualización genérica. Si negocio solicita otra ejecución, crear otra identidad suele dejar una historia más clara.

[![Estados persistidos de una ejecución](/diagrams/process-execution-states.7433572ce296.png)](/diagrams/process-execution-states.html)

[Explorar los estados y la recuperación de una ejecución](/diagrams/process-execution-states.html).

## El historial de estados no reemplaza el historial de intentos

Una transición explica un cambio de situación. Un intento puede empezar, fallar y dejar el proceso todavía recuperable sin que haya cambiado su estado público.

Si necesito ese nivel de diagnóstico, agregaría `process_attempt` con identidad del intento, tiempos, resultado y un código de error. Esa tabla tendría una responsabilidad distinta de `process_status_log`.

El detalle técnico extenso puede quedar en logs correlacionados. En la base guardaría códigos estables y referencias que ayuden a encontrarlos. Evitaría convertir el historial en un depósito de stack traces, payloads completos o información sensible.

## Consultar también forma parte del diseño

Para un listado por usuario, usaría paginación y un orden estable. Un índice podría acompañar esa consulta:

```sql
CREATE INDEX process_execution_owner_created_idx
  ON process_execution (owner_id, created_at DESC, id DESC);
```

Para leer el historial de una ejecución en orden de versión, la restricción única sobre `(execution_id, execution_version)` ya ofrece un índice que puede recorrerse en ambos sentidos. PostgreSQL explica ese comportamiento en su [documentación de índices y ordenamiento](https://www.postgresql.org/docs/current/indexes-ordering.html). No agregaría otro índice equivalente sin una necesidad que lo justifique.

Revisaría por separado la consulta de recuperación de leases vencidas y la de seguimiento operativo. Un índice útil para un listado de usuario no necesariamente ayuda a encontrar trabajo abandonado.

El filtro por dueño también debe formar parte de la autorización de la API. Conocer un UUID no implica tener permiso para consultar su ejecución.

## Qué historia debería poder contar la base

Al consultar una ejecución, quiero distinguir el pedido original, su estado actual, las transiciones y los intentos que hicieron falta.

Para conseguirlo, la creación de la ejecución, su primer registro de historial y el evento de outbox deberían confirmarse juntos. Las transiciones posteriores necesitan mantener esa misma coherencia entre estado y evidencia.

Este modelo todavía requiere implementar permisos, recuperación, retención de datos y la lógica del worker. Tener cuatro tablas no resuelve esas responsabilidades automáticamente.

Lo que sí ofrece es un lugar claro para sostenerlas. Cuando alguien pregunta qué pasó con un trabajo, el sistema puede responder a partir de hechos persistidos, en vez de reconstruir una suposición con el último mensaje de log que quedó disponible.
