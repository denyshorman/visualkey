import { Injectable } from '@angular/core';
import { Hex, WriteContractReturnType } from 'viem';
import { WalletService } from './wallet.service';
import { Config, readContract, simulateContract, writeContract } from '@wagmi/core';
import { base, sepolia, hardhat } from 'viem/chains';

@Injectable({
  providedIn: 'root',
})
export class VisualKeyTokenSaleContractService {
  private readonly wagmiConfig: Config;

  constructor(wallet: WalletService) {
    this.wagmiConfig = wallet.wagmiConfig;
  }

  getContractAddress(chainId: number): Hex | undefined {
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

  getContractAddressOrThrow(chainId: number): Hex {
    const contractAddress = this.getContractAddress(chainId);

    if (contractAddress === undefined) {
      throw new Error(`No contract address found for the chain ID ${chainId}`);
    }

    return contractAddress;
  }

  async getOwner(chainId: number): Promise<Hex> {
    return await readContract(this.wagmiConfig, {
      chainId,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'owner',
    });
  }

  async buyTokens(chainId: number, ethAmount: bigint, caller: Hex): Promise<WriteContractReturnType> {
    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: caller,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'buyTokens',
      value: ethAmount,
    });

    return writeContract(this.wagmiConfig, request);
  }

  async getPrice(chainId: number): Promise<bigint> {
    return await readContract(this.wagmiConfig, {
      chainId,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'getPrice',
      blockTag: 'latest',
    });
  }

  async setPrice(chainId: number, newPriceInWei: bigint, owner: Hex): Promise<WriteContractReturnType> {
    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'setPrice',
      args: [newPriceInWei],
    });

    return writeContract(this.wagmiConfig, request);
  }

  async transferOwnership(chainId: number, owner: Hex, newOwner: Hex): Promise<WriteContractReturnType> {
    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'transferOwnership',
      args: [newOwner],
    });

    return writeContract(this.wagmiConfig, request);
  }

  async withdrawETH(chainId: number, owner: Hex): Promise<WriteContractReturnType> {
    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'withdrawETH',
    });

    return writeContract(this.wagmiConfig, request);
  }

  async withdrawERC20(chainId: number, tokenContractAddress: Hex, owner: Hex, amount: bigint): Promise<WriteContractReturnType> {
    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenSaleAbi,
      functionName: 'withdrawERC20',
      args: [tokenContractAddress, amount],
    });

    return writeContract(this.wagmiConfig, request);
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
