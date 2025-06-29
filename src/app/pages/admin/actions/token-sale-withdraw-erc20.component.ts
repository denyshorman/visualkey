import { Component, computed, effect, linkedSignal, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputText } from 'primeng/inputtext';
import { parseEther } from 'viem';

import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenSaleContractService } from '../../../services/token-sale-contract.service';
import { VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-sale-withdraw-erc20',
  standalone: true,
  imports: [FormsModule, Button, Message, InputText, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">TokenSale: Withdraw ERC20</h2>

    <div class="flex flex-col gap-1">
      <label for="tokenAddress" class="font-bold">Token Address:</label>
      <input
        #tokenAddressInput="ngModel"
        id="tokenAddress"
        name="tokenAddress"
        type="text"
        pInputText
        pSize="small"
        class="grow min-w-px font-mono"
        maxlength="42"
        aria-label="Token Address"
        placeholder="0x..."
        [(ngModel)]="tokenAddress"
        [class.ng-invalid]="tokenAddressInput.dirty && !isValidAddress()"
      />
      @if (tokenAddressInput.dirty && !isValidAddress()) {
        <p-message severity="error" variant="simple" size="small">Invalid address</p-message>
      }
    </div>

    <div class="flex flex-col gap-1">
      <label for="amount" class="font-bold">Amount (0 for all):</label>
      <input
        #amountInput="ngModel"
        id="amount"
        name="amount"
        type="text"
        pInputText
        pSize="small"
        class="grow min-w-px font-mono"
        aria-label="Token Amount"
        placeholder="0"
        [(ngModel)]="amount"
        [class.ng-invalid]="amountInput.dirty && !isValidAmount()"
      />
      @if (amountInput.dirty && !isValidAmount()) {
        <p-message severity="error" variant="simple" size="small">Invalid amount</p-message>
      }
    </div>

    <p-button
      styleClass="w-full"
      label="Withdraw Tokens"
      severity="secondary"
      (click)="withdraw()"
      [loading]="withdrawing()"
      [disabled]="!isValidAddress() || !isValidAmount()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenSaleWithdrawErc20Component {
  readonly tokenAddress = linkedSignal(() => {
    return this.vkeyTokenContract.contractAddress();
  });

  readonly amount = signal('0');

  readonly withdrawing = signal(false);
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly isValidAddress = computed(() => {
    const tokenAddr = this.tokenAddress();

    if (tokenAddr === undefined) {
      return false;
    }

    return /^0x[a-fA-F0-9]{40}$/.test(tokenAddr);
  });

  readonly amountWei = computed(() => {
    try {
      return parseEther(this.amount());
    } catch {
      return undefined;
    }
  });

  readonly isValidAmount = computed(() => {
    return this.amountWei !== undefined;
  });

  constructor(
    public wallet: WalletService,
    private vkeyTokenContract: VisualKeyTokenContractService,
    private tokenSaleContract: VisualKeyTokenSaleContractService,
  ) {
    effect(() => {
      const defaultAddress = this.vkeyTokenContract.contractAddress();
      if (defaultAddress && this.tokenAddress() === '0x') {
        this.tokenAddress.set(defaultAddress);
      }
    });
  }

  async withdraw() {
    if (!this.isValidAddress() || !this.isValidAmount()) {
      return;
    }

    this.withdrawing.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = (await this.tokenSaleContract.withdrawERC20(this.tokenAddress()!, this.amountWei()!))!;

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Withdrawal successful! The tokens have been sent to your wallet.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.withdrawing.set(false);
    }
  }
}
