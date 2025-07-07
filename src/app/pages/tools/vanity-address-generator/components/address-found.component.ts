import { Component, input } from '@angular/core';
import { Card } from 'primeng/card';
import { PrimeTemplate } from 'primeng/api';

@Component({
  selector: 'app-vanity-address-generator-address-found',
  standalone: true,
  imports: [Card, PrimeTemplate],
  host: {
    class: 'contents',
  },
  template: `
    <p-card>
      <ng-template pTemplate="title">Address Found!</ng-template>
      <ng-template pTemplate="content">
        <div class="flex flex-col gap-2 text-sm">
          <div>
            <strong>Address:</strong>
            <p class="break-all">{{ address() }}</p>
          </div>
          <div>
            <strong>Private Key:</strong>
            <p class="break-all">{{ privateKey() }}</p>
          </div>
        </div>
      </ng-template>
    </p-card>
  `,
})
export class AddressFoundComponent {
  readonly privateKey = input.required();
  readonly address = input.required();
}
