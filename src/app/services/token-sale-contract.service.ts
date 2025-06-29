import { computed, Injectable, Signal } from '@angular/core';
import { Hex, WriteContractReturnType } from 'viem';
import { WalletService } from './wallet.service';
import { readContract, simulateContract, writeContract } from '@wagmi/core';
import { base, sepolia, hardhat } from 'viem/chains';

@Injectable({
  providedIn: 'root',
})
export class VisualKeyTokenSaleContractService {
  readonly contractAddress: Signal<Hex | undefined> = computed(() => {
    return getTokenSaleAddress(this.wallet.chainId());
  });

  constructor(private wallet: WalletService) {}

  async getOwner(): Promise<Hex | undefined> {
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    return (await readContract(this.wallet.wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'owner',
    })) as Hex;
  }

  async buyTokens(ethAmount: bigint): Promise<WriteContractReturnType | undefined> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    const { request } = await simulateContract(wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'buyTokens',
      value: ethAmount,
    });

    return writeContract(wagmiConfig, request);
  }

  async getPrice(): Promise<bigint | undefined> {
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    return (await readContract(this.wallet.wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'getPrice',
    })) as bigint;
  }

  async setPrice(newPriceInWei: bigint): Promise<WriteContractReturnType | undefined> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    const { request } = await simulateContract(wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'setPrice',
      args: [newPriceInWei],
    });

    return writeContract(wagmiConfig, request);
  }

  async transferOwnership(newOwner: Hex): Promise<WriteContractReturnType | undefined> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    const { request } = await simulateContract(wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'transferOwnership',
      args: [newOwner],
    });

    return writeContract(wagmiConfig, request);
  }

  async withdrawETH(): Promise<WriteContractReturnType | undefined> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    const { request } = await simulateContract(wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'withdrawETH',
    });

    return writeContract(wagmiConfig, request);
  }

  async withdrawERC20(tokenContractAddress: Hex, amount: bigint): Promise<WriteContractReturnType | undefined> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress();
    if (!contractAddr) return undefined;

    const { request } = await simulateContract(wagmiConfig, {
      address: contractAddr,
      abi: tokenSaleAbi,
      functionName: 'withdrawERC20',
      args: [tokenContractAddress, amount],
    });

    return writeContract(wagmiConfig, request);
  }
}

export function getTokenSaleAddress(chainId: number | undefined): Hex | undefined {
  if (chainId === base.id) {
    return BASE_TOKEN_SALE_ADDRESS;
  } else if (chainId === sepolia.id) {
    return SEPOLIA_TOKEN_SALE_ADDRESS;
  } else if (chainId === hardhat.id) {
    return HARDHAT_TOKEN_SALE_ADDRESS;
  } else {
    return undefined;
  }
}

export const BASE_TOKEN_SALE_ADDRESS = '0x6dBFbF12B0ea65B1334428833D542b96B87976F0';
export const SEPOLIA_TOKEN_SALE_ADDRESS = '0x6dBFbF12B0ea65B1334428833D542b96B87976F0';
export const HARDHAT_TOKEN_SALE_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export const TOKEN_SALE_CONTRACT_ERROR_MESSAGES = {
  InsufficientEthSent: 'The amount of ETH sent is not enough to complete this purchase.',
  InsufficientTokensInContract: 'The sale contract does not have enough tokens to fulfill this order.',
  TransferFailed: 'The token transfer failed. The contract may be out of tokens or there was an unexpected issue.',
  Unauthorized: 'You are not authorized to perform this action.',
  ZeroAddress: 'The address provided cannot be zero.',
  ZeroAmount: 'The purchase amount must be greater than zero.',
} as const;

export const tokenSaleAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'initialWeiPerVkey',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InsufficientEthSent',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'available',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'required',
        type: 'uint256',
      },
    ],
    name: 'InsufficientTokensInContract',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAmount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Erc20Withdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'EthWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newWeiPerVkey',
        type: 'uint256',
      },
    ],
    name: 'PriceUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'purchaser',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'ethAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokenAmount',
        type: 'uint256',
      },
    ],
    name: 'TokensPurchased',
    type: 'event',
  },
  {
    inputs: [],
    name: 'buyTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newWeiPerVkey',
        type: 'uint256',
      },
    ],
    name: 'setPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenContractAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'withdrawERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawETH',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const;
