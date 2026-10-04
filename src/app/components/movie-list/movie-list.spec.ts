import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Movie } from '../../models/movie';
import { fakeMovie } from '../../testing/fake-movies-api';
import { MovieList } from './movie-list';

describe('MovieList', () => {
  let fixture: ComponentFixture<MovieList>;
  let el: HTMLElement;

  const movies = (count: number): Movie[] =>
    Array.from({ length: count }, (_, i) => fakeMovie(i + 1));

  async function render(list: Movie[], loading = false): Promise<void> {
    fixture.componentRef.setInput('movies', list);
    fixture.componentRef.setInput('loading', loading);
    await fixture.whenStable();
  }

  const cards = () => el.querySelectorAll('app-movie-card');
  const skeletons = () => el.querySelectorAll('[data-testid="skeleton"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieList],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(MovieList);
    el = fixture.nativeElement;
  });

  it('renders a card per movie and no skeletons when idle', async () => {
    await render(movies(8));

    expect(cards()).toHaveLength(8);
    expect(skeletons()).toHaveLength(0);
    expect(el.querySelector('ul')?.getAttribute('aria-busy')).toBe('false');
  });

  it('loads only the first row of posters eagerly', async () => {
    await render(movies(8));

    const loading = [...el.querySelectorAll('img')].map((img) => img.getAttribute('loading'));
    expect(loading).toEqual([...Array(6).fill('eager'), 'lazy', 'lazy']);
  });

  it('shows two rows of skeletons on the first load', async () => {
    await render([], true);

    expect(cards()).toHaveLength(0);
    expect(skeletons()).toHaveLength(12);
    expect(el.querySelector('ul')?.getAttribute('aria-busy')).toBe('true');
  });

  it('appends a row of skeletons after the movies while loading more', async () => {
    await render(movies(20), true);

    expect(cards()).toHaveLength(20);
    expect(skeletons()).toHaveLength(6);
    expect(el.querySelector('ul')?.lastElementChild?.getAttribute('data-testid')).toBe('skeleton');
  });
});
