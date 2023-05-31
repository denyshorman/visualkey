import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { AddrHistoryService } from './addr-history.service';
import { TxBalanceService } from './tx-balance.service';
import { concatMap, Observable, of, shareReplay, Subscription } from 'rxjs';
import { ChainRegion, ChainsConfigService } from '../config/chains-config.service';

@Injectable({
  providedIn: 'root',
})
export class AddrNetworkCollectorService implements OnDestroy {
  readonly pkInfo: Map<bigint, Info> = new Map<bigint, Info>();
  readonly pkInfoAdded = new EventEmitter<bigint>();
  private pkAddedSubscription = Subscription.EMPTY;

  constructor(
    private chainsConfigService: ChainsConfigService,
    private addrHistoryService: AddrHistoryService,
    private txBalanceService: TxBalanceService,
  ) {
    for (const pk of addrHistoryService.history.keys()) {
      this.collectInfo(pk);
    }

    this.pkAddedSubscription = addrHistoryService.pkAdded.subscribe(pk => {
      this.collectInfo(pk);
    });
  }

  ngOnDestroy(): void {
    this.pkAddedSubscription.unsubscribe();
  }

  private collectInfo(pk: bigint) {
    const address = this.addrHistoryService.history.get(pk)!.address;

    const chainsInfo = this.chainsConfigService.chains
      .filter(chain => chain.region === ChainRegion.Prod)
      .map(chain => {
        const txCount = this.txBalanceService
          .getTxCount(chain.chainId, address)
          .pipe(shareReplay({ bufferSize: 1, refCount: true, windowTime: 1000 }));

        const balance = txCount.pipe(
          concatMap(txCount => {
            if (txCount == 0) {
              return of(BigInt(0));
            } else {
              return this.txBalanceService.getBalance(chain.chainId, address);
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
