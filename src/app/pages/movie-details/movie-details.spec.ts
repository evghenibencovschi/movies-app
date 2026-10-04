import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MoviesApi } from '../../services/movies-api';
import { FakeMoviesApi, fakeMovieDetails } from '../../testing/fake-movies-api';
import { formatRuntime, MovieDetails } from './movie-details';

@Component({ template: 'home' })
class Blank {}

describe('MovieDetails', () => {
  let harness: RouterTestingHarness;
  let api: FakeMoviesApi;

  const el = () => harness.routeNativeElement as HTMLElement;
  const text = (selector: string) => el().querySelector(selector)?.textContent?.trim();
  const backControl = () =>
    [...el().querySelectorAll<HTMLElement>('a, button')].find((c) =>
      c.textContent?.includes('Back'),
    );

  /** Renders, lets the details resource deliver its value (a later task), then renders again. */
  const flush = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: '', component: Blank },
            { path: 'movie/:id', component: MovieDetails },
          ],
          withComponentInputBinding(),
        ),
        { provide: MoviesApi, useClass: FakeMoviesApi },
      ],
    });
    api = TestBed.inject(MoviesApi) as FakeMoviesApi;
    harness = await RouterTestingHarness.create();
  });

  it('requests details for the route id and shows a skeleton meanwhile', async () => {
    await harness.navigateByUrl('/movie/550');

    expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [550] });
    expect(el().querySelector('[data-testid="details-skeleton"]')).not.toBeNull();
  });

  it('renders the movie details', async () => {
    await harness.navigateByUrl('/movie/550');
    api.respond(
      fakeMovieDetails(550, {
        title: 'Fight Club',
        tagline: 'Mischief. Mayhem. Soap.',
        overview: 'An insomniac office worker...',
        rating: 8.4,
        releaseDate: '1999-10-15',
        runtime: 139,
        posterPath: '/fc.jpg',
        genres: [
          { id: 18, name: 'Drama' },
          { id: 53, name: 'Thriller' },
        ],
      }),
    );
    await flush();

    expect(text('h1')).toBe('Fight Club');
    expect(el().textContent).toContain('Mischief. Mayhem. Soap.');
    expect(el().textContent).toContain('8.4');
    expect(text('time')).toBe('Oct 15, 1999');
    expect(el().textContent).toContain('2h 19m');
    expect(
      [...el().querySelectorAll('[aria-label="Genres"] li')].map((li) => li.textContent?.trim()),
    ).toEqual(['Drama', 'Thriller']);
    expect(el().textContent).toContain('An insomniac office worker...');
    expect(el().querySelector('img[alt="Fight Club"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="details-skeleton"]')).toBeNull();
  });

  it('sets the document title to the movie title', async () => {
    await harness.navigateByUrl('/movie/550');
    api.respond(fakeMovieDetails(550, { title: 'Fight Club' }));
    await flush();

    expect(TestBed.inject(Title).getTitle()).toBe('Fight Club · Movies');
  });

  it('shows placeholders for missing data', async () => {
    await harness.navigateByUrl('/movie/550');
    api.respond(
      fakeMovieDetails(550, {
        posterPath: null,
        backdropPath: null,
        overview: null,
        tagline: null,
        rating: 0,
        runtime: null,
        releaseDate: null,
        genres: [],
      }),
    );
    await flush();

    expect(el().querySelector('[data-testid="poster-placeholder"]')).not.toBeNull();
    expect(el().querySelector('img')).toBeNull();
    expect(el().textContent).toContain('No overview available.');
    expect(el().textContent).not.toContain('★');
    expect(el().querySelector('time')).toBeNull();
    expect(el().querySelector('[aria-label="Genres"]')).toBeNull();
  });

  it('shows the error with Retry that reloads', async () => {
    await harness.navigateByUrl('/movie/999999999');
    api.fail(new Error('Movie not found'));
    await flush();

    expect(text('[role="alert"] p')).toBe('Movie not found');

    [...el().querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Retry')!.click();
    await flush();

    expect(api.calls).toHaveLength(2);
    expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [999999999] });
  });

  it('loads another movie when the id changes', async () => {
    await harness.navigateByUrl('/movie/550');
    api.respond(fakeMovieDetails(550));
    await flush();

    await harness.navigateByUrl('/movie/603');

    expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [603] });
  });

  it('links Back to the home page when opened directly', async () => {
    await harness.navigateByUrl('/movie/550');
    api.respond(fakeMovieDetails(550));
    await flush();

    expect(backControl()?.tagName).toBe('A');
    expect(backControl()?.getAttribute('href')).toBe('/');
  });

  it('goes back in history when opened from another page', async () => {
    await harness.navigateByUrl('/');
    await harness.navigateByUrl('/movie/550');
    api.respond(fakeMovieDetails(550));
    await flush();
    const back = vi.spyOn(TestBed.inject(Location), 'back');

    backControl()!.click();

    expect(backControl()?.tagName).toBe('BUTTON');
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe('formatRuntime', () => {
  it('formats minutes as hours and minutes', () => {
    expect(formatRuntime(139)).toBe('2h 19m');
    expect(formatRuntime(120)).toBe('2h 0m');
    expect(formatRuntime(45)).toBe('45m');
  });

  it('returns null for missing runtime', () => {
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(undefined)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});
