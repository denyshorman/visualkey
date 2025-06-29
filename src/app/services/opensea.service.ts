import { Injectable } from '@angular/core';
import { base, sepolia } from 'viem/chains';

@Injectable({
  providedIn: 'root',
})
export class OpenseaService {
  getVisualKeysCollectionUrl(chainId: number) {
    if (chainId === base.id) {
      return 'https://opensea.io/collection/visualkeys-base-v1';
    } else if (chainId === sepolia.id) {
      return 'https://testnets.opensea.io/collection/visualkeys-sepolia-v1';
    } else {
      return undefined;
    }
  }
}
