import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DurationPipe } from '../../../../pipes/duration.pipe';
import { countSetBits } from '../../../../utils/big-int-utils';
import { ETH_ADDR_BIT_COUNT } from '../../../../utils/eth-utils';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-vanity-address-generator-info',
  standalone: true,
  imports: [DecimalPipe, DurationPipe, Card],
  host: {
    class: 'contents',
  },
  template: `
    <p-card class="border border-neutral-100 dark:border-neutral-700">
      <div class="flex flex-col gap-2 text-sm">
        <div class="flex flex-row justify-between">
          <div>Difficulty</div>
          <div>{{ difficulty() }} {{ difficulty() === 1 ? 'bit' : 'bits' }}</div>
        </div>
        <div class="flex flex-row justify-between">
          <div>Estimated Time</div>
          <div>{{ estimatedCompletionSec() | duration }}</div>
        </div>
        <div class="flex flex-row justify-between">
          <div>Elapsed Time</div>
          <div>{{ elapsedTimeSec() | duration }}</div>
        </div>
        <div class="flex flex-row justify-between">
          <div>Checked Addresses</div>
          <div>{{ checkedCount() | number }}</div>
        </div>
        <div class="flex flex-row justify-between">
          <div>Hash Rate</div>
          <div>{{ hashRate() | number: '1.0-0' }} h/s</div>
        </div>
      </div>
    </p-card>
  `,
})
export class InfoComponent {
  readonly careMask = input(0n);
  readonly checkedCount = input(0);
  readonly elapsedTimeSec = input(0n);
  readonly hashRate = input(0);

  readonly difficulty = computed(() => {
    return countSetBits(this.careMask(), ETH_ADDR_BIT_COUNT);
  });

  readonly estimatedCompletionSec = computed(() => {
    const difficulty = this.difficulty();
    const rate = this.hashRate();

    if (difficulty === 0 || rate === 0) {
      return 0n;
    }

    const combinations = 1n << BigInt(difficulty);
    return combinations / BigInt(Math.round(rate));
  });
}
