import { Component, computed, linkedSignal, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputText } from 'primeng/inputtext';

import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-mint',
  standalone: true,
  imports: [FormsModule, Button, Message, InputText, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">Token: Mint Tokens</h2>

    <div class="flex flex-col gap-1">
      <label for="recipientAddress" class="font-bold">Recipient Address:</label>
      <input
        #recipientAddressInput="ngModel"
        id="recipientAddress"
        name="recipientAddress"
        type="text"
        pInputText
        pSize="small"
        class="grow min-w-px font-mono"
        maxlength="42"
        aria-label="Recipient Address"
        placeholder="0x..."
        [(ngModel)]="recipientAddress"
        [class.ng-invalid]="recipientAddressInput.dirty && !isValidAddress()"
      />
      @if (recipientAddressInput.dirty && !isValidAddress()) {
        <p-message severity="error" variant="simple" size="small">Invalid address</p-message>
      }
    </div>

    <p-button
      styleClass="w-full"
      label="Mint"
      severity="secondary"
      (click)="mint()"
      [loading]="minting()"
      [disabled]="!isValidAddress()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenMintComponent {
  readonly recipientAddress = linkedSignal(() => {
    return this.wallet.accountAddress();
  });

  readonly minting = signal(false);
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly isValidAddress = computed(() => {
    const recipient = this.recipientAddress();

    if (recipient === undefined) {
      return false;
    }

    return /^0x[a-fA-F0-9]{40}$/.test(recipient);
  });

  constructor(
    public wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
  ) {}

  async mint() {
    const chainId = this.wallet.chainId();
    const owner = this.wallet.accountAddress();
    const recipient = this.recipientAddress();

    if (!this.isValidAddress() || owner === undefined || recipient === undefined) {
      return;
    }

    this.minting.set(true);
    this.txStatus()?.reset();

    try {
      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenContract.mint(chainId, owner, recipient);

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Minting successful! Tokens have been sent.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.minting.set(false);
    }
  }
}
