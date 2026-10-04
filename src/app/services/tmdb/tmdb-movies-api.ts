import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Movie, MovieDetails, Paginated } from '../../models/movie';
import { MoviesApi } from '../movies-api';
import { TMDB_CONFIG } from './tmdb-config';
import { TmdbMovieDetailsDto, TmdbMovieDto, TmdbPaginatedDto } from './tmdb-dto';
import { toErrorMessage, toMovie, toMovieDetails, toPaginated } from './tmdb-mapper';

/** `MoviesApi` backed by TMDb API v3. Auth and language are added by `tmdbAuthInterceptor`. */
@Injectable()
export class TmdbMoviesApi extends MoviesApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(TMDB_CONFIG);

  override getPopularMovies(page = 1): Observable<Paginated<Movie>> {
    const params = new HttpParams().set('page', page);
    return this.http
      .get<TmdbPaginatedDto<TmdbMovieDto>>(this.url('/movie/popular'), { params })
      .pipe(map((dto) => toPaginated(dto, toMovie)));
  }

  override searchMovies(keyword: string, page = 1): Observable<Paginated<Movie>> {
    const params = new HttpParams()
      .set('query', keyword)
      .set('page', page)
      .set('include_adult', false);
    return this.http
      .get<TmdbPaginatedDto<TmdbMovieDto>>(this.url('/search/movie'), { params })
      .pipe(map((dto) => toPaginated(dto, toMovie)));
  }

  override getMovieDetails(id: number): Observable<MovieDetails> {
    return this.http.get<TmdbMovieDetailsDto>(this.url(`/movie/${id}`)).pipe(map(toMovieDetails));
  }

  override describeError(error: unknown): string {
    return toErrorMessage(error);
  }

  private url(path: string): string {
    return `${this.config.apiUrl}${path}`;
  }
}
