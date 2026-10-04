export interface Movie {
  id: number;
  title: string;
  overview: string | null;
  /** Relative TMDb image path (e.g. `/abc.jpg`); the full URL is built by the image loader. */
  posterPath: string | null;
  backdropPath: string | null;
  /** ISO date `YYYY-MM-DD`. */
  releaseDate: string | null;
  /** Average vote, 0–10, rounded to one decimal. */
  rating: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  /** Runtime in minutes. */
  runtime: number | null;
  tagline: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}
