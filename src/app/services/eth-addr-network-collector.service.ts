import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { EthAddrHistoryService } from './eth-addr-history.service';
import { EthNodeClientService } from './eth-node-client.service';
import { concatMap, Observable, of, shareReplay, Subscription } from 'rxjs';
import { EthChainConfigService } from '../config/eth-chain-config.service';

@Injectable({
  providedIn: 'root',
})
export class EthAddrNetworkCollectorService implements OnDestroy {
  readonly pkInfo: Map<bigint, Info> = new Map<bigint, Info>();
  readonly pkInfoAdded = new EventEmitter<bigint>();
  private pkAddedSubscription = Subscription.EMPTY;

  constructor(
    private ethChainConfig: EthChainConfigService,
    private ethAddrHistoryService: EthAddrHistoryService,
    private ethNodeClientService: EthNodeClientService,
  ) {
    for (const pk of ethAddrHistoryService.history.keys()) {
      this.collectInfo(pk);
    }

    this.pkAddedSubscription = ethAddrHistoryService.pkAdded.subscribe(pk => {
      this.collectInfo(pk);
    });
  }

  ngOnDestroy(): void {
    this.pkAddedSubscription.unsubscribe();
  }

  private collectInfo(pk: bigint) {
    const address = this.ethAddrHistoryService.history.get(pk)!.address;

    const chainsInfo = this.ethChainConfig.config.chains.map(chain => {
      const txCount = this.ethNodeClientService
        .getTxCount(chain.chainId, address)
        .pipe(shareReplay({ bufferSize: 1, refCount: true, windowTime: 1000 }));

      const balance = txCount.pipe(
        concatMap(txCount => {
          if (txCount == 0) {
            return of(BigInt(0));
          } else {
            return this.ethNodeClientService.getBalance(chain.chainId, address);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: true, windowTime: 1000 }),
      );

      const chainInfo: ChainInfo = {
        chainId: chain.chainId,
        txCount,
        balance,
      };

      return chainInfo;
    });

    const info: Info = {
      chainsInfo: chainsInfo,
    };

    this.pkInfo.set(pk, info);
    this.pkInfoAdded.emit(pk);
  }
}

export interface Info {
  chainsInfo: ChainInfo[];
}

export interface ChainInfo {
  chainId: number;
  txCount: Observable<number>;
  balance: Observable<bigint>;
}
