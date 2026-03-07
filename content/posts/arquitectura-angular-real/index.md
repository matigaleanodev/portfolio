---
title: Cómo estructuro mis proyectos Angular (arquitectura real)
slug: arquitectura-angular-real
excerpt: "Así organizo mis proyectos Angular reales: una capa base para API, CRUD y recursos, componentes abstractos para listas y formularios, y servicios transversales para navegación, storage e i18n."
date: 2026-03-05
tags:
  - angular
  - architecture
  - ionic
  - frontend
coverImage: /assets/blog/arquitectura-angular-real/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/arquitectura-angular-real
ogImage: /assets/blog/arquitectura-angular-real/og.webp
draft: false
---

Cuando un proyecto Angular empieza a crecer, el problema no suele ser el primer módulo. El problema aparece bastante después, cuando ya vas por el sexto. Si cada feature resuelve HTTP, formularios, loading, navegación y estado a su manera, la base se vuelve inconsistente demasiado rápido.

Por eso en mis proyectos tiendo a repetir un framework interno chico: no una librería aparte, sino un conjunto de abstracciones reutilizables que me ordenan la aplicación desde el día uno.

La mejor referencia de ese enfoque hoy está en `modo-playa-admin`, con piezas complementarias que también aparecen en `foodly-notes-front`.

## 1. ApiService: un punto único para construir endpoints

La base más simple es `ApiService`.

```ts
export abstract class ApiService {
  protected _http = inject(HttpClient);
  protected _api = environment.API_URL;
  protected _ruta: string;

  protected _path(path: string = ''): string {
    return `${this._api}/${this._ruta}${path ? `/${path}` : ''}`;
  }
}
```

No hace magia. Hace algo más importante: evita que cada servicio arme URLs distinto.

## 2. CrudService: operaciones comunes sin repetir HTTP

Sobre `ApiService` monto `CrudService<T>`, que resuelve las operaciones repetidas:

- `save`
- `update`
- `delete`
- `findOne`
- `find`

Además centraliza la construcción de query params. Eso hace que cada servicio concreto herede un contrato ya estable y que la lógica de red no quede desparramada por features.

## 3. ResourceService: estado de lista, paginación y acciones

La capa que más me sirve en apps admin es `ResourceService`.

En `modo-playa-admin` está implementada con signals y concentra:

- `items`
- `page`
- `limit`
- `total`
- `loading`
- `error`
- `filters`
- `sortBy`
- `sortDirection`

También expone derivados como:

- `pagination`
- `listState`
- `totalPages`
- `hasItems`

Y métodos listos para uso real:

- `loadPage`
- `refresh`
- `setPage`
- `setLimit`
- `setFilters`
- `setSort`
- `delete`

Esto me permite que una página de listado no piense en HTTP ni en sincronizar estado. Solo consume el recurso.

## 4. BaseForm: formularios consistentes

Para formularios uso una pieza abstracta que evita reescribir el mismo flujo una y otra vez.

`BaseForm<T>` encapsula:

- `onSubmit`
- `guardar`
- `cancelar`
- generación de `FormGroup` a partir de metadata
- mapeo de validaciones

La ventaja no es solamente ahorrar líneas. La ventaja es que todos los formularios terminan comportándose igual: submit, validación, marcado de touched, persistencia y cancelación.

## 5. BaseList: una lista base de verdad

En `modo-playa-admin` también tengo una `BaseList<T>`:

```ts
export abstract class BaseList<T extends BaseEntity> {
  readonly entities = linkedSignal<T[]>(() => this.initialList());

  async onDelete(el: T) {
    const confirmed = await this._dialog.confirm(...);
    if (!confirmed) return;
    await this._service.delete(el);
  }

  editElement(el: T) {
    this._service.editElement(el);
  }
}
```

Eso deja la parte mecánica resuelta:

- confirmación de borrado
- delegación a `ResourceService`
- acciones comunes de edición y alta

Las páginas concretas se quedan con lo que realmente cambia: columnas, cards, filtros o comportamiento puntual.

## 6. NavService: navegación como servicio, no como detalle de UI

En `foodly-notes-front` encapsulé la navegación sobre `NavController` en un `NavService`.

Ese wrapper me da un lenguaje más semántico:

- `forward(path, queryParams)`
- `back()`
- `root(path)`
- `search(query)`
- `volverHome()`

No es una abstracción enorme, pero evita que cada componente conozca el detalle del router o de Ionic navigation.

## 7. LoadingService: la pieza que mantengo transversal

Aunque no siempre vive igual en todos los repos, el patrón se repite: el loading no debería quedar disperso entre componentes.

Mi criterio acá es:

- loading local si pertenece a una sola vista
- loading de recurso dentro de `ResourceService`
- loading global solo cuando hay una operación transversal o bloqueo de pantalla

En otras palabras: no me interesa tener un spinner genérico por tenerlo. Me interesa que el estado de carga tenga un dueño claro.

## 8. StorageService: persistencia simple y predecible

En `foodly-notes-front`, `StorageService` envuelve `@ionic/storage-angular` y resuelve una inicialización lazy muy concreta:

- `getItem`
- `setItem`
- `removeItem`
- `clear`

Eso evita que cada feature tenga que conocer el ciclo de vida del storage y me deja cambiar la implementación más adelante sin tocar todo.

## 9. TranslateService: i18n aplicado al producto real

También en Foodly Notes aparece un `TranslateService` propio, basado en:

- diccionarios locales
- `currentLang` como signal
- persistencia de idioma en `StorageService`
- actualización de `document.documentElement.lang`

No es un i18n académicamente perfecto. Es una solución pragmática para una app bilingüe que necesito controlar sin sobredimensionar el stack.

## Cómo baja esto a una pantalla real

La página `lodgings-list` de `modo-playa-admin` muestra bien la idea:

- extiende `BaseList<Lodging>`
- inyecta `LodgingsResourceService`
- llama `loadPage`, `refresh`, `setPage`, `setLimit`
- deja el estado visible en el recurso

Eso hace que la pantalla se enfoque en la feature y no en reimplementar infraestructura de frontend.

## Por qué me sirve este enfoque

No busco una arquitectura ultra abstracta. Busco una arquitectura que soporte crecimiento sin volverse caótica.

Este framework personal me sirve porque:

- define límites claros entre HTTP, estado y UI
- reduce duplicación en CRUDs
- vuelve consistentes listas y formularios
- me deja mezclar Angular standalone, signals e Ionic sin desorden

No siempre todas las piezas aparecen en todos los proyectos. Pero cuando un producto empieza a tener formularios, panel admin, paginación y módulos repetidos, esta estructura paga sola.
