import { Injectable, OnDestroy, signal } from '@angular/core';
import { polygon, bsc, sepolia, polygonMumbai, hardhat } from '@wagmi/chains';
import { environment } from '../../environments/environment';
import {
  configureChains,
  createConfig,
  getAccount,
  GetAccountResult,
  getNetwork,
  GetNetworkResult,
  watchAccount,
  watchNetwork,
} from '@wagmi/core';
import { Chain, EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal, Web3ModalConfig } from '@web3modal/html';

@Injectable({
  providedIn: 'root',
})
export class WalletService implements OnDestroy {
  readonly web3Modal: Web3Modal;

  readonly account = signal<GetAccountResult | undefined>(undefined);
  readonly network = signal<GetNetworkResult | undefined>(undefined);

  constructor() {
    const chains: Chain[] = [polygon, bsc, sepolia, polygonMumbai];

    if (!environment.production) {
      chains.push(hardhat);
    }

    const projectId = environment.walletConnectProjectId;

    const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

    const wagmiConfig = createConfig({
      autoConnect: true,
      connectors: w3mConnectors({ projectId, version: 1, chains }),
      publicClient,
    });

    const web3ModelConfig: Web3ModalConfig = {
      projectId,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-z-index': '2500',
        '--w3m-accent-color': '#9f9f9f',
        '--w3m-background-color': '#141414',
        '--w3m-background-border-radius': '0',
        '--w3m-container-border-radius': '0',
      },
    };

    const ethereumClient = new EthereumClient(wagmiConfig, chains);

    this.web3Modal = new Web3Modal(web3ModelConfig, ethereumClient);

    this.account.set(getAccount());
    this.network.set(getNetwork());

    this.accountUnwatch = watchAccount(account => {
      this.account.set(account);
    });

    this.networkUnwatch = watchNetwork(network => {
      this.network.set(network);
    });
  }

  ngOnDestroy(): void {
    this.accountUnwatch();
    this.networkUnwatch();
  }

  private readonly accountUnwatch = () => {};

  private readonly networkUnwatch = () => {};
}
