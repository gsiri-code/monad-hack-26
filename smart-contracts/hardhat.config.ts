import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from the repo root (one level above brian/)
dotenv.config({ path: resolve(import.meta.dirname, "../.env") });

// Note: Counter.t.sol (Foundry tests) lives in test/ so Hardhat won't compile it.
// Hardhat v3 removed TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS from the public API.

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      type: "http",
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: [
        ...(process.env.MONAD_PRIVATE_KEY ? [process.env.MONAD_PRIVATE_KEY] : []),
        ...(process.env.SENDER_PRIVATE_KEY ? [process.env.SENDER_PRIVATE_KEY] : []),
      ].filter(Boolean),
    },
  },
});
