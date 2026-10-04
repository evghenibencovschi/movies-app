# Movies

A movie catalog SPA on [The Movie Database (TMDb)](https://www.themoviedb.org/) API:
popular movies, search, and a movie details page.

- **Home** — carousel of the top 10 popular movies and a responsive grid of popular movies (2 → 6 columns) with "Load more".
- **Search** — in the header: results update while typing (1 s debounce), Enter / the Search button searches right away, clearing the field brings back popular movies.
- **Details** (`/movie/:id`) — backdrop, poster, title, tagline, genres, rating, release date, runtime, overview and a Back button.
- Loading skeletons, readable error messages with Retry, and an empty state.

## Getting started

Requirements: Node.js `^22.22.3 || ^24.15.0 || >=26` (as required by Angular 22) and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a TMDb **API Read Access Token (v4)**: sign up at [themoviedb.org](https://www.themoviedb.org/signup),
   then open [Settings → API](https://www.themoviedb.org/settings/api) and copy
   **API Read Access Token** (the long JWT, not the short "API Key").

3. Create the local environment file and paste the token into `accessToken`:

   ```bash
   cp src/environments/environment.local.example.ts src/environments/environment.local.ts
   ```

   `environment.local.ts` is git-ignored and replaces `environment.ts` in every build
   configuration (`fileReplacements` in `angular.json`), so the build and tests need it to exist.

4. Start the dev server and open http://localhost:4200/:

   ```bash
   npm start
   ```

> The token ends up in the client bundle — this is fine for a demo, but a public deployment
> should proxy TMDb requests through a backend instead.

## Scripts

| Command                                    | What it does                                     |
| ------------------------------------------ | ------------------------------------------------ |
| `npm start`                                | Dev server on http://localhost:4200/             |
| `npm run build`                            | Production build into `dist/movies-app/`         |
| `npx ng build --configuration development` | Development build (type-checks TS and templates) |
| `npm test`                                 | Unit tests (Vitest) in watch mode                |
| `npm test -- --watch=false`                | Unit tests, single run                           |

## Tech stack

- Angular 22 — standalone components, zoneless change detection, OnPush, Signals,
  `rxResource`, `input()` / `output()`, built-in control flow (`@if` / `@for` / `@switch`)
- Tailwind CSS 4 (design tokens in `@theme`, `src/styles.css`)
- `NgOptimizedImage` with a custom TMDb image loader
- Vitest + jsdom for unit tests
- TypeScript 6

## Architecture

Components never talk to `HttpClient` or TMDb directly. They depend on signal stores,
and the stores depend on the abstract `MoviesApi` port; TMDb is one implementation of it.

```
pages / components ──► MovieStore, MovieDetailsStore ──► MoviesApi (abstract port)
                                                            ▲
                                       TmdbMoviesApi ───────┘  HttpClient + DTO → domain mapper
```

- `src/app/models` — domain types (`Movie`, `MovieDetails`, `Genre`, `Paginated<T>`), camelCase.
- `src/app/services/movies-api.ts` — the port: `getPopularMovies`, `searchMovies`, `getMovieDetails`, `describeError`.
- `src/app/services/tmdb/` — everything TMDb-specific: DTOs (snake_case), mapper, `TmdbMoviesApi`,
  auth interceptor (adds `Authorization: Bearer` and `language` only to TMDb API requests),
  image loader, and `provideTmdb()` that binds the port to TMDb.
- `src/app/services/movie-store.ts` — list state: popular / search results, pagination, loading, error. Switching the query cancels the in-flight request.
- `src/app/services/movie-details-store.ts` — details resource per page, refetches when the route id changes.
- `src/app/components` — presentational components: `Header`, `SearchBar`, `HeroBanner`, `MovieList`,
  `MovieCard`, `StateMessage`.
- `src/app/pages` — routed pages (`Home`, `MovieDetails`), lazy-loaded with `loadComponent`;
  the `:id` route param is bound to a component input.
- `src/app/testing/fake-movies-api.ts` — in-memory `MoviesApi` for tests.

Swapping the data source means writing another `MoviesApi` implementation and providing it
instead of `provideTmdb()` in `src/app/app.config.ts`; stores and components stay untouched.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
