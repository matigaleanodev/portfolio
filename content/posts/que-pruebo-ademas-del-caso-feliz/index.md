---
title: Qué pruebo además del caso feliz
slug: que-pruebo-ademas-del-caso-feliz
excerpt: "Una funcionalidad puede resolver el uso esperado y fallar ante datos incompletos, respuestas tardías o interacciones repetidas. Cómo elijo escenarios de prueba según sus riesgos y qué evidencia aporta cada etapa."
date: 2027-04-01
tags:
  - testing
  - engineering
  - frontend
  - quality
coverImage: /assets/blog/que-pruebo-ademas-del-caso-feliz/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/que-pruebo-ademas-del-caso-feliz
ogImage: /assets/blog/que-pruebo-ademas-del-caso-feliz/og.webp
draft: false
---

Completar el recorrido esperado es la primera evidencia de que una funcionalidad funciona. Todavía queda entender qué ocurre cuando el usuario se equivoca, los datos llegan incompletos o una dependencia responde tarde.

Esas situaciones no siempre son casos extraordinarios. Muchas forman parte del uso cotidiano de una aplicación.

Para elegir qué probar, me sirve partir del riesgo de la funcionalidad y de las fronteras que atraviesa. Un formulario local y una operación que modifica datos compartidos no necesitan exactamente la misma validación.

Voy a usar un ejemplo ficticio: editar un registro desde un listado, guardar los cambios y volver a ver el resultado.

## Empiezo por escribir qué significa que salió bien

Antes de pensar en fallos, dejaría claro el resultado esperado: qué campos se pueden modificar, quién puede hacerlo y cómo se confirma el guardado.

También qué valores deben conservarse y qué ve el usuario al volver al listado. Si el registro deja de cumplir el filtro activo después de editarlo, puede desaparecer de la tabla sin que eso sea un error.

Ese detalle merece estar definido. De otro modo, desarrollo y QA pueden interpretar de forma diferente un mismo resultado.

Los criterios de aceptación dan una base para la prueba. El análisis del riesgo ayuda a encontrar escenarios que una descripción inicial quizá no alcanzó a expresar.

## Los datos reales tienen más variedad que el ejemplo de la demo

Probaría campos opcionales vacíos, textos largos, caracteres con tildes, valores límite y registros que vienen de formatos anteriores cuando el sistema los conserva.

En el listado, miraría cero resultados, una sola fila y una página completa. En un selector, qué pasa si el valor guardado ya no está disponible entre las opciones actuales.

El objetivo es comprobar que la aplicación trata esas diferencias de una manera definida. Mostrar “undefined” en una pantalla suele indicar que asumimos más de lo que el contrato garantizaba.

Si falta una regla sobre un caso, lo llevaría a una conversación. Convertir cualquier valor inesperado en un default silencioso puede ocultar un problema de datos que necesita otra resolución.

## El tiempo cambia el comportamiento de una pantalla

Una consulta rápida puede esconder errores que aparecen cuando tarda.

Probaría abrir el formulario con carga lenta, cambiar una selección antes de que termine una consulta y recibir respuestas en un orden distinto del de las interacciones.

Si el usuario abandona una pantalla, la respuesta posterior no debería modificar otra vista de forma accidental. Si vuelve a entrar, debería recuperar un estado coherente con el recorrido definido.

También miraría la finalización de cada estado de carga. Un fallo no debería dejar un botón bloqueado indefinidamente ni convertir un error de conexión en una pantalla vacía que parece un resultado válido.

## Las interacciones repetidas revelan compromisos del backend

Dos clics sobre guardar pueden iniciar dos peticiones. Volver a intentar después de perder una respuesta puede repetir una operación que ya se completó.

La interfaz puede reducir interacciones duplicadas mientras envía, pero la operación del servidor necesita definir qué ocurre si recibe solicitudes repetidas.

En el ejemplo de edición, también probaría dos sesiones modificando el mismo registro. El producto tiene que decidir si acepta la última escritura o detecta un conflicto. La prueba verifica ese contrato; no debería elegirlo por accidente.

Si hay control de versiones mediante ETags e `If-Match`, una precondición incumplida puede representarse con `412 Precondition Failed`, según la [semántica de HTTP](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1). Es una alternativa concreta, no una obligación para todos los formularios.

## Los permisos se verifican en más de un lugar

Ocultar una acción puede orientar la experiencia, pero necesito comprobar qué hace la API cuando recibe un pedido de alguien sin acceso.

También probaría que una persona no pueda consultar o modificar un registro ajeno cambiando un identificador. La existencia del recurso y su visibilidad son decisiones que el contrato debe manejar de forma consistente.

Para el frontend importa cómo se representa un acceso perdido durante una sesión. Quizás la pantalla se abrió correctamente y el permiso cambió antes del guardado.

Ese escenario pide una respuesta útil y una forma segura de continuar, sin afirmar que los cambios quedaron guardados cuando la operación fue rechazada.

## Desarrollo y QA aportan evidencias complementarias

En [el flujo de trabajo de mi equipo](/blog/del-pedido-de-negocio-a-la-review), desarrollo finalizado significa código completo, probado en desarrollo y que cumple los criterios de aceptación de la tarea.

Después, el equipo de QA inspecciona en el entorno de release. Además de los casos de uso, estresa flujos para evaluar volumen, tiempos de respuesta y performance.

Esa separación ayuda a contrastar el comportamiento en otro entorno y con otra profundidad de prueba. Para que aporte valor, conviene comunicar qué se cambió, qué se verificó y qué limitaciones quedaron durante desarrollo.

Si una prueba de volumen muestra una demora, hace falta registrar cantidad de datos, condiciones y tiempo observado. “Está lento” señala una percepción; una medición reproducible permite investigar.

## Elijo qué automatizar según lo que necesito proteger

Una regla de transformación estable puede probarse de forma aislada. Un contrato con la API necesita verificar esa frontera. Un recorrido crítico puede justificar una prueba que atraviese la interfaz completa.

No todos los escenarios deben duplicarse en todos los niveles. Me interesa que una prueba falle por una razón entendible y que el equipo pueda mantenerla cuando cambia el producto.

Las exploraciones manuales también aportan, especialmente cuando hay que evaluar claridad de mensajes, recuperación y combinaciones que todavía estamos descubriendo.

La elección tiene que responder a un riesgo concreto. Acumular pruebas que repiten la implementación no garantiza que hayamos cubierto el comportamiento que importa.

## La evidencia debería permitir repetir la prueba

Dejaría registrado el entorno, los datos relevantes, los pasos y el resultado observado, sin copiar información sensible. Si un comportamiento depende del tiempo o del volumen, también esas condiciones.

Cuando aparece un fallo, esa información reduce el recorrido para reproducirlo. Cuando todo funciona, permite saber qué cubre realmente la validación.

Para mí, salir del caso feliz significa tomar en serio las condiciones en las que vive la funcionalidad. El resultado esperado importa, pero también cómo se recupera el usuario cuando el recorrido deja de ser el de la demo.
