import { Component, computed, resource } from '@angular/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { formatEther, Hex } from 'viem';
import { readContracts } from '@wagmi/core';

import { WalletService } from '../../../services/wallet.service';
import { tokenAbi, VisualKeyTokenContractService } from '../../../services/token-contract.service';
import { nftAbi, NftContractService } from '../../../services/nft-contract.service';
import { tokenSaleAbi, VisualKeyTokenSaleContractService } from '../../../services/token-sale-contract.service';
import { WeiToEthPipe } from '../../../pipes/wei-to-eth.pipe';
import { DEFAULT_MULTICALL_ADDRESS } from '../../../utils/eth-utils';
import { LocalizedDateTimePipe } from '../../../pipes/localized-date-time.pipe';

@Component({
  selector: 'app-contract-info',
  standalone: true,
  imports: [Button, Message, WeiToEthPipe, LocalizedDateTimePipe],
  host: {
    class: 'flex flex-col border p-10 gap-7',
  },
  template: `
    <h2 class="self-stretch text-center text-2xl border-b">Contract Info</h2>

    @if (info.isLoading()) {
      <div class="text-center p-4">Loading project data...</div>
    } @else if (info.hasValue()) {
      <div class="flex flex-col sm:flex-row flex-wrap gap-2 text-sm">
        <div class="flex flex-col gap-3 p-4 border rounded">
          <h3 class="text-lg font-bold">VKEY Token</h3>

          <div class="flex gap-2">
            <span>Total Supply:</span>
            <span>{{ (info.value().tokenTotalSupply | weiToEth) ?? '?' }}</span>
          </div>
          <div class="flex gap-2">
            <span>Minting Disabled:</span>
            <span>
              {{ info.value().isMintingDisabled === undefined ? '?' : info.value().isMintingDisabled ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex gap-2">
            <span>Last Mint:</span>
            <span>{{ (info.value().lastMintDate | localizedDateTime: 'uk-UA') ?? '?' }}</span>
          </div>
          <div class="flex gap-2">
            <span>Next Mint:</span>
            <span>{{ (nextMintDate() | localizedDateTime: 'uk-UA') ?? '?' }}</span>
          </div>
          <div class="flex gap-2">
            <span>Mint Amount:</span>
            <span>{{ mintAmount() ?? '?' }}</span>
          </div>
          <div class="flex gap-2">
            <span>Owner:</span>
            <span>{{ info.value().tokenOwner ?? '?' }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-3 p-4 border rounded">
          <h3 class="text-lg font-bold">VKEY NFT</h3>
          <div class="flex gap-2">
            <span>Total Supply:</span>
            <span>{{ info.value().nftTotalSupply ?? '?' }}</span>
          </div>
          <div class="flex gap-2">
            <span>Owner:</span>
            <span>{{ info.value().nftOwner ?? '?' }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-3 p-4 border rounded">
          <h3 class="text-lg font-bold">Token Sale</h3>
          <div class="flex gap-2">
            <span>Price:</span>
            <span>{{ (info.value().salePriceEth | weiToEth) ?? '?' }} ETH</span>
          </div>
          <div class="flex gap-2">
            <span>Tokens:</span>
            <span>{{ (info.value().tokensAvailableForSale | weiToEth) ?? '?' }} VKEY</span>
          </div>
          <div class="flex gap-2">
            <span>Owner:</span>
            <span>{{ info.value().saleOwner ?? '?' }}</span>
          </div>
        </div>
      </div>
    } @else if (info.error()) {
      <div>
        <p-message severity="error" closable>
          {{ info.error() }}
        </p-message>
      </div>
    }

    <p-button label="Reload" [loading]="info.isLoading()" (click)="info.reload()" styleClass="w-full" />
  `,
})
export class ContractInfoComponent {
  readonly info = resource({
    params: () => ({ chainId: this.wallet.chainId() }),
    loader: async ({ params }) => {
      const tokenAddress = this.tokenContract.getContractAddressOrThrow(params.chainId);
      const nftAddress = this.nftContract.getContractAddressOrThrow(params.chainId);
      const saleAddress = this.tokenSaleContract.getContractAddressOrThrow(params.chainId);

      const contracts = [
        { address: tokenAddress, abi: tokenAbi, functionName: 'totalSupply' },
        { address: tokenAddress, abi: tokenAbi, functionName: 'owner' },
        { address: tokenAddress, abi: tokenAbi, functionName: 'lastMintTimestamp' },
        { address: tokenAddress, abi: tokenAbi, functionName: 'mintingDisabled' },
        { address: tokenAddress, abi: tokenAbi, functionName: 'balanceOf', args: [saleAddress] },
        { address: nftAddress, abi: nftAbi, functionName: 'totalSupply' },
        { address: nftAddress, abi: nftAbi, functionName: 'owner' },
        { address: saleAddress, abi: tokenSaleAbi, functionName: 'owner' },
        { address: saleAddress, abi: tokenSaleAbi, functionName: 'getPrice' },
      ] as const;

      const results = await readContracts(this.wallet.wagmiConfig, {
        contracts,
        allowFailure: true,
        multicallAddress: DEFAULT_MULTICALL_ADDRESS,
        blockTag: 'latest',
      });

      return {
        tokenTotalSupply: results[0]?.result,
        tokenOwner: results[1]?.result,
        lastMintDate: results[2]?.result,
        isMintingDisabled: results[3]?.result,
        tokensAvailableForSale: results[4]?.result,
        nftTotalSupply: results[5]?.result,
        nftOwner: results[6]?.result,
        saleOwner: results[7]?.result,
        salePriceEth: results[8]?.result,
      } as ProjectInfo;
    },
  });

  readonly nextMintDate = computed(() => {
    const chainId = this.wallet.chainId();
    const lastMintDate = this.info.value()?.lastMintDate;

    if (lastMintDate === undefined) {
      return undefined;
    }

    return this.tokenContract.calcNextMintTimestamp(chainId, lastMintDate);
  });

  readonly mintAmount = computed(() => {
    const chainId = this.wallet.chainId();
    const amountWei = this.tokenContract.getMintAmount(chainId);

    if (amountWei === undefined) {
      return undefined;
    }

    return formatEther(amountWei);
  });

  constructor(
    public wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
    private nftContract: NftContractService,
    private tokenSaleContract: VisualKeyTokenSaleContractService,
  ) {}
}

interface ProjectInfo {
  tokenTotalSupply: bigint | undefined;
  tokenOwner: Hex | undefined;
  isMintingDisabled: boolean | undefined;
  lastMintDate: bigint | undefined;
  nftTotalSupply: bigint | undefined;
  nftOwner: Hex | undefined;
  salePriceEth: bigint | undefined;
  saleOwner: bigint | undefined;
  tokensAvailableForSale: bigint | undefined;
}
