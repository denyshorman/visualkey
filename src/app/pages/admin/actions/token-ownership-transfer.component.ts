import { Component, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputText } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';
import { Hex } from 'viem';

import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-transfer-ownership',
  standalone: true,
  imports: [FormsModule, Button, Message, InputText, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">Token: Transfer Ownership</h2>

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
      label="Initiate"
      severity="secondary"
      (click)="confirmInitiate()"
      [loading]="initiating()"
      [disabled]="!isValidAddress()"
    />

    <p-button
      styleClass="w-full"
      label="Cancel"
      severity="secondary"
      (click)="confirmCancel()"
      [loading]="cancelling()"
    />

    <p-button
      styleClass="w-full"
      label="Complete"
      severity="secondary"
      (click)="confirmComplete()"
      [loading]="completing()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenTransferOwnershipComponent {
  readonly newOwnerAddress = signal<Hex>('0x');

  readonly initiating = signal(false);
  readonly cancelling = signal(false);
  readonly completing = signal(false);
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly isValidAddress = computed(() => {
    const address = this.newOwnerAddress();
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  });

  constructor(
    public wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
    private confirmationService: ConfirmationService,
  ) {}

  confirmInitiate() {
    if (!this.isValidAddress()) return;
    this.confirmationService.confirm({
      header: 'Initiate Transfer',
      message: `Are you sure you want to initiate ownership transfer to ${this.newOwnerAddress()}?`,
      accept: () => this.initiate(),
    });
  }

  confirmCancel() {
    this.confirmationService.confirm({
      header: 'Cancel Transfer',
      message: 'Are you sure you want to cancel the pending ownership transfer?',
      accept: () => this.cancel(),
    });
  }

  confirmComplete() {
    this.confirmationService.confirm({
      header: 'Complete Transfer',
      message: 'Are you sure you want to complete the ownership transfer? You must be the pending new owner.',
      accept: () => this.complete(),
    });
  }

  async initiate() {
    this.initiating.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenContract.initiateOwnershipTransfer(this.newOwnerAddress());

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.newOwnerAddress.set('0x');
        this.txStatus()?.success('Ownership transfer initiated.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.initiating.set(false);
    }
  }

  async cancel() {
    this.cancelling.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenContract.cancelOwnershipTransfer();

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Ownership transfer cancelled.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.cancelling.set(false);
    }
  }

  async complete() {
    this.completing.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenContract.completeOwnershipTransfer();

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Ownership transfer completed successfully.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.completing.set(false);
    }
  }
}
