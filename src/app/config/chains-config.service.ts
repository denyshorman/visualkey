import { Injectable } from '@angular/core';

import chains from './chains.json';
import nfts from './nfts.json';

@Injectable({
  providedIn: 'root',
})
export class ChainsConfigService {
  readonly chains: Chain[];
  readonly nfts: Nft[];

  private chainIdChainMap: Map<number, Chain>;

  constructor() {
    this.chains = chains.map(chain => {
      return {
        chainId: chain.chainId,
        region: chain.region as ChainRegion,
        name: chain.name,
        currency: chain.currency,
        blockExplorerUrl: chain.blockExplorerUrl,
        rpcUrls: chain.rpcUrls,
      } as Chain;
    });

    this.nfts = nfts.map(nft => {
      const chain = this.chains.find(chain => chain.chainId == nft.chainId);

      if (chain == undefined) {
        throw Error(`Chain ${nft.chainId} is not defined`);
      }

      return {
        chain,
        contracts: nft.contracts,
      } as Nft;
    });

    this.chainIdChainMap = new Map<number, Chain>();

    this.chains.forEach(chain => {
      this.chainIdChainMap.set(chain.chainId, chain);
    });
  }

  getChain(id: number): Chain | undefined {
    return this.chainIdChainMap.get(id);
  }

  getNftContract(chainId: number): string | undefined {
    const nft = this.nfts.find(nft => nft.chain.chainId == chainId);

    if (nft == undefined) {
      return undefined;
    }

    return nft.contracts[nft.contracts.length - 1];
  }
}

//#region Models
export interface Chain {
  chainId: number;
  region: ChainRegion;
  name: string;
  currency: string;
  blockExplorerUrl: string;
  rpcUrls: string[];
}

export interface Nft {
  chain: Chain;
  contracts: string[];
}

export enum ChainRegion {
  Prod = 'mainnet',
  Test = 'testnet',
  Local = 'localnet',
}
//#endregion
