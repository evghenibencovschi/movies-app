import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MovieStore } from '../../services/movie-store';
import { MoviesApi } from '../../services/movies-api';
import { FakeMoviesApi } from '../../testing/fake-movies-api';
import { Header } from './header';

@Component({ template: '' })
class Blank {}

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let el: HTMLElement;
  let store: MovieStore;
  let router: Router;

  const field = () => el.querySelector<HTMLInputElement>('input[type="search"]')!;
  /** Lets a navigation started by the header finish (`whenStable()` would wait for the movie request). */
  const navigation = () => new Promise((resolve) => setTimeout(resolve));

  function submit(text: string): void {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'movie/:id', component: Blank },
        ]),
        { provide: MoviesApi, useClass: FakeMoviesApi },
      ],
    }).compileComponents();

    store = TestBed.inject(MovieStore);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Header);
    el = fixture.nativeElement;
    TestBed.tick();
  });

  it('links the logo to the home page', () => {
    const logo = el.querySelector('a');
    expect(logo?.getAttribute('href')).toBe('/');
  });

  it('searches movies in the store', () => {
    submit('matrix');

    expect(store.query()).toBe('matrix');
  });

  it('switches back to popular movies on an empty search', () => {
    store.searchMovies('matrix');

    submit('');

    expect(store.isSearch()).toBe(false);
  });

  it('opens the home page when searching from another page', async () => {
    await router.navigateByUrl('/movie/550');

    submit('matrix');
    await navigation();

    expect(router.url).toBe('/');
  });

  it('stays on the current page when the search is cleared', async () => {
    await router.navigateByUrl('/movie/550');

    submit('');
    await navigation();

    expect(router.url).toBe('/movie/550');
  });

  it('resets to popular movies on logo click', () => {
    store.searchMovies('matrix');

    el.querySelector('a')!.click();

    expect(store.isSearch()).toBe(false);
  });

  it('shows the current store query in the field', () => {
    store.searchMovies('alien');
    TestBed.tick();

    expect(field().value).toBe('alien');
  });
});
