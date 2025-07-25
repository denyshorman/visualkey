import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { ThemeService } from '../../../services/theme.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMoon } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-menu-theme-button',
  imports: [Button, FaIconComponent, Tooltip],
  host: {
    class: 'contents',
  },
  template: `
    <p-button
      variant="outlined"
      severity="secondary"
      class="size-8"
      styleClass="size-full select-none leading-0"
      pTooltip="Theme"
      tooltipPosition="bottom"
      [showDelay]="700"
      (click)="theme.toggle()"
    >
      <ng-template #icon>
        @if (theme.theme() === 'dark') {
          <fa-icon [icon]="faMoonIcon" />
        } @else {
          <svg width="17" height="17" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M 15 3 L 15 8 L 17 8 L 17 3 Z M 7.5 6.09375 L 6.09375 7.5 L 9.625 11.0625 L 11.0625 9.625 Z M 24.5 6.09375 L 20.9375 9.625 L 22.375 11.0625 L 25.90625 7.5 Z M 16 9 C 12.144531 9 9 12.144531 9 16 C 9 19.855469 12.144531 23 16 23 C 19.855469 23 23 19.855469 23 16 C 23 12.144531 19.855469 9 16 9 Z M 16 11 C 18.773438 11 21 13.226563 21 16 C 21 18.773438 18.773438 21 16 21 C 13.226563 21 11 18.773438 11 16 C 11 13.226563 13.226563 11 16 11 Z M 3 15 L 3 17 L 8 17 L 8 15 Z M 24 15 L 24 17 L 29 17 L 29 15 Z M 9.625 20.9375 L 6.09375 24.5 L 7.5 25.90625 L 11.0625 22.375 Z M 22.375 20.9375 L 20.9375 22.375 L 24.5 25.90625 L 25.90625 24.5 Z M 15 24 L 15 29 L 17 29 L 17 24 Z"/>
          </svg>
        }
      </ng-template>
    </p-button>
  `,
})
export class ThemeButtonComponent {
  readonly theme = inject(ThemeService);
  readonly faMoonIcon = faMoon;
}
