import { Component, computed, input } from '@angular/core';
import { Movie } from '../../models/movie';
import { MovieCard } from '../movie-card/movie-card';

/** Cards in the first row (up to 6 columns) load eagerly: they are the LCP candidates. */
const PRIORITY_CARDS = 6;

/** Movie grid. While loading, skeleton cards are appended so the layout below does not jump. */
@Component({
  imports: [MovieCard],
  selector: 'app-movie-list',
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.css',
})
export class MovieList {
  readonly movies = input.required<Movie[]>();
  readonly loading = input(false);

  protected readonly priorityCards = PRIORITY_CARDS;
  /** Two rows of skeletons for the first load, one row when appending a page. */
  protected readonly skeletons = computed(() =>
    this.loading() ? Array.from({ length: this.movies().length ? 6 : 12 }, (_, i) => i) : [],
  );
}
