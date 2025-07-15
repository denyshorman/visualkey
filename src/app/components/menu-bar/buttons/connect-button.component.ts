import { Component, computed, inject } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-menu-connect-button',
  imports: [Button],
  host: {
    class: 'contents',
  },
  template: `
    @if (wallet.accountStatus() === 'connected') {
      <p-button
        class="h-8"
        variant="outlined"
        severity="secondary"
        size="small"
        styleClass="select-none h-full"
        (click)="wallet.viewAccount()"
      >
        {{ accountFormatted() }}
      </p-button>
    } @else {
      <p-button
        class="h-8"
        variant="outlined"
        severity="secondary"
        size="small"
        styleClass="select-none h-full"
        (click)="wallet.open()"
        [disabled]="!wallet.walletInitialized() || wallet.walletOpen() || wallet.accountStatus() === 'connecting' || wallet.accountStatus() === 'reconnecting'"
      >
        @if (!wallet.walletInitialized()) {
          Loading
        } @else if (wallet.accountStatus() === 'connecting') {
          Connecting
        } @else if (wallet.accountStatus() === 'reconnecting') {
          Reconnecting
        } @else {
          Connect
        }
      </p-button>
    }
  `,
})
export class ConnectButtonComponent {
  readonly wallet = inject(WalletService);

  readonly accountFormatted = computed(() => {
    const account = this.wallet.accountAddress();

    if (account === undefined) {
      return undefined;
    }

    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  });
}
