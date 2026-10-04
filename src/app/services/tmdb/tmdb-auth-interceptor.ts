import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TMDB_CONFIG } from './tmdb-config';

/** Adds the TMDb Bearer token and content language to TMDb API requests only. */
export const tmdbAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(TMDB_CONFIG);

  if (!req.url.startsWith(`${config.apiUrl}/`)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${config.accessToken}` },
      params: req.params.set('language', config.language),
    }),
  );
};
