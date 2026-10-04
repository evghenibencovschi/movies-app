import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie';

/** Poster widths follow the movie grid: 2 → 3 → 4 → 5 → 6 columns. */
const POSTER_SIZES =
  '(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-movie-card',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  readonly movie = input.required<Movie>();
  /** Eagerly loads the poster; set for cards in the first visible row (LCP). */
  readonly priority = input(false);

  protected readonly posterSizes = POSTER_SIZES;
  protected readonly year = computed(() => this.movie().releaseDate?.slice(0, 4) ?? null);
}
