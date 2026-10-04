import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MovieStore } from '../../services/movie-store';
import { MoviesApi } from '../../services/movies-api';
import { FakeMoviesApi, fakePage } from '../../testing/fake-movies-api';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let el: HTMLElement;
  let api: FakeMoviesApi;

  /**
   * Renders, lets the store's resource deliver its value (a later task), then renders again.
   * `whenStable()` is not usable here: it waits for the pending fake request to finish.
   */
  const settle = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  const cards = () => el.querySelectorAll('app-movie-card');
  const skeletons = () => el.querySelectorAll('[data-testid="skeleton"]');
  const heroTitles = () =>
    [...el.querySelectorAll('app-hero-banner h2')].map((h2) => h2.textContent?.trim());
  const button = (text: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), { provide: MoviesApi, useClass: FakeMoviesApi }],
    }).compileComponents();

    api = TestBed.inject(MoviesApi) as FakeMoviesApi;
    fixture = TestBed.createComponent(Home);
    el = fixture.nativeElement;
    await settle();
  });

  it('shows skeletons while popular movies load', () => {
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Popular');
    expect(skeletons()).toHaveLength(12);
    expect(cards()).toHaveLength(0);
    expect(el.querySelector('[data-testid="hero-skeleton"]')).not.toBeNull();
  });

  it('cycles the first 10 popular movies in the hero and hides it while searching', async () => {
    api.respond(fakePage(1, 3));
    await settle();

    expect(el.querySelector('[data-testid="hero-skeleton"]')).toBeNull();
    expect(heroTitles()).toEqual(Array.from({ length: 10 }, (_, i) => `Movie ${i + 1}`));

    TestBed.inject(MovieStore).searchMovies('matrix');
    await settle();

    expect(el.querySelector('app-hero-banner')).toBeNull();
    expect(el.querySelector('[data-testid="hero-skeleton"]')).toBeNull();
  });

  it('skips movies without a backdrop in the hero', async () => {
    const page = fakePage(1, 3);
    page.items[0] = { ...page.items[0], backdropPath: null };
    page.items[5] = { ...page.items[5], backdropPath: null };
    api.respond(page);
    await settle();

    expect(heroTitles()).toEqual([2, 3, 4, 5, 7, 8, 9, 10, 11, 12].map((id) => `Movie ${id}`));
  });

  it('shows fewer hero slides when fewer popular movies have a backdrop', async () => {
    const page = fakePage(1, 1, 4);
    page.items[2] = { ...page.items[2], backdropPath: null };
    api.respond(page);
    await settle();

    expect(heroTitles()).toEqual(['Movie 1', 'Movie 2', 'Movie 4']);
  });

  it('shows neither the hero nor its skeleton when popular movies fail to load', async () => {
    api.fail();
    await settle();

    expect(el.querySelector('app-hero-banner')).toBeNull();
    expect(el.querySelector('[data-testid="hero-skeleton"]')).toBeNull();
  });

  it('keeps the active hero slide after loading more movies', async () => {
    api.respond(fakePage(1, 3));
    await settle();
    el.querySelectorAll<HTMLButtonElement>('[data-testid="hero-indicator"]')[3].click();
    await settle();

    button('Load more')?.click();
    await settle();
    api.respond(fakePage(2, 3));
    await settle();

    const active = el.querySelector('[data-testid="hero-slide"][data-offset="0"] h2');
    expect(active?.textContent?.trim()).toBe('Movie 4');
  });

  it('renders popular movies and loads more on click', async () => {
    api.respond(fakePage(1, 3));
    await settle();

    expect(cards()).toHaveLength(20);
    expect(skeletons()).toHaveLength(0);

    button('Load more')?.click();
    await settle();

    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [2] });
    expect(button('Loading…')?.disabled).toBe(true);
    expect(skeletons()).toHaveLength(6);

    api.respond(fakePage(2, 3));
    await settle();

    expect(cards()).toHaveLength(40);
  });

  it('hides Load more on the last page', async () => {
    api.respond(fakePage(1, 1));
    await settle();

    expect(button('Load more')).toBeUndefined();
  });

  it('shows the error with Retry that reloads', async () => {
    api.fail(new Error('Invalid TMDb access token'));
    await settle();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Invalid TMDb access token');
    expect(el.querySelector('app-movie-list')).toBeNull();

    button('Retry')?.click();
    await settle();

    expect(api.calls).toHaveLength(2);
    api.respond(fakePage(1, 3));
    await settle();

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(cards()).toHaveLength(20);
  });

  it('keeps loaded movies and offers Retry when the next page fails', async () => {
    api.respond(fakePage(1, 3));
    await settle();
    button('Load more')?.click();
    await settle();

    api.fail();
    await settle();

    expect(cards()).toHaveLength(20);
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(button('Load more')).toBeUndefined();

    button('Retry')?.click();
    await settle();

    expect(api.calls).toHaveLength(3);
    expect(api.lastCall).toMatchObject({ method: 'getPopularMovies', args: [2] });
    api.respond(fakePage(2, 3));
    await settle();

    expect(cards()).toHaveLength(40);
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(button('Load more')).toBeDefined();
  });

  it('shows the search title and the empty state', async () => {
    TestBed.inject(MovieStore).searchMovies('qwertyuiop');
    await settle();
    api.respond({ items: [], page: 1, totalPages: 0, totalResults: 0 });
    await settle();

    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Results for “qwertyuiop”');
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'No movies found for “qwertyuiop”',
    );
  });
});
