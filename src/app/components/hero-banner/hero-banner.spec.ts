import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Movie } from '../../models/movie';
import { provideTmdbImageLoader } from '../../services/tmdb/tmdb-image-loader';
import { fakeMovie } from '../../testing/fake-movies-api';
import { HeroBanner } from './hero-banner';

describe('HeroBanner', () => {
  let fixture: ComponentFixture<HeroBanner>;
  let el: HTMLElement;

  const movies = (count: number) => Array.from({ length: count }, (_, i) => fakeMovie(i + 1));
  const slides = () => [...el.querySelectorAll<HTMLElement>('[data-testid="hero-slide"]')];
  const offsets = () => slides().map((slide) => Number(slide.dataset['offset']));
  const activeSlide = () => slides().find((slide) => slide.dataset['offset'] === '0');
  const activeTitle = () => activeSlide()?.querySelector('h2')?.textContent?.trim();
  const indicators = () => [
    ...el.querySelectorAll<HTMLButtonElement>('[data-testid="hero-indicator"]'),
  ];
  const button = (testId: string) =>
    el.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  const imageSlides = () =>
    slides()
      .filter((slide) => slide.querySelector('img'))
      .map((slide) => slide.querySelector('h2')?.textContent?.trim());

  async function render(list: Movie[]): Promise<void> {
    fixture.componentRef.setInput('movies', list);
    await fixture.whenStable();
  }

  async function press(key: 'ArrowLeft' | 'ArrowRight'): Promise<void> {
    activeSlide()
      ?.querySelector('a')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await fixture.whenStable();
  }

  async function click(target: HTMLElement | null | undefined): Promise<void> {
    target?.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroBanner],
      providers: [provideRouter([]), provideTmdbImageLoader('https://image.tmdb.org/t/p')],
    }).compileComponents();
    fixture = TestBed.createComponent(HeroBanner);
    el = fixture.nativeElement;
  });

  it('renders a slide per movie with the first one active', async () => {
    await render(movies(10));

    expect(slides()).toHaveLength(10);
    expect(activeTitle()).toBe('Movie 1');
    expect(slides()[0].getAttribute('aria-label')).toBe('1 of 10: Movie 1');
    expect(el.querySelector('section')?.getAttribute('aria-roledescription')).toBe('carousel');
  });

  it('centres the active card with the previous and next ones peeking around the loop', async () => {
    await render(movies(10));

    // Movie 10 peeks to the left of Movie 1, Movie 2 to the right; the rest are off-screen.
    expect(offsets()).toEqual([0, 1, 2, 3, 4, 5, -4, -3, -2, -1]);

    await click(button('hero-prev'));

    expect(offsets()).toEqual([1, 2, 3, 4, 5, -4, -3, -2, -1, 0]);
  });

  it('hides and disables the content of inactive cards', async () => {
    await render(movies(3));

    const [active, next] = slides();
    expect(active.hasAttribute('aria-hidden')).toBe(false);
    expect(active.querySelector('[inert]')).toBeNull();
    expect(next.getAttribute('aria-hidden')).toBe('true');
    expect(next.querySelector('a')?.closest('[inert]')).not.toBeNull();
  });

  it('switches to a peeking card on click and ignores clicks on off-screen ones', async () => {
    await render(movies(10));

    await click(slides()[1]);
    expect(activeTitle()).toBe('Movie 2');

    await click(slides()[0]);
    expect(activeTitle()).toBe('Movie 1');

    await click(slides()[5]);
    expect(activeTitle()).toBe('Movie 1');
  });

  it('renders the title, rating, year and overview of a slide', async () => {
    await render([
      fakeMovie(550, {
        title: 'Fight Club',
        rating: 8.4,
        releaseDate: '1999-10-15',
        overview: 'An insomniac office worker...',
      }),
    ]);

    expect(activeTitle()).toBe('Fight Club');
    expect(el.textContent).toContain('8.4');
    expect(el.textContent).toContain('1999');
    expect(el.textContent).toContain('An insomniac office worker...');
  });

  it('omits missing optional fields', async () => {
    await render([fakeMovie(550, { rating: 0, releaseDate: null, overview: null })]);

    expect(el.textContent).not.toContain('★');
    expect(activeSlide()?.querySelectorAll('p')).toHaveLength(2);
  });

  it('links Details of the active slide to its movie page', async () => {
    await render(movies(3));
    await click(button('hero-next'));

    const details = activeSlide()?.querySelector('a');
    expect(details?.textContent).toContain('Details');
    expect(details?.getAttribute('href')).toBe('/movie/2');
  });

  it('switches slides with the arrows and wraps around', async () => {
    await render(movies(10));

    await click(button('hero-prev'));
    expect(activeTitle()).toBe('Movie 10');

    await click(button('hero-next'));
    expect(activeTitle()).toBe('Movie 1');

    await click(button('hero-next'));
    expect(activeTitle()).toBe('Movie 2');
  });

  it('switches slides with ←/→ when focus is inside', async () => {
    await render(movies(10));

    await press('ArrowRight');
    expect(activeTitle()).toBe('Movie 2');

    await press('ArrowLeft');
    await press('ArrowLeft');
    expect(activeTitle()).toBe('Movie 10');
  });

  it('jumps to a slide from its indicator and marks it current', async () => {
    await render(movies(10));

    expect(indicators()).toHaveLength(10);
    expect(indicators()[0].getAttribute('aria-current')).toBe('true');

    await click(indicators()[4]);

    expect(activeTitle()).toBe('Movie 5');
    expect(indicators()[4].getAttribute('aria-current')).toBe('true');
    expect(indicators().filter((b) => b.hasAttribute('aria-current'))).toHaveLength(1);
    expect(indicators()[4].getAttribute('aria-label')).toBe('Go to slide 5: Movie 5');
  });

  it('renders backdrops only for the active, neighbouring and visited slides', async () => {
    await render(movies(10));

    expect(imageSlides()).toEqual(['Movie 1', 'Movie 2', 'Movie 10']);

    await click(indicators()[4]);

    expect(imageSlides()).toEqual(['Movie 1', 'Movie 4', 'Movie 5', 'Movie 6']);
  });

  it('loads the first backdrop eagerly as a decorative image', async () => {
    await render([fakeMovie(550, { backdropPath: '/fc-backdrop.jpg' }), fakeMovie(551)]);

    const [first, second] = slides().map((slide) => slide.querySelector('img'));
    expect(first?.getAttribute('alt')).toBe('');
    expect(first?.getAttribute('loading')).toBe('eager');
    expect(first?.getAttribute('fetchpriority')).toBe('high');
    expect(first?.getAttribute('srcset')).toContain(
      'https://image.tmdb.org/t/p/w1280/fc-backdrop.jpg 1280w',
    );
    expect(second?.getAttribute('loading')).toBe('lazy');
  });

  it('keeps the active slide when the list is replaced by an equally long one', async () => {
    await render(movies(10));
    await click(indicators()[3]);

    await render(movies(10).map((movie) => ({ ...movie, title: `New ${movie.id}` })));
    expect(activeTitle()).toBe('New 4');

    await render(movies(2));
    expect(activeTitle()).toBe('Movie 1');
  });

  describe('autoplay', () => {
    const section = () => el.querySelector('section')!;
    const progress = () => el.querySelector<HTMLElement>('[data-testid="hero-progress"]');
    const playState = () => progress()?.style.animationPlayState;
    const live = () => el.querySelector('[aria-live]')?.getAttribute('aria-live');

    async function dispatch(target: EventTarget, event: Event): Promise<void> {
      target.dispatchEvent(event);
      await fixture.whenStable();
    }

    const pointer = (type: string, pointerType: string, clientX = 0) =>
      new PointerEvent(type, { pointerType, clientX, bubbles: true });

    afterEach(() => {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(document, 'hidden');
    });

    it('fills the active indicator over 7 seconds and moves on when it is full', async () => {
      await render(movies(10));

      expect(indicators()[0].contains(progress())).toBe(true);
      expect(progress()?.style.animationDuration).toBe('7000ms');
      expect(playState()).toBe('running');
      expect(live()).toBe('off');

      await dispatch(progress()!, new Event('animationend'));

      expect(activeTitle()).toBe('Movie 2');
      expect(indicators()[1].contains(progress())).toBe(true);
    });

    it('wraps from the last slide to the first', async () => {
      await render(movies(10));
      await click(indicators()[9]);

      await dispatch(progress()!, new Event('animationend'));

      expect(activeTitle()).toBe('Movie 1');
    });

    it('restarts the countdown after a manual switch', async () => {
      await render(movies(10));
      const before = progress();

      await click(button('hero-next'));

      expect(progress()).not.toBe(before);
      expect(indicators()[1].contains(progress())).toBe(true);
    });

    it('pauses while the mouse is over the carousel, but not after a tap', async () => {
      await render(movies(10));

      await dispatch(section(), pointer('pointerenter', 'touch'));
      expect(playState()).toBe('running');

      await dispatch(section(), pointer('pointerenter', 'mouse'));
      expect(playState()).toBe('paused');
      expect(live()).toBe('polite');

      await dispatch(section(), pointer('pointerleave', 'mouse'));
      expect(playState()).toBe('running');
    });

    it('stays paused when a touch pointer leaves while the mouse is over', async () => {
      await render(movies(10));

      await dispatch(section(), pointer('pointerenter', 'mouse'));
      await dispatch(section(), pointer('pointerleave', 'touch'));

      expect(playState()).toBe('paused');
    });

    it('stops listening to the reduced-motion setting when destroyed', async () => {
      const removeEventListener = vi.fn();
      vi.stubGlobal('matchMedia', () => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener,
      }));
      fixture.destroy();
      fixture = TestBed.createComponent(HeroBanner);
      el = fixture.nativeElement;
      await render(movies(3));

      fixture.destroy();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('ignores focus left by a mouse click', async () => {
      await render(movies(10));
      const next = button('hero-next')!;
      vi.spyOn(next, 'matches').mockReturnValue(false);

      next.focus();
      await fixture.whenStable();

      expect(playState()).toBe('running');
    });

    it('pauses while keyboard focus is inside', async () => {
      await render(movies(10));
      const details = activeSlide()!.querySelector('a')!;

      // jsdom cannot tell keyboard focus from programmatic focus: simulate `:focus-visible`.
      vi.spyOn(details, 'matches').mockReturnValue(true);
      details.focus();
      await fixture.whenStable();
      expect(playState()).toBe('paused');

      await dispatch(
        details,
        new FocusEvent('focusout', { bubbles: true, relatedTarget: button('hero-next') }),
      );
      expect(playState()).toBe('paused');

      await dispatch(details, new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      expect(playState()).toBe('running');
    });

    it('pauses while the page is hidden', async () => {
      await render(movies(10));

      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      await dispatch(document, new Event('visibilitychange'));
      expect(playState()).toBe('paused');

      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      await dispatch(document, new Event('visibilitychange'));
      expect(playState()).toBe('running');
    });

    it('does not autoplay with reduced motion', async () => {
      let onChange: ((event: { matches: boolean }) => void) | undefined;
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        addEventListener: (_: string, listener: typeof onChange) => (onChange = listener),
        removeEventListener: vi.fn(),
      }));
      fixture.destroy();
      fixture = TestBed.createComponent(HeroBanner);
      el = fixture.nativeElement;
      await render(movies(10));

      expect(progress()).toBeNull();
      expect(indicators()[0].querySelector('span')?.classList).toContain('bg-text');
      expect(live()).toBe('polite');

      onChange?.({ matches: false });
      await fixture.whenStable();
      expect(progress()).not.toBeNull();
    });

    it('does not autoplay a single slide', async () => {
      await render(movies(1));

      expect(progress()).toBeNull();
    });

    it('switches slides with a horizontal swipe', async () => {
      await render(movies(10));

      await dispatch(section(), pointer('pointerdown', 'touch', 300));
      await dispatch(section(), pointer('pointerup', 'touch', 200));
      expect(activeTitle()).toBe('Movie 2');

      await dispatch(section(), pointer('pointerdown', 'touch', 100));
      await dispatch(section(), pointer('pointerup', 'touch', 200));
      expect(activeTitle()).toBe('Movie 1');
    });

    it('ignores short swipes, cancelled swipes and mouse drags', async () => {
      await render(movies(10));

      await dispatch(section(), pointer('pointerdown', 'touch', 300));
      await dispatch(section(), pointer('pointerup', 'touch', 270));

      await dispatch(section(), pointer('pointerdown', 'touch', 300));
      await dispatch(section(), pointer('pointercancel', 'touch'));
      await dispatch(section(), pointer('pointerup', 'touch', 100));

      await dispatch(section(), pointer('pointerdown', 'mouse', 300));
      await dispatch(section(), pointer('pointerup', 'mouse', 100));

      expect(activeTitle()).toBe('Movie 1');
    });
  });

  it('renders nothing for an empty list', async () => {
    await render([]);

    expect(slides()).toHaveLength(0);
    expect(indicators()).toHaveLength(0);
    expect(button('hero-next')).toBeNull();
  });

  it('hides the controls for a single slide', async () => {
    await render([fakeMovie(550, { backdropPath: null })]);

    expect(el.querySelector('img')).toBeNull();
    expect(button('hero-next')).toBeNull();
    expect(indicators()).toHaveLength(0);
  });
});
