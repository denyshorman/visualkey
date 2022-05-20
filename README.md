# Visual Private Key And Address Generator For Ethereum-Compatible Blockchains

A convenient tool to visually generate a private key and address with automatic balance and activity check across several EVM-compatible blockchains.

![image](https://user-images.githubusercontent.com/18450062/169537786-8c3decf1-6d57-41b6-bc64-8aedbf5b1bd5.png)

## Motivation

To receive or send tokens in a blockchain, one needs to have an address.  
The next reasonable question for a new user is how to get this address?  
The answer to this question is both simple and difficult.  
Simply put, an address in Ethereum is a regular number.  
10, 256, 1122233, etc - these numbers are valid addresses in Ethereum.  
The next step is to pick up any random number and ask your friend to send some tokens to this number (address).  
Sounds simple, doesn't it?  
When you receive some tokens at a newly generated address, the next step is to spend them.  
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

[Visual key](https://visualkey.link) tool allows you to visually pick up a private key number and also visually see how this number is transformed to an address.  
The tool instantly shows balances for a selected address.  
Since the tool allows you to generate all possible private keys and addresses, there is a chance that you will find an active address.  
You have to be very, very lucky to find an address with a large balance. It's a free lottery. Anyone can play it for free. In other words, zero investment - unlimited income.

## How does it work?

The tool displays the square (private key) and the rectangle (address).  
The private key consists of 256 small squares, and the address consists of 160 squares.  
Below the square and rectangle, the private key and address are displayed as numbers in a hexadecimal format.  

A number can be formatted in a different formats but the most popular are
 - [binary](https://en.wikipedia.org/wiki/Binary_number) - 0b10111
 - [decimal](https://en.wikipedia.org/wiki/Decimal) - 23
 - [hex](https://en.wikipedia.org/wiki/Hexadecimal) - 0x17

These are different formats of the number 23.

The visual part of the private key and address is built with small squares that have two colors.  
These two colors of a square represent a binary number 0 or 1.  
A private key with 256 squares represents a binary number that can be converted to a decimal or a hexadecimal number.  
The same is true for an address.

## Features

- Set a private key to the lowest (red button) or the largest number (green button)
- Generate a random private key (hold the random button to automate the random key generation)
- Left and Right rotation of a private key (hold the button to automate rotation)
- Load custom private key in a binary, decimal, or hexadecimal formats
- Move the mouse over a private key square to change the state of a small square ([bit](https://en.wikipedia.org/wiki/Bit))
- Change the mouse over strategy
  - Clear - always clears a bit (0 -> 0, 1 -> 0)
  - Flip - changes the state of a bit to the opposite (0 -> 1, 1 -> 0)
  - Set - always sets a bit (0 -> 1, 1 -> 1)
- Disable state change of a bit when the mouse is moving over the square. Click on any bit to change its state instead.
- Click at "Only active addresses" button to see only active addresses in the grid. Address is active only when it has a positive balance or transaction count in any blockchain.
- Change a balance formatting between Ether and Wei
- Clear the table
- Shrink columns to fit the screen
- Auto size columns to fit content
- Filter any column to find any specific value (e.g. to find an address with a specific prefix)
- Sort the table by any column

## Contributions

Found an issue or have a proposal?  
Feel free to open a ticket or submit a pull request!
