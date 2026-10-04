import { InjectionToken } from '@angular/core';

export interface TmdbConfig {
  /** API base URL without a trailing slash, e.g. `https://api.themoviedb.org/3`. */
  apiUrl: string;
  /** Image CDN base URL without a trailing slash, e.g. `https://image.tmdb.org/t/p`. */
  imageUrl: string;
  /** Read Access Token (v4), sent as `Authorization: Bearer`. */
  accessToken: string;
  /** Content language, e.g. `en-US`. */
  language: string;
}

export const TMDB_CONFIG = new InjectionToken<TmdbConfig>('TMDB_CONFIG');
