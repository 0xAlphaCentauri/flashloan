// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

interface IReceiver {
    function receiveTokens(address tokenAddress, uint256 amount) external;
}

contract FlashLoan {
    Token public token;
    uint256 public poolBalance;

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        token = Token(tokenAddress);
    }

    function depositTokens(uint256 _amount) external {
        require(_amount > 0, "Must deposit some funds");
        token.transferFrom(msg.sender, address(this), _amount);
        poolBalance += _amount;
    }

    function flashLoan(uint256 _borrowAmount) external {
        require(_borrowAmount > 0, 'Must borrow at least one token');

        uint256 balanceBefore = token.balanceOf(address(this));
        require(balanceBefore >= _borrowAmount, 'Not enough tokens in pool');

        // Ensured by the protocol via the 'depositTokens' functions
        assert(poolBalance == balanceBefore);
                

        // Send tokens to receiver
        token.transfer(msg.sender, _borrowAmount);
        // Use loan, get paid back 
        IReceiver(msg.sender).receiveTokens(address(token), _borrowAmount);
        // Ensure loan paid back
        uint256 balanceAfter = token.balanceOf(address(this));
        require(balanceAfter >= balanceBefore, "Flash loan hasn't been paid back");
    }
}