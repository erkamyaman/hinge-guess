import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'game',
        loadComponent: () => import('./game/game.page').then((m) => m.GamePage),
      },
      {
        path: 'free',
        loadComponent: () => import('./free/free.page').then((m) => m.FreePage),
      },
      { path: '', redirectTo: 'free', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/free', pathMatch: 'full' },
];
