// Copy this file to `environment.local.ts` and paste your TMDb Read Access Token (v4).
// `environment.local.ts` is git-ignored and replaces `environment.ts` at build time,
// so it must not import `./environment` (that import would resolve to itself).
import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  tmdb: {
    apiUrl: 'https://api.themoviedb.org/3',
    imageUrl: 'https://image.tmdb.org/t/p',
    accessToken: '<YOUR_TMDB_READ_ACCESS_TOKEN>',
    language: 'en-US',
  },
};
