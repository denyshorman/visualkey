import { Component, computed, signal } from '@angular/core';
import { Message } from 'primeng/message';
import { ChainsService } from '../../services/chains.service';
import { TOKEN_CONTRACT_ERROR_MESSAGES } from '../../services/token-contract.service';
import { NFT_CONTRACT_ERROR_MESSAGES } from '../../services/nft-contract.service';
import { TOKEN_SALE_CONTRACT_ERROR_MESSAGES } from '../../services/token-sale-contract.service';
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  TransactionExecutionError,
  UserRejectedRequestError,
} from 'viem';

//TODO: Fix layout for long messages
@Component({
  selector: 'app-ether-tx-status',
  imports: [Message],
  host: {
    class: 'block',
  },
  template: `
    @switch (state()) {
      @case ('processing') {
        <div class="text-xs space-y-2 text-zinc-600 dark:text-green-400">
          <p>{{ message() }}</p>

          @if (hashUrl()) {
            <p class="truncate">
              TxHash:
              <a [href]="hashUrl()" target="_blank" rel="noopener noreferrer" class="hover:underline">
                {{ tx()?.hash ?? 'hash' }}
              </a>
            </p>
          }
        </div>
      }
      @case ('error') {
        <p-message severity="error" variant="outlined" size="small" [text]="message()" closable (onClose)="reset()" />
      }
      @case ('success') {
        <p-message severity="success" variant="outlined" size="small" [text]="message()" closable (onClose)="reset()" />
      }
      @default {}
    }
  `,
})
export class EtherTxStatusComponent {
  readonly state = signal<'none' | 'processing' | 'error' | 'success'>('none');
  readonly tx = signal<{ chainId: number; hash: string } | undefined>(undefined);
  readonly message = signal<string | undefined>(undefined);

  readonly hashUrl = computed(() => {
    const tx = this.tx();

    if (tx === undefined) {
      return undefined;
    }

    const chain = this.chainsService.getChain(tx.chainId);

    if (chain === undefined) {
      return undefined;
    }

    return `${chain.blockExplorerUrl}/tx/${tx.hash}`;
  });

  constructor(private chainsService: ChainsService) {}

  walletConfirmation() {
    this.state.set('processing');
    this.tx.set(undefined);
    this.message.set('Please confirm the transaction in your wallet.');
  }

  processing(chainId: number, hash: string) {
    this.state.set('processing');
    this.tx.set({ chainId, hash });
    this.message.set('Transaction submitted. Awaiting confirmations...');
  }

  error(e: unknown) {
    if (e instanceof UserRejectedRequestError) {
      this.reset();
      return;
    }

    this.state.set('error');

    if (typeof e === 'string') {
      this.message.set(e);
    } else if (e instanceof TransactionExecutionError) {
      this.message.set(e.details);
    } else if (e instanceof ContractFunctionExecutionError) {
      const cause = e.cause;
      if (cause instanceof ContractFunctionRevertedError) {
        const errorName = cause.data?.errorName;
        const errorMessage = CONTRACT_ERROR_MESSAGES[errorName as keyof typeof CONTRACT_ERROR_MESSAGES];

        if (errorMessage) {
          this.message.set(errorMessage);
        } else if (errorName) {
          this.message.set(`Transaction failed: ${errorName}`);
        } else if (cause.reason) {
          this.message.set(`Transaction failed: ${cause.reason}`);
        } else {
          this.message.set('Transaction failed. The contract reverted for an unknown reason.');
        }
      } if (cause instanceof TransactionExecutionError) {
        const txExecCause = cause.cause;

        if (txExecCause instanceof UserRejectedRequestError) {
          this.reset();
        } else {
          this.message.set(txExecCause.shortMessage);
        }
      } else {
        this.message.set(`${e.shortMessage}: ${e.details}`);
      }
    } else if (e instanceof Error) {
      this.message.set(`An application error occurred: ${e.message}`);
    } else {
      this.message.set('An unknown error occurred');
    }
  }

  success(msg: string) {
    this.state.set('success');
    this.message.set(msg);
  }

  reset() {
    this.state.set('none');
    this.tx.set(undefined);
    this.message.set(undefined);
  }
}

const CONTRACT_ERROR_MESSAGES = {
  ...TOKEN_CONTRACT_ERROR_MESSAGES,
  ...NFT_CONTRACT_ERROR_MESSAGES,
  ...TOKEN_SALE_CONTRACT_ERROR_MESSAGES,
} as const;
