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
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Moonshot - On-chain Crash Game
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
 *
 * WORKFLOW:
 * 1. startRound() - Called by Chainlink Upkeep to start a new round. Sets the start time and increments the round ID. Users can now place bets for this round.
 * 2. placeBet() - Called by users to place a bet for the current round. Users specify the bet amount, target multiplier, and optional auto cashout multiplier.
 *
 */
contract CrashGame is IEntropyConsumer, ReentrancyGuard {
    enum RoundState {
        OPEN,
        LOCKED,
        RESOLVED
    }

    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 crashMultiplier; // 1.00x–∞
        RoundState state;
    }

    struct Bet {
        uint256 roundId;
        uint256 amount;
        uint256 targetMultiplier; // 1.00x–∞
        uint256 autoCashout;
        bool claimed;
    }

    address immutable i_owner;

    IEntropyV2 entropy;
    address public s_startRoundUpKeep;
    address public s_lockRoundUpkeep;
    uint256 public s_currentRoundId;
    mapping(uint256 => Round) public s_rounds;
    mapping(uint256 roundId => mapping(address player => Bet bet)) public s_bets;

    //////////////
    // Events
    //////////////
    event RoundStarted(uint256 roundId, uint256 startTime);
    event BetPlaced(
        uint256 roundId,
        address player,
        uint256 amount,
        uint256 targetMultiplier,
        uint256 autoCashout
    );
    event RoundLocked(uint256 indexed roundId, uint256 lockTime);
    event RoundCrashed(uint256 indexed roundId, uint256 crashTimeStamp, uint256 crashMultiplier);
    event FlipRequested(uint64 sequenceNumber);
    event FlipResult(uint64 sequenceNumber, bool isHeads);
    event UpkeepUpdated(address oldUpkeep, address newUpkeep);
    event WinningsClaimed(address indexed user, uint256 indexed roundId, uint256 payoutAmount);

    //////////////
    // Modifier
    //////////////

    modifier onlyAutomation() {
        require(msg.sender == s_startRoundUpKeep || msg.sender == s_lockRoundUpkeep, "Only an upkeep is allowed to call this method");
        _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == i_owner,
            "Only the owner is allowed to call this method"
        );
        _;
    }

    constructor(address _owner, address _entropy) {
        i_owner = _owner;
        entropy = IEntropyV2(_entropy);
    }

    function setOrUpdateStartUpkeepAddress(address _newUpKeep) public onlyOwner {
        address oldUpkeep = s_startRoundUpKeep;
        s_startRoundUpKeep = _newUpKeep;

        emit UpkeepUpdated(oldUpkeep, _newUpKeep);
    }

    function setOrUpdateLockUpkeepAddress(address _newUpKeep) public onlyOwner {
        address oldUpkeep = s_lockRoundUpkeep;
        s_lockRoundUpkeep = _newUpKeep;

        emit UpkeepUpdated(oldUpkeep, _newUpKeep);
    }

    ///////////////////////////
    // Pyth Entropy Functions
    //////////////////////////

    // This method is required by the IEntropyConsumer interface
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function requestRandom() internal {
        uint128 requestFee = entropy.getFeeV2();

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

        uint256 crashMultiplier = _calculateCrashResult(randomNumber);
        s_rounds[s_currentRoundId].crashMultiplier = crashMultiplier;
        s_rounds[s_currentRoundId].state = RoundState.RESOLVED;

        emit RoundCrashed(s_currentRoundId, block.timestamp, crashMultiplier);
    }

    ////////////////////////////////////
    // External Public Game Mechanics
    ///////////////////////////////////

    function startRound() external onlyAutomation {
        require(
            s_currentRoundId == 0 ||
                s_rounds[s_currentRoundId].state == RoundState.RESOLVED,
            "Previous round not resolved"
        );
        s_currentRoundId++;
        s_rounds[s_currentRoundId] = Round({
            id: s_currentRoundId,
            startTime: block.timestamp,
            crashMultiplier: 0,
            state: RoundState.OPEN
        });
        emit RoundStarted(s_currentRoundId, block.timestamp);
    }

    function lockRoundAndCallPyth() external onlyAutomation {
        require(
            s_rounds[s_currentRoundId].state == RoundState.OPEN,
            "Round not open"
        );
        s_rounds[s_currentRoundId].state = RoundState.LOCKED;

        emit RoundLocked(s_currentRoundId, block.timestamp);

        // Request random number from Pyth Entropy (private function)
        requestRandom();
    }

    function placeBet(
        uint256 amount,
        uint256 targetMultiplier,
        uint256 autoCashout
    ) external payable nonReentrant {
        uint256 pythFee = entropy.getFeeV2();
        require(msg.value >= amount + pythFee, "Not enough ETH sent");
        require(
            s_rounds[s_currentRoundId].state == RoundState.OPEN,
            "Round not open"
        );
        require(s_bets[s_currentRoundId][msg.sender].amount == 0, "already placed a bet on this round");
        require(amount > 0, "Bet amount must be greater than 0");
        require(
            targetMultiplier >= 100,
            "Target multiplier must be at least 1.00x"
        );
        require(
            autoCashout > amount,
            "Auto cashout must be greater than bet amount"
        );
        require(
            s_bets[s_currentRoundId][msg.sender].amount == 0,
            "Bet already placed for this round"
        );

        s_bets[s_currentRoundId][msg.sender] = Bet({
            roundId: s_currentRoundId,
            amount: amount,
            targetMultiplier: targetMultiplier,
            autoCashout: autoCashout,
            claimed: false
        });

        emit BetPlaced(
            s_currentRoundId,
            msg.sender,
            amount,
            targetMultiplier,
            autoCashout
        );
    }

    function _calculateCrashResult(bytes32 _randomBytes) internal pure returns (uint256) {
        uint256 randomInt = uint256(_randomBytes);
        if (randomInt % 33 == 0) {
            return 100;
        }

        uint256 e = 2 ** 52;
        uint256 h = randomInt % e;

        uint256 numerator = (100 * e) - h;
        uint256 denominator = e - h;

        uint256 crash = (numerator * 1e2) / denominator; // 2 Dezimalstellen
        return crash / 100;
    }

    function claimWinnings() external nonReentrant {
        require(s_rounds[s_currentRoundId].state == RoundState.RESOLVED, "Current Round is not resolved yet");
        require(s_bets[s_currentRoundId][msg.sender].targetMultiplier < s_rounds[s_currentRoundId].crashMultiplier, "Not claimable");

        uint256 claim = s_bets[s_currentRoundId][msg.sender].amount * (s_bets[s_currentRoundId][msg.sender].targetMultiplier / 100);
        s_bets[s_currentRoundId][msg.sender].claimed = true;

        (bool success, ) = msg.sender.call{value: claim}("");
        require(success, "Payout failed!");

        emit WinningsClaimed(msg.sender, s_currentRoundId, claim);
        
    } 

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(i_owner).transfer(balance);
    }

    ////////////////////////////////////
    // Internal Game Mechanics
    ///////////////////////////////////

    function getCurrentRoundState() public view returns (RoundState) {
        return s_rounds[s_currentRoundId].state;
    }

    function getCrashMultiplier() public view returns (uint256) {
        return s_rounds[s_currentRoundId].crashMultiplier;
    }

    function getCurrentUserBet(address _user) public view returns (Bet memory) {
        require(s_bets[s_currentRoundId][_user].amount != 0, "This user has not placed a bet on this round");
        return s_bets[s_currentRoundId][_user];
    }

    function getLastRoundResult() public view returns (Round memory) {
        return s_rounds[s_currentRoundId-1];
    }

}
