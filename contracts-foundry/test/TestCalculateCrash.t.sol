// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CrashGame} from "../../src/CrashGame.sol";
import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

contract TestCalulateCrash is Test {
    bytes32[] public randomValues;

    function setUp() public {
        // Beispielhafte, stark verteilte bytes32-Werte
        randomValues.push(
            bytes32(
                0x7a4f3f9a54cbb31212bcae19f06f8a2bdfdd4f7e49a1bce0b99c9df22eea1b5f
            )
        );
        randomValues.push(
            bytes32(
                0x4c8d6a91b72fe3d2ab3d4a98a12359e45c1bb71f59a2a97e43c6bca2f8b6de84
            )
        );
        randomValues.push(
            bytes32(
                0xa19f5b47b9d33d015ffcb8b6e211db5a8b0a44b4c7d3f62a87fbd5ef2b4e9e10
            )
        );
        randomValues.push(
            bytes32(
                0x2d8ae47cbbf930b95f6418f1e341e9a93e12a9c7b3e74db681d5c84a9b0b0f8a
            )
        );
        randomValues.push(
            bytes32(
                0xc1e5b6d48ab3e1fda4cb8d4a22919a2e42d03a3d6cf492f84be69d2931a5b981
            )
        );
        randomValues.push(
            bytes32(
                0xe5c3a8dfb4c84b9b0a2d2f94e91f27c48b61c2a1e4a9dbda2e91bcbd76a7f492
            )
        );
        randomValues.push(
            bytes32(
                0x19a2e9c84bd7b5a3c1f2e84b9d2a47c1e0b5a2f3d6e9b4a2c8f9b7e4c2a1f5b6
            )
        );
    }

    function getAll() external view returns (bytes32[] memory) {
        return randomValues;
    }

    function calculateCrashResult(
        bytes32 _randomBytes
    ) public pure returns (uint256) {
        uint256 randomInt = uint256(_randomBytes);
        console.log("Random Int: ", randomInt);
        if (randomInt % 33 == 0) {
            console.log("Dividible ");
            return 100;
        }

        uint256 e = 2 ** 52;
        console.log("Max value e: ", e);
        uint256 h = randomInt % e;
        console.log("h:           ", h);

        uint256 numerator = (100 * e) - h;
        console.log("Numerator:", numerator);
        uint256 denominator = e - h;
        console.log("Denominator: ", denominator);

        uint256 crash = (numerator * 1e2) / denominator; // 2 Dezimalstellen
        return crash / 100;
    }

    function testCrashOutput() public {
        for (uint256 i = 0; i < randomValues.length; i++) {
            uint256 crash = calculateCrashResult(randomValues[i]);
            console.log("Crash Result: ", crash);
            console.log("------------------------");
        }
    }
}
