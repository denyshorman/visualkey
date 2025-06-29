import { BehaviorSubject, firstValueFrom, merge, timer } from 'rxjs';
import { filter } from 'rxjs/operators';

export async function sleep(timeMs: number, canceled: BehaviorSubject<boolean>): Promise<void> {
  const sleep$ = timer(timeMs);
  const canceled$ = canceled.pipe(filter(it => it));
  await firstValueFrom(merge(sleep$, canceled$));
}

export async function sleepFor(timeMs: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, timeMs));
}
