import { Component, computed, effect, input, output, signal } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { parseEther } from 'viem';
import { NgClass } from '@angular/common';
import { MAX_UINT256 } from '../../utils/eth-utils';

@Component({
  selector: 'app-vkey-input',
  imports: [InputText, FormsModule, NgClass],
  template: `
    <div class="flex flex-col gap-1">
      <input
        name="vkeyAmount"
        type="text"
        pInputText
        inputmode="decimal"
        [placeholder]="placeholder()"
        [(ngModel)]="amountString"
        pSize="small"
        #amountInput="ngModel"
        [disabled]="disabled()"
        [ngClass]="styleClass()"
        [class.ng-invalid]="!valid()"
      />

      @if (amountInput.dirty && !valid()) {
        <div class="text-xs text-rose-500">
          @if (amount() === undefined) {
            Please enter a valid number
          } @else if (amount()! < 0) {
            Amount cannot be negative
          } @else if (amount()! >= maxAmount) {
            Amount is too large
          } @else {
            Amount cannot be zero
          }
        </div>
      }
    </div>
  `,
})
export class VkeyInputComponent {
  readonly maxAmount = MAX_UINT256;
  readonly amountString = signal('');
  readonly amountChanged = output<bigint | undefined>();
  readonly disabled = input(false);
  readonly styleClass = input('');
  readonly placeholder = input('');

  readonly amount = computed(() => {
    try {
      const amount = this.amountString();
      return parseEther(amount);
    } catch {
      return undefined;
    }
  });

  readonly valid = computed(() => {
    const amount = this.amount();

    if (amount == undefined) {
      return false;
    }

    return amount > 0 && amount <= this.maxAmount;
  });

  constructor() {
    effect(() => {
      const valid = this.valid();
      const amount = this.amount();

      if (valid) {
        this.amountChanged.emit(amount!);
      } else {
        this.amountChanged.emit(undefined);
      }
    });
  }
}
