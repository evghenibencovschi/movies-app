import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FakeMoviesApi, fakeMovieDetails } from '../testing/fake-movies-api';
import { MovieDetailsResource, MovieDetailsStore } from './movie-details-store';
import { MoviesApi } from './movies-api';

describe('MovieDetailsStore', () => {
  const id = signal(550);
  let details: MovieDetailsResource;
  let api: FakeMoviesApi;

  /** Runs effects, then lets the resource deliver the stream value (it resolves via a promise). */
  const flush = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  beforeEach(async () => {
    id.set(550);
    TestBed.configureTestingModule({
      providers: [MovieDetailsStore, { provide: MoviesApi, useClass: FakeMoviesApi }],
    });
    api = TestBed.inject(MoviesApi) as FakeMoviesApi;
    const store = TestBed.inject(MovieDetailsStore);
    details = TestBed.runInInjectionContext(() => store.details(id));
    await flush();
  });

  it('loads details for the given id', async () => {
    expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [550] });
    expect(details.isLoading()).toBe(true);
    expect(details.value()).toBeUndefined();

    api.respond(fakeMovieDetails(550, { title: 'Fight Club' }));
    await flush();

    expect(details.isLoading()).toBe(false);
    expect(details.value()?.title).toBe('Fight Club');
    expect(details.error()).toBeNull();
  });

  it('refetches when the id changes', async () => {
    api.respond(fakeMovieDetails(550));
    await flush();

    id.set(603);
    await flush();

    expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [603] });
    expect(details.value()).toBeUndefined();

    api.respond(fakeMovieDetails(603, { title: 'The Matrix' }));
    await flush();

    expect(details.value()?.title).toBe('The Matrix');
  });

  it('exposes a readable error and no value on failure', async () => {
    api.fail(new Error('Movie not found'));
    await flush();

    expect(details.isLoading()).toBe(false);
    expect(details.error()).toBe('Movie not found');
    expect(details.value()).toBeUndefined();
  });

  it('retries the same id on reload', async () => {
    api.fail();
    await flush();

    details.reload();
    await flush();

    expect(api.calls).toHaveLength(2);
    expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [550] });
    api.respond(fakeMovieDetails(550));
    await flush();

    expect(details.error()).toBeNull();
    expect(details.value()?.id).toBe(550);
  });

  it('ignores a late response for the previous id', async () => {
    const first = api.lastCall!;
    id.set(603);
    await flush();

    first.response.next(fakeMovieDetails(550, { title: 'Fight Club' }));
    await flush();

    expect(details.value()).toBeUndefined();
    expect(details.isLoading()).toBe(true);

    api.respond(fakeMovieDetails(603, { title: 'The Matrix' }));
    await flush();

    expect(details.value()?.title).toBe('The Matrix');
  });
});
