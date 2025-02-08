// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TravelToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public tokenPrice = 0.001 ether;

    constructor() ERC20("Travel Token", "TRVL") Ownable(msg.sender) {
       _mint(msg.sender, 1000000 * 10 ** decimals()); // il vas me mettre les tockens dans mon smart walette . 
    }

    function buyTokens() external payable nonReentrant {//  pour que le client achete les travel   apartir des bnb 
        require(msg.value > 0, "Send BNB to buy tokens");
        uint256 tokenAmount = (msg.value * 10 ** decimals()) / tokenPrice;
        require(balanceOf(address(this)) >= tokenAmount, "Not enough tokens available");
        _transfer(address(this), msg.sender, tokenAmount);
    }

    function withdrawBNB() external onlyOwner { // recuperer les bnb et les transferer dans mon whalette 
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        payable(owner()).transfer(balance);
    }
}