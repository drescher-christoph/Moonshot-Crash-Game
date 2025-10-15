import type { HardhatUserConfig } from "hardhat/config";
import { configVariable } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import dotenv from "dotenv";
dotenv.config();

// configVariable("PRIVATE_KEY");
// configVariable("SEPOLIA_RPC_URL");
// configVariable("BASE_SEPOLIA_RPC_URL");

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 20000,
        details: {
          yul: true,
        },
      },
      viaIR: true,
    },
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    sepolia: {
      type: "http",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
      chainId: 11155111
    },
    baseSepolia: {
      type: "http",
      chainId: 84532,
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    }
  },
};

export default config;
