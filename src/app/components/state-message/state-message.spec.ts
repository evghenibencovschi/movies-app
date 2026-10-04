import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StateMessage } from './state-message';

describe('StateMessage', () => {
  let fixture: ComponentFixture<StateMessage>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StateMessage] }).compileComponents();
    fixture = TestBed.createComponent(StateMessage);
    el = fixture.nativeElement;
  });

  it('shows an error with a Retry button that emits retry', async () => {
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('message', 'Invalid TMDb access token');
    await fixture.whenStable();
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Invalid TMDb access token');
    el.querySelector('button')?.click();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic error text', async () => {
    fixture.componentRef.setInput('kind', 'error');
    await fixture.whenStable();

    expect(el.textContent).toContain('Something went wrong. Please try again');
  });

  it('shows an empty state without a Retry button', async () => {
    fixture.componentRef.setInput('kind', 'empty');
    await fixture.whenStable();

    expect(el.querySelector('[role="status"]')?.textContent).toContain('No movies found');
    expect(el.querySelector('button')).toBeNull();
  });
});
