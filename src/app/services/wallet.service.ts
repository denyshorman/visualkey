import { effect, Injectable, signal } from '@angular/core';
import { AppKitNetwork, bsc, bscTestnet, Chain, hardhat, polygon, sepolia } from '@reown/appkit/networks';
import { environment } from '../../environments/environment';
import { Config } from '@wagmi/core';
import { AppKit, createAppKit, UseAppKitAccountReturn } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  readonly supportedChains: Chain[];
  readonly wagmiConfig: Config;
  readonly appKit: AppKit;

  readonly account = signal<UseAppKitAccountReturn | undefined>(undefined);

  constructor(themeService: ThemeService) {
    const chains: Chain[] = [polygon, bsc, sepolia, bscTestnet];

    if (!environment.production) {
      chains.push(hardhat);
    }

    this.supportedChains = chains;

    const projectId = environment.reownProjectId;

    const wagmiAdapter = new WagmiAdapter({
      projectId,
      networks: chains,
    });

    this.wagmiConfig = wagmiAdapter.wagmiConfig;

    this.appKit = createAppKit({
      adapters: [wagmiAdapter],
      networks: chains as [AppKitNetwork, ...AppKitNetwork[]],
      projectId,
      features: {
        analytics: true,
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

    this.account.set(this.appKit.getAccount());

    this.appKit.subscribeAccount(account => {
      this.account.set(account);
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
  }
}
