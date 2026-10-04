/** Raw TMDb API response shapes (https://developer.themoviedb.org/reference). */

export interface TmdbMovieDto {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  genre_ids?: number[];
}

export interface TmdbGenreDto {
  id: number;
  name: string;
}

export interface TmdbMovieDetailsDto extends Omit<TmdbMovieDto, 'genre_ids'> {
  genres: TmdbGenreDto[];
  runtime: number | null;
  tagline: string | null;
  status: string;
  homepage: string | null;
  imdb_id: string | null;
  budget: number;
  revenue: number;
}

export interface TmdbPaginatedDto<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
