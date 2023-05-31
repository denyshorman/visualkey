import { Injectable } from '@angular/core';
import { ChainsConfigService } from '../config/chains-config.service';
import { environment } from '../../environments/environment';
import { rotateLeft } from '../utils/ArrayUtils';
import { BehaviorSubject, defer, firstValueFrom, merge, Observable, raceWith, throwError, timeout } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { NetworkStatusService } from './network-status.service';
import { sleep } from '../utils/AsyncUtils';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TxBalanceService {
  private static SleepTimeInitMs = 1000;
  private static MaxSleepTimeMs = 64000;
  private reqCounter = 0;

  constructor(
    private chainConfigService: ChainsConfigService,
    private networkStatusService: NetworkStatusService,
    private httpClient: HttpClient,
  ) {}

  //#region Public API
  getTxCount(chainId: number, address: string): Observable<number> {
    return this.retryOnErrorObservable(chainId, url => {
      const request = {
        id: this.reqCounter++,
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
      };

      return firstValueFrom(this.httpClient.post<any>(url, request).pipe(map(resp => Number(resp.result))));
    });
  }

  getBalance(chainId: number, address: string): Observable<bigint> {
    return this.retryOnErrorObservable(chainId, url => {
      const request = {
        id: this.reqCounter++,
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
      };

      return firstValueFrom(this.httpClient.post<any>(url, request).pipe(map(resp => BigInt(resp.result))));
    });
  }
  //#endregion

  //#region Private Section
  private retryOnErrorObservable<T>(chainId: number, func: (url: string) => Promise<T>): Observable<T> {
    return new Observable<T>(subscriber => {
      const canceled = new BehaviorSubject(false);

      function unsubscribe() {
        canceled.next(true);
        subscriber.remove(unsubscribe);
      }

      subscriber.add(unsubscribe);

      this.retryOnErrorPromise(chainId, canceled, url => {
        return func(url);
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
    func: (url: string) => Promise<T>,
  ): Promise<T> {
    const urls = this.chainConfigService.getChain(chainId)?.rpcUrls;

    if (urls === undefined) {
      throw new Error(`Chain ${chainId} is not supported`);
    }

    let sleepTimeMs = TxBalanceService.SleepTimeInitMs;

    mainLoop: while (!canceled.value) {
      if (!this.networkStatusService.status) {
        await this.awaitNetwork(canceled);
        sleepTimeMs = TxBalanceService.SleepTimeInitMs;
        continue;
      }

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        try {
          if (!this.networkStatusService.status) {
            continue mainLoop;
          }

          if (canceled.value) {
            break mainLoop;
          }

          const res = await firstValueFrom(
            defer(() => func(url)).pipe(
              raceWith(
                canceled.pipe(
                  filter(Boolean),
                  switchMap(() => throwError(() => new Error('Canceled'))),
                ),
              ),
              timeout(5000),
            ),
          );

          if (i > 0 && url === urls[i]) {
            rotateLeft(urls, i);
          }

          return res;
        } catch (e) {
          if (!environment.production) {
            console.warn(`Can't call RPC method for chainId ${chainId}`, e);
          }

          if (url !== urls[i]) {
            break;
          }
        }
      }

      await sleep(sleepTimeMs, canceled);

      sleepTimeMs = Math.min(sleepTimeMs * 2, TxBalanceService.MaxSleepTimeMs);
    }

    return Promise.reject(0);
  }

  private async awaitNetwork(canceled: BehaviorSubject<boolean>): Promise<void> {
    const online$ = this.networkStatusService.status$.pipe(filter(it => it));
    const canceled$ = canceled.pipe(filter(it => it));
    await firstValueFrom(merge(online$, canceled$));
  }
  //#endregion
}
