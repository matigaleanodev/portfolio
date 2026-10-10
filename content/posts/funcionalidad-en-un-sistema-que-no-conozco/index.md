---
title: Cómo encaro una funcionalidad en un sistema que no conozco
slug: funcionalidad-en-un-sistema-que-no-conozco
excerpt: "Antes de cambiar código en un sistema existente, necesito entender el recorrido que voy a tocar. Cómo reduzco incertidumbre, ubico dependencias y acoto una primera implementación sin intentar conocer todo el proyecto."
date: 2027-01-31
tags:
  - engineering
  - architecture
  - teamwork
  - development
coverImage: /assets/blog/funcionalidad-en-un-sistema-que-no-conozco/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/funcionalidad-en-un-sistema-que-no-conozco
ogImage: /assets/blog/funcionalidad-en-un-sistema-que-no-conozco/og.webp
draft: false
---

Llegar a un sistema existente y recibir una funcionalidad nueva tiene una dificultad bastante particular: todavía no sabés qué cosas son simples y cuáles parecen simples porque te falta contexto.

Una pantalla puede tener pocas líneas y depender de reglas que viven en otro servicio. Un nombre raro puede responder a una compatibilidad que sigue vigente. Una validación aparentemente repetida puede proteger un recorrido que todavía no viste.

Para empezar, me sirve reducir la incertidumbre alrededor del cambio concreto. Intentar entender el proyecto entero antes de tocar algo suele ser una meta demasiado amplia. Abrir el primer archivo parecido y copiarlo sin investigar tampoco me deja una base defendible.

Voy a usar un ejemplo ficticio: agregar un filtro por estado a un listado administrativo.

## Empiezo por recorrer lo que el usuario ya puede hacer

Antes de leer demasiados archivos, buscaría ejecutar el flujo actual. Cómo se entra al listado, qué filtros existen, qué muestra la tabla y qué pasa al cambiar de página.

Ese recorrido me da preguntas concretas para el código. Si el listado conserva los filtros al volver desde un detalle, necesito entender dónde guarda ese estado. Si cada filtro reinicia la paginación, el nuevo debería respetar esa relación.

También revisaría qué se espera del cambio. “Filtrar por estado” puede significar seleccionar uno, seleccionar varios o excluir ciertos resultados por defecto. La tarjetita de Jira debería permitir distinguirlo o dejar visible la pregunta pendiente.

Conocer el comportamiento actual evita que la implementación nueva resuelva el pedido y cambie otra parte del flujo sin querer.

## Sigo una petición de punta a punta

En el ejemplo, miraría qué petición obtiene el listado y cómo viajan los filtros existentes.

Después seguiría la relación entre la vista, el servicio que consulta y el contrato que devuelve la API. Me interesa ubicar quién transforma los datos, dónde se representa la carga y cómo se muestran los errores.

No necesito memorizar cada helper. Necesito poder dibujar un recorrido pequeño y correcto:

```text
Interacción con el filtro
  → actualización del criterio
  → consulta del listado
  → respuesta de la API
  → representación de resultados y estados
```

Si aparece una capa que no entiendo, intento explicar primero qué entra y qué sale. Eso suele ser más útil que leerla completa sin saber qué estoy buscando.

## Busco una implementación cercana y vigente

Un ejemplo del mismo proyecto puede ahorrar muchas decisiones, siempre que sea comparable.

Buscaría otro filtro que participe en el mismo recurso o una feature reciente con responsabilidades similares. Después contrastaría si utiliza el mismo contrato y si su organización sigue siendo la que el equipo mantiene.

Copiar el archivo más viejo que encontré puede reproducir una convención que ya se está retirando. Elegir un ejemplo demasiado sofisticado puede agregar piezas que mi cambio todavía no necesita.

Me interesa reconocer qué es una regla compartida, qué es una particularidad de esa pantalla y qué requiere preguntar antes de replicar.

## Las dependencias necesitan nombre y responsable

Si la API todavía no acepta el filtro, mi trabajo incluye una dependencia. Si los estados válidos vienen de otro catálogo, también.

Anotaría qué contrato hace falta, quién puede confirmarlo y qué parte puedo avanzar mientras se resuelve. Un mock puede permitir desarrollar la vista, pero conviene distinguir esa simulación de una integración ya verificada.

También revisaría los ambientes disponibles y los datos de prueba. Una implementación que solo pude probar con registros armados a mano puede esconder diferencias relevantes respecto del flujo real.

Hacer visible esa limitación permite pedir la ayuda adecuada. “No funciona” dice poco; “la API de test todavía no reconoce este parámetro” permite coordinar una acción concreta.

## Leo las pruebas para reconocer compromisos

Las pruebas existentes ayudan a ver qué comportamiento se considera importante: paginación, permisos, mapeo de errores o conservación del estado.

No asumiría que cubren todo el sistema ni que cada expectativa sigue vigente. Las usaría junto con la ejecución del flujo y la conversación con el equipo.

Antes de cambiar algo que parece extraño, me interesa saber qué lo protege. Si una prueba falla, quiero distinguir una regresión de una expectativa que debe actualizarse por el nuevo alcance.

Esa diferencia se vuelve mucho más fácil de explicar cuando el cambio está acotado.

## Separo el mapa del sistema de la lista de mejoras

Durante la exploración van a aparecer nombres mejorables, duplicaciones y piezas que organizaría de otra forma.

Prefiero registrarlas sin convertirlas automáticamente en parte de la tarea. Algunas pueden ser necesarias para implementar con seguridad. Otras merecen una conversación o un trabajo posterior.

Si para agregar un filtro termino cambiando la navegación, la capa HTTP y la estructura completa del listado, tengo que poder explicar por qué cada modificación era necesaria.

Entrar con una solución pequeña también facilita la revisión del equipo: quienes conocen el sistema pueden concentrarse en los puntos de integración y señalar qué contexto todavía me falta.

## Cierro el recorrido con evidencia

Para el filtro del ejemplo, verificaría que el criterio llegue a la API, que se reinicie la paginación cuando corresponde y que el resultado coincida con lo esperado. También probaría volver desde un detalle, limpiar el filtro y recibir una respuesta sin resultados.

Dejaría registradas las decisiones que no eran obvias y las limitaciones de lo que pude verificar. Si quedó una dependencia pendiente, debería poder reconocerse sin leer toda la conversación de desarrollo.

El objetivo de esta primera intervención es entregar una funcionalidad entendible y empezar a construir conocimiento del sistema con hechos concretos.

Cada cambio bien acotado deja un mapa un poco más claro para el siguiente. Así puedo ganar autonomía sin necesitar fingir que ya conozco todo el proyecto.
