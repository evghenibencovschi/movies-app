import { HttpErrorResponse } from '@angular/common/http';
import { TmdbMovieDetailsDto, TmdbMovieDto, TmdbPaginatedDto } from './tmdb-dto';
import { toErrorMessage, toMovie, toMovieDetails, toPaginated } from './tmdb-mapper';

function movieDto(overrides: Partial<TmdbMovieDto> = {}): TmdbMovieDto {
  return {
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
    ...overrides,
  };
}

function detailsDto(overrides: Partial<TmdbMovieDetailsDto> = {}): TmdbMovieDetailsDto {
  const { genre_ids, ...base } = movieDto();
  return {
    ...base,
    genres: [{ id: 18, name: 'Drama' }],
    runtime: 139,
    tagline: 'Mischief. Mayhem. Soap.',
    status: 'Released',
    homepage: null,
    imdb_id: 'tt0137523',
    budget: 63000000,
    revenue: 100853753,
    ...overrides,
  };
}

describe('tmdb-mapper', () => {
  describe('toMovie', () => {
    it('maps a full DTO to the domain model', () => {
      expect(toMovie(movieDto())).toEqual({
        id: 550,
        title: 'Fight Club',
        overview: 'An insomniac office worker...',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: '1999-10-15',
        rating: 8.4,
      });
    });

    it('turns empty and missing fields into null', () => {
      const movie = toMovie(
        movieDto({ overview: '', poster_path: null, backdrop_path: null, release_date: '' }),
      );

      expect(movie.overview).toBeNull();
      expect(movie.posterPath).toBeNull();
      expect(movie.backdropPath).toBeNull();
      expect(movie.releaseDate).toBeNull();
    });

    it('rounds the rating to one decimal', () => {
      expect(toMovie(movieDto({ vote_average: 7.26 })).rating).toBe(7.3);
      expect(toMovie(movieDto({ vote_average: 0 })).rating).toBe(0);
    });

    it('does not leak snake_case fields', () => {
      const keys = Object.keys(toMovieDetails(detailsDto()));
      expect(keys.some((key) => key.includes('_'))).toBe(false);
    });
  });

  describe('toMovieDetails', () => {
    it('maps genres, runtime and tagline on top of the base movie', () => {
      expect(toMovieDetails(detailsDto())).toEqual({
        ...toMovie(movieDto()),
        genres: [{ id: 18, name: 'Drama' }],
        runtime: 139,
        tagline: 'Mischief. Mayhem. Soap.',
      });
    });

    it('turns empty tagline and zero runtime into null', () => {
      const details = toMovieDetails(detailsDto({ tagline: '', runtime: 0, genres: [] }));

      expect(details.tagline).toBeNull();
      expect(details.runtime).toBeNull();
      expect(details.genres).toEqual([]);
    });

    it('tolerates fields missing from the response', () => {
      const dto = {
        ...detailsDto(),
        vote_average: undefined,
        genres: undefined,
        runtime: null,
        tagline: undefined,
      } as unknown as TmdbMovieDetailsDto;

      const details = toMovieDetails(dto);

      expect(details.rating).toBe(0);
      expect(details.genres).toEqual([]);
      expect(details.runtime).toBeNull();
      expect(details.tagline).toBeNull();
    });
  });

  describe('toPaginated', () => {
    it('maps pagination meta and items', () => {
      const dto: TmdbPaginatedDto<TmdbMovieDto> = {
        page: 2,
        results: [movieDto({ id: 1 }), movieDto({ id: 2 })],
        total_pages: 10,
        total_results: 200,
      };

      const result = toPaginated(dto, toMovie);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(10);
      expect(result.totalResults).toBe(200);
      expect(result.items.map((m) => m.id)).toEqual([1, 2]);
    });
  });

  describe('toErrorMessage', () => {
    const httpError = (status: number) => new HttpErrorResponse({ status });

    it.each([
      [0, 'Network error. Check your connection'],
      [401, 'Invalid TMDb access token'],
      [404, 'Movie not found'],
      [500, 'Something went wrong. Please try again'],
    ])('maps HTTP %i to a readable message', (status, message) => {
      expect(toErrorMessage(httpError(status))).toBe(message);
    });

    it('falls back to a generic message for non-HTTP errors', () => {
      expect(toErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again');
      expect(toErrorMessage(undefined)).toBe('Something went wrong. Please try again');
    });
  });
});
