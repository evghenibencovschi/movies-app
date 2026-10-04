import { Observable } from 'rxjs';
import { Movie, MovieDetails, Paginated } from '../models/movie';

/**
 * Port for the movie data source. Stores and UI depend only on this abstraction;
 * the concrete implementation (e.g. TMDb) is bound in the app config.
 * Being an abstract class, it doubles as the DI token.
 */
export abstract class MoviesApi {
  abstract getPopularMovies(page?: number): Observable<Paginated<Movie>>;

  abstract searchMovies(keyword: string, page?: number): Observable<Paginated<Movie>>;

  abstract getMovieDetails(id: number): Observable<MovieDetails>;

  /** Turns an error emitted by this source into a user-facing message. */
  abstract describeError(error: unknown): string;
}
