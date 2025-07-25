import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  input,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { NftContractService, Token } from '../../../services/nft-contract.service';
import { NftInfoComponent } from '../nft-info/nft-info.component';
import { WalletService } from '../../../services/wallet.service';
import { Button } from 'primeng/button';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Hex } from 'viem';
import { ConnectWalletGuardComponent } from '../../connect-wallet-guard/connect-wallet-guard.component';

@Component({
  selector: 'app-nft-list',
  imports: [NftInfoComponent, Button, NgClass, ProgressSpinner, ConnectWalletGuardComponent, NgTemplateOutlet],
  templateUrl: './nft-list.component.html',
  host: {
    class: 'flex flex-col grow',
    '(window:scroll)': 'onScroll()',
  },
})
export class NftListComponent {
  readonly listType = input.required<'owned' | 'all'>();

  readonly bitCellSize = signal(0);

  readonly chainId = computed(() => {
    return this.wallet.chainId();
  });

  readonly account = computed(() => {
    const type = this.listType();
    const account = this.wallet.accountAddress();

    if (type === 'all') {
      return undefined;
    } else {
      return account;
    }
  });

  // TODO: Optimize when loaded less than limit
  readonly offset = linkedSignal<{ chainId: number; account: Hex | undefined }, number>({
    source: () => ({ chainId: this.chainId(), account: this.account() }),
    computation: (source, previous) => {
      const prevChainId = previous?.source?.chainId;
      const prevAccount = previous?.source?.account;
      const newChainId = source.chainId;
      const newAccount = source.account;

      if (newChainId == prevChainId && newAccount === prevAccount) {
        return previous?.value ?? 0;
      } else {
        return 0;
      }
    },
  });

  readonly limit = signal(10);

  readonly offsetNfts = resource({
    params: () => ({ chainId: this.chainId(), account: this.account(), offset: this.offset() }),
    loader: async ({ params }) => {
      if (params.account === undefined) {
        return await this.nftContractService.allTokens(params.chainId, params.offset, this.limit());
      } else {
        return await this.nftContractService.ownedTokens(params.chainId, params.account, params.offset, this.limit());
      }
    },
    defaultValue: [],
  });

  readonly nfts = linkedSignal<{ chainId: number; account: Hex | undefined; offsetNfts: Token[] }, Token[]>(
    {
      source: () => ({ chainId: this.chainId(), account: this.account(), offsetNfts: this.offsetNfts.value() }),
      computation: (source, previous) => {
        if (
          source.chainId === previous?.source?.chainId &&
          source.account === previous?.source?.account
        ) {
          const prevNfts = previous?.value ?? [];
          return [...prevNfts, ...source.offsetNfts];
        } else {
          return source.offsetNfts;
        }
      },
    },
  );

  constructor(
    public wallet: WalletService,
    private nftContractService: NftContractService,
    private elementRef: ElementRef,
    destroyRef: DestroyRef,
  ) {
    afterNextRender(() => {
      this.changeBitSize();

      const resizeObserver = new ResizeObserver(() => this.changeBitSize());
      resizeObserver.observe(document.body);

      destroyRef.onDestroy(() => {
        resizeObserver?.disconnect();
      });
    });
  }

  onScroll() {
    if (this.offsetNfts.isLoading()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 100;

    if (scrollPosition >= threshold) {
      this.offset.set(this.nfts().length);
    }
  }

  private changeBitSize() {
    const width = this.elementRef.nativeElement.offsetWidth - 10;

    if (width >= 640) {
      this.bitCellSize.set(25);
    } else {
      this.bitCellSize.set((width / 16) * 0.8);
    }
  }
}
