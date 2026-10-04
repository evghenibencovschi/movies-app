import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  tmdb: {
    apiUrl: 'https://api.themoviedb.org/3',
    imageUrl: 'https://image.tmdb.org/t/p',
    accessToken: '',
    language: 'en-US',
  },
};
