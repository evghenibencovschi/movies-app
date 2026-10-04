import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { Movie, MovieDetails, Paginated } from '../models/movie';
import { MoviesApi } from '../services/movies-api';

export type FakeMoviesApiMethod = 'getPopularMovies' | 'searchMovies' | 'getMovieDetails';

export interface FakeMoviesApiCall {
  method: FakeMoviesApiMethod;
  args: unknown[];
  response: ReplaySubject<unknown>;
}

/**
 * Test double for the `MoviesApi` port. Every call is recorded and stays pending
 * until the test resolves it with `respond()` or `fail()`, so loading states can be asserted.
 *
 * Usage: `{ provide: MoviesApi, useClass: FakeMoviesApi }`, then `TestBed.inject(MoviesApi) as FakeMoviesApi`.
 */
@Injectable()
export class FakeMoviesApi extends MoviesApi {
  readonly calls: FakeMoviesApiCall[] = [];

  get lastCall(): FakeMoviesApiCall | undefined {
    return this.calls.at(-1);
  }

  override getPopularMovies(page = 1): Observable<Paginated<Movie>> {
    return this.record('getPopularMovies', [page]);
  }

  override searchMovies(keyword: string, page = 1): Observable<Paginated<Movie>> {
    return this.record('searchMovies', [keyword, page]);
  }

  override getMovieDetails(id: number): Observable<MovieDetails> {
    return this.record('getMovieDetails', [id]);
  }

  override describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'Fake error';
  }

  /** Emits `value` and completes the most recent pending call. */
  respond(value: unknown): void {
    const call = this.requireLastCall();
    call.response.next(value);
    call.response.complete();
  }

  /** Fails the most recent pending call with `error`. */
  fail(error: unknown = new Error('Fake error')): void {
    this.requireLastCall().response.error(error);
  }

  private record<T>(method: FakeMoviesApiMethod, args: unknown[]): Observable<T> {
    const response = new ReplaySubject<unknown>(1);
    this.calls.push({ method, args, response });
    return response.asObservable() as Observable<T>;
  }

  private requireLastCall(): FakeMoviesApiCall {
    const call = this.lastCall;
    if (!call) {
      throw new Error('FakeMoviesApi: no pending call');
    }
    return call;
  }
}

export function fakeMovie(id: number, overrides: Partial<Movie> = {}): Movie {
  return {
    id,
    title: `Movie ${id}`,
    overview: `Overview ${id}`,
    posterPath: `/poster-${id}.jpg`,
    backdropPath: `/backdrop-${id}.jpg`,
    releaseDate: '2024-01-01',
    rating: 7.5,
    ...overrides,
  };
}

export function fakeMovieDetails(id: number, overrides: Partial<MovieDetails> = {}): MovieDetails {
  return {
    ...fakeMovie(id),
    genres: [{ id: 18, name: 'Drama' }],
    runtime: 120,
    tagline: `Tagline ${id}`,
    ...overrides,
  };
}

/** Builds a page of `size` movies with consecutive ids, e.g. page 2 of size 20 → ids 21..40. */
export function fakePage(page: number, totalPages: number, size = 20): Paginated<Movie> {
  const start = (page - 1) * size + 1;
  return {
    items: Array.from({ length: size }, (_, i) => fakeMovie(start + i)),
    page,
    totalPages,
    totalResults: totalPages * size,
  };
}
