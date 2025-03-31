import { Injectable, signal } from '@angular/core';
import { Chain, polygon, bsc, sepolia, bscTestnet, hardhat } from '@reown/appkit/networks';
import { environment } from '../../environments/environment';
import { Config } from '@wagmi/core';
import { AppKit, createAppKit, UseAppKitAccountReturn } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  readonly supportedChains: Chain[];
  readonly wagmiConfig: Config;
  readonly appKit: AppKit;

  readonly account = signal<UseAppKitAccountReturn | undefined>(undefined);

  constructor() {
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
      networks: chains as any,
      projectId,
      features: {
        analytics: true,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-z-index': 3301,
      },
    });

    this.account.set(this.appKit.getAccount());

    this.appKit.subscribeAccount(account => {
      this.account.set(account);
    });
  }
}
