import { Component, input, output } from '@angular/core';

export type StateMessageKind = 'error' | 'empty';

/** Error (with Retry) or empty-result message for lists and pages. */
@Component({
  selector: 'app-state-message',
  templateUrl: './state-message.html',
})
export class StateMessage {
  readonly kind = input.required<StateMessageKind>();
  readonly message = input<string>();
  readonly retry = output<void>();
}
