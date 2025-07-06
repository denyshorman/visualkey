import { DestroyRef, effect, Injectable, resource, ResourceRef, signal } from '@angular/core';
import { AppKitNetwork, base, Chain, hardhat, sepolia } from '@reown/appkit/networks';
import { environment } from '../../environments/environment';
import {
  Config,
  fallback,
  getAccount,
  type GetAccountReturnType,
  getBalance,
  http,
  injected,
  reconnect,
  unstable_connector,
  waitForTransactionReceipt,
  type WaitForTransactionReceiptReturnType,
  watchAccount,
} from '@wagmi/core';
import { AppKit, createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ThemeService } from './theme.service';
import type { PublicStateControllerState } from '@reown/appkit-controllers';
import {
  BASE_VISUAL_KEY_TOKEN_ADDRESS,
  getVkeyTokenAddress,
  HARDHAT_VISUAL_KEY_TOKEN_ADDRESS,
  SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS,
} from './token-contract.service';
import { formatEther, Hex } from 'viem';
import { ChainsService } from './chains.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  readonly wagmiConfig: Config;

  readonly chainId = signal<number | undefined>(undefined);
  readonly chainName = signal<string | undefined>(undefined);
  readonly accountAddress = signal<Hex | undefined>(undefined);
  readonly accountStatus = signal<'disconnected' | 'connecting' | 'reconnecting' | 'connected'>('disconnected');
  readonly walletInitialized = signal(false);
  readonly walletOpen = signal(false);
  readonly walletLoading = signal(false);

  readonly ethAmount: ResourceRef<bigint | undefined> = resource({
    params: () => ({ chainId: this.chainId(), account: this.accountAddress() }),
    loader: async ({ params }) => {
      if (params.chainId === undefined || params.account === undefined) {
        return undefined;
      } else {
        const balance = await getBalance(this.wagmiConfig, {
          chainId: params.chainId,
          address: params.account,
          unit: 'wei',
          blockTag: 'latest',
        });

        return balance.value;
      }
    },
  });
  readonly vkeyAmount: ResourceRef<bigint | undefined> = resource({
    params: () => ({ chainId: this.chainId(), account: this.accountAddress() }),
    loader: async ({ params }) => {
      if (params.chainId === undefined || params.account === undefined) {
        return undefined;
      } else {
        const tokenAddress = getVkeyTokenAddress(params.chainId);

        if (tokenAddress === undefined) {
          console.warn('Visual Key token address is not defined for the current chain.');
          return undefined;
        }

        const balance = await getBalance(this.wagmiConfig, {
          chainId: params.chainId,
          address: params.account,
          token: tokenAddress,
          unit: 'wei',
          blockTag: 'latest',
        });

        return balance.value;
      }
    },
  });

  private readonly defaultChain: Chain;
  private readonly supportedChains: Chain[];
  private readonly appKit: AppKit;

  constructor(
    private chainsService: ChainsService,
    themeService: ThemeService,
    destroyRef: DestroyRef,
  ) {
    const chains: Chain[] = [base, sepolia];

    if (!environment.production) {
      chains.unshift(hardhat);
    }

    this.supportedChains = chains;
    this.defaultChain = environment.production ? base : hardhat;

    const projectId = environment.reownProjectId;

    const wagmiAdapter = new WagmiAdapter({
      projectId,
      networks: chains,
      transports: {
        [base.id]: this.getTransport(base.id),
        [sepolia.id]: this.getTransport(sepolia.id),
        [hardhat.id]: this.getTransport(hardhat.id),
      },
    });

    this.wagmiConfig = wagmiAdapter.wagmiConfig;

    this.appKit = createAppKit({
      adapters: [wagmiAdapter],
      networks: chains as [AppKitNetwork, ...AppKitNetwork[]],
      projectId,
      features: {
        analytics: environment.production,
      },
      defaultNetwork: this.defaultChain,
      tokens: {
        [`eip155:${base.id}`]: {
          address: BASE_VISUAL_KEY_TOKEN_ADDRESS,
          image: `${window.location.origin}/assets/token/32x32.svg`,
        },
        [`eip155:${sepolia.id}`]: {
          address: SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS,
          image: `${window.location.origin}/assets/token/32x32.svg`,
        },
        [`eip155:${hardhat.id}`]: {
          address: HARDHAT_VISUAL_KEY_TOKEN_ADDRESS,
          image: `${window.location.origin}/assets/token/32x32.svg`,
        },
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-font-family': 'var(--default-font-family)',
        '--w3m-border-radius-master': '0',
        '--w3m-accent': '#c5c5c5',
        '--w3m-font-size-master': '0.66rem',
        '--w3m-z-index': 3301,
      },
    });

    this.processAccount(getAccount(this.wagmiConfig));
    this.processWalletState(this.appKit.getState());

    const unwatchAccount = watchAccount(this.wagmiConfig, {
      onChange: account => {
        this.processAccount(account);
      },
    });

    const unwatchState = this.appKit.subscribeState(newState => {
      this.processWalletState(newState);
    });

    destroyRef.onDestroy(() => {
      unwatchAccount();
      unwatchState();
    });

    effect(() => {
      const theme = themeService.theme();
      const appKitTheme = this.appKit.getThemeMode();

      if (theme === 'dark' && appKitTheme === 'light') {
        this.appKit.setThemeMode('dark');
      } else if (theme === 'light' && appKitTheme === 'dark') {
        this.appKit.setThemeMode('light');
      }
    });

    effect(() => {
      const vkeyAmountWei = this.vkeyAmount.value();

      if (vkeyAmountWei === undefined) {
        return;
      }

      const vkeyAmount = formatEther(vkeyAmountWei);

      this.appKit.setBalance(vkeyAmount, 'VKEY', 'eip155');
    });

    effect(() => {
      if (this.walletInitialized()) {
        reconnect(this.wagmiConfig);
      }
    });
  }

  open() {
    return this.appKit.open({ view: 'Connect', namespace: 'eip155' });
  }

  close() {
    return this.appKit.close();
  }

  viewAccount() {
    return this.appKit.open({ view: 'Account' });
  }

  waitForTransactionReceipt(chainId: number, hash: Hex): Promise<WaitForTransactionReceiptReturnType> {
    return waitForTransactionReceipt(this.wagmiConfig, {
      chainId,
      hash,
      confirmations: 1,
      pollingInterval: 1000,
    });
  }

  private processWalletState(state: PublicStateControllerState) {
    this.walletInitialized.set(state.initialized);
    this.walletOpen.set(state.open);
    this.walletLoading.set(state.loading);
  }

  private processAccount(account: GetAccountReturnType) {
    const chainId = account.chainId;

    if (chainId !== undefined && this.isChainSupported(chainId)) {
      this.chainId.set(chainId);
      this.chainName.set(account?.chain?.name ?? undefined);
    } else {
      this.chainId.set(undefined);
      this.chainName.set(undefined);
    }

    this.accountAddress.set(account.address);
    this.accountStatus.set(account.status);
  }

  private isChainSupported(chainId: number): boolean {
    return this.supportedChains.some(chain => chain.id === chainId);
  }

  private getTransport(chainId: number) {
    return fallback(
      [
        ...(this.chainsService.getChain(chainId)?.rpcUrls?.map(url => http(url, { retryCount: 0 })) || []),
        unstable_connector(injected, { retryCount: 0 }),
      ],
      { retryCount: 0 },
    );
  }
}
