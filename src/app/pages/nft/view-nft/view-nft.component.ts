import { afterNextRender, Component, computed, DestroyRef, input, linkedSignal, resource, signal } from '@angular/core';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { WalletService } from '../../../services/wallet.service';
import { NftContractService } from '../../../services/nft-contract.service';
import { NftInfoComponent } from '../../../components/nft/nft-info/nft-info.component';
import { ContractFunctionExecutionError, ContractFunctionRevertedError } from 'viem';
import { Button } from 'primeng/button';
import { ConnectWalletGuardComponent } from '../../../components/connect-wallet-guard/connect-wallet-guard.component';

@Component({
  selector: 'app-nft-view',
  standalone: true,
  imports: [NftInfoComponent, Message, ProgressSpinner, Button, ConnectWalletGuardComponent],
  host: {
    class: 'flex flex-col grow',
  },
  template: `
    @if (tokenId() === undefined) {
      <div class="grow flex items-center justify-center">
        <p-message severity="error">Invalid NFT ID {{ id() }}</p-message>
      </div>
    } @else {
      <app-connect-wallet-guard>
        @if (tokenInfo.isLoading()) {
          <div class="grow flex items-center justify-center">
            <p-progress-spinner strokeWidth="8" fill="transparent" animationDuration=".5s" />
          </div>
        } @else if (tokenInfo.hasValue() && tokenInfo.value()) {
          <div class="grow flex items-center justify-center">
            <app-nft-info
              class="w-full mx-2 sm:w-auto"
              [tokenId]="tokenInfo.value()!.id"
              [owner]="tokenInfo.value()!.owner"
              [level]="tokenInfo.value()!.rarity.level"
              [(power)]="power"
              [createdAt]="tokenInfo.value()!.rarity.createdAt"
              [bitCellSize]="bitCellSize()"
            />
          </div>
        } @else if (tokenInfo.error()) {
          <div class="grow flex flex-col gap-2 items-center justify-center">
            <p-message severity="error"> Could not load NFT details: {{ tokenInfo.error() }}</p-message>

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
          <div class="grow flex items-center justify-center">
            <p-message severity="warn">
              NFT {{ id() }} was not found in the {{ wallet.chainName() ?? 'selected' }} chain
            </p-message>
          </div>
        }
      </app-connect-wallet-guard>
    }
  `,
})
export class ViewNftComponent {
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

  readonly chainId = computed(() => {
    return this.wallet.chainId();
  });

  readonly tokenInfo = resource({
    request: () => ({ chainId: this.chainId(), tokenId: this.tokenId() }),
    loader: async ({ request }) => {
      if (request.chainId === undefined || request.tokenId === undefined) {
        return undefined;
      }

      try {
        return await this.nftContractService.getInfo(request.tokenId);
      } catch (e) {
        if (e instanceof ContractFunctionExecutionError) {
          const cause = e.cause;

          if (cause instanceof ContractFunctionRevertedError) {
            if (cause.data?.errorName === 'ERC721NonexistentToken') {
              return null;
            }
          }
        }

        throw e;
      }
    },
  });

  readonly power = linkedSignal(() => {
    const fetchedPower = this.tokenInfo.value()?.rarity?.power;

    if (fetchedPower === null || fetchedPower === undefined) {
      return 0n;
    }

    return fetchedPower;
  });

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
  }

  private changeBitSize() {
    let bitSize = Math.floor((window.innerHeight / 16) * 0.55);

    if (bitSize * 20 > window.innerWidth) {
      bitSize = Math.floor((window.innerWidth / 16) * 0.85);
    }

    this.bitCellSize.set(bitSize);
  }
}
