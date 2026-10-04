import { computed, inject, Injectable, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MovieDetails } from '../models/movie';
import { MoviesApi } from './movies-api';

/** Read-only view over a movie details request. */
export interface MovieDetailsResource {
  /** Loaded details; `undefined` while loading or on error. */
  readonly value: Signal<MovieDetails | undefined>;
  readonly isLoading: Signal<boolean>;
  /** User-facing error message, or `null`. */
  readonly error: Signal<string | null>;
  reload(): void;
}

/**
 * Loads movie details reactively by id. Provided per page (`providers: [MovieDetailsStore]`),
 * so the request lives and dies with the page.
 */
@Injectable()
export class MovieDetailsStore {
  private readonly api = inject(MoviesApi);

  /**
   * Creates a details resource that refetches whenever `id` changes.
   * Must be called in an injection context, e.g. in a component field initializer.
   */
  details(id: Signal<number>): MovieDetailsResource {
    const resource = rxResource({
      params: () => id(),
      stream: ({ params }) => this.api.getMovieDetails(params),
    });

    return {
      value: computed(() => (resource.hasValue() ? resource.value() : undefined)),
      isLoading: resource.isLoading,
      error: computed(() => {
        const error = resource.error();
        return error ? this.api.describeError(error) : null;
      }),
      reload: () => resource.reload(),
    };
  }
}
