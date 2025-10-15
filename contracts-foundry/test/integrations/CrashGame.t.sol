// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

import { CrashGame } from "../../src/CrashGame.sol";
import { Test, console } from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import { HelperConfig } from "../../script/HelperConfig.s.sol";
import { MockEntropy } from "../mocks/MockEntropy.sol";

event RoundLocked(uint256 roundId, uint256 lockTime);

contract CrashGameUnitTest is Test {

    CrashGame crashGame;
    IEntropyV2 entropy;
    HelperConfig helperConfig;

    address owner = address(0);
    address Upkeep = address(1);
    address player = address(2);
    address player2 = address(3);

    function setUp() public {
        helperConfig = new HelperConfig();
        (address entropyAddress, address upKeep) = helperConfig.activeNetworkConfig();
        crashGame = new CrashGame(owner, entropyAddress);

        entropy = IEntropyV2(entropyAddress);
       
        vm.deal(Upkeep, 2 ether);
        vm.deal(player, 2 ether);
    }

    function testGetEntropyFee() public view {
        uint256 entropyFee = entropy.getFeeV2();
        console.log("Entropy Fee: ", entropyFee);
        assertTrue(entropyFee > 0, "Error fetching entropy fee");
    }

    function testStartNewRoundAndPlaceBet() public {
        vm.startPrank(Upkeep);
        crashGame.startRound();
        vm.stopPrank();

        vm.startPrank(player);
        uint256 entropyFee = entropy.getFeeV2();
        console.log("Entropy Fee: ", entropyFee);
        crashGame.placeBet{value: 0.1 ether + entropyFee}(0.1 ether, 200, 0.2 ether);
        vm.stopPrank();

        (, uint256 amount,,,) = crashGame.s_bets(1, player);
        console.log("User bet amount: ", amount);
        assertEq(amount, 0.1 ether, "Not the correct bet amount");
    }

    function testLockRoundAndCallPythEntropy() public {
        vm.startPrank(Upkeep);
        crashGame.startRound();
        vm.stopPrank();

        vm.startPrank(player);
        uint256 entropyFee = entropy.getFeeV2();
        console.log("Entropy Fee: ", entropyFee);
        crashGame.placeBet{value: 0.1 ether + entropyFee}(0.1 ether, 200, 0.2 ether);
        vm.stopPrank();

        vm.startPrank(player2);
        uint256 entropyFee2 = entropy.getFeeV2();
        console.log("Entropy Fee: ", entropyFee);
        crashGame.placeBet{value: 0.1 ether + entropyFee}(0.1 ether, 200, 0.2 ether);
        vm.stopPrank();

        vm.warp(30);

        vm.startPrank(Upkeep);
        vm.expectEmit();
        emit RoundLocked(1, block.timestamp);
        crashGame.lockRoundAndCallPyth();
        vm.stopPrank();
    }

}