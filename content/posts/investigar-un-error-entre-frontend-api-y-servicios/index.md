---
title: Cómo investigo un error que cruza frontend, API y servicios
slug: investigar-un-error-entre-frontend-api-y-servicios
excerpt: "Un síntoma en pantalla puede tener causas en distintas capas. Cómo reconstruyo el recorrido, separo hechos de hipótesis y dejo evidencia para que la investigación pueda continuar en equipo."
date: 2027-04-21
tags:
  - debugging
  - engineering
  - observability
  - backend
  - frontend
coverImage: /assets/blog/investigar-un-error-entre-frontend-api-y-servicios/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/investigar-un-error-entre-frontend-api-y-servicios
ogImage: /assets/blog/investigar-un-error-entre-frontend-api-y-servicios/og.webp
draft: false
---

Cuando una persona dice que una pantalla “no funciona”, todavía tenemos un síntoma que necesita precisión.

Puede haber una respuesta rechazada, un dato inesperado, una transformación equivocada o un error al representar el resultado. La primera capa donde se ve el problema no siempre es la que lo origina.

Para investigar, intento construir una explicación con hechos que pueda contrastar. Eso evita que la conversación se convierta demasiado pronto en “es de frontend” o “es de backend”.

Voy a usar un caso ficticio: un listado que muestra un mensaje de error al buscar registros dentro de un período.

## Primero delimito qué está ocurriendo

Buscaría los pasos, el ambiente, el horario y el alcance conocido. Qué se esperaba, qué apareció y si ocurre siempre o bajo ciertas condiciones.

También si afecta a todos los usuarios, a determinados datos o a una sola combinación de filtros. Esa diferencia puede reducir mucho el espacio de búsqueda.

Una captura ayuda a entender el síntoma, pero todavía necesito reproducirlo o conseguir evidencia de la operación que falló. Si no puedo reproducirlo, lo dejaría explícito en vez de reemplazar el caso por otro parecido.

En una incidencia real también hay que atender el impacto. Investigar la causa y buscar una mitigación pueden ser trabajos paralelos, con sus decisiones visibles.

## Separo lo observado de lo que sospecho

“La búsqueda devolvió un error después de ocho segundos” es una observación. “La base no tiene índice” es una hipótesis.

La hipótesis puede ser razonable, pero necesita evidencia. Si la escribo como un hecho, las siguientes personas pueden empezar a investigar únicamente esa explicación.

Me sirve mantener una lista pequeña de posibilidades y qué dato permitiría confirmar o descartar cada una. Así una búsqueda de logs tiene una pregunta concreta, en lugar de ser un recorrido abierto por todo lo que parece relacionado.

También registro qué ya se descartó y por qué. Evita repetir la misma investigación cuando participa otro equipo.

## En el navegador, sigo la petición que corresponde al síntoma

Miraría si la interacción realmente dispara una petición, qué método y ruta usa, cómo viajan los filtros y qué respuesta recibe.

En el ejemplo del período, compararía fechas, zona horaria y formato con una búsqueda que sí funciona. También revisaría si la pantalla está mostrando el error de esa petición o de otra operación ejecutada en paralelo.

Un estado HTTP exitoso no demuestra que la UI pueda interpretar el payload. Puede haber una estructura inesperada, un valor ausente o una transformación que asume otra cosa.

Si no se envió ninguna petición, la investigación empieza antes: evento, validación, estado local o navegación. No necesito abrir logs de un servicio que todavía no recibió trabajo.

## Después ubico las fronteras del recorrido

La petición puede atravesar un gateway, una API y un servicio dependiente. Me interesa saber dónde termina cada responsabilidad y qué identidad permite conectar las operaciones.

Un identificador de correlación ayuda cuando se conserva a través de las capas. Un request ID generado en una de ellas puede necesitar una relación explícita con el siguiente.

Para comparar registros, usaría el ambiente y un rango horario acotado. También revisaría las zonas horarias: dos marcas de tiempo distintas pueden representar el mismo instante.

Si el problema incluye procesamiento asíncrono, sumaría la identidad de la ejecución y sus intentos. El recorrido ya no coincide necesariamente con la duración de la petición original.

[![Investigar desde el síntoma hasta la evidencia](/diagrams/cross-layer-diagnosis.43e7f76a5818.png)](/diagrams/cross-layer-diagnosis.html)

[Explorar el flujo de diagnóstico entre capas](/diagrams/cross-layer-diagnosis.html).

## Comparo qué recibió y qué devolvió cada parte

En cada frontera intentaría responder: ¿llegó el pedido esperado?, ¿qué operación se intentó?, ¿qué resultado se obtuvo? y ¿cómo se comunicó al siguiente consumidor?

Puede ocurrir que una dependencia responda con un rechazo definido y la API lo transforme en un error genérico. O que el backend devuelva información correcta y el frontend la interprete con un formato de fecha distinto.

El objetivo es encontrar dónde se separa el comportamiento observado del esperado. Después viene explicar la causa y decidir dónde corresponde corregirla.

Para seguir una ejecución en AWS usaría el recorrido que describí en [el post de CDK y CloudWatch](/blog/del-stack-cdk-a-cloudwatch). Acá el punto central es que cada consulta de evidencia responda una hipótesis.

## Pido ayuda con un recorte útil

En un equipo compartido, puede haber capas a las que no tengo acceso o que mantiene otro sector.

Para pedir colaboración, compartiría el síntoma, los pasos, el ambiente, el horario y los identificadores permitidos. También qué verifiqué y qué pregunta concreta necesito responder.

“¿Pueden mirar por qué falla?” deja mucho trabajo de reconstrucción. “Esta petición llegó a la API y el llamado a esta dependencia terminó con este resultado; necesitamos confirmar qué validación se aplicó” permite continuar desde una frontera identificada.

No hace falta pegar un payload entero si contiene datos personales o credenciales. Conviene conservar la evidencia necesaria con el tratamiento que corresponda y usar ejemplos recortados para la conversación.

## Una hipótesis mejora cuando puedo provocar su condición

Si sospecho del rango de fechas, probaría variantes controladas en un entorno adecuado: un día, un período mayor, un límite de mes o datos vacíos.

Cambiar varias condiciones al mismo tiempo puede hacer desaparecer el síntoma sin explicar qué lo produjo. Prefiero modificar una variable relevante y comparar el resultado.

Cuando encuentro una causa, intento construir una reproducción pequeña que permita verificar la corrección. Esa reproducción también ayuda a elegir qué prueba de regresión aporta valor.

Una correlación temporal con un deploy puede orientar la búsqueda, pero todavía hay que conectar el cambio con el comportamiento. Que dos cosas ocurran cerca no alcanza para cerrar la causa.

## La resolución necesita volver al síntoma original

Después de corregir, repetiría el escenario que abrió la investigación y los casos cercanos que puedan haberse afectado.

También confirmaría el ambiente y la versión que se está verificando. Una corrección en desarrollo todavía no demuestra que el usuario de producción esté usando ese cambio.

Dejaría una explicación breve del origen, la solución, la evidencia y lo que sigue pendiente. Si solo se mitigó el impacto, debería quedar distinguido de una causa resuelta.

Una investigación útil permite que el siguiente integrante del equipo entienda por qué llegamos a esa conclusión. Esa continuidad vale tanto como encontrar el archivo donde finalmente hubo que cambiar código.
