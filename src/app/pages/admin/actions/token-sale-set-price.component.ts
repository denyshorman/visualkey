import { Component, computed, signal, viewChild } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenSaleContractService } from '../../../services/token-sale-contract.service';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { parseEther } from 'viem';
import { Message } from 'primeng/message';
import { MAX_UINT256 } from '../../../utils/eth-utils';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-sale-set-price',
  imports: [FormsModule, InputText, Button, Message, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">TokenSale: Set Price</h2>
    <div class="flex items-baseline">
      <div class="font-bold">New Price:</div>
      <div class="flex flex-col gap-1 ml-4">
        <input
          #newPriceInput="ngModel"
          id="newPrice"
          name="newPrice"
          type="text"
          pInputText
          pSize="small"
          class="grow min-w-px"
          maxlength="258"
          aria-label="New price"
          placeholder="0.01 ETH"
          [(ngModel)]="newPrice"
          (keyup.enter)="setPrice()"
          [class.ng-invalid]="!valid()"
        />

        @if (newPriceInput.dirty && !valid()) {
          <p-message severity="error" variant="simple" size="small">Price is not valid</p-message>
        }
      </div>
    </div>

    <p-button
      styleClass="w-full"
      label="Set"
      severity="secondary"
      (click)="setPrice()"
      [disabled]="!valid()"
      [loading]="changingPrice()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenSaleSetPriceComponent {
  readonly newPrice = signal('');

  readonly newPriceWei = computed(() => {
    try {
      const amount = this.newPrice();
      return parseEther(amount);
    } catch {
      return undefined;
    }
  });

  readonly valid = computed(() => {
    const amount = this.newPriceWei();

    if (amount == undefined) {
      return false;
    }

    return amount > 0 && amount <= MAX_UINT256;
  });

  readonly changingPrice = signal(false);

  readonly txStatus = viewChild(EtherTxStatusComponent);

  constructor(
    public wallet: WalletService,
    private tokenSaleContract: VisualKeyTokenSaleContractService,
  ) {}

  async setPrice() {
    const newPriceWei = this.newPriceWei();

    if (newPriceWei === undefined) {
      return;
    }

    this.changingPrice.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = (await this.tokenSaleContract.setPrice(newPriceWei))!;

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Price has been set successfully.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.changingPrice.set(false);
    }
  }
}
