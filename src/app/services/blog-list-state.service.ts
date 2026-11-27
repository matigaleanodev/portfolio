import { Injectable, signal } from '@angular/core';

export type BlogSortOrder = 'newest' | 'oldest';

/** Conserva búsqueda y orden del listado mientras dura la sesión de navegación. */
@Injectable({ providedIn: 'root' })
export class BlogListStateService {
  readonly searchQuery = signal('');
  readonly sortOrder = signal<BlogSortOrder>('newest');
}
