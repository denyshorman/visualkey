import { Component, computed, effect, EventEmitter, HostListener, Input, OnInit, Output, signal } from '@angular/core';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { VisualKeyContractService } from '../../../services/visual-key-contract.service';
import { prepareWriteContract, SwitchChainNotSupportedError, switchNetwork, writeContract } from '@wagmi/core';
import { VisualKeyApiService, VkApiError, VkApiErrorCode } from '../../../services/visual-key-api.service';
import { firstValueFrom, from, of, timeout } from 'rxjs';
import { AddrHistoryService } from '../../../services/addr-history.service';
import { MessageService, SelectItemGroup } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { ChainRegion, ChainsConfigService } from '../../../config/chains-config.service';
import { SelectItem } from 'primeng/api/selectitem';
import { WalletService } from '../../../services/wallet.service';
import { ContractFunctionExecutionError, formatEther, Hex, SwitchChainError, TransactionExecutionError } from 'viem';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, retry, switchMap, tap, throttleTime } from 'rxjs/operators';
import { faAddressCard } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-nft-modal',
  templateUrl: './nft-dialog.component.html',
  styleUrls: ['./nft-dialog.component.scss'],
})
export class NftDialogComponent implements OnInit {
  token: bigint;
  @Output() visibleChange = new EventEmitter<boolean>();

  readonly pkSize = 256;
  readonly pkCols = 16;

  readonly regionChain: SelectItemGroup[];

  readonly icons = {
    faAddressCard,
  };

  readonly bitSizePx = signal(0);

  readonly tokenWidthPx = computed(() => {
    return this.bitSizePx() * this.pkCols;
  });

  readonly account = computed(() => this.walletService.account()!);

  readonly selectedChainId = signal<number | undefined>(undefined);

  readonly selectedRegion = computed(() => {
    const selectedChainId = this.selectedChainId();

    if (selectedChainId === undefined) {
      return undefined;
    } else {
      return this.chainsConfigService.getChain(selectedChainId)?.region;
    }
  });

  readonly selectedCurrency = computed(() => {
    const selectedChainId = this.selectedChainId();

    if (selectedChainId === undefined) {
      return undefined;
    } else {
      return this.chainsConfigService.getChain(selectedChainId)?.currency;
    }
  });

  readonly priceLoading = signal(false);
  readonly ownerLoading = signal(false);
  readonly minting = signal<boolean>(false);
  readonly walletOpening = signal<boolean>(false);

  readonly price = toSignal(
    toObservable(
      computed(() => {
        return {
          chainId: this.selectedChainId(),
          receiver: this.account().address,
          time: this.refreshPrice(),
        };
      }),
    ).pipe(
      distinctUntilChanged((a, b) => {
        return a.chainId === b.chainId && a.receiver === b.receiver && a.time === b.time;
      }),
      filter(it => it.chainId !== undefined && it.receiver !== undefined),
      throttleTime(1300, undefined, { leading: true, trailing: true }),
      tap(() => this.priceLoading.set(true)),
      switchMap(it => {
        return this.visualKeyApiService.getPrice({
          chainId: it.chainId!,
          receiver: it.receiver!,
          token: this.token,
        });
      }),
      retry({ delay: 2000 }),
      tap(() => this.priceLoading.set(false)),
    ),
  );

  readonly priceEther = computed(() => {
    if (this.price() === undefined) {
      return undefined;
    } else {
      return formatEther(this.price()!.price);
    }
  });

  readonly displayPrice = computed(() => {
    return this.priceEther() !== undefined && !this.priceLoading();
  });

  readonly refreshPrice = signal(0);
  readonly refreshOwner = signal(0);

  readonly owner = toSignal(
    toObservable(
      computed(() => {
        return {
          region: this.selectedRegion(),
          time: this.refreshOwner(),
        };
      }),
    ).pipe(
      throttleTime(1000, undefined, { leading: true, trailing: true }),
      tap(() => this.ownerLoading.set(true)),
      switchMap(it => {
        if (it.region !== undefined) {
          return this.visualKeyContractService.ownerOf(this.token, it.region);
        } else {
          return of(undefined);
        }
      }),
      retry({ delay: 2000 }),
      tap(() => this.ownerLoading.set(false)),
    ),
  );

  readonly ownerChainName = computed(() => {
    const owner = this.owner();

    if (owner === undefined) {
      return undefined;
    } else {
      return this.chainsConfigService.getChain(owner.chainId)?.name;
    }
  });

  constructor(
    private walletService: WalletService,
    private gaService: GoogleAnalyticsService,
    private chainsConfigService: ChainsConfigService,
    private visualKeyApiService: VisualKeyApiService,
    private visualKeyContractService: VisualKeyContractService,
    private messageService: MessageService,
    addrHistoryService: AddrHistoryService,
  ) {
    //#region Token initialization
    const latestKey = addrHistoryService.latest();

    if (latestKey) {
      this.token = latestKey.privateKey;
    } else {
      throw new Error('Token must exist before NFT modal is opened');
    }
    //#endregion

    //#region Region chain initialization
    function getRegionChainItems(region: ChainRegion): SelectItem[] {
      return chainsConfigService.nfts
        .filter(nft => nft.chain.region == region)
        .map(nft => ({ label: nft.chain.name, value: nft.chain.chainId }));
    }

    const prodItems = getRegionChainItems(ChainRegion.Prod);
    const testItems = getRegionChainItems(ChainRegion.Test);

    this.regionChain = [];

    if (prodItems.length > 0) {
      this.regionChain.push({
        label: 'Mainnet',
        value: ChainRegion.Prod,
        items: prodItems,
      });
    }

    if (testItems.length > 0) {
      this.regionChain.push({
        label: 'Testnet',
        value: ChainRegion.Test,
        items: testItems,
      });
    }

    if (!environment.production) {
      const localItems = getRegionChainItems(ChainRegion.Local);

      if (localItems.length > 0) {
        this.regionChain.push({
          label: 'Localnet',
          value: ChainRegion.Local,
          items: localItems,
        });
      }
    }
    //#endregion

    //#region Set the default selected chain
    const chainIdSessionKey = 'VisualKeyNftSelectedChainId';

    effect(() => {
      const selectedChainId = this.selectedChainId();

      if (selectedChainId === undefined) {
        sessionStorage.removeItem(chainIdSessionKey);
      } else {
        sessionStorage.setItem(chainIdSessionKey, selectedChainId.toString());
      }
    });

    const selectedChainId = sessionStorage.getItem(chainIdSessionKey);

    if (selectedChainId == null) {
      if (this.regionChain.length > 0 && this.regionChain[0].items.length > 0) {
        this.selectedChainId.set(this.regionChain[0].items[0].value);
      }
    } else {
      const chainId = parseInt(selectedChainId, 10);

      if (!isNaN(chainId)) {
        this.selectedChainId.set(chainId);
      }
    }
    //#endregion

    //#region Refresh the token price when it expires
    effect(onCleanup => {
      const price = this.price();

      if (price === undefined) {
        return;
      }

      const expireTime = price.expirationTime * 1000;
      const now = Date.now();

      let timeLeft = expireTime - now;

      if (timeLeft <= 0) {
        this.triggerPriceRefresh();
        return;
      }

      timeLeft = timeLeft - 3 * 60 * 1000;

      if (timeLeft <= 0) {
        this.triggerPriceRefresh();
        return;
      }

      const timer = setTimeout(() => {
        this.triggerPriceRefresh();
      }, timeLeft);

      onCleanup(() => {
        clearTimeout(timer);
      });
    });
    //#endregion
  }

  private _visible = false;

  get visible(): boolean {
    return this._visible;
  }

  @Input()
  set visible(visible: boolean) {
    if (this._visible != visible) {
      this._visible = visible;
      this.visibleChange.emit(visible);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.recalculateBitSize();
  }

  ngOnInit(): void {
    this.recalculateBitSize();
  }

  async mint() {
    this.messageService.clear();

    if (this.minting()) {
      return;
    } else {
      this.minting.set(true);
    }

    try {
      const account = this.account();

      if (!account.isConnected) {
        await this.openWallet();
        return;
      }

      const selectedChainId = this.selectedChainId()!;
      const selectedToken = this.token;
      const selectedReceiver = account.address!;
      const selectedContract = this.chainsConfigService.getNftContract(selectedChainId)!;
      const price = this.price()!;

      const mintingAuthorization = await firstValueFrom(
        this.visualKeyApiService.getMintingAuthorization({
          chainId: selectedChainId,
          token: selectedToken,
          receiver: selectedReceiver,
          contract: selectedContract,
          price: price.price,
          priceExpirationTime: price.expirationTime,
          priceSignature: price.signature,
        }),
      );

      const walletChainId = this.walletService.network()?.chain?.id;

      if (walletChainId !== selectedChainId) {
        await switchNetwork({ chainId: selectedChainId });
      }

      const mintPrep = await prepareWriteContract({
        chainId: selectedChainId,
        address: selectedContract as Hex,
        functionName: 'mint',
        value: price.price,
        abi: this.visualKeyContractService.abi,
        args: [
          selectedToken,
          price.price,
          selectedReceiver,
          mintingAuthorization.deadline,
          mintingAuthorization.signature,
        ],
      });

      const { hash } = await writeContract(mintPrep.request);

      this.messageService.add({
        severity: 'success',
        detail: `Congratulations! Your transaction has been successfully submitted to the blockchain with the following transaction hash: ${hash}. Please be patient and wait for the transaction to be confirmed. Once confirmed, you will soon find your NFT safely nestled in your wallet.`,
        closable: true,
        sticky: true,
      });

      const tranReceipt = await this.visualKeyContractService.transactionReceipt(
        selectedChainId,
        selectedContract,
        hash,
      );

      if (tranReceipt.status == 'success') {
        this.triggerOwnerRefresh();
        this.gaService.event('nft_minted');

        this.messageService.add({
          severity: 'success',
          detail: `Great news! Your transaction has been confirmed, and your NFT is now safely stored in your wallet. You can go ahead and check your wallet to admire your new acquisition. Thank you for using VisualKey, and happy collecting!`,
          closable: true,
          sticky: true,
        });
      } else {
        this.messageService.add({
          severity: 'error',
          detail: `Unfortunately, the transaction you submitted to the blockchain was unsuccessful. Please double-check the details and try again.`,
          closable: true,
          sticky: true,
        });
      }
    } catch (e) {
      if (e instanceof VkApiError) {
        switch (e.code) {
          case VkApiErrorCode.InvalidSignature:
            this.messageService.add({
              severity: 'error',
              detail: `Price signature is invalid. Please clear the cache and reload the page.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.PriceExpired:
            this.messageService.add({
              severity: 'error',
              detail: `The price has expired. Please reload the page.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.SignerNotFound:
            this.messageService.add({
              severity: 'error',
              detail:
                `Minting authorization cannot be granted ` +
                `for the chain ${e.params!['chainId']} ` +
                `and contract ${e.params!['contractAddress']}. ` +
                `Please clear the cache and reload the page.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.ChainNotSupported:
            this.messageService.add({
              severity: 'error',
              detail: `The chain ${e.params!['chainId']} is not supported. Please clear the cache and reload the page.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.TokenAlreadyMinted:
            this.messageService.add({
              severity: 'error',
              detail: `The token ${e.params!['token']} has already been minted by another user.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.PendingMinting:
            const expireTime = new Date(e.params!['mintDeadline'] * 1000).toLocaleString();

            this.messageService.add({
              severity: 'error',
              detail:
                `The user ${e.params!['receiver']} has initialized the ` +
                `token minting process for the token ${e.params!['token']} ` +
                `in the chain ${e.params!['chainId']}. ` +
                `Token minting on a different chain is prohibited until ${expireTime}.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.TokenLocked:
            this.messageService.add({
              severity: 'error',
              detail:
                `The token ${e.params!['token']} can't be minted because it belongs to ${e.params!['lockedBy']} ` +
                `in the ${e.params!['region']} region and chain ${e.params!['chainId']}. ` +
                `The owner has initiated the migration process to a different blockchain.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.BadRequest:
            this.messageService.add({
              severity: 'error',
              detail: `Incorrect request. Please clear the browser cache and reload the page.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.TooManyRequests:
            this.messageService.add({
              severity: 'error',
              detail: `Too many requests. Please try again after ${e.params!['retryAfter']} seconds.`,
              closable: true,
              sticky: true,
            });
            break;
          case VkApiErrorCode.InternalError:
            this.messageService.add({
              severity: 'error',
              detail: `Internal error has occurred. Please try again.`,
              closable: true,
              sticky: true,
            });
            break;
          default:
            this.messageService.add({
              severity: 'error',
              detail: `Unknown error has occurred: ${e.code}`,
              closable: true,
              sticky: true,
            });

            console.error(e);
        }
      } else if (e instanceof ContractFunctionExecutionError) {
        this.messageService.add({
          severity: 'error',
          detail: e.details,
          closable: true,
          sticky: true,
        });
      } else if (e instanceof SwitchChainNotSupportedError || e instanceof SwitchChainError) {
        this.messageService.add({
          severity: 'error',
          detail: 'Unable to switch network. Please try it on your wallet.',
          closable: true,
          sticky: true,
        });
      } else if (e instanceof TransactionExecutionError) {
        this.messageService.add({
          severity: 'error',
          detail: e.details,
          closable: true,
          sticky: true,
        });
      } else if (e instanceof Error) {
        this.messageService.add({
          severity: 'error',
          detail: e.message,
          closable: true,
          sticky: true,
        });

        console.error(e);
      } else {
        this.messageService.add({
          severity: 'error',
          detail: 'Error has occurred.',
          closable: true,
          sticky: true,
        });

        console.error(e);
      }
    } finally {
      this.minting.set(false);
    }
  }

  async openWallet() {
    if (this.walletOpening()) {
      return;
    } else {
      this.walletOpening.set(true);
    }

    try {
      await firstValueFrom(from(this.walletService.web3Modal.openModal()).pipe(timeout(4000)));
      this.gaService.event('nft_wallet_opened');
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        detail: 'Unable to open the wallet. Please refresh the page and try again.',
        closable: true,
        life: 10000,
      });
    } finally {
      this.walletOpening.set(false);
    }
  }

  private recalculateBitSize() {
    let bitSize = Math.floor((window.innerHeight / this.pkCols) * 0.45);

    if (bitSize * (this.pkCols + 4) > window.innerWidth) {
      bitSize = Math.floor((window.innerWidth / this.pkCols) * 0.85);
    }

    this.bitSizePx.set(bitSize);
  }

  private triggerPriceRefresh() {
    this.refreshPrice.update(it => it + 1);
  }

  private triggerOwnerRefresh() {
    this.refreshOwner.update(it => it + 1);
  }
}
