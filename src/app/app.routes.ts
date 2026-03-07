import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((module) => module.HomePage),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./pages/blog-list/blog-list.page').then((module) => module.BlogListPage),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./pages/blog-post/blog-post.page').then((module) => module.BlogPostPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
