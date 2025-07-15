import { Component, computed } from '@angular/core';
import { NftListComponent } from '../../../components/nft/nft-list/nft-list.component';
import { OpenseaService } from '../../../services/opensea.service';
import { WalletService } from '../../../services/wallet.service';

@Component({
  selector: 'app-my-nft-collection',
  imports: [NftListComponent],
  host: {
    class: 'flex flex-col grow',
  },
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900 shadow-lg px-10 py-8 mb-4 gap-4 border-b border-neutral-200 dark:border-neutral-700">
      <div class="flex flex-col gap-1">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">My NFTs</h1>
        <h2 class="text-lg font-medium text-neutral-500 dark:text-neutral-300">View and manage my NFT collection</h2>
      </div>
      @if (openSeaNftCollectionUrl() !== undefined) {
        <div class="flex flex-col sm:flex-row gap-2">
          <a
            [href]="openSeaNftCollectionUrl()"
            target="_blank"
            rel="noopener noreferrer"
            class="p-button p-button-primary p-button-rounded p-button-raised p-button-outlined p-button-lg select-none w-full"
          >
            View on OpenSea
          </a>
        </div>
      }
    </div>

    <app-nft-list listType="owned"></app-nft-list>
  `,
})
export class ViewMyNftsComponent {
  readonly openSeaNftCollectionUrl = computed(() => {
    return this.openSeaService.getVisualKeysCollectionUrl(this.wallet.chainId());
  });

  constructor(
    private openSeaService: OpenseaService,
    private wallet: WalletService,
  ) {}
}
