import { Component, computed, input, model } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vanity-address-generator-prefix-suffix',
  standalone: true,
  imports: [FormsModule, InputTextModule],
  host: {
    class: 'flex flex-col sm:flex-row gap-2',
  },
  template: `
    <input
      #prefixInputTag="ngModel"
      id="prefixInput"
      name="prefixInput"
      type="text"
      pInputText
      pSize="small"
      class="grow min-w-px"
      placeholder="Prefix (e.g., 0xcafe)"
      maxlength="42"
      aria-label="Prefix Input"
      [(ngModel)]="prefix"
      [invalid]="!prefixValid()"
      [disabled]="disabled()"
    />
    <input
      #suffixInputTag="ngModel"
      id="suffixInput"
      name="suffixInput"
      type="text"
      pInputText
      pSize="small"
      class="grow min-w-px"
      placeholder="Suffix (e.g., babe)"
      maxlength="40"
      aria-label="Suffix Input"
      [(ngModel)]="suffix"
      [invalid]="!suffixValid()"
      [disabled]="disabled()"
    />
  `,
})
export class PrefixSuffixComponent {
  readonly disabled = input(false);

  readonly prefix = model('');
  readonly suffix = model('');

  readonly prefixValid = computed(() => {
    const prefix = this.prefix().trim();
    return prefix === '' || /^(0x)?[a-fA-F0-9]+$/.test(prefix);
  });

  readonly suffixValid = computed(() => {
    const suffix = this.suffix().trim();
    return suffix === '' || /^[a-fA-F0-9]+$/.test(suffix);
  });
}
