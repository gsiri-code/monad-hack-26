import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from the repo root (one level above optimo/)
dotenv.config({ path: resolve(import.meta.dirname, "../.env") });

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
