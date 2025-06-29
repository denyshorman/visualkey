import { Component, computed, effect, resource, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { formatEther, parseEther } from 'viem';
import { WeiToEthPipe } from '../../../pipes/wei-to-eth.pipe';
import { WalletService } from '../../../services/wallet.service';
import { getTokenSaleAddress, VisualKeyTokenSaleContractService } from '../../../services/token-sale-contract.service';
import { VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { ConnectWalletGuardComponent } from '../../../components/connect-wallet-guard/connect-wallet-guard.component';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-acquire-token',
  standalone: true,
  imports: [
    FormsModule,
    Button,
    InputText,
    WeiToEthPipe,
    ConnectWalletGuardComponent,
    InputGroup,
    InputGroupAddon,
    EtherTxStatusComponent,
  ],
  host: {
    class: 'flex flex-col grow sm:items-center sm:justify-center',
  },
  template: `
    <app-connect-wallet-guard>
      <div class="max-w-4xl sm:border rounded-lg shadow-lg border-neutral-300 dark:border-neutral-800 p-10">
        <header class="text-center mb-6">
          <h1 class="text-3xl md:text-4xl font-bold">Acquire VKEY Tokens</h1>
          <p class="text-gray-500 mt-2">Purchase VKEY tokens with ETH to power up your NFTs</p>
        </header>

        <div class="mt-6">
          <div class="border border-neutral-300 dark:border-neutral-700 p-4 mb-6 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Current Price:</span>
              <span class="font-semibold">{{ (price.value() | weiToEth) ?? '?' }} ETH per VKEY</span>
            </div>
            <div class="flex justify-between mt-2">
              <span class="text-gray-600 dark:text-gray-400">Tokens for Sale:</span>
              <span class="font-semibold">{{ (tokenSaleAmount.value() | weiToEth) ?? '?' }} VKEY</span>
            </div>
          </div>

          <form #buyTokensForm="ngForm" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <label for="ethAmount" class="font-bold">Amount in ETH to Spend:</label>
              <p-inputgroup class="w-full">
                <input
                  #ethAmountInput="ngModel"
                  id="ethAmount"
                  name="ethAmount"
                  type="text"
                  pInputText
                  inputmode="decimal"
                  placeholder="0.0"
                  [(ngModel)]="ethAmount"
                  (focus)="activeInput.set('eth')"
                  [class.ng-invalid]="ethAmountInput.dirty && !isEthAmountValid()"
                />
                <p-inputgroup-addon>ETH</p-inputgroup-addon>
              </p-inputgroup>
              <div class="text-sm text-gray-500">
                Your ETH Balance: {{ (wallet.ethAmount.value() | weiToEth) ?? '???' }} ETH
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label for="tokenAmount" class="font-bold">Amount of VKEY to Receive:</label>
              <p-inputgroup class="w-full">
                <input
                  #tokenAmountInput="ngModel"
                  id="tokenAmount"
                  name="tokenAmount"
                  type="text"
                  pInputText
                  inputmode="decimal"
                  placeholder="0.0"
                  [(ngModel)]="tokenAmount"
                  (focus)="activeInput.set('token')"
                  [class.ng-invalid]="tokenAmountInput.dirty && !isTokenAmountValid()"
                />
                <p-inputgroup-addon>VKEY</p-inputgroup-addon>
              </p-inputgroup>
              <div class="text-sm text-gray-500">
                Your VKEY Balance: {{ (wallet.vkeyAmount.value() | weiToEth) ?? '???' }} VKEY
              </div>
            </div>

            <div class="text-center text-gray-600 overflow-auto whitespace-nowrap">
              You will receive
              <span class="font-bold text-lg text-green-600">{{ (tokenAmountWei() | weiToEth) ?? '0' }}</span>
              VKEY
            </div>

            <p-button
              label="Buy"
              severity="secondary"
              variant="outlined"
              styleClass="w-full"
              (click)="buy()"
              [loading]="buying()"
              [disabled]="!isFormValid()"
            />
          </form>

          <app-ether-tx-status #txStatus class="mt-4" />
        </div>
      </div>
    </app-connect-wallet-guard>
  `,
})
export class AcquireTokenComponent {
  readonly buyTokensForm = viewChild<NgForm>('buyTokensForm');
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly activeInput = signal<'eth' | 'token'>('eth');
  readonly buying = signal(false);
  readonly ethAmount = signal<string | undefined>(undefined);
  readonly tokenAmount = signal<string | undefined>(undefined);

  readonly ethAmountWei = computed(() => {
    const amount = this.ethAmount();

    if (amount === undefined) {
      return undefined;
    }

    try {
      return parseEther(amount);
    } catch {
      return undefined;
    }
  });

  readonly tokenAmountWei = computed(() => {
    const amount = this.tokenAmount();

    if (amount === undefined) {
      return undefined;
    }

    try {
      return parseEther(amount);
    } catch {
      return undefined;
    }
  });

  readonly isEthAmountValid = computed(() => {
    const ethAmount = this.ethAmountWei();
    const balance = this.wallet.ethAmount.value();
    return ethAmount !== undefined && balance !== undefined && ethAmount > 0n && ethAmount <= balance;
  });

  readonly isTokenAmountValid = computed(() => {
    const tokenAmount = this.tokenAmountWei();
    const saleAmount = this.tokenSaleAmount.value();
    return tokenAmount !== undefined && saleAmount !== undefined && tokenAmount > 0n && tokenAmount <= saleAmount;
  });

  readonly isFormValid = computed(() => {
    return this.isEthAmountValid() && this.isTokenAmountValid();
  });

  readonly price = resource({
    request: () => ({ chainId: this.wallet.chainId() }),
    loader: async ({ request }) => {
      if (request.chainId === undefined) {
        return undefined;
      } else {
        return await this.tokenSaleContract.getPrice();
      }
    },
  });

  readonly tokenSaleAmount = resource({
    request: () => ({ chainId: this.wallet.chainId() }),
    loader: async ({ request }) => {
      if (request.chainId === undefined) {
        return undefined;
      }

      const tokenSaleAddress = getTokenSaleAddress(request.chainId);

      if (tokenSaleAddress === undefined) {
        return undefined;
      }

      return await this.tokenContract.balanceOf(tokenSaleAddress);
    },
  });

  constructor(
    public wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
    private tokenSaleContract: VisualKeyTokenSaleContractService,
  ) {
    effect(() => {
      if (this.activeInput() !== 'eth') {
        return;
      }

      const ethAmount = this.ethAmount();
      const currentPrice = this.price.value();

      if (currentPrice === undefined || ethAmount === undefined) {
        this.tokenAmount.set(undefined);
        return;
      }

      try {
        const ethWei = parseEther(ethAmount);
        const tokenWei = (ethWei * 10n ** 18n) / currentPrice;
        this.tokenAmount.set(formatEther(tokenWei));
      } catch {
        this.tokenAmount.set(undefined);
      }
    });

    effect(() => {
      if (this.activeInput() !== 'token') {
        return;
      }

      const tokenAmount = this.tokenAmount();
      const currentPrice = this.price.value();

      if (currentPrice === undefined || currentPrice === 0n || tokenAmount === undefined) {
        this.ethAmount.set(undefined);
        return;
      }

      try {
        const tokenWei = parseEther(tokenAmount);
        const ethWei = (tokenWei * currentPrice) / 10n ** 18n;
        this.ethAmount.set(formatEther(ethWei));
      } catch {
        this.ethAmount.set(undefined);
      }
    });
  }

  async buy() {
    const chainId = this.wallet.chainId();

    if (chainId === undefined || !this.isFormValid()) {
      return;
    }

    this.buying.set(true);
    this.txStatus()?.reset();

    try {
      const tokenAmount = this.tokenAmount()!;
      const ethAmountWei = this.ethAmountWei()!;
      const tokenAmountWei = this.tokenAmountWei()!;

      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenSaleContract.buyTokens(ethAmountWei);

      if (hash === undefined) {
        this.txStatus()?.error('Transaction hash is undefined');
        return;
      }

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.wallet.ethAmount.value.update(prev => (prev ? prev - ethAmountWei : undefined));
        this.wallet.vkeyAmount.value.update(prev => (prev ? prev + tokenAmountWei : undefined));
        this.tokenSaleAmount.update(prev => (prev ? prev - tokenAmountWei : undefined));

        this.buyTokensForm()?.reset();
        this.txStatus()?.success(`Successfully purchased ${tokenAmount} VKEY`);
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.buying.set(false);
    }
  }
}
