// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

import { CrashGame } from "../contracts/CrashGame.sol";
import { Test, console } from "forge-std/Test.sol";
import { HelperConfig } from "../scripts/HelperConfig.s.sol";

contract CrashGameTest is Test {

    CrashGame crashGame;
    IEntropyV2 entropy;
    HelperConfig helperConfig;

    function setUp() public {
        helperConfig = new HelperConfig();
        (address entropyAddress, address upKeep) = helperConfig.activeNetworkConfig();
        crashGame = new CrashGame(entropyAddress);
        entropy = IEntropyV2(entropyAddress);
    }

    function testGetEntropyFee() public view {
        uint256 entropyFee = entropy.getFeeV2();
        console.log("Entropy Fee: ", entropyFee);
        assertTrue(entropyFee > 0, "Error fetching entropy fee");
    }

}