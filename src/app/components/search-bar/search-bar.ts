import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';

/** Delay between the last keystroke and the automatic search. */
export const SEARCH_DEBOUNCE_MS = 1000;

/**
 * Search field. Emits `search` after typing stops for `SEARCH_DEBOUNCE_MS`,
 * immediately on Enter / the Search button, and with `''` when cleared.
 * Knows nothing about the store: the parent decides what a search means.
 */
@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
})
export class SearchBar {
  /** Current committed query (e.g. from the store); external changes such as a reset replace the text. */
  readonly query = input('');
  readonly search = output<string>();

  /**
   * Text in the field. Keeps what the user typed when it only differs from `query` by whitespace,
   * so emitting `'the'` for `'the '` does not eat the space being typed.
   */
  protected readonly value = linkedSignal<string, string>({
    source: this.query,
    computation: (query, previous) => (previous?.value.trim() === query ? previous.value : query),
  });

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelPending());
  }

  protected onInput(text: string): void {
    this.value.set(text);
    this.cancelPending();
    this.timer = setTimeout(() => this.emit(), SEARCH_DEBOUNCE_MS);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.emit();
  }

  protected clear(): void {
    this.value.set('');
    this.emit();
    this.field().nativeElement.focus();
  }

  private emit(): void {
    this.cancelPending();
    this.search.emit(this.value().trim());
  }

  private cancelPending(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
