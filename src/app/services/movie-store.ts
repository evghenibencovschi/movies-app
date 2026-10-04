import { computed, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Movie, Paginated } from '../models/movie';
import { MoviesApi } from './movies-api';

/** TMDb returns an error for pages above 500, even when `total_pages` is larger. */
const MAX_PAGES = 500;

interface MovieListState {
  items: Movie[];
  page: number;
  totalPages: number;
}

const EMPTY_STATE: MovieListState = { items: [], page: 0, totalPages: 0 };

/** Appends `next` to `current`, skipping ids already present (pages may overlap). */
function appendUnique(current: Movie[], next: Movie[]): Movie[] {
  const ids = new Set(current.map((movie) => movie.id));
  return [...current, ...next.filter((movie) => !ids.has(movie.id))];
}

/**
 * Movie list state: popular movies when the query is empty, search results otherwise,
 * with "load more" pagination. Depends only on the `MoviesApi` port.
 */
@Injectable({ providedIn: 'root' })
export class MovieStore {
  private readonly api = inject(MoviesApi);

  private readonly _query = signal('');
  /** Resets to the first page whenever the query changes. */
  private readonly _page = linkedSignal({ source: this._query, computation: () => 1 });

  /** Switching params cancels the in-flight request, so responses never race. */
  private readonly resource = rxResource({
    params: () => ({ query: this._query(), page: this._page() }),
    stream: ({ params }) =>
      params.query
        ? this.api.searchMovies(params.query, params.page)
        : this.api.getPopularMovies(params.page),
  });

  /**
   * Accumulates pages: page 1 replaces the list, next pages are appended.
   * While page 1 is loading or has failed the list is empty, so a new query never shows stale results.
   */
  private readonly state = linkedSignal<
    { response: Paginated<Movie> | undefined; page: number },
    MovieListState
  >({
    source: () => ({
      response: this.resource.hasValue() ? this.resource.value() : undefined,
      page: this._page(),
    }),
    computation: ({ response, page }, previous) => {
      const current = previous?.value ?? EMPTY_STATE;
      if (!response) {
        return page === 1 ? EMPTY_STATE : current;
      }
      return {
        items: response.page === 1 ? response.items : appendUnique(current.items, response.items),
        page: response.page,
        totalPages: response.totalPages,
      };
    },
  });

  readonly query = this._query.asReadonly();
  readonly movies = computed(() => this.state().items);
  readonly loading = computed(() => this.resource.isLoading());
  readonly error = computed(() => {
    const error = this.resource.error();
    return error ? this.api.describeError(error) : null;
  });
  readonly isSearch = computed(() => this.query() !== '');
  readonly hasMore = computed(() => {
    const { page, totalPages } = this.state();
    return !this.error() && page < Math.min(totalPages, MAX_PAGES);
  });
  readonly isEmpty = computed(
    () => this.resource.hasValue() && !this.loading() && this.movies().length === 0,
  );

  getPopularMovies(): void {
    this._query.set('');
  }

  searchMovies(keyword: string): void {
    this._query.set(keyword.trim());
  }

  loadMore(): void {
    if (this.hasMore() && !this.loading()) {
      this._page.set(this.state().page + 1);
    }
  }

  /** Retries the last request (e.g. after an error). */
  reload(): void {
    this.resource.reload();
  }
}
