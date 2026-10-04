import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { tmdbAuthInterceptor } from './tmdb-auth-interceptor';
import { TMDB_CONFIG, TmdbConfig } from './tmdb-config';

const config: TmdbConfig = {
  apiUrl: 'https://api.themoviedb.org/3',
  imageUrl: 'https://image.tmdb.org/t/p',
  accessToken: 'test-token',
  language: 'en-US',
};

describe('tmdbAuthInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TMDB_CONFIG, useValue: config },
        provideHttpClient(withInterceptors([tmdbAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('adds the Bearer token and language to TMDb API requests', () => {
    http.get(`${config.apiUrl}/movie/popular`, { params: { page: 2 } }).subscribe();

    const req = httpTesting.expectOne((r) => r.url === `${config.apiUrl}/movie/popular`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.params.get('language')).toBe('en-US');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({});
  });

  it('leaves requests to other hosts untouched', () => {
    http.get('https://example.com/data').subscribe();

    const req = httpTesting.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.params.has('language')).toBe(false);
    req.flush({});
  });

  it('does not treat a lookalike host prefix as the TMDb API', () => {
    http.get(`${config.apiUrl}.evil.com/steal`).subscribe();

    const req = httpTesting.expectOne(`${config.apiUrl}.evil.com/steal`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
