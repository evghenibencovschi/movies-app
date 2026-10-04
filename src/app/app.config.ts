import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { tmdbAuthInterceptor } from './services/tmdb/tmdb-auth-interceptor';
import { provideTmdbImageLoader } from './services/tmdb/tmdb-image-loader';
import { provideTmdb } from './services/tmdb/tmdb-providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // New pages open at the top; Back restores the list scroll position.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([tmdbAuthInterceptor])),
    provideTmdb(environment.tmdb),
    provideTmdbImageLoader(environment.tmdb.imageUrl),
  ],
};
