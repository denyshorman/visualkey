import { Component, signal, viewChild } from '@angular/core';
import { Button } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';

import { WalletService } from '../../../services/wallet.service';
import { VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-token-disable-minting',
  standalone: true,
  imports: [Button, EtherTxStatusComponent],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">Token: Disable Minting</h2>

    <p-button
      styleClass="w-full"
      label="Permanently Disable Minting"
      severity="secondary"
      (click)="confirmDisable()"
      [loading]="disabling()"
    />

    <app-ether-tx-status #txStatus class="mt-2" />
  `,
})
export class TokenDisableMintingComponent {
  readonly disabling = signal(false);
  readonly txStatus = viewChild(EtherTxStatusComponent);

  constructor(
    public wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
    private confirmationService: ConfirmationService,
  ) {}

  confirmDisable() {
    this.confirmationService.confirm({
      header: 'Confirmation',
      message: 'Are you sure you want to permanently disable minting? This action cannot be undone.',
      accept: () => {
        this.disable();
      },
    });
  }

  async disable() {
    this.disabling.set(true);
    this.txStatus()?.reset();

    try {
      const chainId = this.wallet.chainId();
      const owner = this.wallet.accountAddress()!;

      this.txStatus()?.walletConfirmation();

      const hash = await this.tokenContract.disableMinting(chainId, owner);

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Minting has been permanently disabled.');
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.disabling.set(false);
    }
  }
}
