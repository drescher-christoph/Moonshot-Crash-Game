// SPDX-License-Identifier: MIT

pragma solidity >=0.8.19 <0.9.0;

import {MockEntropy} from "../test/mocks/MockEntropy.sol";

import {Script, console} from "forge-std/Script.sol";

contract HelperConfig is Script {

    struct NetworkConfig {
        address entropy;
        address upKeep;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    // Local network state variables
    NetworkConfig public activeNetworkConfig;
    mapping(uint256 chainId => NetworkConfig) public networkConfigs;

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaEthConfig();
        } else if (block.chainid == 84532) {
            activeNetworkConfig = getBaseSepoliaEthConfig();
        } else if (block.chainid == 31337) {
            activeNetworkConfig = createPythMockforLocalTests();
        } else {
            console.log("CHAIN ID: ", block.chainid);
            revert("Unsupported network");
        }

        console.log("CHAIN ID: ", block.chainid);
    }

    function getSepoliaEthConfig() public pure returns (NetworkConfig memory sepoliaNetworkConfig) {
        sepoliaNetworkConfig = NetworkConfig({
            entropy: 0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344,
            upKeep: 0x1234567890455555555555555555555555555555
        });
    }

    function getBaseSepoliaEthConfig() public pure returns (NetworkConfig memory baseSepoliaNetworkConfig) {
        baseSepoliaNetworkConfig = NetworkConfig({
            entropy: 0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c,
            upKeep: 0x1234567890455555555555555555555555555555
        });
    }

    function createPythMockforLocalTests() public pure returns (NetworkConfig memory localNetworkConfig) {
        MockEntropy entropyMock = MockEntropy(0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344);
        localNetworkConfig = NetworkConfig({
            entropy: address(entropyMock),
            upKeep: 0x1234567890455555555555555555555555555555
        });
    }

}