// SPDX-License-Identifier: MIT

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

pragma solidity ^0.8.28;

import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

/**
 * @title CrashGame (working title)
 * @author Christoph Drescher
 * @notice This game is designed to allow users to bet on a multiplier that increases over time and crashes at a random point.
 * The random crash point is determined using the Pyth Entropy oracle, ensuring fairness and unpredictability.
 * Players can place bets on the multiplier and choose to cash out at any time before the crash (planned - currently 
 * they can set a AutoCashout which will then be claimable if the AutoCashOut is smaller than the actual multiplier).
 * If they cash out before the crash, they win their bet amount multiplied by the current multiplier.
 * If they fail to cash out before the crash, they lose their bet amount.
 * Besides the random crash point, the game is fully on-chain and transparent to ensure a fair gaming experience.
 * The contract is designed to be gas efficient and scalable, allowing for a large number of players to participate simultaneously.
 * The game runs automatically in rounds, with each round starting 30-60 seconds after the previous one ends.
 * Players can join a round by placing a bet before the round starts.
 * The automatic round management is managed by a Chainlink Upkeep (automation) which calls the necessary functions to start a new round and resolve the previous one.
 */
contract CrashGame is IEntropyConsumer {

    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 crashMultiplier; // 1.00x–∞
        bool resolved;
    }

    struct Bet {
        uint256 roundId;
        uint256 amount;
        uint256 targetMultiplier; // 1.00x–∞
        uint256 autoCashout;
        bool claimed;
    }

    IEntropyV2 entropy;

    event FlipRequested(uint64 sequenceNumber);
    event FlipResult(uint64 sequenceNumber, bool isHeads);

    constructor(address _entropy) {
        entropy = IEntropyV2(_entropy);
    }

    // This method is required by the IEntropyConsumer interface
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function request() external payable {
        // get the required fee
        uint128 requestFee = entropy.getFeeV2();
        // check if the user has sent enough fees
        if (msg.value < requestFee) revert("not enough fees");

        // pay the fees and request a random number from entropy
        uint64 sequenceNumber = entropy.requestV2{value: requestFee}();

        // emit event
        emit FlipRequested(sequenceNumber);
    }

    function entropyCallback(
        uint64 sequenceNumber,
        // If your app uses multiple providers, you can use this argument
        // to distinguish which one is calling the app back. This app only
        // uses one provider so this argument is not used.
        address _providerAddress,
        bytes32 randomNumber
    ) internal override {
        bool isHeads = uint256(randomNumber) % 2 == 0;

        emit FlipResult(sequenceNumber, isHeads);
    }
}
