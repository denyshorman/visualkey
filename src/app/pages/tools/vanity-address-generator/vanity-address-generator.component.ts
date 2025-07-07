import { Component, DestroyRef, effect, signal, viewChild } from '@angular/core';
import { Button } from 'primeng/button';
import { bytesToHex, hexToBigInt } from 'viem';
import { ETH_ADDR_BIT_COUNT } from '../../../utils/eth-utils';
import { EthAccount } from '../../../models/eth-account';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { Message } from 'primeng/message';
import { PrefixSuffixComponent } from './components/prefix-suffix.component';
import { AddressFoundComponent } from './components/address-found.component';
import { AdvancedComponent } from './components/advanced.component';
import { InfoComponent } from './components/info.component';
import { isWasmSupported } from '../../../utils/wasm-utils';

@Component({
  selector: 'app-vanity-address-generator',
  standalone: true,
  imports: [
    Button,
    FaIconComponent,
    Message,
    PrefixSuffixComponent,
    AddressFoundComponent,
    AdvancedComponent,
    PrefixSuffixComponent,
    InfoComponent,
  ],
  host: {
    class: 'flex flex-col grow',
  },
  template: `
    @if (wasmSupported) {
      <div class="grow md:flex md:flex-col md:items-center md:justify-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-center mt-3 sm:mt-6">Vanity Address Generator</h2>

        <div class="md:w-3xl flex flex-col gap-3 m-2 sm:m-4">
          <app-vanity-address-generator-prefix-suffix
            [disabled]="isRunning()"
          />

          <app-vanity-address-generator-advanced
            [valueMask]="valueMask()"
            [careMask]="careMask()"
            (valueMaskChange)="valueMaskChanged($event)"
            (careMaskChange)="careMaskChanged($event)"
            [readOnly]="isRunning()"
          />

          <app-vanity-address-generator-info
            [careMask]="careMask()"
            [hashRate]="hashRate()"
            [checkedCount]="checkedCount()"
            [elapsedTimeSec]="elapsedTimeSec()"
          />

          <p-button
            (click)="toggle()"
            severity="secondary"
            styleClass="select-none w-full"
            [outlined]="true"
            size="small"
            [disabled]="!prefixSuffix()?.prefixValid() || !prefixSuffix()?.suffixValid()"
          >
            <fa-icon [icon]="isRunning() ? icons.faStop : icons.faPlay" [class.text-red-500]="isRunning()"></fa-icon>

            @if (isRunning()) {
              Stop
            } @else {
              Start
            }
          </p-button>

          @if (foundKey()) {
            <app-vanity-address-generator-address-found
              [privateKey]="foundKey()!.privateKeyHex"
              [address]="foundKey()!.address"
            />
          }
        </div>
      </div>
    } @else {
      <div class="grow flex items-center justify-center p-4">
        <p-message severity="error" class="max-w-2xl">
          WebAssembly is not supported or enabled in your browser. Please enable WebAssembly or use a different browser
          to run the Vanity Ethereum Address Generator.
        </p-message>
      </div>
    }
  `,
})
export class VanityAddressGeneratorComponent {
  readonly icons = {
    faPlay,
    faStop,
  };

  readonly wasmSupported = isWasmSupported();

  readonly isRunning = signal(false);
  readonly hashRate = signal(0);
  readonly checkedCount = signal(0);
  readonly elapsedTimeSec = signal(0n);
  readonly foundKey = signal<EthAccount | null>(null);

  readonly prefixSuffix = viewChild(PrefixSuffixComponent);

  readonly valueMask = signal(0n);
  readonly careMask = signal(0n);

  private workers: Worker[] = [];
  private hashingStartTime = 0;
  private lastCalcTime = 0;
  private lastHashCount = 0;
  private statsJobId = 0;
  private advancedTouched = false;
  private readonly hashesPerBatch = 1000;

  constructor(destroyRef: DestroyRef) {
    effect(() => {
      const prefSufComp = this.prefixSuffix();
      const prefix = prefSufComp?.prefix() ?? '';
      const suffix = prefSufComp?.suffix() ?? '';

      if (this.advancedTouched) {
        this.advancedTouched = false;

        if (prefix.length === 0 && suffix.length === 0) {
          return;
        }
      }

      if (prefSufComp === undefined) {
        return;
      }

      let valueMask = 0n;
      let careMask = 0n;

      const p = prefix.trim().startsWith('0x') ? prefix.substring(2) : prefix;
      const s = suffix.trim();

      if (p.length > 0 && prefSufComp.prefixValid()) {
        const prefixBigInt = hexToBigInt(`0x${p}`);
        const prefixMask = (1n << BigInt(p.length * 4)) - 1n;
        valueMask |= prefixBigInt << BigInt(ETH_ADDR_BIT_COUNT - p.length * 4);
        careMask |= prefixMask << BigInt(ETH_ADDR_BIT_COUNT - p.length * 4);
      }

      if (s.length > 0 && prefSufComp.suffixValid()) {
        const suffixBigInt = hexToBigInt(`0x${s}`);
        const suffixMask = (1n << BigInt(s.length * 4)) - 1n;
        valueMask |= suffixBigInt;
        careMask |= suffixMask;
      }

      this.valueMask.set(valueMask);
      this.careMask.set(careMask);
    });

    destroyRef.onDestroy(() => {
      this.stop();
    });
  }

  toggle() {
    if (this.isRunning()) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.isRunning.set(true);
    this.foundKey.set(null);
    this.checkedCount.set(0);
    this.elapsedTimeSec.set(0n);
    this.lastHashCount = 0;
    this.hashingStartTime = Date.now();
    this.lastCalcTime = this.hashingStartTime;

    const workerCount = navigator.hardwareConcurrency ?? 1;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(new URL('./vanity.worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = ({ data }) => {
        if (!this.isRunning()) {
          return;
        }

        if (data.foundKey) {
          this.foundKey.set(new EthAccount(BigInt(bytesToHex(data.foundKey.privateKey))));
          this.stop();
        } else {
          this.checkedCount.update(c => c + this.hashesPerBatch);
        }
      };

      this.workers.push(worker);
    }

    this.statsJobId = window.setInterval(() => {
      const now = Date.now();
      const currHashCount = this.checkedCount();
      const hashDiff = currHashCount - this.lastHashCount;
      const timeDiff = now - this.lastCalcTime;
      const hashRate = timeDiff > 0 ? (hashDiff / timeDiff) * 1000 : 0;

      this.hashRate.set(hashRate);
      this.elapsedTimeSec.set(BigInt(Math.floor((now - this.hashingStartTime) / 1000)));

      this.lastCalcTime = now;
      this.lastHashCount = currHashCount;
    }, 1000);

    const message = {
      valueMask: this.valueMask(),
      careMask: this.careMask(),
      batchSize: this.hashesPerBatch,
    };

    for (const worker of this.workers) {
      worker.postMessage(message);
    }
  }

  stop() {
    if (!this.isRunning()) {
      return;
    }

    window.clearInterval(this.statsJobId);

    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];
    this.isRunning.set(false);
  }

  valueMaskChanged(mask: bigint) {
    this.advancedTouched = true;
    this.prefixSuffix()?.prefix.set('');
    this.prefixSuffix()?.suffix.set('');
    this.valueMask.set(mask);
  }

  careMaskChanged(mask: bigint) {
    this.advancedTouched = true;
    this.prefixSuffix()?.prefix.set('');
    this.prefixSuffix()?.suffix.set('');
    this.careMask.set(mask);
  }
}
