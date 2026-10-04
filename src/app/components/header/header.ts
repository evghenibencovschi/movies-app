import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MovieStore } from '../../services/movie-store';
import { SearchBar } from '../search-bar/search-bar';

/** App header: logo (back to popular movies) and the search bar wired to `MovieStore`. */
@Component({
  imports: [RouterLink, SearchBar],
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  protected readonly store = inject(MovieStore);
  private readonly router = inject(Router);

  protected onSearch(query: string): void {
    if (!query) {
      this.store.getPopularMovies();
      return;
    }
    this.store.searchMovies(query);
    // Results are shown on the home page; searching from elsewhere goes there.
    if (this.router.url !== '/') {
      void this.router.navigateByUrl('/');
    }
  }
}
