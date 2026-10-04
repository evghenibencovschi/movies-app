import { HttpErrorResponse } from '@angular/common/http';
import { Genre, Movie, MovieDetails, Paginated } from '../../models/movie';
import { TmdbGenreDto, TmdbMovieDetailsDto, TmdbMovieDto, TmdbPaginatedDto } from './tmdb-dto';

/** TMDb sends missing text fields as `''` or `null`; the domain uses `null` for both. */
function emptyToNull(value: string | null | undefined): string | null {
  return value?.trim() ? value : null;
}

function toRating(voteAverage: number | null | undefined): number {
  return Math.round((voteAverage ?? 0) * 10) / 10;
}

function toGenre(dto: TmdbGenreDto): Genre {
  return { id: dto.id, name: dto.name };
}

export function toMovie(dto: TmdbMovieDto): Movie {
  return {
    id: dto.id,
    title: dto.title,
    overview: emptyToNull(dto.overview),
    posterPath: emptyToNull(dto.poster_path),
    backdropPath: emptyToNull(dto.backdrop_path),
    releaseDate: emptyToNull(dto.release_date),
    rating: toRating(dto.vote_average),
  };
}

export function toMovieDetails(dto: TmdbMovieDetailsDto): MovieDetails {
  return {
    ...toMovie(dto),
    genres: (dto.genres ?? []).map(toGenre),
    runtime: dto.runtime || null,
    tagline: emptyToNull(dto.tagline),
  };
}

export function toPaginated<TDto, T>(
  dto: TmdbPaginatedDto<TDto>,
  mapFn: (item: TDto) => T,
): Paginated<T> {
  return {
    items: dto.results.map(mapFn),
    page: dto.page,
    totalPages: dto.total_pages,
    totalResults: dto.total_results,
  };
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0:
        return 'Network error. Check your connection';
      case 401:
        return 'Invalid TMDb access token';
      case 404:
        return 'Movie not found';
    }
  }
  return 'Something went wrong. Please try again';
}
