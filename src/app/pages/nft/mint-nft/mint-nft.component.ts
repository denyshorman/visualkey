import { afterNextRender, Component, computed, ElementRef, input, resource, signal, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ContractFunctionExecutionError, ContractFunctionRevertedError, Hex, parseEther } from 'viem';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { BitSetComponent } from '../../../components/bit-set/bit-set.component';
import { WalletService } from '../../../services/wallet.service';
import { NftContractService } from '../../../services/nft-contract.service';
import { EthAccount } from '../../../models/eth-account';
import { countLeadingZeroBits } from '../../../utils/big-int-utils';
import { WeiToEthPipe } from '../../../pipes/wei-to-eth.pipe';
import { InternationalDateTimePipe } from '../../../pipes/international-date-time.pipe';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { ProgressBar } from 'primeng/progressbar';
import { ETH_ADDR_BIT_COUNT } from '../../../utils/eth-utils';
import { EtherTxStatusComponent } from '../../../components/ether-tran-status/ether-tx-status.component';

@Component({
  selector: 'app-nft-mint',
  standalone: true,
  imports: [
    FormsModule,
    BitSetComponent,
    Button,
    InputText,
    Message,
    WeiToEthPipe,
    InternationalDateTimePipe,
    InputGroup,
    InputGroupAddon,
    ProgressBar,
    EtherTxStatusComponent,
  ],
  host: {
    class: 'flex flex-col grow sm:items-center sm:justify-center',
    '(window:resize)': 'recalculateBitSize()',
  },
  template: `
    @if (ethAccount()) {
      <div #bitSetContainer class="max-w-4xl w-full flex flex-col sm:border rounded-lg shadow-lg border-neutral-300 dark:border-neutral-800 p-2 sm:p-10">
        <app-bit-set
          [bitCount]="addrBitCount"
          [gridCols]="addrGridCols"
          [bitSet]="ethAccount()!.addressBigInt"
          [bitCellSize]="bitCellSize()"
          [readOnly]="true"
          class="mt-1 self-center"
        />

        <h2 class="text-2xl sm:text-3xl font-bold text-center mt-3 sm:mt-6">Visual Key NFT</h2>

        <div class="flex flex-col gap-3 border border-neutral-300 dark:border-neutral-700 p-4 my-3 sm:my-6 text-sm">
          <div class="flex flex-col sm:flex-row sm:gap-2">
            <span class="text-gray-600 dark:text-gray-400">Token ID (Ethereum address):</span>
            <span class="font-semibold wrap-break-word">{{ ethAccount()!.address }}</span>
          </div>
          @if (tokenInfo.value()) {
            <div class="flex flex-col sm:flex-row sm:gap-2">
              <span class="text-gray-600 dark:text-gray-400">Current Owner:</span>
              <span class="font-semibold wrap-break-word">{{ tokenInfo.value()!.owner }}</span>
            </div>
          }
          <div class="flex flex-col">
            <div class="flex gap-2">
              <span class="text-gray-600 dark:text-gray-400">Rarity Level:</span>
              <span class="font-semibold">{{ nftLevel() }}</span>
            </div>
            <span class="text-xs text-gray-500">Based on the number of red squares at the start of the address. Higher levels are exponentially rarer.</span>
          </div>
          @if (tokenInfo.value()) {
            <div class="flex flex-col">
              <div class="flex gap-2">
                <span class="text-gray-600 dark:text-gray-400">Current Power:</span>
                <span class="font-semibold">{{ tokenInfo.value()!.rarity.power | weiToEth }} VKEY</span>
              </div>
              <span class="text-xs text-gray-500">A rarity factor you control by committing VKEY. Higher Power makes your NFT more distinguished.</span>
            </div>
            <div class="flex gap-2">
              <span class="text-gray-600 dark:text-gray-400">Minted On:</span>
              <span class="font-semibold">{{ tokenInfo.value()!.rarity.createdAt | internationalDateTime }}</span>
            </div>
          }
        </div>

        @if (wallet.accountStatus() === 'connected') {
          @if (tokenInfo.isLoading()) {
            <p-progressbar mode="indeterminate" styleClass="w-full h-2 mt-4" />
          } @else if (tokenInfo.value()) {
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <label for="increasePower" class="font-bold">Increase Power</label>
                <p class="text-sm text-gray-500 my-1">Commit more VKEY to enhance this NFT's distinction within its Level.</p>
                <p-inputgroup>
                  <input
                    #increasePowerInput="ngModel"
                    id="increasePower"
                    type="text"
                    pInputText
                    inputmode="decimal"
                    [(ngModel)]="power"
                    placeholder="e.g., 50"
                    [class.ng-invalid]="increasePowerInput.dirty && !isPowerValid()"
                  />
                  <p-inputgroup-addon>VKEY</p-inputgroup-addon>
                </p-inputgroup>
                <div class="text-xs sm:text-sm text-gray-500 overflow-auto whitespace-nowrap scrollbar-none">
                  Your VKEY Balance: {{ (wallet.vkeyAmount.value() | weiToEth) ?? '???' }}
                </div>
              </div>

              <p-button
                styleClass="w-full"
                severity="secondary"
                size="large"
                [outlined]="true"
                (click)="increasePower()"
                [loading]="processing()"
                [disabled]="!isPowerValid()"
              >
                @if (processing()) {
                  Increasing Power
                } @else {
                  Increase Power
                }
              </p-button>
            </div>
          } @else {
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <label for="initialPower" class="font-bold">Empower Your NFT</label>
                <p class="text-sm text-gray-500 my-1">Commit VKEY tokens to set your NFT's initial Power.<br>This makes it more distinguished within its Level.</p>
                <p-inputgroup>
                  <input
                    #initialPowerInput="ngModel"
                    pInputText
                    inputmode="decimal"
                    id="initialPower"
                    [(ngModel)]="power"
                    placeholder="e.g., 100"
                    [class.ng-invalid]="initialPowerInput.dirty && !isPowerValid()"
                  />
                  <p-inputgroup-addon>VKEY</p-inputgroup-addon>
                </p-inputgroup>
                <div class="text-xs sm:text-sm text-gray-500 overflow-auto whitespace-nowrap scrollbar-none">
                  Your VKEY Balance: {{ (wallet.vkeyAmount.value() | weiToEth) ?? '???' }}
                </div>
              </div>

              <p-button
                styleClass="w-full"
                severity="secondary"
                size="large"
                [outlined]="true"
                (click)="mint()"
                [loading]="processing()"
                [disabled]="!isPowerValid()"
              >
                @if (processing()) {
                  Minting
                } @else {
                  Mint
                }
              </p-button>
            </div>
          }
        } @else {
          <p-button
            styleClass="w-full"
            [outlined]="true"
            severity="secondary"
            size="large"
            (click)="wallet.open()"
            [disabled]="!wallet.walletInitialized() || wallet.walletOpen() || wallet.accountStatus() === 'connecting' || wallet.accountStatus() === 'reconnecting'"
          >
            @if (!wallet.walletInitialized()) {
              Initializing...
            } @else if (wallet.accountStatus() === 'connecting') {
              Connecting...
            } @else if (wallet.accountStatus() === 'reconnecting') {
              Reconnecting...
            } @else {
              Connect Wallet to Mint
            }
          </p-button>
        }

        <app-ether-tx-status #txStatus class="mt-5" />
      </div>
    } @else {
      <p-message severity="error">Private key for the address {{ id() }} is missing</p-message>
    }
  `,
})
export class MintNftComponent {
  readonly addrBitCount = ETH_ADDR_BIT_COUNT;
  readonly addrGridCols = 16;

  readonly id = input.required<string>();

  readonly ethAccount = computed(() => {
    try {
      const privateKey = sessionStorage.getItem('mintNftPrivateKey');

      if (privateKey === null) {
        return undefined;
      }

      const account = new EthAccount(BigInt(privateKey));

      return account.isValid ? account : undefined;
    } catch {
      return undefined;
    }
  });

  readonly initialPowerInput = viewChild<NgModel>('initialPowerInput');
  readonly increasePowerInput = viewChild<NgModel>('increasePowerInput');
  readonly bitSetContainerRef = viewChild<ElementRef<HTMLDivElement>>('bitSetContainer');
  readonly txStatus = viewChild(EtherTxStatusComponent);

  readonly bitCellSize = signal(0);
  readonly processing = signal(false);

  readonly power = signal<string | undefined>(undefined);

  readonly powerWei = computed(() => {
    const power = this.power();

    if (power === undefined) {
      return undefined;
    }

    try {
      return parseEther(power);
    } catch {
      return undefined;
    }
  });

  readonly nftLevel = computed(() => {
    const account = this.ethAccount();
    return account ? countLeadingZeroBits(account.addressBigInt, this.addrBitCount) : undefined;
  });

  readonly isPowerValid = computed(() => {
    const power = this.powerWei();
    const balance = this.wallet.vkeyAmount.value();

    if (power === undefined || balance === undefined) {
      return false;
    }

    return power > 0n && power <= balance;
  });

  readonly tokenInfo = resource({
    request: () => ({ chainId: this.wallet.chainId(), tokenId: this.ethAccount()?.addressBigInt }),
    loader: async ({ request }) => {
      const { chainId, tokenId } = request;

      if (chainId === undefined || tokenId === undefined) {
        return undefined;
      }

      try {
        return await this.nftContract.getInfo(tokenId);
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

  constructor(
    public wallet: WalletService,
    private nftContract: NftContractService,
  ) {
    afterNextRender(() => {
      this.recalculateBitSize();
    });
  }

  async mint() {
    const chainId = this.wallet.chainId();
    const tokenPk = this.ethAccount()?.privateKeyHex;
    const power = this.powerWei();

    if (chainId === undefined || tokenPk === undefined || power === undefined) {
      return;
    }

    this.processing.set(true);
    this.txStatus()?.reset();

    try {
      this.txStatus()?.walletConfirmation();

      const hash = await this.nftContract.mint(power, tokenPk as Hex);

      if (hash === undefined) {
        this.txStatus()?.error('Minting failed. Please try again.');
        return;
      }

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('NFT Minted Successfully!');
        this.wallet.vkeyAmount.update(amount => (amount !== undefined ? amount - power : undefined));
        this.initialPowerInput()?.reset();
        this.tokenInfo.reload();
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.processing.set(false);
    }
  }

  async increasePower() {
    const chainId = this.wallet.chainId();
    const tokenId = this.ethAccount()?.addressBigInt;
    const power = this.powerWei();

    if (chainId === undefined || tokenId === undefined || power === undefined) {
      return;
    }

    this.processing.set(true);
    this.txStatus()?.reset();

    try {
      this.txStatus()?.walletConfirmation();

      const hash = await this.nftContract.increasePower(tokenId, power);

      this.txStatus()?.processing(chainId, hash);

      const receipt = await this.wallet.waitForTransactionReceipt(chainId, hash);

      if (receipt.status === 'success') {
        this.txStatus()?.success('Power increased successfully!');
        this.wallet.vkeyAmount.update(amount => (amount !== undefined ? amount - power : undefined));
        this.tokenInfo.update(tokenInfo => {
          if (tokenInfo) {
            tokenInfo.rarity.power += power;
          }
          return tokenInfo;
        });
        this.increasePowerInput()?.reset();
      } else {
        this.txStatus()?.error('Transaction failed');
      }
    } catch (e) {
      this.txStatus()?.error(e);
    } finally {
      this.processing.set(false);
    }
  }

  recalculateBitSize() {
    const containerWidth = this.bitSetContainerRef()?.nativeElement?.offsetWidth;

    if (containerWidth) {
      const offset = window.innerWidth >= 640 ? 300 : 10;
      const bitSize = Math.floor((containerWidth - offset) / this.addrGridCols);
      this.bitCellSize.set(bitSize);
    }
  }
}
