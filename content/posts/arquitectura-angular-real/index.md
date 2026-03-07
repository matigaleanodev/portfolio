---
title: Como estructuro mis proyectos Angular (arquitectura real)
slug: arquitectura-angular-real
excerpt: "Asi organizo mis proyectos Angular reales: una capa base para API, CRUD y recursos, componentes abstractos para listas y formularios, y servicios transversales para navegacion, storage e i18n."
date: 2026-03-07
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

Cuando un proyecto Angular empieza a crecer, el problema no suele ser el primer modulo. El problema es el sexto. Si cada feature resuelve HTTP, formularios, loading, navegacion y estado a su manera, la base se vuelve inconsistente demasiado rapido.

Por eso en mis proyectos tiendo a repetir un framework interno chico: no una libreria aparte, sino un conjunto de abstracciones reutilizables que me ordenan la aplicacion desde el dia uno.

La mejor referencia de ese enfoque hoy esta en `modo-playa-admin`, con piezas complementarias que tambien aparecen en `foodly-notes-front`.

## 1. ApiService: un punto unico para construir endpoints

La base mas simple es `ApiService`.

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

No hace magia. Hace algo mas importante: evita que cada servicio arme URLs distinto.

## 2. CrudService: operaciones comunes sin repetir HTTP

Sobre `ApiService` monto `CrudService<T>`, que resuelve las operaciones repetidas:

- `save`
- `update`
- `delete`
- `findOne`
- `find`

Ademas centraliza la construccion de query params. Eso hace que cada servicio concreto herede un contrato ya estable y que la logica de red no quede desperdigada por features.

## 3. ResourceService: estado de lista, paginacion y acciones

La capa que mas me sirve en apps admin es `ResourceService`.

En `modo-playa-admin` esta implementada con signals y concentra:

- `items`
- `page`
- `limit`
- `total`
- `loading`
- `error`
- `filters`
- `sortBy`
- `sortDirection`

Tambien expone derivados como:

- `pagination`
- `listState`
- `totalPages`
- `hasItems`

Y metodos listos para uso real:

- `loadPage`
- `refresh`
- `setPage`
- `setLimit`
- `setFilters`
- `setSort`
- `delete`

Esto me permite que una pagina de listado no piense en HTTP ni en sincronizar estado. Solo consume el recurso.

## 4. BaseForm: formularios consistentes

Para formularios uso una pieza abstracta que evita reescribir el mismo flujo una y otra vez.

`BaseForm<T>` encapsula:

- `onSubmit`
- `guardar`
- `cancelar`
- generacion de `FormGroup` a partir de metadata
- mapeo de validaciones

La ventaja no es solamente ahorrar lineas. La ventaja es que todos los formularios terminan comportandose igual: submit, validacion, marcado de touched, persistencia y cancelacion.

## 5. BaseList: una lista base de verdad

En `modo-playa-admin` tambien tengo una `BaseList<T>`:

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

Eso deja la parte mecanica resuelta:

- confirmacion de borrado
- delegacion a `ResourceService`
- acciones comunes de edicion y alta

Las paginas concretas se quedan con lo que realmente cambia: columnas, cards, filtros o comportamiento puntual.

## 6. NavService: navegacion como servicio, no como detalle de UI

En `foodly-notes-front` encapsule la navegacion sobre `NavController` en un `NavService`.

Ese wrapper me da un lenguaje mas semantico:

- `forward(path, queryParams)`
- `back()`
- `root(path)`
- `search(query)`
- `volverHome()`

No es una abstraccion enorme, pero evita que cada componente conozca el detalle del router o de Ionic navigation.

## 7. LoadingService: la pieza que mantengo transversal

Aunque no siempre vive igual en todos los repos, el patron se repite: el loading no deberia quedar disperso entre componentes.

Mi criterio aca es:

- loading local si pertenece a una sola vista
- loading de recurso dentro de `ResourceService`
- loading global solo cuando hay una operacion transversal o bloqueo de pantalla

En otras palabras: no me interesa tener un spinner generico por tenerlo. Me interesa que el estado de carga tenga dueño claro.

## 8. StorageService: persistencia simple y predecible

En `foodly-notes-front`, `StorageService` envuelve `@ionic/storage-angular` y resuelve una inicializacion lazy muy concreta:

- `getItem`
- `setItem`
- `removeItem`
- `clear`

Eso evita que cada feature tenga que conocer el ciclo de vida del storage y me deja cambiar la implementacion mas adelante sin tocar todo.

## 9. TranslateService: i18n aplicado al producto real

Tambien en Foodly Notes aparece un `TranslateService` propio, basado en:

- diccionarios locales
- `currentLang` como signal
- persistencia de idioma en `StorageService`
- actualizacion de `document.documentElement.lang`

No es un i18n academicamente perfecto. Es una solucion pragmatica para una app bilingue que necesito controlar sin sobredimensionar el stack.

## Como baja esto a una pantalla real

La pagina `lodgings-list` de `modo-playa-admin` muestra bien la idea:

- extiende `BaseList<Lodging>`
- inyecta `LodgingsResourceService`
- llama `loadPage`, `refresh`, `setPage`, `setLimit`
- deja el estado visible en el recurso

Eso hace que la pantalla se enfoque en la feature y no en reimplementar infraestructura de frontend.

## Por que me sirve este enfoque

No busco una arquitectura ultra abstracta. Busco una arquitectura que soporte crecimiento sin volverse caotica.

Este framework personal me sirve porque:

- define limites claros entre HTTP, estado y UI
- reduce duplicacion en CRUDs
- vuelve consistentes listas y formularios
- me deja mezclar Angular standalone, signals e Ionic sin desorden

No siempre todas las piezas aparecen en todos los proyectos. Pero cuando un producto empieza a tener formularios, panel admin, paginacion y modulos repetidos, esta estructura paga sola.
