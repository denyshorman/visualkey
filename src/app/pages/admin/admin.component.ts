import { Component } from '@angular/core';

import { WalletService } from '../../services/wallet.service';
import { TokenSaleSetPriceComponent } from './actions/token-sale-set-price.component';
import { TokenSaleWithdrawEthComponent } from './actions/token-sale-withdraw-eth.component';
import { TokenSaleWithdrawErc20Component } from './actions/token-sale-withdraw-erc20.component';
import { TokenSaleTransferOwnershipComponent } from './actions/token-sale-transfer-ownership.component';
import { TokenMintComponent } from './actions/token-mint.component';
import { TokenDisableMintingComponent } from './actions/token-disable-minting.component';
import { TokenTransferOwnershipComponent } from './actions/token-ownership-transfer.component';
import { ContractInfoComponent } from './actions/contract-info.component';
import { ConnectWalletGuardComponent } from '../../components/connect-wallet-guard/connect-wallet-guard.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    TokenSaleSetPriceComponent,
    TokenSaleWithdrawEthComponent,
    TokenSaleWithdrawErc20Component,
    TokenSaleTransferOwnershipComponent,
    TokenMintComponent,
    TokenDisableMintingComponent,
    TokenTransferOwnershipComponent,
    ContractInfoComponent,
    ConnectWalletGuardComponent,
  ],
  host: {
    class: 'flex flex-col gap-4 grow',
  },
  template: `
    <h1 class="self-stretch text-4xl border-b p-10">Admin Panel</h1>

    <app-connect-wallet-guard>
      <div class="flex flex-col sm:flex-row flex-wrap gap-4">
        <app-contract-info></app-contract-info>
        <app-token-mint></app-token-mint>
        <app-token-disable-minting></app-token-disable-minting>
        <app-token-transfer-ownership></app-token-transfer-ownership>
        <app-token-sale-set-price></app-token-sale-set-price>
        <app-token-sale-withdraw-eth></app-token-sale-withdraw-eth>
        <app-token-sale-withdraw-erc20></app-token-sale-withdraw-erc20>
        <app-token-sale-transfer-ownership></app-token-sale-transfer-ownership>
      </div>
    </app-connect-wallet-guard>
  `,
})
export class AdminComponent {
  constructor(public wallet: WalletService) {}
}
