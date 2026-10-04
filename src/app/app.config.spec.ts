import { IMAGE_LOADER } from '@angular/common';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { appConfig } from './app.config';
import { MoviesApi } from './services/movies-api';
import { TmdbMoviesApi } from './services/tmdb/tmdb-movies-api';

/** Integration: the real app providers wire the port, the interceptor and the image loader together. */
describe('appConfig', () => {
  const { apiUrl, imageUrl, language } = environment.tmdb;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('binds the MoviesApi port to the TMDb implementation', () => {
    expect(TestBed.inject(MoviesApi)).toBeInstanceOf(TmdbMoviesApi);
  });

  it('sends TMDb requests through the auth interceptor and maps the response', async () => {
    const result = firstValueFrom(TestBed.inject(MoviesApi).searchMovies('matrix'));

    const req = http.expectOne((r) => r.url === `${apiUrl}/search/movie`);
    expect(req.request.headers.get('Authorization')).toMatch(/^Bearer /);
    expect(req.request.params.get('language')).toBe(language);
    expect(req.request.params.get('query')).toBe('matrix');
    req.flush({
      page: 1,
      results: [
        { id: 603, title: 'The Matrix', overview: '', poster_path: null, vote_average: 8.2 },
      ],
      total_pages: 1,
      total_results: 1,
    });

    expect(await result).toEqual({
      items: [
        {
          id: 603,
          title: 'The Matrix',
          overview: null,
          posterPath: null,
          backdropPath: null,
          releaseDate: null,
          rating: 8.2,
        },
      ],
      page: 1,
      totalPages: 1,
      totalResults: 1,
    });
  });

  it('turns API errors into user-facing messages through the port', async () => {
    const api = TestBed.inject(MoviesApi);
    const result = firstValueFrom(api.getMovieDetails(999999999));

    http
      .expectOne((r) => r.url === `${apiUrl}/movie/999999999`)
      .flush({ status_message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    await expect(result).rejects.toSatisfy(
      (error) => api.describeError(error) === 'Movie not found',
    );
  });

  it('loads images from the TMDb CDN', () => {
    const loader = TestBed.inject(IMAGE_LOADER);
    expect(loader({ src: '/poster.jpg', width: 342 })).toBe(`${imageUrl}/w342/poster.jpg`);
  });
});
