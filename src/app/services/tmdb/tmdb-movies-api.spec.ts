import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MoviesApi } from '../movies-api';
import { TmdbConfig } from './tmdb-config';
import { TmdbMovieDetailsDto, TmdbMovieDto, TmdbPaginatedDto } from './tmdb-dto';
import { TmdbMoviesApi } from './tmdb-movies-api';
import { provideTmdb } from './tmdb-providers';

const config: TmdbConfig = {
  apiUrl: 'https://api.test/3',
  imageUrl: 'https://image.test/t/p',
  accessToken: 'test-token',
  language: 'en-US',
};

const movieDto: TmdbMovieDto = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  original_language: 'en',
  overview: 'An insomniac office worker...',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '1999-10-15',
  vote_average: 8.433,
  vote_count: 30000,
  popularity: 70.5,
  adult: false,
  video: false,
  genre_ids: [18],
};

const pageDto: TmdbPaginatedDto<TmdbMovieDto> = {
  page: 1,
  results: [movieDto],
  total_pages: 5,
  total_results: 100,
};

describe('TmdbMoviesApi', () => {
  let api: MoviesApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTmdb(config), provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MoviesApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('is bound to the MoviesApi port by provideTmdb', () => {
    expect(api).toBeInstanceOf(TmdbMoviesApi);
  });

  describe('getPopularMovies', () => {
    it('requests /movie/popular with page 1 by default and maps the response', async () => {
      const result = firstValueFrom(api.getPopularMovies());

      const req = httpTesting.expectOne((r) => r.url === `${config.apiUrl}/movie/popular`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      req.flush(pageDto);

      expect(await result).toEqual({
        items: [
          {
            id: 550,
            title: 'Fight Club',
            overview: 'An insomniac office worker...',
            posterPath: '/poster.jpg',
            backdropPath: '/backdrop.jpg',
            releaseDate: '1999-10-15',
            rating: 8.4,
          },
        ],
        page: 1,
        totalPages: 5,
        totalResults: 100,
      });
    });

    it('passes the requested page', () => {
      api.getPopularMovies(3).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${config.apiUrl}/movie/popular`);
      expect(req.request.params.get('page')).toBe('3');
      req.flush(pageDto);
    });
  });

  describe('searchMovies', () => {
    it('requests /search/movie with query, page and include_adult=false', async () => {
      const result = firstValueFrom(api.searchMovies('fight club', 2));

      const req = httpTesting.expectOne((r) => r.url === `${config.apiUrl}/search/movie`);
      expect(req.request.params.get('query')).toBe('fight club');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('include_adult')).toBe('false');
      req.flush({ ...pageDto, page: 2 });

      const page = await result;
      expect(page.page).toBe(2);
      expect(page.items[0].title).toBe('Fight Club');
    });
  });

  describe('getMovieDetails', () => {
    it('requests /movie/{id} and maps details', async () => {
      const { genre_ids, ...base } = movieDto;
      const detailsDto: TmdbMovieDetailsDto = {
        ...base,
        genres: [{ id: 18, name: 'Drama' }],
        runtime: 139,
        tagline: 'Mischief. Mayhem. Soap.',
        status: 'Released',
        homepage: null,
        imdb_id: 'tt0137523',
        budget: 63000000,
        revenue: 100853753,
      };
      const result = firstValueFrom(api.getMovieDetails(550));

      httpTesting.expectOne(`${config.apiUrl}/movie/550`).flush(detailsDto);

      const details = await result;
      expect(details.genres).toEqual([{ id: 18, name: 'Drama' }]);
      expect(details.runtime).toBe(139);
      expect(details.tagline).toBe('Mischief. Mayhem. Soap.');
    });

    it('propagates HTTP errors', async () => {
      const result = firstValueFrom(api.getMovieDetails(999));

      httpTesting
        .expectOne(`${config.apiUrl}/movie/999`)
        .flush({ status_message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      const error = await result.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(404);
    });
  });

  describe('describeError', () => {
    it('delegates to the TMDb error mapping', () => {
      expect(api.describeError(new HttpErrorResponse({ status: 401 }))).toBe(
        'Invalid TMDb access token',
      );
    });
  });
});
