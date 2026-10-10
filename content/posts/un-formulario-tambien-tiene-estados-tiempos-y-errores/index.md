---
title: Un formulario también tiene estados, tiempos y errores
slug: un-formulario-tambien-tiene-estados-tiempos-y-errores
excerpt: "Cargar datos, editar, validar, guardar y recuperarse de un fallo son partes del mismo recorrido. Cómo pienso formularios que conservan el trabajo del usuario y comunican lo que está pasando."
date: 2027-05-11
tags:
  - angular
  - frontend
  - ux
  - engineering
coverImage: /assets/blog/un-formulario-tambien-tiene-estados-tiempos-y-errores/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/un-formulario-tambien-tiene-estados-tiempos-y-errores
ogImage: /assets/blog/un-formulario-tambien-tiene-estados-tiempos-y-errores/og.webp
draft: false
---

Un formulario parece terminado cuando los campos están alineados, las validaciones aparecen y el botón guarda.

El recorrido real suele tener más momentos: esperar datos, corregir un valor, recibir un error del servidor, salir sin querer o volver a intentar después de perder conexión.

Cuando esos estados quedan implícitos, la persona termina interpretando qué pasó a partir de botones que cambian, mensajes genéricos y valores que desaparecieron.

Me interesa pensar el formulario como una interacción completa. Para hacerlo concreto, voy a usar un ejemplo ficticio de edición de un registro con datos iniciales, campos obligatorios y una selección que depende de un catálogo.

## Cargar el formulario también es parte de la experiencia

Antes de editar, la pantalla necesita obtener el registro y las opciones de algunos controles.

Hay que decidir cuándo se puede empezar a trabajar. Si el formulario aparece vacío y después la respuesta pisa lo que la persona escribió, la carga ya está destruyendo trabajo del usuario.

En una edición, prefiero que se distinga claramente el momento de preparación. Si una parte puede editarse antes, necesito proteger los cambios locales frente a respuestas tardías.

También revisaría el caso donde falla el catálogo, pero el registro sí llegó. Ese fallo tiene otra recuperación que no encontrar el registro. Mostrar el mismo error para ambos pierde información útil.

## El valor actual necesita un dueño claro

En Angular, el modelo del formulario permite concentrar valores y estado de los controles. Con Reactive Forms, APIs como `FormControl` y `FormGroup` hacen explícita esa estructura, según la [documentación de formularios reactivos](https://angular.dev/guide/forms/reactive-forms).

La herramienta elegida debería seguir las convenciones y la versión del proyecto. Lo que quiero evitar es mantener copias independientes del mismo valor en el control, una propiedad del componente y un servicio, con sincronizaciones difíciles de seguir.

También distinguiría los datos recibidos, la edición actual y el payload que se envía. Pueden estar relacionados sin ser exactamente la misma estructura.

Una fecha mostrada para editar puede necesitar una representación diferente en el contrato. Esa transformación merece un lugar claro y una regla verificable.

## La validación local orienta; el servidor conserva sus reglas

Una validación en la pantalla puede ayudar a corregir rápido un campo obligatorio o un formato inválido.

El servidor también necesita verificar el pedido. La UI puede estar desactualizada, otra operación puede haber cambiado los datos y el endpoint puede recibir solicitudes de otros consumidores.

Por eso prepararía la vista para errores de campo y errores generales. Si una regla depende de la combinación de valores, forzar el mensaje debajo de un único input puede confundir sobre qué hay que corregir.

También importa cuándo mostrarlo. Llenar la pantalla de errores antes de que la persona interactúe puede hacer que el formulario parezca roto desde el comienzo.

Prefiero que el mensaje explique el problema y la acción disponible, conservando el trabajo que ya se hizo.

## Guardar necesita una identidad de lo que se envió

Durante el guardado, el usuario puede seguir editando si la interfaz lo permite. Entonces hay que distinguir la versión enviada del contenido que ahora ve en pantalla.

Una respuesta exitosa para el envío anterior no debería marcar como guardados cambios que se hicieron después. Para un formulario pequeño, bloquear temporalmente la edición puede simplificar ese contrato. Para otro producto, puede ser mejor permitirla y llevar un control explícito.

Lo importante es que la decisión sea deliberada y que el mensaje de confirmación corresponda a los datos efectivamente persistidos.

También evitaría que la respuesta vuelva a cargar todo el formulario y borre una edición posterior sin explicación.

## El doble envío necesita atención en ambos lados

Deshabilitar la acción mientras se envía reduce clics repetidos en esa pantalla. No cubre dos pestañas, un cliente distinto o un reintento después de perder una respuesta.

Si la operación crea algo que no debería duplicarse, la API necesita definir cómo reconoce solicitudes repetidas. Si edita un registro compartido, necesita definir qué hace frente a cambios concurrentes.

Una escritura puede haberse completado aunque la respuesta no llegue al navegador. En ese caso, “falló la conexión” y “no se guardó” no son afirmaciones equivalentes.

La recuperación debería apoyarse en el contrato del servidor y permitir verificar el resultado sin generar una segunda operación por accidente.

## Los valores ausentes y deshabilitados merecen una regla

En un formulario de edición puede haber campos que la persona ve pero no puede modificar.

Con Reactive Forms, los controles deshabilitados pueden quedar fuera del valor agregado habitual del grupo; `getRawValue()` permite obtenerlos también. Esa diferencia está documentada por Angular en [formularios estrictamente tipados](https://angular.dev/guide/forms/typed-forms).

No elegiría una de esas lecturas de manera automática. El contrato debería decir qué campos se envían y qué valores conserva el servidor.

Lo mismo pasa con `null`, una cadena vacía y un campo omitido. Pueden significar cosas distintas: limpiar un valor, guardar texto vacío o conservar el dato anterior.

Si esa semántica no está definida, un formulario que parece correcto puede borrar información durante una edición parcial.

## Un error no debería obligar a empezar de nuevo

Si el servidor rechaza el guardado, conservaría los valores que la persona estaba intentando enviar, con la explicación que permita continuar.

Si se venció la sesión, hace falta pensar cómo retoma el recorrido después de autenticarse. Si hay un conflicto de edición, cómo compara o recupera su trabajo frente a los datos actuales.

Guardar un borrador local puede ayudar en ciertos productos, pero requiere decidir qué datos se pueden persistir en ese dispositivo, cuánto duran y cómo se eliminan. No lo agregaría de manera indiscriminada a cualquier formulario.

La recuperación es una decisión de producto y de tratamiento de datos, además de una implementación frontend.

[![Un formulario: edición, guardado y recuperación](/diagrams/form-editing-states.3cedb8d66583.png)](/diagrams/form-editing-states.html)

[Explorar los estados de edición y guardado](/diagrams/form-editing-states.html).

## Salir también necesita un comportamiento acordado

Si existen cambios sin guardar, la navegación debería tener una política clara. Puede pedir confirmación, ofrecer descartar o conservar un borrador, según el flujo.

Esa política no debería depender únicamente de que un control haya sido tocado. Conviene distinguir interacción de una diferencia efectiva respecto de los datos guardados.

También probaría volver atrás, cerrar un modal y navegar por una acción interna. El mismo trabajo no debería quedar protegido en un recorrido y perderse silenciosamente en otro.

Para completar la experiencia, revisaría foco, etiquetas y ubicación de mensajes. Cuando hay un error, la persona necesita poder encontrarlo y relacionarlo con lo que estaba haciendo.

## El formulario termina cuando el recorrido se entiende

Probaría carga lenta, datos incompletos, rechazo del servidor, respuesta perdida, doble envío y salida con cambios. También confirmaría qué ocurre después de guardar: permanecer, volver al listado o seguir con otra operación.

Cada decisión debería conservar una relación clara entre lo que la persona ve, lo que envió y lo que el sistema confirmó.

Para mí, un buen formulario cuida esa continuidad. Los campos son la parte visible; sostener el trabajo del usuario a través de la espera y los errores es una parte central de que la funcionalidad esté realmente resuelta.
