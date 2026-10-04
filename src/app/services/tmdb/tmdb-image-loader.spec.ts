import { tmdbImageLoader, tmdbImageSize } from './tmdb-image-loader';

describe('tmdbImageSize', () => {
  it('picks the smallest CDN size that covers the requested width', () => {
    expect(tmdbImageSize(50)).toBe('w92');
    expect(tmdbImageSize(92)).toBe('w92');
    expect(tmdbImageSize(93)).toBe('w185');
    expect(tmdbImageSize(342)).toBe('w342');
    expect(tmdbImageSize(400)).toBe('w500');
    expect(tmdbImageSize(780)).toBe('w780');
    expect(tmdbImageSize(1080)).toBe('w1280');
  });

  it('falls back to original for widths above the largest fixed size', () => {
    expect(tmdbImageSize(1920)).toBe('original');
  });

  it('uses w780 when no width is requested', () => {
    expect(tmdbImageSize(undefined)).toBe('w780');
  });
});

describe('tmdbImageLoader', () => {
  const loader = tmdbImageLoader('https://image.tmdb.org/t/p');

  it('builds the CDN URL from the relative path and width', () => {
    expect(loader({ src: '/poster.jpg', width: 342 })).toBe(
      'https://image.tmdb.org/t/p/w342/poster.jpg',
    );
  });

  it('builds the fallback URL without a width', () => {
    expect(loader({ src: '/poster.jpg' })).toBe('https://image.tmdb.org/t/p/w780/poster.jpg');
  });
});
