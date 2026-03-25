import { Routes } from '@angular/router';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { PmPmoLayoutComponent } from './layouts/pm-pmo-layout/pm-pmo-layout.component';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/news-list/news-list.component')
            .then((m) => m.NewsListComponent)
            .catch(() => {
              class DummyComponent {}
              return DummyComponent as any;
            }),
      },
      {
        path: 'management',
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./components/admin-news-dashboard/admin-news-dashboard.component')
                .then((m) => m.AdminNewsDashboardComponent)
                .catch(() => {
                  class DummyComponent {}
                  return DummyComponent as any;
                }),
          },
          {
            path: 'create-news',
            loadComponent: () =>
              import('./components/create-news/create-news.component')
                .then((m) => m.CreateNewsComponent)
                .catch(() => {
                  class DummyComponent {}
                  return DummyComponent as any;
                }),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./components/create-news/create-news.component')
                .then((m) => m.CreateNewsComponent)
                .catch(() => {
                  class DummyComponent {}
                  return DummyComponent as any;
                }),
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/news/news-detail/news-detail.component').then(
            (m) => m.NewsDetailComponent,
          ),
      },
    ],
  },

  {
    path: 'pm-pmo',
    component: PmPmoLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/pm-pmo-news-dashboard/pm-pmo-news-dashboard.component')
            .then((m) => m.PmPmoNewsDashboardComponent)
            .catch(() => {
              // Mock fallback
              class DummyComponent {}
              return DummyComponent as any;
            }),
      },
    ],
  },
];
