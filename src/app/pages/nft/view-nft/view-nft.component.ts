import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  input,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { WalletService } from '../../../services/wallet.service';
import { NftContractService, TokenRarity } from '../../../services/nft-contract.service';
import { Button } from 'primeng/button';
import { BitSetComponent } from '../../../components/bit-set/bit-set.component';
import { InternationalDateTimePipe } from '../../../pipes/international-date-time.pipe';
import { Hex } from 'viem';
import { Card } from 'primeng/card';
import { bigIntToAddrHex, ETH_ADDR_BIT_COUNT } from '../../../utils/eth-utils';
import { WeiToEthPipe } from '../../../pipes/wei-to-eth.pipe';

@Component({
  selector: 'app-nft-view',
  standalone: true,
  imports: [Message, ProgressSpinner, Button, BitSetComponent, InternationalDateTimePipe, Card, WeiToEthPipe],
  host: {
    class: 'flex flex-col grow',
  },
  template: `
    @if (tokenId() === undefined) {
      <div class="flex grow items-center justify-center">
        <p-message severity="error">Invalid NFT ID {{ id() }}</p-message>
      </div>
    } @else {
      @if (tokenInfo.isLoading()) {
        <div class="flex grow items-center justify-center">
          <p-progress-spinner strokeWidth="8" fill="transparent" animationDuration=".5s" />
        </div>
      } @else if (tokenInfo.hasValue() && tokenInfo.value() && tokenMinted()) {
        <div class="grow sm:flex sm:flex-col sm:items-center sm:justify-center my-2 mx-1 md:m-0">
          <div #bitSetContainer class="flex flex-col gap-2">
            <app-bit-set
              [bitCount]="addrBitCount"
              [gridCols]="addrGridCols"
              [bitSet]="tokenId()!"
              [bitCellSize]="bitCellSize()"
              [readOnly]="true"
              class="self-center"
            />

            <h2 class="my-2 text-xl sm:text-2xl overflow-auto whitespace-nowrap scrollbar-none">
              Visual Key #{{ tokenIdFormatted() }}
            </h2>

            @for (info of tokenInfo.value(); track info.chainId) {
              @if (info.owner !== null && info.rarity !== null) {
                <p-card class="border border-neutral-100 dark:border-neutral-700 overflow-auto whitespace-nowrap scrollbar-none sm:self-center">
                  <div class="flex flex-row items-baseline">
                    <span class="font-bold select-none">Minted on:</span>
                    <span class="ml-2 grow">{{ info.chainName }}</span>
                  </div>
                  <div class="flex flex-row items-baseline">
                    <span class="font-bold select-none">Owner:</span>
                    <span class="ml-2 grow">{{ info.owner ?? '??' }}</span>
                  </div>
                  <div class="flex flex-row items-baseline">
                    <span class="font-bold select-none">Level:</span>
                    <span class="ml-2 grow">{{ info.rarity?.level ?? '??' }}</span>
                  </div>
                  <div class="flex flex-row items-baseline">
                    <span class="font-bold select-none">Power:</span>
                    <span class="ml-2 grow">{{ (info.rarity?.power | weiToEth) ?? '??' }} VKEY</span>
                  </div>
                  <div class="flex flex-row items-baseline">
                    <span class="font-bold select-none">Created on:</span>
                    <span class="ml-2 grow">{{ (info.rarity?.createdAt | internationalDateTime) ?? '??' }}</span>
                  </div>
                </p-card>
              }
            }
          </div>
        </div>
      } @else if (tokenInfo.error()) {
        <div class="flex grow flex-col gap-2 items-center justify-center">
          <p-message severity="error">Could not load NFT details: {{ tokenInfo.error() }}</p-message>

          <p-button
            severity="success"
            size="large"
            class="w-3/4 sm:w-md"
            styleClass="select-none w-full"
            [loading]="tokenInfo.isLoading()"
            (click)="tokenInfo.reload()"
          >
            Try again
          </p-button>
        </div>
      } @else {
        <div class="flex grow items-center justify-center">
          <p-message severity="warn">Visual Key #{{ tokenIdFormatted() }} has not been minted yet</p-message>
        </div>
      }
    }
  `,
})
export class ViewNftComponent {
  readonly addrBitCount = ETH_ADDR_BIT_COUNT;
  readonly addrGridCols = 16;

  readonly id = input.required<string>();

  readonly tokenId = computed(() => {
    try {
      const idBigInt = BigInt(this.id());

      if (idBigInt > 0 && idBigInt <= 0xffffffffffffffffffffffffffffffffffffffffn) {
        return idBigInt;
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
  });

  readonly tokenIdFormatted = computed(() => {
    const tokenId = this.tokenId();

    if (tokenId === undefined) {
      return undefined;
    }

    return bigIntToAddrHex(tokenId).slice(2);
  });

  readonly tokenInfo = resource({
    params: () => ({ tokenId: this.tokenId() }),
    loader: async ({ params }) => {
      if (params.tokenId === undefined) {
        return undefined;
      }

      const supportedChainIds = this.wallet.wagmiConfig.chains.map(chain => chain.id);
      const tokens = await this.nftContractService.getTokenDetailsBatch(supportedChainIds, params.tokenId);

      return tokens.map((tokenInfo, index) => {
        const ownerError = tokenInfo.owner instanceof Error;
        const rarityError = tokenInfo.rarity instanceof Error;
        const ownerErrorMsg = ownerError ? (tokenInfo.owner as Error).message : undefined;
        const rarityErrorMsg = rarityError ? (tokenInfo.rarity as Error).message : undefined;
        const owner = ownerError ? undefined : (tokenInfo.owner as Hex | null);
        const rarity = rarityError ? undefined : (tokenInfo.rarity as TokenRarity | null);

        return {
          chainId: tokenInfo.chainId,
          chainName: this.wallet.wagmiConfig.chains[index].name ?? 'Unknown',
          tokenId: tokenInfo.tokenId,
          owner,
          rarity,
          ownerError,
          rarityError,
          ownerErrorMsg,
          rarityErrorMsg,
        };
      });
    },
  });

  readonly tokenMinted = computed(() => {
    const tokenInfo = this.tokenInfo.value();

    if (tokenInfo === undefined) {
      return undefined;
    }

    return tokenInfo.some(info => info.owner !== null);
  });

  readonly bitSetContainerRef = viewChild<ElementRef<HTMLDivElement>>('bitSetContainer');
  readonly bitCellSize = signal(0);

  constructor(
    public wallet: WalletService,
    private nftContractService: NftContractService,
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

    effect(() => {
      if (this.bitSetContainerRef()) {
        this.changeBitSize();
      }
    });
  }

  private changeBitSize() {
    const containerWidth = this.bitSetContainerRef()?.nativeElement?.offsetWidth;

    if (containerWidth) {
      const offset = window.innerWidth >= 640 ? 300 : 10;
      const bitSize = Math.floor((containerWidth - offset) / this.addrGridCols);
      this.bitCellSize.set(bitSize);
    }
  }
}
