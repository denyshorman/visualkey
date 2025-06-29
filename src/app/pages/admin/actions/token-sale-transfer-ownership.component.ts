import { Component, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputText } from 'primeng/inputtext';
import { Hex } from 'viem';

import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenSaleContractService } from '../../../services/token-sale-contract.service';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-sale-transfer-ownership',
  standalone: true,
  imports: [FormsModule, Button, Message, InputText, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">TokenSale: Transfer Ownership</h2>

    <div class="flex flex-col gap-1">
      <label for="newOwnerAddress" class="font-bold">New Owner Address:</label>
      <input
        #newOwnerAddressInput="ngModel"
        id="newOwnerAddress"
        name="newOwnerAddress"
        type="text"
        pInputText
        pSize="small"
        class="grow min-w-px font-mono"
        maxlength="42"
        aria-label="New Owner Address"
        placeholder="0x..."
        [(ngModel)]="newOwnerAddress"
        [class.ng-invalid]="newOwnerAddressInput.dirty && !isValidAddress()"
      />
      @if (newOwnerAddressInput.dirty && !isValidAddress()) {
        <p-message severity="error" variant="simple" size="small">Invalid address</p-message>
      }
    </div>

    <p-button
      styleClass="w-full"
      label="Transfer Ownership"
      severity="secondary"
      (click)="transfer()"
      [loading]="transferring()"
      [disabled]="!isValidAddress()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenSaleTransferOwnershipComponent {
  readonly newOwnerAddress = signal<Hex>('0x');
  readonly transferring = signal(false);
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly isValidAddress = computed(() => {
    const address = this.newOwnerAddress();
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  });

  constructor(
    public wallet: WalletService,
    private tokenSaleContract: VisualKeyTokenSaleContractService,
  ) {}

  async transfer() {
    if (!this.isValidAddress()) {
      return;
    }

    this.transferring.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = (await this.tokenSaleContract.transferOwnership(this.newOwnerAddress()))!;

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Ownership transferred successfully.');
      } else {
        this.txStatus()?.error('Transaction failed');
        return;
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.transferring.set(false);
    }
  }
}
