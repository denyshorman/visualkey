import { computed, DestroyRef, effect, Injectable, resource, ResourceRef, signal } from '@angular/core';
import { AppKitNetwork, base, Chain, hardhat, sepolia } from '@reown/appkit/networks';
import { environment } from '../../environments/environment';
import {
  Config,
  fallback,
  getAccount,
  type GetAccountReturnType,
  getBalance,
  getChainId,
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
  getContractAddress as getVkeyTokenContractAddress,
  getContractAddressOrThrow as getVkeyTokenContractAddressOrThrow,
} from './token-contract.service';
import { formatEther, Hex } from 'viem';
import { ChainsService } from './chains.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  readonly wagmiConfig: Config;

  readonly chainId = signal<number>(0);
  readonly accountAddress = signal<Hex | undefined>(undefined);
  readonly accountStatus = signal<'disconnected' | 'connecting' | 'reconnecting' | 'connected'>('disconnected');
  readonly walletInitialized = signal(false);
  readonly walletOpen = signal(false);
  readonly walletLoading = signal(false);

  readonly chainName = computed(() => {
    const chainId = this.chainId();

    const networkName = this.appKit.getCaipNetwork('eip155', chainId)?.name;

    if (networkName === undefined) {
      throw new Error(`Network name not found for chain ID ${chainId}`);
    }

    return networkName;
  });

  readonly ethAmount: ResourceRef<bigint | undefined> = resource({
    params: () => ({ chainId: this.chainId(), account: this.accountAddress() }),
    loader: async ({ params }) => {
      if (params.account === undefined) {
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
      if (params.account === undefined) {
        return undefined;
      } else {
        const tokenAddress = getVkeyTokenContractAddress(params.chainId);

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

  private readonly appKit: AppKit;

  constructor(
    private chainsService: ChainsService,
    themeService: ThemeService,
    destroyRef: DestroyRef,
  ) {
    const chains: Chain[] = [base, sepolia];

    if (!environment.production) {
      chains.push(hardhat);
    }

    const projectId = environment.reownProjectId;

    const wagmiAdapter = new WagmiAdapter({
      projectId,
      networks: chains,
      transports: Object.fromEntries(chains.map(chain => [chain.id, this.getTransport(chain.id)])),
    });

    this.wagmiConfig = wagmiAdapter.wagmiConfig;

    this.appKit = createAppKit({
      adapters: [wagmiAdapter],
      networks: chains as [AppKitNetwork, ...AppKitNetwork[]],
      projectId,
      features: {
        analytics: environment.production,
      },
      defaultNetwork: chains[0],
      defaultAccountTypes: { eip155: 'eoa' },
      tokens: Object.fromEntries(
        chains.map(chain => [
          `eip155:${chain.id}`,
          {
            address: getVkeyTokenContractAddressOrThrow(chain.id),
            image: `/assets/token/32x32.svg`,
          },
        ]),
      ),
      themeMode: 'dark',
      themeVariables: {
        '--w3m-font-family': 'var(--default-font-family)',
        '--w3m-border-radius-master': '0',
        '--w3m-accent': '#c5c5c5',
        '--w3m-font-size-master': '0.66rem',
        '--w3m-z-index': 3301,
      },
      privacyPolicyUrl: '/privacy-policy',
      termsConditionsUrl: '/terms-of-service',
      allowUnsupportedChain: false,
    });

    this.processChainId(this.appKit.getChainId());
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

    const unwatchNetwork = this.appKit.subscribeNetwork(network => {
      this.processChainId(network.chainId);
    });

    destroyRef.onDestroy(() => {
      unwatchAccount();
      unwatchNetwork();
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

  viewNetworks() {
    return this.appKit.open({ view: 'Networks', namespace: 'eip155' });
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
    this.accountAddress.set(account.address);
    this.accountStatus.set(account.status);
  }

  private processChainId(chainId: number | string | undefined) {
    if (chainId === undefined || typeof chainId === 'string') {
      this.chainId.set(getChainId(this.wagmiConfig));
    } else {
      this.chainId.set(chainId);
    }
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
