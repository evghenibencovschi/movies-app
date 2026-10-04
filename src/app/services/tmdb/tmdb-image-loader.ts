import { IMAGE_CONFIG, IMAGE_LOADER, ImageLoader, ImageLoaderConfig } from '@angular/common';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

/** Fixed widths served by the TMDb image CDN (`/t/p/w{N}/...`); anything wider is `original`. */
export const TMDB_IMAGE_WIDTHS = [92, 185, 342, 500, 780, 1280] as const;

/** Size used when `NgOptimizedImage` asks for the fallback `src` without a width. */
const DEFAULT_SIZE = 'w780';

/** Smallest TMDb size that is at least `width` pixels wide. */
export function tmdbImageSize(width: number | undefined): string {
  if (width === undefined) {
    return DEFAULT_SIZE;
  }
  const size = TMDB_IMAGE_WIDTHS.find((w) => w >= width);
  return size ? `w${size}` : 'original';
}

/** Builds `{imageUrl}/{size}{path}` from a relative TMDb path such as `/abc.jpg`. */
export function tmdbImageLoader(imageUrl: string): ImageLoader {
  return ({ src, width }: ImageLoaderConfig) => `${imageUrl}/${tmdbImageSize(width)}${src}`;
}

/**
 * Wires `NgOptimizedImage` to the TMDb CDN. Breakpoints match the CDN sizes, so every
 * `srcset` candidate maps to its own file instead of several widths sharing one URL.
 */
export function provideTmdbImageLoader(imageUrl: string): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: IMAGE_LOADER, useValue: tmdbImageLoader(imageUrl) },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: [...TMDB_IMAGE_WIDTHS] } },
  ]);
}
