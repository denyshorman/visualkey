import { Component, signal, viewChild } from '@angular/core';
import { Button } from 'primeng/button';
import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenSaleContractService } from '../../../services/token-sale-contract.service';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-sale-withdraw-eth',
  standalone: true,
  imports: [Button, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">TokenSale: Withdraw ETH</h2>

    <p-button
      styleClass="w-full"
      label="Withdraw All ETH"
      severity="secondary"
      (click)="withdraw()"
      [loading]="withdrawing()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenSaleWithdrawEthComponent {
  readonly withdrawing = signal(false);
  readonly txStatus = viewChild(EtherTxStatusComponent);

  constructor(
    public wallet: WalletService,
    private tokenSaleContract: VisualKeyTokenSaleContractService,
  ) {}

  async withdraw() {
    this.withdrawing.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId()!;

      this.txStatus()?.walletConfirmation();

      const hash = (await this.tokenSaleContract.withdrawETH())!;

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Withdrawal successful! The ETH has been sent to your wallet.');
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
