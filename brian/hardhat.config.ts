import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from the repo root (one level above brian/)
dotenv.config({ path: resolve(import.meta.dirname, "../.env") });

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
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
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    monadTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://testnet-rpc.monad.xyz",
      accounts: process.env.MONAD_PRIVATE_KEY ? [process.env.MONAD_PRIVATE_KEY] : [],
    },
  },
});