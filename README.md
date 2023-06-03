# Visual Private Key And Address Generator For Ethereum-Compatible Blockchains

A convenient tool to visually generate a private key and address with automatic balance and activity check across several EVM-compatible blockchains.

![image](https://user-images.githubusercontent.com/18450062/169537786-8c3decf1-6d57-41b6-bc64-8aedbf5b1bd5.png)

## Motivation

To receive or send tokens in a blockchain, one needs to have an address.  
But how to get this address?  
The answer to this question is both simple and difficult.  
Simply put, an address in Ethereum is a regular number.  
10, 256, 1122233, etc - these numbers are valid addresses in Ethereum.  
The next reasonable step for a newcomer would be to pick up any random number (address) to receive tokens.  
Sounds simple, doesn't it?

When you receive some tokens at a newly generated address, one of the options would be to spend them.  
And here come some difficulties.  
If you could simply pick up any random number as an address and share it with anyone, why couldn't someone else do it?  
You need to somehow protect your address from being used by others.  
And here is the trick: you need to select a random number and transform it in a special way to get another number (address).  
That's all.  

For example, you selected a number 10, applied some transformation to it, and got another number - 123.  
Now you have the address 123, and you can share it with others.  

When the time comes to spend your tokens from the address 123, you have to prove that you know the number, which after the transformation will be equal to 123.  
And that's why it is necessary to keep your number 10 a secret.  
This secret number is called a private key.  

One can ask: is it possible to apply the inverse transformation to the address 123 to get the private key 10?  
The answer is - it depends on the function. The idea here is to select a function that will not allow you to easily get a private key from an address.

Hence, to spend and receive tokens, you need to pick up some number (private key) and transform it to get another number (address).  
Share the address with others to receive tokens, and keep your private key a secret to spend tokens.

## How can the tool be useful?

[Visual Key](https://visualkey.link) tool allows you to visually pick up a private key number and also visually see how this number is transformed to an address.  
The tool instantly shows balances for a selected address.  
Since it is possible to generate all possible private keys and addresses, there is a chance that you will find an active address.  
You have to be very, very lucky to find an address with a large balance. It can be treated as a free lottery.  

## How does it work?

The tool displays the square (private key) and the rectangle (address).  
The private key consists of 256 small squares, and the address consists of 160 squares.  
Below the square and rectangle, the private key and address are displayed as numbers in a hexadecimal format.  

A number can be formatted in a different formats but the most popular are
 - [binary](https://en.wikipedia.org/wiki/Binary_number) - 0b10111
 - [decimal](https://en.wikipedia.org/wiki/Decimal) - 23
 - [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) - 0x17

These are different formats of the number 23.

The visual part of the private key and address is built with small squares that have two colors.  
These two colors of a square represent a binary number 0 or 1.  
A private key with 256 squares represents a binary number that can be converted to a decimal or a hexadecimal number.  
The same is true for an address.

## NFT

Visual Key has the possibility to create an NFT from a private key number.  
It basically means that you can pick a number that has a certain unique representation and take ownership of it.

### Visual Key NFT Features:

 - NFT is unique across blockchains.  
If an NFT is minted in Ethereum, it cannot be minted in other blockchains.
 - NFT can be transferred from one blockchain to another.  
If an NFT is minted in Ethereum, it can be transferred to another blockchain.
 - NFT can be minted in test blockchains.  
This is useful for users who would like to try out NFT services using free test tokens.

### Why create a Visual Key NFT?

 - The desire to own something unique and scarce in the digital world.
 - Expression of identity, personality, or taste through an NFT.
 - Investment in a rare and potentially valuable asset that may appreciate over time.
 - Speculation on the future value of the NFT and the potential to sell it for a profit.
 - An option for gifting or as a keepsake.
 - Enjoyment collecting and trading NFTs.
 - A unique way to support the project.

### How to get started?

- Visit the [Visual Key](https://visualkey.link) website
- Create a unique image by interacting with the square or upload your own
- Click the NFT button
- Select a chain where you would like to mint a token and click Mint
- Connect a wallet and confirm the transaction
- Wait for the confirmation
- Enjoy your new NFT!

### Links

[Visual Key API Source Code](https://github.com/denyshorman/visualkey-api)  
[Visual Key Smart Contract Source Code](https://github.com/denyshorman/visualkey-smartcontracts)

Deployed Smart Contracts:

[Polygon](https://polygonscan.com/address/0x1544b6Ba8Ff0C7B5059491A61E321061377052Bf)  
[BNB Chain](https://bscscan.com/address/0x6dD422EE124204a4A9c38189580266dcD55bC648)

[Ethereum Sepolia](https://sepolia.etherscan.io/address/0xa9Ab50860bbADA427d1844A63cC7a1A7E7D038Cc)  
[Polygon Mumbai](https://mumbai.polygonscan.com/address/0xA76001F57649F00d92EB66A8BEBf8ffBe2CC1810)
[BNB Chain Testnet](https://testnet.bscscan.com/address/0x7b6b3067e5876a529Aab2b320BA21e7911151a1e)
