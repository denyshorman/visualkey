import { Component, computed, signal, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Divider } from 'primeng/divider';
import { ConfirmationService } from 'primeng/api';
import { formatEther, parseEther } from 'viem';
import { WeiToEthPipe } from '../../../pipes/wei-to-eth.pipe';
import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { ConnectWalletGuardComponent } from '../../../components/connect-wallet-guard/connect-wallet-guard.component';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-burn-token',
  standalone: true,
  imports: [
    FormsModule,
    Button,
    InputText,
    Divider,
    WeiToEthPipe,
    WeiToEthPipe,
    ConnectWalletGuardComponent,
    EtherTxStatusComponent,
  ],
  host: {
    class: 'flex flex-col grow sm:items-center sm:justify-center',
  },
  template: `
    <app-connect-wallet-guard>
      <div class="max-w-4xl sm:border rounded-lg shadow-lg border-neutral-300 dark:border-neutral-800 p-10">
        <header class="text-center mb-6">
          <h1 class="text-3xl md:text-4xl font-bold">Burn VKEY Tokens</h1>
          <p class="text-gray-500 mt-2">
            Voluntarily remove VKEY tokens from circulation. This action is irreversible.
          </p>
        </header>

        <p-divider></p-divider>

        <div class="text-center mt-5">
          <div class="text-sm text-gray-500">Your VKEY Balance</div>
          <div class="text-2xl font-semibold">{{ (wallet.vkeyAmount.value() | weiToEth) ?? '???' }}</div>
        </div>

        <div class="flex flex-col gap-2 mt-2 ">
          <label for="vkeyAmount" class="font-bold">Amount of VKEY to Burn:</label>

          <div class="flex gap-2">
            <input
              #vkeyAmountInput="ngModel"
              id="vkeyAmount"
              name="vkeyAmount"
              type="text"
              pInputText
              pSize="small"
              inputmode="decimal"
              placeholder="0.0"
              [(ngModel)]="burnAmount"
              class="w-full"
              [class.ng-invalid]="vkeyAmountInput.dirty && !isValidAmount()"
            />
            <p-button size="small" severity="secondary" [outlined]="true" (click)="setMaxAmount()">Max</p-button>
          </div>
        </div>

        <p-button
          label="Burn"
          styleClass="mt-5 w-full"
          severity="secondary"
          [outlined]="true"
          (click)="confirmBurn()"
          [loading]="burning()"
          [disabled]="!isValidAmount()"
        />

        <app-ether-tx-status #txStatus class="mt-4" />
      </div>
    </app-connect-wallet-guard>
  `,
})
export class BurnTokenComponent {
  readonly burnAmount = signal('');
  readonly vkeyAmountInput = viewChild<NgModel>('vkeyAmountInput');
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly burning = signal(false);

  readonly burnAmountWei = computed(() => {
    try {
      return parseEther(this.burnAmount());
    } catch {
      return undefined;
    }
  });

  readonly isValidAmount = computed(() => {
    const amount = this.burnAmountWei();
    const balance = this.wallet.vkeyAmount.value();
    return amount !== undefined && balance !== undefined && amount > 0n && amount <= balance;
  });

  constructor(
    public wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
    private confirmationService: ConfirmationService,
  ) {}

  setMaxAmount() {
    const balance = this.wallet.vkeyAmount.value();
    if (balance !== undefined) {
      this.burnAmount.set(formatEther(balance));
    }
  }

  confirmBurn() {
    if (!this.isValidAmount()) return;

    this.confirmationService.confirm({
      header: 'Confirm Burn',
      message: `Are you sure you want to permanently burn ${this.burnAmount()} VKEY? This action cannot be undone.`,
      accept: () => this.burn(),
    });
  }

  async burn() {
    const chainId = this.wallet.chainId();

    if (chainId === undefined) {
      return;
    }

    this.burning.set(true);
    this.txStatus()?.reset();

    try {
      const burnAmount = this.burnAmount();
      const burnAmountWei = this.burnAmountWei();

      if (burnAmountWei === undefined) {
        const msg = `Invalid burn amount: ${burnAmount}`;
        this.txStatus()?.error(msg);
        return;
      }

      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenContract.burn(burnAmountWei);

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success(`Successfully burned ${burnAmount} VKEY!`);

        this.wallet.vkeyAmount.value.update(prev => {
          return prev ? prev - burnAmountWei : undefined;
        });

        this.vkeyAmountInput()?.reset();
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.burning.set(false);
    }
  }
}
