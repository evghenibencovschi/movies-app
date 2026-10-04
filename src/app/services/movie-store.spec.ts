import { TestBed } from '@angular/core/testing';
import { FakeMoviesApi, fakeMovie, fakePage } from '../testing/fake-movies-api';
import { MovieStore } from './movie-store';
import { MoviesApi } from './movies-api';

describe('MovieStore', () => {
  let store: MovieStore;
  let api: FakeMoviesApi;

  /**
   * Runs effects so the resource picks up new params, then lets the resource settle:
   * it delivers stream values through a promise, i.e. in a later microtask.
   */
  const flush = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: MoviesApi, useClass: FakeMoviesApi }],
    });
    store = TestBed.inject(MovieStore);
    api = TestBed.inject(MoviesApi) as FakeMoviesApi;
    await flush();
  });

  it('loads popular movies on start', async () => {
    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [1] });
    expect(store.loading()).toBe(true);
    expect(store.isEmpty()).toBe(false);

    api.respond(fakePage(1, 3));
    await flush();

    expect(store.loading()).toBe(false);
    expect(store.movies()).toHaveLength(20);
    expect(store.error()).toBeNull();
    expect(store.hasMore()).toBe(true);
    expect(store.isSearch()).toBe(false);
  });

  it('searches by trimmed keyword and switches back to popular', async () => {
    api.respond(fakePage(1, 3));
    await flush();

    store.searchMovies('  matrix ');
    await flush();

    expect(store.query()).toBe('matrix');
    expect(store.isSearch()).toBe(true);
    expect(api.lastCall).toMatchObject({ method: 'searchMovies', args: ['matrix', 1] });

    api.respond({ items: [fakeMovie(603)], page: 1, totalPages: 1, totalResults: 1 });
    await flush();
    expect(store.movies().map((m) => m.id)).toEqual([603]);
    expect(store.hasMore()).toBe(false);

    store.getPopularMovies();
    await flush();

    expect(store.isSearch()).toBe(false);
    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [1] });
  });

  it('treats a blank keyword as popular', async () => {
    api.respond(fakePage(1, 3));
    await flush();
    store.searchMovies('matrix');
    await flush();

    store.searchMovies('   ');
    await flush();

    expect(store.query()).toBe('');
    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [1] });
  });

  it('appends the next page on loadMore', async () => {
    api.respond(fakePage(1, 3));
    await flush();

    store.loadMore();
    await flush();

    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [2] });
    expect(store.loading()).toBe(true);
    expect(store.movies()).toHaveLength(20);

    api.respond(fakePage(2, 3));
    await flush();

    expect(store.movies()).toHaveLength(40);
    expect(store.movies()[20].id).toBe(21);
  });

  it('ignores loadMore while loading or on the last page', async () => {
    store.loadMore();
    await flush();
    expect(api.calls).toHaveLength(1);

    api.respond(fakePage(1, 1));
    await flush();
    store.loadMore();
    await flush();

    expect(store.hasMore()).toBe(false);
    expect(api.calls).toHaveLength(1);
  });

  it('caps pagination at 500 pages', async () => {
    api.respond({ ...fakePage(1, 1001), page: 500 });
    await flush();

    expect(store.hasMore()).toBe(false);
  });

  it('skips movies already in the list when pages overlap', async () => {
    api.respond(fakePage(1, 3));
    await flush();
    store.loadMore();
    await flush();

    api.respond({
      items: [fakeMovie(20), fakeMovie(21)],
      page: 2,
      totalPages: 3,
      totalResults: 60,
    });
    await flush();

    expect(
      store
        .movies()
        .map((m) => m.id)
        .slice(-2),
    ).toEqual([20, 21]);
    expect(store.movies()).toHaveLength(21);
  });

  it('resets the list and page for a new query', async () => {
    api.respond(fakePage(1, 3));
    await flush();
    store.loadMore();
    await flush();
    api.respond(fakePage(2, 3));
    await flush();

    store.searchMovies('alien');
    await flush();

    expect(api.lastCall).toMatchObject({ method: 'searchMovies', args: ['alien', 1] });
    api.respond({ items: [fakeMovie(348)], page: 1, totalPages: 1, totalResults: 1 });
    await flush();

    expect(store.movies().map((m) => m.id)).toEqual([348]);
  });

  it('clears the previous results while a new query is loading', async () => {
    api.respond(fakePage(1, 3));
    await flush();

    store.searchMovies('alien');
    await flush();

    expect(store.loading()).toBe(true);
    expect(store.movies()).toEqual([]);
    expect(store.hasMore()).toBe(false);
  });

  it('does not keep stale results when a new query fails', async () => {
    api.respond(fakePage(1, 3));
    await flush();
    store.searchMovies('alien');
    await flush();

    api.fail();
    await flush();

    expect(store.error()).toBe('Fake error');
    expect(store.movies()).toEqual([]);
  });

  it('exposes a readable error and stops loading on failure', async () => {
    api.fail(new Error('Invalid TMDb access token'));
    await flush();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Invalid TMDb access token');
    expect(store.isEmpty()).toBe(false);
    expect(store.hasMore()).toBe(false);
  });

  it('keeps loaded movies when loading more fails and retries on reload', async () => {
    api.respond(fakePage(1, 3));
    await flush();
    store.loadMore();
    await flush();
    api.fail();
    await flush();

    expect(store.error()).toBe('Fake error');
    expect(store.movies()).toHaveLength(20);

    store.reload();
    await flush();

    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [2] });
    api.respond(fakePage(2, 3));
    await flush();

    expect(store.error()).toBeNull();
    expect(store.movies()).toHaveLength(40);
  });

  it('reports empty results', async () => {
    store.searchMovies('qwertyuiop');
    await flush();
    api.respond({ items: [], page: 1, totalPages: 0, totalResults: 0 });
    await flush();

    expect(store.isEmpty()).toBe(true);
    expect(store.movies()).toEqual([]);
  });

  it('loads the next page of search results with the same keyword', async () => {
    store.searchMovies('matrix');
    await flush();
    api.respond(fakePage(1, 2));
    await flush();

    store.loadMore();
    await flush();

    expect(api.lastCall).toMatchObject({ method: 'searchMovies', args: ['matrix', 2] });
    api.respond(fakePage(2, 2));
    await flush();

    expect(store.movies()).toHaveLength(40);
    expect(store.hasMore()).toBe(false);
  });

  it('ignores a late response for a previous query', async () => {
    const popular = api.lastCall!;
    store.searchMovies('matrix');
    await flush();

    popular.response.next(fakePage(1, 3));
    await flush();

    expect(store.movies()).toEqual([]);
    expect(store.loading()).toBe(true);

    api.respond({ items: [fakeMovie(603)], page: 1, totalPages: 1, totalResults: 1 });
    await flush();

    expect(store.movies().map((m) => m.id)).toEqual([603]);
  });
});
