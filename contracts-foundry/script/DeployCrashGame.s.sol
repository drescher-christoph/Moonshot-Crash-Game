// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

import { CrashGame } from "../src/CrashGame.sol";
import {Script, console2} from "forge-std/Script.sol";
import { HelperConfig } from "../script/HelperConfig.s.sol";

contract DeployCrashGame is Script {
    function run() external returns (CrashGame) {
        vm.startBroadcast();
        CrashGame game = new CrashGame(
            0xF87FF5BB6A8dD6F97307d61605D838ea7e22E3e6,
            0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c
        );
        vm.stopBroadcast();
        console2.log("Crash Game deployed to:", address(game));
        return game;
    }
}
