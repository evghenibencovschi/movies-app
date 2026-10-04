import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MoviesApi } from '../movies-api';
import { TMDB_CONFIG, TmdbConfig } from './tmdb-config';
import { TmdbMoviesApi } from './tmdb-movies-api';

/** Registers the TMDb config and binds the `MoviesApi` port to the TMDb implementation. */
export function provideTmdb(config: TmdbConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: TMDB_CONFIG, useValue: config },
    { provide: MoviesApi, useClass: TmdbMoviesApi },
  ]);
}
