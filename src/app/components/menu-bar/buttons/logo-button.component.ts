import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-logo-button',
  imports: [RouterLink],
  host: {
    class: 'contents',
  },
  template: `
    <a routerLink="/" class="h-6 aspect-square cursor-pointer">
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="14.4" height="14.4" fill="var(--app-bit-color-1)" />
        <rect x="17.6" y="0" width="14.4" height="14.4" fill="var(--app-bit-color-0)" />
        <rect x="0" y="17.6" width="14.4" height="14.4" fill="var(--app-bit-color-0)" />
        <rect x="17.6" y="17.6" width="14.4" height="14.4" fill="var(--app-bit-color-1)" />
      </svg>
    </a>
  `,
})
export class LogoButtonComponent {}
