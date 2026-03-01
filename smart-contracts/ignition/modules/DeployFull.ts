import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys MockUnlinkPool first, then Web3VenmoShield pointing to it.
 * Use this for testnet where the real Unlink pool address is unknown.
 *
 * Run: npx hardhat ignition deploy ignition/modules/DeployFull.ts --network monadTestnet
 */
export default buildModule("DeployFullModule", (m) => {
  const mockPool = m.contract("MockUnlinkPool", []);
  const shield = m.contract("Web3VenmoShield", [mockPool]);
  return { mockPool, shield };
});
