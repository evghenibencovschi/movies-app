import { Component, computed, inject } from '@angular/core';
import { HeroBanner } from '../../components/hero-banner/hero-banner';
import { MovieList } from '../../components/movie-list/movie-list';
import { StateMessage } from '../../components/state-message/state-message';
import { Movie } from '../../models/movie';
import { MovieStore } from '../../services/movie-store';

/** Number of popular movies cycled in the hero carousel. */
const HERO_SLIDES = 10;

function sameIds(a: Movie[], b: Movie[]): boolean {
  return a.length === b.length && a.every((movie, i) => movie.id === b[i].id);
}

@Component({
  imports: [HeroBanner, MovieList, StateMessage],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly store = inject(MovieStore);

  /**
   * Hero slides: the first popular movies with a backdrop; none while searching.
   * Compared by ids, so "Load more" (which keeps the first page) does not re-render the carousel.
   */
  protected readonly heroMovies = computed(
    () =>
      this.store.isSearch()
        ? []
        : this.store
            .movies()
            .filter((movie) => movie.backdropPath)
            .slice(0, HERO_SLIDES),
    { equal: sameIds },
  );
}
