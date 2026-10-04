import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Movie } from '../../models/movie';
import { provideTmdbImageLoader } from '../../services/tmdb/tmdb-image-loader';
import { fakeMovie } from '../../testing/fake-movies-api';
import { MovieCard } from './movie-card';

describe('MovieCard', () => {
  let fixture: ComponentFixture<MovieCard>;
  let el: HTMLElement;

  async function render(movie: Movie, priority = false): Promise<void> {
    fixture.componentRef.setInput('movie', movie);
    fixture.componentRef.setInput('priority', priority);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCard],
      providers: [provideRouter([]), provideTmdbImageLoader('https://image.tmdb.org/t/p')],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieCard);
    el = fixture.nativeElement;
  });

  it('renders the title as the heading and the hover details', async () => {
    await render(
      fakeMovie(42, {
        title: 'Fight Club',
        overview: 'An insomniac office worker',
        rating: 8.4,
        releaseDate: '1999-10-15',
      }),
    );

    expect(el.querySelector('h3')?.textContent?.trim()).toBe('Fight Club');
    const details = el.querySelector('[data-testid="card-details"]');
    expect(details?.textContent).toContain('Fight Club');
    expect(details?.textContent).toContain('★ 8.4');
    expect(details?.textContent).toContain('1999');
    expect(el.querySelector('[data-testid="card-overview"]')?.textContent?.trim()).toBe(
      'An insomniac office worker',
    );
  });

  it('shows the heading only on touch screens and the details only on hover or focus', async () => {
    await render(fakeMovie(42));

    const heading = el.querySelector('h3')?.parentElement;
    expect(heading?.classList).toContain('sr-only');
    expect(heading?.classList).toContain('touch:not-sr-only');
    const details = el.querySelector('[data-testid="card-details"]');
    expect(details?.classList).toContain('opacity-0');
    expect(details?.classList).toContain('group-hover:opacity-100');
    expect(details?.classList).toContain('group-focus-visible:opacity-100');
    const tile = el.querySelector('[data-testid="card-tile"]');
    expect(tile?.classList).toContain('group-hover:scale-130');
    expect(tile?.classList).toContain('group-focus-visible:scale-130');
  });

  it('hides the visual title copy from screen readers', async () => {
    await render(fakeMovie(42, { title: 'Fight Club' }));

    const copies = [...el.querySelectorAll('[aria-hidden="true"]')].filter(
      (node) => node.textContent?.trim() === 'Fight Club',
    );
    expect(copies).toHaveLength(1);
    expect(el.querySelector('a')?.textContent?.match(/Fight Club/g)).toHaveLength(2);
  });

  it('links to the movie details page', async () => {
    await render(fakeMovie(42));

    expect(el.querySelector('a')?.getAttribute('href')).toBe('/movie/42');
  });

  it('loads the poster from the TMDb CDN as a decorative image', async () => {
    await render(fakeMovie(42, { title: 'Fight Club', posterPath: '/fc.jpg' }));

    const img = el.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('src')).toBe('https://image.tmdb.org/t/p/w780/fc.jpg');
    expect(img?.getAttribute('srcset')).toContain('https://image.tmdb.org/t/p/w342/fc.jpg 342w');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(el.querySelector('[data-testid="poster-placeholder"]')).toBeNull();
  });

  it('loads the poster eagerly when priority is set', async () => {
    await render(fakeMovie(42), true);

    expect(el.querySelector('img')?.getAttribute('loading')).toBe('eager');
    expect(el.querySelector('img')?.getAttribute('fetchpriority')).toBe('high');
  });

  it('shows a placeholder when the movie has no poster', async () => {
    await render(fakeMovie(42, { posterPath: null }));

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('[data-testid="poster-placeholder"]')).not.toBeNull();
  });

  it('shows the rating and year only when known', async () => {
    await render(fakeMovie(42, { rating: 8 }));
    expect(el.textContent).toContain('★ 8.0');

    await render(fakeMovie(42, { rating: 0, releaseDate: '1999-10-15' }));
    expect(el.querySelector('[data-testid="card-meta"]')?.textContent?.trim()).toBe('1999');

    await render(fakeMovie(42, { rating: 6.5, releaseDate: null }));
    expect(el.querySelector('[data-testid="card-meta"]')?.textContent).toContain('★ 6.5');
    expect(el.querySelector('[data-testid="card-meta"]')?.textContent).not.toMatch(/\d{4}/);

    await render(fakeMovie(42, { rating: 0, releaseDate: null }));
    expect(el.textContent).not.toContain('★');
    expect(el.querySelector('[data-testid="card-meta"]')).toBeNull();
  });

  it('omits the overview paragraph when there is none', async () => {
    await render(fakeMovie(42, { overview: null }));

    expect(el.querySelector('[data-testid="card-overview"]')).toBeNull();
  });
});
