import { Component, input, model, signal } from '@angular/core';
import { WeiToEthPipe } from '../../../pipes/wei-to-eth.pipe';
import { WalletService } from '../../../services/wallet.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faSquarePlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { NftContractService } from '../../../services/nft-contract.service';
import { VkeyInputComponent } from '../../vkey-input/vkey-input.component';
import { AnalyticsService } from '../../../services/analytics.service';
import { EtherTxStatusComponent } from '../../ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-nft-increasable-power',
  imports: [WeiToEthPipe, FaIconComponent, Tooltip, FormsModule, Button, VkeyInputComponent],
  template: `
    <div class="flex flex-row gap-1">
      @if (increase()) {
        <app-vkey-input
          (keydown.enter)="addPower()"
          (amountChanged)="increaseAmount.set($event)"
          [disabled]="inputsDisabled()"
          placeholder="Increase amount"
          class="grow"
          styleClass="h-9"
        ></app-vkey-input>
        <p-button
          (click)="addPower()"
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 text-green-500 shrink-0 h-9 w-9"
          [loading]="inputsDisabled()"
          [disabled]="increaseAmount() === undefined || inputsDisabled()"
        >
          <ng-template #icon>
            <fa-icon [icon]="faCheck" [fixedWidth]="true"></fa-icon>
          </ng-template>
        </p-button>
        <p-button
          (click)="increase.set(false)"
          variant="outlined"
          severity="secondary"
          size="small"
          styleClass="select-none leading-0 text-red-500 shrink-0 h-9 w-9"
          [disabled]="inputsDisabled()"
        >
          <ng-template #icon>
            <fa-icon [icon]="faXmark" [fixedWidth]="true"></fa-icon>
          </ng-template>
        </p-button>
      } @else {
        <div>{{ power() | weiToEth }} VKEY</div>

        @if (wallet.accountStatus() === 'connected') {
          <button
            class="select-none ml-2 cursor-pointer font-black text-black dark:text-green-500"
            (click)="increase.set(true)"
            pTooltip="Increase Power"
            tooltipPosition="bottom"
            [showDelay]="500"
          >
            <fa-icon [icon]="faSquarePlus" [fixedWidth]="true"></fa-icon>
          </button>
        }
      }
    </div>
  `,
})
export class NftIncreasablePowerComponent {
  readonly faSquarePlus = faSquarePlus;
  readonly faCheck = faCheck;
  readonly faXmark = faXmark;

  readonly tokenId = input.required<bigint>();
  readonly power = model.required<bigint>();
  readonly increase = signal(false);
  readonly increaseAmount = signal<bigint | undefined>(undefined);
  readonly inputsDisabled = signal(false);
  readonly txStatus = input.required<EtherTxStatusComponent>();

  constructor(
    public wallet: WalletService,
    private nftContractService: NftContractService,
    private analyticsService: AnalyticsService,
  ) {}

  async addPower() {
    try {
      this.inputsDisabled.set(true);
      this.txStatus().reset();

      const chainId = this.wallet.chainId();
      const tokenId = this.tokenId();
      const initialPower = this.power();
      const increaseAmount = this.increaseAmount()!;
      const caller = this.wallet.accountAddress()!;

      this.txStatus().walletConfirmation();

      const hash = await this.nftContractService.increasePower(chainId, tokenId, increaseAmount, caller);

      this.txStatus().processing(chainId, hash);

      const tranReceipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (tranReceipt.status == 'success') {
        const newPower = initialPower + increaseAmount;

        this.power.set(newPower);
        this.increase.set(false);
        this.wallet.vkeyAmount.update(amount => (amount !== undefined ? amount - increaseAmount : undefined));

        this.txStatus().success(`Power increased successfully`);

        this.analyticsService.trackEvent('power_increase', {
          chainId,
          tokenId,
          initialPower,
          increaseAmount,
        });
      } else {
        this.txStatus().error('Transaction failed');
      }
    } catch (e) {
      this.txStatus().error(e);
    } finally {
      this.inputsDisabled.set(false);
    }
  }
}
