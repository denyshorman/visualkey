import { computed, Injectable, Signal } from '@angular/core';
import { Hex, keccak256, TypedDataDomain, WriteContractReturnType } from 'viem';
import { WalletService } from './wallet.service';
import { readContract, readContracts, signTypedData, simulateContract, writeContract } from '@wagmi/core';
import { VisualKeyTokenContractService } from './token-contract.service';
import { privateKeyToAccount } from 'viem/accounts';
import { base, sepolia, hardhat } from 'viem/chains';
import { DEFAULT_MULTICALL_ADDRESS } from '../utils/eth-utils';

@Injectable({
  providedIn: 'root',
})
export class NftContractService {
  readonly nftMintTypes = {
    Mint: [
      { name: 'receiver', type: 'address' },
      { name: 'paymentAmount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'dataHash', type: 'bytes32' },
    ],
  };

  readonly contractAddress: Signal<Hex | undefined> = computed(() => {
    return getContractAddress(this.wallet.chainId());
  });

  readonly eip712Domain: Signal<TypedDataDomain | undefined> = computed(() => {
    const chainId = this.wallet.chainId();
    const contractAddress = this.contractAddress();

    if (chainId === undefined || contractAddress === undefined) {
      return undefined;
    }

    return {
      name: 'Visual Keys',
      version: '1',
      chainId: chainId,
      verifyingContract: contractAddress,
    };
  });

  constructor(
    private wallet: WalletService,
    private tokenContract: VisualKeyTokenContractService,
  ) {}

  async mint(paymentAmount: bigint, tokenIdentityPrivateKey: Hex): Promise<Hex | undefined> {
    const wagmiConfig = this.wallet.wagmiConfig;

    const userAddress = this.wallet.accountAddress()!;
    const nftNonce = this.nonces(userAddress);
    const tokenNonce = this.tokenContract.nonces(userAddress);
    const deadline = BigInt(Math.floor(Date.now() / 1000 + 3600));
    const data = '0x';

    const paymentSignature = await signTypedData(wagmiConfig, {
      domain: this.tokenContract.eip712Domain()!,
      types: this.tokenContract.permitTypes,
      primaryType: 'Permit',
      message: {
        owner: userAddress,
        spender: this.contractAddress()!,
        value: paymentAmount,
        nonce: await tokenNonce,
        deadline: deadline,
      },
    });

    const tokenSignature = await privateKeyToAccount(tokenIdentityPrivateKey).signTypedData({
      domain: this.eip712Domain()!,
      types: this.nftMintTypes,
      primaryType: 'Mint',
      message: {
        receiver: userAddress,
        paymentAmount: paymentAmount,
        deadline: deadline,
        nonce: await nftNonce,
        dataHash: keccak256(data),
      },
    });

    const { request } = await simulateContract(wagmiConfig, {
      address: this.contractAddress()!,
      functionName: 'mint',
      abi: nftAbi,
      args: [paymentAmount, deadline, paymentSignature, tokenSignature, data],
    });

    return await writeContract(wagmiConfig, request);
  }

  async rarity(tokenId: bigint): Promise<TokenRarity> {
    return (await readContract(this.wallet.wagmiConfig, {
      address: this.contractAddress()!,
      abi: nftAbi,
      functionName: 'rarity',
      args: [tokenId],
    })) as TokenRarity;
  }

  async increasePower(tokenId: bigint, amount: bigint): Promise<WriteContractReturnType> {
    const wagmiConfig = this.wallet.wagmiConfig;

    const deadline = BigInt(Math.floor(Date.now() / 1000 + 3600));
    const userAddress = this.wallet.accountAddress()!;
    const nonce = await this.tokenContract.nonces(userAddress);

    const signature = await signTypedData(wagmiConfig, {
      domain: this.tokenContract.eip712Domain()!,
      types: this.tokenContract.permitTypes,
      primaryType: 'Permit',
      message: {
        owner: userAddress,
        spender: this.contractAddress()!,
        value: amount,
        nonce: nonce,
        deadline: deadline,
      },
    });

    const { request } = await simulateContract(wagmiConfig, {
      address: this.contractAddress()!,
      functionName: 'increasePower',
      abi: nftAbi,
      args: [tokenId, amount, deadline, signature],
    });

    return writeContract(wagmiConfig, request);
  }

  async nonces(owner: Hex): Promise<bigint> {
    return (await readContract(this.wallet.wagmiConfig, {
      address: this.contractAddress()!,
      abi: nftAbi,
      functionName: 'nonces',
      args: [owner],
    })) as bigint;
  }

  async balanceOf(owner: Hex): Promise<bigint> {
    return (await readContract(this.wallet.wagmiConfig, {
      address: this.contractAddress()!,
      abi: nftAbi,
      functionName: 'balanceOf',
      args: [owner],
    })) as bigint;
  }

  async totalSupply(): Promise<bigint> {
    return (await readContract(this.wallet.wagmiConfig, {
      address: this.contractAddress()!,
      abi: nftAbi,
      functionName: 'totalSupply',
    })) as bigint;
  }

  async ownedTokens(owner: Hex, offset: number, limit: number): Promise<Token[]> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddress = this.contractAddress()!;

    const balance = Number(await this.balanceOf(owner));

    if (offset >= balance || balance === 0) {
      return [];
    }

    const numTokensToFetch = Math.min(limit, balance - offset);

    if (numTokensToFetch <= 0) {
      return [];
    }

    const tokenByIndexContracts = Array.from({ length: numTokensToFetch }, (_, i) => ({
      address: contractAddress,
      abi: nftAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [owner, BigInt(offset + i)],
    }));

    const tokenIds = (await readContracts(wagmiConfig, {
      contracts: tokenByIndexContracts,
      allowFailure: false,
      multicallAddress: DEFAULT_MULTICALL_ADDRESS,
    })) as bigint[];

    if (tokenIds.length === 0) {
      return [];
    }

    const rarityContracts = tokenIds.map(tokenId => ({
      address: contractAddress,
      abi: nftAbi,
      functionName: 'rarity',
      args: [tokenId],
    }));

    const rarities = (await readContracts(wagmiConfig, {
      contracts: rarityContracts,
      allowFailure: false,
      multicallAddress: DEFAULT_MULTICALL_ADDRESS,
    })) as unknown as TokenRarity[];

    return tokenIds.map((tokenId, index) => ({
      id: tokenId,
      owner,
      rarity: rarities[index],
    }));
  }

  async allTokens(offset: number, limit: number): Promise<Token[]> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress()!;

    const totalSupply = Number(await this.totalSupply());

    if (offset >= totalSupply || totalSupply === 0) {
      return [];
    }

    const numTokensToFetch = Math.min(limit, totalSupply - offset);

    if (numTokensToFetch <= 0) {
      return [];
    }

    const tokenByIndexContracts = Array.from({ length: numTokensToFetch }, (_, i) => ({
      address: contractAddr,
      abi: nftAbi,
      functionName: 'tokenByIndex',
      args: [BigInt(offset + i)],
    }));

    const tokenIds = (await readContracts(wagmiConfig, {
      contracts: tokenByIndexContracts,
      allowFailure: false,
      multicallAddress: DEFAULT_MULTICALL_ADDRESS,
    })) as bigint[];

    if (tokenIds.length === 0) {
      return [];
    }

    const detailsContracts = tokenIds.flatMap(tokenId => [
      {
        address: contractAddr,
        abi: nftAbi,
        functionName: 'ownerOf',
        args: [tokenId],
      },
      {
        address: contractAddr,
        abi: nftAbi,
        functionName: 'rarity',
        args: [tokenId],
      },
    ]);

    const ownerRarity = await readContracts(wagmiConfig, {
      contracts: detailsContracts,
      allowFailure: false,
      multicallAddress: DEFAULT_MULTICALL_ADDRESS,
    });

    return tokenIds.map((tokenId, index) => {
      const owner = ownerRarity[2 * index] as Hex;
      const rarity = ownerRarity[2 * index + 1] as unknown as TokenRarity;

      return { id: tokenId, owner, rarity };
    });
  }

  async getInfo(tokenId: bigint): Promise<Token> {
    const wagmiConfig = this.wallet.wagmiConfig;
    const contractAddr = this.contractAddress()!;

    const detailsContracts = [
      {
        address: contractAddr,
        abi: nftAbi,
        functionName: 'ownerOf',
        args: [tokenId],
      },
      {
        address: contractAddr,
        abi: nftAbi,
        functionName: 'rarity',
        args: [tokenId],
      },
    ];

    const ownerRarity = await readContracts(wagmiConfig, {
      contracts: detailsContracts,
      allowFailure: false,
      multicallAddress: DEFAULT_MULTICALL_ADDRESS,
    });

    return {
      id: tokenId,
      owner: ownerRarity[0] as Hex,
      rarity: ownerRarity[1] as unknown as TokenRarity,
    };
  }
}

export interface Token {
  id: bigint;
  owner: Hex;
  rarity: TokenRarity;
}

export interface TokenRarity {
  level: number;
  power: bigint;
  createdAt: bigint;
}

export const BASE_VISUAL_KEY_NFT_ADDRESS = '0x0f3DC158b6d7A0071df5a7A2340c509e6338d34a';
export const SEPOLIA_VISUAL_KEY_NFT_ADDRESS = '0x0f3DC158b6d7A0071df5a7A2340c509e6338d34a';
export const HARDHAT_VISUAL_KEY_NFT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const NFT_CONTRACT_ERROR_MESSAGES = {
  Unauthorized: 'You are not authorized to perform this action.',
  MintTokenExists: 'This NFT has already been minted.',
  MintZeroPaymentAmount: 'The power for a new NFT must be greater than zero.',
  PowerZeroIncrease: 'The amount to increase power by must be greater than zero.',
  ERC721NonexistentToken: 'The NFT you are trying to interact with does not exist.',
  ERC721IncorrectOwner: 'You are not the owner of this NFT, so you cannot perform this action.',
  ERC721InsufficientApproval: 'The contract is not approved to manage this NFT. You may need to grant approval in a separate transaction.',
  ERC721InvalidApprover: 'Only the owner of the NFT can grant this approval.',
  ERC721InvalidOperator: 'Approval cannot be granted to this address. Please check the operator address.',
  ERC721InvalidOwner: 'The NFT owner is an invalid address. Please contact support.',
  ERC721InvalidReceiver: 'NFTs cannot be sent to the zero address. Please check the recipient address.',
  ERC721InvalidSender: 'The sender address is invalid (zero address). This indicates a critical application error.',
  ERC721OutOfBoundsIndex: 'An attempt was made to access a token that does not exist at the specified index.',
  ERC2612ExpiredSignature: 'The approval signature has expired. Please try the transaction again to generate a new one.',
  ECDSAInvalidSignature: 'The cryptographic signature was invalid. This may be a temporary issue, please try your transaction again.',
  ECDSAInvalidSignatureLength: 'A cryptographic signature with an incorrect length was provided. This indicates an application error.',
  ECDSAInvalidSignatureS: "A cryptographic signature with an invalid 'S' value was provided. This indicates an application error.",
  HexLengthInsufficient: 'A provided hexadecimal value was not long enough. This may indicate an application error.',
} as const;

export const nftAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner_',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'contractUri_',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenUri_',
        type: 'string',
      },
      {
        internalType: 'contract Token',
        name: 'paymentToken',
        type: 'address',
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
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'ERC721IncorrectOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ERC721InsufficientApproval',
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
    name: 'ERC721InvalidApprover',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'ERC721InvalidOperator',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'ERC721InvalidOwner',
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
    name: 'ERC721InvalidReceiver',
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
    name: 'ERC721InvalidSender',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ERC721NonexistentToken',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'ERC721OutOfBoundsIndex',
    type: 'error',
  },
  {
    inputs: [],
    name: 'HexLengthInsufficient',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'MintTokenExists',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MintZeroPaymentAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PowerZeroIncrease',
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
        name: 'delegate',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
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
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'ContractURIUpdated',
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
    name: 'ERC20Withdrawn',
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
    name: 'ERC721Withdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'MetadataUpdate',
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
        name: 'tokenId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint8',
            name: 'level',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'power',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'createdAt',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Nft.TokenRarity',
        name: 'rarity',
        type: 'tuple',
      },
    ],
    name: 'NftMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newPower',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'NftPowerIncreased',
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
    inputs: [],
    name: 'TokenURIUpdated',
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
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
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
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
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
    name: 'contractURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
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
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'getApproved',
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
        name: 'tokenId',
        type: 'uint256',
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
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'increasePower',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'increasePower',
    outputs: [],
    stateMutability: 'nonpayable',
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
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'isApprovedForAll',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'paymentAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'paymentSignature',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'tokenSignature',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'data',
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
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
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
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'rarity',
    outputs: [
      {
        components: [
          {
            internalType: 'uint8',
            name: 'level',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'power',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'createdAt',
            type: 'uint256',
          },
        ],
        internalType: 'struct Nft.TokenRarity',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
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
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'safeTransferFrom',
    outputs: [],
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
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'contractUri',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenUri',
        type: 'string',
      },
    ],
    name: 'setContractAndTokenURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'contractUri',
        type: 'string',
      },
    ],
    name: 'setContractURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'tokenUri',
        type: 'string',
      },
    ],
    name: 'setTokenURI',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'tokenByIndex',
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
        name: 'owner_',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'tokenOfOwnerByIndex',
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
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
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
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [],
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
    ],
    name: 'withdrawErc721Token',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function getContractAddress(chainId: number | undefined): Hex | undefined {
  if (chainId === base.id) {
    return BASE_VISUAL_KEY_NFT_ADDRESS;
  } else if (chainId === sepolia.id) {
    return SEPOLIA_VISUAL_KEY_NFT_ADDRESS;
  } else if (chainId === hardhat.id) {
    return HARDHAT_VISUAL_KEY_NFT_ADDRESS;
  } else {
    return undefined;
  }
}
