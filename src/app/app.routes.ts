import { Routes } from '@angular/router';
import { BlogListPage } from './pages/blog-list/blog-list.page';
import { BlogPostPage } from './pages/blog-post/blog-post.page';
import { HomePage } from './pages/home/home.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'blog',
    component: BlogListPage,
  },
  {
    path: 'blog/:slug',
    component: BlogPostPage,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
