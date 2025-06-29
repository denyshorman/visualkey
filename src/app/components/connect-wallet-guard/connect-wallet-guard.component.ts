import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-connect-wallet-guard',
  imports: [Button],
  host: {
    class: 'contents',
  },
  template: `
    @if (wallet.accountStatus() === 'connected') {
      <ng-content />
    } @else if (!wallet.walletInitialized()) {
      <div class="grow flex items-center justify-center">
        <div class="text-2xl select-none">Initializing</div>
      </div>
    } @else if (wallet.accountStatus() === 'connecting') {
      <div class="grow flex items-center justify-center">
        <div class="text-2xl select-none">Connecting...</div>
      </div>
    } @else if (wallet.accountStatus() === 'reconnecting') {
      <div class="grow flex items-center justify-center">
        <div class="text-2xl select-none">Reconnecting...</div>
      </div>
    } @else {
      <div class="grow flex flex-col items-center justify-center gap-4">
        <div class="w-3/4 sm:w-md">
          <p-button
            [rounded]="true"
            variant="outlined"
            severity="primary"
            size="large"
            styleClass="select-none w-full"
            (click)="wallet.open()"
          >
            Connect Wallet
          </p-button>
        </div>
      </div>
    }
  `,
})
export class ConnectWalletGuardComponent {
  constructor(public wallet: WalletService) {}
}
