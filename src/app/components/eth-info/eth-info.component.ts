import { Component, computed, input } from '@angular/core';
import { EthAccount } from '../../models/eth-account';

@Component({
  selector: 'app-eth-info',
  template: `
    <div class="text-zinc-700 dark:text-[#2bff25] text-xs lg:text-sm overflow-auto whitespace-nowrap scrollbar-none">
      <div>Address: {{ formattedAccount().address }}</div>
      <div>Private Key: {{ formattedAccount().privateKey }}</div>
    </div>
  `,
})
export class EthInfoComponent {
  private static readonly NOT_AVAILABLE = '[Not available]';

  readonly ethAccount = input<EthAccount>();

  readonly formattedAccount = computed<FormattedAccount>(() => {
    const info = this.ethAccount();

    if (info?.isValid) {
      return { privateKey: info.privateKeyHex, address: info.address };
    } else {
      return { privateKey: EthInfoComponent.NOT_AVAILABLE, address: EthInfoComponent.NOT_AVAILABLE };
    }
  });
}

interface FormattedAccount {
  privateKey: string;
  address: string;
}
