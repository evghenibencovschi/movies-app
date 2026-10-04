export interface TmdbEnvironment {
  apiUrl: string;
  imageUrl: string;
  accessToken: string;
  language: string;
}

export interface Environment {
  production: boolean;
  tmdb: TmdbEnvironment;
}
