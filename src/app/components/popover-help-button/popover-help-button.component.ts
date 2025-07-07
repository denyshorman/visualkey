import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Popover } from 'primeng/popover';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-popover-help-button',
  imports: [FaIconComponent, Popover],
  host: {
    class: 'contents',
  },
  template: `
    <fa-icon class="text-sm cursor-pointer" [icon]="faQuestionCircle" (click)="popover.toggle($event)"></fa-icon>

    <p-popover #popover>
      <div class="text-sm max-w-xs">
        <ng-content />
      </div>
    </p-popover>
  `,
})
export class PopoverHelpButtonComponent {
  readonly faQuestionCircle = faQuestionCircle;
}
