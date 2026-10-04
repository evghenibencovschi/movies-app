import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SEARCH_DEBOUNCE_MS, SearchBar } from './search-bar';

describe('SearchBar', () => {
  let fixture: ComponentFixture<SearchBar>;
  let el: HTMLElement;
  let emitted: string[];

  const field = () => el.querySelector<HTMLInputElement>('input[type="search"]')!;
  const clearButton = () => el.querySelector<HTMLButtonElement>('[aria-label="Clear search"]');

  function type(text: string): void {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [SearchBar] }).compileComponents();
    fixture = TestBed.createComponent(SearchBar);
    el = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.search.subscribe((query) => emitted.push(query));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits the trimmed text once typing stops for the debounce time', () => {
    type('mat');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    type('matrix ');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    expect(emitted).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(emitted).toEqual(['matrix']);
  });

  it('searches immediately on submit and drops the pending debounce', () => {
    type('alien');
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(emitted).toEqual(['alien']);

    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(emitted).toEqual(['alien']);
  });

  it('prevents the native form submission', () => {
    const event = new Event('submit', { cancelable: true });
    el.querySelector('form')!.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('clears the field, emits an empty query and focuses the input', () => {
    type('matrix');
    expect(clearButton()).not.toBeNull();

    clearButton()!.click();
    fixture.detectChanges();

    expect(emitted).toEqual(['']);
    expect(field().value).toBe('');
    expect(clearButton()).toBeNull();
    expect(document.activeElement).toBe(field());

    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(emitted).toEqual(['']);
  });

  it('shows the query set from outside', () => {
    fixture.componentRef.setInput('query', 'matrix');
    fixture.detectChanges();

    expect(field().value).toBe('matrix');
  });

  it('keeps the typed trailing space when the committed query is its trimmed version', () => {
    type('the ');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    fixture.componentRef.setInput('query', emitted[0]);
    fixture.detectChanges();

    expect(field().value).toBe('the ');
  });

  it('replaces the text when the query is reset from outside', () => {
    fixture.componentRef.setInput('query', 'matrix');
    fixture.detectChanges();

    fixture.componentRef.setInput('query', '');
    fixture.detectChanges();

    expect(field().value).toBe('');
  });

  it('drops the pending search when destroyed', () => {
    type('matrix');
    fixture.destroy();

    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(emitted).toEqual([]);
  });
});
