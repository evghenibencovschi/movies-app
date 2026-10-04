import { DatePipe, Location, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { StateMessage } from '../../components/state-message/state-message';
import { MovieDetailsStore } from '../../services/movie-details-store';

/** `139` → `2h 19m`, `45` → `45m`. */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) {
    return null;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

@Component({
  imports: [DatePipe, NgOptimizedImage, NgTemplateOutlet, RouterLink, StateMessage],
  providers: [MovieDetailsStore],
  selector: 'app-movie-details',
  templateUrl: './movie-details.html',
})
export class MovieDetails {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Bound from the `:id` route param via `withComponentInputBinding()`. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly details = inject(MovieDetailsStore).details(this.id);
  protected readonly runtime = computed(() => formatRuntime(this.details.value()?.runtime));

  /** True when this page was opened from another page of the app, so history back stays inside it. */
  protected readonly canGoBack = computed(
    () => !!this.router.lastSuccessfulNavigation()?.previousNavigation,
  );

  constructor() {
    const title = inject(Title);
    effect(() => {
      const movie = this.details.value();
      if (movie) {
        title.setTitle(`${movie.title} · Movies`);
      }
    });
  }

  protected back(): void {
    this.location.back();
  }
}
