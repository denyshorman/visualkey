import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { EthChainConfigService } from '../config/eth-chain-config.service';
import { environment } from '../../environments/environment';
import { rotateLeft } from '../utils/ArrayUtils';
import { BehaviorSubject, firstValueFrom, merge, Observable, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NetworkStatusService } from './network-status.service';

@Injectable({
  providedIn: 'root',
})
export class EthNodeClientService {
  private static SleepTimeInitMs = 1000;
  private static MaxSleepTimeMs = 64000;

  private providers = new Map<number, any[]>();

  constructor(private ethChainConfig: EthChainConfigService, private networkStatusService: NetworkStatusService) {
    ethChainConfig.config.chains.forEach(chain => {
      const providers = chain.rpcUrls.map(url => {
        return new ethers.providers.StaticJsonRpcProvider(url, chain.chainId);
      });

      this.providers.set(chain.chainId, providers);
    });
  }

  private static async sleep(timeMs: number, canceled: BehaviorSubject<boolean>): Promise<void> {
    const sleep$ = timer(timeMs);
    const canceled$ = canceled.pipe(filter(it => it));
    await firstValueFrom(merge(sleep$, canceled$));
  }

  getTxCount(chainId: number, address: string): Observable<number> {
    return this.retryOnErrorObservable(chainId, async provider => {
      return await provider.getTransactionCount(address);
    });
  }

  getBalance(chainId: number, address: string): Observable<bigint> {
    return this.retryOnErrorObservable(chainId, async provider => {
      const balance = await provider.getBalance(address);
      return balance.toBigInt();
    });
  }

  private getProvider(chainId: number): ethers.providers.Provider[] {
    const providers = this.providers.get(chainId);
    if (providers == undefined || providers.length == 0) {
      throw Error(`Provider for the chainId ${chainId} is not defined`);
    }
    return providers;
  }

  private retryOnErrorObservable<T>(
    chainId: number,
    func: (provider: ethers.providers.Provider) => Promise<T>,
  ): Observable<T> {
    return new Observable<T>(subscriber => {
      const canceled = new BehaviorSubject(false);

      function unsubscribe() {
        canceled.next(true);
        subscriber.remove(unsubscribe);
      }

      subscriber.add(unsubscribe);

      this.retryOnErrorPromise(chainId, canceled, provider => {
        return func(provider);
      }).then(
        value => {
          subscriber.next(value);
          subscriber.complete();
        },
        reason => {
          if (reason != 0) {
            subscriber.error(reason);
          }
        },
      );
    });
  }

  private async retryOnErrorPromise<T>(
    chainId: number,
    canceled: BehaviorSubject<boolean>,
    func: (provider: ethers.providers.Provider) => Promise<T>,
  ): Promise<T> {
    const providers = this.getProvider(chainId);
    let sleepTimeMs = EthNodeClientService.SleepTimeInitMs;

    mainLoop: while (!canceled.value) {
      if (!this.networkStatusService.status) {
        await this.awaitNetwork(canceled);
        sleepTimeMs = EthNodeClientService.SleepTimeInitMs;
        continue;
      }

      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];

        try {
          if (!this.networkStatusService.status) {
            continue mainLoop;
          }

          const res = await func(provider);

          if (i > 0 && provider === providers[i]) {
            rotateLeft(providers, i);
          }

          return res;
        } catch (e) {
          if (!environment.production) {
            console.warn(`Can't call RPC method for chainId ${chainId}`, e);
          }

          if (provider !== providers[i]) {
            break;
          }
        }
      }

      await EthNodeClientService.sleep(sleepTimeMs, canceled);

      sleepTimeMs = Math.min(sleepTimeMs * 2, EthNodeClientService.MaxSleepTimeMs);
    }

    return Promise.reject(0);
  }

  private async awaitNetwork(canceled: BehaviorSubject<boolean>): Promise<void> {
    const online$ = this.networkStatusService.status$.pipe(filter(it => it));
    const canceled$ = canceled.pipe(filter(it => it));
    await firstValueFrom(merge(online$, canceled$));
  }
}
