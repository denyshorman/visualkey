import { Injectable } from '@angular/core';

import ethConfig from '../../assets/eth-config.json';

@Injectable({
  providedIn: 'root',
})
export class EthChainConfigService {
  config: Config = ethConfig;
}

export interface Config {
  chains: Chain[];
}

export interface Chain {
  name: string;
  currency: string;
  chainId: number;
  blockExplorerUrl: string;
  rpcUrls: string[];
}
