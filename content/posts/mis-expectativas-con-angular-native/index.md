---
title: Mis expectativas con Angular Native
slug: mis-expectativas-con-angular-native
excerpt: "Angular Native me interesa por la posibilidad de construir interfaces nativas desde Angular. Estas son mis expectativas, las dudas que todavía tengo y las pruebas que haría antes de elegirlo para una app real."
date: 2026-10-09
tags:
  - angular
  - angular-native
  - mobile
  - engineering
coverImage: /assets/blog/mis-expectativas-con-angular-native/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/mis-expectativas-con-angular-native
ogImage: /assets/blog/mis-expectativas-con-angular-native/og.webp
draft: false
---

Angular Native me llamó la atención bastante rápido. Trabajo con Angular y la posibilidad de llevar parte de esa forma de desarrollar a una interfaz nativa me resulta atractiva.

También me genera preguntas. Una cosa es reconocer templates, signals e inyección de dependencias. Otra es construir una app que se comporte bien cuando aparece el teclado, se pierde un permiso o el sistema decide suspenderla.

Por eso hoy me interesa hablar de expectativas. Todavía no lo estoy presentando como una herramienta que ya probé en producción ni como una decisión tomada para mis proyectos.

Lo que quiero entender es cuánto de la experiencia que valoro en Angular se conserva y qué tengo que aprender para usarla bien en mobile.

## Qué propuesta estoy mirando

Al escribir este post, el 9 de octubre de 2026, [Angular Native](https://ng-native.com/) se presenta como un proyecto independiente en alpha. No es un producto oficial del equipo de Angular ni de Google.

Su propuesta es renderizar componentes Angular como vistas nativas de iOS y Android, apoyándose en Expo y en Fabric, el renderer de React Native. Su [changelog](https://github.com/ng-native/ng-native/blob/main/CHANGELOG.md) registra la primera versión pública el 29 de septiembre de 2026.

Eso explica buena parte de mi interés: poder trabajar desde Angular y explorar una UI que se renderiza con vistas nativas.

Pero también define el contexto. Es una propuesta joven y hay varias capas técnicas involucradas. Antes de elegirla para algo importante, necesito entender cómo se desarrollan, se depuran y se actualizan juntas.

## Espero aprovechar lo que ya sé de Angular

La primera expectativa es bastante práctica: que conocer Angular reduzca la fricción al construir la app.

Me interesa poder mantener componentes con responsabilidades claras, servicios para coordinación y un manejo de estado que no me obligue a cambiar de modelo mental para cada pantalla.

También espero poder reconocer las dependencias de una feature y probar su lógica sin tener que ejecutar todo el flujo en un dispositivo para cada cambio pequeño.

Eso tiene valor porque el conocimiento de un framework incluye mucho más que escribir su sintaxis. Incluye saber cómo organizar una feature, dónde buscar un problema y qué decisiones suelen complicar el mantenimiento.

Al mismo tiempo, no esperaría trasladar cualquier componente web sin revisarlo. Una pantalla diseñada para mouse, navegador y espacio de escritorio necesita otro trabajo cuando pasa a un teléfono.

Compartir conocimientos puede ahorrar esfuerzo. La experiencia mobile sigue necesitando decisiones propias.

## Quiero entender qué cambia frente a Ionic y Capacitor

Mi referencia para desarrollar mobile con Angular incluye Ionic y Capacitor. [Capacitor](https://capacitorjs.com/docs) permite llevar una app web a plataformas nativas y acceder a capacidades del dispositivo mediante plugins.

Angular Native propone otro camino para la interfaz: vistas nativas en lugar de renderizarla dentro de una WebView. Esa diferencia me interesa, pero no alcanza por sí sola para elegir una herramienta.

Querría comparar una pantalla concreta: un listado, un formulario, navegación entre vistas y alguna interacción con el dispositivo.

Me fijaría en cosas bastante cotidianas: cómo se mueve el contenido al abrir el teclado, cómo funciona volver atrás, qué pasa con el foco y cuánto trabajo requiere respetar el comportamiento de cada plataforma.

También miraría cuánto código y cuántas excepciones necesita cada alternativa para entregar la misma experiencia. Una demo linda puede mostrar el potencial; mantener una pantalla real permite evaluar el costo.

## La prueba que me gustaría hacer es chica, pero exigente

Una app local para registrar caminatas me parece un buen ejercicio para explorarlo. Como planteé en [¿Mi app necesita un backend desde el primer día?](/blog/mi-app-necesita-un-backend-desde-el-primer-dia), empezaría por una experiencia acotada en el dispositivo.

La dividiría en pasos:

1. Navegar entre una pantalla de actividad y un historial.
2. Guardar y recuperar una actividad local.
3. Pedir ubicación y manejar el rechazo del permiso.
4. Registrar un recorrido en un teléfono Android real.
5. Evaluar qué pasa al bloquear la pantalla o interrumpir la app.

Ese último punto sería parte de la investigación. No doy por hecho que disponer de una API de ubicación resuelva seguimiento en segundo plano, permisos y restricciones de batería.

Antes de sumar fotos, notificaciones o detalles visuales, querría saber si puedo sostener el comportamiento central. Si el recorrido se pierde cuando guardo el teléfono en el bolsillo, todavía queda trabajo esencial por resolver.

## Espero poder depurar lo que se rompe

Una de las cosas que más me importa en una herramienta nueva es cómo se comporta cuando algo falla.

Quiero entender si un error viene de mi componente, del acceso a una capacidad del dispositivo, del build nativo o de una incompatibilidad entre dependencias.

También me interesa el recorrido desde el entorno de desarrollo hasta una aplicación instalada. Que funcione en una demo o en un emulador es una parte de la evaluación. Quiero poder generar un build, instalarlo y repetir el flujo en condiciones de uso reales.

La velocidad de iteración importa. La posibilidad de explicar un fallo y reproducirlo importa todavía más cuando hay que mantener el producto.

## La accesibilidad entra en la evaluación desde el principio

Que una interfaz use vistas nativas no me alcanza para asumir que ya está bien resuelta.

Probaría lectura con tecnologías de asistencia, etiquetas de botones, orden de foco y tamaños de texto. También revisaría que una acción importante sea fácil de tocar y que un estado no dependa únicamente del color.

Son detalles que una captura no permite evaluar. Prefiero incluirlos en una pantalla chica desde el principio, porque después condicionan cómo organizo componentes e interacciones.

## También quiero ver cómo evoluciona

Al estar en alpha, esperaría cambios. Lo que me interesa observar es cómo se comunican, qué tan claros son los ejemplos y cuánto cuesta actualizar una app cuando cambia alguna de las capas involucradas.

Miraría documentación, problemas abiertos y continuidad de mantenimiento. También querría saber qué camino queda cuando necesito una capacidad del dispositivo que todavía no está cubierta.

Para experimentar puedo aceptar bastante movimiento. Para elegir una base de producto necesito entender qué costo de mantenimiento estoy asumiendo.

## Qué tendría que pasar para que lo elija

Mi expectativa es poder construir una app mobile aprovechando Angular y conseguir una experiencia que se sienta bien en el dispositivo, con una base que pueda entender y mantener.

Para avanzar, querría completar esa prueba chica: navegación, persistencia, permisos, un recorrido real y un build instalable. Después vendría evaluar con más evidencia qué funciona bien y qué límites aparecen.

Hoy Angular Native me da una razón concreta para explorar. La decisión de usarlo en un producto va a depender de lo que encuentre cuando esa idea salga de la documentación y llegue al teléfono.
