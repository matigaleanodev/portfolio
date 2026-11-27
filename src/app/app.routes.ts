import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((module) => module.HomePage),
  },
  {
    path: 'projects/:slug',
    loadComponent: () =>
      import('./pages/project-detail/project-detail.page').then(
        (module) => module.ProjectDetailPage,
      ),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./pages/blog-list/blog-list.page').then((module) => module.BlogListPage),
  },
  {
    path: 'blog/unsubscribe',
    loadComponent: () =>
      import('./pages/blog-unsubscribe/blog-unsubscribe.page').then(
        (module) => module.BlogUnsubscribePage,
      ),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./pages/blog-post/blog-post.page').then((module) => module.BlogPostPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then((module) => module.NotFoundPage),
  },
];
