import { Component, inject } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { Button } from 'primeng/button';
import { ThemeService } from '../../../services/theme.service';
import { base, hardhat, sepolia } from 'viem/chains';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-menu-network-switch-button',
  imports: [Button, Tooltip],
  host: {
    class: 'contents',
  },
  template: `
    <p-button
      variant="outlined"
      severity="secondary"
      class="size-8"
      styleClass="size-full select-none leading-0"
      [pTooltip]="'Network: ' + wallet.chainName()"
      tooltipPosition="bottom"
      [showDelay]="700"
      (click)="wallet.viewNetworks()"
    >
      <ng-template #icon>
        @switch (wallet.chainId()) {
          @case (chainId.base) {
            <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
                [attr.fill]="theme.theme() === 'dark' ? 'currentColor' : '#8796fb'"
              />
            </svg>
          }
          @case (chainId.sepolia) {
            <svg width="15" height="15" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"
                [attr.fill]="theme.theme() === 'dark' ? 'currentColor' : '#919191'"
              />
            </svg>
          }
          @case (chainId.hardhat) {
            <svg width="14" height="14" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M256 32c-17.7 0-32 14.3-32 32l0 2.3 0 99.6c0 5.6-4.5 10.1-10.1 10.1c-3.6 0-7-1.9-8.8-5.1L157.1 87C83 123.5 32 199.8 32 288l0 64 512 0 0-66.4c-.9-87.2-51.7-162.4-125.1-198.6l-48 83.9c-1.8 3.2-5.2 5.1-8.8 5.1c-5.6 0-10.1-4.5-10.1-10.1l0-99.6 0-2.3c0-17.7-14.3-32-32-32l-64 0zM16.6 384C7.4 384 0 391.4 0 400.6c0 4.7 2 9.2 5.8 11.9C27.5 428.4 111.8 480 288 480s260.5-51.6 282.2-67.5c3.8-2.8 5.8-7.2 5.8-11.9c0-9.2-7.4-16.6-16.6-16.6L16.6 384z"
                fill="currentColor"
              />
            </svg>
          }
          @default {
            <svg width="14" height="14" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M352 256c0 22.2-1.2 43.6-3.3 64l-185.3 0c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64l185.3 0c2.2 20.4 3.3 41.8 3.3 64zm28.8-64l123.1 0c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64l-123.1 0c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32l-116.7 0c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0l-176.6 0c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0L18.6 160C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192l123.1 0c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64L8.1 320C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6l176.6 0c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352l116.7 0zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6l116.7 0z"
                fill="currentColor"
              />
            </svg>
          }
        }
      </ng-template>
    </p-button>
  `,
})
export class NetworkSwitchButtonComponent {
  readonly wallet = inject(WalletService);
  readonly theme = inject(ThemeService);

  readonly chainId = {
    base: base.id,
    sepolia: sepolia.id,
    hardhat: hardhat.id,
  };
}
