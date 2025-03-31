import { Injectable } from '@angular/core';
import { Chain, ChainRegion, ChainsConfigService } from '../config/chains-config.service';
import { defer, from, Observable, range } from 'rxjs';
import {
  ContractFunctionExecutionError,
  createPublicClient,
  fallback,
  FallbackTransportConfig,
  Hex,
  http,
  parseAbi,
  PublicClient,
  TransactionReceipt,
} from 'viem';
import visualKeyContractAbi from '../config/nft-abi.json';
import { defaultIfEmpty, filter, find, mergeMap } from 'rxjs/operators';
import { getContractError } from '../utils/ViemUtils';

@Injectable({
  providedIn: 'root',
})
export class VisualKeyContractService {
  private contracts: VkContract[];
  readonly abi = parseAbi(visualKeyContractAbi);

  constructor(private chainsConfigService: ChainsConfigService) {
    this.contracts = chainsConfigService.nfts.flatMap(nft => {
      const transports = nft.chain.rpcUrls.map(url => {
        return http(url, { retryCount: 0, timeout: 4000 });
      });

      const transportConfig: FallbackTransportConfig = {
        rank: false,
        retryCount: 0,
      };

      const client = createPublicClient({
        transport: fallback(transports, transportConfig),
      });

      return nft.contracts.map(contractAddress => {
        return {
          chain: nft.chain,
          address: contractAddress,
          client,
        } as VkContract;
      });
    });
  }

  totalSupply(region: ChainRegion): Observable<TotalSupply> {
    return from(this.contracts).pipe(
      filter(contract => contract.chain.region === region),
      mergeMap(contract => {
        return defer(async () => {
          const totalSupply = await contract.client.readContract({
            address: contract.address as Hex,
            functionName: 'totalSupply',
            abi: this.abi,
          });

          return {
            chainId: contract.chain.chainId,
            contract: contract.address,
            totalSupply,
          } as TotalSupply;
        });
      }),
    );
  }

  balanceOf(owner: string, region: ChainRegion): Observable<Balance> {
    return from(this.contracts).pipe(
      filter(contract => contract.chain.region === region),
      mergeMap(contract => {
        return defer(async () => {
          const balance = await contract.client.readContract({
            address: contract.address as Hex,
            functionName: 'balanceOf',
            args: [owner],
            abi: this.abi,
          });

          return {
            chainId: contract.chain.chainId,
            contract: contract.address,
            balance,
          } as Balance;
        });
      }),
    );
  }

  ownerOf(token: bigint, region: ChainRegion): Observable<Owner | undefined> {
    return from(this.contracts).pipe(
      filter(contract => contract.chain.region === region),
      mergeMap(contract => {
        return defer(async () => {
          try {
            const owner = await contract.client.readContract({
              address: contract.address as Hex,
              functionName: 'ownerOf',
              args: [token],
              abi: this.abi,
            });

            return {
              chainId: contract.chain.chainId,
              contract: contract.address,
              owner,
            } as Owner;
          } catch (err: any) {
            if (err instanceof ContractFunctionExecutionError) {
              const error = getContractError(err, this.abi);

              if (error !== undefined && error.errorName === 'TokenDoesNotExist') {
                return undefined;
              } else {
                throw err;
              }
            } else {
              throw err;
            }
          }
        });
      }),
      find(owner => owner !== undefined),
      defaultIfEmpty(undefined),
    );
  }

  ownerOfTokenInContract(chainId: number, contract: string, token: bigint): Observable<string | undefined> {
    const vkContract = this.contracts.find(it => it.chain.chainId === chainId && it.address === contract);

    if (vkContract === undefined) {
      throw new Error('Contract not found');
    }

    return defer(async () => {
      const owner = await vkContract.client.readContract({
        address: vkContract.address as Hex,
        functionName: 'ownerOf',
        args: [token],
        abi: this.abi,
      });

      return owner as string;
    });
  }

  tokensByRegion(region: ChainRegion): Observable<TokenContractChain> {
    return this.totalSupply(region).pipe(
      mergeMap(chainContractSupply => {
        const contract = this.contracts.find(
          contract =>
            contract.chain.chainId === chainContractSupply.chainId && contract.address === chainContractSupply.contract,
        );

        if (contract === undefined) {
          throw new Error('Contract not found');
        }

        return range(0, Number(chainContractSupply.totalSupply)).pipe(
          mergeMap(index => {
            return defer(async () => {
              const token = await contract.client.readContract({
                address: contract.address as Hex,
                functionName: 'tokenByIndex',
                args: [index],
                abi: this.abi,
              });

              return {
                chainId: contract.chain.chainId,
                contract: contract.address,
                token,
              } as TokenContractChain;
            });
          }),
        );
      }),
    );
  }

  tokensByOwnerAndRegion(owner: string, region: ChainRegion): Observable<TokenContractChain> {
    return this.balanceOf(owner, region).pipe(
      mergeMap(chainContractBalance => {
        const contract = this.contracts.find(
          contract =>
            contract.chain.chainId === chainContractBalance.chainId &&
            contract.address === chainContractBalance.contract,
        );

        if (contract === undefined) {
          throw new Error('Contract not found');
        }

        return range(0, Number(chainContractBalance.balance)).pipe(
          mergeMap(index => {
            return defer(async () => {
              const token = await contract.client.readContract({
                address: contract.address as Hex,
                functionName: 'tokenOfOwnerByIndex',
                args: [owner, index],
                abi: this.abi,
              });

              return {
                chainId: contract.chain.chainId,
                contract: contract.address,
                token,
              } as TokenContractChain;
            });
          }),
        );
      }),
    );
  }

  transactionReceipt(chainId: number, contract: string, hash: string): Promise<TransactionReceipt> {
    const vkContract = this.contracts.find(it => it.chain.chainId === chainId && it.address === contract);

    if (vkContract === undefined) {
      throw new Error('Contract not found');
    }

    return vkContract.client.waitForTransactionReceipt({
      hash: hash as Hex,
      confirmations: 1,
      pollingInterval: 3000,
      onReplaced: replacement => console.log(replacement),
    });
  }
}

//#region Models
export interface TokenContractChain {
  chainId: number;
  contract: string;
  token: bigint;
}

export interface TotalSupply {
  chainId: number;
  contract: string;
  totalSupply: bigint;
}

export interface Balance {
  chainId: number;
  contract: string;
  balance: bigint;
}

export interface Owner {
  chainId: number;
  contract: string;
  owner: string;
}

interface VkContract {
  chain: Chain;
  address: string;
  client: PublicClient;
}
//#endregion
