import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-token-page',
  imports: [RouterOutlet],
  host: {
    class: 'contents',
  },
  template: `<router-outlet />`,
})
export class TokenComponent {}
