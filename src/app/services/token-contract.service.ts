import { Injectable } from '@angular/core';
import { Hex, TypedDataDomain, WriteContractReturnType } from 'viem';
import { WalletService } from './wallet.service';
import { Config, readContract, signTypedData, simulateContract, writeContract } from '@wagmi/core';
import { base, sepolia, hardhat } from 'viem/chains';

@Injectable({
  providedIn: 'root',
})
export class VisualKeyTokenContractService {
  readonly permitTypes = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  readonly mintTypes = {
    Mint: [
      { name: 'receiver', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  private readonly wagmiConfig: Config;

  constructor(wallet: WalletService) {
    this.wagmiConfig = wallet.wagmiConfig;
  }

  getContractAddress(chainId: number): Hex | undefined {
    return getContractAddress(chainId);
  }

  getContractAddressOrThrow(chainId: number): Hex {
    return getContractAddressOrThrow(chainId);
  }

  getEip712Domain(chainId: number): TypedDataDomain {
    return {
      name: 'VisualKey Token',
      version: '1',
      chainId: chainId,
      verifyingContract: this.getContractAddressOrThrow(chainId),
    };
  }

  getMintAmount(chainId: number): bigint | undefined {
    if (chainId === base.id) {
      return 1_048_576n * 10n ** 18n;
    } else if (chainId === sepolia.id) {
      return 1_073_741_824n * 10n ** 18n;
    } else if (chainId === hardhat.id) {
      return 1_048_576n * 10n ** 18n;
    } else {
      return undefined;
    }
  }

  getMintInterval(chainId: number): bigint | undefined {
    if (chainId === base.id) {
      return 16n * 24n * 60n * 60n; // 16 days in seconds;
    } else if (chainId === sepolia.id) {
      return 4n * 24n * 60n * 60n; // 4 days in seconds;
    } else if (chainId === hardhat.id) {
      return 16n * 24n * 60n * 60n; // 16 days in seconds;
    } else {
      return undefined;
    }
  }

  getMintWindow(chainId: number): bigint | undefined {
    if (chainId === base.id || chainId === sepolia.id || chainId === hardhat.id) {
      return 24n * 60n * 60n; // 24 hours in seconds
    } else {
      return undefined;
    }
  }

  calcNextMintTimestamp(chainId: number, lastMintTimestamp: bigint): bigint | undefined {
    const mintInterval = this.getMintInterval(chainId);
    const mintWindow = this.getMintWindow(chainId);

    if (mintInterval === undefined || mintWindow === undefined) {
      return undefined;
    }

    if (lastMintTimestamp === 0n) {
      return undefined;
    }

    const now = BigInt(Math.floor(Date.now() / 1000));

    if (now < lastMintTimestamp + mintInterval) {
      return lastMintTimestamp + mintInterval;
    }

    const numberOfIntervalsElapsed = (now - lastMintTimestamp) / mintInterval;
    const currentPeriodStartTs = lastMintTimestamp + numberOfIntervalsElapsed * mintInterval;
    const currentMintWindowEndTs = currentPeriodStartTs + mintWindow;

    if (now <= currentMintWindowEndTs) {
      return currentPeriodStartTs;
    } else {
      return currentPeriodStartTs + mintInterval;
    }
  }

  async balanceOf(chainId: number, account: Hex): Promise<bigint> {
    return await readContract(this.wagmiConfig, {
      chainId,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenAbi,
      functionName: 'balanceOf',
      args: [account],
      blockTag: 'latest',
    });
  }

  async nonces(chainId: number, account: Hex): Promise<bigint> {
    return await readContract(this.wagmiConfig, {
      chainId,
      address: this.getContractAddressOrThrow(chainId),
      abi: tokenAbi,
      functionName: 'nonces',
      args: [account],
      blockTag: 'latest',
    });
  }

  async mint(chainId: number, owner: Hex, recipient: Hex): Promise<WriteContractReturnType> {
    const contractAddr = this.getContractAddressOrThrow(chainId);

    const nonce = await this.nonces(chainId, owner);
    const deadline = BigInt(Math.floor(Date.now() / 1000 + 3600));

    const signature = await signTypedData(this.wagmiConfig, {
      account: owner,
      domain: this.getEip712Domain(chainId),
      types: this.mintTypes,
      primaryType: 'Mint',
      message: {
        receiver: recipient,
        nonce: nonce,
        deadline: deadline,
      },
    });

    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: contractAddr,
      abi: tokenAbi,
      functionName: 'mint',
      args: [recipient, deadline, signature],
    });

    return writeContract(this.wagmiConfig, request);
  }

  async disableMinting(chainId: number, owner: Hex): Promise<WriteContractReturnType> {
    const contractAddr = this.getContractAddressOrThrow(chainId);

    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: contractAddr,
      abi: tokenAbi,
      functionName: 'disableMinting',
    });

    return writeContract(this.wagmiConfig, request);
  }

  async burn(chainId: number, amount: bigint, caller: Hex): Promise<WriteContractReturnType> {
    const contractAddr = this.getContractAddressOrThrow(chainId);

    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: caller,
      address: contractAddr,
      abi: tokenAbi,
      functionName: 'burn',
      args: [amount],
    });

    return writeContract(this.wagmiConfig, request);
  }

  async initiateOwnershipTransfer(chainId: number, owner: Hex, newOwner: Hex): Promise<WriteContractReturnType> {
    const contractAddr = this.getContractAddressOrThrow(chainId);

    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: contractAddr,
      abi: tokenAbi,
      functionName: 'transferOwnership',
      args: [newOwner],
    });

    return writeContract(this.wagmiConfig, request);
  }

  async cancelOwnershipTransfer(chainId: number, owner: Hex): Promise<WriteContractReturnType> {
    const contractAddr = this.getContractAddressOrThrow(chainId);

    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: owner,
      address: contractAddr,
      abi: tokenAbi,
      functionName: 'cancelOwnershipTransfer',
    });

    return writeContract(this.wagmiConfig, request);
  }

  async completeOwnershipTransfer(chainId: number, caller: Hex): Promise<WriteContractReturnType> {
    const contractAddr = this.getContractAddressOrThrow(chainId);

    const { request } = await simulateContract(this.wagmiConfig, {
      chainId,
      account: caller,
      address: contractAddr,
      abi: tokenAbi,
      functionName: 'completeOwnershipTransfer',
    });

    return writeContract(this.wagmiConfig, request);
  }
}

export const BASE_VISUAL_KEY_TOKEN_ADDRESS = '0xD022E363C212dBeE3D70DB68593B24f3F0BB3B04';
export const SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS = '0xD022E363C212dBeE3D70DB68593B24f3F0BB3B04';
export const HARDHAT_VISUAL_KEY_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const TOKEN_CONTRACT_ERROR_MESSAGES = {
  MintingDisabled: 'Minting new tokens is currently disabled by the contract owner.',
  MintingNotAllowed: "It's not the right time to mint new tokens. Please check back later.",
  MintingWindowMissed: 'The time window for minting in this period has already passed.',
  ERC20InsufficientBalance: "You don't have enough tokens in your wallet to perform this transaction.",
  ERC20InsufficientAllowance: 'This contract is not approved to spend the required amount of your tokens. Please grant approval and try again.',
  ERC20InvalidApprover: 'The address trying to grant approval is invalid (zero address).',
  ERC20InvalidReceiver: 'The recipient address is invalid (zero address). Tokens cannot be sent here.',
  ERC20InvalidSender: 'The sender address is invalid (zero address). This indicates a critical application error.',
  ERC20InvalidSpender: 'The spender address is invalid (zero address).',
  ERC1363ApproveFailed: 'The approval operation within a transfer failed.',
  ERC1363InvalidReceiver: 'The recipient contract does not support receiving tokens this way.',
  ERC1363InvalidSpender: 'The spender address for this transfer type is invalid.',
  ERC1363TransferFailed: 'The token transfer within a combined call failed.',
  ERC1363TransferFromFailed: 'The token transfer (from a third party) within a combined call failed.',
  ERC2612ExpiredSignature: 'The signature for this transaction has expired. Please try the transaction again.',
  ERC2612InvalidSigner: 'The signature was not provided by the token owner.',
  ECDSAInvalidSignature: 'The cryptographic signature provided was invalid. Please try your transaction again.',
  ECDSAInvalidSignatureLength: 'A cryptographic signature with an incorrect length was provided. This is likely an application error.',
  ECDSAInvalidSignatureS: "A cryptographic signature with an invalid 'S' value was provided. This is likely an application error.",
  ERC3156ExceededMaxLoan: 'The requested flash loan amount is larger than the available balance.',
  ERC3156InvalidReceiver: 'The receiver for the flash loan is not a valid contract.',
  ERC3156UnsupportedToken: 'This token is not supported for flash loans.',
  InvalidFlashLoanFee: 'The specified flash loan fee is invalid.',
  Unauthorized: 'You are not authorized to perform this action.',
} as const;

export const tokenAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'tokensReceiver_',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'flashFee_',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'ECDSAInvalidSignature',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
    ],
    name: 'ECDSAInvalidSignatureLength',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'ECDSAInvalidSignatureS',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ERC1363ApproveFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
    ],
    name: 'ERC1363InvalidReceiver',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'ERC1363InvalidSpender',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ERC1363TransferFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ERC1363TransferFromFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'allowance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'needed',
        type: 'uint256',
      },
    ],
    name: 'ERC20InsufficientAllowance',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'needed',
        type: 'uint256',
      },
    ],
    name: 'ERC20InsufficientBalance',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'approver',
        type: 'address',
      },
    ],
    name: 'ERC20InvalidApprover',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
    ],
    name: 'ERC20InvalidReceiver',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'ERC20InvalidSender',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'ERC20InvalidSpender',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
    ],
    name: 'ERC2612ExpiredSignature',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'signer',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'ERC2612InvalidSigner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'maxLoan',
        type: 'uint256',
      },
    ],
    name: 'ERC3156ExceededMaxLoan',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
    ],
    name: 'ERC3156InvalidReceiver',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'ERC3156UnsupportedToken',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxFee',
        type: 'uint256',
      },
    ],
    name: 'InvalidFlashLoanFee',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MintingDisabled',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'nextMintPeriodStart',
        type: 'uint256',
      },
    ],
    name: 'MintingNotAllowed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'mintWindowEnd',
        type: 'uint256',
      },
    ],
    name: 'MintingWindowMissed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
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
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Erc721Withdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newFee',
        type: 'uint256',
      },
    ],
    name: 'FlashFeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'Minted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'MintingCeased',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
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
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'OwnershipTransferInitiated',
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
        indexed: true,
        internalType: 'address',
        name: 'from',
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
    name: 'Transfer',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
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
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approveAndCall',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'approveAndCall',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'burnFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cancelOwnershipTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'completeOwnershipTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'disableMinting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      {
        internalType: 'bytes1',
        name: 'fields',
        type: 'bytes1',
      },
      {
        internalType: 'string',
        name: 'name_',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'version',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'verifyingContract',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'salt',
        type: 'bytes32',
      },
      {
        internalType: 'uint256[]',
        name: 'extensions',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'flashFee',
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
    inputs: [
      {
        internalType: 'contract IERC3156FlashBorrower',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'flashLoan',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastMintTimestamp',
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
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'maxFlashLoan',
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
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintingDisabled',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner_',
        type: 'address',
      },
    ],
    name: 'nonces',
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
        internalType: 'address',
        name: 'owner_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'setFlashFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
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
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferAndCall',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'transferAndCall',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'transferFromAndCall',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFromAndCall',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
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
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'contract IERC20',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'withdrawErc20Token',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'contract IERC721',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'withdrawErc721Token',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function getContractAddress(chainId: number): Hex | undefined {
  if (chainId === base.id) {
    return BASE_VISUAL_KEY_TOKEN_ADDRESS;
  } else if (chainId === sepolia.id) {
    return SEPOLIA_VISUAL_KEY_TOKEN_ADDRESS;
  } else if (chainId === hardhat.id) {
    return HARDHAT_VISUAL_KEY_TOKEN_ADDRESS;
  } else {
    return undefined;
  }
}

export function getContractAddressOrThrow(chainId: number): Hex {
  const contractAddress = getContractAddress(chainId);

  if (contractAddress === undefined) {
    throw new Error(`No contract address found for the chain ID ${chainId}`);
  }

  return contractAddress;
}
