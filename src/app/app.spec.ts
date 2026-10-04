import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { MoviesApi } from './services/movies-api';
import { FakeMoviesApi } from './testing/fake-movies-api';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: MoviesApi, useClass: FakeMoviesApi },
      ],
    }).compileComponents();
  });

  it('renders the shell: header, main and TMDb attribution', () => {
    const fixture = TestBed.createComponent(App);
    // Not `whenStable()`: the header starts loading movies, a pending task until the request ends.
    TestBed.tick();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('main router-outlet')).not.toBeNull();
    expect(el.querySelector('footer')?.textContent).toContain('TMDb');
  });

  describe('routes', () => {
    let harness: RouterTestingHarness;

    beforeEach(async () => {
      harness = await RouterTestingHarness.create();
    });

    it('opens the home page at /', async () => {
      await harness.navigateByUrl('/');

      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Popular');
    });

    it('opens movie details at /movie/:id with the id bound to the input', async () => {
      await harness.navigateByUrl('/movie/550');

      const api = TestBed.inject(MoviesApi) as FakeMoviesApi;
      expect(api.lastCall).toMatchObject({ method: 'getMovieDetails', args: [550] });
    });

    it('redirects unknown urls to /', async () => {
      await harness.navigateByUrl('/foo');

      expect(TestBed.inject(Router).url).toBe('/');
    });
  });
});
