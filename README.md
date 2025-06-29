# Visual Private Key And Address Generator For Ethereum-Compatible Blockchains

A convenient tool to visually generate a private key and address with automatic balance and activity check across several EVM-compatible blockchains.

![image](https://user-images.githubusercontent.com/18450062/169537786-8c3decf1-6d57-41b6-bc64-8aedbf5b1bd5.png)

## The Challenge of Blockchain Addresses

To send or receive assets on a blockchain, you need an address. But where does this address come from? Every address is mathematically derived from a unique **private key**.

Think of the **private key** as a secret password that gives you full control over the funds at your address. The **address**, which you can share publicly, is like a personal mailbox. Anyone can put tokens *into* the address, but only the person with the private key can open it and take things out.

This relationship is a one-way street: it's easy to calculate the address from the private key, but impossible to go the other way. This lets you safely share your address without exposing the secret key that controls your assets.

## How can the tool be useful?

 - **It's Educational:** See how a random number (your private key) is visually represented and how it relates to its corresponding address.
 - **It's an Explorer:** Instantly check any generated address for activity across blockchains.
 - **It's a Free Lottery:** Since it is possible to generate every possible private key, there is a theoretical chance you could discover a pre-existing, active address with a balance.

## How does it work?

The tool visualizes a key pair as two blocks: a square for the private key and a rectangle for the address.

 - **Private Key:** A 256-bit number, shown as a 16x16 grid of squares.
 - **Address:** A 160-bit number, shown as a 10x16 grid of squares.

Each small square's color corresponds to a binary digit (`0` or `1`). While computers "think" in binary, humans often use other number systems for readability. For example, the number 23 can be written in several formats:

 - [Binary](https://en.wikipedia.org/wiki/Binary_number) - `0b10111`
 - [Decimal](https://en.wikipedia.org/wiki/Decimal) - `23`
 - [Hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) - `0x17`

The tool also displays the standard hexadecimal format (`0x...`) that you see in most wallets and block explorers.

---

# The VisualKey Ecosystem

VisualKey is more than just a tool — it's a complete ecosystem for creating, claiming, and empowering unique digital identities on EVM-compatible blockchains. It seamlessly combines a visual key generator with a dedicated utility token and a novel NFT collection.

## The Core Components

1. **The Visualizer Tool:** The entry point to the ecosystem. An intuitive, visual interface for generating private keys and checking their on-chain activity instantly.
2. **VisualKey Token (VKEY):** A feature-rich ERC20 utility token that powers the entire ecosystem. VKEY is used to mint NFTs, enhance their attributes, and participates in deflationary mechanics.
3. **Visual Keys (VKEYNFT):** A unique ERC721 NFT collection where each NFT's ID *is* the actual Ethereum address it represents, allowing you to truly own your discovery as a verifiable digital artifact.

## How the Ecosystem Works

The VisualKey components create a powerful, self-reinforcing value cycle:

1. **Discover:** Use the **Visualizer Tool** to generate or discover a unique Ethereum address.
2. **Claim & Empower:** Use **VKEY Tokens** to mint your address into a **Visual Key NFT**, setting its initial "Power" based on the VKEY committed.
3. **Create Scarcity:** The VKEY used for minting is **permanently burned**, linking the growth of the NFT collection to the increasing scarcity of the VKEY token.

## Key Features

### Visual Keys (VKEYNFT)

- **Your Address, Your NFT:** The NFT's ID is the numerical value of the Ethereum address it represents.
- **Provable Ownership Minting:** Requires a cryptographic signature from the address's private key to mint.
- **Dynamic Rarity System:** Rarity is determined by on-chain attributes:
  - **Level:** Based on the number of leading zero bits in the address. Higher levels are exponentially rarer.
  - **Power:** Determined by the amount of VKEY committed and burned to mint or enhance the NFT.
  - **Creation Time:** An immutable timestamp of its birth on the blockchain.

### VisualKey Token (VKEY)

- **Deflationary by Design:** VKEY is burned when minting/powering up NFTs and through flash loan fees.
- **Controlled Supply:** Features a managed function for periodic, optional minting to sustainably fund growth.
- **Advanced Features:** Includes EIP-2612 (gasless approvals), EIP-3156 (flash loans), and ERC173 (secure ownership).
