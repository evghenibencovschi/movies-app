import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Movies',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'movie/:id',
    title: 'Movie details',
    loadComponent: () => import('./pages/movie-details/movie-details').then((m) => m.MovieDetails),
  },
  { path: '**', redirectTo: '' },
];
