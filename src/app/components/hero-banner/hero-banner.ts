import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie';

/** Backdrop widths follow the card width: 86% → 72% → 60% of the viewport. */
const BACKDROP_SIZES = '(min-width: 1024px) 60vw, (min-width: 768px) 72vw, 86vw';

/** How long a slide stays before the carousel moves on by itself. */
const AUTOPLAY_MS = 7000;

/** Minimal horizontal finger travel that counts as a swipe. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * Carousel of featured movies as cards: the active one is centred, its neighbours peek at the
 * edges. Each card shows the backdrop, title, overview and a Details link. Slides move sideways
 * and wrap around; arrows, indicators, ←/→, swipes and a click on a peeking card switch them.
 *
 * Autoplay is driven by the progress animation of the active indicator: when it ends, the next
 * slide is shown. Pausing the animation (hover, keyboard focus, hidden tab) pauses autoplay with
 * it, and any switch restarts the countdown. With reduced motion there is no autoplay.
 */
@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-hero-banner',
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.css',
  host: { '(document:visibilitychange)': 'pageHidden.set(document.hidden)' },
})
export class HeroBanner {
  readonly movies = input.required<Movie[]>();

  protected readonly document = inject(DOCUMENT);
  protected readonly backdropSizes = BACKDROP_SIZES;
  protected readonly autoplayMs = AUTOPLAY_MS;

  private readonly hovered = signal(false);
  private readonly focused = signal(false);
  protected readonly pageHidden = signal(this.document.hidden);
  private readonly reducedMotion = signal(false);
  /** Where the current touch started, or `null` when no swipe is in progress. */
  private swipeStartX: number | null = null;

  protected readonly autoplay = computed(() => !this.reducedMotion() && this.movies().length > 1);
  protected readonly paused = computed(() => this.hovered() || this.focused() || this.pageHidden());

  constructor() {
    const query = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      this.reducedMotion.set(query.matches);
      const onChange = (event: MediaQueryListEvent) => this.reducedMotion.set(event.matches);
      query.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
    }
  }

  /** Index of the visible slide; kept while it still exists in a new list, otherwise the first. */
  protected readonly active = linkedSignal<Movie[], number>({
    source: this.movies,
    computation: (movies, previous) =>
      previous && previous.value < movies.length ? previous.value : 0,
  });

  /** Ids of slides already shown, so their backdrops stay rendered after leaving them. */
  private readonly visited = linkedSignal<number, Set<number>>({
    source: () => this.movies()[this.active()]?.id,
    computation: (id, previous) => new Set(previous?.value).add(id),
  });

  /**
   * Ids of slides whose backdrop is rendered: visited ones plus the neighbours of the active one,
   * so the next slide never shows an empty slide and the other backdrops are not downloaded upfront.
   */
  protected readonly withImage = computed(() => {
    const movies = this.movies();
    const ids = new Set(this.visited());
    for (const offset of [-1, 1]) {
      const neighbour = movies[this.wrap(this.active() + offset)];
      if (neighbour) {
        ids.add(neighbour.id);
      }
    }
    return ids;
  });

  /**
   * Position of each slide relative to the active one along the shortest way around the loop:
   * 0 is centred, -1/1 peek at the edges, the rest are off-screen. Wrapping keeps the last slide
   * peeking to the left of the first one.
   */
  protected readonly offsets = computed(() => {
    const count = this.movies().length;
    return this.movies().map((_, i) => {
      const offset = this.wrap(i - this.active());
      return offset > count / 2 ? offset - count : offset;
    });
  });

  next(): void {
    this.goTo(this.active() + 1);
  }

  prev(): void {
    this.goTo(this.active() - 1);
  }

  goTo(index: number): void {
    this.active.set(this.wrap(index));
  }

  /** Pauses on mouse hover only: a tap must not leave a touch device paused. */
  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.hovered.set(true);
    }
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.hovered.set(false);
    }
  }

  /** Pauses for keyboard focus only: a clicked arrow keeps focus after the mouse has left. */
  protected onFocusIn(event: FocusEvent): void {
    this.focused.set((event.target as Element).matches(':focus-visible'));
  }

  protected onFocusOut(event: FocusEvent): void {
    const carousel = event.currentTarget as Element;
    if (!carousel.contains(event.relatedTarget as Node | null)) {
      this.focused.set(false);
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    this.swipeStartX = event.pointerType === 'mouse' ? null : event.clientX;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.swipeStartX === null) {
      return;
    }
    const distance = event.clientX - this.swipeStartX;
    this.swipeStartX = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) {
      return;
    }
    if (distance < 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  protected onPointerCancel(): void {
    this.swipeStartX = null;
  }

  protected year(movie: Movie): string | null {
    return movie.releaseDate?.slice(0, 4) ?? null;
  }

  private wrap(index: number): number {
    const count = this.movies().length;
    return count ? (index + count) % count : 0;
  }
}
